-- ============================================================================
-- CineHub PostgreSQL Database Schema
-- Inspired by BookMyShow with Netflix-style specifications
-- Generated for PostgreSQL 13+
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LOCATION MODULE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authentication_location (
    id BIGSERIAL PRIMARY KEY,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    town VARCHAR(100) NULL,
    CONSTRAINT unique_location UNIQUE (country, state, city, town)
);

-- ----------------------------------------------------------------------------
-- 2. USER AUTHENTICATION & PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authentication_user (
    id BIGSERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE NULL,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(254) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    date_joined TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_location_id BIGINT NULL REFERENCES authentication_location(id) ON DELETE SET NULL
);

-- Create indexes for user lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON authentication_user(email);
CREATE INDEX IF NOT EXISTS idx_user_location ON authentication_user(current_location_id);

-- Django standard Many-To-Many relations for authentication
CREATE TABLE IF NOT EXISTS authentication_user_groups (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL -- References Django auth_group
);
CREATE UNIQUE INDEX IF NOT EXISTS authentication_user_groups_user_id_group_id_uniq ON authentication_user_groups(user_id, group_id);

CREATE TABLE IF NOT EXISTS authentication_user_user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL -- References Django auth_permission
);
CREATE UNIQUE INDEX IF NOT EXISTS authentication_user_user_permissions_user_id_permission_id_uniq ON authentication_user_user_permissions(user_id, permission_id);

-- ----------------------------------------------------------------------------
-- 3. REWARD SYSTEM & NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authentication_rewardpoints (
    id BIGSERIAL PRIMARY KEY,
    points INTEGER NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_rewardpoints_user ON authentication_rewardpoints(user_id);

CREATE TABLE IF NOT EXISTS authentication_notification (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notification_user ON authentication_notification(user_id);

-- ----------------------------------------------------------------------------
-- 4. VENUES & EVENTS MODULE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events_venue (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 500,
    address TEXT NULL,
    location_id BIGINT NOT NULL REFERENCES authentication_location(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_venue_location ON events_venue(location_id);

CREATE TABLE IF NOT EXISTS events_event (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    banner VARCHAR(1000) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    available_seats INTEGER NOT NULL DEFAULT 100,
    price NUMERIC(8, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    venue_id BIGINT NOT NULL REFERENCES events_venue(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_venue ON events_event(venue_id);

CREATE TABLE IF NOT EXISTS events_sportsevent (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    banner VARCHAR(1000) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    stadium_name VARCHAR(255) NOT NULL,
    stadium_details TEXT NULL,
    match_timings VARCHAR(100) NOT NULL,
    seating_information TEXT NULL,
    available_seats INTEGER NOT NULL DEFAULT 500,
    price NUMERIC(8, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    venue_id BIGINT NOT NULL REFERENCES events_venue(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sportsevent_venue ON events_sportsevent(venue_id);

-- ----------------------------------------------------------------------------
-- 5. MOVIES CATALOG & SHOWTIMES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movies_movie (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    poster VARCHAR(1000) NOT NULL,
    trailer VARCHAR(1000) NULL,
    language VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL,
    genre VARCHAR(255) NOT NULL,
    rating NUMERIC(3, 1) NOT NULL DEFAULT 0.0,
    votes INTEGER NOT NULL DEFAULT 0,
    synopsis TEXT NOT NULL,
    cast JSONB NOT NULL DEFAULT '[]'::jsonb,
    crew JSONB NOT NULL DEFAULT '[]'::jsonb,
    mood VARCHAR(20) NULL,
    is_premiere BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_release BOOLEAN NOT NULL DEFAULT FALSE,
    is_most_booked BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_movie_mood ON movies_movie(mood);

CREATE TABLE IF NOT EXISTS movies_theatre (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NULL,
    coordinates VARCHAR(100) NULL,
    location_id BIGINT NOT NULL REFERENCES authentication_location(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_theatre_location ON movies_theatre(location_id);

CREATE TABLE IF NOT EXISTS movies_show (
    id BIGSERIAL PRIMARY KEY,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price NUMERIC(8, 2) NOT NULL,
    movie_id BIGINT NULL REFERENCES movies_movie(id) ON DELETE CASCADE,
    theatre_id BIGINT NULL REFERENCES movies_theatre(id) ON DELETE CASCADE,
    event_id BIGINT NULL REFERENCES events_event(id) ON DELETE CASCADE,
    sports_event_id BIGINT NULL REFERENCES events_sportsevent(id) ON DELETE CASCADE,
    venue_id BIGINT NULL REFERENCES events_venue(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_show_movie ON movies_show(movie_id);
CREATE INDEX IF NOT EXISTS idx_show_theatre ON movies_show(theatre_id);
CREATE INDEX IF NOT EXISTS idx_show_event ON movies_show(event_id);
CREATE INDEX IF NOT EXISTS idx_show_sports_event ON movies_show(sports_event_id);

-- ----------------------------------------------------------------------------
-- 6. REVIEWS & WATCHLISTS (RECOMMENDATIONS & SENTIMENTS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movies_review (
    id BIGSERIAL PRIMARY KEY,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    sentiment VARCHAR(20) NOT NULL DEFAULT 'Neutral',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE,
    movie_id BIGINT NULL REFERENCES movies_movie(id) ON DELETE CASCADE,
    event_id BIGINT NULL REFERENCES events_event(id) ON DELETE CASCADE,
    sports_event_id BIGINT NULL REFERENCES events_sportsevent(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_review_user ON movies_review(user_id);
CREATE INDEX IF NOT EXISTS idx_review_movie ON movies_review(movie_id);

CREATE TABLE IF NOT EXISTS movies_watchlist (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE,
    movie_id BIGINT NULL REFERENCES movies_movie(id) ON DELETE CASCADE,
    event_id BIGINT NULL REFERENCES events_event(id) ON DELETE CASCADE,
    sports_event_id BIGINT NULL REFERENCES events_sportsevent(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_movie UNIQUE (user_id, movie_id),
    CONSTRAINT unique_user_event UNIQUE (user_id, event_id),
    CONSTRAINT unique_user_sports UNIQUE (user_id, sports_event_id)
);

-- ----------------------------------------------------------------------------
-- 7. BOOKINGS, RESERVATIONS, & SEATING LAYOUT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings_booking (
    id BIGSERIAL PRIMARY KEY,
    seats_display VARCHAR(255) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    booking_id VARCHAR(50) NOT NULL UNIQUE,
    qr_code_url VARCHAR(1000) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    show_id BIGINT NOT NULL REFERENCES movies_show(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_booking_uid ON bookings_booking(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_user ON bookings_booking(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_show ON bookings_booking(show_id);

CREATE TABLE IF NOT EXISTS bookings_reservation (
    id BIGSERIAL PRIMARY KEY,
    seats_display VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    booking_id BIGINT NULL UNIQUE REFERENCES bookings_booking(id) ON DELETE SET NULL,
    show_id BIGINT NOT NULL REFERENCES movies_show(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reservation_user ON bookings_reservation(user_id);
CREATE INDEX IF NOT EXISTS idx_reservation_show ON bookings_reservation(show_id);

CREATE TABLE IF NOT EXISTS bookings_payment (
    id BIGSERIAL PRIMARY KEY,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    amount NUMERIC(10, 2) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    booking_id BIGINT NOT NULL REFERENCES bookings_booking(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payment_booking ON bookings_payment(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx ON bookings_payment(transaction_id);

CREATE TABLE IF NOT EXISTS bookings_giftcard (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    value NUMERIC(8, 2) NOT NULL,
    is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,
    redeemed_at TIMESTAMP WITH TIME ZONE NULL,
    redeemed_by_id BIGINT NULL REFERENCES authentication_user(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_giftcard_code ON bookings_giftcard(code);

CREATE TABLE IF NOT EXISTS bookings_seat (
    id BIGSERIAL PRIMARY KEY,
    row_label VARCHAR(2) NOT NULL,
    column_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    reserved_until TIMESTAMP WITH TIME ZONE NULL,
    reserved_by_id BIGINT NULL REFERENCES authentication_user(id) ON DELETE SET NULL,
    show_id BIGINT NOT NULL REFERENCES movies_show(id) ON DELETE CASCADE,
    CONSTRAINT unique_show_seat UNIQUE (show_id, row_label, column_number)
);
CREATE INDEX IF NOT EXISTS idx_seat_show ON bookings_seat(show_id);

-- ----------------------------------------------------------------------------
-- 8. COLLABORATIVE GROUP BOOKINGS MODULE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings_groupbooking (
    id BIGSERIAL PRIMARY KEY,
    invite_code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    organizer_id BIGINT NOT NULL REFERENCES authentication_user(id) ON DELETE CASCADE,
    show_id BIGINT NOT NULL REFERENCES movies_show(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_groupbooking_invite ON bookings_groupbooking(invite_code);
CREATE INDEX IF NOT EXISTS idx_groupbooking_organizer ON bookings_groupbooking(organizer_id);

CREATE TABLE IF NOT EXISTS bookings_groupbookingmember (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    seats_display VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Selected',
    group_booking_id BIGINT NOT NULL REFERENCES bookings_groupbooking(id) ON DELETE CASCADE,
    user_id BIGINT NULL REFERENCES authentication_user(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_groupbookingmember_group ON bookings_groupbookingmember(group_booking_id);
CREATE INDEX IF NOT EXISTS idx_groupbookingmember_user ON bookings_groupbookingmember(user_id);
