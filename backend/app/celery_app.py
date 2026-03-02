from celery import Celery
from kombu import Queue
from app.core.config import settings

celery_app = Celery(
    "viralbot",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.youtube_tasks",
        "app.tasks.video_tasks",
        "app.tasks.ai_tasks",
        "app.tasks.tiktok_tasks",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_queues=[
        Queue("default"),
        Queue("video_processing"),
        Queue("ai_processing"),
        Queue("tiktok_publishing"),
    ],
    task_default_queue="default",
    task_routes={
        "app.tasks.video_tasks.*": {"queue": "video_processing"},
        "app.tasks.ai_tasks.*": {"queue": "ai_processing"},
        "app.tasks.tiktok_tasks.*": {"queue": "tiktok_publishing"},
    },
    beat_schedule={
        "check-scheduled-videos": {
            "task": "app.tasks.tiktok_tasks.publish_scheduled_videos",
            "schedule": 60.0,  # every minute
        },
        "fetch-trending-videos": {
            "task": "app.tasks.youtube_tasks.auto_fetch_trending",
            "schedule": 3600.0,  # every hour
        },
        "update-tiktok-stats": {
            "task": "app.tasks.tiktok_tasks.update_video_stats",
            "schedule": 1800.0,  # every 30 minutes
        },
    }
)
