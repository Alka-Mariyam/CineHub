from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class Location(models.Model):
    country = models.CharField(max_length=100, default="India")
    state = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    town = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        unique_together = ('country', 'state', 'city', 'town')

    def __str__(self):
        parts = [self.town, self.city, self.state, self.country]
        return ", ".join([p for p in parts if p])


class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('Customer', 'Customer'),
        ('Manager', 'Manager'),
        ('Admin', 'Admin'),
    )

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    current_location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Customer')
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email

    @property
    def total_reward_points(self):
        aggregate = self.reward_history.aggregate(total=models.Sum('points'))
        return aggregate['total'] or 0

    @property
    def loyalty_tier(self):
        pts = self.total_reward_points
        if pts >= 1500:
            return 'Platinum'
        elif pts >= 500:
            return 'Gold'
        else:
            return 'Silver'

    @property
    def points_to_next_tier(self):
        pts = self.total_reward_points
        if pts < 500:
            return 500 - pts
        elif pts < 1500:
            return 1500 - pts
        else:
            return 0

    @property
    def lifetime_points(self):
        aggregate = self.reward_history.filter(points__gt=0).aggregate(total=models.Sum('points'))
        return aggregate['total'] or 0


class RewardPoints(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reward_history')
    points = models.IntegerField()  # Positive for earn, negative for redeem
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.points} pts ({self.description})"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"
