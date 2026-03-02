from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.video import Video, VideoStatus

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard overview statistics"""
    
    # Video counts by status
    status_counts = {}
    for status in VideoStatus:
        result = await db.execute(select(func.count(Video.id)).where(Video.status == status))
        status_counts[status.value] = result.scalar()
    
    # Total views
    views_result = await db.execute(select(func.sum(Video.tiktok_views)))
    total_tiktok_views = views_result.scalar() or 0
    
    youtube_views_result = await db.execute(select(func.sum(Video.youtube_views)))
    total_youtube_views = youtube_views_result.scalar() or 0
    
    # Total published
    published_result = await db.execute(
        select(func.count(Video.id)).where(Video.status == VideoStatus.PUBLISHED)
    )
    total_published = published_result.scalar()
    
    # Avg virality score
    virality_result = await db.execute(select(func.avg(Video.virality_score)))
    avg_virality = round(virality_result.scalar() or 0, 2)
    
    # Recent videos
    recent_result = await db.execute(
        select(Video).order_by(Video.created_at.desc()).limit(5)
    )
    recent_videos = recent_result.scalars().all()
    
    return {
        "overview": {
            "total_videos": sum(status_counts.values()),
            "total_published": total_published,
            "total_tiktok_views": total_tiktok_views,
            "total_youtube_views": total_youtube_views,
            "avg_virality_score": avg_virality,
            "pending_approval": status_counts.get("ready", 0),
        },
        "status_breakdown": status_counts,
        "recent_videos": [
            {
                "id": v.id,
                "title": v.youtube_title,
                "status": v.status,
                "virality_score": v.virality_score,
                "thumbnail": v.youtube_thumbnail,
                "created_at": v.created_at,
            }
            for v in recent_videos
        ],
        "pipeline": {
            "processing": status_counts.get("processing", 0) + status_counts.get("downloading", 0) + status_counts.get("ai_analysis", 0),
            "ready_to_publish": status_counts.get("approved", 0),
            "failed": status_counts.get("failed", 0),
        }
    }
