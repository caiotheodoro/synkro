import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock
from app.services.prediction_service import PredictionService
from app.services.feature_store.logistics_store import LogisticsFeatureStore
from app.services.model_registry.registry import ModelRegistry
from app.services.cache.redis_cache import RedisCache
from app.core.exceptions import ModelNotFoundError, PredictionError
from app.models.prediction import PredictionCreate, PredictionUpdate
from app.schemas.prediction_schema import PredictionRequest, PredictionResponse, BatchPredictionRequest

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
        "inventory_levels": [100, 90, 80],
        "transaction_patterns": [10, 15, 12],
        "order_demand": [8, 12, 10],
        "reservation_patterns": [5, 8, 6]
    }
    return store

@pytest.fixture
def mock_cache():
    cache = AsyncMock(spec=RedisCache)
    cache.get.return_value = None
    return cache

@pytest.fixture
async def prediction_service(mock_model_registry, mock_feature_store, mock_cache, test_db):
    return PredictionService(
        db=test_db,
        model_registry=mock_model_registry,
        feature_store=mock_feature_store,
        cache=mock_cache
    )

@pytest.mark.asyncio
async def test_create_prediction_basic(prediction_service):
    item_id = "test-item-1"
    model_name = "demand_forecast_v1"
    
    prediction = await prediction_service.create_prediction(item_id, model_name)
    
    assert prediction is not None
    assert prediction.item_id == item_id
    assert prediction.model_name == model_name
    assert prediction.predicted_demand == 150.0
    assert prediction.confidence_score == 0.85
    assert isinstance(prediction.timestamp, datetime)
    assert prediction.features_used is not None

@pytest.mark.asyncio
async def test_create_prediction_missing_features(prediction_service, mock_feature_store):
    mock_feature_store.get_features.return_value = {
        "inventory_levels": [],
        "transaction_patterns": [],
        "order_demand": [],
        "reservation_patterns": []
    }
    
    with pytest.raises(ValueError, match="No features available"):
        await prediction_service.create_prediction("test-item-1", "demand_forecast_v1")

@pytest.mark.asyncio
async def test_create_prediction_invalid_model(prediction_service, mock_model_registry):
    mock_model_registry.get_model.return_value = None
    
    with pytest.raises(ValueError, match="Model not found"):
        await prediction_service.create_prediction("test-item-1", "invalid_model")

@pytest.mark.asyncio
async def test_create_prediction_custom_days(prediction_service):
    prediction = await prediction_service.create_prediction("test-item-1", "demand_forecast_v1", days=90)
    
    assert prediction is not None
    prediction_service.feature_store.get_features.assert_called_once_with("test-item-1", days=90)

@pytest.mark.asyncio
async def test_create_prediction_cached(prediction_service, mock_cache):
    cached_prediction = {
        "id": "123",
        "item_id": "test-item-1",
        "model_name": "demand_forecast_v1",
        "predicted_demand": 140.0,
        "confidence_score": 0.82,
        "timestamp": datetime.utcnow(),
        "features_used": {"inventory_levels": [100, 90, 80]}
    }
    mock_cache.get.return_value = cached_prediction
    
    prediction = await prediction_service.create_prediction("test-item-1", "demand_forecast_v1")
    
    assert prediction is not None
    assert prediction.predicted_demand == cached_prediction["predicted_demand"]
    prediction_service.feature_store.get_features.assert_not_called()
    prediction_service.model_registry.get_model.assert_not_called()

@pytest.mark.asyncio
async def test_create_batch_predictions(prediction_service):
    item_ids = ["test-item-1", "test-item-2"]
    model_name = "demand_forecast_v1"
    
    predictions = await prediction_service.create_batch_predictions(item_ids, model_name)
    
    assert predictions is not None
    assert len(predictions) == 2
    assert all(p.model_name == model_name for p in predictions)
    assert all(p.predicted_demand == 150.0 for p in predictions)

@pytest.mark.asyncio
async def test_list_predictions(prediction_service):
    # Create some predictions first
    await prediction_service.create_prediction("test-item-1", "demand_forecast_v1")
    await prediction_service.create_prediction("test-item-2", "demand_forecast_v1")
    
    predictions = await prediction_service.list_predictions(skip=0, limit=10)
    
    assert predictions is not None
    assert predictions.total >= 2
    assert len(predictions.items) >= 2
    assert all(isinstance(p.timestamp, datetime) for p in predictions.items)

@pytest.mark.asyncio
async def test_get_prediction_by_id(prediction_service):
    # Create a prediction first
    original = await prediction_service.create_prediction("test-item-1", "demand_forecast_v1")
    
    # Retrieve it by ID
    prediction = await prediction_service.get_prediction(original.id)
    
    assert prediction is not None
    assert prediction.id == original.id
    assert prediction.item_id == original.item_id
    assert prediction.predicted_demand == original.predicted_demand

@pytest.mark.asyncio
async def test_get_predictions_by_item(prediction_service: PredictionService):
    item_id = "test_item_multiple"
    prediction_date = datetime.utcnow() + timedelta(days=7)
    
    predictions_to_create = [
        PredictionCreate(
            item_id=item_id,
            model_id="test_model",
            prediction_date=prediction_date + timedelta(days=i)
        )
        for i in range(3)
    ]
    
    for pred in predictions_to_create:
        await prediction_service.create_prediction(pred)
    
    predictions = await prediction_service.list_predictions(
        skip=0,
        limit=10,
        item_id=item_id
    )
    
    assert len(predictions) == 3
    assert all(p.item_id == item_id for p in predictions)

@pytest.mark.asyncio
async def test_get_predictions_by_model(prediction_service: PredictionService):
    model_id = "demand_forecast_v1"
    prediction_date = datetime.utcnow() + timedelta(days=7)
    
    predictions_to_create = [
        PredictionCreate(
            item_id=f"test_item_{i}",
            model_id=model_id,
            prediction_date=prediction_date
        )
        for i in range(3)
    ]
    
    for pred in predictions_to_create:
        await prediction_service.create_prediction(pred)
    
    predictions = await prediction_service.list_predictions(
        skip=0,
        limit=10,
        model_id=model_id
    )
    
    assert len(predictions) >= 3
    assert all(p.model_id == model_id for p in predictions)

@pytest.mark.asyncio
async def test_create_prediction_invalid_model(prediction_service):
    with pytest.raises(ModelNotFoundError):
        await prediction_service.create_prediction(
            item_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            model_name="nonexistent_model"
        )

@pytest.mark.asyncio
async def test_get_nonexistent_prediction(prediction_service):
    retrieved = await prediction_service.get_prediction("nonexistent-id")
    assert retrieved is None

@pytest.mark.asyncio
async def test_batch_predict(prediction_service, sample_data):
    item_ids = [
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"  # Using same ID for test
    ]

    predictions = await prediction_service.batch_predict(
        item_ids=item_ids,
        model_name="test_model"
    )

    assert predictions is not None
    assert len(predictions) == 2
    for prediction in predictions:
        assert prediction["model_name"] == "test_model"
        assert prediction["predicted_demand"] == 150.0
        assert prediction["confidence_score"] == 0.85

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