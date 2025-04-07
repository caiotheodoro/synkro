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

# Build database URLs with asyncpg driver
predictions_db_url = str(settings.PREDICTIONS_DB_URI).replace('postgresql://', 'postgresql+asyncpg://')
predictions_sync_url = str(settings.PREDICTIONS_DB_URI)

# Logistics Database URLs with asyncpg driver
logistics_db_url = str(settings.LOGISTICS_DB_URI).replace('postgresql://', 'postgresql+asyncpg://')
logistics_sync_url = str(settings.LOGISTICS_DB_URI)

# Create base class for declarative models
Base = declarative_base()

# AI/ML Predictions Database engines
predictions_async_engine = create_async_engine(
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
logistics_async_engine = create_async_engine(
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

# Session factories
PredictionsAsyncSession = async_sessionmaker(
    predictions_async_engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False
)

LogisticsAsyncSession = async_sessionmaker(
    logistics_async_engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False
)

async def get_predictions_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database dependency for the AI/ML predictions database.
    Yields an async database session and ensures it's closed after use.
    """
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
    """
    Database dependency for the logistics database.
    Yields an async database session and ensures it's closed after use.
    """
    async with LogisticsAsyncSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
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

        logger.info("Creating tables...")
        # Read the SQL migration file
        with open('app/migrations/create_tables.sql', 'r') as f:
            sql = f.read()

        # Split the SQL into individual statements and clean them up
        statements = []
        current_statement = []
        in_function = False
        in_do_block = False

        for line in sql.splitlines():
            line = line.strip()
            if not line or line.startswith('--'):  # Skip empty lines and comments
                continue

            # Check if we're entering a function definition
            if 'CREATE OR REPLACE FUNCTION' in line:
                in_function = True
            # Check if we're entering a DO block
            elif line.startswith('DO $$'):
                in_do_block = True

            current_statement.append(line)

            # If we're in a function definition, wait for the LANGUAGE statement
            if in_function and 'LANGUAGE plpgsql;' in line:
                statements.append('\n'.join(current_statement))
                current_statement = []
                in_function = False
            # If we're in a DO block, wait for the END $$ statement
            elif in_do_block and line.startswith('END $$'):
                statements.append('\n'.join(current_statement))
                current_statement = []
                in_do_block = False
            # For regular statements, split on semicolon
            elif not in_function and not in_do_block and line.endswith(';'):
                statements.append('\n'.join(current_statement))
                current_statement = []

        # Add any remaining statement
        if current_statement:
            statements.append('\n'.join(current_statement))

        # Execute each statement separately
        async with predictions_async_engine.begin() as conn:
            for stmt in statements:
                if stmt:  # Skip empty statements
                    try:
                        await conn.execute(text(stmt))
                        logger.info(f"Successfully executed: {stmt[:50]}...")  # Log first 50 chars
                    except Exception as e:
                        logger.error(f"Error executing statement: {stmt}")
                        logger.error(f"Error details: {str(e)}")
                        raise

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

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database session."""
    async with PredictionsAsyncSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def cleanup_db():
    """Cleanup database connections."""
    await predictions_async_engine.dispose()
    await logistics_async_engine.dispose() 