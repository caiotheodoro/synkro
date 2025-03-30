from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from app.schemas.prediction_schema import PredictionRequest, PredictionResponse
from app.services.prediction_service import PredictionService
from app.core.config.database import get_db
from app.jobs.prediction_job import process_item_prediction, run_predictions
from datetime import datetime

router = APIRouter()

@router.post("/predict/{item_id}", response_model=PredictionResponse)
async def predict_demand(
    item_id: str,
    request: PredictionRequest,
    db: Session = Depends(get_db)
):
    try:
        service = PredictionService(db)
        prediction = service.create_prediction(item_id, request.data)
        
        return PredictionResponse(
            predicted_demand=prediction.predicted_demand,
            timestamp=prediction.timestamp,
            confidence_score=prediction.confidence_score
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prediction/{item_id}", response_model=PredictionResponse)
async def get_prediction(
    item_id: str,
    db: Session = Depends(get_db)
):
    service = PredictionService(db)
    prediction = service.get_latest_prediction(item_id)
    
    if not prediction:
        raise HTTPException(status_code=404, detail="No prediction found for this item")
    
    return PredictionResponse(
        predicted_demand=prediction.predicted_demand,
        timestamp=prediction.timestamp,
        confidence_score=prediction.confidence_score
    )

@router.post("/trigger", response_model=Dict[str, str])
async def trigger_predictions(
    item_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Manually trigger predictions. If item_id is provided, only trigger for that item.
    If no item_id is provided, trigger for all items.
    """
    try:
        if item_id:
            await process_item_prediction(item_id, db)
            return {"message": f"Prediction triggered successfully for item {item_id}"}
        else:
            await run_predictions()
            return {"message": "Predictions triggered successfully for all items"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 