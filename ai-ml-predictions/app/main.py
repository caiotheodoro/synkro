from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app, Counter, Histogram
import time
from typing import Dict, List
import uvicorn

from app.core.config.settings import settings
from app.core.logging.logger import logger

PREDICTIONS_COUNTER = Counter('ml_predictions_total', 'Total number of predictions made')
PREDICTION_DURATION = Histogram('ml_prediction_duration_seconds', 'Time spent processing prediction')

def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="AI/ML Predictions Service for inventory management and demand forecasting",
        docs_url=f"{settings.API_V1_STR}/docs",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if settings.ENABLE_METRICS:
        metrics_app = make_asgi_app()
        app.mount("/metrics", metrics_app)

    @app.on_event("startup")
    async def startup_event():
        logger.info("Starting AI/ML Predictions Service")

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down AI/ML Predictions Service")

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": settings.VERSION}

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
                predicted_demand = 0.0  
                PREDICTIONS_COUNTER.inc()
                
                return {"predicted_demand": predicted_demand}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 