from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
from app.core.config.settings import settings
from app.core.logging.logger import logger
from app.controllers.prediction_controller import router as prediction_router
from app.jobs.prediction_job import setup_prediction_job
from app.core.config.database import init_db
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
        try:
            logger.info("Starting AI/ML Predictions Service")
            
            logger.info("Initializing database...")
            await init_db()
            logger.info("Database initialization completed successfully")
            
            logger.info("Starting prediction scheduler...")
            scheduler = setup_prediction_job()
            scheduler.start()
            logger.info("Prediction scheduler started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start the service: {str(e)}")
            sys.exit(1)

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "healthy"}

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down AI/ML Predictions Service")

    app.include_router(prediction_router, prefix=settings.API_V1_STR)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 