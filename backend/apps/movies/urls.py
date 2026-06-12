from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MovieViewSet, TheatreViewSet, ShowViewSet, ReviewViewSet, WatchlistViewSet,
    ScreenViewSet
)

router = DefaultRouter()
router.register(r'movies', MovieViewSet, basename='movie')
router.register(r'theatres', TheatreViewSet, basename='theatre')
router.register(r'shows', ShowViewSet, basename='show')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'watchlist', WatchlistViewSet, basename='watchlist')
router.register(r'screens', ScreenViewSet, basename='screen')

urlpatterns = [
    path('', include(router.urls)),
]
