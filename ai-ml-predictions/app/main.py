from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app
from app.core.config.settings import settings
from app.core.logging.logger import logger
from app.core.exceptions import BaseError
from app.controllers.prediction_controller import router as prediction_router
from app.jobs.prediction_job import setup_prediction_job
from app.core.config.database import init_db
from app.services.model_registry.registry import ModelRegistry
from app.services.feature_store.store import FeatureStore
import sys

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="AI/ML Predictions Service for inventory management and demand forecasting",
        docs_url=f"{settings.API_V1_STR}/docs",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if settings.ENABLE_METRICS:
        metrics_app = make_asgi_app()
        app.mount("/metrics", metrics_app)

    @app.exception_handler(BaseError)
    async def base_error_handler(request: Request, exc: BaseError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "message": exc.message,
                "details": exc.details,
                "status_code": exc.status_code
            }
        )

    @app.on_event("startup")
    async def startup_event():
        try:
            logger.info("Starting AI/ML Predictions Service")
            
            logger.info("Initializing database...")
            await init_db()
            logger.info("Database initialization completed successfully")
            
            logger.info("Initializing model registry...")
            app.state.model_registry = ModelRegistry()
            await app.state.model_registry.initialize()
            logger.info("Model registry initialized successfully")
            
            logger.info("Initializing feature store...")
            app.state.feature_store = FeatureStore()
            await app.state.feature_store.initialize()
            logger.info("Feature store initialized successfully")
            
            logger.info("Starting prediction scheduler...")
            scheduler = setup_prediction_job()
            scheduler.start()
            logger.info("Prediction scheduler started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start the service: {str(e)}")
            sys.exit(1)

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "components": {
                "database": "healthy",
                "model_registry": "healthy" if app.state.model_registry.is_healthy() else "unhealthy",
                "feature_store": "healthy" if app.state.feature_store.is_healthy() else "unhealthy"
            }
        }

    @app.on_event("shutdown")
    async def shutdown_event():
        try:
            logger.info("Shutting down AI/ML Predictions Service")
            await app.state.model_registry.cleanup()
            await app.state.feature_store.cleanup()
        except Exception as e:
            logger.error(f"Error during shutdown: {str(e)}")

    app.include_router(prediction_router, prefix=settings.API_V1_STR)

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=settings.WORKERS
    ) 