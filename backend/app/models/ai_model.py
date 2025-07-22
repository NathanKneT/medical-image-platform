from typing import Optional
from sqlalchemy import String, Text, Float, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.models.base import BaseModel

class AIModel(BaseModel):
    # Model identification
    name: Mapped[str] = mapped_column(String(200), nullable=False, comment="Human-readable model name")
    version: Mapped[str] = mapped_column(String(50), nullable=False, comment="Semantic version (e.g., '1.2.3')")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Detailed description of what this model does")

    # Model type categorization
    model_type: Mapped[str] = mapped_column(String(50), nullable=False, comment="Type of model: classification, segmentation, detection, etc.")

    # Model configuration and metadata
    architecture: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="Model architecture (e.g., 'ResNet-50', 'U-Net', 'YOLOv5')")
    input_shape: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="Expected input dimensions (e.g., '224x224x3')")

    # Performance metrics
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Model accuracy on validation set")
    precision: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Model precision on validation set")
    recall: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Model recall on validation set")
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="F1 score on validation set")

    # Confidence threshold for predictions
    confidence_threshold: Mapped[float] = mapped_column(Float, default=0.5, nullable=False, comment="Minimum confidence score for valid predictions")

    # Model lifecycle management
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, comment="Whether this model version is currently active")
    is_deprecated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="Whether this model version is deprecated")

    # Model file references
    model_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="Path to model file (local or cloud storage)")
    config_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="Path to model configuration file")
    
    # Training metadata
    training_dataset: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, comment="Name/version of training dataset")
    training_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, comment="Date when model training was completed")

    # Relationships - Use string reference to avoid circular imports
    analysis_results = relationship("AnalysisResult", back_populates="ai_model", lazy="selectin")
    
    def __repr__(self):
        return f"<AIModel(id={self.id}, name={self.name}, version={self.version})>"