from typing import List, Optional, Dict
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI/ML Predictions Service"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    RELOAD: bool = True

    # Database Settings
    PREDICTIONS_DB_HOST: str = os.getenv("PREDICTIONS_DB_HOST", "localhost")
    PREDICTIONS_DB_PORT: int = int(os.getenv("PREDICTIONS_DB_PORT", "5432"))
    PREDICTIONS_DB_USER: str = os.getenv("PREDICTIONS_DB_USER", "postgres")
    PREDICTIONS_DB_PASS: str = os.getenv("PREDICTIONS_DB_PASS", "postgres")
    PREDICTIONS_DB_NAME: str = os.getenv("PREDICTIONS_DB_NAME", "predictions")
    PREDICTIONS_DB_URI: str = os.getenv("PREDICTIONS_DB_URI", "postgresql://postgres:postgres@localhost:5432/predictions")

    LOGISTICS_DB_HOST: str = os.getenv("LOGISTICS_DB_HOST", "localhost")
    LOGISTICS_DB_PORT: int = int(os.getenv("LOGISTICS_DB_PORT", "5432"))
    LOGISTICS_DB_USER: str = os.getenv("LOGISTICS_DB_USER", "postgres")
    LOGISTICS_DB_PASS: str = os.getenv("LOGISTICS_DB_PASS", "postgres")
    LOGISTICS_DB_NAME: str = os.getenv("LOGISTICS_DB_NAME", "logistics")
    LOGISTICS_DB_URI: str = os.getenv("LOGISTICS_DB_URI", "postgresql://postgres:postgres@localhost:5432/logistics")

    # Database Pool Settings
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_ECHO: bool = False

    # Redis Settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 300  # 5 minutes
    CACHE_MAX_RETRIES: int = 3
    CACHE_RETRY_DELAY: int = 1  # seconds

    # Cache TTLs
    PREDICTION_CACHE_TTL: int = 3600  # 1 hour
    FEATURE_CACHE_TTL: int = 1800  # 30 minutes

    # MLflow Settings
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    MLFLOW_EXPERIMENT_NAME: str = "production"

    # Service Integration
    LOGISTICS_ENGINE_URL: str = "http://localhost:5050"
    INVENTORY_SYNC_URL: str = "http://localhost:5051"

    # Feature Store Settings
    ENABLE_FEATURE_STORE: bool = True
    FEATURE_STORE_TIMEOUT: int = 30
    FEATURE_STORE_MAX_RETRIES: int = 3
    FEATURE_STORE_RETRY_DELAY: int = 1

    # Security Settings
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: List[str] = ["*"]
    API_KEY: Optional[str] = None

    # Model Settings
    MODEL_PATH: str = "/app/models"
    MODEL_VERSION: str = "v1"
    DEFAULT_MODEL_VERSION: str = "latest"
    MODEL_CONFIDENCE_THRESHOLD: float = 0.8
    BATCH_SIZE: int = 32

    # Monitoring Settings
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]

    # Model Registry
    MODEL_REGISTRY_PATH: str = "/app/models"
    MODEL_REGISTRY_CACHE_TTL: int = 3600

    # Job Scheduler
    SCHEDULER_TIMEZONE: str = "UTC"
    PREDICTION_JOB_INTERVAL: int = 3600

    @property
    def database_urls(self) -> Dict[str, str]:
        """Get database URLs."""
        predictions_url = f"postgresql://{self.PREDICTIONS_DB_USER}:{self.PREDICTIONS_DB_PASS}@{self.PREDICTIONS_DB_HOST}:{self.PREDICTIONS_DB_PORT}/{self.PREDICTIONS_DB_NAME}"
        logistics_url = f"postgresql://{self.LOGISTICS_DB_USER}:{self.LOGISTICS_DB_PASS}@{self.LOGISTICS_DB_HOST}:{self.LOGISTICS_DB_PORT}/{self.LOGISTICS_DB_NAME}"
        
        return {
            "predictions": predictions_url,
            "logistics": logistics_url
        }

    @property
    def redis_url(self) -> str:
        """Get Redis URL."""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings() 