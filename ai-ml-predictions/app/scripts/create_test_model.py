import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# Create synthetic data
np.random.seed(42)
n_samples = 1000

# Features: historical_sales, seasonality, trend, price
X = np.random.rand(n_samples, 4)
# Target: future demand (with some noise)
y = 2 * X[:, 0] + 0.5 * X[:, 1] + 0.3 * X[:, 2] - 0.1 * X[:, 3] + np.random.normal(0, 0.1, n_samples)

# Train a simple random forest model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# Save the model
model_path = "/app/models/demand_forecast_v1.joblib"
os.makedirs(os.path.dirname(model_path), exist_ok=True)
joblib.dump(model, model_path)

print(f"Test model saved to {model_path}") 