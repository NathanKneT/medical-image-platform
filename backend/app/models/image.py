from typing import Optional
from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.models.base import BaseModel

class Image(BaseModel):
    # File information
    filename: Mapped[str] = mapped_column(String(255), nullable=False, comment="Original filename as uploaded by user")
    filepath: Mapped[str] = mapped_column(String(500), nullable=False, unique=True, comment="Path to stored file (local path or cloud storage URL)")
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, comment="File size in bytes")
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False, comment="MIME type of the uploaded file")

    # Image metadata
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="Image width in pixels")
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="Image height in pixels")

    # Medical imaging specific metadata
    modality: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="Medical imaging modality (CT, MRI, X-Ray, etc.)")
    patient_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="Anonymized patient identifier")
    study_date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, comment="Date when the study was performed (YYYY-MM-DD format)")

    # Processing status
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="Whether this image has been processed by AI analysis")

    # User information
    uploaded_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="User ID who uploaded this image")
    
    # Optional description
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Optional description or notes about this image")
    
    # Relationships - Use string reference to avoid circular imports
    analysis_results = relationship("AnalysisResult", back_populates="image", cascade="all, delete-orphan", lazy="selectin")
    
    def __repr__(self):
        return f"<Image(id={self.id}, filename={self.filename}, modality={self.modality})>"