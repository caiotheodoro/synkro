from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
from sqlalchemy import create_engine, text
from app.models.database_model import Base
from app.core.config.settings import settings
from app.core.logging.logger import logger

# AI/ML Predictions Database
predictions_db_url = str(settings.SQLALCHEMY_DATABASE_URI).replace('postgresql://', 'postgresql+asyncpg://')
predictions_sync_url = str(settings.SQLALCHEMY_DATABASE_URI)

# Logistics Database
logistics_db_url = str(settings.LOGISTICS_DB_URI).replace('postgresql://', 'postgresql+asyncpg://')
logistics_sync_url = str(settings.LOGISTICS_DB_URI)

# AI/ML Predictions Database engines
predictions_async_engine = create_async_engine(
    predictions_db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    poolclass=AsyncAdaptedQueuePool,
)

predictions_sync_engine = create_engine(
    predictions_sync_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
)

# Session factories
PredictionsAsyncSession = async_sessionmaker(
    predictions_async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_predictions_db() -> AsyncGenerator[AsyncSession, None]:
    async with PredictionsAsyncSession() as session:
        yield session

async def init_db() -> None:
    try:
        # Create database tables
        async with predictions_async_engine.begin() as conn:
            # Create UUID extension if it doesn't exist
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
            
            # Drop existing enum types if they exist
            await conn.execute(text("""
                DROP TYPE IF EXISTS prediction_type CASCADE;
                DROP TYPE IF EXISTS prediction_status CASCADE;
            """))
            
            # Create enum types
            await conn.execute(text("""
                CREATE TYPE prediction_type AS ENUM ('demand', 'stockout', 'optimization');
                CREATE TYPE prediction_status AS ENUM ('pending', 'completed', 'failed');
            """))
            
            # Drop existing tables
            logger.info("Dropping existing tables")
            await conn.run_sync(Base.metadata.drop_all)
            
            # Create tables
            logger.info("Creating database tables")
            await conn.run_sync(Base.metadata.create_all)
            
            # Create triggers for last_updated
            await conn.execute(text("""
                CREATE OR REPLACE FUNCTION update_last_updated_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.last_updated = NOW();
                    RETURN NEW;
                END;
                $$ language 'plpgsql';

                DROP TRIGGER IF EXISTS update_predictions_last_updated ON predictions;
                CREATE TRIGGER update_predictions_last_updated
                    BEFORE UPDATE ON predictions
                    FOR EACH ROW
                    EXECUTE FUNCTION update_last_updated_column();

                DROP TRIGGER IF EXISTS update_data_change_tracker_last_updated ON data_change_tracker;
                CREATE TRIGGER update_data_change_tracker_last_updated
                    BEFORE UPDATE ON data_change_tracker
                    FOR EACH ROW
                    EXECUTE FUNCTION update_last_updated_column();
            """))
            
            # Create indexes
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_predictions_item_id ON predictions(item_id);
                CREATE INDEX IF NOT EXISTS idx_predictions_warehouse_id ON predictions(warehouse_id);
                CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp);
                CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
                CREATE INDEX IF NOT EXISTS idx_prediction_metrics_prediction_id ON prediction_metrics(prediction_id);
                CREATE INDEX IF NOT EXISTS idx_data_change_tracker_last_prediction_id ON data_change_tracker(last_prediction_id);
            """))
            
            logger.info("Database tables created successfully")
            
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise 