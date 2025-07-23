from datetime import datetime, timezone
import os
import uuid
import aiofiles
import aiofiles.os 
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.image import Image
from app.schemas.image import ImageResponse, ImageUploadResponse
from app.services.image_service import ImageService
from app.config import settings

router = APIRouter()


@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    patient_id: Optional[str] = None,
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Upload medical image for analysis.
    
    This endpoint demonstrates several production patterns:
    1. File validation and security checks
    2. Async file I/O with aiofiles
    3. Metadata extraction from medical images
    4. Background task triggering
    5. Proper error handling and rollback
    
    Args:
        background_tasks: FastAPI background tasks for async processing
        file: Uploaded file from multipart form
        description: Optional description
        patient_id: Anonymized patient identifier
        user_id: User uploading the file
        db: Database session
        
    Returns:
        ImageUploadResponse with image metadata and upload status
    """
    
    # Validate file type and size
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not allowed. Supported types: {settings.ALLOWED_EXTENSIONS}"
        )
    
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE} bytes"
        )
    
    file_path = None  # Define file_path here to ensure it's in scope for the except block
    try:
        # Generate unique filename to prevent conflicts
        unique_filename = f"{uuid.uuid4()}{os.path.splitext(file.filename)[1].lower()}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Save file asynchronously
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Extract metadata from the file
        metadata = await ImageService.extract_metadata(file_path, content)
        
        # Create database record
        image = Image(
            filename=file.filename,
            filepath=file_path,
            file_size=len(content),
            mime_type=file.content_type or "application/octet-stream",
            width=metadata.get("width"),
            height=metadata.get("height"),
            modality=metadata.get("modality"),
            patient_id=patient_id,
            description=description,
            uploaded_by=user_id
        )
        
        db.add(image)
        await db.commit()
        await db.refresh(image)
        
        # Schedule background metadata processing if needed
        background_tasks.add_task(
            ImageService.process_advanced_metadata,
            str(image.id),
            file_path
        )
        
        return ImageUploadResponse(
            id=str(image.id),
            filename=image.filename,
            file_size=image.file_size,
            mime_type=image.mime_type,
            width=image.width,
            height=image.height,
            modality=image.modality,
            upload_url=f"/api/v1/images/{str(image.id)}/download",
            created_at=getattr(image, 'created_at', datetime.now(timezone.utc)),
            message="Image uploaded successfully."
        )
        
    except Exception as e:
        # Clean up file if database operation fails
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get image metadata by ID.
    
    Args:
        image_id: Unique image identifier
        db: Database session
        
    Returns:
        ImageResponse with complete image metadata
    """
    image = await db.get(Image, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return ImageResponse.model_validate(image)


@router.get("/{image_id}/download")
async def download_image(
    image_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Download image file.
    
    In production, this would typically redirect to a signed URL
    from cloud storage (S3, GCS) rather than serving files directly.
    
    Args:
        image_id: Unique image identifier
        db: Database session
        
    Returns:
        FileResponse with image content
    """
    image = await db.get(Image, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if not os.path.exists(image.filepath):
        raise HTTPException(status_code=404, detail="Image file not found on disk")
    
    return FileResponse(
        path=image.filepath,
        filename=image.filename,
        media_type=image.mime_type
    )


@router.get("/", response_model=List[ImageResponse])
async def list_images(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[str] = None,
    modality: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List images with optional filtering.
    
    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        user_id: Filter by user who uploaded
        modality: Filter by imaging modality
        db: Database session
        
    Returns:
        List of ImageResponse objects
    """
    query = select(Image).offset(skip).limit(limit).order_by(Image.created_at.desc())
    
    if user_id:
        query = query.where(Image.uploaded_by == user_id)
    
    if modality:
        query = query.where(Image.modality == modality)
    
    result = await db.execute(query)
    images = result.scalars().all()
    
    return [ImageResponse.model_validate(image) for image in images]


@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete image and associated file.
    
    This endpoint demonstrates proper cleanup of both database
    records and file system resources.
    
    Args:
        image_id: Unique image identifier
        db: Database session
        
    Returns:
        Success message
    """
    image = await db.get(Image, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if image.analysis_results:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete image with existing analysis results"
        )
    
    # Remove file from disk asynchronously
    try:
        if os.path.exists(image.filepath):
            await aiofiles.os.remove(image.filepath) 
    except OSError as e:
        print(f"Error removing file {image.filepath}: {e}")
    
    # Remove database record
    await db.delete(image)
    await db.commit()
    
    return {"message": "Image deleted successfully"}