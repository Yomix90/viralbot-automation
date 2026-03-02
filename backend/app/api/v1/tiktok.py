from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import structlog

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.tiktok import TikTokAccount
from app.models.video import Video, VideoStatus
from app.services.tiktok_service import tiktok_service

router = APIRouter()
logger = structlog.get_logger()

class PublishRequest(BaseModel):
    video_id: int
    account_id: int
    privacy_level: str = "PUBLIC_TO_EVERYONE"

@router.get("/auth-url")
async def get_auth_url(current_user: User = Depends(get_current_user)):
    """Get TikTok OAuth URL"""
    auth_url = tiktok_service.get_auth_url(state=f"user_{current_user.id}")
    return {"auth_url": auth_url}

@router.get("/callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(""),
    db: AsyncSession = Depends(get_db)
):
    """Handle TikTok OAuth callback"""
    try:
        # Extract user ID from state
        user_id = int(state.replace("user_", "")) if state.startswith("user_") else None
        
        token_data = await tiktok_service.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        
        user_info = await tiktok_service.get_user_info(access_token)
        
        # Save or update account
        result = await db.execute(
            select(TikTokAccount).where(TikTokAccount.tiktok_user_id == user_info.get("open_id"))
        )
        account = result.scalar_one_or_none()
        
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 86400))
        
        if account:
            account.access_token = access_token
            account.refresh_token = token_data.get("refresh_token")
            account.token_expires_at = expires_at
            account.username = user_info.get("username")
            account.display_name = user_info.get("display_name")
            account.avatar_url = user_info.get("avatar_url")
        else:
            account = TikTokAccount(
                user_id=user_id,
                tiktok_user_id=user_info.get("open_id"),
                username=user_info.get("username"),
                display_name=user_info.get("display_name"),
                avatar_url=user_info.get("avatar_url"),
                access_token=access_token,
                refresh_token=token_data.get("refresh_token"),
                token_expires_at=expires_at,
                follower_count=user_info.get("follower_count", 0),
            )
            db.add(account)
        
        await db.commit()
        
        # Redirect to frontend
        return {"status": "connected", "username": account.username}
        
    except Exception as e:
        logger.error("TikTok OAuth failed", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/accounts")
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List connected TikTok accounts"""
    result = await db.execute(
        select(TikTokAccount).where(TikTokAccount.user_id == current_user.id, TikTokAccount.is_active == True)
    )
    accounts = result.scalars().all()
    return {
        "accounts": [
            {
                "id": acc.id,
                "username": acc.username,
                "display_name": acc.display_name,
                "avatar_url": acc.avatar_url,
                "follower_count": acc.follower_count,
                "video_count": acc.video_count,
            }
            for acc in accounts
        ]
    }

@router.post("/publish")
async def publish_video(
    request: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Immediately publish a video to TikTok"""
    # Get video
    result = await db.execute(select(Video).where(Video.id == request.video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.status != VideoStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Video must be approved before publishing")
    
    # Get account
    result = await db.execute(select(TikTokAccount).where(TikTokAccount.id == request.account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="TikTok account not found")
    
    try:
        video.status = VideoStatus.PUBLISHING
        await db.commit()
        
        token = await tiktok_service.ensure_valid_token(account, db)
        result = await tiktok_service.publish_video(
            access_token=token,
            video_path=video.processed_url,
            title=video.tiktok_title or video.youtube_title,
            description=video.tiktok_description or "",
            hashtags=video.tiktok_hashtags or [],
            privacy_level=request.privacy_level
        )
        
        from datetime import datetime, timezone
        video.status = VideoStatus.PUBLISHED
        video.tiktok_post_id = result.get("publish_id")
        video.published_at = datetime.now(timezone.utc)
        video.tiktok_account_id = account.id
        await db.commit()
        
        return {"status": "published", "publish_id": result.get("publish_id")}
        
    except Exception as e:
        video.status = VideoStatus.FAILED
        video.error_message = str(e)
        await db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/accounts/{account_id}")
async def disconnect_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(TikTokAccount).where(TikTokAccount.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account.is_active = False
    await db.commit()
    return {"status": "disconnected"}
