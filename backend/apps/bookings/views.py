from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from datetime import timedelta
from decimal import Decimal
import uuid
import base64
from email.mime.image import MIMEImage
import stripe
import logging

stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)

from apps.movies.models import Show, Theatre, Screen, Movie
from apps.authentication.models import RewardPoints, Notification
from .models import Seat, Booking, Reservation, Payment, GiftCard, GroupBooking, GroupBookingMember, CinePointsConfig, get_cinepoints_config
from .serializers import (
    SeatSerializer, BookingSerializer, ReservationSerializer,
    PaymentSerializer, GiftCardSerializer, GroupBookingSerializer
)
from .utils import generate_qr_code_base64
from .tasks import send_async_confirmation_email

def send_booking_confirmation_email(user, booking, final_price):
    """Send a booking confirmation email with QR code.

    This function now computes all show‑related context locally to avoid
    referencing undefined class‑level variables.
    """
    show = booking.show
    show_title = (
        show.movie.title
        if show.movie
        else (show.event.title if show.event else show.sports_event.title)
    )
    language = show.movie.language if show.movie else "English"
    category = (
        "Movie"
        if show.movie
        else ("Event" if show.event else "Sport")
    )
    # Compute context values previously defined at class level
    location_name = (
        show.theatre.name if hasattr(show, "theatre") and show.theatre else (
            show.venue.name if hasattr(show, "venue") and show.venue else "CineHub Partner Location"
        )
    )
    date_str = show.start_time.strftime('%a, %d %b %Y')
    time_str = show.start_time.strftime('%I:%M %p')
    
    subject = f"Booking Confirmation: {show_title}"
    qr_code_b64 = generate_qr_code_base64(booking.booking_id)
    text_content = f"Your booking for {show_title} is confirmed. ID: {booking.booking_id}"
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0B0F19; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1E293B; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #EC4899; text-align: center; margin-top: 0; font-size: 24px;">CineHub Ticket Confirmed! 🍿</h2>
        <hr style="border-color: rgba(255,255,255,0.08); margin: 20px 0;" />
        <p style="color: #E2E8F0; font-size: 15px;">Hi <strong style="color: #FFF;">{user.full_name}</strong>,</p>
        <p style="color: #E2E8F0; font-size: 15px;">Your booking is confirmed. Here are your ticket details:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; color: #E2E8F0; font-size: 14px;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Movie Details</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #FACC15;">{show_title} ({language})</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Theatre & Location</td>
            <td style="padding: 10px 0; text-align: right;">{location_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Date & Time</td>
            <td style="padding: 10px 0; text-align: right;">{date_str} at {time_str}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Seats Allocated</td>
            <td style="padding: 10px 0; text-align: right; color: #10B981; font-weight: bold;">{booking.seats_display}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Amount Paid</td>
            <td style="padding: 10px 0; text-align: right; color: #EC4899; font-weight: bold; font-size: 16px;">₹{final_price}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #94A3B8;">Ticket ID</td>
            <td style="padding: 10px 0; text-align: right; font-family: monospace; color: #38BDF8;">{booking.booking_id}</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 30px 0; background: #FFFFFF; padding: 20px; border-radius: 12px; display: block;">
          <h4 style="color: #0B0F19; margin: 0 0 12px 0; font-size: 16px; font-weight: 800;">Digital Entry Ticket QR</h4>
          <img src="cid:qrcode" alt="QR Code Ticket" style="width: 150px; height: 150px; display: block; margin: 0 auto; background: #FFF;" />
          <span style="font-size: 11px; color: #64748B; margin-top: 8px; display: block;">Scan at cinema entry counter</span>
        </div>
        
        <p style="font-size: 12px; color: #64748B; text-align: center; margin-top: 30px;">
          Thank you for booking with CineHub! Enjoy your {category.lower()}.
        </p>
      </div>
    </body>
    </html>
    """

    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
    msg.attach_alternative(html_content, "text/html")

    try:
        if qr_code_b64 and 'base64,' in qr_code_b64:
            header, base64_data = qr_code_b64.split('base64,')
            img_data = base64.b64decode(base64_data)
            
            img = MIMEImage(img_data)
            img.add_key = "qrcode"
            img.add_header('Content-ID', '<qrcode>')
            img.add_header('Content-Disposition', 'inline', filename='ticket_qr.png')
            msg.attach(img)
    except Exception:
        pass

    msg.send(fail_silently=True)


class BookingViewSet(viewsets.ModelViewSet):
    """API endpoint for managing bookings.
    Provides list, retrieve, create, update, and delete actions.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related(
            'user', 'show', 'show__movie', 'show__theatre', 'show__theatre__location',
            'show__screen', 'show__screen__theatre', 'show__event', 'show__sports_event',
            'show__venue', 'show__venue__location'
        ).order_by('-created_at')
        if user.is_staff:
            return qs
        return qs.filter(user=user)


class SeatLayoutView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        show_id = request.query_params.get('show')
        if not show_id:
            return Response({"error": "Show parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            show = Show.objects.get(id=show_id)
        except Show.DoesNotExist:
            return Response({"error": "Show not found."}, status=status.HTTP_404_NOT_FOUND)

        # Automatically populate seat layout if empty
        seats = Seat.objects.filter(show=show)
        if seats.count() == 0:
            layout = {}
            if show.screen:
                layout = show.screen.seat_layout
            
            if not layout:
                layout = {
                    "A": "Silver", "B": "Silver", "C": "Silver", "D": "Silver",
                    "E": "Gold", "F": "Gold", "G": "Gold",
                    "H": "Platinum", "I": "Platinum", "J": "Platinum"
                }

            seats_to_create = []
            for row, cat in layout.items():
                for col in range(1, 11):
                    price = Decimal('150.00')
                    if cat == 'Gold':
                        price = Decimal('250.00')
                    elif cat == 'Platinum':
                        price = Decimal('350.00')
                    seats_to_create.append(Seat(
                        show=show, row_label=row, column_number=col,
                        status='Available', category=cat, price=price
                    ))
            Seat.objects.bulk_create(seats_to_create)
            seats = Seat.objects.filter(show=show)

        # Run a cleanup of expired reservations before returning layout
        expired_seats = seats.filter(status='Reserved', reserved_until__lt=timezone.now())
        if expired_seats.exists():
            expired_seats.update(status='Available', reserved_by=None, reserved_until=None)

        serializer = SeatSerializer(seats, many=True)
        return Response(serializer.data)


class ReserveSeatsView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        show_id = request.data.get('show')
        seats_list = request.data.get('seats') # e.g. ["A1", "A2"]
        if isinstance(seats_list, str):
            seats_list = [s.strip() for s in seats_list.split(',') if s.strip()]

        if not show_id or not seats_list or not isinstance(seats_list, list):
            return Response({"error": "Show and a valid seats list are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            show = Show.objects.get(id=show_id)
        except Show.DoesNotExist:
            return Response({"error": "Show not found."}, status=status.HTTP_404_NOT_FOUND)

        # Parse seats
        seats_to_reserve = []
        for s_code in seats_list:
            row = s_code[0]
            col = int(s_code[1:])
            try:
                seat_obj = Seat.objects.get(show=show, row_label=row, column_number=col)
                if seat_obj.status != 'Available' and not (seat_obj.status == 'Reserved' and seat_obj.reserved_until < timezone.now()):
                    return Response({"error": f"Seat {s_code} is already reserved or booked."}, status=status.HTTP_400_BAD_REQUEST)
                seats_to_reserve.append(seat_obj)
            except Seat.DoesNotExist:
                return Response({"error": f"Seat {s_code} does not exist for this show."}, status=status.HTTP_400_BAD_REQUEST)

        # Set expiration: 1 day before show time, or 10 mins from now if show is tomorrow/today
        one_day_before = show.start_time - timedelta(days=1)
        now = timezone.now()
        if one_day_before > now:
            expires_at = one_day_before
        else:
            expires_at = now + timedelta(minutes=10)

        # Create pending Booking
        total_price = show.price * len(seats_list)
        booking = Booking.objects.create(
            user=request.user,
            show=show,
            seats_display=", ".join(seats_list),
            total_price=total_price,
            status='Pending'
        )

        # Create Reservation
        reservation = Reservation.objects.create(
            user=request.user,
            show=show,
            booking=booking,
            seats_display=", ".join(seats_list),
            expires_at=expires_at,
            status='Active'
        )

        # Update seats status
        for s in seats_to_reserve:
            s.status = 'Reserved'
            s.reserved_by = request.user
            s.reserved_until = expires_at
            s.save()

        # Define email subject and message
        show_title = show.movie.title if show.movie else (show.event.title if show.event else show.sports_event.title)
        subject = f"Seats Reserved: {show_title}"
        message = f"Hi {request.user.full_name},\n\nYour reservation for {show_title} is confirmed.\n" \
                  f"Seats: {booking.seats_display}\n" \
                  f"Please complete your payment before {expires_at.strftime('%a, %d %b %Y %I:%M %p')}.\n\n" \
                  f"Thanks,\nCineHub Team"

        # Send Email notification asynchronously in a background thread to avoid blocking requests
        import threading
        email_thread = threading.Thread(
            target=send_mail,
            args=(subject, message, settings.DEFAULT_FROM_EMAIL, [request.user.email]),
            kwargs={"fail_silently": True}
        )
        email_thread.start()

        # Create notification
        Notification.objects.create(
            user=request.user,
            title="Reservation Created",
            message=f"Reserved seats {booking.seats_display} for show. Confirm before {expires_at.strftime('%Y-%m-%d %H:%M')}."
        )

        return Response({
            "booking": BookingSerializer(booking).data,
            "reservation": ReservationSerializer(reservation).data
        }, status=status.HTTP_201_CREATED)


class FinalizePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        booking_id = request.data.get('booking_id')
        method = request.data.get('method')
        redeem_points = request.data.get('redeem_points')
        gift_card_code = request.data.get('gift_card_code')
        promo_code = request.data.get('promo_code', '').upper().strip()

        if not booking_id or not method:
            return Response({"error": "Booking ID and payment method are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.get(booking_id=booking_id, user=request.user)
            if booking.status != 'Pending':
                return Response({"error": f"Booking is already {booking.status}."}, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        show = booking.show
        final_price = booking.total_price
        config = get_cinepoints_config()

        # 1. Handle Promo Code
        promo_discount = 0
        if promo_code:
            seats_count = len(booking.seats_display.split(','))
            base_price = float(booking.total_price)
            ticket_price = float(booking.show.price)
            if promo_code == "CINE50":
                promo_discount = min(base_price * 0.50, 150.0)
            elif promo_code == "BOGOPASS":
                if seats_count >= 2:
                    promo_discount = ticket_price
                else:
                    return Response({"error": "Buy 1 Get 1 requires at least 2 seats selected."}, status=status.HTTP_400_BAD_REQUEST)
            elif promo_code == "RUPAY100":
                if base_price >= 300.0:
                    promo_discount = 100.0
                else:
                    return Response({"error": "RuPay discount requires minimum order value of ₹300."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Invalid promo code."}, status=status.HTTP_400_BAD_REQUEST)

            final_price = Decimal(max(float(final_price) - promo_discount, 0.0))

        # 2. Handle Gift Card Redemption
        if gift_card_code:
            try:
                gc = GiftCard.objects.get(code=gift_card_code, is_redeemed=False)
                if gc.value >= final_price:
                    gc.is_redeemed = True
                    gc.redeemed_by = request.user
                    gc.redeemed_at = timezone.now()
                    gc.save()
                    final_price = 0
                else:
                    final_price -= gc.value
                    gc.is_redeemed = True
                    gc.redeemed_by = request.user
                    gc.redeemed_at = timezone.now()
                    gc.save()
            except GiftCard.DoesNotExist:
                return Response({"error": "Invalid or already redeemed Gift Card."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Handle Reward Points Redemption
        points_redeemed = 0
        points_discount = 0
        if redeem_points and final_price > 0:
            try:
                pts_to_redeem = int(redeem_points)
            except (ValueError, TypeError):
                pts_to_redeem = 0

            if pts_to_redeem in [100, 250, 500]:
                user_points = request.user.total_reward_points
                if user_points >= pts_to_redeem:
                    rules = config.redemption_rules
                    points_discount = rules.get(str(pts_to_redeem), 0)
                    if points_discount > 0:
                        RewardPoints.objects.create(
                            user=request.user,
                            points=-pts_to_redeem,
                            description=f"Redeemed CinePoints for Booking {booking.booking_id}"
                        )
                        final_price = Decimal(max(float(final_price) - float(points_discount), 0.0))
                        points_redeemed = pts_to_redeem
                else:
                    return Response({"error": f"Insufficient points balance. You need {pts_to_redeem} points."}, status=status.HTTP_400_BAD_REQUEST)

        # Process payment logic (Mock checkout)
        payment = Payment.objects.create(
            booking=booking,
            method=method,
            status='Successful',
            amount=final_price
        )

        # Confirm booking
        booking.status = 'Confirmed'
        
        # Confirm reservation if exists
        if hasattr(booking, 'reservation') and booking.reservation:
            res = booking.reservation
            res.status = 'Confirmed'
            res.save()

        # Update GroupBooking
        group_booking = GroupBooking.objects.filter(booking=booking).first()
        if group_booking:
            group_booking.status = 'Completed'
            group_booking.save()
            group_booking.members.all().update(status='Paid')

        # Update seat models to Booked
        seats_list = [s.strip() for s in booking.seats_display.split(',')]
        for s_code in seats_list:
            row = s_code[0]
            col = int(s_code[1:])
            try:
                s = Seat.objects.get(show=show, row_label=row, column_number=col)
                s.status = 'Booked'
                s.reserved_by = None
                s.reserved_until = None
                s.save()
            except Seat.DoesNotExist:
                pass

        # 4. Earn Reward Points
        is_first_booking = Booking.objects.filter(user=request.user, status='Confirmed').exclude(booking_id=booking.booking_id).count() == 0
        points_earned = config.points_per_booking
        if is_first_booking:
            points_earned += config.first_booking_bonus
        if config.campaign_active:
            points_earned += config.campaign_bonus_points

        RewardPoints.objects.create(
            user=request.user,
            points=points_earned,
            description=f"Earned from Booking {booking.booking_id}" + (" (First Booking Bonus)" if is_first_booking else "") + (f" ({config.campaign_name})" if config.campaign_active else "")
        )

        # Generate QR Code ticket string
        show_title = show.movie.title if show.movie else (show.event.title if show.event else show.sports_event.title)
        show_info = f"{show_title} @ {show.theatre or show.venue} on {show.start_time.strftime('%Y-%m-%d %H:%M')}"
        qr_code_b64 = generate_qr_code_base64(booking.booking_id, show_info)
        booking.qr_code_url = qr_code_b64
        booking.save()

        # Send confirmation email asynchronously via Celery (after transaction commits to avoid SQLite lock errors)
        transaction.on_commit(lambda: send_async_confirmation_email.delay(booking.booking_id))

        # Create user notification
        Notification.objects.create(
            user=request.user,
            title="Ticket Booked successfully 🍿",
            message=f"Booking confirmed for {show_title} ({booking.seats_display})."
        )

        return Response({
            "booking": BookingSerializer(booking).data,
            "payment": PaymentSerializer(payment).data,
            "points_earned": points_earned,
            "points_redeemed": points_redeemed,
            "promo_discount": float(promo_discount),
            "points_discount": float(points_discount)
        }, status=status.HTTP_200_OK)


class StripeCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        promo_code = (request.data.get('promo_code') or '').upper().strip()
        gift_card_code = (request.data.get('gift_card_code') or '').upper().strip()
        redeem_points = request.data.get('redeem_points')
        
        if not booking_id:
            return Response({"error": "Booking ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Retrieve pending booking
        try:
            booking = Booking.objects.select_related('show').get(booking_id=booking_id, user=request.user)
            if booking.status != 'Pending':
                return Response({"error": f"Booking is already {booking.status}."}, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
            
        show = booking.show
        config = get_cinepoints_config()
        
        # Calculate exactly as frontend does
        base_price = booking.total_price
        convenience_charge = Decimal('25.00')
        gst = Decimal('4.50')
        subtotal = base_price + convenience_charge + gst
        
        # Apply promo
        promo_discount = 0
        if promo_code:
            seats_count = len(booking.seats_display.split(','))
            ticket_price = float(show.price)
            if promo_code == "CINE50":
                promo_discount = min(float(base_price) * 0.50, 150.0)
            elif promo_code == "BOGOPASS" and seats_count >= 2:
                promo_discount = ticket_price
            elif promo_code == "RUPAY100" and float(base_price) >= 300.0:
                promo_discount = 100.0
            else:
                return Response({"error": "Invalid promo code."}, status=status.HTTP_400_BAD_REQUEST)

        # Apply gift card
        gift_card_discount = 0
        if gift_card_code:
            try:
                gc = GiftCard.objects.get(code=gift_card_code, is_redeemed=False)
                available_cap = float(subtotal) - promo_discount
                if float(gc.value) >= available_cap:
                    gift_card_discount = available_cap
                else:
                    gift_card_discount = float(gc.value)
            except GiftCard.DoesNotExist:
                return Response({"error": "Invalid or already redeemed Gift Card."}, status=status.HTTP_400_BAD_REQUEST)

        # Apply points
        points_redeemed = 0
        points_discount = 0
        if redeem_points:
            try:
                pts_to_redeem = int(redeem_points)
            except (ValueError, TypeError):
                pts_to_redeem = 0

            if pts_to_redeem in [100, 250, 500]:
                user_points = request.user.total_reward_points
                if user_points >= pts_to_redeem:
                    rules = config.redemption_rules
                    points_discount = rules.get(str(pts_to_redeem), 0)
                    points_redeemed = pts_to_redeem
                else:
                    return Response({"error": f"Insufficient points balance. You need {pts_to_redeem} points."}, status=status.HTTP_400_BAD_REQUEST)

        # Final price to charge
        total_discount = promo_discount + gift_card_discount + points_discount
        final_price = Decimal(str(round(max(float(subtotal) - total_discount, 0.0), 2)))

        # If final_price is 0, we can complete the booking immediately
        if final_price <= 0:
            with transaction.atomic():
                # Perform the booking confirmation
                payment = Payment.objects.create(
                    booking=booking,
                    method='Gift Card/Points',
                    status='Successful',
                    amount=0
                )
                booking.status = 'Confirmed'
                
                # Confirm reservation if exists
                if hasattr(booking, 'reservation') and booking.reservation:
                    booking.reservation.status = 'Confirmed'
                    booking.reservation.save()

                # Update seats to Booked
                seats_list = [s.strip() for s in booking.seats_display.split(',')]
                for s_code in seats_list:
                    if len(s_code) >= 2:
                        row = s_code[0]
                        try:
                            col = int(s_code[1:])
                            Seat.objects.filter(show=show, row_label=row, column_number=col).update(
                                status='Booked', reserved_by=None, reserved_until=None
                            )
                        except ValueError:
                            pass
                
                # Update GroupBooking
                group_booking = GroupBooking.objects.filter(booking=booking).first()
                if group_booking:
                    group_booking.status = 'Completed'
                    group_booking.save()
                    group_booking.members.all().update(status='Paid')

                # Redeem Gift Card
                if gift_card_code:
                    try:
                        gc = GiftCard.objects.get(code=gift_card_code, is_redeemed=False)
                        gc.is_redeemed = True
                        gc.redeemed_by = request.user
                        gc.redeemed_at = timezone.now()
                        gc.save()
                    except GiftCard.DoesNotExist:
                        pass

                # Redeem Reward Points
                if redeem_points and points_discount > 0:
                    RewardPoints.objects.create(
                        user=request.user,
                        points=-pts_to_redeem,
                        description=f"Redeemed CinePoints for Booking {booking.booking_id}"
                    )

                # Earn Reward Points
                is_first_booking = Booking.objects.filter(user=request.user, status='Confirmed').exclude(booking_id=booking.booking_id).count() == 0
                points_earned = config.points_per_booking
                if is_first_booking:
                    points_earned += config.first_booking_bonus
                if config.campaign_active:
                    points_earned += config.campaign_bonus_points

                RewardPoints.objects.create(
                    user=request.user,
                    points=points_earned,
                    description=f"Earned from Booking {booking.booking_id}" + (" (First Booking Bonus)" if is_first_booking else "") + (f" ({config.campaign_name})" if config.campaign_active else "")
                )

                # Generate QR Code
                show_title = show.movie.title if show.movie else (show.event.title if show.event else show.sports_event.title)
                show_info = f"{show_title} @ {show.theatre or show.venue} on {show.start_time.strftime('%Y-%m-%d %H:%M')}"
                booking.qr_code_url = generate_qr_code_base64(booking.booking_id, show_info)
                booking.save()

                # Create notification
                Notification.objects.create(
                    user=request.user,
                    title="Ticket Booked Successfully! 🍿",
                    message=f"Booking confirmed for {show_title} ({booking.seats_display})."
                )

                # Send confirmation email
                transaction.on_commit(lambda: send_async_confirmation_email.delay(booking.booking_id))

            return Response({
                "success": True,
                "booking": BookingSerializer(booking).data,
                "payment": PaymentSerializer(payment).data,
                "points_earned": points_earned,
                "points_redeemed": points_redeemed,
                "promo_discount": promo_discount,
                "points_discount": points_discount,
                "mock_payment": False
            }, status=status.HTTP_200_OK)

        # If final_price > 0, create Stripe Checkout Session
        try:
            amount_in_cents = int(final_price * 100)
            show_title = show.movie.title if show.movie else (show.event.title if show.event else show.sports_event.title)
            
            # Determine dynamic host/origin to support local/ngrok/tunnel/custom domain
            origin = request.headers.get('Origin') or request.META.get('HTTP_REFERER')
            if origin:
                if "://" in origin:
                    parts = origin.split("://")
                    protocol = parts[0]
                    host_part = parts[1].split('/')[0]
                    origin = f"{protocol}://{host_part}"
                else:
                    origin = origin.split('/')[0]
            else:
                origin = "http://localhost:5173"

            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {
                            'name': f"CineHub Tickets - {booking.seats_display}",
                            'description': f"Show: {show_title} at {show.start_time.strftime('%I:%M %p, %a %d %b')}",
                        },
                        'unit_amount': amount_in_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{origin}/payment-success/{booking.booking_id}?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{origin}/checkout/{booking.booking_id}",
                metadata={
                    'booking_id': booking.booking_id,
                    'promo_code': promo_code or '',
                    'gift_card_code': gift_card_code or '',
                    'redeem_points': str(points_redeemed or 0),
                    'user_id': str(request.user.id),
                }
            )
            return Response({"session_url": session.url}, status=status.HTTP_200_OK)
        except Exception as e:
            # Stripe failed (e.g. invalid keys). Fall back to completing the booking synchronously (Mock Payment).
            with transaction.atomic():
                payment = Payment.objects.create(
                    booking=booking,
                    method='Credit Card (Mock)',
                    status='Successful',
                    amount=final_price
                )
                booking.status = 'Confirmed'
                
                if hasattr(booking, 'reservation') and booking.reservation:
                    booking.reservation.status = 'Confirmed'
                    booking.reservation.save()

                seats_list = [s.strip() for s in booking.seats_display.split(',')]
                for s_code in seats_list:
                    if len(s_code) >= 2:
                        row = s_code[0]
                        try:
                            col = int(s_code[1:])
                            Seat.objects.filter(show=show, row_label=row, column_number=col).update(
                                status='Booked', reserved_by=None, reserved_until=None
                            )
                        except ValueError:
                            pass
                
                group_booking = GroupBooking.objects.filter(booking=booking).first()
                if group_booking:
                    group_booking.status = 'Completed'
                    group_booking.save()
                    group_booking.members.all().update(status='Paid')

                if gift_card_code:
                    try:
                        gc = GiftCard.objects.get(code=gift_card_code, is_redeemed=False)
                        gc.is_redeemed = True
                        gc.redeemed_by = request.user
                        gc.redeemed_at = timezone.now()
                        gc.save()
                    except GiftCard.DoesNotExist:
                        pass

                if redeem_points and points_discount > 0:
                    try:
                        pts_to_redeem = int(redeem_points)
                    except (ValueError, TypeError):
                        pts_to_redeem = 0
                    if pts_to_redeem > 0:
                        RewardPoints.objects.create(
                            user=request.user,
                            points=-pts_to_redeem,
                            description=f"Redeemed CinePoints for Booking {booking.booking_id}"
                        )


                is_first_booking = Booking.objects.filter(user=request.user, status='Confirmed').exclude(booking_id=booking.booking_id).count() == 0
                points_earned = config.points_per_booking
                if is_first_booking:
                    points_earned += config.first_booking_bonus
                if config.campaign_active:
                    points_earned += config.campaign_bonus_points

                RewardPoints.objects.create(
                    user=request.user,
                    points=points_earned,
                    description=f"Earned from Booking {booking.booking_id}" + (" (First Booking Bonus)" if is_first_booking else "") + (f" ({config.campaign_name})" if config.campaign_active else "")
                )

                show_title = show.movie.title if show.movie else (show.event.title if show.event else show.sports_event.title)
                show_info = f"{show_title} @ {show.theatre or show.venue} on {show.start_time.strftime('%Y-%m-%d %H:%M')}"
                booking.qr_code_url = generate_qr_code_base64(booking.booking_id, show_info)
                booking.save()

                Notification.objects.create(
                    user=request.user,
                    title="Ticket Booked Successfully! 🍿",
                    message=f"Booking confirmed for {show_title} ({booking.seats_display})."
                )

                transaction.on_commit(lambda: send_async_confirmation_email.delay(booking.booking_id))

            return Response({
                "success": True,
                "booking": BookingSerializer(booking).data,
                "payment": PaymentSerializer(payment).data,
                "points_earned": points_earned,
                "points_redeemed": points_redeemed,
                "promo_discount": promo_discount,
                "points_discount": points_discount,
                "mock_payment": True
            }, status=status.HTTP_200_OK)


class StripeConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        session_id = request.data.get('session_id')

        if not booking_id or not session_id:
            return Response({"error": "Booking ID and Session ID are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.select_related('show').get(booking_id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.status == 'Confirmed':
            payment = Payment.objects.filter(booking=booking).first()
            return Response({
                "success": True,
                "booking": BookingSerializer(booking).data,
                "payment": PaymentSerializer(payment).data if payment else None
            }, status=status.HTTP_200_OK)

        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except Exception as e:
            return Response({"error": f"Stripe session retrieval failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        session_metadata = getattr(session, 'metadata', {}) or {}
        if not isinstance(session_metadata, dict):
            if hasattr(session_metadata, 'to_dict'):
                session_metadata = session_metadata.to_dict()
            else:
                session_metadata = dict(session_metadata.items())

        if session_metadata.get('booking_id') != booking_id:
            return Response({"error": "Session metadata mismatch."}, status=status.HTTP_400_BAD_REQUEST)

        if session.payment_status != 'paid':
            return Response({"error": "Payment has not been completed."}, status=status.HTTP_400_BAD_REQUEST)

        show = booking.show
        config = get_cinepoints_config()

        promo_code = (session_metadata.get('promo_code') or '').upper().strip()
        gift_card_code = (session_metadata.get('gift_card_code') or '').upper().strip()
        
        # Safely extract points to redeem – non‑numeric values default to 0
        try:
            pts_to_redeem = int(session_metadata.get('redeem_points', 0))
        except (ValueError, TypeError):
            pts_to_redeem = 0

        # Ensure total_price is a Decimal; fallback to 0 if missing
        base_price = booking.total_price if booking.total_price is not None else Decimal('0')
        convenience_charge = Decimal('25.00')
        gst = Decimal('4.50')
        subtotal = base_price + convenience_charge + gst

        promo_discount = 0
        if promo_code:
            seats_count = len(booking.seats_display.split(','))
            ticket_price = float(show.price)
            if promo_code == "CINE50":
                promo_discount = min(float(base_price) * 0.50, 150.0)
            elif promo_code == "BOGOPASS" and seats_count >= 2:
                promo_discount = ticket_price
            elif promo_code == "RUPAY100" and float(base_price) >= 300.0:
                promo_discount = 100.0

        gift_card_discount = 0
        if gift_card_code:
            try:
                gc = GiftCard.objects.get(code=gift_card_code, is_redeemed=False)
                available_cap = float(subtotal) - promo_discount
                if float(gc.value) >= available_cap:
                    gift_card_discount = available_cap
                else:
                    gift_card_discount = float(gc.value)
            except GiftCard.DoesNotExist:
                pass

        points_discount = 0
        # Apply points discount only if a valid redemption tier is provided
        if pts_to_redeem in [100, 250, 500]:
            # Guard against mis‑configured redemption_rules
            rules = getattr(config, 'redemption_rules', {}) or {}
            points_discount = rules.get(str(pts_to_redeem), 0)

        total_discount = promo_discount + gift_card_discount + points_discount
        final_price = Decimal(str(round(max(float(subtotal) - total_discount, 0.0), 2)))

        with transaction.atomic():
            payment = Payment.objects.create(
                booking=booking,
                method='Credit Card',
                status='Successful',
                amount=final_price,
                transaction_id=session.payment_intent or session.id
            )

            booking.status = 'Confirmed'
            
            if hasattr(booking, 'reservation') and booking.reservation:
                booking.reservation.status = 'Confirmed'
                booking.reservation.save()

            seats_list = [s.strip() for s in booking.seats_display.split(',')]
            for s_code in seats_list:
                # Defensive seat parsing – skip malformed codes
                if len(s_code) < 2:
                    continue
                row = s_code[0]
                col_part = s_code[1:]
                if not col_part.isdigit():
                    continue
                col = int(col_part)
                Seat.objects.filter(show=show, row_label=row, column_number=col).update(
                    status='Booked', reserved_by=None, reserved_until=None
                )
            
            group_booking = GroupBooking.objects.filter(booking=booking).first()
            if group_booking:
                group_booking.status = 'Completed'
                group_booking.save()
                group_booking.members.all().update(status='Paid')

            if gift_card_code:
                try:
                    gc = GiftCard.objects.get(code=gift_card_code, is_redeemed=False)
                    gc.is_redeemed = True
                    gc.redeemed_by = request.user
                    gc.redeemed_at = timezone.now()
                    gc.save()
                except GiftCard.DoesNotExist:
                    pass

            if pts_to_redeem > 0:
                RewardPoints.objects.create(
                    user=request.user,
                    points=-pts_to_redeem,
                    description=f"Redeemed CinePoints for Booking {booking.booking_id}"
                )

            is_first_booking = Booking.objects.filter(user=request.user, status='Confirmed').exclude(booking_id=booking.booking_id).count() == 0
            points_earned = config.points_per_booking
            if is_first_booking:
                points_earned += config.first_booking_bonus
            if config.campaign_active:
                points_earned += config.campaign_bonus_points

            RewardPoints.objects.create(
                user=request.user,
                points=points_earned,
                description=f"Earned from Booking {booking.booking_id}" + (" (First Booking Bonus)" if is_first_booking else "") + (f" ({config.campaign_name})" if config.campaign_active else "")
            )

            show_title = show.movie.title if show.movie else (show.event.title if show.event else show.sports_event.title)
            show_info = f"{show_title} @ {show.theatre or show.venue} on {show.start_time.strftime('%Y-%m-%d %H:%M')}"
            booking.qr_code_url = generate_qr_code_base64(booking.booking_id, show_info)
            booking.save()

            Notification.objects.create(
                user=request.user,
                title="Ticket Booked Successfully! 🍿",
                message=f"Booking confirmed for {show_title} ({booking.seats_display})."
            )

            transaction.on_commit(lambda: send_async_confirmation_email.delay(booking.booking_id))

        return Response({
            "success": True,
            "booking": BookingSerializer(booking).data,
            "payment": PaymentSerializer(payment).data,
            "points_earned": points_earned,
            "points_redeemed": pts_to_redeem,
            "promo_discount": promo_discount,
            "points_discount": points_discount
        }, status=status.HTTP_200_OK)


class ResendConfirmationEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        """Resend booking confirmation email to the user.
        Requires the booking to belong to the authenticated user and be confirmed.
        """
        try:
            booking = Booking.objects.get(booking_id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        if booking.status != 'Confirmed':
            return Response({"error": "Booking is not confirmed yet."}, status=status.HTTP_400_BAD_REQUEST)
        # Trigger async email task after transaction commit to avoid DB lock issues
        transaction.on_commit(lambda: send_async_confirmation_email.delay(booking.booking_id))
        return Response({"detail": "Confirmation email resent."}, status=status.HTTP_200_OK)

# StripeConfirmView removed - using existing payment flow


class GroupBookingCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        show_id = request.data.get('show')
        seats_list = request.data.get('seats') # organizer seats e.g. ["A3"]

        if not show_id or not seats_list:
            return Response({"error": "Show and seats list are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            show = Show.objects.get(id=show_id)
        except Show.DoesNotExist:
            return Response({"error": "Show not found."}, status=status.HTTP_404_NOT_FOUND)

        invite_code = str(uuid.uuid4()).split('-')[0].upper()
        group_booking = GroupBooking.objects.create(
            organizer=request.user,
            show=show,
            invite_code=invite_code,
            status='Active'
        )

        # Add organizer as a member
        GroupBookingMember.objects.create(
            group_booking=group_booking,
            user=request.user,
            name=request.user.full_name,
            seats_display=", ".join(seats_list),
            status='Selected'
        )

        # Reserve seats
        for s_code in seats_list:
            row = s_code[0]
            col = int(s_code[1:])
            s_obj = Seat.objects.get(show=show, row_label=row, column_number=col)
            s_obj.status = 'Reserved'
            s_obj.reserved_by = request.user
            s_obj.reserved_until = timezone.now() + timedelta(hours=2) # Group plan lock expires in 2 hours
            s_obj.save()

        return Response(GroupBookingSerializer(group_booking).data, status=status.HTTP_201_CREATED)


class GroupBookingDetailView(generics.RetrieveAPIView):
    queryset = GroupBooking.objects.all()
    serializer_class = GroupBookingSerializer
    permission_classes = [AllowAny]
    lookup_field = 'invite_code'


class GroupBookingJoinView(APIView):
    permission_classes = [AllowAny]  # Allow guests to join group planner

    @transaction.atomic
    def post(self, request):
        invite_code = request.data.get('invite_code')
        name = request.data.get('name')
        seats_list = request.data.get('seats') # e.g. ["A4"]

        if not all([invite_code, name, seats_list]):
            return Response({"error": "Invite code, name and seats are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            gb = GroupBooking.objects.get(invite_code=invite_code, status='Active')
        except GroupBooking.DoesNotExist:
            return Response({"error": "Active Group Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        show = gb.show
        user = request.user if request.user.is_authenticated else None

        # Check seats are available
        for s_code in seats_list:
            row = s_code[0]
            col = int(s_code[1:])
            s_obj = Seat.objects.get(show=show, row_label=row, column_number=col)
            if s_obj.status != 'Available':
                return Response({"error": f"Seat {s_code} is not available."}, status=status.HTTP_400_BAD_REQUEST)
            s_obj.status = 'Reserved'
            s_obj.reserved_by = user
            s_obj.reserved_until = timezone.now() + timedelta(hours=2)
            s_obj.save()

        member = GroupBookingMember.objects.create(
            group_booking=gb,
            user=user,
            name=name,
            seats_display=", ".join(seats_list),
            status='Selected'
        )

        return Response(GroupBookingSerializer(gb).data, status=status.HTTP_200_OK)


class GroupBookingPayView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        invite_code = request.data.get('invite_code')

        if not invite_code:
            return Response({"error": "Invite code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            gb = GroupBooking.objects.get(invite_code=invite_code, organizer=request.user, status='Active')
        except GroupBooking.DoesNotExist:
            return Response({"error": "Active Group Booking not found or you are not the organizer."}, status=status.HTTP_404_NOT_FOUND)

        show = gb.show
        members = gb.members.all()
        
        all_seats = []
        for m in members:
            seats_of_m = [s.strip() for s in m.seats_display.split(',')]
            all_seats.extend(seats_of_m)

        total_seats_count = len(all_seats)
        total_price = show.price * total_seats_count

        # Create single unified booking for organizer containing all seats
        booking = Booking.objects.create(
            user=request.user,
            show=show,
            seats_display=", ".join(all_seats),
            total_price=total_price,
            status='Pending'
        )

        # Link booking to GroupBooking
        gb.booking = booking
        gb.save()

        return Response({
            "group_booking": GroupBookingSerializer(gb).data,
            "booking": BookingSerializer(booking).data
        }, status=status.HTTP_200_OK)


class GiftCardViewSet(viewsets.ModelViewSet):
    queryset = GiftCard.objects.all()
    serializer_class = GiftCardSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def purchase(self, request):
        value = request.data.get('value')
        if not value:
            return Response({"error": "Value is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Alphanumeric unique code
        code = str(uuid.uuid4()).split('-')[0].upper()
        gc = GiftCard.objects.create(code=code, value=value)
        return Response(GiftCardSerializer(gc).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def verify(self, request):
        code = request.query_params.get('code')
        if not code:
            return Response({"error": "Code parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            gc = GiftCard.objects.get(code=code, is_redeemed=False)
            return Response(GiftCardSerializer(gc).data, status=status.HTTP_200_OK)
        except GiftCard.DoesNotExist:
            return Response({"error": "Gift Card is invalid or already redeemed."}, status=status.HTTP_404_NOT_FOUND)


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'booking_id'

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related(
            'user', 'show', 'show__movie', 'show__theatre', 'show__theatre__location',
            'show__screen', 'show__screen__theatre', 'show__event', 'show__sports_event',
            'show__venue', 'show__venue__location'
        ).order_by('-created_at')
        if user.role == 'Admin' or user.is_staff:
            return qs
        elif user.role == 'Manager':
            return qs.filter(show__theatre__manager=user)
        return qs.filter(user=user)


class ValidatePromoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        promo_code = request.data.get('promo_code', '').upper().strip()
        
        try:
            booking = Booking.objects.get(booking_id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        discount = 0
        seats_count = len(booking.seats_display.split(','))
        base_price = float(booking.total_price)
        ticket_price = float(booking.show.price)

        if promo_code == "CINE50":
            discount = min(base_price * 0.50, 150.0)
        elif promo_code == "BOGOPASS":
            if seats_count >= 2:
                discount = ticket_price
            else:
                return Response({"error": "Buy 1 Get 1 requires at least 2 seats selected."}, status=status.HTTP_400_BAD_REQUEST)
        elif promo_code == "RUPAY100":
            if base_price >= 300.0:
                discount = 100.0
            else:
                return Response({"error": "RuPay discount requires minimum order value of ₹300."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": "Invalid promo code."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "promo_code": promo_code,
            "discount": discount,
            "new_total": max(base_price - discount, 0.0)
        }, status=status.HTTP_200_OK)


class ValidateGiftCardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').upper().strip()
        try:
            gc = GiftCard.objects.get(code=code)
            if gc.is_redeemed:
                return Response({"error": "This Gift Card has already been redeemed."}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                "code": gc.code,
                "value": float(gc.value)
            }, status=status.HTTP_200_OK)
        except GiftCard.DoesNotExist:
            return Response({"error": "Invalid Gift Card code."}, status=status.HTTP_400_BAD_REQUEST)


class CinePointsConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = get_cinepoints_config()
        return Response({
            "points_per_booking": config.points_per_booking,
            "first_booking_bonus": config.first_booking_bonus,
            "campaign_active": config.campaign_active,
            "campaign_bonus_points": config.campaign_bonus_points,
            "campaign_name": config.campaign_name,
            "redemption_rules": config.redemption_rules
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        # Admin only
        if request.user.role != 'Admin' and not request.user.is_staff:
            return Response({"error": "Admin permission required."}, status=status.HTTP_403_FORBIDDEN)
        
        config = get_cinepoints_config()
        config.points_per_booking = request.data.get('points_per_booking', config.points_per_booking)
        config.first_booking_bonus = request.data.get('first_booking_bonus', config.first_booking_bonus)
        config.campaign_active = request.data.get('campaign_active', config.campaign_active)
        config.campaign_bonus_points = request.data.get('campaign_bonus_points', config.campaign_bonus_points)
        config.campaign_name = request.data.get('campaign_name', config.campaign_name)
        config.redemption_rules = request.data.get('redemption_rules', config.redemption_rules)
        config.save()

        return Response({
            "points_per_booking": config.points_per_booking,
            "first_booking_bonus": config.first_booking_bonus,
            "campaign_active": config.campaign_active,
            "campaign_bonus_points": config.campaign_bonus_points,
            "campaign_name": config.campaign_name,
            "redemption_rules": config.redemption_rules
        }, status=status.HTTP_200_OK)


class LoyaltyStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admin only
        if request.user.role != 'Admin' and not request.user.is_staff:
            return Response({"error": "Admin permission required."}, status=status.HTTP_403_FORBIDDEN)

        from django.contrib.auth import get_user_model
        from django.db.models import Sum
        User = get_user_model()
        
        users = User.objects.filter(role='Customer')
        total_customers = users.count()

        # Count per loyalty tier (Silver < 500, Gold 500-1499, Platinum >= 1500)
        silver_count = 0
        gold_count = 0
        platinum_count = 0
        
        for u in users:
            pts = u.total_reward_points
            if pts >= 1500:
                platinum_count += 1
            elif pts >= 500:
                gold_count += 1
            else:
                silver_count += 1

        total_earned = RewardPoints.objects.filter(points__gt=0).aggregate(total=Sum('points'))['total'] or 0
        total_redeemed = abs(RewardPoints.objects.filter(points__lt=0).aggregate(total=Sum('points'))['total'] or 0)
        
        return Response({
            "total_customers": total_customers,
            "silver_tier_count": silver_count,
            "gold_tier_count": gold_count,
            "platinum_tier_count": platinum_count,
            "total_points_distributed": total_earned,
            "total_points_redeemed": total_redeemed
        }, status=status.HTTP_200_OK)


from rest_framework.permissions import BasePermission
from django.db import models

class IsTheatreAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['Manager', 'Admin']


class ManagerDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsTheatreAdmin]

    def get(self, request):
        from apps.movies.models import Theatre, Screen, Movie
        
        # Determine the theatre managed by this user
        theatre_id = request.query_params.get('theatre_id')
        if theatre_id:
            try:
                if request.user.role == 'Admin' or request.user.is_staff:
                    theatre = Theatre.objects.get(id=theatre_id)
                else:
                    theatre = Theatre.objects.get(id=theatre_id, manager=request.user)
            except Theatre.DoesNotExist:
                return Response({"error": "Theatre not found or you do not manage it."}, status=status.HTTP_404_NOT_FOUND)
        else:
            theatre = request.user.managed_theatres.first()
            if not theatre:
                # Fallback to the first demo theatre
                theatre = Theatre.objects.filter(is_demo=True).first() or Theatre.objects.first()
            
        if not theatre:
            return Response({"error": "No theatres found in the system."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Total Movies showing at this theatre
        total_movies = Show.objects.filter(theatre=theatre, movie__isnull=False).values('movie').distinct().count()

        # 2. Total Screens in this theatre
        total_screens = Screen.objects.filter(theatre=theatre).count()

        # 3. Total Shows scheduled
        total_shows = Show.objects.filter(theatre=theatre).count()

        # 4. Total Bookings confirmed
        total_bookings = Booking.objects.filter(show__theatre=theatre, status='Confirmed').count()

        # 5. Total Revenue (sum of total_price of confirmed bookings)
        total_revenue = Booking.objects.filter(show__theatre=theatre, status='Confirmed').aggregate(total=models.Sum('total_price'))['total'] or Decimal('0.00')

        # 6. Reports: Daily Revenue for the past 7 days
        daily_revenue = []
        now = timezone.now().date()
        for i in range(7):
            day = now - timedelta(days=i)
            day_rev = Booking.objects.filter(
                show__theatre=theatre, 
                status='Confirmed',
                created_at__date=day
            ).aggregate(total=models.Sum('total_price'))['total'] or Decimal('0.00')
            daily_revenue.append({
                "date": day.strftime('%Y-%m-%d'),
                "revenue": float(day_rev)
            })
        daily_revenue.reverse()

        # 7. Reports: Weekly Revenue for the past 4 weeks
        weekly_revenue = []
        for i in range(4):
            start_date = now - timedelta(days=(i+1)*7)
            end_date = now - timedelta(days=i*7)
            week_rev = Booking.objects.filter(
                show__theatre=theatre,
                status='Confirmed',
                created_at__date__gte=start_date,
                created_at__date__lt=end_date
            ).aggregate(total=models.Sum('total_price'))['total'] or Decimal('0.00')
            weekly_revenue.append({
                "week": f"Week {4-i}",
                "revenue": float(week_rev)
            })
        weekly_revenue.reverse()

        # 8. Reports: Monthly Revenue for the past 6 months
        monthly_revenue = []
        for i in range(6):
            month_start = now - timedelta(days=(i+1)*30)
            month_end = now - timedelta(days=i*30)
            month_rev = Booking.objects.filter(
                show__theatre=theatre,
                status='Confirmed',
                created_at__date__gte=month_start,
                created_at__date__lt=month_end
            ).aggregate(total=models.Sum('total_price'))['total'] or Decimal('0.00')
            monthly_revenue.append({
                "month": (now - timedelta(days=i*30)).strftime('%B'),
                "revenue": float(month_rev)
            })
        monthly_revenue.reverse()

        # 9. Reports: Most Booked Movies
        movie_bookings = []
        shows = Show.objects.filter(theatre=theatre, movie__isnull=False).select_related('movie')
        movies_map = {}
        for show in shows:
            movie_id = show.movie.id
            title = show.movie.title
            booking_count = Booking.objects.filter(show=show, status='Confirmed').count()
            if movie_id not in movies_map:
                movies_map[movie_id] = {"title": title, "bookings": 0}
            movies_map[movie_id]["bookings"] += booking_count
        
        most_booked = sorted(movies_map.values(), key=lambda x: x['bookings'], reverse=True)[:5]

        return Response({
            "theatre_name": theatre.name,
            "total_movies": total_movies,
            "total_screens": total_screens,
            "total_shows": total_shows,
            "total_bookings": total_bookings,
            "total_revenue": float(total_revenue),
            "reports": {
                "daily_revenue": daily_revenue,
                "weekly_revenue": weekly_revenue,
                "monthly_revenue": monthly_revenue,
                "most_booked_movies": most_booked
            }
        }, status=status.HTTP_200_OK)


class AdminTheatreViewSet(viewsets.ModelViewSet):
    from apps.movies.models import Theatre
    from apps.movies.serializers import TheatreSerializer
    
    serializer_class = TheatreSerializer
    permission_classes = [IsAuthenticated, IsTheatreAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Admin' or user.is_staff:
            return Theatre.objects.all()
        return Theatre.objects.filter(manager=user)

    def perform_create(self, serializer):
        serializer.save(manager=self.request.user, status='Active')


class AdminMovieViewSet(viewsets.ModelViewSet):
    from apps.movies.models import Movie
    from apps.movies.serializers import MovieSerializer
    
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticated, IsTheatreAdmin]


class AdminScreenViewSet(viewsets.ModelViewSet):
    from apps.movies.models import Screen
    from apps.movies.serializers import ScreenSerializer
    
    serializer_class = ScreenSerializer
    permission_classes = [IsAuthenticated, IsTheatreAdmin]

    def get_queryset(self):
        from apps.movies.models import Screen, Theatre
        theatre_id = self.request.query_params.get('theatre_id')
        if theatre_id:
            if self.request.user.role == 'Admin' or self.request.user.is_staff:
                return Screen.objects.filter(theatre_id=theatre_id)
            return Screen.objects.filter(theatre_id=theatre_id, theatre__manager=self.request.user)
            
        user = self.request.user
        if user.role == 'Admin' or user.is_staff:
            return Screen.objects.all()
        return Screen.objects.filter(theatre__manager=user)

    def perform_create(self, serializer):
        from apps.movies.models import Theatre
        from rest_framework.exceptions import ValidationError
        theatre_id = self.request.data.get('theatre')
        if theatre_id:
            try:
                if self.request.user.role == 'Admin' or self.request.user.is_staff:
                    theatre = Theatre.objects.get(id=theatre_id)
                else:
                    theatre = Theatre.objects.get(id=theatre_id, manager=self.request.user)
            except Theatre.DoesNotExist:
                raise ValidationError({"theatre": "Theatre not found or you do not manage it."})
        else:
            theatre = self.request.user.managed_theatres.first()
            if not theatre:
                theatre = Theatre.objects.first()
        serializer.save(theatre=theatre)


class AdminShowViewSet(viewsets.ModelViewSet):
    from apps.movies.serializers import ShowSerializer
    serializer_class = ShowSerializer
    permission_classes = [IsAuthenticated, IsTheatreAdmin]

    def get_queryset(self):
        from apps.movies.models import Show, Theatre
        theatre_id = self.request.query_params.get('theatre_id')
        if theatre_id:
            if self.request.user.role == 'Admin' or self.request.user.is_staff:
                return Show.objects.filter(theatre_id=theatre_id).order_by('-start_time')
            return Show.objects.filter(theatre_id=theatre_id, theatre__manager=self.request.user).order_by('-start_time')

        user = self.request.user
        if user.role == 'Admin' or user.is_staff:
            return Show.objects.all().order_by('-start_time')
        return Show.objects.filter(theatre__manager=user).order_by('-start_time')

    def perform_create(self, serializer):
        from apps.movies.models import Theatre
        from rest_framework.exceptions import ValidationError
        theatre_id = self.request.data.get('theatre')
        if theatre_id:
            try:
                if self.request.user.role == 'Admin' or self.request.user.is_staff:
                    theatre = Theatre.objects.get(id=theatre_id)
                else:
                    theatre = Theatre.objects.get(id=theatre_id, manager=self.request.user)
            except Theatre.DoesNotExist:
                raise ValidationError({"theatre": "Theatre not found or you do not manage it."})
        else:
            theatre = self.request.user.managed_theatres.first()
            if not theatre:
                theatre = Theatre.objects.first()
            
        show = serializer.save(theatre=theatre)
        
        # Auto-generate seat models based on Screen seat_layout configuration
        screen = show.screen
        if screen:
            layout = screen.seat_layout or {
                "A": "Silver", "B": "Silver", "C": "Silver", "D": "Silver",
                "E": "Gold", "F": "Gold", "G": "Gold",
                "H": "Platinum", "I": "Platinum", "J": "Platinum"
            }
            seats_to_create = []
            for row, cat in layout.items():
                for col in range(1, 11):
                    price = Decimal('150.00')
                    if cat == 'Gold':
                        price = Decimal('250.00')
                    elif cat == 'Platinum':
                        price = Decimal('350.00')
                    seats_to_create.append(Seat(
                        show=show,
                        row_label=row,
                        column_number=col,
                        status='Available',
                        category=cat,
                        price=price
                    ))
            Seat.objects.bulk_create(seats_to_create)


class AdminBookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, IsTheatreAdmin]

    def get_queryset(self):
        from apps.movies.models import Theatre
        theatre_id = self.request.query_params.get('theatre_id')
        if theatre_id:
            if self.request.user.role == 'Admin' or self.request.user.is_staff:
                queryset = Booking.objects.filter(show__theatre_id=theatre_id)
            else:
                queryset = Booking.objects.filter(show__theatre_id=theatre_id, show__theatre__manager=self.request.user)
        else:
            user = self.request.user
            if user.role == 'Admin' or user.is_staff:
                queryset = Booking.objects.all()
            else:
                queryset = Booking.objects.filter(show__theatre__manager=user)
        
        booking_id = self.request.query_params.get('booking_id')
        if booking_id:
            queryset = queryset.filter(booking_id__icontains=booking_id)
        return queryset.order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='occupancy')
    def occupancy(self, request):
        show_id = request.query_params.get('show')
        if not show_id:
            return Response({"error": "Show parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            show = Show.objects.get(id=show_id)
        except Show.DoesNotExist:
            return Response({"error": "Show not found."}, status=status.HTTP_404_NOT_FOUND)
            
        seats = Seat.objects.filter(show=show)
        serializer = SeatSerializer(seats, many=True)
        return Response(serializer.data)


class AdminVerifyTicketView(APIView):
    permission_classes = [IsAuthenticated, IsTheatreAdmin]

    def post(self, request):
        from apps.movies.models import Theatre
        booking_id = request.data.get('booking_id')
        theatre_id = request.data.get('theatre_id')
        if not booking_id:
            return Response({"error": "Booking ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        if theatre_id:
            try:
                if request.user.role == 'Admin' or request.user.is_staff:
                    theatre = Theatre.objects.get(id=theatre_id)
                else:
                    theatre = Theatre.objects.get(id=theatre_id, manager=request.user)
            except Theatre.DoesNotExist:
                return Response({"error": "Theatre not found or you do not manage it."}, status=status.HTTP_404_NOT_FOUND)
        else:
            theatre = request.user.managed_theatres.first()
            if not theatre:
                theatre = Theatre.objects.first()

        try:
            booking = Booking.objects.select_related('user', 'show', 'show__movie').get(
                booking_id=booking_id,
                show__theatre=theatre
            )
        except Booking.DoesNotExist:
            return Response({
                "verified": False,
                "error": "Ticket not found or does not belong to this theatre."
            }, status=status.HTTP_404_NOT_FOUND)

        if booking.status != 'Confirmed':
            return Response({
                "verified": False,
                "booking_id": booking.booking_id,
                "status": booking.status,
                "error": f"Ticket booking is not confirmed (Status: {booking.status})."
            }, status=status.HTTP_400_BAD_REQUEST)

        if booking.is_used:
            return Response({
                "verified": False,
                "already_used": True,
                "booking_id": booking.booking_id,
                "user_name": booking.user.full_name,
                "movie_title": booking.show.movie.title if booking.show.movie else "Event/Sport",
                "seats": booking.seats_display,
                "error": "This ticket has ALREADY been scanned and used."
            }, status=status.HTTP_400_BAD_REQUEST)

        booking.is_used = True
        booking.save()

        Notification.objects.create(
            user=booking.user,
            title="Ticket Scanned 🎟️",
            message=f"Your ticket for {booking.show.movie.title if booking.show.movie else 'show'} has been scanned at the theatre."
        )

        return Response({
            "verified": True,
            "booking_id": booking.booking_id,
            "user_name": booking.user.full_name,
            "movie_title": booking.show.movie.title if booking.show.movie else "Event/Sport",
            "seats": booking.seats_display,
            "price": float(booking.total_price),
            "show_time": booking.show.start_time.strftime('%I:%M %p, %a %d %b'),
            "message": "Ticket verified successfully! Access granted."
        }, status=status.HTTP_200_OK)
