from typing import Dict, Any, Optional
import aiohttp
import logging
from app.core.config.settings import settings
from app.core.exceptions import FeatureStoreError

logger = logging.getLogger(__name__)

class FeatureStore:
    def __init__(self):
        self._url = settings.FEATURE_STORE_URL
        self._session: Optional[aiohttp.ClientSession] = None
        self._is_healthy = False
        self._enabled = settings.ENABLE_FEATURE_STORE and settings.FEATURE_STORE_URL is not None

    async def initialize(self):
        """Initialize feature store client."""
        if not self._enabled:
            logger.info("Feature store is disabled")
            return

        try:
            timeout = aiohttp.ClientTimeout(total=settings.FEATURE_STORE_TIMEOUT)
            self._session = aiohttp.ClientSession(timeout=timeout)
            await self._check_health()
            self._is_healthy = True
            logger.info("Feature store initialized successfully")
        except Exception as e:
            self._is_healthy = False
            logger.warning(f"Feature store initialization failed: {str(e)}. Continuing without feature store.")
            if self._session:
                await self._session.close()
            self._session = None
            self._enabled = False

    async def _check_health(self):
        """Check feature store health."""
        if not self._session:
            raise FeatureStoreError("Feature store client not initialized")

        try:
            async with self._session.get(f"{self._url}/health") as response:
                if response.status != 200:
                    raise FeatureStoreError(f"Feature store health check failed with status {response.status}")
        except Exception as e:
            raise FeatureStoreError(f"Feature store health check failed: {str(e)}")

    async def get_features(self, entity_id: str) -> Dict[str, Any]:
        """Get features for an entity."""
        if not self._enabled or not self._session:
            return {}

        try:
            async with self._session.get(f"{self._url}/features/{entity_id}") as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    logger.warning(f"No features found for entity {entity_id}")
                    return {}
                else:
                    logger.error(f"Error getting features for entity {entity_id}: {response.status}")
                    return {}
        except Exception as e:
            logger.error(f"Error getting features: {str(e)}")
            return {}

    async def batch_get_features(self, entity_ids: list[str]) -> Dict[str, Dict[str, Any]]:
        """Get features for multiple entities."""
        if not self._enabled or not self._session:
            return {}

        try:
            async with self._session.post(
                f"{self._url}/features/batch",
                json={"entity_ids": entity_ids}
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.error(f"Error getting batch features: {response.status}")
                    return {}
        except Exception as e:
            logger.error(f"Error getting batch features: {str(e)}")
            return {}

    def is_healthy(self) -> bool:
        """Check if feature store is healthy."""
        return self._enabled and self._is_healthy

    async def cleanup(self):
        """Cleanup resources."""
        if self._session:
            try:
                await self._session.close()
                self._session = None
                logger.info("Feature store cleanup completed")
            except Exception as e:
                logger.error(f"Error during feature store cleanup: {str(e)}") 