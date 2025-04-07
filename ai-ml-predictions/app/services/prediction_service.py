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
from abc import ABC, abstractmethod
from fastapi import Depends
from app.core.config.settings import settings
from app.models.prediction import PredictionModel
from app.schemas.prediction import PredictionCreate, PredictionResponse, PredictionList
from app.core.exceptions import ModelNotFoundError, PredictionError
from app.services.model_registry.registry import ModelRegistry
from app.services.feature_store.store import FeatureStore
from app.services.cache.redis_cache import RedisCache
from app.core.config.database import get_db

logger = logging.getLogger(__name__)

class PredictionServiceInterface(ABC):
    @abstractmethod
    async def create_prediction(self, data: PredictionCreate) -> PredictionResponse:
        pass

    @abstractmethod
    async def get_prediction(self, prediction_id: str) -> Optional[PredictionResponse]:
        pass

    @abstractmethod
    async def list_predictions(self, skip: int = 0, limit: int = 100) -> List[PredictionResponse]:
        pass

class PredictionService:
    def __init__(
        self,
        db: AsyncSession,
        model_registry: ModelRegistry,
        feature_store: FeatureStore,
        cache: RedisCache
    ):
        self.db = db
        self.model_registry = model_registry
        self.feature_store = feature_store
        self.cache = cache

    async def create_prediction(self, data: PredictionCreate) -> PredictionResponse:
        try:
            cache_key = f"prediction:{data.model_name}:{hash(str(data.input_data))}"
            cached_prediction = await self.cache.get(cache_key)
            if cached_prediction:
                logger.info("Returning cached prediction")
                return PredictionResponse(**cached_prediction)

            model = self.model_registry.get_model(data.model_name)
            if not model:
                raise ModelNotFoundError(f"Model {data.model_name} not found")

            features = await self.feature_store.get_features(data.input_data)

            prediction_result = model.predict(features)
            confidence_score = prediction_result.get("confidence", None)

            prediction = await PredictionModel.create(
                db=self.db,
                model_name=data.model_name,
                input_data=data.input_data,
                prediction_result=prediction_result,
                confidence_score=confidence_score
            )

            response = PredictionResponse.model_validate(prediction)
            await self.cache.set(cache_key, response.model_dump())

            return response

        except ModelNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error creating prediction: {str(e)}")
            raise PredictionError(f"Failed to create prediction: {str(e)}")

    async def get_prediction(self, prediction_id: int) -> Optional[PredictionResponse]:
        try:
            # Try to get from cache
            cache_key = f"prediction_id:{prediction_id}"
            cached_prediction = await self.cache.get(cache_key)
            if cached_prediction:
                logger.info("Returning cached prediction")
                return PredictionResponse(**cached_prediction)

            # Get from database
            prediction = await PredictionModel.get(self.db, prediction_id)
            if not prediction:
                return None

            # Cache and return
            response = PredictionResponse.model_validate(prediction)
            await self.cache.set(cache_key, response.model_dump())
            return response

        except Exception as e:
            logger.error(f"Error getting prediction: {str(e)}")
            raise PredictionError(f"Failed to get prediction: {str(e)}")

    async def list_predictions(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> PredictionList:
        try:
            # Get predictions from database
            predictions = await PredictionModel.list(
                db=self.db,
                skip=skip,
                limit=limit
            )

            # Convert to response models
            items = [
                PredictionResponse.model_validate(prediction)
                for prediction in predictions
            ]

            return PredictionList(
                items=items,
                total=len(items),
                skip=skip,
                limit=limit
            )

        except Exception as e:
            logger.error(f"Error listing predictions: {str(e)}")
            raise PredictionError(f"Failed to list predictions: {str(e)}")

    async def batch_predict(
        self,
        batch_data: List[PredictionCreate]
    ) -> List[PredictionResponse]:
        try:
            results = []
            for data in batch_data:
                result = await self.create_prediction(data)
                results.append(result)
            return results

        except Exception as e:
            logger.error(f"Error in batch prediction: {str(e)}")
            raise PredictionError(f"Failed to process batch predictions: {str(e)}")

def get_prediction_service(
    db: AsyncSession = Depends(get_db),
    model_registry: ModelRegistry = Depends(),
    feature_store: FeatureStore = Depends(),
    cache: RedisCache = Depends()
) -> PredictionService:
    return PredictionService(db, model_registry, feature_store, cache)