import json

from datetime import datetime, timezone
from typing import Dict, List, Optional, Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.database_model import PredictionRecord
from app.core.exceptions import ModelNotFoundError, PredictionError
from app.services.model_registry.registry import ModelRegistry
from app.services.feature_store.logistics_store import LogisticsFeatureStore, get_logistics_feature_store
from app.services.cache.redis_cache import RedisCache, get_redis_cache
from app.core.config.database import get_predictions_db, get_logistics_db
from fastapi import Depends
import logging
import uuid
from sqlalchemy.dialects.postgresql import UUID

logger = logging.getLogger(__name__)

class PredictionService:
    def __init__(
        self,
        predictions_db: AsyncSession,
        logistics_db: AsyncSession,
        model_registry: ModelRegistry,
        feature_store: LogisticsFeatureStore,
        cache: Optional[RedisCache] = None
    ):
        self.predictions_db = predictions_db
        self.logistics_db = logistics_db
        self.model_registry = model_registry
        self.feature_store = feature_store
        self.cache = cache

    async def create_prediction(self, item_id: str, model_name: str) -> Dict:
        try:
            # Only try to get from cache if Redis is available
            if self.cache is not None:
                cache_key = f"prediction:{model_name}:{item_id}"
                cached_prediction = await self.cache.get(cache_key)
                if cached_prediction:
                    logger.info("Returning cached prediction")
                    return cached_prediction

            model = self.model_registry.get_model(model_name)
            if not model:
                raise ModelNotFoundError(f"Model {model_name} not found")

            features = await self.feature_store.get_features(item_id)

            prediction_result = model.predict(features)
            logger.debug(f"Raw prediction result: {prediction_result}")
            
            predicted_demand = prediction_result.get("prediction")
            if predicted_demand is None:
                raise PredictionError("Model did not return a prediction value")
                
            confidence_score = prediction_result.get("confidence")

            # Use None for id to let the database generate the ID
            prediction = {
                "id": None,  # Let the database generate the ID
                "item_id": item_id,
                "model_name": model_name,
                "predicted_demand": predicted_demand,
                "confidence_score": confidence_score,
                "timestamp": datetime.now(timezone.utc),
                "features_used": features
            }

            # Save prediction and get the generated ID
            prediction_id = await self._save_prediction(prediction)
            prediction["id"] = prediction_id

            # Only cache if Redis is available
            if self.cache is not None:
                await self.cache.set(cache_key, prediction)
            return prediction

        except ModelNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error creating prediction: {str(e)}")
            raise PredictionError(f"Failed to create prediction: {str(e)}")

    async def _save_prediction(self, prediction: Dict) -> int:
        try:
            logger.info(f"Attempting to save prediction to database: {prediction}")
            
            # Create the SQL query without the ID field since it's auto-generated
            query = text("""
                INSERT INTO predictions (
                    model_name, item_id, input_data, prediction_result,
                    confidence_score, created_at, updated_at
                ) VALUES (
                    :model_name, :item_id, :input_data, :prediction_result,
                    :confidence_score, :created_at, :updated_at
                )
                RETURNING id
            """)
            
            # Create parameters dictionary without the id
            # Convert Python dictionaries to JSON strings for JSONB columns
            params = {
                "model_name": prediction["model_name"],
                "item_id": prediction["item_id"],
                "input_data": json.dumps({"features": prediction["features_used"]}),
                "prediction_result": json.dumps({"predicted_demand": prediction["predicted_demand"]}),
                "confidence_score": prediction["confidence_score"],
                "created_at": prediction["timestamp"],
                "updated_at": prediction["timestamp"]
            }
            
            logger.debug(f"Executing SQL with values: {params}")
            result = await self.predictions_db.execute(query, params)
            prediction_id = result.scalar()
            
            await self.predictions_db.commit()
            logger.info(f"Successfully saved prediction to database with ID {prediction_id}")
            
            return prediction_id
        except Exception as e:
            logger.error(f"Error saving prediction: {str(e)}")
            logger.exception("Full traceback:")
            raise

    async def get_prediction(self, prediction_id: int) -> Optional[Dict]:
        try:
            # Only try to get from cache if Redis is available
            if self.cache is not None:
                cache_key = f"prediction_id:{prediction_id}"
                cached_prediction = await self.cache.get(cache_key)
                if cached_prediction:
                    return cached_prediction

            query = text("""
                SELECT * FROM predictions WHERE id = :prediction_id
            """)
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

            # Only cache if Redis is available
            if self.cache is not None:
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
            query = text("""
                SELECT * FROM predictions
                ORDER BY created_at DESC
                OFFSET :skip LIMIT :limit
            """)
            
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

def get_prediction_service(
    predictions_db: Annotated[AsyncSession, Depends(get_predictions_db)],
    logistics_db: Annotated[AsyncSession, Depends(get_logistics_db)],
    model_registry: Annotated[ModelRegistry, Depends()],
    feature_store: Annotated[LogisticsFeatureStore, Depends(get_logistics_feature_store)],
    cache: Optional[RedisCache] = Depends(get_redis_cache)
) -> PredictionService:
    """Get an instance of the prediction service with all dependencies."""
    return PredictionService(
        predictions_db=predictions_db,
        logistics_db=logistics_db,
        model_registry=model_registry,
        feature_store=feature_store,
        cache=cache
    )