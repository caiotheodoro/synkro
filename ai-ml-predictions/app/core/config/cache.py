from typing import Any, Optional
import json
from redis import Redis
from app.core.config.settings import settings

class RedisCache:
    def __init__(self):
        self.redis_client = Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        """
        value = self.redis_client.get(key)
        if value:
            return json.loads(value)
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache with optional TTL
        """
        try:
            serialized_value = json.dumps(value)
            if ttl:
                return bool(self.redis_client.setex(key, ttl, serialized_value))
            return bool(self.redis_client.set(key, serialized_value))
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        """
        Delete value from cache
        """
        return bool(self.redis_client.delete(key))

    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache
        """
        return bool(self.redis_client.exists(key))

    def generate_key(self, prefix: str, *args: Any) -> str:
        """
        Generate a cache key from prefix and arguments
        """
        return f"{prefix}:{':'.join(str(arg) for arg in args)}"

# Create global cache instance
cache = RedisCache() 