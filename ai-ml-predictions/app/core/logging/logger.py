import logging
import sys
from typing import Any, Dict
from pythonjsonlogger import jsonlogger
from app.core.config.settings import settings

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['service'] = settings.PROJECT_NAME

def setup_logging() -> None:
    """
    Configure logging with JSON formatting and appropriate log levels
    """
    root_logger = logging.getLogger()
    handler = logging.StreamHandler(sys.stdout)
    formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    root_logger.setLevel(settings.LOG_LEVEL)

    # Suppress unnecessary logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name
    """
    return logging.getLogger(name)

# Initialize logging
setup_logging()

# Create default logger instance
logger = get_logger(__name__) 