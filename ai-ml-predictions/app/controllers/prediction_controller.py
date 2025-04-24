from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.prediction_schema import (
    PredictionRequest,
    PredictionResponse,
    PredictionList,
    BatchPredictionRequest,
    ModelListResponse
)
from app.services.prediction_service import PredictionService, get_prediction_service

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.get("/models", response_model=ModelListResponse)
async def list_models(
    service: PredictionService = Depends(get_prediction_service)
):
    """List all available prediction models."""
    try:
        model_names = service.model_registry.get_all_models()
        models = []
        for name in model_names:
            # Create a proper Model object for each model name
            models.append({
                "name": name,
                "version": "1.0",  # Default version
                "description": f"{name} prediction model",
                "type": "regression",
                "status": "active"
            })
        return ModelListResponse(models=models)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict", response_model=PredictionResponse)
async def create_prediction(
    request: PredictionRequest,
    service: PredictionService = Depends(get_prediction_service)
):
    """Create a new demand prediction for an item."""
    try:
        return await service.create_prediction(
            item_id=request.item_id,
            model_name=request.model_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch", response_model=List[PredictionResponse])
async def batch_predict(
    request: BatchPredictionRequest,
    service: PredictionService = Depends(get_prediction_service)
):
    """Create predictions for multiple items using the same model."""
    try:
        return await service.batch_predict(
            item_ids=request.item_ids,
            model_name=request.model_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: int,
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

@router.get("/", response_model=PredictionList)
async def list_predictions(
    skip: int = 0,
    limit: int = 100,
    service: PredictionService = Depends(get_prediction_service)
):
    """List predictions with pagination."""
    try:
        return await service.list_predictions(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 