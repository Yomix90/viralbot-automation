from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, youtube, videos, tiktok, ai, dashboard, debug, settings as settings_router

logger = structlog.get_logger()
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    for path in [settings.STORAGE_PATH, settings.DOWNLOADS_PATH, settings.PROCESSED_PATH, settings.TEMP_PATH]:
        os.makedirs(path, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="ViralBot API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(youtube.router, prefix="/api/v1/youtube")
app.include_router(videos.router, prefix="/api/v1/videos")
app.include_router(tiktok.router, prefix="/api/v1/tiktok")
app.include_router(ai.router, prefix="/api/v1/ai")
app.include_router(dashboard.router, prefix="/api/v1/dashboard")
app.include_router(debug.router, prefix="/api/v1/debug")
app.include_router(settings_router.router, prefix="/api/v1/settings")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
