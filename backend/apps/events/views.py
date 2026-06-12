from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Venue, Event, SportsEvent
from .serializers import VenueSerializer, EventSerializer, SportsEventSerializer

class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all().select_related('location').order_by('name')
    serializer_class = VenueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['location']
    search_fields = ['name', 'address']

    def get_queryset(self):
        queryset = super().get_queryset()
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(location__city__iexact=city)
        return queryset


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().select_related('venue', 'venue__location').order_by('-date')
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'description', 'category']
    ordering_fields = ['price', 'date']

    def get_queryset(self):
        queryset = super().get_queryset()
        city = self.request.query_params.get('city')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        date_str = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if city:
            queryset = queryset.filter(venue__location__city__iexact=city)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if date_str:
            queryset = queryset.filter(date=date_str)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset


class SportsEventViewSet(viewsets.ModelViewSet):
    queryset = SportsEvent.objects.all().select_related('venue', 'venue__location').order_by('-date')
    serializer_class = SportsEventSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'stadium_name']
    ordering_fields = ['price', 'date']

    def get_queryset(self):
        queryset = super().get_queryset()
        city = self.request.query_params.get('city')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        date_str = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if city:
            queryset = queryset.filter(venue__location__city__iexact=city)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if date_str:
            queryset = queryset.filter(date=date_str)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset
