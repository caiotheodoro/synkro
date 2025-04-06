from typing import Any, Dict, Optional
from pydantic import PostgresDsn, RedisDsn, validator
from pydantic_settings import BaseSettings
import os
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI/ML Predictions Service"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 3004
    WORKERS: int = 4
    RELOAD: bool = True

    # Database Settings
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5434
    POSTGRES_USER: str = "logistics"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "ai_ml_predictions"

    # Logistics Database Settings
    LOGISTICS_DB_HOST: str = "localhost"
    LOGISTICS_DB_PORT: int = 5433
    LOGISTICS_DB_USER: str = "logistics"
    LOGISTICS_DB_PASSWORD: str = "logistics_password"
    LOGISTICS_DB_NAME: str = "logistics_engine"

    # Database Pool Settings
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None

    # MLflow Settings
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    MLFLOW_EXPERIMENT_NAME: str = "production"

    # Service Integration
    LOGISTICS_ENGINE_URL: str = "http://localhost:5050"
    INVENTORY_SYNC_URL: str = "http://localhost:5051"

    # Security Settings
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Cache Settings
    PREDICTION_CACHE_TTL: int = 3600
    FEATURE_CACHE_TTL: int = 1800

    # Model Settings
    DEFAULT_MODEL_VERSION: str = "latest"
    MODEL_CONFIDENCE_THRESHOLD: float = 0.8
    BATCH_SIZE: int = 32
    MODEL_PATH: str = "app/ml/models"
    DEFAULT_MODEL: str = "default_model.pkl"

    # Monitoring Settings
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # API Settings
    APP_NAME: str = "AI/ML Predictions Service"
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list = ["*"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list = ["*"]
    CORS_HEADERS: list = ["*"]
    API_KEY: Optional[str] = None

    @property
    def LOGISTICS_DB_URI(self) -> str:
        return f"postgresql://{self.LOGISTICS_DB_USER}:{self.LOGISTICS_DB_PASSWORD}@{self.LOGISTICS_DB_HOST}:{self.LOGISTICS_DB_PORT}/{self.LOGISTICS_DB_NAME}"

    @property
    def PREDICTIONS_DB_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings() 