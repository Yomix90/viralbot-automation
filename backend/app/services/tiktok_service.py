import httpx
import structlog
from typing import Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.tiktok import TikTokAccount

logger = structlog.get_logger()

TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
TIKTOK_VIDEO_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"

class TikTokService:
    def get_auth_url(self, state: str = "random_state") -> str:
        params = {
            "client_key": settings.TIKTOK_CLIENT_KEY,
            "response_type": "code",
            "scope": "user.info.basic,video.publish,video.upload",
            "redirect_uri": settings.TIKTOK_REDIRECT_URI,
            "state": state,
        }
        return f"{TIKTOK_AUTH_URL}?" + "&".join(f"{k}={v}" for k, v in params.items())
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(TIKTOK_TOKEN_URL, data={"client_key": settings.TIKTOK_CLIENT_KEY, "client_secret": settings.TIKTOK_CLIENT_SECRET, "code": code, "grant_type": "authorization_code", "redirect_uri": settings.TIKTOK_REDIRECT_URI}, headers={"Content-Type": "application/x-www-form-urlencoded"})
            resp.raise_for_status()
            return resp.json()
    
    async def refresh_token(self, refresh_token: str) -> Dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(TIKTOK_TOKEN_URL, data={"client_key": settings.TIKTOK_CLIENT_KEY, "client_secret": settings.TIKTOK_CLIENT_SECRET, "grant_type": "refresh_token", "refresh_token": refresh_token}, headers={"Content-Type": "application/x-www-form-urlencoded"})
            resp.raise_for_status()
            return resp.json()
    
    async def get_user_info(self, access_token: str) -> Dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://open.tiktokapis.com/v2/user/info/", headers={"Authorization": f"Bearer {access_token}"}, params={"fields": "open_id,union_id,avatar_url,display_name,username,follower_count,video_count"})
            resp.raise_for_status()
            return resp.json().get("data", {}).get("user", {})
    
    async def publish_video(self, access_token: str, video_path: str, title: str, description: str, hashtags: list, privacy_level: str = "SELF_ONLY") -> Dict:
        import os
        file_size = os.path.getsize(video_path)
        caption = f"{title}\n\n{description}\n\n{' '.join('#' + h for h in hashtags[:20])}"
        init_body = {"post_info": {"title": caption[:2200], "privacy_level": privacy_level, "disable_duet": False, "disable_comment": False, "disable_stitch": False}, "source_info": {"source": "FILE_UPLOAD", "video_size": file_size, "chunk_size": file_size, "total_chunk_count": 1}}
        async with httpx.AsyncClient(timeout=60) as client:
            init_resp = await client.post(TIKTOK_VIDEO_INIT_URL, json=init_body, headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json; charset=UTF-8"})
            init_resp.raise_for_status()
            init_data = init_resp.json()
        upload_url = init_data.get("data", {}).get("upload_url")
        if not upload_url: raise ValueError(f"No upload URL: {init_data}")
        with open(video_path, "rb") as f: data = f.read()
        async with httpx.AsyncClient(timeout=300) as client:
            up_resp = await client.put(upload_url, content=data, headers={"Content-Range": f"bytes 0-{file_size-1}/{file_size}", "Content-Length": str(file_size), "Content-Type": "video/mp4"})
            up_resp.raise_for_status()
        return {"publish_id": init_data.get("data", {}).get("publish_id"), "status": "success"}
    
    async def ensure_valid_token(self, account: TikTokAccount, db: AsyncSession) -> str:
        now = datetime.utcnow()
        if account.token_expires_at and account.token_expires_at > now + timedelta(minutes=5): return account.access_token
        try:
            data = await self.refresh_token(account.refresh_token)
            account.access_token = data["access_token"]
            account.refresh_token = data.get("refresh_token", account.refresh_token)
            account.token_expires_at = now + timedelta(seconds=data.get("expires_in", 86400))
            await db.commit()
            return account.access_token
        except: raise

tiktok_service = TikTokService()
