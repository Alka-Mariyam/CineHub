from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Movie, Theatre, Show, Review, Watchlist, Screen
from apps.authentication.serializers import UserSerializer

User = get_user_model()

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'poster', 'trailer', 'language', 'duration',
            'genre', 'rating', 'votes', 'synopsis', 'cast', 'crew',
            'mood', 'is_premiere', 'is_new_release', 'is_most_booked',
            'is_trending', 'is_recommended', 'created_at'
        ]


class TheatreSerializer(serializers.ModelSerializer):
    city = serializers.CharField(source='location.city', read_only=True)

    class Meta:
        model = Theatre
        fields = [
            'id', 'name', 'location', 'city', 'brand', 'coordinates',
            'status', 'address', 'contact_details', 'facilities', 'manager'
        ]
        extra_kwargs = {
            'manager': {'required': False, 'allow_null': True},
            'status': {'required': False}
        }


class ScreenSerializer(serializers.ModelSerializer):
    theatre_name = serializers.CharField(source='theatre.name', read_only=True)

    class Meta:
        model = Screen
        fields = ['id', 'theatre', 'theatre_name', 'name', 'total_seats', 'seat_layout']
        extra_kwargs = {
            'theatre': {'required': False}
        }


class ShowSerializer(serializers.ModelSerializer):
    movie_detail = MovieSerializer(source='movie', read_only=True)
    theatre_detail = TheatreSerializer(source='theatre', read_only=True)
    screen_detail = ScreenSerializer(source='screen', read_only=True)
    
    # Event and sports helpers
    event_title = serializers.CharField(source='event.title', read_only=True)
    sports_title = serializers.CharField(source='sports_event.title', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)

    class Meta:
        model = Show
        fields = [
            'id', 'movie', 'movie_detail', 'event', 'event_title',
            'sports_event', 'sports_title', 'theatre', 'theatre_detail',
            'screen', 'screen_detail',
            'venue', 'venue_name', 'start_time', 'end_time', 'price'
        ]


class ReviewSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    sports_title = serializers.CharField(source='sports_event.title', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_detail', 'movie', 'movie_title',
            'event', 'event_title', 'sports_event', 'sports_title',
            'rating', 'comment', 'sentiment', 'created_at'
        ]
        read_only_fields = ['user', 'sentiment']


class WatchlistSerializer(serializers.ModelSerializer):
    movie_detail = MovieSerializer(source='movie', read_only=True)
    event_detail = serializers.SerializerMethodField()
    sports_detail = serializers.SerializerMethodField()

    class Meta:
        model = Watchlist
        fields = ['id', 'user', 'movie', 'movie_detail', 'event', 'event_detail', 'sports_event', 'sports_detail', 'created_at']
        read_only_fields = ['user']

    def get_event_detail(self, obj):
        from apps.events.serializers import EventSerializer
        if obj.event:
            return EventSerializer(obj.event).data
        return None

    def get_sports_detail(self, obj):
        from apps.events.serializers import SportsEventSerializer
        if obj.sports_event:
            return SportsEventSerializer(obj.sports_event).data
        return None
