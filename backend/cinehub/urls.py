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

def seed_db_view(request):
    key = request.GET.get('key') or request.POST.get('key')
    if key != 'cinehub_seed_2026':
        return JsonResponse({"error": "Unauthorized"}, status=401)
    try:
        call_command('seed_demo_data')
        return JsonResponse({"status": "Database seeded successfully!"})
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

