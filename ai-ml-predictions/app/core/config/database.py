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
import re

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

def split_sql_statements(sql):
    """Split SQL statements while preserving function definitions and DO blocks."""
    # First, temporarily replace semicolons inside dollar-quoted strings and DO blocks
    temp_sql = sql
    
    # Handle dollar-quoted strings
    dollar_quoted = re.finditer(r'\$\$.*?\$\$', sql, re.DOTALL)
    for match in dollar_quoted:
        quoted_text = match.group()
        modified_text = quoted_text.replace(';', '###SEMICOLON###')
        temp_sql = temp_sql.replace(quoted_text, modified_text)
    
    # Handle DO blocks
    do_blocks = re.finditer(r'DO \$\$.*?END \$\$', temp_sql, re.DOTALL)
    for match in do_blocks:
        block_text = match.group()
        modified_text = block_text.replace(';', '###SEMICOLON###')
        temp_sql = temp_sql.replace(block_text, modified_text)
    
    # Split on semicolons
    statements = []
    for stmt in temp_sql.split(';'):
        stmt = stmt.strip()
        if stmt:
            # Restore semicolons
            stmt = stmt.replace('###SEMICOLON###', ';')
            statements.append(stmt)
    
    return statements

async def run_migrations():
    """Run all database migrations."""
    try:
        logger.info("Running database migrations...")
        
        # Create enum types first
        if not create_enum_types():
            logger.error("Failed to create enum types")
            return False

        # Run initial schema creation
        with predictions_sync_engine.begin() as conn:
            # Read and execute create_tables.sql
            with open('app/migrations/create_tables.sql', 'r') as f:
                sql_content = f.read()
                statements = split_sql_statements(sql_content)
                
                for stmt in statements:
                    if stmt.strip():
                        try:
                            conn.execute(text(stmt))
                        except Exception as e:
                            logger.error(f"Error executing statement: {stmt}")
                            logger.error(f"Error details: {str(e)}")
                            raise
            
            # Read and execute add_item_id_column.sql
            with open('app/migrations/add_item_id_column.sql', 'r') as f:
                sql_content = f.read()
                statements = split_sql_statements(sql_content)
                
                for stmt in statements:
                    if stmt.strip():
                        try:
                            conn.execute(text(stmt))
                        except Exception as e:
                            logger.error(f"Error executing statement: {stmt}")
                            logger.error(f"Error details: {str(e)}")
                            raise
            
            conn.commit()
            
        logger.info("Database migrations completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error running migrations: {str(e)}")
        return False

async def init_db():
    """Initialize the database."""
    try:
        # Run migrations
        if not await run_migrations():
            raise Exception("Failed to run database migrations")
            
        # Create session factories
        global PredictionsAsyncSession, LogisticsAsyncSession
        
        PredictionsAsyncSession = async_sessionmaker(
            predictions_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        LogisticsAsyncSession = async_sessionmaker(
            logistics_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
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