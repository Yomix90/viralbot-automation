from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from typing import List, Optional, Dict, Any
from datetime import datetime
import yt_dlp
import asyncio
import structlog
import math
import os
import re

from app.core.config import settings

logger = structlog.get_logger()

class YouTubeService:
    def __init__(self):
        if settings.YOUTUBE_API_KEY:
            try:
                self.youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY, static_discovery=False)
            except:
                self.youtube = None
        else:
            self.youtube = None
    
    def _get_mock_videos(self) -> List[Dict]:
        return [
            {
                "id": "dQw4w9WgXcQ",
                "title": "[DEMO] Configurer la clé API YouTube",
                "channel": "ViralBot Admin",
                "description": "Aucune clé API YOUTUBE_API_KEY n'a été détectée dans l'environnement. Ceci est une vidéo de démonstration.",
                "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
                "published_at": "2024-01-01T00:00:00Z",
                "duration_seconds": 120,
                "view_count": 1000000,
                "like_count": 50000,
                "comment_count": 1000,
                "virality_score": 99.9,
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "category_id": "24",
                "tags": ["demo"]
            },
            {
                "id": "jNQXAC9IVRw",
                "title": "[DEMO] Vidéo test numéro 2",
                "channel": "jawed",
                "thumbnail": "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg",
                "published_at": "2005-04-23T20:27:11Z",
                "duration_seconds": 19,
                "view_count": 500000,
                "like_count": 10000,
                "comment_count": 500,
                "virality_score": 85.0,
                "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
                "category_id": "22",
                "tags": ["demo"]
            }
        ]

    async def search_viral_videos(
        self,
        query: str = "",
        category_id: str = "",
        region_code: str = "US",
        max_results: int = 20,
        min_views: int = 100000,
        published_after: Optional[str] = None,
        order: str = "viewCount",
        video_duration: str = "medium"
    ) -> List[Dict[str, Any]]:
        if not self.youtube:
            return self._get_mock_videos()
        try:
            params = {
                "part": "snippet",
                "type": "video",
                "maxResults": min(max_results, 50),
                "order": order,
                "regionCode": region_code,
                "videoDefinition": "high",
                "videoDuration": video_duration,
                "safeSearch": "moderate",
            }
            if query: params["q"] = query
            if category_id: params["videoCategoryId"] = category_id
            if published_after: params["publishedAfter"] = published_after
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.youtube.search().list(**params).execute())
            video_ids = [item["id"]["videoId"] for item in response.get("items", [])]
            if not video_ids: return []
            return await self.get_video_details(video_ids, min_views)
        except HttpError:
            raise
    
    async def get_video_details(self, video_ids: List[str], min_views: int = 0) -> List[Dict]:
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.youtube.videos().list(part="snippet,statistics,contentDetails", id=",".join(video_ids)).execute())
            videos = []
            for item in response.get("items", []):
                stats = item.get("statistics", {})
                snippet = item.get("snippet", {})
                content = item.get("contentDetails", {})
                view_count = int(stats.get("viewCount", 0))
                if view_count < min_views: continue
                duration_seconds = self._parse_duration(content.get("duration", "PT0S"))
                published_at = snippet.get("publishedAt", "")
                virality_score = self._calculate_virality(view_count, int(stats.get("likeCount", 0)), int(stats.get("commentCount", 0)), duration_seconds, published_at)
                videos.append({
                    "id": item["id"],
                    "title": snippet.get("title"),
                    "channel": snippet.get("channelTitle"),
                    "description": snippet.get("description", "")[:500],
                    "thumbnail": snippet.get("thumbnails", {}).get("maxres", {}).get("url") or snippet.get("thumbnails", {}).get("high", {}).get("url"),
                    "published_at": published_at,
                    "duration_seconds": duration_seconds,
                    "view_count": view_count,
                    "like_count": int(stats.get("likeCount", 0)),
                    "comment_count": int(stats.get("commentCount", 0)),
                    "virality_score": round(virality_score, 2),
                    "url": f"https://www.youtube.com/watch?v={item['id']}",
                    "category_id": snippet.get("categoryId"),
                    "tags": snippet.get("tags", []),
                })
            videos.sort(key=lambda x: x["virality_score"], reverse=True)
            return videos
        except HttpError:
            raise
    
    async def get_trending_videos(self, region_code: str = "US", category_id: str = "") -> List[Dict]:
        if not self.youtube: 
            return self._get_mock_videos()
        try:
            params = {"part": "snippet,statistics,contentDetails", "chart": "mostPopular", "regionCode": region_code, "maxResults": 50}
            if category_id: params["videoCategoryId"] = category_id
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.youtube.videos().list(**params).execute())
            videos = []
            for item in response.get("items", []):
                stats = item.get("statistics", {})
                snippet = item.get("snippet", {})
                content = item.get("contentDetails", {})
                view_count = int(stats.get("viewCount", 0))
                duration_seconds = self._parse_duration(content.get("duration", "PT0S"))
                published_at = snippet.get("publishedAt", "")
                virality_score = self._calculate_virality(view_count, int(stats.get("likeCount", 0)), int(stats.get("commentCount", 0)), duration_seconds, published_at)
                videos.append({
                    "id": item["id"],
                    "title": snippet.get("title"),
                    "channel": snippet.get("channelTitle"),
                    "thumbnail": snippet.get("thumbnails", {}).get("maxres", {}).get("url") or snippet.get("thumbnails", {}).get("high", {}).get("url"),
                    "published_at": published_at,
                    "duration_seconds": duration_seconds,
                    "view_count": view_count,
                    "like_count": int(stats.get("likeCount", 0)),
                    "comment_count": int(stats.get("commentCount", 0)),
                    "virality_score": round(virality_score, 2),
                    "url": f"https://www.youtube.com/watch?v={item['id']}",
                })
            videos.sort(key=lambda x: x["virality_score"], reverse=True)
            return videos
        except HttpError:
            raise
    
    async def download_video(self, youtube_id: str, output_path: str) -> str:
        url = f"https://www.youtube.com/watch?v={youtube_id}"
        output_file = os.path.join(output_path, f"{youtube_id}.%(ext)s")
        ydl_opts = {"format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", "outtmpl": output_file, "noplaylist": True, "quiet": True, "no_warnings": True}
        loop = asyncio.get_event_loop()
        def _download():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                return ydl.prepare_filename(info)
        return await loop.run_in_executor(None, _download)
    
    def _parse_duration(self, duration_str: str) -> int:
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, duration_str)
        if not match: return 0
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        return hours * 3600 + minutes * 60 + seconds
    
    def _calculate_virality(self, views: int, likes: int, comments: int, duration: int, published_at: str) -> float:
        if views == 0: return 0.0
        engagement_rate = (likes + comments) / views if views > 0 else 0
        try:
            pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            hours_since = max(1, (datetime.now(pub_date.tzinfo) - pub_date).total_seconds() / 3600)
            views_per_hour = views / hours_since
        except:
            views_per_hour = views / 24
        view_score = min(40, math.log10(max(1, views)) * 5)
        engagement_score = min(30, engagement_rate * 1000)
        velocity_score = min(30, math.log10(max(1, views_per_hour)) * 5)
        return view_score + engagement_score + velocity_score

youtube_service = YouTubeService()
