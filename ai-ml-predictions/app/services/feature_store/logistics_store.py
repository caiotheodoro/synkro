from datetime import datetime, timedelta
from typing import Dict, List, Optional, Annotated
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config.database import get_logistics_db
from fastapi import Depends
import numpy as np

class LogisticsFeatureStore:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_features(self, item_id: str, days: int = 180) -> Dict[str, List[float]]:
        """
        Fetch and format features for prediction from the logistics database.
        
        Features include:
        - Historical inventory levels
        - Transaction patterns
        - Order demand patterns
        - Reservation patterns
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get inventory levels history
        inventory_query = """
            SELECT quantity, reserved, available, last_updated
            FROM inventory_levels
            WHERE item_id = :item_id
            AND last_updated >= :cutoff_date
            ORDER BY last_updated ASC
        """
        
        inventory_result = await self.db.execute(
            text(inventory_query),
            {"item_id": item_id, "cutoff_date": cutoff_date}
        )
        inventory_data = inventory_result.fetchall()

        # Get transaction history
        transaction_query = """
            SELECT quantity, type, timestamp
            FROM inventory_transactions
            WHERE item_id = :item_id
            AND timestamp >= :cutoff_date
            ORDER BY timestamp ASC
        """
        
        transaction_result = await self.db.execute(
            text(transaction_query),
            {"item_id": item_id, "cutoff_date": cutoff_date}
        )
        transaction_data = transaction_result.fetchall()

        # Get order demand history
        order_query = """
            SELECT oi.quantity, o.created_at
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = :item_id
            AND o.created_at >= :cutoff_date
            AND o.status != 'cancelled'
            ORDER BY o.created_at ASC
        """
        
        order_result = await self.db.execute(
            text(order_query),
            {"item_id": item_id, "cutoff_date": cutoff_date}
        )
        order_data = order_result.fetchall()

        # Get active reservations
        reservation_query = """
            SELECT quantity, created_at
            FROM inventory_reservations
            WHERE product_id = :item_id
            AND status = 'active'
            AND created_at >= :cutoff_date
            ORDER BY created_at ASC
        """
        
        reservation_result = await self.db.execute(
            text(reservation_query),
            {"item_id": item_id, "cutoff_date": cutoff_date}
        )
        reservation_data = reservation_result.fetchall()

        # Format features
        features = {
            "inventory_levels": [float(row.quantity) for row in inventory_data],
            "reserved_levels": [float(row.reserved) for row in inventory_data],
            "available_levels": [float(row.available) for row in inventory_data],
            "transaction_quantities": [float(row.quantity) for row in transaction_data],
            "order_quantities": [float(row.quantity) for row in order_data],
            "active_reservations": [float(row.quantity) for row in reservation_data],
            "timestamps": [(row.last_updated - cutoff_date).total_seconds() / 86400 for row in inventory_data]  # Convert to days
        }

        # If no data found, provide default values
        if not features["inventory_levels"]:
            features = {
                "inventory_levels": [0.0],
                "reserved_levels": [0.0],
                "available_levels": [0.0],
                "transaction_quantities": [0.0],
                "order_quantities": [0.0],
                "active_reservations": [0.0],
                "timestamps": [0.0]
            }

        return features

def get_logistics_feature_store(
    db: Annotated[AsyncSession, Depends(get_logistics_db)]
) -> LogisticsFeatureStore:
    """Get an instance of the logistics feature store."""
    return LogisticsFeatureStore(db) 