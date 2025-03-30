from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
from sqlalchemy import create_engine

from app.core.config.settings import settings

# Convert the URL to string and replace the driver for async operations
db_url = str(settings.SQLALCHEMY_DATABASE_URI).replace('postgresql://', 'postgresql+asyncpg://')
sync_db_url = str(settings.SQLALCHEMY_DATABASE_URI)

# Async engine for normal operations
async_engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    poolclass=AsyncAdaptedQueuePool,
)

# Sync engine for metadata operations
sync_engine = create_engine(
    sync_db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database dependency to be used in FastAPI dependency injection.
    Yields an async database session and ensures it's closed after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db() -> None:
    """
    Initialize the database tables.
    This should be called during application startup.
    """
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) 