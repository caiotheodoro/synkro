from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.prediction_service import PredictionService
from app.core.config.database import LogisticsAsyncSession, PredictionsAsyncSession
from app.core.logging.logger import logger
from typing import Dict, List
import asyncio
from sqlalchemy import text
from decimal import Decimal

async def fetch_inventory_data(db: AsyncSession, item_id: str) -> Dict[str, List[float]]:
    try:
        historical_query = text("""
            SELECT 
                CAST(quantity AS FLOAT) as quantity,
                CAST(reserved AS FLOAT) as reserved,
                CAST(available AS FLOAT) as available,
                CAST(EXTRACT(epoch FROM last_updated) AS BIGINT) as timestamp
            FROM inventory_levels
            WHERE item_id = :item_id
            ORDER BY last_updated DESC
            LIMIT 30
        """)
        
        historical_result = await db.execute(historical_query, {"item_id": item_id})
        historical_data = historical_result.fetchall()
        
        stock_levels = []
        
        for row in historical_data:
            quantity = float(row.quantity) if isinstance(row.quantity, Decimal) else row.quantity
            stock_levels.append(quantity)
        
        if not stock_levels:
            stock_levels = [0.0]
        
        return {
            "quantity": stock_levels,
            "timestamp": [row.timestamp for row in historical_data] if historical_data else [0]
        }

    except Exception as e:
        logger.error(f"Error fetching inventory data: {str(e)}")
        return {
            "quantity": [0.0],
            "timestamp": [0]
        }

async def process_item_prediction(logistics_db: AsyncSession, predictions_db: AsyncSession, item_id: str):
    try:
        service = PredictionService(predictions_db)
        data = await fetch_inventory_data(logistics_db, item_id)
        prediction = await service.create_prediction(item_id, data)
        logger.info(f"Updated prediction for item {item_id}: {prediction.predicted_demand}")
    
    except Exception as e:
        logger.error(f"Error processing prediction for item {item_id}: {str(e)}")

async def run_predictions():
    try:
        async with LogisticsAsyncSession() as logistics_db:
            # Get active items in a single query
            query = text("""
                SELECT id 
                FROM inventory_items 
                WHERE quantity > 0 
                OR updated_at >= NOW() - INTERVAL '30 days'
            """)
            
            result = await logistics_db.execute(query)
            item_ids = [str(row.id) for row in result.fetchall()]
            
            if not item_ids:
                logger.warning("No active inventory items found for prediction")
                return

            # Process predictions in batches to avoid overwhelming the database
            batch_size = 5
            async with PredictionsAsyncSession() as predictions_db:
                for i in range(0, len(item_ids), batch_size):
                    batch = item_ids[i:i + batch_size]
                    tasks = [
                        process_item_prediction(logistics_db, predictions_db, item_id)
                        for item_id in batch
                    ]
                    await asyncio.gather(*tasks)
                    # Small delay between batches to reduce database load
                    await asyncio.sleep(0.1)
    
    except Exception as e:
        logger.error(f"Error in prediction job: {str(e)}")

def setup_prediction_job():
    scheduler = AsyncIOScheduler()
    
    trigger = CronTrigger(
        minute="*/10",
        timezone="UTC"
    )
    
    scheduler.add_job(
        run_predictions,
        trigger=trigger,
        id="prediction_job",
        name="Update ML Predictions",
        replace_existing=True
    )
    
    return scheduler 