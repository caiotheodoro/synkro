from typing import Optional, Any, Dict
import redis.asyncio as redis
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import json
import logging
from redis.exceptions import RedisError, ConnectionError
import asyncio
from app.core.config.settings import settings

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self, host="localhost", port=6379, db=0, password=None, ttl=3600):
        self._redis = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            decode_responses=True
        )
        self._ttl = ttl
        self._is_connected = False
        self._is_initialized = False

    @retry(stop=stop_after_attempt(3), 
           wait=wait_exponential(multiplier=1, min=1, max=2),
           retry=retry_if_exception_type(RedisError),
           reraise=True)
    async def initialize(self):
        """Initialize the Redis connection."""
        try:
            await self._check_health()
            self._is_initialized = True
            self._is_connected = True
            logger.info("Redis cache initialized successfully")
        except RedisError as e:
            self._is_connected = False
            self._is_initialized = True  # Mark as initialized even if failed
            logger.error(f"Failed to initialize Redis cache: {str(e)}")
            # Don't raise the exception, just log it and continue

    async def _check_health(self):
        """Check if Redis is healthy."""
        try:
            await self._redis.ping()
        except Exception as e:
            raise RedisError(f"Redis health check failed: {str(e)}")

    async def get(self, key: str) -> Optional[Dict]:
        """Get a value from the cache."""
        if not self._is_connected:
            return None
            
        try:
            value = await self._redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting value from Redis: {str(e)}")
            return None

    async def set(self, key: str, value: Any) -> bool:
        """Set a value in the cache."""
        if not self._is_connected:
            return False
            
        try:
            serialized = json.dumps(value)
            await self._redis.set(key, serialized, ex=self._ttl)
            return True
        except Exception as e:
            logger.error(f"Error setting value in Redis: {str(e)}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete a value from the cache."""
        if not self._is_connected:
            return False
            
        try:
            await self._redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error deleting value from Redis: {str(e)}")
            return False

    async def cleanup(self):
        """Close the Redis connection."""
        if self._is_connected:
            try:
                await self._redis.close()
                self._is_connected = False
            except Exception as e:
                logger.error(f"Error closing Redis connection: {str(e)}")

# Global instance of RedisCache
_redis_cache = RedisCache()

async def get_redis_cache():
    """Get the Redis cache instance."""
    if not _redis_cache._is_initialized:
        await _redis_cache.initialize()
    return _redis_cache 