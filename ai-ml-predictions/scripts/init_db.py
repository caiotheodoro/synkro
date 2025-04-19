import asyncio
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy_utils import database_exists, create_database
from app.core.config.settings import settings
from app.core.logging.logger import logger

def init_postgres_db():
    """Initialize PostgreSQL databases."""
    try:
        # Create predictions database if it doesn't exist
        engine = create_engine(f"postgresql://{settings.PREDICTIONS_DB_USER}:{settings.PREDICTIONS_DB_PASS}@{settings.PREDICTIONS_DB_HOST}:{settings.PREDICTIONS_DB_PORT}/postgres")
        if not database_exists(settings.PREDICTIONS_DB_URI):
            create_database(settings.PREDICTIONS_DB_URI)
            logger.info(f"Created database {settings.PREDICTIONS_DB_NAME}")
        else:
            logger.info(f"Database {settings.PREDICTIONS_DB_NAME} already exists")

        # Create logistics database if it doesn't exist
        if not database_exists(settings.LOGISTICS_DB_URI):
            create_database(settings.LOGISTICS_DB_URI)
            logger.info(f"Created database {settings.LOGISTICS_DB_NAME}")
        else:
            logger.info(f"Database {settings.LOGISTICS_DB_NAME} already exists")

        return True
    except Exception as e:
        logger.error(f"Error initializing databases: {str(e)}")
        return False

if __name__ == "__main__":
    if not init_postgres_db():
        sys.exit(1)
    logger.info("Database initialization completed successfully")
    sys.exit(0) 