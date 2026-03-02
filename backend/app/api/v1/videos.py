from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import structlog

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.video import Video, VideoStatus

router = APIRouter()
logger = structlog.get_logger()

class VideoUpdateRequest(BaseModel):
    tiktok_title: Optional[str] = None
    tiktok_description: Optional[str] = None
    tiktok_hashtags: Optional[List[str]] = None
    hook: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    tiktok_account_id: Optional[int] = None

@router.get("")
async def list_videos(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all videos with pagination and filtering"""
    query = select(Video).order_by(desc(Video.created_at))
    
    if status:
        query = query.where(Video.status == status)
    
    # Total count
    count_query = select(func.count(Video.id))
    if status:
        count_query = count_query.where(Video.status == status)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Paginate
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    videos = result.scalars().all()
    
    return {
        "videos": [_video_to_dict(v) for v in videos],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{video_id}")
async def get_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return _video_to_dict(video)

@router.put("/{video_id}")
async def update_video(
    video_id: int,
    data: VideoUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if data.tiktok_title is not None:
        video.tiktok_title = data.tiktok_title
    if data.tiktok_description is not None:
        video.tiktok_description = data.tiktok_description
    if data.tiktok_hashtags is not None:
        video.tiktok_hashtags = data.tiktok_hashtags
    if data.hook is not None:
        video.hook = data.hook
    if data.scheduled_at is not None:
        video.scheduled_at = data.scheduled_at
    if data.tiktok_account_id is not None:
        video.tiktok_account_id = data.tiktok_account_id
    
    await db.commit()
    await db.refresh(video)
    return _video_to_dict(video)

@router.post("/{video_id}/approve")
async def approve_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.status not in [VideoStatus.READY, VideoStatus.REJECTED]:
        raise HTTPException(status_code=400, detail=f"Cannot approve video with status {video.status}")
    
    video.status = VideoStatus.APPROVED
    await db.commit()
    return {"status": "approved", "video_id": video_id}

@router.post("/{video_id}/reject")
async def reject_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video.status = VideoStatus.REJECTED
    await db.commit()
    return {"status": "rejected", "video_id": video_id}

@router.post("/{video_id}/reprocess")
async def reprocess_video(
    video_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Re-trigger the processing pipeline"""
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video.status = VideoStatus.PENDING
    video.error_message = None
    await db.commit()
    
    from app.tasks.video_tasks import process_full_pipeline
    logger.info("🔄 Re-starting background task directly for local dev", video_id=video_id)
    background_tasks.add_task(process_full_pipeline, None, video_id)
    
    return {"status": "reprocessing", "video_id": video_id}

@router.delete("/{video_id}")
async def delete_video(
    video_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await db.delete(video)
    await db.commit()
    return {"status": "deleted"}

def _video_to_dict(video: Video) -> dict:
    return {
        "id": video.id,
        "youtube_id": video.youtube_id,
        "youtube_title": video.youtube_title,
        "youtube_channel": video.youtube_channel,
        "youtube_url": video.youtube_url,
        "youtube_thumbnail": video.youtube_thumbnail,
        "youtube_views": video.youtube_views,
        "youtube_likes": video.youtube_likes,
        "youtube_duration": video.youtube_duration,
        "virality_score": video.virality_score,
        "status": video.status,
        "tiktok_title": video.tiktok_title,
        "tiktok_description": video.tiktok_description,
        "tiktok_hashtags": video.tiktok_hashtags,
        "hook": video.hook,
        "summary": video.summary,
        "emotional_score": video.emotional_score,
        "processed_url": video.processed_url,
        "scheduled_at": video.scheduled_at,
        "published_at": video.published_at,
        "tiktok_post_id": video.tiktok_post_id,
        "tiktok_views": video.tiktok_views,
        "tiktok_likes": video.tiktok_likes,
        "error_message": video.error_message,
        "created_at": video.created_at,
        "updated_at": video.updated_at,
    }
