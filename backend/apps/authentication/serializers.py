from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Location, RewardPoints, Notification
from django.utils.crypto import get_random_string

User = get_user_model()

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'country', 'state', 'city', 'town']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    email = serializers.EmailField(required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    
    phone_number = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(write_only=True, required=False, default='Customer')
    theatre_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    theatre_city = serializers.CharField(write_only=True, required=False, allow_blank=True)
    theatre_state = serializers.CharField(write_only=True, required=False, allow_blank=True)
    theatre_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    theatre_contact = serializers.CharField(write_only=True, required=False, allow_blank=True)
    theatre_facilities = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone_number', 'password', 'confirm_password', 'role',
                  'theatre_name', 'theatre_city', 'theatre_state', 'theatre_address', 'theatre_contact', 'theatre_facilities']

    def validate(self, attrs):
        # No password match validation (permissive registration)
        return attrs

    def create(self, validated_data):
        confirm_password = validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)
        if not password:
            password = get_random_string(12)
        role = validated_data.pop('role', 'Customer')
        
        theatre_name = validated_data.pop('theatre_name', '')
        theatre_city = validated_data.pop('theatre_city', '')
        theatre_state = validated_data.pop('theatre_state', '')
        theatre_address = validated_data.pop('theatre_address', '')
        theatre_contact = validated_data.pop('theatre_contact', '')
        theatre_facilities = validated_data.pop('theatre_facilities', '')

        # Managers are deactivated by default until Admin approves
        is_active = True
        if role == 'Manager':
            is_active = False

        user = User.objects.create_user(
            email=validated_data.get('email') or f"user_{get_random_string(6)}@example.com",
            full_name=validated_data.get('full_name') or f"User{get_random_string(4)}",
            phone_number=validated_data.get('phone_number'),
            password=password,
            role=role,
            is_active=is_active
        )
        
        if role == 'Manager' and theatre_name:
            # Find or create Location
            location, _ = Location.objects.get_or_create(
                country="India",
                state=theatre_state or "Maharashtra",
                city=theatre_city or "Mumbai",
                defaults={"town": ""}
            )
            # Create Theatre in Pending status
            from apps.movies.models import Theatre
            Theatre.objects.create(
                name=theatre_name,
                location=location,
                brand="Partner",
                status="Pending",
                address=theatre_address,
                contact_details=theatre_contact,
                facilities=theatre_facilities,
                manager=user
            )

        # Give 100 welcome reward points
        RewardPoints.objects.create(
            user=user,
            points=100,
            description="Welcome Bonus Points"
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    current_location = LocationSerializer(read_only=True)
    current_location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), source='current_location', write_only=True, required=False, allow_null=True
    )
    total_reward_points = serializers.IntegerField(read_only=True)
    loyalty_tier = serializers.CharField(read_only=True)
    points_to_next_tier = serializers.IntegerField(read_only=True)
    lifetime_points = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone_number', 'current_location', 'current_location_id', 'total_reward_points', 'loyalty_tier', 'points_to_next_tier', 'lifetime_points', 'is_staff', 'role', 'is_active']
        read_only_fields = ['email']


class RewardPointsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardPoints
        fields = ['id', 'points', 'description', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at']
