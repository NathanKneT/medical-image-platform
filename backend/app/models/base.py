import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, text
from sqlalchemy.orm import declared_attr
from sqlalchemy.ext.declarative import declarative_base

# Base class for all SQLAlchemy models
Base = declarative_base()

class BaseModel(Base):
    """
    Abstract base model with common fields.
    
    All models inherit from this to get consistent ID generation,
    timestamps, and other common functionality.
    """
    __abstract__ = True
    
    @declared_attr
    def __tablename__(cls):
        """
        Automatically generate table names from class names.
        Example: AIModel -> aimodel, AnalysisResult -> analysisresult
        """
        return cls.__name__.lower()
    
    # UUID primary key for better distribution and security
    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique identifier for this record"
    )
    
    # Automatic timestamp management
    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
        comment="Timestamp when this record was created"
    )
    
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
        comment="Timestamp when this record was last updated"
    )
    
    def __repr__(self):
        """String representation for debugging"""
        return f"<{self.__class__.__name__}(id={self.id})>"
