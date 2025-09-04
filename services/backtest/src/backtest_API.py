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

# Initialize app
app = FastAPI(
    title="Financial Backtest Service",
    description="Apollo Federation subgraph for financial backtesting services",
    version="1.0.0",
)

# CORS configuration - more comprehensive for Apollo Router and frontend
origins = [
    "http://localhost:4000",  # Apollo Router
    "http://localhost:5173",  # Frontend
    "http://frontend:5173",   # Frontend in Docker
    "http://localhost:5050",  # This service
    "http://127.0.0.1:5050",  # This service
    "http://backtest:5050",   # This service in Docker
    "https://studio.apollographql.com",  # Apollo Studio
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type", 
        "Authorization", 
        "Apollo-Require-Preflight",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Methods",
    ],
)

# Include upload routes
app.include_router(upload_router)

# Add GraphQL router
graphql_router = GraphQLRouter(schema, graphiql=True)
app.include_router(graphql_router, prefix="/graphql")

# Add SDL endpoint for Apollo Federation
@app.get("/graphql/sdl")
async def get_sdl():
    """Return the SDL schema for Apollo Federation."""
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(schema.as_str(), media_type="text/plain")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "backtest-service"}

# Lifecycle events
@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info("Starting backtest service...")
    
    # Start the scheduler for file cache cleanup
    if not scheduler.running:
        scheduler.add_job(
            file_cacher.remove_unused_caches,
            IntervalTrigger(hours=24),
            id="cleanup_cache",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Started file cache cleanup scheduler")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Shutting down backtest service...")
    
    # Stop the scheduler
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Stopped file cache cleanup scheduler")