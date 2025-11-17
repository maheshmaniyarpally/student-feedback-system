from rest_framework import serializers
from .models import Feedback, Mentor, Class


class FeedbackSerializer(serializers.ModelSerializer):
    date_submitted = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = Feedback
        fields = ['id', 'reviewer_name', 'peer_name', 'mentor', 'rating', 'comments', 'date_submitted']
        read_only_fields = ['id', 'date_submitted']


class MentorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mentor
        fields = ['id', 'name']


class ClassSerializer(serializers.ModelSerializer):
    student_count = serializers.ReadOnlyField()
    avg_rating = serializers.ReadOnlyField()
    feedback_count = serializers.ReadOnlyField()

    class Meta:
        model = Class
        fields = ['id', 'class_name', 'description', 'mentor', 'student_count', 'avg_rating', 'feedback_count']

