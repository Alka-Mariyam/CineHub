from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Seat, Booking, Reservation, Payment, GiftCard, GroupBooking, GroupBookingMember
from apps.movies.serializers import ShowSerializer
from apps.authentication.serializers import UserSerializer

User = get_user_model()

class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ['id', 'show', 'row_label', 'column_number', 'status', 'reserved_by', 'reserved_until']


class BookingSerializer(serializers.ModelSerializer):
    show_detail = ShowSerializer(source='show', read_only=True)
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'user', 'user_detail', 'show', 'show_detail', 'seats_display', 'total_price', 'status', 'booking_id', 'qr_code_url', 'created_at']
        read_only_fields = ['booking_id', 'qr_code_url']


class ReservationSerializer(serializers.ModelSerializer):
    show_detail = ShowSerializer(source='show', read_only=True)
    booking_detail = BookingSerializer(source='booking', read_only=True)

    class Meta:
        model = Reservation
        fields = ['id', 'user', 'show', 'show_detail', 'booking', 'booking_detail', 'seats_display', 'expires_at', 'status', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'booking', 'method', 'status', 'amount', 'transaction_id', 'created_at']
        read_only_fields = ['transaction_id']


class GiftCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCard
        fields = ['id', 'code', 'value', 'is_redeemed', 'redeemed_by', 'redeemed_at']
        read_only_fields = ['code']


class GroupBookingMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupBookingMember
        fields = ['id', 'group_booking', 'user', 'name', 'seats_display', 'status']


class GroupBookingSerializer(serializers.ModelSerializer):
    members = GroupBookingMemberSerializer(many=True, read_only=True)
    show_detail = ShowSerializer(source='show', read_only=True)
    organizer_detail = UserSerializer(source='organizer', read_only=True)

    class Meta:
        model = GroupBooking
        fields = ['id', 'organizer', 'organizer_detail', 'show', 'show_detail', 'invite_code', 'status', 'members', 'created_at']
        read_only_fields = ['invite_code']
