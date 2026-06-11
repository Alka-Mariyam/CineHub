from rest_framework import serializers
from .models import Venue, Event, SportsEvent

class VenueSerializer(serializers.ModelSerializer):
    city = serializers.CharField(source='location.city', read_only=True)

    class Meta:
        model = Venue
        fields = ['id', 'name', 'location', 'city', 'capacity', 'address']


class EventSerializer(serializers.ModelSerializer):
    venue_detail = VenueSerializer(source='venue', read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'category', 'banner', 'description', 'date', 'venue', 'venue_detail', 'available_seats', 'price', 'created_at']


class SportsEventSerializer(serializers.ModelSerializer):
    venue_detail = VenueSerializer(source='venue', read_only=True)

    class Meta:
        model = SportsEvent
        fields = [
            'id', 'title', 'banner', 'description', 'date', 'stadium_name',
            'stadium_details', 'match_timings', 'seating_information',
            'venue', 'venue_detail', 'available_seats', 'price', 'created_at'
        ]
