import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config.settings import Settings
from app.core.config.database import Base
from app.services.model_registry.registry import ModelRegistry
from app.services.feature_store.logistics_store import LogisticsFeatureStore
from app.services.cache.redis_cache import RedisCache
from app.services.prediction_service import PredictionService
import aioredis
import os
from unittest.mock import AsyncMock, Mock

# Override environment to test
os.environ["ENVIRONMENT"] = "test"

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def settings() -> Settings:
    return Settings(_env_file=".env.test")

@pytest.fixture(scope="session")
async def predictions_db_engine(settings: Settings):
    engine = create_async_engine(
        settings.database_urls["predictions"],
        echo=settings.DB_ECHO,
        future=True
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture(scope="session")
async def logistics_db_engine(settings: Settings):
    engine = create_async_engine(
        settings.database_urls["logistics"],
        echo=settings.DB_ECHO,
        future=True
    )
    yield engine
    await engine.dispose()

@pytest.fixture
async def predictions_db(predictions_db_engine) -> AsyncGenerator[AsyncSession, None]:
    async_session = sessionmaker(
        predictions_db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

@pytest.fixture
async def logistics_db(logistics_db_engine) -> AsyncGenerator[AsyncSession, None]:
    async_session = sessionmaker(
        logistics_db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

@pytest.fixture
async def redis(settings: Settings):
    redis = await aioredis.from_url(settings.redis_url)
    yield redis
    await redis.flushdb()
    await redis.close()

@pytest.fixture
def mock_model():
    return Mock(predict=Mock(return_value={"predicted_demand": 150.0, "confidence": 0.85}))

@pytest.fixture
def mock_model_registry(mock_model):
    registry = Mock(spec=ModelRegistry)
    registry.get_model.return_value = mock_model
    registry.get_all_models.return_value = ["test_model", "demand_forecast_v1"]
    return registry

@pytest.fixture
def mock_feature_store():
    store = Mock(spec=LogisticsFeatureStore)
    store.get_features = AsyncMock(return_value={
        "inventory_levels": [100, 90, 80],
        "demand_history": [20, 25, 30],
        "timestamps": [1000, 2000, 3000]
    })
    return store

@pytest.fixture
def mock_cache():
    cache = Mock(spec=RedisCache)
    cache.get = AsyncMock(return_value=None)
    cache.set = AsyncMock(return_value=True)
    return cache

@pytest.fixture
async def prediction_service(
    predictions_db,
    logistics_db,
    mock_model_registry,
    mock_feature_store,
    mock_cache
):
    return PredictionService(
        predictions_db=predictions_db,
        logistics_db=logistics_db,
        model_registry=mock_model_registry,
        feature_store=mock_feature_store,
        cache=mock_cache
    ) 