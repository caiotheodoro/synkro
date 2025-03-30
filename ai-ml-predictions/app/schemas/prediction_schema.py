from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class PredictionRequest(BaseModel):
    data: Dict[str, List[float]]

class PredictionResponse(BaseModel):
    predicted_demand: float
    timestamp: datetime
    confidence_score: Optional[float] = None

class PredictionResult(BaseModel):
    id: str
    item_id: str
    predicted_demand: float
    timestamp: datetime
    confidence_score: Optional[float] = None
    last_updated: datetime 