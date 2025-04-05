import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from pathlib import Path
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = Path("models")
MODEL_FILE = MODEL_PATH / "demand_model.joblib"
SCALER_FILE = MODEL_PATH / "demand_scaler.joblib"

def prepare_features(data: Dict[str, List[float]]) -> np.ndarray:
    """Convert dictionary of lists into a feature matrix."""
    try:
        # Extract historical demand and stock levels
        historical_demand = np.array(data.get('historical_demand', [0]))
        stock_levels = np.array(data.get('stock_levels', [0]))
        
        # Calculate basic features
        avg_demand = np.mean(historical_demand)
        avg_stock = np.mean(stock_levels)
        demand_variance = np.var(historical_demand) if len(historical_demand) > 1 else 0
        
        # Create feature matrix
        features = np.array([[
            avg_demand,
            avg_stock,
            demand_variance,
            stock_levels[-1] if len(stock_levels) > 0 else 0
        ]])
        
        return features
    except Exception as e:
        logger.error(f"Error preparing features: {str(e)}")
        # Return a default feature set
        return np.array([[0, 0, 0, 0]])

def make_prediction(data: Dict[str, List[float]]) -> Tuple[float, float]:
    """Make a demand prediction with confidence score."""
    try:
        # Prepare features
        features = prepare_features(data)
        
        # Load model and scaler
        if not MODEL_FILE.exists():
            logger.warning("Model not found, using fallback prediction")
            return 0.0, 0.0
            
        model = joblib.load(MODEL_FILE)
        
        # Make prediction
        prediction = float(model.predict(features)[0])
        
        # Calculate confidence based on feature values
        confidence = max(0.0, min(1.0, 1.0 - np.std(features) / 10))
        
        return prediction, confidence
        
    except Exception as e:
        logger.error(f"Error making prediction: {str(e)}")
        return 0.0, 0.0 