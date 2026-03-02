from celery import shared_task
from sqlalchemy.orm import Session
import asyncio
import os
import structlog

from app.celery_app import celery_app
from app.core.config import settings
from app.services.youtube_service import youtube_service
from app.services.ai_service import ai_service
from app.services.video_service import video_processor

logger = structlog.get_logger()

@celery_app.task(bind=True, name="app.tasks.video_tasks.process_full_pipeline", max_retries=3)
def process_full_pipeline(self, video_id: int):
    """Complete video processing pipeline: download → transcribe → AI → process → ready"""
    from app.core.database import AsyncSessionLocal
    from app.models.video import Video, VideoStatus
    
    async def _run():
        async with AsyncSessionLocal() as db:
            from sqlalchemy import select
            result = await db.execute(select(Video).where(Video.id == video_id))
            video = result.scalar_one_or_none()
            
            if not video:
                logger.error("Video not found", video_id=video_id)
                return
            
            try:
                # Step 1: Download
                video.status = VideoStatus.DOWNLOADING
                await db.commit()
                
                download_path = await youtube_service.download_video(
                    video.youtube_id, settings.DOWNLOADS_PATH
                )
                video.download_url = download_path
                video.status = VideoStatus.AI_ANALYSIS
                await db.commit()
                
                # Step 2: Transcribe
                transcript_data = await ai_service.transcribe_audio(download_path)
                video.transcript = transcript_data["text"]
                
                # Step 3: AI Content Generation
                content = await ai_service.generate_tiktok_content(
                    transcript=transcript_data["text"],
                    video_title=video.youtube_title,
                    channel=video.youtube_channel,
                )
                
                video.tiktok_title = content.get("tiktok_title")
                video.tiktok_description = content.get("description")
                video.tiktok_hashtags = content.get("hashtags", [])
                video.hook = content.get("hook")
                video.summary = content.get("summary")
                
                # Emotional analysis
                emotions = await ai_service.analyze_emotions(transcript_data["text"])
                video.emotional_score = emotions
                
                # Step 4: Video Processing
                video.status = VideoStatus.PROCESSING
                await db.commit()
                
                target_duration = content.get("suggested_duration", 60)
                output_filename = f"processed_{video.youtube_id}.mp4"
                output_path = os.path.join(settings.PROCESSED_PATH, output_filename)
                
                await video_processor.process_video(
                    input_path=download_path,
                    output_path=output_path,
                    transcript_segments=transcript_data.get("segments", []),
                    target_duration=target_duration
                )
                
                video.processed_url = output_path
                video.status = VideoStatus.READY
                await db.commit()
                
                logger.info("✅ Pipeline complete", video_id=video_id)
                
            except Exception as e:
                video.status = VideoStatus.FAILED
                video.error_message = str(e)
                await db.commit()
                logger.error("Pipeline failed", video_id=video_id, error=str(e))
                if self:
                    raise self.retry(exc=e, countdown=60)
                else:
                    raise e
    
    asyncio.get_event_loop().run_until_complete(_run())
