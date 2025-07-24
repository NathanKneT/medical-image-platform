from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.analysis import AnalysisResult, AnalysisStatus
from app.models.ai_model import AIModel
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisStartResponse
)
from app.services.analysis_service import AnalysisService
from app.services.websocket_manager import manager

router = APIRouter()


@router.post("/start", response_model=AnalysisStartResponse)
async def start_analysis(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Start AI analysis for an uploaded image.
    ...
    """
    try:
        # Pass the websocket manager to the service
        analysis = await AnalysisService.start_analysis(
            db=db,
            image_id=request.image_id,
            model_id=request.model_id,
            user_id=request.user_id,
            websocket_manager=manager  # Add this parameter
        )
        
        background_tasks.add_task(
            AnalysisService.mock_ai_analysis,
            analysis_id=str(analysis.id),
            websocket_manager=manager
        )
        
        return AnalysisStartResponse(
            analysis_id=str(analysis.id),
            status=analysis.status,
            message="Analysis started successfully",
            estimated_completion_time=60,
            websocket_url=f"/ws/analysis/{request.user_id or 'guest'}"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # This will now catch other potential errors more cleanly
        raise HTTPException(status_code=500, detail=f"Failed to start analysis: {str(e)}")


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis_result(
    analysis_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get analysis result by ID.
    
    This endpoint provides the current status and results of an analysis.
    Clients can poll this endpoint or use WebSocket for real-time updates.
    
    Args:
        analysis_id: Unique analysis identifier
        db: Database session
        
    Returns:
        AnalysisResponse with current status and results
    """
    query = (
        select(AnalysisResult)
        .where(AnalysisResult.id == analysis_id)
        .options(
            selectinload(AnalysisResult.image), 
            selectinload(AnalysisResult.ai_model)
        )
    )
    result = await db.execute(query)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return AnalysisResponse.model_validate(analysis)


@router.get("/", response_model=List[AnalysisResponse])
async def list_analyses(
    skip: int = 0,
    limit: int = 50,
    status: Optional[AnalysisStatus] = None,
    user_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List analysis results with optional filtering.
    
    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        status: Filter by analysis status
        user_id: Filter by user who requested analysis
        db: Database session
        
    Returns:
        List of AnalysisResponse objects
    """
    query = (
        select(AnalysisResult)
        .offset(skip)
        .limit(limit)
        .order_by(AnalysisResult.created_at.desc())
        .options(
            selectinload(AnalysisResult.image), 
            selectinload(AnalysisResult.ai_model)
        )
    )

    if status:
        query = query.where(AnalysisResult.status == status)
    if user_id:
        query = query.where(AnalysisResult.requested_by == user_id)
    
    result = await db.execute(query)
    analyses = result.scalars().all()
    
    return [AnalysisResponse.model_validate(analysis) for analysis in analyses]


@router.get("/models/", response_model=List[dict])
async def list_ai_models(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    List available AI models.
    
    Args:
        active_only: Whether to return only active models
        db: Database session
        
    Returns:
        List of AI model information
    """
    query = select(AIModel).order_by(AIModel.name, AIModel.version.desc())
    
    if active_only:
        query = query.where(AIModel.is_active == True)  # noqa: E712
    
    result = await db.execute(query)
    models = result.scalars().all()
    
    return [
        {
            "id": model.id,
            "name": model.name,
            "version": model.version,
            "description": model.description,
            "model_type": model.model_type,
            "architecture": model.architecture,
            "accuracy": model.accuracy,
            "confidence_threshold": model.confidence_threshold,
            "is_active": model.is_active,
            "created_at": model.created_at
        }
        for model in models
    ]


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete analysis record.
    
    This endpoint allows deletion of any analysis regardless of status.
    For running analyses, it will cancel them first, then delete.
    For completed analyses, it will just delete the record.
    """

    # Get the analysis record
    get_stmt = (
        select(AnalysisResult)
        .where(AnalysisResult.id == analysis_id)
        .options(
            selectinload(AnalysisResult.image), 
            selectinload(AnalysisResult.ai_model)
        )
    )
    result = await db.execute(get_stmt)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # If analysis is still running, cancel it first
    if analysis.status in [AnalysisStatus.PENDING, AnalysisStatus.ANALYZING]:
        analysis.status = AnalysisStatus.CANCELLED
        analysis.error_message = "Analysis cancelled and deleted by user"
        analysis.error_code = "USER_DELETED"
        
        # Notify via WebSocket about cancellation
        await manager.send_analysis_update(analysis_id, {
            "status": AnalysisStatus.CANCELLED.value,
            "message": "Analysis cancelled and deleted",
            "error_code": "USER_DELETED"
        })
    
    # Delete the analysis record
    await db.delete(analysis)
    await db.commit()
    
    # Broadcast the deletion to update the main list
    from app.schemas.analysis import AnalysisResponse
    analysis_data = AnalysisResponse.model_validate(analysis).model_dump(mode='json')
    await manager.broadcast({
        "type": "analysis_deleted",
        "data": analysis_data
    })
    
    return {"message": "Analysis deleted successfully"}