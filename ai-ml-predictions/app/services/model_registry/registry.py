from typing import Dict, Optional, Any
import os
import joblib
import numpy as np
import logging
from app.core.exceptions import ModelNotFoundError

logger = logging.getLogger(__name__)

class Model:
    def __init__(self, model_path: str, model_name: str):
        self.model_path = model_path
        self.model_name = model_name
        self._model = None
        logger.info(f"Initializing model {model_name} with path {model_path}")

    def load(self):
        """Load the model from disk."""
        try:
            logger.info(f"Loading model {self.model_name} from {self.model_path}")
            if not os.path.exists(self.model_path):
                logger.error(f"Model file not found: {self.model_path}")
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            self._model = joblib.load(self.model_path)
            logger.info(f"Successfully loaded model {self.model_name}")
            return True
        except Exception as e:
            logger.error(f"Error loading model {self.model_name}: {str(e)}")
            self._model = None
            return False

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Make a prediction using the model."""
        if not self._model:
            if not self.load():
                raise ModelNotFoundError(f"Failed to load model {self.model_name}")
        
        try:
            # Convert dictionary to numpy array in the correct order
            feature_array = np.array([
                features.get('historical_sales', 0),
                features.get('seasonality', 0),
                features.get('trend', 0),
                features.get('price', 0)
            ]).reshape(1, -1)
            
            prediction = self._model.predict(feature_array)
            
            result = {
                "prediction": float(prediction[0]),
                "confidence": 0.95  # Fixed confidence for now
            }
            logger.info(f"Prediction result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error making prediction with model {self.model_name}: {str(e)}")
            raise

class ModelRegistry:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not ModelRegistry._initialized:
            self.models: Dict[str, Model] = {}
            self._load_models()
            ModelRegistry._initialized = True

    def _load_models(self):
        """Load all models from the models directory."""
        try:
            model_dir = "/app/models"
            logger.info(f"Loading models from directory: {model_dir}")
            
            if not os.path.exists(model_dir):
                logger.error(f"Model directory does not exist: {model_dir}")
                return
            
            model_files = [f for f in os.listdir(model_dir) 
                         if f.endswith('.joblib') and os.path.isfile(os.path.join(model_dir, f))]
            
            for model_file in model_files:
                model_name = os.path.splitext(model_file)[0]
                model_path = os.path.join(model_dir, model_file)
                model = Model(model_path, model_name)
                if model.load():
                    self.models[model_name] = model
                    logger.info(f"Successfully loaded model: {model_name}")
            
            logger.info(f"Loaded {len(self.models)} models")
            logger.info(f"Available models: {list(self.models.keys())}")
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")

    def get_model(self, model_name: str) -> Optional[Model]:
        """Get a model by name."""
        if model_name not in self.models:
            logger.error(f"Model {model_name} not found in registry")
            raise ModelNotFoundError(f"Model {model_name} not found")
        return self.models[model_name]

    def is_healthy(self) -> bool:
        """Check if the model registry is healthy."""
        return len(self.models) > 0

    def get_all_models(self) -> list:
        """Get all available models."""
        return list(self.models.keys()) 