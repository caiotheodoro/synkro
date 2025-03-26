from typing import Dict, List
from fastapi import APIRouter, HTTPException, Depends
from prometheus_client import Counter, Histogram

from app.core.logging.logger import logger
from app.services.feature_store.feature_service import FeatureService
from app.services.model_registry.model_service import ModelService
from app.core.config.cache import cache
from app.core.config.settings import settings

router = APIRouter()

# Metrics
PREDICTIONS_COUNTER = Counter('ml_predictions_total', 'Total number of predictions made', ['model_type'])
PREDICTION_DURATION = Histogram('ml_prediction_duration_seconds', 'Time spent processing prediction', ['model_type'])

@router.post("/demand")
async def predict_demand(
    data: Dict[str, List[float]],
    feature_service: FeatureService = Depends(),
    model_service: ModelService = Depends()
) -> Dict[str, float]:
    """
    Predict demand based on historical data
    """
    try:
        # Check cache
        cache_key = cache.generate_key("demand_prediction", str(data))
        if cached_result := cache.get(cache_key):
            logger.info("Returning cached demand prediction")
            return cached_result

        with PREDICTION_DURATION.labels(model_type="demand").time():
            # Get features
            features = await feature_service.prepare_features(data)
            
            # Get prediction
            prediction = await model_service.predict_demand(features)
            
            # Cache result
            cache.set(
                cache_key,
                prediction,
                ttl=settings.PREDICTION_CACHE_TTL
            )
            
            PREDICTIONS_COUNTER.labels(model_type="demand").inc()
            return prediction
    except Exception as e:
        logger.error(f"Error predicting demand: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stockout")
async def predict_stockout(
    data: Dict[str, any],
    feature_service: FeatureService = Depends(),
    model_service: ModelService = Depends()
) -> Dict[str, float]:
    """
    Predict probability of stockout
    """
    try:
        cache_key = cache.generate_key("stockout_prediction", str(data))
        if cached_result := cache.get(cache_key):
            logger.info("Returning cached stockout prediction")
            return cached_result

        with PREDICTION_DURATION.labels(model_type="stockout").time():
            features = await feature_service.prepare_features(data)
            prediction = await model_service.predict_stockout(features)
            
            cache.set(
                cache_key,
                prediction,
                ttl=settings.PREDICTION_CACHE_TTL
            )
            
            PREDICTIONS_COUNTER.labels(model_type="stockout").inc()
            return prediction
    except Exception as e:
        logger.error(f"Error predicting stockout: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize")
async def optimize_stock(
    data: Dict[str, any],
    feature_service: FeatureService = Depends(),
    model_service: ModelService = Depends()
) -> Dict[str, any]:
    """
    Get stock optimization recommendations
    """
    try:
        cache_key = cache.generate_key("stock_optimization", str(data))
        if cached_result := cache.get(cache_key):
            logger.info("Returning cached optimization result")
            return cached_result

        with PREDICTION_DURATION.labels(model_type="optimization").time():
            features = await feature_service.prepare_features(data)
            optimization = await model_service.optimize_stock(features)
            
            cache.set(
                cache_key,
                optimization,
                ttl=settings.PREDICTION_CACHE_TTL
            )
            
            PREDICTIONS_COUNTER.labels(model_type="optimization").inc()
            return optimization
    except Exception as e:
        logger.error(f"Error optimizing stock: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 