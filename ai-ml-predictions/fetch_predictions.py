import asyncio
from app.core.config.database import PredictionsAsyncSession
from sqlalchemy import text

async def fetch_recent_predictions():
    """Fetch and display the most recent predictions from the database."""
    async with PredictionsAsyncSession() as session:
        # Query to get the most recent predictions
        query = text("""
            SELECT id, model_name, item_id, input_data, prediction_result, 
                   confidence_score, created_at
            FROM predictions
            ORDER BY created_at DESC
            LIMIT 10;
        """)
        
        result = await session.execute(query)
        predictions = result.fetchall()
        
        print(f"Found {len(predictions)} recent predictions:")
        for p in predictions:
            print("-" * 80)
            print(f"ID: {p.id}")
            print(f"Model: {p.model_name}")
            print(f"Item ID: {p.item_id}")
            print(f"Created at: {p.created_at}")
            print(f"Confidence score: {p.confidence_score}")
            print(f"Prediction result: {p.prediction_result}")
            print(f"Input data: {p.input_data}")

if __name__ == "__main__":
    asyncio.run(fetch_recent_predictions()) 