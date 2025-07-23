import os
from typing import List
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    
    Pydantic automatically loads values from environment variables
    that match the field names (case-insensitive).
    """
    
    # Database configuration
    DATABASE_URL: str = "sqlite+aiosqlite:///./medical_platform.db"

    REDIS_URL: str = "redis://redis:6379/0"
    
    # CORS origins for frontend communication
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Local development
        "http://localhost:3001",  # Alternative local port
        "https://*.netlify.app",  # Netlify preview deployments
        "https://your-app.netlify.app"  # Production frontend
    ]
    
    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB max file size
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".dcm", ".nii"]
    UPLOAD_DIR: str = "uploads"
    
    # WebSocket settings
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    
    # Security settings
    SECRET_KEY: str = "development-secret-key-change-in-production"
    
    # Mock AI processing settings (for demo)
    MIN_PROCESSING_TIME: int = 10  # seconds
    MAX_PROCESSING_TIME: int = 45  # seconds
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
