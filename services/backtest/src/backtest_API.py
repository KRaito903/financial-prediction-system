from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from .models.backtest_schema import schema
from .routes.upload_routes import router as upload_router
from .utils.file_cacher import file_cacher
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = AsyncIOScheduler()

# Setup GraphQL router
graphql_app = GraphQLRouter(
    schema,
    graphiql=True,
)

app = FastAPI()
app.include_router(graphql_app, prefix="/graphql")
app.include_router(upload_router)

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5050",  # development
    "http://127.0.0.1:5050",  # production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Background task to clear unused cache files
async def cleanup_unused_model_files():
    try:
        logger.info("Starting scheduled cleanup of unused model files")
        await file_cacher.remove_unused_caches()
        logger.info("Completed cleanup of unused model files")
    except Exception as e:
        logger.error(f"Error during model file cleanup: {str(e)}")


# Startup and shutdown events for the scheduler
@app.on_event("startup")
async def start_scheduler():
    # Schedule cache cleanup to run every 24 hours
    scheduler.add_job(
        cleanup_unused_model_files,
        IntervalTrigger(hours=24),
        id="cleanup_unused_models",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Started scheduler for model file cleanup")


@app.on_event("shutdown")
async def stop_scheduler():
    scheduler.shutdown()
    logger.info("Stopped scheduler for model file cleanup")


# To run the FastAPI server, use the command: uvicorn src.services.backtestAPI:app --reload --port 5050
# Or use the run.py script for more options
