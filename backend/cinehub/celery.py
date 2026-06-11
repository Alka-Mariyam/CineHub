import os
from celery import Celery

# Set default Django settings module for celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cinehub.settings')

app = Celery('cinehub')

# Load task config from Django settings, using a 'CELERY_' namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in registered apps
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
