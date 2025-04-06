from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
from sqlalchemy import create_engine, text
from app.models.database_model import Base, PredictionType, PredictionStatus
from app.core.config.settings import settings
from app.core.logging.logger import logger
import os
import asyncio

# Build database URLs
predictions_db_url = str(settings.PREDICTIONS_DB_URI).replace('postgresql://', 'postgresql+asyncpg://')
predictions_sync_url = str(settings.PREDICTIONS_DB_URI)

# Logistics Database URLs
logistics_db_url = str(settings.LOGISTICS_DB_URI).replace('postgresql://', 'postgresql+asyncpg://')
logistics_sync_url = str(settings.LOGISTICS_DB_URI)

# AI/ML Predictions Database engines
predictions_async_engine = create_async_engine(
    predictions_db_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW
)

predictions_sync_engine = create_engine(
    predictions_sync_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW
)

# Logistics Database engines
logistics_async_engine = create_async_engine(
    logistics_db_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW
)

logistics_sync_engine = create_engine(
    logistics_sync_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW
)

# Session factories
PredictionsAsyncSession = async_sessionmaker(
    predictions_async_engine,
    expire_on_commit=False,
    class_=AsyncSession
)

LogisticsAsyncSession = async_sessionmaker(
    logistics_async_engine,
    expire_on_commit=False,
    class_=AsyncSession
)

async def get_predictions_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database dependency for the AI/ML predictions database.
    Yields an async database session and ensures it's closed after use.
    """
    async with PredictionsAsyncSession() as session:
        try:
            yield session
        finally:
            await session.close()

async def get_logistics_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database dependency for the logistics database.
    Yields an async database session and ensures it's closed after use.
    """
    async with LogisticsAsyncSession() as session:
        try:
            yield session
        finally:
            await session.close()

async def verify_database_connection() -> bool:
    """Verify database connection is working."""
    try:
        async with PredictionsAsyncSession() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database connection verification failed: {str(e)}")
        return False

def create_enum_types():
    """Create enum types in the database."""
    try:
        with predictions_sync_engine.begin() as conn:
            # Enable UUID extension
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
            
            # Create prediction_type enum
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE prediction_type AS ENUM ('demand', 'stockout', 'optimization');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            
            # Create prediction_status enum
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE prediction_status AS ENUM ('pending', 'completed', 'failed');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            
        logger.info("Successfully created enum types")
        return True
    except Exception as e:
        logger.error(f"Error creating enum types: {str(e)}")
        return False

async def init_db():
    """Initialize the database by creating all tables."""
    try:
        logger.info("Verifying database connection...")
        if not await verify_database_connection():
            raise Exception("Could not establish database connection")

        logger.info("Creating enum types...")
        if not create_enum_types():
            raise Exception("Failed to create enum types")

        logger.info("Creating tables...")
        # Create all tables using SQLAlchemy metadata
        Base.metadata.create_all(predictions_sync_engine)
        logger.info("Tables created successfully")

        # Verify tables were created
        async with PredictionsAsyncSession() as session:
            tables = ['predictions', 'prediction_metrics', 'data_change_tracker']
            for table in tables:
                result = await session.execute(
                    text(f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table}')")
                )
                exists = result.scalar()
                if not exists:
                    raise Exception(f"Table {table} was not created successfully")
                logger.info(f"Verified table {table} exists")

        logger.info("Database initialization completed successfully")

    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        raise 