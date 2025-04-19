import pytest
from datetime import datetime, timedelta
from sqlalchemy import text
from app.services.feature_store.logistics_store import LogisticsFeatureStore

@pytest.fixture
async def feature_store(test_db):
    return LogisticsFeatureStore(test_db)

@pytest.fixture
async def sample_data(test_db):
    # Insert test data
    item_id = "test-item-1"
    warehouse_id = "warehouse-1"
    now = datetime.utcnow()
    
    # Insert inventory levels
    await test_db.execute(
        text("""
            INSERT INTO inventory_levels 
            (item_id, warehouse_id, quantity, reserved, available, last_updated)
            VALUES 
            (:item_id, :warehouse_id, 100, 20, 80, :timestamp1),
            (:item_id, :warehouse_id, 90, 15, 75, :timestamp2),
            (:item_id, :warehouse_id, 80, 10, 70, :timestamp3)
        """),
        {
            "item_id": item_id,
            "warehouse_id": warehouse_id,
            "timestamp1": now - timedelta(days=2),
            "timestamp2": now - timedelta(days=1),
            "timestamp3": now
        }
    )
    
    # Insert transactions
    await test_db.execute(
        text("""
            INSERT INTO transactions 
            (item_id, warehouse_id, quantity, type, status, created_at)
            VALUES 
            (:item_id, :warehouse_id, 10, 'INBOUND', 'COMPLETED', :timestamp1),
            (:item_id, :warehouse_id, 15, 'OUTBOUND', 'COMPLETED', :timestamp2),
            (:item_id, :warehouse_id, 12, 'INBOUND', 'COMPLETED', :timestamp3)
        """),
        {
            "item_id": item_id,
            "warehouse_id": warehouse_id,
            "timestamp1": now - timedelta(days=2),
            "timestamp2": now - timedelta(days=1),
            "timestamp3": now
        }
    )
    
    # Insert orders
    await test_db.execute(
        text("""
            INSERT INTO orders 
            (item_id, warehouse_id, quantity, status, created_at)
            VALUES 
            (:item_id, :warehouse_id, 8, 'COMPLETED', :timestamp1),
            (:item_id, :warehouse_id, 12, 'COMPLETED', :timestamp2),
            (:item_id, :warehouse_id, 10, 'COMPLETED', :timestamp3)
        """),
        {
            "item_id": item_id,
            "warehouse_id": warehouse_id,
            "timestamp1": now - timedelta(days=2),
            "timestamp2": now - timedelta(days=1),
            "timestamp3": now
        }
    )
    
    # Insert reservations
    await test_db.execute(
        text("""
            INSERT INTO reservations 
            (item_id, warehouse_id, quantity, status, created_at)
            VALUES 
            (:item_id, :warehouse_id, 5, 'ACTIVE', :timestamp1),
            (:item_id, :warehouse_id, 8, 'ACTIVE', :timestamp2),
            (:item_id, :warehouse_id, 6, 'ACTIVE', :timestamp3)
        """),
        {
            "item_id": item_id,
            "warehouse_id": warehouse_id,
            "timestamp1": now - timedelta(days=2),
            "timestamp2": now - timedelta(days=1),
            "timestamp3": now
        }
    )
    
    await test_db.commit()
    return {"item_id": item_id, "warehouse_id": warehouse_id, "timestamp": now}

@pytest.mark.asyncio
async def test_get_features_basic(feature_store, sample_data):
    features = await feature_store.get_features(sample_data["item_id"])
    
    assert features is not None
    assert "inventory_levels" in features
    assert "transaction_patterns" in features
    assert "order_demand" in features
    assert "reservation_patterns" in features
    
    assert len(features["inventory_levels"]) == 3
    assert len(features["transaction_patterns"]) == 3
    assert len(features["order_demand"]) == 3
    assert len(features["reservation_patterns"]) == 3

@pytest.mark.asyncio
async def test_get_features_nonexistent_item(feature_store):
    features = await feature_store.get_features("nonexistent-item")
    
    assert features is not None
    assert len(features["inventory_levels"]) == 0
    assert len(features["transaction_patterns"]) == 0
    assert len(features["order_demand"]) == 0
    assert len(features["reservation_patterns"]) == 0

@pytest.mark.asyncio
async def test_get_features_custom_days(feature_store, sample_data):
    features = await feature_store.get_features(sample_data["item_id"], days=1)
    
    assert features is not None
    assert len(features["inventory_levels"]) == 1
    assert len(features["transaction_patterns"]) == 1
    assert len(features["order_demand"]) == 1
    assert len(features["reservation_patterns"]) == 1

@pytest.mark.asyncio
async def test_get_features_multiple_warehouses(feature_store, test_db, sample_data):
    # Add data for a second warehouse
    warehouse_id_2 = "warehouse-2"
    now = datetime.utcnow()
    
    await test_db.execute(
        text("""
            INSERT INTO inventory_levels 
            (item_id, warehouse_id, quantity, reserved, available, last_updated)
            VALUES 
            (:item_id, :warehouse_id, 150, 30, 120, :timestamp)
        """),
        {
            "item_id": sample_data["item_id"],
            "warehouse_id": warehouse_id_2,
            "timestamp": now
        }
    )
    await test_db.commit()
    
    features = await feature_store.get_features(sample_data["item_id"])
    
    assert features is not None
    assert len(features["inventory_levels"]) == 4  # 3 from original warehouse + 1 from new warehouse

@pytest.mark.asyncio
async def test_get_features_date_boundaries(feature_store, test_db, sample_data):
    # Add data from 200 days ago
    old_timestamp = datetime.utcnow() - timedelta(days=200)
    
    await test_db.execute(
        text("""
            INSERT INTO inventory_levels 
            (item_id, warehouse_id, quantity, reserved, available, last_updated)
            VALUES 
            (:item_id, :warehouse_id, 200, 40, 160, :timestamp)
        """),
        {
            "item_id": sample_data["item_id"],
            "warehouse_id": sample_data["warehouse_id"],
            "timestamp": old_timestamp
        }
    )
    await test_db.commit()
    
    # Get features with default 180 days
    features = await feature_store.get_features(sample_data["item_id"])
    
    assert features is not None
    assert len(features["inventory_levels"]) == 3  # Should not include the 200-day old record