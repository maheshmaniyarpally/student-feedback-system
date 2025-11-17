from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Avg, Count
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Feedback, Mentor, Class
from .serializers import FeedbackSerializer, MentorSerializer, ClassSerializer


@api_view(['GET'])
def feedback_list(request):
    mentor = request.GET.get('mentor', '')
    feedbacks = Feedback.objects.all()
    
    if mentor:
        feedbacks = feedbacks.filter(mentor=mentor)
    
    serializer = FeedbackSerializer(feedbacks, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def feedback_create(request):
    """Create feedback - exempt from CSRF for API"""
    # Override reviewer_name with logged-in username if user is authenticated
    data = request.data.copy()
    if request.user.is_authenticated:
        data['reviewer_name'] = request.user.username
    
    serializer = FeedbackSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        
        # Auto-create mentor if doesn't exist
        mentor_name = serializer.validated_data.get('mentor')
        if mentor_name:
            Mentor.objects.get_or_create(name=mentor_name)
        
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)
    return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['DELETE'])
@permission_classes([AllowAny])
def feedback_detail(request, pk):
    """Delete feedback - exempt from CSRF for API"""
    try:
        feedback = Feedback.objects.get(pk=pk)
        
        # Check if user is authenticated and if the feedback belongs to them
        if not request.user.is_authenticated:
            return Response({
                'success': False, 
                'error': 'You must be logged in to delete feedback'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if the feedback's reviewer_name matches the logged-in user's username
        if feedback.reviewer_name.lower() != request.user.username.lower():
            return Response({
                'success': False, 
                'error': 'You can only delete your own feedback'
            }, status=status.HTTP_403_FORBIDDEN)
        
        feedback.delete()
        return Response({'success': True}, status=status.HTTP_200_OK)
    except Feedback.DoesNotExist:
        return Response({'success': False, 'error': 'Feedback not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def stats(request):
    total_feedback = Feedback.objects.count()
    
    avg_rating_result = Feedback.objects.aggregate(avg=Avg('rating'))
    avg_rating = round(avg_rating_result['avg'], 1) if avg_rating_result['avg'] else 0
    
    active_mentors = Mentor.objects.count()
    
    return Response({
        'totalFeedback': total_feedback,
        'avgRating': avg_rating,
        'activeMentors': active_mentors
    })


@api_view(['GET'])
def mentors_list(request):
    mentors = Mentor.objects.all().values_list('name', flat=True)
    return Response(list(mentors))


@api_view(['GET'])
def classes_list(request):
    # Get unique mentors and create class entries
    mentors = Mentor.objects.all()
    classes = []
    
    for mentor in mentors:
        feedbacks = Feedback.objects.filter(mentor=mentor.name)
        if feedbacks.exists():
            class_data = {
                'id': mentor.id,
                'class_name': f"{mentor.name}'s Class",
                'description': f"Feedback session for {mentor.name}",
                'mentor': mentor.name,
                'student_count': feedbacks.values('reviewer_name').distinct().count(),
                'avg_rating': round(feedbacks.aggregate(avg=Avg('rating'))['avg'] or 0, 1),
                'feedback_count': feedbacks.count()
            }
            classes.append(class_data)
    
    return Response(classes)


@api_view(['POST'])
def signup(request):
    """User registration endpoint"""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    email = request.data.get('email', '').strip()
    
    if not username or not password:
        return Response({
            'success': False,
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({
            'success': False,
            'error': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email if email else ''
        )
        return Response({
            'success': True,
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def login_view(request):
    """User login endpoint"""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    
    if not username or not password:
        return Response({
            'success': False,
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        return Response({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'success': False,
            'error': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)


@csrf_exempt
def logout_view(request):
    """User logout endpoint - using function view to avoid CSRF issues"""
    from django.http import JsonResponse
    try:
        if request.user.is_authenticated:
            logout(request)
        return JsonResponse({
            'success': True,
            'message': 'Logout successful'
        }, status=200)
    except Exception as e:
        # Even if there's an error, try to logout and return success
        try:
            logout(request)
        except:
            pass
        return JsonResponse({
            'success': True,  # Still return success to allow redirect
            'message': 'Logout completed'
        }, status=200)


@api_view(['GET'])
def check_auth(request):
    """Check if user is authenticated"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'authenticated': False
        }, status=status.HTTP_200_OK)

