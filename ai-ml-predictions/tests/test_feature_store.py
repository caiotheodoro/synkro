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
    item_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    now = datetime.utcnow()
    
    # Insert inventory levels
    await test_db.execute(
        text("""
            INSERT INTO inventory_levels (item_id, warehouse_id, quantity, reserved, available, last_updated)
            VALUES 
                (:item_id, '11111111-1111-1111-1111-111111111111', 100, 20, 80, :timestamp1),
                (:item_id, '11111111-1111-1111-1111-111111111111', 90, 15, 75, :timestamp2)
        """),
        {
            "item_id": item_id,
            "timestamp1": now - timedelta(days=1),
            "timestamp2": now - timedelta(days=2)
        }
    )
    
    # Insert transactions
    await test_db.execute(
        text("""
            INSERT INTO inventory_transactions (id, item_id, warehouse_id, quantity, type, timestamp)
            VALUES 
                (gen_random_uuid(), :item_id, '11111111-1111-1111-1111-111111111111', 10, 'RECEIVING', :timestamp1),
                (gen_random_uuid(), :item_id, '11111111-1111-1111-1111-111111111111', -5, 'SHIPPING', :timestamp2)
        """),
        {
            "item_id": item_id,
            "timestamp1": now - timedelta(days=1),
            "timestamp2": now - timedelta(days=2)
        }
    )
    
    # Insert orders and order items
    await test_db.execute(
        text("""
            WITH new_order AS (
                INSERT INTO orders (id, customer_id, status, created_at)
                VALUES 
                    (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-ddddddddddda', 'delivered', :timestamp1)
                RETURNING id
            )
            INSERT INTO order_items (id, order_id, product_id, quantity)
            SELECT gen_random_uuid(), id, :item_id, 5
            FROM new_order
        """),
        {
            "item_id": item_id,
            "timestamp1": now - timedelta(days=1)
        }
    )
    
    # Insert reservations
    await test_db.execute(
        text("""
            INSERT INTO inventory_reservations (id, order_id, product_id, quantity, status, created_at, expires_at)
            VALUES 
                (gen_random_uuid(), 'order1', :item_id, 3, 'active', :timestamp1, :expires_at)
        """),
        {
            "item_id": item_id,
            "timestamp1": now - timedelta(days=1),
            "expires_at": now + timedelta(days=7)
        }
    )
    
    await test_db.commit()
    return item_id

@pytest.mark.asyncio
async def test_get_features_with_data(feature_store, sample_data):
    features = await feature_store.get_features(sample_data)
    
    assert "inventory_levels" in features
    assert "reserved_levels" in features
    assert "available_levels" in features
    assert "transaction_quantities" in features
    assert "order_quantities" in features
    assert "active_reservations" in features
    assert "timestamps" in features
    
    assert len(features["inventory_levels"]) == 2
    assert features["inventory_levels"][0] == 100.0
    assert features["inventory_levels"][1] == 90.0
    
    assert len(features["transaction_quantities"]) == 2
    assert 10.0 in features["transaction_quantities"]
    assert -5.0 in features["transaction_quantities"]
    
    assert len(features["order_quantities"]) == 1
    assert features["order_quantities"][0] == 5.0
    
    assert len(features["active_reservations"]) == 1
    assert features["active_reservations"][0] == 3.0

@pytest.mark.asyncio
async def test_get_features_no_data(feature_store):
    features = await feature_store.get_features("nonexistent-id")
    
    assert "inventory_levels" in features
    assert len(features["inventory_levels"]) == 1
    assert features["inventory_levels"][0] == 0.0
    
    assert all(len(features[key]) == 1 for key in features)
    assert all(features[key][0] == 0.0 for key in features if key != "timestamps") 