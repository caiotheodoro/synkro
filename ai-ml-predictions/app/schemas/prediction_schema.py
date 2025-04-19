from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional
from datetime import datetime

class PredictionRequest(BaseModel):
    item_id: str
    model_name: str
    days: Optional[int] = 180  # Number of days of historical data to use

    model_config = ConfigDict(protected_namespaces=())

class PredictionResponse(BaseModel):
    id: str
    item_id: str
    model_name: str
    predicted_demand: float
    confidence_score: Optional[float] = None
    timestamp: datetime
    features_used: Dict[str, List[float]]

    model_config = ConfigDict(protected_namespaces=())

class PredictionList(BaseModel):
    items: List[PredictionResponse]
    total: int
    skip: int
    limit: int

class BatchPredictionRequest(BaseModel):
    item_ids: List[str]
    model_name: str
    days: Optional[int] = 180

    model_config = ConfigDict(protected_namespaces=())

class PredictionResult(BaseModel):
    id: str
    item_id: str
    predicted_demand: float
    timestamp: datetime
    confidence_score: Optional[float] = None
    last_updated: datetime

class ModelListResponse(BaseModel):
    models: List[str] 