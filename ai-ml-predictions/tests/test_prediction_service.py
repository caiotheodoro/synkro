import pytest
from datetime import datetime
from unittest.mock import Mock, AsyncMock
from app.services.prediction_service import PredictionService
from app.services.feature_store.logistics_store import LogisticsFeatureStore
from app.services.model_registry.registry import ModelRegistry
from app.services.cache.redis_cache import RedisCache

@pytest.fixture
def mock_model():
    model = Mock()
    model.predict.return_value = {
        "predicted_demand": 150.0,
        "confidence": 0.85
    }
    return model

@pytest.fixture
def mock_model_registry(mock_model):
    registry = Mock(spec=ModelRegistry)
    registry.get_model.return_value = mock_model
    registry.get_all_models.return_value = ["demand_forecast_v1", "demand_forecast_v2"]
    return registry

@pytest.fixture
def mock_feature_store():
    store = AsyncMock(spec=LogisticsFeatureStore)
    store.get_features.return_value = {
        "inventory_levels": [100.0, 90.0],
        "reserved_levels": [20.0, 15.0],
        "available_levels": [80.0, 75.0],
        "transaction_quantities": [10.0, -5.0],
        "order_quantities": [5.0],
        "active_reservations": [3.0],
        "timestamps": [1.0, 2.0]
    }
    return store

@pytest.fixture
def mock_cache():
    cache = AsyncMock(spec=RedisCache)
    cache.get.return_value = None
    return cache

@pytest.fixture
async def prediction_service(test_db, mock_model_registry, mock_feature_store, mock_cache):
    return PredictionService(
        db=test_db,
        logistics_db=test_db,  # Using same test db for simplicity
        model_registry=mock_model_registry,
        feature_store=mock_feature_store,
        cache=mock_cache
    )

@pytest.mark.asyncio
async def test_create_prediction(prediction_service):
    item_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    model_name = "demand_forecast_v1"
    
    response = await prediction_service.create_prediction(item_id, model_name)
    
    assert response.item_id == item_id
    assert response.model_name == model_name
    assert response.predicted_demand == 150.0
    assert response.confidence_score == 0.85
    assert isinstance(response.timestamp, datetime)
    
    # Verify feature store was called
    prediction_service.feature_store.get_features.assert_called_once_with(item_id)
    
    # Verify model was called with features
    model = prediction_service.model_registry.get_model(model_name)
    model.predict.assert_called_once()
    
    # Verify cache was used
    prediction_service.cache.get.assert_called_once()
    prediction_service.cache.set.assert_called_once()

@pytest.mark.asyncio
async def test_create_prediction_cached(prediction_service, mock_cache):
    item_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    model_name = "demand_forecast_v1"
    
    # Set up cache hit
    cached_prediction = {
        "id": "some-id",
        "item_id": item_id,
        "model_name": model_name,
        "predicted_demand": 160.0,
        "confidence_score": 0.9,
        "timestamp": datetime.utcnow(),
        "features_used": {"some": "features"}
    }
    mock_cache.get.return_value = cached_prediction
    
    response = await prediction_service.create_prediction(item_id, model_name)
    
    assert response.predicted_demand == 160.0
    assert response.confidence_score == 0.9
    
    # Verify feature store was not called
    prediction_service.feature_store.get_features.assert_not_called()
    
    # Verify model was not called
    model = prediction_service.model_registry.get_model(model_name)
    model.predict.assert_not_called()

@pytest.mark.asyncio
async def test_create_prediction_model_not_found(prediction_service):
    item_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    model_name = "nonexistent_model"
    
    # Set up model registry to return None
    prediction_service.model_registry.get_model.return_value = None
    
    with pytest.raises(Exception) as exc_info:
        await prediction_service.create_prediction(item_id, model_name)
    
    assert "Model nonexistent_model not found" in str(exc_info.value)

@pytest.mark.asyncio
async def test_batch_predict(prediction_service):
    item_ids = [
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    ]
    model_name = "demand_forecast_v1"
    
    responses = await prediction_service.batch_predict(item_ids, model_name)
    
    assert len(responses) == 2
    for response in responses:
        assert response.predicted_demand == 150.0
        assert response.confidence_score == 0.85
        assert isinstance(response.timestamp, datetime)
    
    # Verify feature store was called for each item
    assert prediction_service.feature_store.get_features.call_count == 2 