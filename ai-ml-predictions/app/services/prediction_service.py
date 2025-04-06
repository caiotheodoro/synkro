from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models.database_model import PredictionRecord, PredictionType, PredictionStatus
from contextlib import asynccontextmanager
import numpy as np
import uuid
import logging
import json
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(self, db: AsyncSession):
        self._db = db

    @property
    def db(self) -> AsyncSession:
        return self._db

    def _calculate_simple_prediction(self, data: Dict[str, List[float]]) -> Tuple[float, float]:
        try:
            quantities = np.array(data.get('quantity', [0]))
            if len(quantities) == 0:
                return 0.0, 0.0

            # Simple moving average prediction
            prediction = float(np.mean(quantities))
            
            # Simple confidence calculation based on standard deviation
            std_dev = float(np.std(quantities)) if len(quantities) > 1 else 0.0
            confidence = max(0.0, min(1.0, 1.0 - (std_dev / (prediction + 1e-6))))
            
            return prediction, confidence
        except Exception as e:
            logger.error(f"Error calculating prediction: {str(e)}")
            return 0.0, 0.0

    async def create_prediction(self, item_id: str, data: Dict[str, List[float]]) -> Optional[PredictionRecord]:
        """Create a new prediction for an item."""
        try:
            predicted_demand, confidence = self._calculate_simple_prediction(data)
            prediction_id = uuid.uuid4()

            # Create prediction values
            values = {
                "id": prediction_id,
                "item_id": item_id,
                "warehouse_id": "default",
                "prediction_type": PredictionType.demand,
                "status": PredictionStatus.completed,
                "predicted_demand": predicted_demand,
                "confidence_score": confidence,
                "input_data": data,
                "data_hash": str(hash(json.dumps(data, sort_keys=True))),
                "model_version": "1.0.0",
                "timestamp": datetime.utcnow()
            }

            # Use insert().returning() to get the created record
            stmt = insert(PredictionRecord).values(**values).returning(PredictionRecord)
            result = await self.db.execute(stmt)
            prediction = result.scalar_one()
            
            await self.db.commit()
            return prediction

        except SQLAlchemyError as e:
            logger.error(f"Database error creating prediction for item {item_id}: {str(e)}")
            await self.db.rollback()
            raise
        except Exception as e:
            logger.error(f"Error creating prediction for item {item_id}: {str(e)}")
            await self.db.rollback()
            raise

    async def get_latest_prediction(self, item_id: str) -> Optional[PredictionRecord]:
        """Get the most recent prediction for an item."""
        try:
            stmt = select(PredictionRecord)\
                .filter_by(item_id=item_id)\
                .order_by(PredictionRecord.timestamp.desc())
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
            
        except Exception as e:
            logger.error(f"Error fetching prediction for item {item_id}: {str(e)}")
            raise

    async def bulk_create_predictions(self, predictions_data: List[Dict[str, Dict[str, List[float]]]]) -> List[PredictionRecord]:
        """Create multiple predictions in bulk."""
        try:
            values = []
            for data in predictions_data:
                for item_id, item_data in data.items():
                    predicted_demand, confidence = self._calculate_simple_prediction(item_data)
                    values.append({
                        "id": uuid.uuid4(),
                        "item_id": item_id,
                        "warehouse_id": "default",
                        "prediction_type": PredictionType.demand,
                        "status": PredictionStatus.completed,
                        "predicted_demand": predicted_demand,
                        "confidence_score": confidence,
                        "input_data": item_data,
                        "data_hash": str(hash(json.dumps(item_data, sort_keys=True))),
                        "model_version": "1.0.0",
                        "timestamp": datetime.utcnow()
                    })

            if not values:
                return []

            stmt = insert(PredictionRecord).values(values).returning(PredictionRecord)
            result = await self.db.execute(stmt)
            predictions = result.scalars().all()
            
            await self.db.commit()
            return list(predictions)

        except SQLAlchemyError as e:
            logger.error(f"Database error in bulk prediction creation: {str(e)}")
            await self.db.rollback()
            raise
        except Exception as e:
            logger.error(f"Error in bulk prediction creation: {str(e)}")
            await self.db.rollback()
            raise 