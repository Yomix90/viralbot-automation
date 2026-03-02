from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class VideoStatus(str, enum.Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    PROCESSING = "processing"
    AI_ANALYSIS = "ai_analysis"
    READY = "ready"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    youtube_id = Column(String(50), unique=True, index=True)
    youtube_title = Column(String(500))
    youtube_channel = Column(String(255))
    youtube_url = Column(String(500))
    youtube_thumbnail = Column(String(500))
    youtube_views = Column(Integer, default=0)
    youtube_likes = Column(Integer, default=0)
    youtube_duration = Column(Integer)
    youtube_published_at = Column(DateTime(timezone=True))
    virality_score = Column(Float, default=0.0)
    status = Column(SQLEnum(VideoStatus), default=VideoStatus.PENDING, index=True)
    download_url = Column(String(1000))
    processed_url = Column(String(1000))
    thumbnail_url = Column(String(1000))
    duration_seconds = Column(Float)
    file_size_bytes = Column(Integer)
    transcript = Column(Text)
    summary = Column(Text)
    tiktok_title = Column(String(200))
    tiktok_description = Column(Text)
    tiktok_hashtags = Column(JSON)
    hook = Column(String(300))
    emotional_score = Column(JSON)
    tiktok_post_id = Column(String(100))
    published_at = Column(DateTime(timezone=True))
    scheduled_at = Column(DateTime(timezone=True))
    tiktok_account_id = Column(Integer, ForeignKey("tiktok_accounts.id"))
    tiktok_views = Column(Integer, default=0)
    tiktok_likes = Column(Integer, default=0)
    tiktok_shares = Column(Integer, default=0)
    error_message = Column(Text)
    processing_metadata = Column(JSON)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_user = relationship("User", back_populates="videos")
    tiktok_account = relationship("TikTokAccount", back_populates="videos")
    clips = relationship("VideoClip", back_populates="video")
