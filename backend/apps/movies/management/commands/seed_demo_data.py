"""
Seed demo data for CineHub - Movies, Events, Sports, Theatres, Venues, Shows across Indian cities.
Usage: python manage.py seed_demo_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from django.db.models import Avg
from apps.authentication.models import Location
from apps.movies.models import Movie, Theatre, Show, Review, Screen
from apps.events.models import Event, SportsEvent, Venue


class Command(BaseCommand):
    help = 'Seed demo movies, events, sports, theatres, venues and shows for Indian cities'

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seeding CineHub demo data...")

        # 1. Create Locations
        cities = [
            ("Maharashtra", "Mumbai"),
            ("Maharashtra", "Pune"),
            ("Delhi", "New Delhi"),
            ("Karnataka", "Bengaluru"),
            ("Telangana", "Hyderabad"),
            ("Tamil Nadu", "Chennai"),
            ("West Bengal", "Kolkata"),
            ("Gujarat", "Ahmedabad"),
        ]

        locations = {}
        for state, city in cities:
            loc, _ = Location.objects.get_or_create(
                country="India", state=state, city=city,
                defaults={"town": ""}
            )
            locations[city] = loc
            self.stdout.write(f"  📍 Location: {city}, {state}")

        # 2. Create Movies
        movies_data = [
            {
                "title": "Pathaan: Shadow Strike",
                "poster": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600",
                "trailer": "https://www.youtube.com/embed/vqu4z34wENw",
                "language": "Hindi",
                "duration": 156,
                "genre": "Action, Thriller",
                "rating": Decimal("8.4"),
                "votes": 45230,
                "synopsis": "An elite RAW agent goes deep undercover to dismantle a global arms syndicate threatening India's sovereignty. Packed with breathtaking stunts across 7 countries.",
                "cast": [
                    {"name": "Shah Rukh Khan", "role": "Pathaan", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Deepika Padukone", "role": "Rubina", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                    {"name": "John Abraham", "role": "Jim", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
                ],
                "crew": [{"name": "Siddharth Anand", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Excited",
                "is_trending": True,
                "is_new_release": True,
            },
            {
                "title": "Dil Se Phir",
                "poster": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600",
                "trailer": "https://www.youtube.com/embed/LjCzPp-MK48",
                "language": "Hindi",
                "duration": 142,
                "genre": "Romance, Drama",
                "rating": Decimal("7.8"),
                "votes": 32100,
                "synopsis": "Two strangers meet on a cross-country train journey and discover that love can bloom in the most unexpected places. A modern love story set against India's vibrant landscapes.",
                "cast": [
                    {"name": "Ranveer Singh", "role": "Arjun", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Alia Bhatt", "role": "Meera", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                ],
                "crew": [{"name": "Imtiaz Ali", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Romantic",
                "is_recommended": True,
            },
            {
                "title": "Bhoot Police 2",
                "poster": "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600",
                "trailer": "https://www.youtube.com/embed/ByXuk9QqQkk",
                "language": "Hindi",
                "duration": 128,
                "genre": "Horror, Comedy",
                "rating": Decimal("6.9"),
                "votes": 18400,
                "synopsis": "The ghost-hunting duo returns! This time they face an ancient demon awakened in the forests of Meghalaya. Laughs, screams, and unexpected twists await.",
                "cast": [
                    {"name": "Saif Ali Khan", "role": "Vibhooti", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
                    {"name": "Arjun Kapoor", "role": "Chiraunji", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                ],
                "crew": [{"name": "Pavan Kirpalani", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Scared",
                "is_most_booked": True,
            },
            {
                "title": "Chennai Express 2",
                "poster": "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600",
                "trailer": "https://www.youtube.com/embed/0Hkn-LSh7es",
                "language": "Tamil",
                "duration": 148,
                "genre": "Comedy, Action",
                "rating": Decimal("7.5"),
                "votes": 27800,
                "synopsis": "Rahul accidentally boards the wrong train again — this time heading to Rameswaram. Chaos, comedy, and a wild South Indian wedding follow.",
                "cast": [
                    {"name": "Dhanush", "role": "Rahul", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Samantha", "role": "Meenamma", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                ],
                "crew": [{"name": "Rohit Shetty", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Happy",
                "is_trending": True,
                "is_premiere": True,
            },
            {
                "title": "Interstellar India",
                "poster": "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600",
                "trailer": "https://www.youtube.com/embed/V75dMMIW2B4",
                "language": "English",
                "duration": 165,
                "genre": "Sci-Fi, Drama",
                "rating": Decimal("9.1"),
                "votes": 52000,
                "synopsis": "ISRO's most ambitious mission sends astronauts through a wormhole near Saturn to find humanity's next home. A visually stunning tribute to Indian space exploration.",
                "cast": [
                    {"name": "Hrithik Roshan", "role": "Dr. Vikram", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Vidya Balan", "role": "Dr. Priya", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                ],
                "crew": [{"name": "S.S. Rajamouli", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Excited",
                "is_recommended": True,
                "is_new_release": True,
            },
            {
                "title": "Golmaal Returns Again",
                "poster": "https://images.unsplash.com/photo-1586351012965-861624544334?w=600",
                "trailer": "https://www.youtube.com/embed/TcMBFSGVi1c",
                "language": "Hindi",
                "duration": 135,
                "genre": "Comedy",
                "rating": Decimal("7.2"),
                "votes": 21500,
                "synopsis": "The Golmaal gang reunites for another hilarious adventure when they inherit a haunted mansion in Goa. Non-stop laughter guaranteed!",
                "cast": [
                    {"name": "Ajay Devgn", "role": "Gopal", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
                    {"name": "Arshad Warsi", "role": "Circuit", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Tusshar Kapoor", "role": "Lucky", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"},
                ],
                "crew": [{"name": "Rohit Shetty", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Happy",
                "is_most_booked": True,
            },
            {
                "title": "Drishyam 3: The Coverup",
                "poster": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600",
                "trailer": "https://www.youtube.com/embed/co8_LUI7zGA",
                "language": "Malayalam",
                "duration": 150,
                "genre": "Thriller, Drama",
                "rating": Decimal("8.9"),
                "votes": 34200,
                "synopsis": "Georgekutty returns to protect his family once again as a new IG digs up old secrets. A brilliant battle of wits that will keep you guessing until the final frame.",
                "cast": [
                    {"name": "Mohanlal", "role": "Georgekutty", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Meena", "role": "Rani", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                ],
                "crew": [{"name": "Jeethu Joseph", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Excited",
                "is_trending": True,
                "is_new_release": True,
            },
            {
                "title": "Kumbalangi Nights: Reunion",
                "poster": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600",
                "trailer": "https://www.youtube.com/embed/co8_LUI7zGA",
                "language": "Malayalam",
                "duration": 135,
                "genre": "Comedy, Drama",
                "rating": Decimal("8.6"),
                "votes": 22100,
                "synopsis": "The four brothers of Kumbalangi return to face new life challenges, love, and hilarious family disputes in their picturesque backwater home.",
                "cast": [
                    {"name": "Fahadh Faasil", "role": "Shammi", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Soubin Shahir", "role": "Saji", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
                ],
                "crew": [{"name": "Madhu C. Narayanan", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Happy",
                "is_recommended": True,
            },
            {
                "title": "Premam: Infinite Love",
                "poster": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600",
                "trailer": "https://www.youtube.com/embed/co8_LUI7zGA",
                "language": "Malayalam",
                "duration": 156,
                "genre": "Romance, Comedy",
                "rating": Decimal("8.8"),
                "votes": 41200,
                "synopsis": "George goes on a nostalgic journey through three stages of his romantic life, learning lessons about heartbreaks, friendships, and moving on.",
                "cast": [
                    {"name": "Nivin Pauly", "role": "George", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Sai Pallavi", "role": "Malar", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                ],
                "crew": [{"name": "Alphonse Puthren", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Romantic",
                "is_new_release": True,
            },
            {
                "title": "The Priest 2: Resurrection",
                "poster": "https://images.unsplash.com/photo-1505635552518-3448ff116af3?w=600",
                "trailer": "https://www.youtube.com/embed/co8_LUI7zGA",
                "language": "Malayalam",
                "duration": 140,
                "genre": "Horror, Thriller",
                "rating": Decimal("7.8"),
                "votes": 19300,
                "synopsis": "Father Benedict solves another cold case involving an ancient spirit that takes over a remote orphanage in hilly Wayanad.",
                "cast": [
                    {"name": "Mammootty", "role": "Father Benedict", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
                    {"name": "Manju Warrier", "role": "Susan", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                ],
                "crew": [{"name": "Jofin T. Chacko", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Scared",
                "is_most_booked": True,
            },
            {
                "title": "Jawan: Ultimate Justice",
                "poster": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
                "trailer": "https://www.youtube.com/embed/COv527yNh_4",
                "language": "Hindi",
                "duration": 169,
                "genre": "Action, Thriller",
                "rating": Decimal("8.6"),
                "votes": 58900,
                "synopsis": "A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society. Guided by a personal vendetta while keeping a promise made years ago, he confronts a monstrous outlaw who has caused extreme suffering to many.",
                "cast": [
                    {"name": "Shah Rukh Khan", "role": "Vikram Rathore / Azad", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Nayanthara", "role": "Narmada Rai", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                    {"name": "Vijay Sethupathi", "role": "Kalee Gaikwad", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
                ],
                "crew": [{"name": "Atlee Kumar", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Excited",
                "is_trending": True,
                "is_new_release": True,
            },
            {
                "title": "RRR: Rise Roar Revolt",
                "poster": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600",
                "trailer": "https://www.youtube.com/embed/f_vbAtFJKc0",
                "language": "Telugu",
                "duration": 187,
                "genre": "Action, Drama",
                "rating": Decimal("9.0"),
                "votes": 67300,
                "synopsis": "A fictitious story about two legendary revolutionaries and their journey away from home before they started fighting for their country in the 1920s. Visually spectacular, historic action featuring mind-blowing friendship and choreography.",
                "cast": [
                    {"name": "N.T. Rama Rao Jr.", "role": "Komaram Bheem", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"},
                    {"name": "Ram Charan", "role": "Alluri Sitarama Raju", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
                    {"name": "Alia Bhatt", "role": "Sita", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                ],
                "crew": [{"name": "S.S. Rajamouli", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Excited",
                "is_recommended": True,
                "is_most_booked": True,
            },
            {
                "title": "K.G.F: Chapter 2",
                "poster": "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600",
                "trailer": "https://www.youtube.com/embed/tQ0mzGCy-Wg",
                "language": "Kannada",
                "duration": 168,
                "genre": "Action, Drama",
                "rating": Decimal("8.8"),
                "votes": 61200,
                "synopsis": "In the blood-drenched Kolar Gold Fields, Rocky's name strikes fear into his foes. While his allies look up to him, the government sees him as a threat to law and order. Rocky must battle enemies on all sides for unchallenged supremacy.",
                "cast": [
                    {"name": "Yash", "role": "Rocky", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Sanjay Dutt", "role": "Adheera", "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"},
                    {"name": "Raveena Tandon", "role": "Ramika Sen", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                ],
                "crew": [{"name": "Prashanth Neel", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Excited",
                "is_trending": True,
                "is_most_booked": True,
            },
            {
                "title": "Pushpa: The Rise - Part 1",
                "poster": "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600",
                "trailer": "https://www.youtube.com/embed/Q1NKMPhP8PY",
                "language": "Telugu",
                "duration": 179,
                "genre": "Action, Thriller",
                "rating": Decimal("8.2"),
                "votes": 49800,
                "synopsis": "Pushpa Raj, a coolie, volunteers to smuggle red sanders, a rare wood that grows only in the Seshachalam Hills of Andhra Pradesh. As he rises through the ranks of the smuggling syndicate, he makes powerful enemies who seek his downfall.",
                "cast": [
                    {"name": "Allu Arjun", "role": "Pushpa Raj", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"},
                    {"name": "Rashmika Mandanna", "role": "Srivalli", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"},
                    {"name": "Fahadh Faasil", "role": "Bhanwar Singh Shekhawat", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"},
                ],
                "crew": [{"name": "Sukumar", "role": "Director", "image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"}],
                "mood": "Excited",
                "is_new_release": True,
                "is_recommended": True,
            },
        ]

        created_movies = []
        for md in movies_data:
            movie, created = Movie.objects.update_or_create(
                title=md["title"],
                defaults=md
            )
            created_movies.append(movie)
            status = "✅ Created" if created else "🔄 Updated"
            self.stdout.write(f"  🎬 {status}: {movie.title}")

        # 3. Create Events
        events_data = [
            {
                "title": "Arijit Singh Live Concert",
                "category": "Music Shows",
                "banner": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
                "description": "Experience the magic of Arijit Singh live! An enchanting evening of soulful melodies and chart-topping hits under the stars.",
                "price": Decimal("1500"),
                "available_seats": 5000,
            },
            {
                "title": "Stand-up Comedy Night with Zakir Khan",
                "category": "Comedy Shows",
                "banner": "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800",
                "description": "Get ready for an evening of non-stop laughter with India's favorite comedian Zakir Khan and his brand new set 'Tathastu'.",
                "price": Decimal("800"),
                "available_seats": 500,
            },
            {
                "title": "AI & Future Tech Workshop",
                "category": "Workshops",
                "banner": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                "description": "A hands-on workshop exploring artificial intelligence, machine learning, and the future of technology. Perfect for developers and tech enthusiasts.",
                "price": Decimal("500"),
                "available_seats": 200,
            },
            {
                "title": "Bharatanatyam Dance Festival",
                "category": "Performages",
                "banner": "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800",
                "description": "A grand celebration of classical Indian dance featuring 20 renowned Bharatanatyam performers from across South India.",
                "price": Decimal("600"),
                "available_seats": 800,
            },
        ]

        created_events = []
        for ed in events_data:
            for city_name, loc in locations.items():
                venue, _ = Venue.objects.get_or_create(
                    name=f"{city_name} Convention Center",
                    location=loc,
                    defaults={"capacity": ed["available_seats"], "address": f"Main Road, {city_name}"}
                )
                today = timezone.now().date()
                event, created = Event.objects.get_or_create(
                    title=ed["title"],
                    venue=venue,
                    defaults={
                        "category": ed["category"],
                        "banner": ed["banner"],
                        "description": ed["description"],
                        "date": today + timedelta(days=random.randint(5, 20)),
                        "available_seats": ed["available_seats"],
                        "price": ed["price"],
                    }
                )
                if created:
                    created_events.append(event)
            self.stdout.write(f"  🎪 Event: {ed['title']}")

        # 4. Create Sports Events
        sports_data = [
            {
                "title": "IPL 2026: MI vs CSK",
                "banner": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
                "description": "The biggest rivalry in Indian cricket! Mumbai Indians take on Chennai Super Kings in a thrilling T20 showdown.",
                "stadium_name": "Wankhede Stadium",
                "match_timings": "7:30 PM - 11:00 PM",
                "seating_information": "Premium, Gold, Silver sections available",
                "price": Decimal("800"),
                "available_seats": 33000,
            },
            {
                "title": "ISL Final: Bengaluru FC vs Kerala Blasters",
                "banner": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
                "description": "The Indian Super League Grand Final. Watch two football powerhouses battle for the championship trophy!",
                "stadium_name": "Sree Kanteerava Stadium",
                "match_timings": "5:00 PM - 7:00 PM",
                "seating_information": "VIP Box, East Stand, West Stand",
                "price": Decimal("600"),
                "available_seats": 25000,
            },
            {
                "title": "Pro Kabaddi League: Patna Pirates vs Jaipur Pink Panthers",
                "banner": "https://images.unsplash.com/photo-1461896836934-bd45ba7c0820?w=800",
                "description": "India's own ancient sport in its modern avatar. High-energy kabaddi action guaranteed!",
                "stadium_name": "Thyagraj Sports Complex",
                "match_timings": "8:00 PM - 10:00 PM",
                "seating_information": "Courtside, Upper Deck, General",
                "price": Decimal("400"),
                "available_seats": 5000,
            },
        ]

        created_sports = []
        for sd in sports_data:
            for city_name, loc in locations.items():
                venue, _ = Venue.objects.get_or_create(
                    name=f"{city_name} Sports Arena",
                    location=loc,
                    defaults={"capacity": sd["available_seats"], "address": f"Stadium Road, {city_name}"}
                )
                today = timezone.now().date()
                sport, created = SportsEvent.objects.get_or_create(
                    title=sd["title"],
                    venue=venue,
                    defaults={
                        "banner": sd["banner"],
                        "description": sd["description"],
                        "date": today + timedelta(days=random.randint(3, 15)),
                        "stadium_name": sd["stadium_name"],
                        "match_timings": sd["match_timings"],
                        "seating_information": sd["seating_information"],
                        "available_seats": sd["available_seats"],
                        "price": sd["price"],
                    }
                )
                if created:
                    created_sports.append(sport)
            self.stdout.write(f"  🏏 Sport: {sd['title']}")

        # 5. Create Theatres
        theatre_brands = [
            ("PVR Cinemas", "PVR"),
            ("INOX Leisure", "INOX"),
            ("Cinepolis", "Cinepolis"),
        ]

        theatres_by_city = {}
        for city_name, loc in locations.items():
            city_theatres = []
            for tname, brand in theatre_brands:
                theatre, _ = Theatre.objects.get_or_create(
                    name=f"{tname} - {city_name}",
                    location=loc,
                    defaults={"brand": brand}
                )
                # Create 3 Screens for this theatre
                for screen_num in range(1, 4):
                    Screen.objects.get_or_create(
                        theatre=theatre,
                        name=f"Screen {screen_num}",
                        defaults={
                            "total_seats": 100,
                            "seat_layout": {
                                "A": "Silver", "B": "Silver", "C": "Silver", "D": "Silver",
                                "E": "Gold", "F": "Gold", "G": "Gold",
                                "H": "Platinum", "I": "Platinum", "J": "Platinum"
                            }
                        }
                    )
                city_theatres.append(theatre)
            theatres_by_city[city_name] = city_theatres
            self.stdout.write(f"  🎭 Theatres in {city_name}: {len(city_theatres)}")

        # 6. Create Shows for Movies
        now = timezone.now()
        show_times = [10, 13, 16, 19, 22]  # hours
        prices = [120, 150, 180, 200, 220, 250, 280, 300]

        shows_created = 0
        for movie in created_movies:
            for city_name, city_theatres in theatres_by_city.items():
                for theatre in city_theatres[:2]:  # 2 theatres per city
                    for day_offset in range(3, 15):  # 12 days of shows
                        num_shows = random.randint(2, 3)
                        chosen_times = random.sample(show_times, num_shows)
                        for hour in chosen_times:
                            start = (now + timedelta(days=day_offset)).replace(
                                hour=hour, minute=0, second=0, microsecond=0
                            )
                            end = start + timedelta(minutes=movie.duration)
                            screens = list(theatre.screens.all())
                            screen = random.choice(screens) if screens else None
                            price = Decimal(str(random.choice(prices)))
                            _, created = Show.objects.get_or_create(
                                movie=movie,
                                theatre=theatre,
                                start_time=start,
                                defaults={
                                    "end_time": end,
                                    "price": price,
                                    "screen": screen,
                                }
                            )
                            if created:
                                shows_created += 1

        self.stdout.write(f"  🎟️  Movie Shows created: {shows_created}")

        # 7. Create Shows for Events
        event_shows = 0
        for event in Event.objects.all():
            venue = event.venue
            for day_offset in [5, 8, 12]:
                start = (now + timedelta(days=day_offset)).replace(
                    hour=19, minute=0, second=0, microsecond=0
                )
                end = start + timedelta(hours=3)
                _, created = Show.objects.get_or_create(
                    event=event,
                    venue=venue,
                    start_time=start,
                    defaults={"end_time": end, "price": event.price}
                )
                if created:
                    event_shows += 1
        self.stdout.write(f"  🎪 Event Shows created: {event_shows}")

        # 8. Create Shows for Sports
        sport_shows = 0
        for sport in SportsEvent.objects.all():
            venue = sport.venue
            for day_offset in [4, 7, 11]:
                start = (now + timedelta(days=day_offset)).replace(
                    hour=19, minute=30, second=0, microsecond=0
                )
                end = start + timedelta(hours=3)
                _, created = Show.objects.get_or_create(
                    sports_event=sport,
                    venue=venue,
                    start_time=start,
                    defaults={"end_time": end, "price": sport.price}
                )
                if created:
                    sport_shows += 1
        self.stdout.write(f"  🏏 Sport Shows created: {sport_shows}")

        # 9. Create Demo Reviews and Ratings
        self.stdout.write("\n📝 Seeding movie ratings and reviews...")
        from django.contrib.auth import get_user_model
        User = get_user_model()
        reviewers = []
        for name, email in [
            ("Rajesh Kumar", "rajesh@gmail.com"),
            ("Aisha Sharma", "aisha@gmail.com"),
            ("Amit Patel", "amit@gmail.com"),
            ("Priya Nair", "priya@gmail.com")
        ]:
            user_obj, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": name,
                    "password": "pbkdf2_sha256$260000$xxxx$xxxx",
                    "is_active": True
                }
            )
            reviewers.append(user_obj)

        review_comments = [
            ("Amazing movie! Loved the action sequences and screenplay.", 9, "Positive"),
            ("A good watch. The performances were outstanding.", 8, "Positive"),
            ("An average film. Had some slow moments, but overall okay.", 6, "Neutral"),
            ("Not up to the mark. Very predictable storyline and pacing.", 4, "Negative"),
            ("Absolute masterpiece! Visually stunning and emotionally gripping.", 10, "Positive"),
            ("Decent entertainer for the weekend, but don't expect too much.", 7, "Positive")
        ]

        for movie in Movie.objects.all():
            # Create 4 reviews for each movie
            movie_reviews = random.sample(review_comments, 4)
            for comment, rating, sentiment in movie_reviews:
                reviewer = random.choice(reviewers)
                Review.objects.get_or_create(
                    user=reviewer,
                    movie=movie,
                    comment=comment,
                    defaults={
                        "rating": rating,
                        "sentiment": sentiment
                    }
                )
            # Recompute movie ratings and votes
            avg_rating = Review.objects.filter(movie=movie).aggregate(Avg('rating'))['rating__avg']
            votes = Review.objects.filter(movie=movie).count()
            movie.rating = round(avg_rating, 1) if avg_rating else movie.rating
            movie.votes = votes
            movie.save()
            self.stdout.write(f"  ⭐ Reviews seeded for movie: {movie.title} (Rating: {movie.rating}, Votes: {movie.votes})")

        # 10. Seed CinePoints Loyalty settings and users
        self.stdout.write("\n🎟️ Seeding CinePoints loyalty configuration and user tiers...")
        from apps.bookings.models import CinePointsConfig
        from apps.authentication.models import RewardPoints
        from django.contrib.auth.hashers import make_password

        # Seed loyalty configuration
        config, created = CinePointsConfig.objects.get_or_create(
            id=1,
            defaults={
                "points_per_booking": 10,
                "first_booking_bonus": 50,
                "campaign_active": False,
                "campaign_bonus_points": 20,
                "campaign_name": "Summer Festival Bonus",
                "redemption_rules": {"100": 10, "250": 30, "500": 75}
            }
        )
        if created:
            self.stdout.write("  ⚙️ CinePoints configuration initialized with default settings.")
        else:
            self.stdout.write("  ⚙️ CinePoints configuration exists.")

        # Seed users for Silver, Gold, Platinum tiers
        demo_loyalty_users = [
            ("silver_user@cinehub.com", "Silver User", 120, "Silver tier demo user"),
            ("gold_user@cinehub.com", "Gold User", 750, "Gold tier demo user"),
            ("platinum_user@cinehub.com", "Platinum User", 1800, "Platinum tier demo user"),
        ]

        for email, full_name, points, desc in demo_loyalty_users:
            user_obj, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": full_name,
                    "password": make_password("password123"),
                    "is_active": True,
                    "role": "Customer"
                }
            )
            if created:
                self.stdout.write(f"  👤 Created user {email} for loyalty testing.")
            
            # Reset history to exactly match the target points
            RewardPoints.objects.filter(user=user_obj).delete()
            
            # Create starting transaction histories
            RewardPoints.objects.create(
                user=user_obj,
                points=50,
                description="Welcome Points Bonus"
            )
            remaining = points - 50
            p1 = remaining // 2
            p2 = remaining - p1
            RewardPoints.objects.create(
                user=user_obj,
                points=p1,
                description="Points earned from booking BH1001"
            )
            RewardPoints.objects.create(
                user=user_obj,
                points=p2,
                description="Points earned from booking BH1002"
            )
            self.stdout.write(f"  🎟️ Seeded {points} CinePoints for {email}")

        # Seed Theatre Admin manager user
        manager_user, created = User.objects.get_or_create(
            email="admin@cinehub.com",
            defaults={
                "full_name": "Theatre Admin",
                "password": make_password("admin123"),
                "is_active": True,
                "role": "Manager"
            }
        )
        if created:
            self.stdout.write("  👤 Created manager account admin@cinehub.com / admin123")
        else:
            manager_user.password = make_password("admin123")
            manager_user.role = "Manager"
            manager_user.save()

        # Assign manager to theatres in Mumbai, New Delhi, and Bengaluru
        target_cities = ["Mumbai", "New Delhi", "Bengaluru"]
        managed_theatres = []
        for city in target_cities:
            theatres_in_city = Theatre.objects.filter(location__city=city)
            for t in theatres_in_city:
                t.manager = manager_user
                t.save()
                managed_theatres.append(t)
                self.stdout.write(f"  🎭 Assigned {manager_user.email} to manage {t.name} in {city}")

        # Seed realistic bookings/revenue data for these theatres to make the admin dashboard look active
        from apps.bookings.models import Booking, Payment, Seat
        from django.contrib.auth import get_user_model
        
        UserClass = get_user_model()
        customer_users = list(UserClass.objects.filter(role='Customer'))
        if not customer_users:
            # Create a couple of mock customer users
            c1, _ = UserClass.objects.get_or_create(email="customer1@cinehub.com", defaults={"full_name": "Rohan Sharma", "password": make_password("pass123"), "role": "Customer"})
            c2, _ = UserClass.objects.get_or_create(email="customer2@cinehub.com", defaults={"full_name": "Priya Patel", "password": make_password("pass123"), "role": "Customer"})
            customer_users = [c1, c2]

        self.stdout.write("🌱 Seeding realistic bookings and revenue data for the manager...")
        
        # Clear existing bookings for these theatres to prevent duplicate key errors on repeat seeding
        Booking.objects.filter(show__theatre__in=managed_theatres).delete()

        import uuid
        from apps.bookings.utils import generate_qr_code_base64
        
        now = timezone.now()
        booking_count = 0
        
        for t in managed_theatres:
            # Fetch shows scheduled for this theatre
            shows = Show.objects.filter(theatre=t)
            if not shows.exists():
                continue
                
            # Create screens and populate seats if not already created
            screens = t.screens.all()
            for s in screens:
                # Ensure seat layouts are set
                if not s.seat_layout:
                    s.seat_layout = {
                        "A": "Silver", "B": "Silver", "C": "Silver", "D": "Silver",
                        "E": "Gold", "F": "Gold", "G": "Gold",
                        "H": "Platinum", "I": "Platinum", "J": "Platinum"
                    }
                    s.save()

            # Seed 12 bookings per theatre across different dates
            for i in range(12):
                show = random.choice(list(shows))
                cust = random.choice(customer_users)
                
                # Pick 2-4 random seats
                rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
                cols = [random.randint(1, 10) for _ in range(random.randint(2, 4))]
                cols = list(set(cols)) # unique columns
                row = random.choice(rows)
                
                seats_display = ", ".join([f"{row}{c}" for c in cols])
                num_tickets = len(cols)
                price_per_ticket = float(show.price)
                total_price = num_tickets * price_per_ticket
                
                booking_id = f"BK{t.id:02d}{random.randint(1000, 9999)}"
                
                # Determine created date (spread over last 7 days)
                days_ago = random.randint(0, 6)
                created_date = now - timedelta(days=days_ago, hours=random.randint(0, 23))
                
                booking = Booking.objects.create(
                    booking_id=booking_id,
                    user=cust,
                    show=show,
                    seats_display=seats_display,
                    total_price=total_price,
                    status='Confirmed'
                )
                # Bypass auto_now_add using update
                Booking.objects.filter(id=booking.id).update(created_at=created_date)
                
                # Create Payment
                payment = Payment.objects.create(
                    booking=booking,
                    method=random.choice(['Credit Card', 'UPI', 'Net Banking']),
                    status='Successful',
                    amount=total_price
                )
                Payment.objects.filter(id=payment.id).update(created_at=created_date)
                
                # Mark seats as booked for this show
                for col in cols:
                    seat_obj, _ = Seat.objects.get_or_create(
                        show=show,
                        row_label=row,
                        column_number=col,
                        defaults={
                            "status": "Booked",
                            "category": "Gold" if row in ["E", "F", "G"] else ("Platinum" if row == "H" else "Silver"),
                            "price": show.price
                        }
                    )
                    if seat_obj.status != 'Booked':
                        seat_obj.status = 'Booked'
                        seat_obj.save()
                
                # Generate QR code
                show_title = show.movie.title if show.movie else (show.event.title if show.event else show.sports_event.title)
                show_info = f"{show_title} @ {t.name} on {show.start_time.strftime('%Y-%m-%d %H:%M')}"
                booking.qr_code_url = generate_qr_code_base64(booking.booking_id, show_info)
                booking.save()
                
                booking_count += 1
                
        self.stdout.write(f"  🎟️ Seeded {booking_count} bookings and transaction histories.")
        self.stdout.write(self.style.SUCCESS("\n✅ Demo data seeded successfully!"))
