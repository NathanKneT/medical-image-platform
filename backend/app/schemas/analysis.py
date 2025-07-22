from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator

from app.models.analysis import AnalysisStatus


class AnalysisRequest(BaseModel):
    """Request schema for starting AI analysis."""
    
    image_id: str = Field(..., description="ID of image to analyze")
    model_id: str = Field(..., description="ID of AI model to use")
    user_id: Optional[str] = Field(None, description="User requesting the analysis")
    priority: Optional[str] = Field("normal", description="Analysis priority: low, normal, high")
    
    @validator("priority")
    def validate_priority(cls, v):
        """Validate priority field values."""
        if v not in ["low", "normal", "high"]:
            raise ValueError("Priority must be low, normal, or high")
        return v


class AnalysisStartResponse(BaseModel):
    """Response schema for analysis start request."""
    
    analysis_id: str = Field(..., description="Unique analysis identifier for tracking")
    status: AnalysisStatus = Field(..., description="Initial analysis status")
    message: str = Field(..., description="Success message")
    estimated_completion_time: int = Field(..., description="Estimated completion time in seconds")
    websocket_url: Optional[str] = Field(
        None, 
        description="WebSocket URL for real-time updates"
    )


class AnalysisResponse(BaseModel):
    """Complete analysis result response schema."""
    
    id: str
    image_id: str
    ai_model_id: str
    status: AnalysisStatus
    progress_percentage: float = Field(..., ge=0, le=100)
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    image_filename: Optional[str] = Field(None, validation_alias="image.filename")
    model_name: Optional[str] = Field(None, validation_alias="ai_model.name")
    model_version: Optional[str] = Field(None, validation_alias="ai_model.version")

    class Config:
        from_attributes = True

    @validator("confidence_score")
    def validate_confidence_score(cls, v):
        """Ensure confidence score is within valid range."""
        if v is not None and not (0 <= v <= 1):
            raise ValueError("Confidence score must be between 0 and 1")
        return v