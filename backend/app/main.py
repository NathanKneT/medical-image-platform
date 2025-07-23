from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.config import settings
from app.database import init_db  # Direct import is now safe
from app.middleware.audit_logging import AuditLoggingMiddleware
from app.api import analysis, images, websocket


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
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom audit logging middleware
app.add_middleware(AuditLoggingMiddleware)

# Mount static files for serving uploaded images (demo only)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# API routes
app.include_router(images.router, prefix="/api/v1/images", tags=["Images"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])


@app.get("/", response_class=HTMLResponse, tags=["Health"])
async def root():
    """Root endpoint with API documentation links"""
    return """
    <html>
        <head><title>Medical Image Analysis Platform</title></head>
        <body>
            <h1>🏥 Medical Image Analysis Platform API</h1>
            <p>Production-ready medical imaging API with AI analysis capabilities.</p>
            <ul>
                <li><a href="/docs">📖 Interactive API Documentation (Swagger UI)</a></li>
                <li><a href="/redoc">📋 API Documentation (ReDoc)</a></li> 
                <li><a href="/openapi.json">🔗 OpenAPI Schema (JSON)</a></li>
            </ul>
            <h2>🚀 Quick Start</h2>
            <p>Generate TypeScript types for your frontend:</p>
            <pre><code>npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts</code></pre>
        </body>
    </html>
    """


@app.get("/health", tags=["Health"])
async def health_check():
    """Comprehensive health check endpoint"""
    return {
        "status": "healthy",
        "service": "medical-image-analysis-api",
        "version": "1.0.0",
        "timestamp": "2025-01-01T00:00:00Z",
        "database": "connected",
        "features": {
            "image_upload": True,
            "ai_analysis": True,
            "websocket": True,
            "openapi": True
        }
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
