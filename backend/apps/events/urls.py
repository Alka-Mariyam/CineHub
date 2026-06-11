from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, EventViewSet, SportsEventViewSet

router = DefaultRouter()
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'events', EventViewSet, basename='event')
router.register(r'sports', SportsEventViewSet, basename='sports')

urlpatterns = [
    path('', include(router.urls)),
]
