from celery import shared_task
import asyncio
import structlog
from datetime import datetime, timezone

from app.celery_app import celery_app

logger = structlog.get_logger()

@celery_app.task(name="app.tasks.tiktok_tasks.publish_scheduled_videos")
def publish_scheduled_videos():
    """Check and publish scheduled videos"""
    from app.core.database import AsyncSessionLocal
    from app.models.video import Video, VideoStatus
    from app.services.tiktok_service import tiktok_service
    from sqlalchemy import select, and_
    
    async def _run():
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            result = await db.execute(
                select(Video).where(
                    and_(
                        Video.status == VideoStatus.APPROVED,
                        Video.scheduled_at <= now,
                        Video.scheduled_at.isnot(None)
                    )
                )
            )
            videos = result.scalars().all()
            
            for video in videos:
                try:
                    account = video.tiktok_account
                    if not account:
                        continue
                    
                    token = await tiktok_service.ensure_valid_token(account, db)
                    result = await tiktok_service.publish_video(
                        access_token=token,
                        video_path=video.processed_url,
                        title=video.tiktok_title or video.youtube_title,
                        description=video.tiktok_description or "",
                        hashtags=video.tiktok_hashtags or [],
                        privacy_level="PUBLIC_TO_EVERYONE"
                    )
                    
                    video.status = VideoStatus.PUBLISHED
                    video.tiktok_post_id = result.get("publish_id")
                    video.published_at = now
                    await db.commit()
                    
                    logger.info("Video published to TikTok", video_id=video.id)
                except Exception as e:
                    logger.error("Publish failed", video_id=video.id, error=str(e))
                    video.status = VideoStatus.FAILED
                    video.error_message = str(e)
                    await db.commit()
    
    asyncio.get_event_loop().run_until_complete(_run())

@celery_app.task(name="app.tasks.tiktok_tasks.update_video_stats")
def update_video_stats():
    """Update TikTok video stats"""
    logger.info("Updating TikTok video stats...")

@celery_app.task(name="app.tasks.youtube_tasks.auto_fetch_trending")
def auto_fetch_trending():
    """Auto-fetch trending YouTube videos"""
    from app.core.database import AsyncSessionLocal
    from app.services.youtube_service import youtube_service
    
    async def _run():
        async with AsyncSessionLocal() as db:
            trending = await youtube_service.get_trending_videos(region_code="FR")
            logger.info(f"Fetched {len(trending)} trending videos")
    
    asyncio.get_event_loop().run_until_complete(_run())
