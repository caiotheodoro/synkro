from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app
from app.core.config.settings import settings
from app.core.logging.logger import logger
from app.core.exceptions import BaseError
from app.controllers.prediction_controller import router as prediction_router
from app.jobs.prediction_job import setup_prediction_job
from app.core.config.database import init_db, cleanup_db
from app.services.model_registry.registry import ModelRegistry
from app.services.feature_store.store import FeatureStore
from app.services.cache.redis_cache import RedisCache
from app.core.middleware.auth import auth_middleware
from redis.exceptions import ConnectionError as RedisConnectionError
import sys
import traceback

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

    @app.middleware("http")
    async def auth_middleware_wrapper(request: Request, call_next):
        # Protected paths that require authentication
        protected_paths = [
            f"{settings.API_V1_STR}/predictions/predict",
            f"{settings.API_V1_STR}/predictions/batch",
            f"{settings.API_V1_STR}/predictions/generate"
        ]
        
        # Check if the current path needs authentication
        path = request.url.path
        requires_auth = any(path.startswith(p) for p in protected_paths)
        
        if requires_auth:
            logger.info(f"Authenticating request to protected endpoint: {path}")
            return await auth_middleware(request, call_next)
        
        logger.debug(f"Skipping authentication for non-protected endpoint: {path}")
        return await call_next(request)

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
            
            try:
                logger.info("Initializing database...")
                await init_db()
                logger.info("Database initialization completed successfully")
            except Exception as e:
                logger.error(f"Failed to initialize database: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                sys.exit(1)
            
            try:
                logger.info("Initializing Redis cache...")
                app.state.cache = RedisCache()
                await app.state.cache.initialize()
                logger.info("Redis cache initialized successfully")
            except Exception as e:
                logger.warning(f"Redis cache initialization failed: {str(e)}. Continuing without cache.")
                app.state.cache = None
            
            try:
                logger.info("Initializing model registry...")
                app.state.model_registry = ModelRegistry()
                models = app.state.model_registry.get_all_models()
                if not models:
                    logger.error("No models were loaded during initialization")
                    sys.exit(1)
                logger.info(f"Model registry initialized successfully with models: {models}")
            except Exception as e:
                logger.error(f"Failed to initialize model registry: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                sys.exit(1)
            
            try:
                logger.info("Initializing feature store...")
                app.state.feature_store = FeatureStore()
                await app.state.feature_store.initialize()
                logger.info("Feature store initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize feature store: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                sys.exit(1)
            
            try:
                logger.info("Starting prediction scheduler...")
                scheduler = setup_prediction_job()
                scheduler.start()
                logger.info("Prediction scheduler started successfully")
            except Exception as e:
                logger.warning(f"Failed to start prediction scheduler: {str(e)}. Continuing without scheduler.")
            
            logger.info("Application startup completed successfully")
            logger.info(f"Authentication middleware enabled for prediction endpoints")
            
        except Exception as e:
            logger.error(f"Failed to start the service: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            sys.exit(1)

    @app.get("/health", tags=["Health"])
    async def health_check():
        components = {
            "database": "healthy",
            "model_registry": "healthy" if app.state.model_registry.is_healthy() else "unhealthy",
            "feature_store": "healthy" if app.state.feature_store.is_healthy() else "unhealthy",
        }
        
        if hasattr(app.state, "cache") and app.state.cache is not None:
            components["cache"] = "healthy" if app.state.cache.is_healthy() else "unhealthy"
        
        required_components = ["database", "model_registry", "feature_store"]
        required_healthy = all(components.get(comp) == "healthy" for comp in required_components)
        
        return {
            "status": "healthy" if required_healthy else "degraded",
            "components": components
        }

    @app.on_event("shutdown")
    async def shutdown_event():
        try:
            logger.info("Shutting down AI/ML Predictions Service")
            
            if hasattr(app.state, "feature_store"):
                await app.state.feature_store.cleanup()
            
            if hasattr(app.state, "model_registry"):
                await app.state.model_registry.cleanup()
            
            if hasattr(app.state, "cache") and app.state.cache is not None:
                await app.state.cache.cleanup()
            
            await cleanup_db()
            
            logger.info("Cleanup completed successfully")
        except Exception as e:
            logger.error(f"Error during shutdown: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")

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