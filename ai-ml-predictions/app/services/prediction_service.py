from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.database_model import PredictionRecord
from app.core.exceptions import ModelNotFoundError, PredictionError
from app.services.model_registry.registry import ModelRegistry
from app.services.feature_store.logistics_store import LogisticsFeatureStore
from app.services.cache.redis_cache import RedisCache
from app.core.config.database import get_predictions_db, get_logistics_db_session
from fastapi import Depends
import logging
import uuid

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(
        self,
        predictions_db: AsyncSession,
        logistics_db: AsyncSession,
        model_registry: ModelRegistry,
        feature_store: LogisticsFeatureStore,
        cache: RedisCache
    ):
        self.predictions_db = predictions_db
        self.logistics_db = logistics_db
        self.model_registry = model_registry
        self.feature_store = feature_store
        self.cache = cache

    async def create_prediction(self, item_id: str, model_name: str) -> Dict:
        try:
            cache_key = f"prediction:{model_name}:{item_id}"
            cached_prediction = await self.cache.get(cache_key)
            if cached_prediction:
                logger.info("Returning cached prediction")
                return cached_prediction

            model = self.model_registry.get_model(model_name)
            if not model:
                raise ModelNotFoundError(f"Model {model_name} not found")

            # Get features from logistics database
            features = await self.feature_store.get_features(item_id)

            prediction_result = model.predict(features)
            confidence_score = prediction_result.get("confidence", None)

            prediction_id = str(uuid.uuid4())
            prediction = {
                "id": prediction_id,
                "item_id": item_id,
                "model_name": model_name,
                "predicted_demand": prediction_result["predicted_demand"],
                "confidence_score": confidence_score,
                "timestamp": datetime.utcnow(),
                "features_used": features
            }

            # Save to database
            await self._save_prediction(prediction)

            await self.cache.set(cache_key, prediction)
            return prediction

        except ModelNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error creating prediction: {str(e)}")
            raise PredictionError(f"Failed to create prediction: {str(e)}")

    async def _save_prediction(self, prediction: Dict) -> None:
        query = """
            INSERT INTO predictions (
                id, model_name, item_id, input_data, prediction_result,
                confidence_score, created_at, updated_at
            ) VALUES (
                :id, :model_name, :item_id, :input_data, :prediction_result,
                :confidence_score, :created_at, :updated_at
            )
        """
        values = {
            "id": prediction["id"],
            "model_name": prediction["model_name"],
            "item_id": prediction["item_id"],
            "input_data": {"features": prediction["features_used"]},
            "prediction_result": {"predicted_demand": prediction["predicted_demand"]},
            "confidence_score": prediction["confidence_score"],
            "created_at": prediction["timestamp"],
            "updated_at": prediction["timestamp"]
        }
        await self.predictions_db.execute(query, values)
        await self.predictions_db.commit()

    async def get_prediction(self, prediction_id: str) -> Optional[Dict]:
        try:
            cache_key = f"prediction_id:{prediction_id}"
            cached_prediction = await self.cache.get(cache_key)
            if cached_prediction:
                return cached_prediction

            query = """
                SELECT * FROM predictions WHERE id = :prediction_id
            """
            result = await self.predictions_db.execute(query, {"prediction_id": prediction_id})
            prediction = result.fetchone()
            
            if not prediction:
                return None

            response = {
                "id": prediction.id,
                "item_id": prediction.item_id,
                "model_name": prediction.model_name,
                "predicted_demand": prediction.prediction_result["predicted_demand"],
                "confidence_score": prediction.confidence_score,
                "timestamp": prediction.created_at,
                "features_used": prediction.input_data["features"]
            }

            await self.cache.set(cache_key, response)
            return response

        except Exception as e:
            logger.error(f"Error getting prediction: {str(e)}")
            raise PredictionError(f"Failed to get prediction: {str(e)}")

    async def list_predictions(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> Dict[str, any]:
        try:
            query = """
                SELECT * FROM predictions
                ORDER BY created_at DESC
                OFFSET :skip LIMIT :limit
            """
            result = await self.predictions_db.execute(query, {"skip": skip, "limit": limit})
            predictions = result.fetchall()

            items = []
            for p in predictions:
                items.append({
                    "id": p.id,
                    "item_id": p.item_id,
                    "model_name": p.model_name,
                    "predicted_demand": p.prediction_result["predicted_demand"],
                    "confidence_score": p.confidence_score,
                    "timestamp": p.created_at,
                    "features_used": p.input_data["features"]
                })

            return {
                "items": items,
                "total": len(items),
                "skip": skip,
                "limit": limit
            }

        except Exception as e:
            logger.error(f"Error listing predictions: {str(e)}")
            raise PredictionError(f"Failed to list predictions: {str(e)}")

    async def batch_predict(
        self,
        item_ids: List[str],
        model_name: str
    ) -> List[Dict]:
        try:
            results = []
            for item_id in item_ids:
                result = await self.create_prediction(item_id, model_name)
                results.append(result)
            return results

        except Exception as e:
            logger.error(f"Error in batch prediction: {str(e)}")
            raise PredictionError(f"Failed to process batch predictions: {str(e)}")

async def get_prediction_service(
    predictions_db: AsyncSession = Depends(get_predictions_db),
    logistics_db: AsyncSession = Depends(get_logistics_db_session),
    model_registry: ModelRegistry = Depends(),
    feature_store: LogisticsFeatureStore = Depends(),
    cache: RedisCache = Depends()
) -> PredictionService:
    return PredictionService(
        predictions_db=predictions_db,
        logistics_db=logistics_db,
        model_registry=model_registry,
        feature_store=feature_store,
        cache=cache
    )