from django.db import models
from django.conf import settings
import uuid
from decimal import Decimal

def generate_short_id():
    return str(uuid.uuid4()).split('-')[0].upper()

class Seat(models.Model):
    STATUS_CHOICES = (
        ('Available', 'Available'),
        ('Reserved', 'Reserved'),
        ('Booked', 'Booked'),
    )
    CATEGORY_CHOICES = (
        ('Silver', 'Silver'),
        ('Gold', 'Gold'),
        ('Platinum', 'Platinum'),
    )

    show = models.ForeignKey('movies.Show', on_delete=models.CASCADE, related_name='seats')
    row_label = models.CharField(max_length=2)  # A, B, C, etc.
    column_number = models.IntegerField()  # 1, 2, 3, etc.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Silver')
    price = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('150.00'))
    reserved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reserved_seats')
    reserved_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('show', 'row_label', 'column_number')

    def __str__(self):
        return f"{self.show.movie or self.show.event or self.show.sports_event} - {self.row_label}{self.column_number} ({self.status}) - {self.category}"


class Booking(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    show = models.ForeignKey('movies.Show', on_delete=models.CASCADE, related_name='bookings')
    seats_display = models.CharField(max_length=255, help_text="e.g. A1, A2")
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    booking_id = models.CharField(max_length=50, unique=True, default=generate_short_id)
    qr_code_url = models.CharField(max_length=1000, blank=True, null=True)
    email_sent = models.BooleanField(default=False)
    email_delivery_status = models.CharField(max_length=50, default='Pending')
    email_error = models.TextField(blank=True, null=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking {self.booking_id} by {self.user.email} ({self.status})"


class Reservation(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Expired', 'Expired'),
        ('Confirmed', 'Confirmed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    show = models.ForeignKey('movies.Show', on_delete=models.CASCADE, related_name='reservations')
    booking = models.OneToOneField(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservation')
    seats_display = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reservation for {self.user.email} - {self.seats_display} (Expires {self.expires_at.strftime('%Y-%m-%d %H:%M')})"


class Payment(models.Model):
    METHOD_CHOICES = (
        ('UPI', 'UPI'),
        ('Credit Card', 'Credit Card'),
        ('Debit Card', 'Debit Card'),
        ('Net Banking', 'Net Banking'),
    )
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Successful', 'Successful'),
        ('Failed', 'Failed'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    method = models.CharField(max_length=50, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=100, unique=True, default=generate_short_id)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.transaction_id} for Booking {self.booking.booking_id} ({self.status})"


class GiftCard(models.Model):
    code = models.CharField(max_length=50, unique=True, default=generate_short_id)
    value = models.DecimalField(max_digits=8, decimal_places=2)
    is_redeemed = models.BooleanField(default=False)
    redeemed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='redeemed_gift_cards')
    redeemed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"GiftCard {self.code} (${self.value}) - Redeemed: {self.is_redeemed}"


class GroupBooking(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    )

    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_group_bookings')
    show = models.ForeignKey('movies.Show', on_delete=models.CASCADE, related_name='group_bookings')
    invite_code = models.CharField(max_length=50, unique=True, default=generate_short_id)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    booking = models.ForeignKey('Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='group_bookings')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"GroupBooking {self.invite_code} organized by {self.organizer.email}"


class GroupBookingMember(models.Model):
    STATUS_CHOICES = (
        ('Selected', 'Selected'),
        ('Paid', 'Paid'),
    )

    group_booking = models.ForeignKey(GroupBooking, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='group_booking_memberships')
    name = models.CharField(max_length=100, help_text="For guest names or displaying friend identity")
    seats_display = models.CharField(max_length=255, help_text="e.g. A3, A4")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Selected')

    def __str__(self):
        return f"{self.name} in GroupBooking {self.group_booking.invite_code} - Seats: {self.seats_display}"


class CinePointsConfig(models.Model):
    points_per_booking = models.IntegerField(default=10)
    first_booking_bonus = models.IntegerField(default=50)
    campaign_active = models.BooleanField(default=False)
    campaign_bonus_points = models.IntegerField(default=20)
    campaign_name = models.CharField(max_length=255, default="Summer Festival Bonus")
    redemption_rules = models.JSONField(default=dict) # e.g. {"100": 10, "250": 30, "500": 75}

    def __str__(self):
        return f"CinePoints Config (Campaign: {self.campaign_name} Active: {self.campaign_active})"


def get_cinepoints_config():
    config, _ = CinePointsConfig.objects.get_or_create(id=1, defaults={
        "points_per_booking": 10,
        "first_booking_bonus": 50,
        "campaign_active": False,
        "campaign_bonus_points": 20,
        "campaign_name": "Summer Festival Bonus",
        "redemption_rules": {"100": 10, "250": 30, "500": 75}
    })
    return config
