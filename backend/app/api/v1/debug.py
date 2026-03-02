from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import time
import os

from app.core.database import get_db
from app.core.config import settings
from app.services.youtube_service import youtube_service
from app.services.ai_service import ai_service

router = APIRouter()

@router.get("/tests")
async def run_system_tests(db: AsyncSession = Depends(get_db)):
    results = {}
    
    # 1. Database Connection Test
    try:
        start_time = time.time()
        await db.execute(text("SELECT 1"))
        results["database"] = {
            "status": "online",
            "latency_ms": round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        results["database"] = {"status": "offline", "error": str(e)}

    # 2. Storage Check
    results["storage"] = {
        "path": settings.STORAGE_PATH,
        "exists": os.path.exists(settings.STORAGE_PATH),
        "writable": os.access(settings.STORAGE_PATH, os.W_OK) if os.path.exists(settings.STORAGE_PATH) else False
    }

    # 3. YouTube API Check
    try:
        if not settings.YOUTUBE_API_KEY:
             results["youtube_api"] = {"status": "missing_key"}
        else:
            # Simple metadata check to verify key validity
            await youtube_service.get_trending_videos(region_code="FR", category_id="")
            results["youtube_api"] = {"status": "connected"}
    except Exception as e:
        results["youtube_api"] = {"status": "error", "message": str(e)}

    # 4. Gemini AI Check
    try:
        if not settings.GEMINI_API_KEY:
            results["gemini_ai"] = {"status": "missing_key"}
        else:
            await ai_service.translate_content("Hello", "fr")
            results["gemini_ai"] = {"status": "connected"}
    except Exception as e:
        results["gemini_ai"] = {"status": "error", "message": str(e)}

    # 5. Environment
    results["environment"] = {
        "app_name": settings.APP_NAME,
        "debug_mode": settings.DEBUG,
        "ai_provider": settings.AI_PROVIDER
    }

    return results
