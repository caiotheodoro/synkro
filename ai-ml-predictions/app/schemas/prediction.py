from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field, ConfigDict

class PredictionBase(BaseModel):
    model_name: str = Field(..., description="Name of the model to use for prediction")
    input_data: Dict[str, Any] = Field(..., description="Input data for prediction")

    model_config = ConfigDict(protected_namespaces=())

class PredictionCreate(PredictionBase):
    pass

class PredictionResponse(PredictionBase):
    id: int
    prediction_result: Dict[str, Any] = Field(..., description="Prediction result")
    confidence_score: Optional[float] = Field(None, description="Confidence score of the prediction")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class PredictionList(BaseModel):
    items: List[PredictionResponse]
    total: int
    skip: int
    limit: int

    model_config = ConfigDict(protected_namespaces=()) 