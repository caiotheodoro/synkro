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
)

# Logistics Database engines
logistics_async_engine = create_async_engine(
    logistics_db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    poolclass=AsyncAdaptedQueuePool,
)

logistics_sync_engine = create_engine(
    logistics_sync_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
)

# Session factories
PredictionsAsyncSession = async_sessionmaker(
    predictions_async_engine,
    expire_on_commit=False,
    class_=AsyncSession
)

LogisticsAsyncSession = async_sessionmaker(
    create_async_engine(
        logistics_db_url,
        echo=settings.DEBUG,
        future=True,
        pool_pre_ping=True,
        poolclass=AsyncAdaptedQueuePool,
    ),
    expire_on_commit=False,
    class_=AsyncSession
)

Base = declarative_base()

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

async def verify_database_connection():
    """Verify database connection by executing a simple query."""
    try:
        async with PredictionsAsyncSession() as session:
            await session.execute(text("SELECT 1"))
            await session.commit()
            logger.info("Successfully connected to the predictions database")
            return True
    except Exception as e:
        logger.error(f"Failed to connect to the predictions database: {str(e)}")
        return False

async def init_db():
    """Initialize the database by creating all tables."""
    try:
        logger.info("Verifying database connection...")
        if not await verify_database_connection():
            raise Exception("Could not establish database connection")

        logger.info("Creating database tables...")
        # Drop all tables first to ensure clean state
        Base.metadata.drop_all(bind=predictions_sync_engine)
        logger.info("Dropped existing tables")
        
        # Create all tables
        Base.metadata.create_all(bind=predictions_sync_engine)
        logger.info("Database tables created successfully")

        # Verify tables were created
        async with PredictionsAsyncSession() as session:
            for table in Base.metadata.sorted_tables:
                result = await session.execute(text(f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table.name}')"))
                exists = result.scalar()
                if not exists:
                    raise Exception(f"Table {table.name} was not created successfully")
                logger.info(f"Verified table {table.name} exists")

    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        raise 