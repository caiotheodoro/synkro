from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
from sqlalchemy import create_engine, text
from app.models.database_model import Base, PredictionType, PredictionStatus
from app.core.config.settings import settings
from app.core.logging.logger import logger
import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from contextlib import asynccontextmanager

# Create base class for declarative models
Base = declarative_base()

# Build database URLs with asyncpg driver
predictions_db_url = settings.PREDICTIONS_DB_URI.replace('postgresql://', 'postgresql+asyncpg://')
predictions_sync_url = settings.PREDICTIONS_DB_URI

# Logistics Database URLs with asyncpg driver
logistics_db_url = settings.LOGISTICS_DB_URI.replace('postgresql://', 'postgresql+asyncpg://')
logistics_sync_url = settings.LOGISTICS_DB_URI

# Create engines for both databases
predictions_engine = create_async_engine(
    predictions_db_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT
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
logistics_engine = create_async_engine(
    logistics_db_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT
)

logistics_sync_engine = create_engine(
    logistics_sync_url,
    echo=settings.DB_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW
)

# Create session factories
PredictionsAsyncSession = async_sessionmaker(
    predictions_engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False
)

LogisticsAsyncSession = async_sessionmaker(
    logistics_engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False
)

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
            logger.warning("Database connection failed, attempting to create database...")
            from scripts.init_db import init_postgres_db
            if not init_postgres_db():
                raise Exception("Could not create database")
            if not await verify_database_connection():
                raise Exception("Could not establish database connection after creation")

        logger.info("Creating tables...")
        # Create enum types first
        create_enum_types()

        # Read the SQL migration file
        with open('app/migrations/create_tables.sql', 'r') as f:
            sql = f.read()

        # Split the SQL into individual statements
        statements = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]

        # Execute each statement
        async with predictions_engine.begin() as conn:
            for stmt in statements:
                try:
                    await conn.execute(text(stmt))
                except Exception as e:
                    logger.error(f"Error executing statement: {stmt}")
                    logger.error(f"Error details: {str(e)}")
                    raise

        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        raise

async def cleanup_db():
    """Cleanup database connections."""
    await predictions_engine.dispose()
    await logistics_engine.dispose()

# FastAPI dependency functions
async def get_predictions_db() -> AsyncGenerator[AsyncSession, None]:
    """Database dependency for the predictions database."""
    async with PredictionsAsyncSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def get_logistics_db() -> AsyncGenerator[AsyncSession, None]:
    """Database dependency for the logistics database."""
    async with LogisticsAsyncSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Context managers for manual session management
@asynccontextmanager
async def get_db_context():
    """Get a database session for the predictions database."""
    async with PredictionsAsyncSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

@asynccontextmanager
async def get_logistics_db_context():
    """Get a database session for the logistics database."""
    async with LogisticsAsyncSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close() 