from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ImageUploadResponse(BaseModel):
    """Response schema for successful image upload."""
    
    id: str = Field(..., description="Unique image identifier")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type of the file")
    width: Optional[int] = Field(None, description="Image width in pixels")
    height: Optional[int] = Field(None, description="Image height in pixels")
    modality: Optional[str] = Field(None, description="Medical imaging modality")
    upload_url: str = Field(..., description="URL to download the uploaded image")
    created_at: datetime = Field(..., description="Upload timestamp")
    message: str = Field(..., description="Success message")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z"
        }


class ImageResponse(BaseModel):
    """Complete image metadata response schema."""
    
    id: str
    filename: str
    file_size: int
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    modality: Optional[str] = None
    patient_id: Optional[str] = None
    description: Optional[str] = None
    is_processed: bool = False
    uploaded_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z"
        }