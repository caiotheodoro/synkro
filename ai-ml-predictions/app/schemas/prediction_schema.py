from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class PredictionRequest(BaseModel):
    item_id: str
    model_name: str

class BatchPredictionRequest(BaseModel):
    item_ids: List[str]
    model_name: str

class GenericResponse(BaseModel):
    message: str

class PredictionResponse(BaseModel):
    id: Union[int, str]
    item_id: str
    model_name: str
    predicted_demand: float
    confidence_score: Optional[float] = None
    timestamp: datetime
    features_used: Dict[str, Any]

    model_config = ConfigDict(protected_namespaces=())

class PredictionList(BaseModel):
    items: List[PredictionResponse]
    total: int
    skip: int
    limit: int

class PredictionResult(BaseModel):
    id: Union[int, str]
    item_id: str
    predicted_demand: float
    timestamp: datetime
    confidence_score: Optional[float] = None
    last_updated: datetime

class Model(BaseModel):
    name: str
    version: str
    description: str
    type: str
    status: str

class ModelListResponse(BaseModel):
    models: List[Model] 