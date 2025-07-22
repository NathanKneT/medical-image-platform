from sqlalchemy import Column, String, Integer, Boolean, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Image(BaseModel):
    """
    Medical image metadata model.
    
    Stores information about uploaded images without storing the actual
    file content in the database (which would be inefficient).
    In production, files would be stored in cloud storage (S3, GCS).
    """
    
    # File information
    filename = Column(
        String(255),
        nullable=False,
        comment="Original filename as uploaded by user"
    )
    
    filepath = Column(
        String(500),
        nullable=False,
        unique=True,
        comment="Path to stored file (local path or cloud storage URL)"
    )
    
    file_size = Column(
        Integer,
        nullable=False,
        comment="File size in bytes"
    )
    
    mime_type = Column(
        String(100),
        nullable=False,
        comment="MIME type of the uploaded file"
    )
    
    # Image metadata (extracted from file headers when possible)
    width = Column(
        Integer,
        nullable=True,
        comment="Image width in pixels"
    )
    
    height = Column(
        Integer,
        nullable=True,
        comment="Image height in pixels"
    )
    
    # Medical imaging specific metadata
    modality = Column(
        String(50),
        nullable=True,
        comment="Medical imaging modality (CT, MRI, X-Ray, etc.)"
    )
    
    patient_id = Column(
        String(100),
        nullable=True,
        comment="Anonymized patient identifier"
    )
    
    study_date = Column(
        String(20),
        nullable=True,
        comment="Date when the study was performed (YYYY-MM-DD format)"
    )
    
    # Processing status
    is_processed = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether this image has been processed by AI analysis"
    )
    
    # User information (simplified for demo)
    uploaded_by = Column(
        String(100),
        nullable=True,
        comment="User ID who uploaded this image"
    )
    
    # Optional description/notes
    description = Column(
        Text,
        nullable=True,
        comment="Optional description or notes about this image"
    )
    
    # Relationship to analysis results
    analysis_results = relationship(
        "AnalysisResult",
        back_populates="image",
        cascade="all, delete-orphan",
        lazy="selectin"  # Efficient loading for related data
    )
    
    def __repr__(self):
        return f"<Image(id={self.id}, filename={self.filename}, modality={self.modality})>"