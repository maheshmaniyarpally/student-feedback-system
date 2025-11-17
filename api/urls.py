from django.urls import path
from . import views

urlpatterns = [
    path('feedback', views.feedback_list, name='feedback-list'),
    path('feedback/create', views.feedback_create, name='feedback-create'),
    path('feedback/<int:pk>', views.feedback_detail, name='feedback-detail'),
    path('stats', views.stats, name='stats'),
    path('mentors', views.mentors_list, name='mentors-list'),
    path('classes', views.classes_list, name='classes-list'),
    path('auth/signup', views.signup, name='signup'),
    path('auth/login', views.login_view, name='login'),
    path('auth/logout', views.logout_view, name='logout'),
    path('auth/check', views.check_auth, name='check-auth'),
]

