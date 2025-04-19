import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import joblib
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_sample_data(n_samples=1000):
    np.random.seed(42)
    
    historical_sales = np.random.normal(100, 20, n_samples)
    seasonality = np.sin(np.linspace(0, 4*np.pi, n_samples)) * 20
    trend = np.linspace(0, 10, n_samples)
    price = np.random.normal(50, 10, n_samples)
    
    X = np.column_stack([historical_sales, seasonality, trend, price])
    
    demand = (
        0.7 * historical_sales +
        0.2 * seasonality +
        0.1 * trend -
        0.3 * price +
        np.random.normal(0, 5, n_samples)
    )
    
    stockout = (demand > historical_sales + 50).astype(int)
    
    return X, demand, stockout

def train_demand_forecasting_model(X, y):
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model

def train_stockout_prediction_model(X, y):
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model

def train_stock_optimization_model(X, y):
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y + 50)  # Add safety stock margin
    return model

def main():
    try:
        logger.info("Generating sample data...")
        X, demand, stockout = generate_sample_data()
        
        models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        os.makedirs(models_dir, exist_ok=True)
        
        logger.info("Training demand forecasting model...")
        demand_model = train_demand_forecasting_model(X, demand)
        demand_model_path = os.path.join(models_dir, "demand_forecasting.joblib")
        joblib.dump(demand_model, demand_model_path)
        logger.info(f"Saved demand forecasting model to {demand_model_path}")
        
        logger.info("Training stockout prediction model...")
        stockout_model = train_stockout_prediction_model(X, stockout)
        stockout_model_path = os.path.join(models_dir, "stockout_prediction.joblib")
        joblib.dump(stockout_model, stockout_model_path)
        logger.info(f"Saved stockout prediction model to {stockout_model_path}")
        
        logger.info("Training stock optimization model...")
        optimization_model = train_stock_optimization_model(X, demand)
        optimization_model_path = os.path.join(models_dir, "stock_optimization.joblib")
        joblib.dump(optimization_model, optimization_model_path)
        logger.info(f"Saved stock optimization model to {optimization_model_path}")
        
        logger.info("All models trained and saved successfully!")
        
    except Exception as e:
        logger.error(f"Error training models: {str(e)}")
        raise

if __name__ == "__main__":
    main() 