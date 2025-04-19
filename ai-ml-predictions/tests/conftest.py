import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config.settings import settings

# Create test database engine
test_engine = create_async_engine(
    settings.TEST_DATABASE_URL,
    echo=True,
    future=True
)

# Create test session factory
TestingSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_db_setup():
    """Set up test database tables."""
    async with test_engine.begin() as conn:
        # Create tables for predictions database
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS predictions (
                id SERIAL PRIMARY KEY,
                model_name VARCHAR(255) NOT NULL,
                item_id UUID NOT NULL,
                input_data JSONB NOT NULL,
                prediction_result JSONB NOT NULL,
                confidence_score FLOAT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        
        # Create tables for logistics database
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS warehouses (
                id UUID PRIMARY KEY,
                code VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS inventory_items (
                id UUID PRIMARY KEY,
                sku VARCHAR(100) NOT NULL,
                name VARCHAR(255) NOT NULL,
                warehouse_id UUID REFERENCES warehouses(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS inventory_levels (
                item_id UUID REFERENCES inventory_items(id),
                warehouse_id UUID REFERENCES warehouses(id),
                quantity INTEGER NOT NULL,
                reserved INTEGER NOT NULL,
                available INTEGER NOT NULL,
                last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (item_id, warehouse_id)
            )
        """))
        
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS inventory_transactions (
                id UUID PRIMARY KEY,
                item_id UUID REFERENCES inventory_items(id),
                warehouse_id UUID REFERENCES warehouses(id),
                quantity INTEGER NOT NULL,
                type VARCHAR(20) NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS orders (
                id UUID PRIMARY KEY,
                customer_id UUID NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS order_items (
                id UUID PRIMARY KEY,
                order_id UUID REFERENCES orders(id),
                product_id UUID REFERENCES inventory_items(id),
                quantity INTEGER NOT NULL
            )
        """))
        
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS inventory_reservations (
                id UUID PRIMARY KEY,
                order_id VARCHAR(255) NOT NULL,
                product_id UUID REFERENCES inventory_items(id),
                quantity INTEGER NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL
            )
        """))

@pytest.fixture
async def test_db():
    """Create a fresh database session for each test."""
    async with TestingSessionLocal() as session:
        yield session
        # Clean up after each test
        async with session.begin():
            for table in [
                "predictions",
                "inventory_reservations",
                "order_items",
                "orders",
                "inventory_transactions",
                "inventory_levels",
                "inventory_items",
                "warehouses"
            ]:
                await session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        await session.commit() 