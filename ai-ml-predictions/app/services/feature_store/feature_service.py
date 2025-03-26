from typing import Any, Dict, List
import numpy as np
import pandas as pd
from fastapi import Depends
from app.core.logging.logger import logger
from app.core.config.cache import cache
from app.core.config.settings import settings

class FeatureService:
    async def prepare_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare features for model prediction
        """
        try:
            # Check feature cache
            cache_key = cache.generate_key("features", str(data))
            if cached_features := cache.get(cache_key):
                logger.info("Returning cached features")
                return cached_features

            # Convert data to DataFrame
            df = pd.DataFrame(data)
            
            # Feature engineering
            features = self._engineer_features(df)
            
            # Cache features
            cache.set(
                cache_key,
                features,
                ttl=settings.FEATURE_CACHE_TTL
            )
            
            return features
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            raise

    def _engineer_features(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Apply feature engineering transformations
        """
        try:
            # Time-based features
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df['hour'] = df['timestamp'].dt.hour
                df['day_of_week'] = df['timestamp'].dt.dayofweek
                df['month'] = df['timestamp'].dt.month
                df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

            # Numerical features
            numerical_features = df.select_dtypes(include=[np.number]).columns
            for col in numerical_features:
                # Handle missing values
                df[col] = df[col].fillna(df[col].mean())
                
                # Add basic statistical features
                df[f'{col}_rolling_mean'] = df[col].rolling(window=7, min_periods=1).mean()
                df[f'{col}_rolling_std'] = df[col].rolling(window=7, min_periods=1).std()

            # Categorical features
            categorical_features = df.select_dtypes(include=['object']).columns
            for col in categorical_features:
                # Handle missing values
                df[col] = df[col].fillna('unknown')
                
                # Encode categorical variables
                df[col] = df[col].astype('category').cat.codes

            return df.to_dict('records')
        except Exception as e:
            logger.error(f"Error engineering features: {str(e)}")
            raise

    async def validate_features(self, features: Dict[str, Any]) -> bool:
        """
        Validate features before using them for prediction
        """
        try:
            # Check for required features
            required_features = ['timestamp', 'quantity', 'price']
            if not all(feature in features for feature in required_features):
                return False

            # Check for valid data types
            if not isinstance(features['quantity'], (int, float)):
                return False
            if not isinstance(features['price'], (int, float)):
                return False

            # Check for valid ranges
            if features['quantity'] < 0 or features['price'] < 0:
                return False

            return True
        except Exception as e:
            logger.error(f"Error validating features: {str(e)}")
            return False 