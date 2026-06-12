from rest_framework import viewsets, status, filters, generics
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.db.models import Avg, Q, Count, Sum
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Movie, Theatre, Show, Review, Watchlist, Screen
from .serializers import (
    MovieSerializer, TheatreSerializer, ShowSerializer, ReviewSerializer, WatchlistSerializer, ScreenSerializer
)
from apps.bookings.models import Booking, Payment, Seat
from apps.bookings.serializers import BookingSerializer
from django.contrib.auth import get_user_model
from apps.authentication.serializers import UserSerializer

User = get_user_model()

class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all().order_by('-created_at')
    serializer_class = MovieSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['language', 'mood', 'is_premiere', 'is_new_release', 'is_most_booked', 'is_trending', 'is_recommended']
    search_fields = ['title', 'genre', 'synopsis']
    ordering_fields = ['rating', 'votes', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        city = self.request.query_params.get('city')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        genre = self.request.query_params.get('genre')
        date_str = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if city:
            # Only return movies showing in theatres in the selected city
            queryset = queryset.filter(shows__theatre__location__city__iexact=city).distinct()
        
        if min_price or max_price:
            price_query = Q()
            if min_price:
                price_query &= Q(shows__price__gte=min_price)
            if max_price:
                price_query &= Q(shows__price__lte=max_price)
            queryset = queryset.filter(price_query).distinct()

        if genre:
            queryset = queryset.filter(genre__icontains=genre)

        if date_str:
            queryset = queryset.filter(shows__start_time__date=date_str).distinct()
        if start_date:
            queryset = queryset.filter(shows__start_time__date__gte=start_date).distinct()
        if end_date:
            queryset = queryset.filter(shows__start_time__date__lte=end_date).distinct()

        return queryset

    @action(detail=False, methods=['get'])
    def mood_recommendations(self, request):
        mood = request.query_params.get('mood')
        if not mood:
            return Response({"error": "Mood parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        movies = Movie.objects.filter(mood__iexact=mood).order_by('-rating')[:6]
        serializer = self.get_serializer(movies, many=True)
        return Response(serializer.data)


class TheatreViewSet(viewsets.ModelViewSet):
    queryset = Theatre.objects.all().select_related('location').order_by('name')
    serializer_class = TheatreSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['location', 'brand']
    search_fields = ['name', 'brand']

    def get_queryset(self):
        queryset = super().get_queryset()
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(location__city__iexact=city)
        return queryset


class ShowViewSet(viewsets.ModelViewSet):
    queryset = Show.objects.all().select_related(
        'movie', 
        'theatre', 
        'theatre__location', 
        'screen', 
        'screen__theatre', 
        'event', 
        'sports_event', 
        'venue', 
        'venue__location'
    ).order_by('start_time')
    serializer_class = ShowSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['movie', 'event', 'sports_event', 'theatre', 'venue']

    def get_queryset(self):
        queryset = super().get_queryset()
        date_str = self.request.query_params.get('date')  # YYYY-MM-DD
        city = self.request.query_params.get('city')

        if date_str:
            queryset = queryset.filter(start_time__date=date_str)
        
        if city:
            queryset = queryset.filter(
                Q(theatre__location__city__iexact=city) | 
                Q(venue__location__city__iexact=city)
            )

        # Filters by budget
        max_budget = self.request.query_params.get('max_budget')
        if max_budget:
            queryset = queryset.filter(price__lte=max_budget)

        return queryset


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().select_related('user', 'movie', 'event', 'sports_event').order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['movie', 'event', 'sports_event']

    def perform_create(self, serializer):
        comment = self.request.data.get('comment', '').lower()
        
        # Simple sentiment keywords classifier
        pos_words = ['good', 'love', 'amazing', 'great', 'excellent', 'nice', 'awesome', 'best', 'superb', 'enjoyed', 'thrilling', 'fantastic', 'wonderful', 'fun']
        neg_words = ['bad', 'waste', 'worst', 'boring', 'poor', 'hate', 'disappointed', 'terrible', 'slow', 'predictable', 'crap', 'garbage', 'horrible', 'dull']
        
        pos_count = sum(1 for w in pos_words if w in comment)
        neg_count = sum(1 for w in neg_words if w in comment)

        if pos_count > neg_count:
            sentiment = 'Positive'
        elif neg_count > pos_count:
            sentiment = 'Negative'
        else:
            sentiment = 'Neutral'

        serializer.save(user=self.request.user, sentiment=sentiment)
        
        # Recalculate average rating for target movie/event/sports
        movie = serializer.validated_data.get('movie')
        event = serializer.validated_data.get('event')
        sports_event = serializer.validated_data.get('sports_event')

        if movie:
            avg_rating = Review.objects.filter(movie=movie).aggregate(Avg('rating'))['rating__avg']
            votes = Review.objects.filter(movie=movie).count()
            movie.rating = round(avg_rating, 1) if avg_rating else 0.0
            movie.votes = votes
            movie.save()
        elif event:
            # Event average calculation can be handled if needed
            pass
        elif sports_event:
            # Sports average calculation
            pass

    @action(detail=False, methods=['get'])
    def insights(self, request):
        movie_id = request.query_params.get('movie')
        event_id = request.query_params.get('event')
        sports_id = request.query_params.get('sports_event')

        query = Q()
        if movie_id:
            query = Q(movie_id=movie_id)
        elif event_id:
            query = Q(event_id=event_id)
        elif sports_id:
            query = Q(sports_event_id=sports_id)
        else:
            return Response({"error": "Specify movie, event, or sports_event ID."}, status=status.HTTP_400_BAD_REQUEST)

        reviews = Review.objects.filter(query)
        total = reviews.count()
        if total == 0:
            return Response({
                "total_reviews": 0,
                "overall_sentiment": "No Reviews",
                "average_rating": 0,
                "positive_percentage": 0,
                "negative_percentage": 0
            })

        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
        sentiments = reviews.values('sentiment').annotate(count=Count('sentiment'))
        
        pos_count = next((s['count'] for s in sentiments if s['sentiment'] == 'Positive'), 0)
        neg_count = next((s['count'] for s in sentiments if s['sentiment'] == 'Negative'), 0)
        neu_count = next((s['count'] for s in sentiments if s['sentiment'] == 'Neutral'), 0)

        pos_pct = round((pos_count / total) * 100)
        neg_pct = round((neg_count / total) * 100)

        if pos_pct > 60:
            overall = "Overwhelmingly Positive"
        elif pos_pct > 40:
            overall = "Mostly Positive"
        elif neg_pct > 50:
            overall = "Mostly Negative"
        elif pos_pct > 25 and neg_pct > 25:
            overall = "Mixed"
        else:
            overall = "Neutral"

        return Response({
            "total_reviews": total,
            "overall_sentiment": overall,
            "average_rating": round(avg_rating, 1) if avg_rating else 0.0,
            "positive_percentage": pos_pct,
            "negative_percentage": neg_pct,
            "neutral_percentage": 100 - (pos_pct + neg_pct)
        })


class WatchlistViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user).select_related(
            'movie', 'event', 'event__venue', 'event__venue__location',
            'sports_event', 'sports_event__venue', 'sports_event__venue__location'
        ).order_by('-created_at')

    def perform_create(self, serializer):
        # Prevent duplicate watchlist entries
        movie = serializer.validated_data.get('movie')
        event = serializer.validated_data.get('event')
        sports_event = serializer.validated_data.get('sports_event')

        exists = Watchlist.objects.filter(
            user=self.request.user,
            movie=movie,
            event=event,
            sports_event=sports_event
        ).exists()

        if exists:
            # Simple pass or exception
            return
        serializer.save(user=self.request.user)


class ScreenViewSet(viewsets.ModelViewSet):
    serializer_class = ScreenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Screen.objects.all().select_related('theatre', 'theatre__location')
        if user.role == 'Admin' or user.is_staff:
            return qs
        elif user.role == 'Manager':
            return qs.filter(theatre__manager=user)
        return Screen.objects.none()

    def perform_create(self, serializer):
        serializer.save()


# Admin dashboard and related admin views removed for revert


# Admin email update view removed for revert


# Admin user list view removed for revert


# Admin theatre approval view removed for revert


# Admin reports view removed for revert


# Admin manager viewset removed for revert


# Manager dashboard view removed for revert


# NOTE: Seat layout creation block removed during revert to original state.

        return Response(ShowSerializer(show).data, status=status.HTTP_201_CREATED)


class ManagerQRVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'Manager' and not request.user.is_staff:
            return Response({"error": "Unauthorized access."}, status=status.HTTP_403_FORBIDDEN)

        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({"error": "Booking ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Support payload extraction if raw QR data is passed
        if "CineHub" in booking_id:
            # Quick substring extraction
            booking_id = booking_id.split("CineHub-")[-1].split(" ")[0].strip()

        try:
            booking = Booking.objects.get(booking_id=booking_id, show__theatre__manager=request.user)
            if booking.status != 'Confirmed':
                return Response({"error": f"Ticket is not confirmed. Status: {booking.status}"}, status=status.HTTP_400_BAD_REQUEST)
            if booking.is_used:
                return Response({"error": "Ticket has already been used and verified!"}, status=status.HTTP_400_BAD_REQUEST)

            booking.is_used = True
            booking.save()

            return Response({
                "message": "Ticket verified successfully!",
                "booking": BookingSerializer(booking).data
            }, status=status.HTTP_200_OK)

        except Booking.DoesNotExist:
            return Response({"error": "Booking details not found or doesn't belong to your theatre."}, status=status.HTTP_404_NOT_FOUND)

