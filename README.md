# Peer Feedback Hub

A beautiful web application for submitting and managing peer feedback with Django backend and SQLite database.

## Features

- ✅ Submit feedback with name, mentor, rating (1-10), and comments
- ✅ Display all feedback entries
- ✅ Calculate and display average rating
- ✅ Filter feedback by mentor
- ✅ View class details and statistics
- ✅ Real-time statistics (Total Feedback, Average Rating, Active Mentors)

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Django 4.2.7
- **API**: Django REST Framework
- **Database**: SQLite (local) / PostgreSQL (production)
- **CORS**: django-cors-headers

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Migrations

Create the database tables:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser (Optional)

To access Django admin panel:

```bash
python manage.py createsuperuser
```

### 4. Configure Environment

Copy `env.example` to `.env` (or set the variables in your hosting provider):

```
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```

To use PostgreSQL (recommended for deployment) also set:

```
POSTGRES_DB=feedbackhub
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### 5. Run the Server

```bash
python manage.py runserver
```

The application will be available at: `http://localhost:8000`

## API Endpoints

- `GET /api/feedback` - Get all feedback (optional query: `?mentor=MENTOR_NAME`)
- `POST /api/feedback` - Submit new feedback
- `DELETE /api/feedback/<id>` - Delete feedback by ID
- `GET /api/stats` - Get statistics (total feedback, average rating, active mentors)
- `GET /api/mentors` - Get list of all mentors
- `GET /api/classes` - Get class details with statistics

## Project Structure

```
diwali/
├── feedbackhub/          # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── api/                  # Django app
│   ├── models.py         # Database models
│   ├── views.py          # API views
│   ├── serializers.py    # Data serializers
│   └── urls.py           # API routes
├── templates/            # HTML templates
│   └── index.html        # Main frontend
├── manage.py
├── requirements.txt
└── db.sqlite3            # SQLite database (created after migration)
```

## Usage

1. Start the Django server
2. Open `http://localhost:8000` in your browser
3. Navigate between tabs:
   - **Submit Feedback**: Add new feedback entries
   - **Class Details**: View statistics for each mentor's class
   - **Filter by Mentor**: View and filter feedback by mentor

## Database Models

- **Feedback**: Stores feedback entries with reviewer name, peer name, mentor, rating, and comments
- **Mentor**: Stores mentor information (auto-created when feedback is submitted)
- **Class**: Represents class sessions (dynamically generated from mentor data)

## Notes

- The SQLite database (`db.sqlite3`) will be created automatically after running migrations
- If `POSTGRES_DB` is defined the project automatically switches to PostgreSQL
- Mentors are automatically created when feedback is submitted
- Statistics update in real-time after each feedback submission
- All API endpoints return JSON responses

## Deployment (Render / Railway / Fly.io)

1. **Create services**
   - Provision a PostgreSQL instance
   - Create a web service pointing to this repo
2. **Configure environment variables**
   - `DJANGO_SECRET_KEY`
   - `DJANGO_ALLOWED_HOSTS=my-app.onrender.com`
   - `CSRF_TRUSTED_ORIGINS=https://my-app.onrender.com`
   - PostgreSQL variables (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`)
   - `DJANGO_DEBUG=False`
3. **Build & start command**
   - Install deps: `pip install -r requirements.txt`
   - Collect static files: `python manage.py collectstatic --noinput`
   - Run migrations: `python manage.py migrate`
   - Start: `gunicorn feedbackhub.wsgi:application --bind 0.0.0.0:8000`
4. **Expose port 8000** (Render/Railway handle this automatically)

The site should now be reachable at your platform hostname without 404 errors.

