from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "productbajar",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    beat_schedule={
        # Expire deals every hour
        "expire-deals": {
            "task": "app.worker.tasks.expire_deals",
            "schedule": 3600.0,
        },
        # Activate scheduled deals every 5 minutes
        "activate-scheduled-deals": {
            "task": "app.worker.tasks.activate_scheduled_deals",
            "schedule": 300.0,
        },
    },
)
