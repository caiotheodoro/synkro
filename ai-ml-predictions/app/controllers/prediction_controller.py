from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.schemas.prediction_schema import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService
from app.core.config.database import get_predictions_db
from app.jobs.prediction_job import process_item_prediction, run_predictions
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/predict/{item_id}", response_model=PredictionResponse)
async def predict_demand(
    item_id: str,
    request: PredictionRequest,
    db: AsyncSession = Depends(get_predictions_db)
):
    try:
        service = PredictionService(db)
        prediction = await service.create_prediction(item_id, request.data)
        
        return PredictionResponse(
            predicted_demand=prediction.predicted_demand,
            timestamp=prediction.timestamp,
            confidence_score=prediction.confidence_score
        )
    except Exception as e:
        logger.error(f"Error creating prediction for item {item_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create prediction"
        )

@router.get("/prediction/{item_id}", response_model=PredictionResponse)
async def get_prediction(
    item_id: str,
    db: AsyncSession = Depends(get_predictions_db)
):
    try:
        service = PredictionService(db)
        prediction = await service.get_latest_prediction(item_id)
        
        if not prediction:
            raise HTTPException(
                status_code=404,
                detail=f"No prediction found for item {item_id}"
            )
        
        return PredictionResponse(
            predicted_demand=prediction.predicted_demand,
            timestamp=prediction.timestamp,
            confidence_score=prediction.confidence_score
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prediction for item {item_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch prediction"
        )

@router.post("/trigger")
async def trigger_predictions(
    item_id: Optional[str] = None,
    db: AsyncSession = Depends(get_predictions_db)
):
    """
    Trigger predictions manually for all items or a specific item
    """
    try:
        if item_id:
            await process_item_prediction(item_id)
            return {"message": f"Prediction triggered for item {item_id}"}
        else:
            await run_predictions()
            return {"message": "Predictions triggered for all items"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 