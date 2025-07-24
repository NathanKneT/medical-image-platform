import asyncio
import random
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.analysis import AnalysisResponse
from app.services.websocket_manager import manager

from app.models.analysis import AnalysisResult, AnalysisStatus
from app.models.ai_model import AIModel
from app.models.image import Image
from app.config import settings
from app.database import AsyncSessionLocal 

class AnalysisService:
    """
    AI Analysis service with mock implementation.
    
    This service demonstrates proper async patterns, error handling,
    and status management for long-running ML tasks.
    """
    
    @staticmethod
    async def start_analysis(
        db: AsyncSession,
        image_id: str,
        model_id: str,
        user_id: Optional[str] = None
        # <<< --- ADD THIS PARAMETER ---
    ) -> AnalysisResult:
        """
        Start AI analysis for an image.
        
        Creates an analysis record and returns immediately while
        processing continues in the background.
        
        Args:
            db: Database session for the initial request
            image_id: ID of image to analyze
            model_id: ID of AI model to use
            user_id: ID of requesting user
            
        Returns:
            AnalysisResult: Created analysis record
        """
        # Verify image and model exist
        image = await db.get(Image, image_id)
        if not image:
            raise ValueError(f"Image {image_id} not found")
            
        model = await db.get(AIModel, model_id)
        if not model:
            raise ValueError(f"AI Model {model_id} not found")
            
        if not model.is_active:
            raise ValueError(f"AI Model {model.name} v{model.version} is not active")
        
        # Create analysis record
        analysis = AnalysisResult(
            image_id=image_id,
            ai_model_id=model_id,
            status=AnalysisStatus.PENDING,
            requested_by=user_id,
            progress_percentage=0.0
        )
        
        db.add(analysis)
        await db.commit()
        await db.refresh(analysis, ["image", "ai_model"]) # Eager load for serialization
        
        # Convert the ORM object to a Pydantic model for correct JSON serialization
        analysis_data = AnalysisResponse.model_validate(analysis).model_dump(mode='json')

        await manager.broadcast({
            "type": "new_analysis_started",
            "data": analysis_data
        })
        
        return analysis
    
    @staticmethod
    async def mock_ai_analysis(
        analysis_id: str,
        websocket_manager=None
    ) -> None:
        """
        Mock AI analysis with realistic processing simulation.
        
        This function now correctly manages its own database session,
        preventing errors from closed sessions in background tasks.
        
        Args:
            analysis_id: ID of analysis to process
            websocket_manager: WebSocket manager for real-time updates
        """
        # Create a new, independent database session for this background task
        async with AsyncSessionLocal() as session:
            try:
                # Get analysis record using the task-specific session
                analysis = await session.get(AnalysisResult, analysis_id)
                if not analysis:
                    # Log an error or handle as needed
                    print(f"Error: Analysis with ID {analysis_id} not found in background task.")
                    return
                
                # Load related image and model details
                await session.refresh(analysis, ["image", "ai_model"])
                
                # Update status to analyzing
                analysis.status = AnalysisStatus.ANALYZING
                analysis.progress_percentage = 5.0
                await session.commit()
                
                # Send initial WebSocket update
                if websocket_manager:
                    await websocket_manager.send_analysis_update(analysis_id, {
                        "status": analysis.status.value,
                        "progress": analysis.progress_percentage,
                        "message": "Starting analysis..."
                    })
                
                # Simulate processing time
                total_time = random.randint(
                    settings.MIN_PROCESSING_TIME,
                    settings.MAX_PROCESSING_TIME
                )
                
                # Simulate progress updates
                progress_steps = [20, 40, 60, 80, 95]
                step_time = total_time / len(progress_steps)
                
                for progress in progress_steps:
                    await asyncio.sleep(step_time)
                    
                    analysis.progress_percentage = progress
                    await session.commit()
                    
                    if websocket_manager:
                        await websocket_manager.send_analysis_update(analysis_id, {
                            "status": analysis.status.value,
                            "progress": progress,
                            "message": f"Processing... {progress}%"
                        })
                
                # Simulate occasional failures
                if random.random() < 0.05:
                    await AnalysisService._simulate_analysis_failure(
                        session, analysis, websocket_manager
                    )
                    return
                
                # Generate mock results
                results = await AnalysisService._generate_mock_results(analysis.ai_model)
                
                # Update analysis with final results
                analysis.status = AnalysisStatus.COMPLETE
                analysis.progress_percentage = 100.0
                analysis.confidence_score = results.get("confidence_score", 0.85)
                analysis.results_payload = results
                analysis.processing_time_seconds = total_time
                
                await session.commit()
                
                # Send completion update
                if websocket_manager:
                    await websocket_manager.send_analysis_update(analysis_id, {
                        "status": analysis.status.value,
                        "progress": 100.0,
                        "message": "Analysis complete!",
                        "results": results,
                        "confidence_score": analysis.confidence_score
                    })
                    
            except Exception as e:
                # Handle any unexpected errors during the task
                print(f"An exception occurred in mock_ai_analysis for ID {analysis_id}: {e}")
                await AnalysisService._handle_analysis_error(
                    session, analysis_id, str(e), websocket_manager
                )
    
    @staticmethod
    async def _simulate_analysis_failure(
        db: AsyncSession,
        analysis: AnalysisResult,
        websocket_manager=None
    ):
        """Simulate analysis failure for robustness testing."""
        error_scenarios = [
            ("MODEL_ERROR", "Model inference failed due to corrupted weights"),
            ("MEMORY_ERROR", "Insufficient GPU memory for processing"),
            ("FORMAT_ERROR", "Unsupported image format or corrupted file"),
            ("TIMEOUT_ERROR", "Analysis timed out after maximum processing time")
        ]
        
        error_code, error_message = random.choice(error_scenarios)
        
        analysis.status = AnalysisStatus.FAILED
        analysis.error_code = error_code
        analysis.error_message = error_message
        analysis.progress_percentage = 0.0
        
        await db.commit()
        
        if websocket_manager:
            await websocket_manager.send_analysis_update(str(analysis.id), {
                "status": analysis.status.value,
                "progress": 0.0,
                "error": error_message,
                "error_code": error_code
            })
    
    @staticmethod
    async def _handle_analysis_error(
        db: AsyncSession,
        analysis_id: str,
        error_message: str,
        websocket_manager=None
    ):
        """Handle unexpected analysis errors."""
        analysis = await db.get(AnalysisResult, analysis_id)
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = f"Unexpected error: {error_message}"
            analysis.error_code = "SYSTEM_ERROR"
            await db.commit()
            
            if websocket_manager:
                await websocket_manager.send_analysis_update(analysis_id, {
                    "status": analysis.status.value,
                    "error": analysis.error_message,
                    "error_code": analysis.error_code
                })
    
    @staticmethod
    async def _generate_mock_results(ai_model: AIModel) -> Dict[str, Any]:
        """
        Generate realistic mock results based on model type.
        """
        base_confidence = random.uniform(0.75, 0.98)
        
        if ai_model.model_type == "classification":
            return {
                "model_name": ai_model.name,
                "model_version": ai_model.version,
                "confidence_score": base_confidence,
                "prediction": {
                    "class": random.choice(["Normal", "Pneumonia", "Other_abnormality"]),
                    "probability": base_confidence,
                    "class_probabilities": {
                        "Normal": round(random.uniform(0.1, 0.9), 3),
                        "Pneumonia": round(base_confidence, 3),
                        "Other_abnormality": round(random.uniform(0.05, 0.3), 3)
                    }
                },
                "regions_of_interest": [
                    {
                        "x": random.randint(100, 300), "y": random.randint(150, 350),
                        "width": random.randint(80, 150), "height": random.randint(80, 150),
                        "confidence": round(random.uniform(0.7, 0.95), 3)
                    }
                ],
                "processing_metadata": {
                    "input_resolution": "512x512",
                    "preprocessing": ["resize", "normalize", "augment"],
                    "inference_time_ms": random.randint(200, 800)
                }
            }
        
        elif ai_model.model_type == "segmentation":
            return {
                "model_name": ai_model.name,
                "model_version": ai_model.version,
                "confidence_score": base_confidence,
                "segmentation": {
                    "tumor_detected": random.choice([True, False]),
                    "tumor_volume_ml": round(random.uniform(0.5, 15.2), 2),
                    "tumor_location": random.choice(["frontal_lobe", "parietal_lobe", "temporal_lobe", "occipital_lobe"]),
                    "mask_url": "/api/v1/analysis/mask/example.png"
                },
                "metrics": {
                    "dice_coefficient": round(random.uniform(0.85, 0.95), 3),
                    "jaccard_index": round(random.uniform(0.75, 0.88), 3),
                    "sensitivity": round(random.uniform(0.88, 0.96), 3),
                    "specificity": round(random.uniform(0.92, 0.98), 3)
                },
                "processing_metadata": {
                    "input_slices": random.randint(80, 200),
                    "output_resolution": "256x256x128",
                    "inference_time_ms": random.randint(2000, 5000)
                }
            }
        
        elif ai_model.model_type == "detection":
            nodule_count = random.randint(0, 4)
            nodules = [
                {
                    "id": f"nodule_{i+1}",
                    "center": [random.randint(50, 450), random.randint(50, 450), random.randint(10, 90)],
                    "diameter_mm": round(random.uniform(3.2, 25.8), 1),
                    "confidence": round(random.uniform(0.7, 0.95), 3),
                    "malignancy_risk": random.choice(["low", "medium", "high"]),
                    "characteristics": {
                        "solid": random.choice([True, False]),
                        "calcified": random.choice([True, False]),
                        "spiculated": random.choice([True, False])
                    }
                } for i in range(nodule_count)
            ]
            return {
                "model_name": ai_model.name, "model_version": ai_model.version,
                "confidence_score": base_confidence,
                "detection": {"nodules_found": nodule_count, "nodules": nodules, "total_lung_volume_ml": round(random.uniform(4500, 6500), 0)},
                "recommendations": ["Follow-up CT scan in 6 months" if nodule_count > 0 else "No immediate follow-up required", "Consider PET scan if nodules show growth" if nodule_count > 2 else None],
                "processing_metadata": {"ct_slices_processed": random.randint(200, 400), "detection_threshold": 0.5, "inference_time_ms": random.randint(3000, 8000)}
            }
        
        else:
            return {
                "model_name": ai_model.name, "model_version": ai_model.version,
                "confidence_score": base_confidence,
                "generic_output": {"status": "completed", "features_extracted": random.randint(512, 2048), "anomaly_score": round(random.uniform(0.1, 0.8), 3)},
                "processing_metadata": {"inference_time_ms": random.randint(500, 2000)}
            }