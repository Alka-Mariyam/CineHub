from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta, date, time
from apps.authentication.models import Location, RewardPoints
from apps.movies.models import Movie, Theatre, Show, Review
from apps.events.models import Venue, Event, SportsEvent
from apps.bookings.models import GiftCard, Seat

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds mock data for CineHub application'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting database seeding...")

        # 1. Create Locations
        locations_data = [
            {"country": "India", "state": "Maharashtra", "city": "Mumbai", "town": "Andheri"},
            {"country": "India", "state": "Karnataka", "city": "Bengaluru", "town": "Koramangala"},
            {"country": "India", "state": "Delhi", "city": "New Delhi", "town": "Connaught Place"},
            {"country": "India", "state": "West Bengal", "city": "Kolkata", "town": "Salt Lake"},
        ]
        
        locations = []
        for loc in locations_data:
            obj, created = Location.objects.get_or_create(**loc)
            locations.append(obj)
            if created:
                self.stdout.write(f"Location created: {obj}")

        # 2. Create Admin and Test Users
        admin_user, created = User.objects.get_or_create(
            email="admin@cinehub.com",
            defaults={
                "full_name": "CineHub Admin",
                "phone_number": "9999999999",
                "is_staff": True,
                "is_superuser": True
            }
        )
        if created:
            admin_user.set_password("adminpass")
            admin_user.save()
            RewardPoints.objects.get_or_create(user=admin_user, points=500, description="Admin Starting Points")
            self.stdout.write("Admin user created: admin@cinehub.com / adminpass")

        test_user, created = User.objects.get_or_create(
            email="user@cinehub.com",
            defaults={
                "full_name": "John Doe",
                "phone_number": "8888888888",
                "current_location": locations[0]
            }
        )
        if created:
            test_user.set_password("userpass")
            test_user.save()
            RewardPoints.objects.get_or_create(user=test_user, points=200, description="John Welcome Points")
            self.stdout.write("Test user created: user@cinehub.com / userpass")

        # 3. Create Movies (Unsplash poster URLs)
        movies_data = [
            {
                "title": "Interstellar",
                "poster": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
                "trailer": "https://www.youtube.com/embed/zSWdZAibMeg",
                "language": "English",
                "duration": 169,
                "genre": "Sci-Fi, Adventure, Drama",
                "rating": 9.2,
                "votes": 14200,
                "synopsis": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. Faced with resource depletion on Earth, astronauts venture into the unknown deep space.",
                "cast": [
                    {"name": "Matthew McConaughey", "role": "Cooper", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"},
                    {"name": "Anne Hathaway", "role": "Brand", "image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"},
                    {"name": "Jessica Chastain", "role": "Murph", "image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100"}
                ],
                "crew": [
                    {"name": "Christopher Nolan", "role": "Director", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Emma Thomas", "role": "Producer", "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"}
                ],
                "mood": "Excited",
                "is_trending": True,
                "is_recommended": True,
            },
            {
                "title": "La La Land",
                "poster": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
                "trailer": "https://www.youtube.com/embed/0pdqf4P9MB8",
                "language": "English",
                "duration": 128,
                "genre": "Romance, Musical, Drama",
                "rating": 8.6,
                "votes": 9500,
                "synopsis": "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
                "cast": [
                    {"name": "Ryan Gosling", "role": "Sebastian", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"},
                    {"name": "Emma Stone", "role": "Mia", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"}
                ],
                "crew": [
                    {"name": "Damien Chazelle", "role": "Director", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"}
                ],
                "mood": "Romantic",
                "is_premiere": True,
                "is_recommended": True,
            },
            {
                "title": "The Conjuring",
                "poster": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600&auto=format&fit=crop&q=80",
                "trailer": "https://www.youtube.com/embed/k10ETZ41q5o",
                "language": "English",
                "duration": 112,
                "genre": "Horror, Mystery, Thriller",
                "rating": 7.8,
                "votes": 8100,
                "synopsis": "Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.",
                "cast": [
                    {"name": "Vera Farmiga", "role": "Lorraine Warren", "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"},
                    {"name": "Patrick Wilson", "role": "Ed Warren", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}
                ],
                "crew": [
                    {"name": "James Wan", "role": "Director", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"}
                ],
                "mood": "Scared",
                "is_new_release": True,
            },
            {
                "title": "The Hangover",
                "poster": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80",
                "trailer": "https://www.youtube.com/embed/tcdUyk8wVMc",
                "language": "English",
                "duration": 100,
                "genre": "Comedy",
                "rating": 8.0,
                "votes": 11000,
                "synopsis": "Three buddies wake up from a bachelor party in Las Vegas, with no memory of the previous night and the bachelor missing.",
                "cast": [
                    {"name": "Bradley Cooper", "role": "Phil", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"},
                    {"name": "Zach Galifianakis", "role": "Alan", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"}
                ],
                "crew": [
                    {"name": "Todd Phillips", "role": "Director", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                ],
                "mood": "Happy",
                "is_most_booked": True,
            },
            {
                "title": "Demon Slayer: Mugen Train",
                "poster": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
                "trailer": "https://www.youtube.com/embed/ATJYac_dORw",
                "language": "Japanese",
                "duration": 117,
                "genre": "Anime, Action, Fantasy",
                "rating": 8.9,
                "votes": 6500,
                "synopsis": "After a string of mysterious disappearances aboard a train, the Demon Slayer Corps sends Kyojuro Rengoku and Tanjiro Kamado to investigate.",
                "cast": [
                    {"name": "Natsuki Hanae", "role": "Tanjiro Kamado", "image": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                ],
                "crew": [
                    {"name": "Haruo Sotozaki", "role": "Director", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"}
                ],
                "mood": "Excited",
                "is_trending": True,
            }
        ]

        movies = []
        for m_data in movies_data:
            movie, created = Movie.objects.get_or_create(title=m_data["title"], defaults=m_data)
            movies.append(movie)
            if created:
                self.stdout.write(f"Movie created: {movie}")

        # 4. Create Theatres
        theatres_data = [
            {"name": "PVR Icon Infiniti Mall", "location": locations[0], "brand": "PVR", "coordinates": "19.1354,72.8298"},
            {"name": "Inox R-City Mall", "location": locations[0], "brand": "Inox", "coordinates": "19.0997,72.9163"},
            {"name": "Cinepolis Forum Mall", "location": locations[1], "brand": "Cinepolis", "coordinates": "12.9344,77.6112"},
            {"name": "PVR Plaza Connaught Place", "location": locations[2], "brand": "PVR", "coordinates": "28.6304,77.2177"},
        ]

        theatres = []
        for t_data in theatres_data:
            theatre, created = Theatre.objects.get_or_create(name=t_data["name"], defaults=t_data)
            theatres.append(theatre)
            if created:
                self.stdout.write(f"Theatre created: {theatre}")

        # 5. Create Shows for Movies (Next 3 days)
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        show_times = [
            {"offset_days": 0, "hour": 10, "price": 10.0},
            {"offset_days": 0, "hour": 14, "price": 12.5},
            {"offset_days": 0, "hour": 18, "price": 15.0},
            {"offset_days": 1, "hour": 13, "price": 12.0},
            {"offset_days": 1, "hour": 20, "price": 15.0},
            {"offset_days": 2, "hour": 15, "price": 11.5},
        ]

        shows_created_count = 0
        for movie in movies:
            for theatre in theatres:
                # Match movie language/location show availability for simplicity
                if (theatre.location.city == "Bengaluru" and movie.language == "Japanese") or movie.language == "English":
                    for s_time in show_times:
                        show_date = (now + timedelta(days=s_time["offset_days"])).date()
                        start_time = timezone.make_aware(timezone.datetime.combine(show_date, time(s_time["hour"], 0)))
                        end_time = start_time + timedelta(minutes=movie.duration)
                        
                        show, created = Show.objects.get_or_create(
                            movie=movie,
                            theatre=theatre,
                            start_time=start_time,
                            defaults={"end_time": end_time, "price": s_time["price"]}
                        )
                        if created:
                            shows_created_count += 1
                            # Generate seats for the first show of each movie to avoid massive DB bloating but enable booking
                            if s_time["offset_days"] == 0 and s_time["hour"] == 18:
                                for row in ['A', 'B', 'C', 'D', 'E']:
                                    for col in range(1, 11):
                                        Seat.objects.create(show=show, row_label=row, column_number=col, status='Available')

        self.stdout.write(f"Generated {shows_created_count} Movie Shows.")

        # 6. Create Venues
        venues_data = [
            {"name": "Jio World Garden BKC", "location": locations[0], "capacity": 3000, "address": "Bandra Kurla Complex, Mumbai"},
            {"name": "The Comedy Store Koramangala", "location": locations[1], "capacity": 250, "address": "Koramangala 5th Block, Bengaluru"},
            {"name": "Jawaharlal Nehru Stadium", "location": locations[2], "capacity": 20000, "address": "Pragati Vihar, New Delhi"},
        ]

        venues = []
        for v_data in venues_data:
            venue, created = Venue.objects.get_or_create(name=v_data["name"], defaults=v_data)
            venues.append(venue)
            if created:
                self.stdout.write(f"Venue created: {venue}")

        # 7. Create Events
        events_data = [
            {
                "title": "Coldplay Music Festival",
                "category": "Music Shows",
                "banner": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&auto=format&fit=crop&q=80",
                "description": "Experience Coldplay live in India performing their greatest hits. A night full of lights, colours, and cosmic music.",
                "date": date.today() + timedelta(days=20),
                "venue": venues[0],
                "available_seats": 2500,
                "price": 150.0
            },
            {
                "title": "Zakir Khan Live Standup",
                "category": "Comedy Shows",
                "banner": "https://images.unsplash.com/photo-1585699324551-f6c309eed262?w=600&auto=format&fit=crop&q=80",
                "description": "The 'Sakht Launda' is back with fresh jokes and storytelling. Get ready for a rib-tickling, emotional, and highly relatable evening.",
                "date": date.today() + timedelta(days=5),
                "venue": venues[1],
                "available_seats": 120,
                "price": 35.0
            },
            {
                "title": "Disney on Ice: Magical Kingdom",
                "category": "Kids Events",
                "banner": "https://images.unsplash.com/photo-1478812954026-9c750f0e89fc?w=600&auto=format&fit=crop&q=80",
                "description": "Mickey Mouse and friends tell magical stories on ice skates. A perfect family show filled with Disney songs and performances.",
                "date": date.today() + timedelta(days=12),
                "venue": venues[2],
                "available_seats": 1200,
                "price": 40.0
            }
        ]

        for ev_data in events_data:
            event, created = Event.objects.get_or_create(title=ev_data["title"], defaults=ev_data)
            if created:
                self.stdout.write(f"Event created: {event}")
                # Create a Show entry for booking integrations
                Show.objects.create(
                    event=event,
                    venue=ev_data["venue"],
                    start_time=timezone.make_aware(timezone.datetime.combine(ev_data["date"], time(19, 0))),
                    end_time=timezone.make_aware(timezone.datetime.combine(ev_data["date"], time(22, 0))),
                    price=ev_data["price"]
                )

        # 8. Create SportsEvents
        sports_data = [
            {
                "title": "IPL: Mumbai Indians vs Chennai Super Kings",
                "banner": "https://images.unsplash.com/photo-1540747737956-378723c03095?w=600&auto=format&fit=crop&q=80",
                "description": "The ultimate cricket rivalry resumes at Delhi's iconic stadium. Watch the titans clash live.",
                "date": date.today() + timedelta(days=15),
                "stadium_name": "Jawaharlal Nehru Stadium",
                "stadium_details": "East Stand, West Stand, VIP Lounges, and General Seating available.",
                "match_timings": "7:30 PM - 11:30 PM",
                "seating_information": "Seats are numbered by row and section.",
                "venue": venues[2],
                "available_seats": 8000,
                "price": 45.0
            },
            {
                "title": "Pro Kabaddi League: Finals",
                "banner": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&auto=format&fit=crop&q=80",
                "description": "Le Panga! The top kabaddi franchises battle out in Mumbai for the championship trophy.",
                "date": date.today() + timedelta(days=8),
                "stadium_name": "BKC Indoor Arena",
                "stadium_details": "Close-contact court seating with premium views.",
                "match_timings": "8:00 PM - 10:00 PM",
                "seating_information": "VIP Courtside and Standard Balcony sections.",
                "venue": venues[0],
                "available_seats": 1500,
                "price": 25.0
            }
        ]

        for sp_data in sports_data:
            sports_event, created = SportsEvent.objects.get_or_create(title=sp_data["title"], defaults=sp_data)
            if created:
                self.stdout.write(f"Sports event created: {sports_event}")
                # Create a Show entry
                Show.objects.create(
                    sports_event=sports_event,
                    venue=sp_data["venue"],
                    start_time=timezone.make_aware(timezone.datetime.combine(sp_data["date"], time(19, 30))),
                    end_time=timezone.make_aware(timezone.datetime.combine(sp_data["date"], time(23, 0))),
                    price=sp_data["price"]
                )

        # 9. Create Gift Cards
        gift_cards_data = [
            {"code": "CINE100", "value": 100.0},
            {"code": "CINE50", "value": 50.0},
            {"code": "CINE25", "value": 25.0},
        ]
        for gc_data in gift_cards_data:
            gc, created = GiftCard.objects.get_or_create(code=gc_data["code"], defaults={"value": gc_data["value"]})
            if created:
                self.stdout.write(f"Gift card created: {gc.code} (${gc.value})")

        # 10. Seed some mock reviews and watchlist items
        # John Doe reviews Interstellar
        Review.objects.get_or_create(
            user=test_user,
            movie=movies[0],
            defaults={
                "rating": 10,
                "comment": "Absolutely mind-bending! Christopher Nolan is a genius. The music by Hans Zimmer is amazing and out of this world.",
                "sentiment": "Positive"
            }
        )
        Review.objects.get_or_create(
            user=test_user,
            movie=movies[1],
            defaults={
                "rating": 9,
                "comment": "The romantic chemistry between Ryan and Emma is lovely. Great songs and wonderful choreography.",
                "sentiment": "Positive"
            }
        )

        self.stdout.write("Database seeding completed successfully!")
