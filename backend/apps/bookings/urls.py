from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views as bookings_views
from .views import (
    SeatLayoutView, ReserveSeatsView, FinalizePaymentView, StripeCheckoutView,
    StripeConfirmView, ResendConfirmationEmailView,
    GroupBookingCreateView, GroupBookingDetailView, GroupBookingJoinView,
    GroupBookingPayView, GiftCardViewSet, ValidatePromoView,
    ValidateGiftCardView, CinePointsConfigView, LoyaltyStatsView
)

router = DefaultRouter()
router.register(r'giftcards', GiftCardViewSet, basename='giftcard')
router.register(r'bookings', bookings_views.BookingViewSet, basename='booking')
router.register(r'admin/theatres', bookings_views.AdminTheatreViewSet, basename='admin-theatres')
router.register(r'admin/movies', bookings_views.AdminMovieViewSet, basename='admin-movies')
router.register(r'admin/screens', bookings_views.AdminScreenViewSet, basename='admin-screens')
router.register(r'admin/shows', bookings_views.AdminShowViewSet, basename='admin-shows')
router.register(r'admin/bookings', bookings_views.AdminBookingViewSet, basename='admin-bookings')

urlpatterns = [
    path('', include(router.urls)),
    path('seats/', SeatLayoutView.as_view(), name='seat_layout'),
    path('reserve/', ReserveSeatsView.as_view(), name='reserve_seats'),
    path('payment/', FinalizePaymentView.as_view(), name='finalize_payment'),
    path('stripe-checkout/', StripeCheckoutView.as_view(), name='stripe_checkout'),
    path('stripe-confirm/', StripeConfirmView.as_view(), name='stripe_confirm'),

    path('resend-email/<str:booking_id>/', ResendConfirmationEmailView.as_view(), name='resend_email'),
    path('validate-promo/', ValidatePromoView.as_view(), name='validate_promo'),
    path('validate-giftcard/', ValidateGiftCardView.as_view(), name='validate_giftcard'),
    path('loyalty/config/', CinePointsConfigView.as_view(), name='loyalty_config'),
    path('loyalty/stats/', LoyaltyStatsView.as_view(), name='loyalty_stats'),
    
    # Group bookings
    path('group/create/', GroupBookingCreateView.as_view(), name='group_create'),
    path('group/join/', GroupBookingJoinView.as_view(), name='group_join'),
    path('group/pay/', GroupBookingPayView.as_view(), name='group_pay'),
    path('group/detail/<str:invite_code>/', GroupBookingDetailView.as_view(), name='group_detail'),

    # Admin endpoints
    path('admin/dashboard/', bookings_views.ManagerDashboardStatsView.as_view(), name='admin_dashboard_stats'),
    path('admin/verify-ticket/', bookings_views.AdminVerifyTicketView.as_view(), name='admin_verify_ticket'),
]
