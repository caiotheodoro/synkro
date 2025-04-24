import asyncio
from app.core.config.database import PredictionsAsyncSession
from sqlalchemy import text

async def check_database_schema():
    """Check the actual schema of the predictions table in the database."""
    async with PredictionsAsyncSession() as session:
        # Query to check the column type of id in predictions table
        query = text("""
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = 'predictions'
            ORDER BY ordinal_position;
        """)
        
        result = await session.execute(query)
        columns = result.fetchall()
        
        print("Predictions table schema:")
        for column in columns:
            print(f"Column: {column.column_name}, Type: {column.data_type}, UDT: {column.udt_name}")

if __name__ == "__main__":
    asyncio.run(check_database_schema()) 