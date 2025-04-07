from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config.database import get_db
from app.schemas.prediction import PredictionCreate, PredictionResponse, PredictionList
from app.services.prediction_service import PredictionService, get_prediction_service

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.get("/models", response_model=List[str])
async def list_models(
    service: PredictionService = Depends(get_prediction_service)
):
    """List all available models."""
    try:
        return service.model_registry.get_all_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{model_name}/predict", response_model=Dict[str, Any])
async def predict_with_model(
    model_name: str,
    features: Dict[str, Any],
    service: PredictionService = Depends(get_prediction_service)
):
    """Make a prediction using a specific model."""
    try:
        model = service.model_registry.get_model(model_name)
        if not model:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
        
        result = model.predict(features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=PredictionResponse)
async def create_prediction(
    data: PredictionCreate,
    db: AsyncSession = Depends(get_db),
    service: PredictionService = Depends(get_prediction_service)
):
    """Create a new prediction."""
    try:
        return await service.create_prediction(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=PredictionList)
async def list_predictions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    service: PredictionService = Depends(get_prediction_service)
):
    """List predictions with pagination."""
    try:
        return await service.list_predictions(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{prediction_id}", response_model=Optional[PredictionResponse])
async def get_prediction(
    prediction_id: int,
    db: AsyncSession = Depends(get_db),
    service: PredictionService = Depends(get_prediction_service)
):
    """Get a prediction by ID."""
    try:
        prediction = await service.get_prediction(prediction_id)
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch", response_model=List[PredictionResponse])
async def batch_predict(
    batch_data: List[PredictionCreate],
    db: AsyncSession = Depends(get_db),
    service: PredictionService = Depends(get_prediction_service)
):
    """Create multiple predictions in batch."""
    try:
        return await service.batch_predict(batch_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 