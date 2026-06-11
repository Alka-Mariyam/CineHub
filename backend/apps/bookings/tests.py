from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.authentication.models import Location, RewardPoints
from apps.movies.models import Movie, Theatre, Show, Screen
from apps.bookings.models import Seat, Booking, Reservation, Payment, GroupBooking, GroupBookingMember
from apps.bookings.tasks import expire_reservations

User = get_user_model()

class CineHubBookingSystemTests(TestCase):
    def setUp(self):
        # 1. Create Location
        self.location = Location.objects.create(country="India", state="Maharashtra", city="Mumbai", town="Andheri")

        # 2. Create Users
        self.user = User.objects.create_user(email="alice@test.com", full_name="Alice Test", password="password123")
        self.friend = User.objects.create_user(email="bob@test.com", full_name="Bob Friend", password="password123")

        # 3. Create Movie & Theatre & Show
        self.movie = Movie.objects.create(
            title="Interstellar",
            poster="http://example.com/poster.jpg",
            language="English",
            duration=169,
            genre="Sci-Fi",
            rating=9.2,
            votes=100
        )
        self.theatre = Theatre.objects.create(name="PVR Infiniti", location=self.location)
        self.show = Show.objects.create(
            movie=self.movie,
            theatre=self.theatre,
            start_time=timezone.now() + timedelta(days=2),
            end_time=timezone.now() + timedelta(days=2, hours=3),
            price=15.0
        )

        # 4. Generate seats for this show
        self.seat_a1 = Seat.objects.create(show=self.show, row_label="A", column_number=1, status="Available")
        self.seat_a2 = Seat.objects.create(show=self.show, row_label="A", column_number=2, status="Available")
        self.seat_a3 = Seat.objects.create(show=self.show, row_label="A", column_number=3, status="Available")

    def test_welcome_reward_points(self):
        # Serializer registration adds reward points. Let's test serializer creation.
        from apps.authentication.serializers import UserRegistrationSerializer
        data = {
            "email": "register_test@test.com",
            "full_name": "Reg Test",
            "phone_number": "7777777777",
            "password": "password123",
            "confirm_password": "password123"
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        u = serializer.save()
        self.assertEqual(u.total_reward_points, 100)

    def test_seat_reservation_flow(self):
        # Alice reserves seat A1 (Book Later feature)
        expires_at = self.show.start_time - timedelta(days=1)
        booking = Booking.objects.create(
            user=self.user,
            show=self.show,
            seats_display="A1",
            total_price=15.0,
            status="Pending"
        )
        reservation = Reservation.objects.create(
            user=self.user,
            show=self.show,
            booking=booking,
            seats_display="A1",
            expires_at=expires_at,
            status="Active"
        )
        
        self.seat_a1.status = "Reserved"
        self.seat_a1.reserved_by = self.user
        self.seat_a1.reserved_until = expires_at
        self.seat_a1.save()

        # Check seats state
        self.assertEqual(self.seat_a1.status, "Reserved")
        self.assertEqual(self.seat_a1.reserved_by, self.user)

        # Alice makes a payment checkout, confirming the booking
        payment = Payment.objects.create(booking=booking, method="UPI", status="Successful", amount=15.0)
        booking.status = "Confirmed"
        booking.save()
        
        reservation.status = "Confirmed"
        reservation.save()

        self.seat_a1.status = "Booked"
        self.seat_a1.reserved_by = None
        self.seat_a1.reserved_until = None
        self.seat_a1.save()

        # Check updated state
        self.assertEqual(booking.status, "Confirmed")
        self.assertEqual(reservation.status, "Confirmed")
        self.assertEqual(self.seat_a1.status, "Booked")

    def test_celery_task_reservation_expiration(self):
        # Alice reserves seat A2, but it has expired (expires_at is in the past)
        expired_time = timezone.now() - timedelta(minutes=5)
        booking = Booking.objects.create(
            user=self.user,
            show=self.show,
            seats_display="A2",
            total_price=15.0,
            status="Pending"
        )
        reservation = Reservation.objects.create(
            user=self.user,
            show=self.show,
            booking=booking,
            seats_display="A2",
            expires_at=expired_time,
            status="Active"
        )
        
        self.seat_a2.status = "Reserved"
        self.seat_a2.reserved_by = self.user
        self.seat_a2.reserved_until = expired_time
        self.seat_a2.save()

        self.assertEqual(self.seat_a2.status, "Reserved")

        # Execute Celery Expiration Task manually
        expire_reservations()

        # Refresh from database
        self.seat_a2.refresh_from_db()
        booking.refresh_from_db()
        reservation.refresh_from_db()

        # Verify that seat is released, reservation expired, and booking cancelled
        self.assertEqual(self.seat_a2.status, "Available")
        self.assertIsNone(self.seat_a2.reserved_by)
        self.assertEqual(booking.status, "Cancelled")
        self.assertEqual(reservation.status, "Expired")

    def test_group_booking_planner_flow(self):
        # Alice starts a Group Booking
        gb = GroupBooking.objects.create(organizer=self.user, show=self.show, invite_code="CODE123", status="Active")
        
        # Alice selects A1
        GroupBookingMember.objects.create(group_booking=gb, user=self.user, name="Alice", seats_display="A1", status="Selected")
        self.seat_a1.status = "Reserved"
        self.seat_a1.reserved_by = self.user
        self.seat_a1.save()

        # Bob joins group and selects A2
        GroupBookingMember.objects.create(group_booking=gb, user=self.friend, name="Bob", seats_display="A2", status="Selected")
        self.seat_a2.status = "Reserved"
        self.seat_a2.reserved_by = self.friend
        self.seat_a2.save()

        # Verify both seats are reserved under group booking members
        self.assertEqual(gb.members.count(), 2)
        self.assertEqual(self.seat_a1.status, "Reserved")
        self.assertEqual(self.seat_a2.status, "Reserved")

    def test_promo_code_validation(self):
        # 1. CINE50 (50% off base price, max 150)
        # 2. BOGOPASS (Buy 1 Get 1 free, requires >= 2 seats)
        # 3. RUPAY100 (₹100 off, requires min ₹300)
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        booking = Booking.objects.create(
            user=self.user,
            show=self.show,
            seats_display="A1,A2",
            total_price=300.0,
            status="Pending"
        )
        
        # Validate CINE50
        response = client.post('/api/validate-promo/', {
            "booking_id": booking.booking_id,
            "promo_code": "CINE50"
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["discount"], 150.0) # 300 * 0.5 = 150
        
        # Validate BOGOPASS
        response = client.post('/api/validate-promo/', {
            "booking_id": booking.booking_id,
            "promo_code": "BOGOPASS"
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["discount"], 15.0) # show.price is 15.0
        
        # Validate RUPAY100
        response = client.post('/api/validate-promo/', {
            "booking_id": booking.booking_id,
            "promo_code": "RUPAY100"
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["discount"], 100.0)

    def test_loyalty_point_redemptions_and_earning(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        # Initialize default config
        from apps.bookings.models import get_cinepoints_config
        config = get_cinepoints_config()
        
        # Give Alice some starting points (e.g. 500 points for Gold)
        RewardPoints.objects.create(user=self.user, points=500, description="Loyalty Seeding")
        self.user.refresh_from_db()
        self.assertEqual(self.user.loyalty_tier, "Gold")
        self.assertEqual(self.user.total_reward_points, 500)
        
        booking = Booking.objects.create(
            user=self.user,
            show=self.show,
            seats_display="A3",
            total_price=200.0,
            status="Pending"
        )
        
        # Perform payment with point redemption
        response = client.post('/api/payment/', {
            "booking_id": booking.booking_id,
            "method": "UPI",
            "redeem_points": 250
        })
        self.assertEqual(response.status_code, 200)
        # Discount of 250 points is ₹30
        self.assertEqual(response.data["points_discount"], 30.0)
        
        # Check that user points were deducted and welcome bonus awarded
        # Welcome Points registration (100) + Gold Seeding (500) = 600 points total.
        # Deduct redeemed points: 250.
        # Earn points: 10 per ticket + 50 first booking bonus = 60 points.
        # Expected final points: 500 - 250 + 60 = 310 points
        self.user.refresh_from_db()
        self.assertEqual(self.user.total_reward_points, 310)

    def test_stripe_checkout_and_confirm(self):
        from unittest.mock import patch
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.user)

        booking = Booking.objects.create(
            user=self.user,
            show=self.show,
            seats_display="A3",
            total_price=200.0,
            status="Pending"
        )

        class MockSession:
            url = "https://checkout.stripe.com/pay/mock"
            payment_status = "paid"
            id = "sess_123"
            payment_intent = "pi_123"
            metadata = {
                "booking_id": booking.booking_id,
                "promo_code": "",
                "gift_card_code": "",
                "redeem_points": "0",
                "user_id": str(self.user.id)
            }

        with patch('stripe.checkout.Session.create') as mock_create, \
             patch('stripe.checkout.Session.retrieve') as mock_retrieve:
            mock_create.return_value = MockSession()
            mock_retrieve.return_value = MockSession()

            # 1. Test stripe-checkout endpoint
            response = client.post('/api/stripe-checkout/', {
                "booking_id": booking.booking_id
            })
            self.assertEqual(response.status_code, 200)
            self.assertIn("session_url", response.data)
            self.assertEqual(response.data["session_url"], "https://checkout.stripe.com/pay/mock")
            mock_create.assert_called_once()

            # 2. Test stripe-confirm endpoint
            response = client.post('/api/stripe-confirm/', {
                "booking_id": booking.booking_id,
                "session_id": "sess_123"
            })
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["success"], True)

            # 3. Check booking is confirmed
            booking.refresh_from_db()
            self.assertEqual(booking.status, "Confirmed")


class CineHubAdminSystemTests(TestCase):
    def setUp(self):
        # 1. Create Location
        self.location = Location.objects.create(country="India", state="Maharashtra", city="Mumbai", town="Andheri")

        # 2. Create Users
        self.customer = User.objects.create_user(email="customer@test.com", full_name="Customer User", password="password123", role="User")
        self.manager = User.objects.create_user(email="manager@test.com", full_name="Manager User", password="password123", role="Manager")

        # 3. Create Theatre and associate manager
        self.theatre = Theatre.objects.create(name="PVR Infiniti", location=self.location)
        self.theatre.manager = self.manager
        self.theatre.save()

        # 4. Create Movie
        self.movie = Movie.objects.create(
            title="Singham Again",
            poster="http://example.com/singham.jpg",
            language="Hindi",
            duration=150,
            genre="Action",
            rating=8.0,
            votes=50
        )

        # 5. Create Screen with layout
        self.layout_data = {
            "A": "Silver",
            "B": "Gold",
            "C": "Platinum"
        }
        self.screen = Screen.objects.create(
            theatre=self.theatre,
            name="Screen 1",
            total_seats=30,
            seat_layout=self.layout_data
        )

        # 6. Create Show
        self.show = Show.objects.create(
            movie=self.movie,
            theatre=self.theatre,
            screen=self.screen,
            start_time=timezone.now() + timedelta(days=2),
            end_time=timezone.now() + timedelta(days=2, hours=3),
            price=200.0
        )

    def test_admin_authorization(self):
        from rest_framework.test import APIClient
        client = APIClient()

        # Customer should be forbidden
        client.force_authenticate(user=self.customer)
        response = client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, 403)

        # Manager should be allowed
        client.force_authenticate(user=self.manager)
        response = client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, 200)

    def test_admin_dashboard_stats(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.manager)

        # Create booking to verify stat updates
        booking = Booking.objects.create(
            user=self.customer,
            show=self.show,
            seats_display="A1,A2",
            total_price=300.0,
            status="Confirmed"
        )

        response = client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["theatre_name"], "PVR Infiniti")
        self.assertEqual(response.data["total_movies"], 1)
        self.assertEqual(response.data["total_screens"], 1)
        self.assertEqual(response.data["total_shows"], 1)
        self.assertEqual(response.data["total_bookings"], 1)
        self.assertEqual(response.data["total_revenue"], 300.0)

    def test_admin_verify_ticket(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.manager)

        # Confirmed booking
        booking = Booking.objects.create(
            user=self.customer,
            show=self.show,
            seats_display="A3",
            total_price=150.0,
            status="Confirmed"
        )

        # 1. Invalid booking verification
        response = client.post('/api/admin/verify-ticket/', {"booking_id": "INVALID-ID"})
        self.assertEqual(response.status_code, 404)

        # 2. Valid verification
        response = client.post('/api/admin/verify-ticket/', {"booking_id": booking.booking_id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["verified"], True)
        self.assertEqual(response.data["booking_id"], booking.booking_id)

        # Check in DB
        booking.refresh_from_db()
        self.assertTrue(booking.is_used)

        # 3. Verify already scanned ticket
        response = client.post('/api/admin/verify-ticket/', {"booking_id": booking.booking_id})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["verified"], False)
        self.assertIn("ALREADY", response.data["error"])

    def test_admin_screen_and_show_seat_generation(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.manager)

        # Create new screen through API
        response = client.post('/api/admin/screens/', {
            "name": "Screen 2",
            "total_seats": 20,
            "seat_layout": {"A": "Silver", "B": "Platinum"}
        }, format='json')
        self.assertEqual(response.status_code, 201)
        new_screen_id = response.data["id"]

        # Create new show through API
        response = client.post('/api/admin/shows/', {
            "movie": self.movie.id,
            "screen": new_screen_id,
            "start_time": (timezone.now() + timedelta(days=5)).isoformat(),
            "end_time": (timezone.now() + timedelta(days=5, hours=2)).isoformat(),
            "price": "180.00"
        }, format='json')
        self.assertEqual(response.status_code, 201)
        new_show_id = response.data["id"]

        # Verify seats generated: 2 rows (A, B) * 10 columns = 20 seats
        from apps.bookings.models import Seat
        seats = Seat.objects.filter(show_id=new_show_id)
        self.assertEqual(seats.count(), 20)

        # Check pricing categories
        silver_seats = seats.filter(category="Silver")
        platinum_seats = seats.filter(category="Platinum")
        self.assertEqual(silver_seats.count(), 10)
        self.assertEqual(platinum_seats.count(), 10)
        self.assertEqual(float(silver_seats.first().price), 150.00)
        self.assertEqual(float(platinum_seats.first().price), 350.00)

    def test_admin_multitheatre_management(self):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=self.manager)

        # 1. Create a second theatre for the manager
        theatre2 = Theatre.objects.create(
            name="INOX Pune",
            location=self.location,
            manager=self.manager
        )

        # 2. Get all theatres (should return 2 theatres)
        response = client.get('/api/admin/theatres/')
        self.assertEqual(response.status_code, 200)
        # Handle DRF list pagination or raw list response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)

        # 3. Create a screen under theatre2
        response = client.post('/api/admin/screens/', {
            "name": "Screen 3",
            "total_seats": 40,
            "theatre": theatre2.id,
            "seat_layout": {"A": "Silver"}
        }, format='json')
        self.assertEqual(response.status_code, 201)

        # 4. Fetch screens filtering by theatre2 (should only return Screen 3)
        response = client.get(f'/api/admin/screens/?theatre_id={theatre2.id}')
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Screen 3")

        # 5. Fetch screens filtering by theatre1 (should only return Screen 1)
        response = client.get(f'/api/admin/screens/?theatre_id={self.theatre.id}')
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Screen 1")


