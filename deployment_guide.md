# CineHub – Discover, Experience & Book Entertainment
## Production Deployment & Developer Operations Guide

CineHub is a premium, full-stack entertainment booking application built using Django (REST Framework) and React.js. It features modern glassmorphism, auto-scrolling hero banners, secure seat layouts, automatic reservation expirations, collaborative group bookings, and analytics charts.

---

## 1. Project Folder Structure

```text
CineHub/
├── backend/                       # Django Backend
│   ├── apps/
│   │   ├── authentication/        # User accounts, Profiles, Locations, Rewards, Alerts
│   │   ├── movies/                # Movies catalog, Theatres, Shows, Watchlists, Sentiment Reviews
│   │   ├── events/                # Music concerts, Comedy shows, Venues, category listings
│   │   └── bookings/              # Seat grids, Tickets, Reservations, Payments, Group booking planner
│   ├── cinehub/
│   │   ├── settings.py            # Main Django configuration file
│   │   ├── urls.py                # Main URL router
│   │   └── celery.py              # Celery task manager
│   ├── manage.py
│   └── venv/                      # Local Python Virtual Environment
├── frontend/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/            # Header, Footer, GlassmorphicCard
│   │   ├── pages/                 # Dashboard, Details, Seating, GroupBooking, Profile, Login, Admin
│   │   ├── store/                 # Redux Toolkit setup
│   │   ├── main.jsx               # Application mounter & MUI theme
│   │   ├── App.jsx                # Router config
│   │   └── index.css              # Main glassmorphic styling
│   ├── package.json
│   ├── index.html
│   └── vite.config.js
├── postgres_schema.sql            # Compiled PostgreSQL Table definitions & constraints
├── api_documentation.md           # Complete REST APIs Specification
└── deployment_guide.md            # This manual
```

---

## 2. Environment Prerequisites

### 1. Node.js Environment
For hosts that do not have Node.js/npm pre-installed globally (e.g. macOS ARM64 / Apple Silicon):
1. Download the macOS arm64 binary archive:
   ```bash
   mkdir -p ~/node
   curl -o ~/node.tar.gz https://nodejs.org/dist/v20.11.1/node-v20.11.1-darwin-arm64.tar.gz
   tar -xzf ~/node.tar.gz -C ~/node --strip-components=1
   ```
2. Add the Node.js path to command invocation or your profile:
   ```bash
   export PATH=~/node/bin:$PATH
   ```

### 2. Python Runtimes
- Python 3.9+
- Standard virtual environment library: `python3 -m venv`

---

## 3. Backend Installation & Operations

1. Navigate to the `backend` directory, activate the virtual environment, and install dependencies:
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Run database migrations to prepare the local schema:
   ```bash
   python manage.py migrate
   ```
3. Seed the local movie database with sample locations, films, theatres, sports, events, and default admin accounts:
   ```bash
   python manage.py seed_data
   ```
   *Note: This creates the default admin user: `admin@cinehub.com` with password `adminpass`.*
4. Start the Django API web server:
   ```bash
   python manage.py runserver
   ```
   The API server will run at `http://127.0.0.1:8000/`.

---

## 4. Database Configuration (PostgreSQL vs SQLite)

By default, the backend checks for PostgreSQL environment variables. To connect a live PostgreSQL instance, define the following variables in your execution shell:
- `POSTGRES_DB` (Name of your database)
- `POSTGRES_USER` (Database username)
- `POSTGRES_PASSWORD` (Database user password)
- `POSTGRES_HOST` (Database hostname, e.g. `localhost`)
- `POSTGRES_PORT` (Port number, e.g. `5432`)

If `POSTGRES_DB` is not specified, CineHub safely falls back to using the local SQLite database file `db.sqlite3`.

To set up a PostgreSQL schema, run the script [postgres_schema.sql](file:///Users/alkamariyam/Documents/CineHub/postgres_schema.sql) in your database query editor:
```bash
psql -h <host> -U <username> -d <db_name> -f postgres_schema.sql
```

---

## 5. Background Tasks & Email Configurations

### Celery Background Scheduler
- **Development Fallback (Eager Mode)**: When a local Redis server is not running, Celery executes tasks synchronously in the same thread. This is enabled automatically (`CELERY_TASK_ALWAYS_EAGER = True`).
- **Production Setup (Redis Broker)**: Start a Redis instance on `redis://127.0.0.1:6379/0` and launch the Celery task scheduler:
  ```bash
  source venv/bin/activate
  celery -A cinehub worker --loglevel=info
  ```

### SMTP Email Settings
Configure standard SMTP mail deliveries inside `backend/cinehub/settings.py` for automated reservation reminder emails and booking receipts:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-gmail-app-password'
```

---

## 6. Frontend Compilation & Local Server

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the node packages (injecting the path to the portable Node folder if needed):
   ```bash
   PATH=~/node/bin:$PATH npm install
   ```
3. Run the React local development server:
   ```bash
   PATH=~/node/bin:$PATH npm run dev
   ```
4. Access the client panel at `http://localhost:5173/`.
5. To build a compressed, optimized production bundle (saved inside the `dist/` directory):
   ```bash
   PATH=~/node/bin:$PATH npm run build
   ```
