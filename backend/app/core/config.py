from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "ViralBot"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    DATABASE_URL: str = "postgresql+asyncpg://viralbot:viralbot_secret@localhost:5432/viralbot"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    YOUTUBE_API_KEY: str = ""
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"
    
    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    TIKTOK_REDIRECT_URI: str = "http://localhost:8000/api/v1/tiktok/callback"
    
    STORAGE_PATH: str = "storage"
    DOWNLOADS_PATH: str = "storage/downloads"
    PROCESSED_PATH: str = "storage/processed"
    TEMP_PATH: str = "storage/temp"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
