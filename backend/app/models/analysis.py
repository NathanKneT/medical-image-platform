from enum import Enum
from typing import Dict, Any, Optional
from sqlalchemy import String, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column 

from app.models.base import BaseModel

class AnalysisStatus(str, Enum):
    """Analysis status enumeration."""
    PENDING = "PENDING"
    ANALYZING = "ANALYZING" 
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class AnalysisResult(BaseModel):
    """
    AI Analysis result model.
    
    Links images to AI models and stores analysis results with full
    audit trail. The JSON field allows flexible storage of different
    model outputs while maintaining relational integrity.
    """
    
    # Foreign key relationships
    image_id: Mapped[str] = mapped_column(ForeignKey("image.id"), comment="Reference to the analyzed image")
    ai_model_id: Mapped[str] = mapped_column(ForeignKey("aimodel.id"), comment="Reference to the AI model used for analysis")
    
    # Analysis status and progress
    status: Mapped[AnalysisStatus] = mapped_column(String(20), default=AnalysisStatus.PENDING, comment="Current status of the analysis")
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0, comment="Progress percentage (0.0 to 100.0)")
    
    # Results and confidence
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Overall confidence score from the AI model (0.0 to 1.0)")
    
    # Flexible JSON storage for model outputs
    results_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True, comment="Structured results from AI analysis (format varies by model type)")
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Error message if analysis failed")
    error_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="Structured error code for programmatic handling")
    
    # Processing metadata
    processing_time_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Total time taken for analysis in seconds")
    
    # User context
    requested_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="User ID who requested this analysis")
    
    # Relationships - Use string references to avoid circular imports
    image = relationship("Image", back_populates="analysis_results")
    ai_model = relationship("AIModel", back_populates="analysis_results")
    
    def set_results(self, results_dict: dict):
        """Helper method to set results with proper JSON serialization."""
        self.results_payload = results_dict
    
    def get_results(self) -> dict:
        """Helper method to get results as a Python dictionary."""
        return self.results_payload or {}
    
    def is_completed(self) -> bool:
        """Check if analysis is completed (success or failure)."""
        return self.status in [AnalysisStatus.COMPLETE, AnalysisStatus.FAILED, AnalysisStatus.CANCELLED]
    
    def __repr__(self):
        return f"<AnalysisResult(id={self.id}, status={self.status}, confidence={self.confidence_score})>"
