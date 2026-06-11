"""
Celery tasks for automatic reservation expiry.

Reservations that pass their `expires_at` datetime are auto-expired:
  - Reservation status → 'Expired'
  - Associated Booking status → 'Cancelled'
  - Reserved Seats released back to 'Available'

Schedule this task periodically (e.g. every 30 minutes) using Celery Beat.
"""

from celery import shared_task
from django.utils import timezone
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


@shared_task(name='bookings.expire_reservations')
def expire_reservations():
    """
    Finds all active reservations past their expiry time and releases them.
    
    This task should be scheduled to run periodically via Celery Beat.
    Example beat schedule (in settings.py):
    
        CELERY_BEAT_SCHEDULE = {
            'expire-reservations-every-30-min': {
                'task': 'bookings.expire_reservations',
                'schedule': crontab(minute='*/30'),
            },
        }
    """
    from .models import Reservation, Seat

    now = timezone.now()
    expired_reservations = Reservation.objects.filter(
        status='Active',
        expires_at__lte=now
    ).select_related('booking', 'show')

    expired_count = 0

    for reservation in expired_reservations:
        try:
            with transaction.atomic():
                # 1. Mark reservation as expired
                reservation.status = 'Expired'
                reservation.save(update_fields=['status'])

                # 2. Cancel the associated booking
                if reservation.booking:
                    reservation.booking.status = 'Cancelled'
                    reservation.booking.save(update_fields=['status'])

                # 3. Release the reserved seats back to Available
                seat_codes = [s.strip() for s in reservation.seats_display.split(',')]
                for code in seat_codes:
                    if len(code) >= 2:
                        row_label = code[0]
                        try:
                            col_number = int(code[1:])
                        except ValueError:
                            continue

                        Seat.objects.filter(
                            show=reservation.show,
                            row_label=row_label,
                            column_number=col_number,
                            status='Reserved'
                        ).update(
                            status='Available',
                            reserved_by=None,
                            reserved_until=None
                        )

                expired_count += 1
                logger.info(
                    f"Expired reservation {reservation.id} for user {reservation.user.email} "
                    f"- Seats: {reservation.seats_display}"
                )

        except Exception as e:
            logger.error(f"Failed to expire reservation {reservation.id}: {str(e)}")

    logger.info(f"Reservation expiry task completed. Expired {expired_count} reservation(s).")
    return f"Expired {expired_count} reservation(s)"


@shared_task(name='bookings.send_expiry_reminder')
def send_expiry_reminder():
    """
    Sends a reminder notification for reservations expiring within the next 24 hours.
    This could integrate with email/SMS in production.
    """
    from .models import Reservation
    from datetime import timedelta

    now = timezone.now()
    upcoming_expiry = now + timedelta(hours=24)

    expiring_soon = Reservation.objects.filter(
        status='Active',
        expires_at__lte=upcoming_expiry,
        expires_at__gt=now
    ).select_related('user', 'show')

    reminder_count = 0
    for reservation in expiring_soon:
        # In production, send email/push notification here
        logger.info(
            f"REMINDER: Reservation for {reservation.user.email} "
            f"expires at {reservation.expires_at.strftime('%Y-%m-%d %H:%M')} "
            f"- Seats: {reservation.seats_display}"
        )
        reminder_count += 1

    logger.info(f"Expiry reminder task completed. Sent {reminder_count} reminder(s).")
    return f"Sent {reminder_count} reminder(s)"


def _send_email_thread(booking_id):
    """
    Worker function to send email in a background thread.
    """
    from django.db import close_old_connections
    from .models import Booking
    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings
    import base64
    from email.mime.image import MIMEImage
    import logging

    thread_logger = logging.getLogger(__name__)
    thread_logger.info(f"Background thread starting email sending for booking {booking_id}...")
    close_old_connections()

    try:
        booking = Booking.objects.select_related(
            'user', 'show', 'show__movie', 'show__event', 
            'show__sports_event', 'show__theatre', 'show__venue'
        ).get(booking_id=booking_id)
    except Booking.DoesNotExist:
        thread_logger.error(f"Booking {booking_id} not found for email task.")
        close_old_connections()
        return

    # Prevent duplicate emails
    if booking.email_sent:
        thread_logger.info(f"Email already successfully sent for booking {booking_id}. Skipping duplicate send.")
        close_old_connections()
        return

    user = booking.user
    show = booking.show
    show_title = show.movie.title if show.movie else (show.event.title if show.event else show.sports_event.title)
    language = show.movie.language if show.movie else "English"
    category = "Movie" if show.movie else ("Event" if show.event else "Sport")
    location_name = show.theatre.name if show.theatre else (show.venue.name if show.venue else "CineHub Partner Location")

    date_str = show.start_time.strftime('%Y-%m-%d')
    time_str = show.start_time.strftime('%I:%M %p')

    subject = "🎟️ Booking Confirmed - CineHub"

    text_content = f"Dear {user.full_name},\n\n" \
                   f"Your booking has been successfully confirmed.\n\n" \
                   f"Booking Details:\n" \
                   f"* Booking ID: {booking.booking_id}\n" \
                   f"* Movie/Event: {show_title}\n" \
                   f"* Theatre/Venue: {location_name}\n" \
                   f"* Date: {date_str}\n" \
                   f"* Time: {time_str}\n" \
                   f"* Seats: {booking.seats_display}\n" \
                   f"* Total Amount Paid: ₹{booking.total_price}\n\n" \
                   f"Your QR Code ticket is attached below and can be used for entry verification at the venue.\n\n" \
                   f"Thank you for choosing CineHub.\n\n" \
                   f"Regards,\n" \
                   f"CineHub Team"

    html_content = f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0F172A; color: #FFFFFF; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <h2 style="color: #EC4899; text-align: center; margin-top: 0; font-size: 24px;">🎟️ Booking Confirmed - CineHub</h2>
        <hr style="border-color: rgba(255,255,255,0.08); margin: 20px 0;" />
        <p style="color: #E2E8F0; font-size: 15px;">Dear <strong>{user.full_name}</strong>,</p>
        <p style="color: #E2E8F0; font-size: 15px;">Your booking has been successfully confirmed.</p>
        
        <p style="color: #E2E8F0; font-size: 15px; font-weight: bold; margin-top: 20px;">Booking Details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0; color: #E2E8F0; font-size: 14px;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Booking ID</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #38BDF8;">{booking.booking_id}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Movie/Event</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #FACC15;">{show_title} ({language})</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Theatre/Venue</td>
            <td style="padding: 10px 0; text-align: right;">{location_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Date</td>
            <td style="padding: 10px 0; text-align: right;">{date_str}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Time</td>
            <td style="padding: 10px 0; text-align: right;">{time_str}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px 0; color: #94A3B8;">Seats</td>
            <td style="padding: 10px 0; text-align: right; color: #10B981; font-weight: bold;">{booking.seats_display}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #94A3B8;">Total Amount Paid</td>
            <td style="padding: 10px 0; text-align: right; color: #EC4899; font-weight: bold; font-size: 16px;">₹{booking.total_price}</td>
          </tr>
        </table>
        
        <p style="color: #E2E8F0; font-size: 15px; margin-top: 20px;">Your QR Code ticket is attached below and can be used for entry verification at the venue.</p>
        
        <div style="text-align: center; margin: 30px 0; background: #FFFFFF; padding: 20px; border-radius: 12px; display: block;">
          <h4 style="color: #0B0F19; margin: 0 0 12px 0; font-size: 16px; font-weight: 800;">Digital Entry Ticket QR</h4>
          <img src="cid:qrcode" alt="QR Code Ticket" style="width: 150px; height: 150px; display: block; margin: 0 auto; background: #FFF;" />
          <span style="font-size: 11px; color: #64748B; margin-top: 8px; display: block;">Scan at cinema entry counter</span>
        </div>
        
        <p style="font-size: 14px; color: #E2E8F0; margin-top: 25px;">
          Thank you for choosing CineHub.
        </p>
        <p style="font-size: 14px; color: #E2E8F0; margin-top: 15px;">
          Regards,<br>
          <strong>CineHub Team</strong>
        </p>
      </div>
    </body>
    </html>
    """

    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
    msg.attach_alternative(html_content, "text/html")

    try:
        qr_code_b64 = booking.qr_code_url
        if qr_code_b64 and 'base64,' in qr_code_b64:
            header, base64_data = qr_code_b64.split('base64,')
            img_data = base64.b64decode(base64_data)
            
            img = MIMEImage(img_data)
            img.add_header('Content-ID', '<qrcode>')
            img.add_header('Content-Disposition', 'inline', filename='ticket_qr.png')
            msg.attach(img)
    except Exception as e:
        thread_logger.error(f"Failed to attach QR code for booking {booking_id}: {str(e)}")

    # Use Console backend if credentials are empty to avoid failure during testing
    from django.core.mail import get_connection
    delivery_status = 'Sent'
    if not getattr(settings, 'EMAIL_HOST_USER', ''):
        thread_logger.warning("EMAIL_HOST_USER is empty. Using console email backend as fallback.")
        connection = get_connection(backend='django.core.mail.backends.console.EmailBackend')
        msg.connection = connection
        delivery_status = 'Sent (Console Fallback)'

    try:
        msg.send(fail_silently=False)
        booking.email_sent = True
        booking.email_delivery_status = delivery_status
        booking.email_error = None
        booking.save(update_fields=['email_sent', 'email_delivery_status', 'email_error'])
        thread_logger.info(f"Confirmation email successfully sent for booking {booking_id} (Status: {delivery_status}).")
    except Exception as exc:
        thread_logger.error(f"SMTP error sending email for booking {booking_id}: {str(exc)}")
        booking.email_delivery_status = 'Failed'
        booking.email_error = str(exc)
        booking.save(update_fields=['email_delivery_status', 'email_error'])
    
    close_old_connections()


@shared_task(
    name='bookings.send_async_confirmation_email',
    bind=True,
    max_retries=3,
    default_retry_delay=10
)
def send_async_confirmation_email(self, booking_id):
    """
    Asynchronously sends the rich HTML booking confirmation email to the user.
    Uses a background thread to prevent blocking in eager Celery settings
    which can trigger SQLite database locks.
    """
    import threading
    thread = threading.Thread(target=_send_email_thread, args=(booking_id,))
    thread.daemon = True
    thread.start()
    return "Email thread started"
