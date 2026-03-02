from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter()

class AISettings(BaseModel):
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4-turbo-preview"
    whisper_model: str = "whisper-1"
    default_language: str = "fr"
    auto_translate: bool = False

class VideoSettings(BaseModel):
    target_duration: int = 60
    add_captions: bool = True
    add_progress_bar: bool = True
    add_music: bool = False
    output_quality: str = "high"
    auto_approve: bool = False

class PublicationSettings(BaseModel):
    auto_publish: bool = False
    default_privacy: str = "SELF_ONLY"
    publish_interval_hours: int = 4
    max_daily_posts: int = 3

@router.get("")
async def get_settings(current_user: User = Depends(get_current_user)):
    """Get current application settings"""
    from app.core.config import settings
    return {
        "ai": {
            "openai_model": settings.OPENAI_MODEL,
            "whisper_model": settings.WHISPER_MODEL,
            "api_configured": bool(settings.OPENAI_API_KEY),
        },
        "youtube": {
            "api_configured": bool(settings.YOUTUBE_API_KEY),
            "max_results": settings.YOUTUBE_MAX_RESULTS,
        },
        "tiktok": {
            "client_configured": bool(settings.TIKTOK_CLIENT_KEY),
        },
        "video": {
            "target_width": settings.VIDEO_TARGET_WIDTH,
            "target_height": settings.VIDEO_TARGET_HEIGHT,
            "fps": settings.VIDEO_FPS,
        }
    }

@router.get("/ai")
async def get_ai_settings(current_user: User = Depends(get_current_user)):
    return {"model": "gpt-4-turbo-preview", "configured": True}

@router.get("/video-processing")
async def get_video_settings(current_user: User = Depends(get_current_user)):
    return {
        "target_duration": 60,
        "add_captions": True,
        "add_progress_bar": True,
        "output_quality": "high",
    }
