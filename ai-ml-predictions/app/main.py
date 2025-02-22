from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app, Counter, Histogram
import time
from typing import Dict, List
import uvicorn

PREDICTIONS_COUNTER = Counter('ml_predictions_total', 'Total number of predictions made')
PREDICTION_DURATION = Histogram('ml_prediction_duration_seconds', 'Time spent processing prediction')

app = FastAPI(
    title="AI/ML Predictions Service",
    description="Machine learning-based demand forecasting service",
    version="1.0.0"
)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint for kubernetes probes"""
    return {"status": "healthy"}

@app.get("/readiness")
async def readiness_check() -> Dict[str, str]:
    """Readiness check endpoint for kubernetes probes"""
    return {"status": "ready"}

@app.post("/api/v1/predict/demand")
async def predict_demand(data: Dict[str, List[float]]) -> Dict[str, float]:
    """
    Predict demand based on historical data
    
    Args:
        data: Dictionary containing historical demand data
        
    Returns:
        Dictionary containing predicted demand
    """
    try:
        with PREDICTION_DURATION.time():
            # TODO: Implement ML prediction logic
            predicted_demand = 0.0  
            PREDICTIONS_COUNTER.inc()
            
            return {"predicted_demand": predicted_demand}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 