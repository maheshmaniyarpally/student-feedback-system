from django.db import models
from django.utils import timezone


class Mentor(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Feedback(models.Model):
    reviewer_name = models.CharField(max_length=100)
    peer_name = models.CharField(max_length=100, blank=True, null=True)
    mentor = models.CharField(max_length=100)
    rating = models.IntegerField()
    comments = models.TextField()
    date_submitted = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_submitted']

    def __str__(self):
        return f"{self.reviewer_name} - {self.mentor} ({self.rating}/10)"


class Class(models.Model):
    class_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    mentor = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.class_name

    @property
    def student_count(self):
        return Feedback.objects.filter(mentor=self.mentor).values('reviewer_name').distinct().count()

    @property
    def avg_rating(self):
        ratings = Feedback.objects.filter(mentor=self.mentor).values_list('rating', flat=True)
        if ratings:
            return sum(ratings) / len(ratings)
        return None

    @property
    def feedback_count(self):
        return Feedback.objects.filter(mentor=self.mentor).count()

