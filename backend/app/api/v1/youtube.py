from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import structlog

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.video import Video, VideoStatus
from app.services.youtube_service import youtube_service

router = APIRouter()
logger = structlog.get_logger()

class SearchRequest(BaseModel):
    query: str = ""
    category_id: str = ""
    region_code: str = "FR"
    max_results: int = 20
    min_views: int = 50000
    order: str = "viewCount"
    video_duration: str = "medium"
    published_after: Optional[str] = None

class VideoImportRequest(BaseModel):
    youtube_id: str
    youtube_title: str
    youtube_channel: str
    youtube_url: str
    youtube_thumbnail: str
    youtube_views: int
    youtube_likes: int
    youtube_duration: int
    virality_score: float

@router.post("/search")
async def search_videos(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    """Search for viral videos on YouTube"""
    try:
        videos = await youtube_service.search_viral_videos(
            query=request.query,
            category_id=request.category_id,
            region_code=request.region_code,
            max_results=request.max_results,
            min_views=request.min_views,
            order=request.order,
            video_duration=request.video_duration,
            published_after=request.published_after
        )
        return {"videos": videos, "count": len(videos)}
    except Exception as e:
        logger.error("YouTube search failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trending")
async def get_trending(
    region_code: str = Query("FR"),
    category_id: str = Query(""),
    current_user: User = Depends(get_current_user)
):
    """Get trending YouTube videos"""
    try:
        videos = await youtube_service.get_trending_videos(
            region_code=region_code,
            category_id=category_id
        )
        return {"videos": videos, "count": len(videos)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
async def import_video(
    request: VideoImportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import a YouTube video into the pipeline"""
    # Check if already imported
    result = await db.execute(select(Video).where(Video.youtube_id == request.youtube_id))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Video already imported")
    
    # Create video record
    video = Video(
        youtube_id=request.youtube_id,
        youtube_title=request.youtube_title,
        youtube_channel=request.youtube_channel,
        youtube_url=request.youtube_url,
        youtube_thumbnail=request.youtube_thumbnail,
        youtube_views=request.youtube_views,
        youtube_likes=request.youtube_likes,
        youtube_duration=request.youtube_duration,
        virality_score=request.virality_score,
        status=VideoStatus.PENDING,
        created_by=current_user.id
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)
    
    # Trigger processing pipeline
    from app.tasks.video_tasks import process_full_pipeline
    logger.info("⚡ Starting background task directly for local dev", video_id=video.id)
    background_tasks.add_task(process_full_pipeline, None, video.id)
    
    return {"video_id": video.id, "status": "Pipeline started", "youtube_id": request.youtube_id}

@router.get("/categories")
async def get_categories(current_user: User = Depends(get_current_user)):
    """Get YouTube video categories"""
    return {
        "categories": [
            {"id": "1", "title": "Film & Animation"},
            {"id": "2", "title": "Autos & Vehicles"},
            {"id": "10", "title": "Music"},
            {"id": "15", "title": "Pets & Animals"},
            {"id": "17", "title": "Sports"},
            {"id": "20", "title": "Gaming"},
            {"id": "22", "title": "People & Blogs"},
            {"id": "23", "title": "Comedy"},
            {"id": "24", "title": "Entertainment"},
            {"id": "25", "title": "News & Politics"},
            {"id": "26", "title": "Howto & Style"},
            {"id": "27", "title": "Education"},
            {"id": "28", "title": "Science & Technology"},
        ]
    }
