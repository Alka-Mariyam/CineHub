from django.db import models
from django.conf import settings

class Movie(models.Model):
    MOOD_CHOICES = (
        ('Happy', 'Happy'),
        ('Excited', 'Excited'),
        ('Romantic', 'Romantic'),
        ('Scared', 'Scared'),
    )

    title = models.CharField(max_length=255)
    poster = models.URLField(max_length=1000)  # Use URL for high-quality CDN/Unsplash posters
    trailer = models.URLField(max_length=1000, blank=True, null=True)
    language = models.CharField(max_length=100)
    duration = models.IntegerField(help_text="Duration in minutes")
    genre = models.CharField(max_length=255)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    votes = models.IntegerField(default=0)
    synopsis = models.TextField()
    cast = models.JSONField(default=list, blank=True)  # List of dicts, e.g. [{"name": "Actor", "role": "Character", "image": "URL"}]
    crew = models.JSONField(default=list, blank=True)  # List of dicts, e.g. [{"name": "Director", "role": "Director", "image": "URL"}]
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, blank=True, null=True)
    
    # Sections
    is_premiere = models.BooleanField(default=False)
    is_new_release = models.BooleanField(default=False)
    is_most_booked = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    is_recommended = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Theatre(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )

    name = models.CharField(max_length=255)
    location = models.ForeignKey('authentication.Location', on_delete=models.CASCADE, related_name='theatres')
    brand = models.CharField(max_length=100, blank=True, null=True)
    coordinates = models.CharField(max_length=100, blank=True, null=True, help_text="Latitude, Longitude")
    
    # Manager additions
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    address = models.TextField(blank=True, null=True)
    contact_details = models.CharField(max_length=255, blank=True, null=True)
    facilities = models.CharField(max_length=500, blank=True, null=True, help_text="Comma-separated e.g. Dolby Atmos, Recliner, IMAX")
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_theatres')
    is_demo = models.BooleanField(default=False, help_text='Mark theatre as demo for testing')

    def __str__(self):
        return f"{self.name} - {self.location.city}"


class Screen(models.Model):
    theatre = models.ForeignKey(Theatre, on_delete=models.CASCADE, related_name='screens')
    name = models.CharField(max_length=100)
    total_seats = models.IntegerField(default=100)
    seat_layout = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.theatre.name} - {self.name}"


class Show(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='shows', null=True, blank=True)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='shows', null=True, blank=True)
    sports_event = models.ForeignKey('events.SportsEvent', on_delete=models.CASCADE, related_name='shows', null=True, blank=True)
    
    theatre = models.ForeignKey(Theatre, on_delete=models.CASCADE, related_name='shows', null=True, blank=True)
    screen = models.ForeignKey(Screen, on_delete=models.SET_NULL, null=True, blank=True, related_name='shows')
    venue = models.ForeignKey('events.Venue', on_delete=models.CASCADE, related_name='shows', null=True, blank=True)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        item = self.movie or self.event or self.sports_event
        place = self.theatre or self.venue
        return f"{item} at {place} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    sports_event = models.ForeignKey('events.SportsEvent', on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    
    rating = models.IntegerField(help_text="Rating out of 10 for movies, 5 for events/sports")
    comment = models.TextField()
    sentiment = models.CharField(max_length=20, default='Neutral')  # Positive, Negative, Neutral
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        item = self.movie or self.event or self.sports_event
        return f"Review by {self.user.email} on {item} ({self.sentiment})"


class Watchlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='watchlist')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='watchlist_entries', null=True, blank=True)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='watchlist_entries', null=True, blank=True)
    sports_event = models.ForeignKey('events.SportsEvent', on_delete=models.CASCADE, related_name='watchlist_entries', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (
            ('user', 'movie'),
            ('user', 'event'),
            ('user', 'sports_event'),
        )

    def __str__(self):
        item = self.movie or self.event or self.sports_event
        return f"{self.user.email} Watchlist: {item}"
