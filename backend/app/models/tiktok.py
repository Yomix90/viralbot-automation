from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class TikTokAccount(Base):
    __tablename__ = "tiktok_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tiktok_user_id = Column(String(100), unique=True)
    username = Column(String(100))
    display_name = Column(String(255))
    avatar_url = Column(String(500))
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    follower_count = Column(Integer, default=0)
    video_count = Column(Integer, default=0)
    account_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="tiktok_accounts")
    videos = relationship("Video", back_populates="tiktok_account")

class VideoClip(Base):
    __tablename__ = "video_clips"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    clip_index = Column(Integer)
    start_time = Column(Integer)  # seconds
    end_time = Column(Integer)    # seconds
    duration = Column(Integer)    # seconds
    file_url = Column(String(1000))
    tiktok_post_id = Column(String(100))
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    video = relationship("Video", back_populates="clips")
