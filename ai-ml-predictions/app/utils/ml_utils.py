import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import hashlib
import json
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime

MODEL_PATH = Path("models")
MODEL_FILE = MODEL_PATH / "demand_model.joblib"
SCALER_FILE = MODEL_PATH / "demand_scaler.joblib"

def create_model_directory():
    MODEL_PATH.mkdir(exist_ok=True)

def calculate_data_hash(data: Dict[str, List[float]]) -> str:
    data_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(data_str.encode()).hexdigest()

def prepare_data(data: Dict[str, List[float]]) -> np.ndarray:
    features = np.array(list(data.values())).T
    return features

def train_and_save_model(data: Dict[str, List[float]], target: List[float]):
    create_model_directory()
    
    X = prepare_data(data)
    y = np.array(target)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_scaled, y)
    
    joblib.dump(model, MODEL_FILE)
    joblib.dump(scaler, SCALER_FILE)
    
    return model, scaler

def load_model() -> Tuple[RandomForestRegressor, StandardScaler]:
    if not MODEL_FILE.exists() or not SCALER_FILE.exists():
        raise FileNotFoundError("Model or scaler not found. Please train the model first.")
    
    model = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)
    return model, scaler

def make_prediction(data: Dict[str, List[float]]) -> Tuple[float, float]:
    model, scaler = load_model()
    X = prepare_data(data)
    X_scaled = scaler.transform(X)
    
    prediction = model.predict(X_scaled)[-1]
    confidence = model.predict_proba(X_scaled)[-1].max() if hasattr(model, 'predict_proba') else None
    
    return prediction, confidence 