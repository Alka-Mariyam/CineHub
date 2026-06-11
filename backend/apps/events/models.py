from django.db import models

class Venue(models.Model):
    name = models.CharField(max_length=255)
    location = models.ForeignKey('authentication.Location', on_delete=models.CASCADE, related_name='venues')
    capacity = models.IntegerField(default=500)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.location.city}"


class Event(models.Model):
    CATEGORY_CHOICES = (
        ('Workshops', 'Workshops'),
        ('Comedy Shows', 'Comedy Shows'),
        ('Music Shows', 'Music Shows'),
        ('Performages', 'Performances'),
        ('Kids Events', 'Kids Events'),
        ('Spirituality', 'Spirituality'),
        ('Award Shows', 'Award Shows'),
        ('Role Play Events', 'Role Play Events'),
    )

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    banner = models.URLField(max_length=1000)
    description = models.TextField()
    date = models.DateField()
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='events')
    available_seats = models.IntegerField(default=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class SportsEvent(models.Model):
    title = models.CharField(max_length=255)
    banner = models.URLField(max_length=1000)
    description = models.TextField()
    date = models.DateField()
    stadium_name = models.CharField(max_length=255)
    stadium_details = models.TextField(blank=True, null=True)
    match_timings = models.CharField(max_length=100, help_text="e.g. 4:00 PM - 8:00 PM")
    seating_information = models.TextField(blank=True, null=True, help_text="Details about seating sections")
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='sports_events')
    available_seats = models.IntegerField(default=500)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} at {self.stadium_name}"
