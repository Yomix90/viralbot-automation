from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user
from app.models.user import User
from app.services.ai_service import ai_service

router = APIRouter()

class GenerateContentRequest(BaseModel):
    transcript: str
    video_title: str
    channel: str = ""
    language: str = "fr"

class TranslateRequest(BaseModel):
    text: str
    target_language: str = "fr"

@router.post("/generate-content")
async def generate_content(
    request: GenerateContentRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate TikTok content using AI"""
    try:
        content = await ai_service.generate_tiktok_content(
            transcript=request.transcript,
            video_title=request.video_title,
            channel=request.channel,
            language=request.language
        )
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-emotions")
async def analyze_emotions(
    request: TranslateRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze emotional content"""
    try:
        result = await ai_service.analyze_emotions(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate")
async def translate(
    request: TranslateRequest,
    current_user: User = Depends(get_current_user)
):
    """Translate content"""
    try:
        translated = await ai_service.translate_content(
            text=request.text,
            target_language=request.target_language
        )
        return {"translated": translated, "language": request.target_language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
