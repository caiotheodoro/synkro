from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.database_model import PredictionRecord, DataChangeTracker
from app.utils.ml_utils import make_prediction, calculate_data_hash
import uuid

class PredictionService:
    def __init__(self, db: Session):
        self.db = db

    def create_prediction(self, item_id: str, data: Dict[str, List[float]]) -> PredictionRecord:
        data_hash = calculate_data_hash(data)
        predicted_demand, confidence = make_prediction(data)

        prediction = PredictionRecord(
            id=str(uuid.uuid4()),
            item_id=item_id,
            predicted_demand=predicted_demand,
            confidence_score=confidence,
            data_hash=data_hash,
            input_data=data,
            timestamp=datetime.utcnow()
        )

        self.db.add(prediction)
        self.db.commit()
        self.db.refresh(prediction)

        self._update_change_tracker(item_id, data_hash)
        return prediction

    def _update_change_tracker(self, item_id: str, data_hash: str):
        tracker = self.db.query(DataChangeTracker).filter_by(item_id=item_id).first()
        
        if not tracker:
            tracker = DataChangeTracker(
                item_id=item_id,
                last_hash=data_hash,
                last_checked=datetime.utcnow()
            )
            self.db.add(tracker)
        else:
            tracker.last_hash = data_hash
            tracker.last_checked = datetime.utcnow()
        
        self.db.commit()

    def check_data_changed(self, item_id: str, data: Dict[str, List[float]]) -> bool:
        current_hash = calculate_data_hash(data)
        tracker = self.db.query(DataChangeTracker).filter_by(item_id=item_id).first()
        
        if not tracker:
            return True
        
        return tracker.last_hash != current_hash

    def get_latest_prediction(self, item_id: str) -> Optional[PredictionRecord]:
        return self.db.query(PredictionRecord)\
            .filter_by(item_id=item_id)\
            .order_by(PredictionRecord.timestamp.desc())\
            .first() 