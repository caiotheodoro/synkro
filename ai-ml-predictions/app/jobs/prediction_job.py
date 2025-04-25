from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.prediction_service import PredictionService
from app.core.config.database import LogisticsAsyncSession, PredictionsAsyncSession
from app.core.logging.logger import logger
from app.services.model_registry.registry import ModelRegistry
from app.services.feature_store.logistics_store import LogisticsFeatureStore
from app.services.cache.redis_cache import RedisCache
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
        
        transaction_query = text("""
            SELECT 
                CAST(quantity AS FLOAT) as quantity,
                type,
                CAST(EXTRACT(epoch FROM created_at) AS BIGINT) as timestamp
            FROM inventory_transactions
            WHERE item_id = :item_id
            AND created_at >= NOW() - INTERVAL '30 days'
            ORDER BY created_at ASC
        """)
        
        historical_result = await db.execute(historical_query, {"item_id": item_id})
        historical_data = historical_result.fetchall()
        
        transaction_result = await db.execute(transaction_query, {"item_id": item_id})
        transaction_data = transaction_result.fetchall()
        
        stock_levels = []
        
        for row in historical_data:
            quantity = float(row.quantity) if isinstance(row.quantity, Decimal) else row.quantity
            stock_levels.append(quantity)
        
        if not stock_levels:
            stock_levels = [0.0]
        
        return {
            "quantity": stock_levels,
            "timestamp": [row.timestamp for row in historical_data] if historical_data else [0],
            "transactions": [{
                "quantity": float(row.quantity) if isinstance(row.quantity, Decimal) else row.quantity,
                "type": row.type,
                "timestamp": row.timestamp
            } for row in transaction_data]
        }

    except Exception as e:
        logger.error(f"Error fetching inventory data: {str(e)}")
        return {
            "quantity": [0.0],
            "timestamp": [0],
            "transactions": []
        }

async def process_single_prediction(item_id: str, model_registry: ModelRegistry, cache: RedisCache):
    async with LogisticsAsyncSession() as logistics_db:
        async with PredictionsAsyncSession() as predictions_db:
            try:
                logger.info(f"Starting prediction process for item {item_id}")
                feature_store = LogisticsFeatureStore(logistics_db)
                service = PredictionService(
                    predictions_db=predictions_db,
                    logistics_db=logistics_db,
                    model_registry=model_registry,
                    feature_store=feature_store,
                    cache=cache
                )
                
                logger.info(f"Fetching inventory data for item {item_id}")
                data = await fetch_inventory_data(logistics_db, item_id)
                logger.debug(f"Inventory data: {data}")
                
                logger.info(f"Creating prediction for item {item_id}")
                prediction = await service.create_prediction(item_id, "demand_forecast_v1")
                logger.debug(f"Raw prediction result: {prediction}")
                logger.info(f"Updated prediction for item {item_id}: {prediction['predicted_demand']}")
                
                await logistics_db.commit()
                await predictions_db.commit()
                return True
            
            except Exception as e:
                logger.error(f"Error processing prediction for item {item_id}: {str(e)}")
                logger.exception("Full traceback:")
                await logistics_db.rollback()
                await predictions_db.rollback()
                return False

async def run_predictions():
    try:
        async with LogisticsAsyncSession() as logistics_db:
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

            model_registry = ModelRegistry()
            
            try:
                cache = RedisCache()
                await cache.initialize()
            except Exception as e:
                logger.warning(f"Failed to initialize Redis cache: {str(e)}. Continuing without cache.")
                cache = None

            batch_size = 5
            for i in range(0, len(item_ids), batch_size):
                batch = item_ids[i:i + batch_size]
                tasks = []
                
                for item_id in batch:
                    task = process_single_prediction(
                        item_id=item_id,
                        model_registry=model_registry,
                        cache=cache
                    )
                    tasks.append(task)
                
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                failed_items = [
                    item_id for item_id, success in zip(batch, results)
                    if not success or isinstance(success, Exception)
                ]
                
                if failed_items:
                    logger.error(f"Failed to process predictions for items: {failed_items}")
                
                await asyncio.sleep(0.1)

            if cache is not None:
                await cache.cleanup()
    
    except Exception as e:
        logger.error(f"Error in prediction job: {str(e)}")

def setup_prediction_job():
    scheduler = AsyncIOScheduler()
    
    trigger = CronTrigger(
        minute="*/50",
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