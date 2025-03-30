from typing import Any, Dict, Optional
from pydantic import PostgresDsn, RedisDsn, validator
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI/ML Predictions Service"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 3003
    WORKERS: int = 4
    RELOAD: bool = False

    # Database Settings
    POSTGRES_HOST: str
    POSTGRES_PORT: str  # Keep as str since env vars are always strings
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    # Logistics Database Settings
    LOGISTICS_DB_HOST: str
    LOGISTICS_DB_PORT: str
    LOGISTICS_DB_USER: str
    LOGISTICS_DB_PASSWORD: str
    LOGISTICS_DB_NAME: str
    LOGISTICS_DB_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        
        user = values.get("POSTGRES_USER")
        password = values.get("POSTGRES_PASSWORD")
        host = values.get("POSTGRES_HOST")
        port = values.get("POSTGRES_PORT")
        db = values.get("POSTGRES_DB")
        
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"

    @validator("LOGISTICS_DB_URI", pre=True)
    def assemble_logistics_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        
        user = values.get("LOGISTICS_DB_USER")
        password = values.get("LOGISTICS_DB_PASSWORD")
        host = values.get("LOGISTICS_DB_HOST")
        port = values.get("LOGISTICS_DB_PORT")
        db = values.get("LOGISTICS_DB_NAME")
        
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"

    # Redis Settings
    REDIS_HOST: str
    REDIS_PORT: int  # Change to int since RedisDsn.build expects an integer
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URI: Optional[RedisDsn] = None

    @validator("REDIS_PORT", pre=True)
    def parse_redis_port(cls, v: Any) -> int:
        try:
            return int(v)
        except (TypeError, ValueError):
            return 6379  # Default Redis port

    @validator("REDIS_URI", pre=True)
    def assemble_redis_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        
        host = values.get("REDIS_HOST")
        port = values.get("REDIS_PORT", 6379)
        password = values.get("REDIS_PASSWORD")
        
        if password:
            return f"redis://:{password}@{host}:{port}"
        return f"redis://{host}:{port}"

    # MLflow Settings
    MLFLOW_TRACKING_URI: str
    MLFLOW_EXPERIMENT_NAME: str = "production"

    # Service Integration
    LOGISTICS_ENGINE_URL: str
    INVENTORY_SYNC_URL: str

    # Security Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Cache Settings
    PREDICTION_CACHE_TTL: int = 3600  # 1 hour
    FEATURE_CACHE_TTL: int = 1800     # 30 minutes

    # Model Settings
    DEFAULT_MODEL_VERSION: str = "latest"
    MODEL_CONFIDENCE_THRESHOLD: float = 0.8
    BATCH_SIZE: int = 32

    # Monitoring Settings
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings() 