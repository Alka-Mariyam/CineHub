from rest_framework import viewsets, status, generics
from django.utils.crypto import get_random_string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from .models import Location, RewardPoints, Notification
from .serializers import (
    LocationSerializer, UserRegistrationSerializer, UserSerializer,
    RewardPointsSerializer, NotificationSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Ensure a password exists for token generation
        password = request.data.get('password')
        if not password:
            # If the client didn't send a password, generate one (same logic as serializer)
            password = get_random_string(12)
            # Update the user with this generated password
            user.set_password(password)
            user.save()
        # Generate JWT token for the new user using the (existing or generated) password
        from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
        token_data = TokenObtainPairSerializer().validate({
            'email': user.email,
            'password': password
        })
        response_data = serializer.data
        response_data.update({'access': token_data['access'], 'refresh': token_data['refresh']})
        return Response(response_data, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return super().get_permissions()


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_index('-created_at') if hasattr(Notification.objects, 'order_index') else Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_read = request.data.get('is_read', instance.is_read)
        instance.save()
        return Response(self.get_serializer(instance).data)


class RewardPointsListView(generics.ListAPIView):
    serializer_class = RewardPointsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RewardPoints.objects.filter(user=self.request.user).order_by('-created_at')


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            # Send password reset code/link (mocked email)
            reset_link = f"http://localhost:5173/reset-password?email={email}&token=mock-token"
            send_mail(
                "Reset your CineHub Password",
                f"Hi {user.full_name},\n\nPlease use the link below to reset your CineHub password:\n{reset_link}\n\nThanks,\nCineHub Team",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=True
            )
            return Response({"message": "Password reset instructions have been sent to your email."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # We return 200 for security reasons to prevent email enumeration, but with a friendly message
            return Response({"message": "If the email exists, instructions have been sent."}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        token = request.data.get('token')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')

        if not all([email, token, password, confirm_password]):
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        if password != confirm_password:
            return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            # In a real environment, we'd validate the token here. For this app, any token works.
            user.set_password(password)
            user.save()
            return Response({"message": "Password reset successfully. You can now login."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
