from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.prediction_service import PredictionService
from app.core.config.database import AsyncSessionLocal
from app.core.logging.logger import logger
from typing import Dict, List
import asyncio
from sqlalchemy import text

async def fetch_inventory_data(item_id: str, db: AsyncSession) -> Dict[str, List[float]]:
    try:
        historical_query = text("""
            SELECT quantity, reserved, available, extract(epoch from last_updated) as timestamp
            FROM inventory_levels
            WHERE item_id = :item_id
            ORDER BY last_updated DESC
            LIMIT 30
        """)
        
        transaction_query = text("""
            SELECT quantity, type, extract(epoch from timestamp) as timestamp
            FROM inventory_transactions
            WHERE item_id = :item_id
            ORDER BY timestamp DESC
            LIMIT 30
        """)
        
        historical_result = await db.execute(historical_query, {"item_id": item_id})
        transaction_result = await db.execute(transaction_query, {"item_id": item_id})
        
        historical_data = historical_result.fetchall()
        transaction_data = transaction_result.fetchall()
        
        historical_demand = []
        stock_levels = []
        seasonality = []
        
        for row in historical_data:
            stock_levels.append(float(row.quantity))
            seasonality_factor = calculate_seasonality(row.timestamp)
            seasonality.append(seasonality_factor)
        
        for row in transaction_data:
            if row.type == 'remove':
                historical_demand.append(float(row.quantity))
            
        if not historical_demand:
            historical_demand = [0.0]
        if not stock_levels:
            stock_levels = [0.0]
        if not seasonality:
            seasonality = [1.0]
        
        return {
            "historical_demand": historical_demand,
            "stock_levels": stock_levels,
            "seasonality": seasonality
        }
    
    except Exception as e:
        logger.error(f"Error fetching inventory data: {str(e)}")
        return {
            "historical_demand": [0.0],
            "stock_levels": [0.0],
            "seasonality": [1.0]
        }

def calculate_seasonality(timestamp: float) -> float:
    from datetime import datetime
    dt = datetime.fromtimestamp(timestamp)
    month = dt.month
    
    seasonal_factors = {
        12: 1.2,  # December (holiday season)
        11: 1.1,  # November (pre-holiday)
        1: 0.8,   # January (post-holiday)
        2: 0.8,   # February (winter)
        7: 1.1,   # July (summer peak)
        8: 1.1,   # August (summer peak)
    }
    
    return seasonal_factors.get(month, 1.0)

async def process_item_prediction(item_id: str, db: AsyncSession):
    try:
        service = PredictionService(db)
        data = await fetch_inventory_data(item_id, db)
        
        if service.check_data_changed(item_id, data):
            prediction = service.create_prediction(item_id, data)
            logger.info(f"Updated prediction for item {item_id}: {prediction.predicted_demand}")
        else:
            logger.info(f"No data changes detected for item {item_id}, skipping prediction")
    
    except Exception as e:
        logger.error(f"Error processing prediction for item {item_id}: {str(e)}")

async def run_predictions():
    try:
        async with AsyncSessionLocal() as db:
            query = text("""
                SELECT id 
                FROM inventory_items 
                WHERE quantity > 0 
                OR updated_at >= NOW() - INTERVAL '30 days'
            """)
            
            result = await db.execute(query)
            item_ids = [str(row.id) for row in result.fetchall()]
            
            if not item_ids:
                logger.warning("No active inventory items found for prediction")
                return
            
            tasks = [process_item_prediction(item_id, db) for item_id in item_ids]
            await asyncio.gather(*tasks)
    
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