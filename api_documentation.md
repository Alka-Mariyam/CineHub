# CineHub REST API Documentation

All API requests should be sent to the base URL: `/api`.
Private endpoints require the `Authorization: Bearer <Access_Token>` header.

---

## 1. Authentication & User Management

### Register User
* **URL**: `/auth/register/`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+919876543210",
    "password": "strongpassword123"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+919876543210"
  }
  ```

### User Login
* **URL**: `/auth/login/`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "refresh": "eyJhbGciOi...",
    "access": "eyJhbGciOi..."
  }
  ```

### Fetch/Update User Profile (with Location Detection)
* **URL**: `/auth/profile/`
* **Method**: `GET` / `PATCH`
* **Access**: Authenticated
* **Request Body (PATCH)**:
  ```json
  {
    "current_location_id": 2
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+919876543210",
    "total_reward_points": 125,
    "current_location": {
      "id": 2,
      "country": "India",
      "state": "Maharashtra",
      "city": "Mumbai",
      "town": "Andheri"
    }
  }
  ```

---

## 2. Locations Catalog

### List Locations
* **URL**: `/auth/locations/`
* **Method**: `GET`
* **Access**: Public
* **Query Params**:
  * `search`: Filter by state/city name.
* **Response (200 OK)**:
  ```json
  {
    "results": [
      {
        "id": 1,
        "country": "India",
        "state": "Maharashtra",
        "city": "Mumbai",
        "town": "Bandra"
      }
    ]
  }
  ```

---

## 3. Catalog - Movies, Events, Sports & Shows

### List Movies
* **URL**: `/movies/`
* **Method**: `GET`
* **Access**: Public
* **Query Params**:
  * `search`: Search by movie title.
  * `mood`: Filter by mood (`Happy`, `Excited`, `Romantic`, `Scared`).
  * `genre`: Filter by genre.
  * `language`: Filter by language.
* **Response (200 OK)**:
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "title": "Interstellar",
        "poster": "https://images.unsplash.com/...",
        "language": "English",
        "duration": 169,
        "genre": "Sci-Fi",
        "rating": "8.6",
        "votes": 500000,
        "synopsis": "A team of explorers travel through a wormhole...",
        "mood": "Excited",
        "is_trending": true
      }
    ]
  }
  ```

### List Shows
* **URL**: `/shows/`
* **Method**: `GET`
* **Access**: Public
* **Query Params**:
  * `movie`: Filter showtimes by Movie ID.
  * `event`: Filter showtimes by Event ID.
  * `sports_event`: Filter showtimes by Sports Event ID.
  * `city`: Filter by city name (e.g. `Mumbai`).
* **Response (200 OK)**:
  ```json
  {
    "results": [
      {
        "id": 5,
        "start_time": "2026-06-10T18:00:00Z",
        "end_time": "2026-06-10T21:00:00Z",
        "price": "12.00",
        "movie": 1,
        "theatre": {
          "id": 2,
          "name": "PVR Icon",
          "location": 1
        }
      }
    ]
  }
  ```

---

## 4. Bookings & Reservation Engine

### Get Seat Layout Map
* **URL**: `/seats/`
* **Method**: `GET`
* **Access**: Public
* **Query Params**:
  * `show`: **(Required)** Show ID.
* **Response (200 OK)**:
  ```json
  [
    {
      "id": 12,
      "row_label": "A",
      "column_number": 1,
      "status": "Available",
      "reserved_until": null
    },
    {
      "id": 13,
      "row_label": "A",
      "column_number": 2,
      "status": "Reserved",
      "reserved_until": "2026-06-09T17:50:00Z"
    }
  ]
  ```

### Reserve Seats (Book Later Flow)
* **URL**: `/reserve/`
* **Method**: `POST`
* **Access**: Authenticated
* **Request Body**:
  ```json
  {
    "show": 5,
    "seats": ["A1", "A2"]
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "booking": {
      "id": 23,
      "booking_id": "ABC8D",
      "seats_display": "A1, A2",
      "total_price": "24.00",
      "status": "Pending",
      "created_at": "2026-06-08T15:32:00Z"
    },
    "reservation": {
      "id": 10,
      "seats_display": "A1, A2",
      "expires_at": "2026-06-09T18:00:00Z",
      "status": "Active"
    }
  }
  ```
  *(Note: Seats will automatically expire using background tasks if payment is not finalized. Valid until 1 day before showtime, or locked for 10 minutes).*

### Finalize Payment & Generate QR Ticket
* **URL**: `/payment/`
* **Method**: `POST`
* **Access**: Authenticated
* **Request Body**:
  ```json
  {
    "booking_id": "ABC8D",
    "method": "UPI",
    "redeem_points": true,
    "gift_card_code": "GC80X"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "booking": {
      "id": 23,
      "booking_id": "ABC8D",
      "seats_display": "A1, A2",
      "total_price": "24.00",
      "status": "Confirmed",
      "qr_code_url": "data:image/png;base64,iVBORw0KG..."
    },
    "payment": {
      "transaction_id": "TX98Z",
      "status": "Successful",
      "amount": "4.00",
      "method": "UPI"
    },
    "points_earned": 10,
    "points_redeemed": 20
  }
  ```

---

## 5. Collaborative Group Bookings

### Create Group Booking Invite
* **URL**: `/group/create/`
* **Method**: `POST`
* **Access**: Authenticated
* **Request Body**:
  ```json
  {
    "show": 5,
    "seats": ["C3"]
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": 4,
    "invite_code": "GRP44",
    "status": "Active",
    "members": [
      {
        "name": "John Doe",
        "seats_display": "C3",
        "status": "Selected"
      }
    ]
  }
  ```

### Join Group Booking Planner (Supports Guest Usernames)
* **URL**: `/group/join/`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "invite_code": "GRP44",
    "name": "Jane Smith",
    "seats": ["C4"]
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": 4,
    "invite_code": "GRP44",
    "status": "Active",
    "members": [
      {
        "name": "John Doe",
        "seats_display": "C3",
        "status": "Selected"
      },
      {
        "name": "Jane Smith",
        "seats_display": "C4",
        "status": "Selected"
      }
    ]
  }
  ```

### Pay & Finalize Group booking
* **URL**: `/group/pay/`
* **Method**: `POST`
* **Access**: Authenticated (Organizer only)
* **Request Body**:
  ```json
  {
    "invite_code": "GRP44",
    "method": "Credit Card"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "group_booking": {
      "invite_code": "GRP44",
      "status": "Completed"
    },
    "booking": {
      "booking_id": "GRP8K",
      "seats_display": "C3, C4",
      "status": "Confirmed",
      "qr_code_url": "data:image/png;base64,iVBORw..."
    }
  }
  ```

---

## 6. Sentiment Analysis & Reviews

### Submit Review
* **URL**: `/reviews/`
* **Method**: `POST`
* **Access**: Authenticated
* **Request Body**:
  ```json
  {
    "movie": 1,
    "rating": 9,
    "comment": "Absolutely brilliant masterpiece! Loved the background score."
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": 12,
    "rating": 9,
    "comment": "Absolutely brilliant masterpiece! Loved the background score.",
    "sentiment": "Positive"
  }
  ```
  *(Note: Django backend automatically triggers a simple sentiment parsing rule mapping keyword highlights to Positive/Negative highlights for movies summary).*
