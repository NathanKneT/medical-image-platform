from sqlalchemy import Column, String, Text, Float, Boolean
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AIModel(BaseModel):
    """
    AI Model version registry.
    
    Maintains a registry of AI models with their versions, metadata,
    and performance metrics. Essential for reproducible ML in production.
    """
    
    __tablename__ = 'ai_model'

    # Model identification
    name = Column(
        String(200),
        nullable=False,
        comment="Human-readable model name"
    )
    
    version = Column(
        String(50),
        nullable=False,
        comment="Semantic version (e.g., '1.2.3')"
    )
    
    description = Column(
        Text,
        nullable=True,
        comment="Detailed description of what this model does"
    )
    
    # Model type categorization
    model_type = Column(
        String(50),
        nullable=False,
        comment="Type of model: classification, segmentation, detection, etc."
    )
    
    # Model configuration and metadata
    architecture = Column(
        String(100),
        nullable=True,
        comment="Model architecture (e.g., 'ResNet-50', 'U-Net', 'YOLOv5')"
    )
    
    input_shape = Column(
        String(100),
        nullable=True,
        comment="Expected input dimensions (e.g., '224x224x3')"
    )
    
    # Performance metrics
    accuracy = Column(
        Float,
        nullable=True,
        comment="Model accuracy on validation set"
    )
    
    precision = Column(
        Float,
        nullable=True,
        comment="Model precision on validation set"
    )
    
    recall = Column(
        Float,
        nullable=True,
        comment="Model recall on validation set"
    )
    
    f1_score = Column(
        Float,
        nullable=True,
        comment="F1 score on validation set"
    )
    
    # Confidence threshold for predictions
    confidence_threshold = Column(
        Float,
        default=0.5,
        nullable=False,
        comment="Minimum confidence score for valid predictions"
    )
    
    # Model lifecycle management
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether this model version is currently active"
    )
    
    is_deprecated = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether this model version is deprecated"
    )
    
    # Model file references (in production, these would be paths to model artifacts)
    model_path = Column(
        String(500),
        nullable=True,
        comment="Path to model file (local or cloud storage)"
    )
    
    config_path = Column(
        String(500),
        nullable=True,
        comment="Path to model configuration file"
    )
    
    # Training metadata
    training_dataset = Column(
        String(200),
        nullable=True,
        comment="Name/version of training dataset"
    )
    
    training_date = Column(
        String(20),
        nullable=True,
        comment="Date when model training was completed"
    )
    
    # Relationships
    analysis_results = relationship(
        "AnalysisResult",
        back_populates="ai_model",
        lazy="selectin"
    )
    
    def __repr__(self):
        return f"<AIModel(id={self.id}, name={self.name}, version={self.version})>"
