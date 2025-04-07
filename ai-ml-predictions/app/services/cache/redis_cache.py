from typing import Any, Optional
from redis.asyncio import Redis
from redis.exceptions import ConnectionError, RedisError
import json
import logging
from app.core.config.settings import settings
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        self._redis: Optional[Redis] = None
        self._url = settings.redis_url
        self._is_healthy = False
        self._enabled = settings.ENABLE_CACHE

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=False
    )
    async def initialize(self):
        """Initialize Redis connection."""
        if not self._enabled:
            logger.info("Redis cache is disabled")
            return

        try:
            self._redis = Redis.from_url(
                self._url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5.0,
                socket_timeout=5.0,
                retry_on_timeout=True
            )
            await self._check_health()
            self._is_healthy = True
            logger.info("Redis cache initialized successfully")
        except ConnectionError as e:
            self._is_healthy = False
            logger.warning(f"Failed to connect to Redis: {str(e)}. Cache will be disabled.")
            self._enabled = False
        except Exception as e:
            self._is_healthy = False
            logger.error(f"Failed to initialize Redis cache: {str(e)}")
            raise

    async def cleanup(self):
        """Cleanup Redis connection."""
        if self._redis:
            try:
                await self._redis.close()
            except Exception as e:
                logger.error(f"Error closing Redis connection: {str(e)}")
            finally:
                self._redis = None

    def is_healthy(self) -> bool:
        """Check if Redis cache is healthy."""
        return self._enabled and self._is_healthy

    async def _check_health(self):
        """Check Redis connection health."""
        if not self._redis:
            raise Exception("Redis client not initialized")
        try:
            await self._redis.ping()
        except Exception as e:
            raise RedisError(f"Redis health check failed: {str(e)}")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self._enabled or not self._redis:
            return None

        try:
            value = await self._redis.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Error getting value from Redis: {str(e)}")
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache."""
        if not self._enabled or not self._redis:
            return

        try:
            await self._redis.set(
                key,
                json.dumps(value),
                ex=ttl or settings.CACHE_TTL
            )
        except Exception as e:
            logger.error(f"Error setting value in Redis: {str(e)}")

    async def delete(self, key: str):
        """Delete value from cache."""
        if not self._enabled or not self._redis:
            return

        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.error(f"Error deleting value from Redis: {str(e)}")

    async def clear(self):
        """Clear all cache entries."""
        if not self._enabled or not self._redis:
            return

        try:
            await self._redis.flushdb()
        except Exception as e:
            logger.error(f"Error clearing Redis cache: {str(e)}")

    async def ensure_connection(self):
        """Ensure Redis connection is alive, attempt to reconnect if not."""
        if not self._enabled:
            return

        try:
            if not self._redis or not self._is_healthy:
                await self.initialize()
            else:
                await self._check_health()
        except Exception as e:
            logger.error(f"Failed to ensure Redis connection: {str(e)}")
            self._is_healthy = False 