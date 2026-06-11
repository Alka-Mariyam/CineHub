"""
URL configuration for cinehub project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from django.http import JsonResponse
from django.core.management import call_command
import threading

from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.authentication.models import Location
from apps.movies.models import Movie, Theatre, Show, Screen
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

def seed_db_view(request):
    key = request.GET.get('key') or request.POST.get('key')
    if key != 'cinehub_seed_2026':
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    try:
        # 1. Create Location
        loc, _ = Location.objects.get_or_create(
            country="India", state="Maharashtra", city="Mumbai",
            defaults={"town": ""}
        )
        
        # 2. Create Movie
        movie, _ = Movie.objects.get_or_create(
            title="Pathaan: Shadow Strike",
            defaults={
                "poster": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600",
                "trailer": "https://www.youtube.com/embed/vqu4z34wENw",
                "language": "Hindi",
                "duration": 156,
                "genre": "Action, Thriller",
                "rating": Decimal("8.4"),
                "votes": 45230,
                "synopsis": "An elite RAW agent goes deep undercover to dismantle a global arms syndicate.",
                "cast": [{"name": "Shah Rukh Khan", "role": "Pathaan"}],
                "crew": [{"name": "Siddharth Anand", "role": "Director"}],
                "mood": "Excited",
                "is_trending": True,
                "is_new_release": True
            }
        )
        
        # 3. Create User Manager
        User = get_user_model()
        manager_user, _ = User.objects.get_or_create(
            email="admin@cinehub.com",
            defaults={
                "full_name": "Theatre Admin",
                "password": make_password("admin123"),
                "is_active": True,
                "role": "Manager"
            }
        )
        
        # 4. Create Theatre
        theatre, _ = Theatre.objects.get_or_create(
            name="PVR Cinemas - Mumbai",
            location=loc,
            defaults={
                "address": "Phoenix Palladium, Lower Parel",
                "brand": "PVR",
                "manager": manager_user
            }
        )
        
        # 5. Create Screen
        screen, _ = Screen.objects.get_or_create(
            theatre=theatre,
            name="Screen 1",
            defaults={
                "total_seats": 100,
                "seat_layout": {
                    "A": "Silver", "B": "Silver", "C": "Silver", "D": "Silver",
                    "E": "Gold", "F": "Gold", "G": "Gold",
                    "H": "Platinum", "I": "Platinum", "J": "Platinum"
                }
            }
        )
        
        # 6. Create Show
        now = timezone.now()
        start = (now + timedelta(days=5)).replace(hour=19, minute=0, second=0, microsecond=0)
        end = start + timedelta(minutes=movie.duration)
        show, created = Show.objects.get_or_create(
            movie=movie,
            theatre=theatre,
            start_time=start,
            defaults={
                "end_time": end,
                "price": Decimal("150.00"),
                "screen": screen,
            }
        )
        
        # 7. Create default Customer User for logging in / testing
        customer_user, _ = User.objects.get_or_create(
            email="customer@cinehub.com",
            defaults={
                "full_name": "Demo Customer",
                "password": make_password("customer123"),
                "is_active": True,
                "role": "Customer"
            }
        )
        
        return JsonResponse({
            "status": "Success",
            "message": "Lightweight database seeded successfully!",
            "movie": movie.title,
            "theatre": theatre.name,
            "show": str(show.start_time)
        })
        
    except Exception as e:
        import traceback
        return JsonResponse({"error": str(e), "trace": traceback.format_exc()}, status=500)

def api_root(request):
    return JsonResponse({
        "message": "CineHub API is running successfully! 🍿",
        "endpoints": {
            "admin": "/admin/",
            "api": "/api/"
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/seed-db/', seed_db_view, name='seed_db'),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/', include('apps.movies.urls')),
    path('api/', include('apps.events.urls')),
    path('api/', include('apps.bookings.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

