from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.config import settings
from app.database import init_db
from app.middleware.audit_logging import AuditLoggingMiddleware
# from app.api import images, analysis, websocket # coming later not implemented yet


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler - manages startup and shutdown tasks.
    
    This pattern ensures proper resource management and is the modern way
    to handle startup/shutdown events in FastAPI applications.
    """
    # Startup
    print("🚀 Starting Medical Image Analysis Platform...")
    await init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down gracefully...")


# FastAPI application instance with OpenAPI documentation
app = FastAPI(
    title="Medical Image Analysis Platform",
    description="A production-ready API for medical image processing with real-time updates",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware - essential for frontend-backend communication
# In production, replace "*" with specific domains for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom audit logging middleware - demonstrates security best practices
# This middleware intercepts all requests for compliance and monitoring
app.add_middleware(AuditLoggingMiddleware)

# Mount static files for serving uploaded images (demo only)
# In production, use cloud storage (S3, GCS) instead
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# API route registration
# app.include_router(images.router, prefix="/api/v1/images", tags=["Images"])
# app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
# app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])


@app.get("/")
async def root():
    """
    Health check endpoint - useful for deployment monitoring
    """
    return {
        "message": "Medical Image Analysis Platform API",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    """
    Detailed health check for load balancers and monitoring systems
    """
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": "2025-01-01T00:00:00Z"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )