from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import sys
from pathlib import Path

# Setup Python path để tương thích với cả python -m và uvicorn
current_dir = Path(__file__).parent  # src/
parent_dir = current_dir.parent      # ai-services/

paths_to_add = [str(parent_dir), str(current_dir)]
for path in paths_to_add:
    if path not in sys.path:
        sys.path.insert(0, path)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import router với fallback handling
try:
    from api.router import api_router
    logger.info("Imported api_router as api.router")
except ImportError:
    try:
        from src.api.router import api_router
        logger.info("Imported api_router as src.api.router")
    except ImportError as e:
        logger.error(f"Could not import api_router: {e}")
        # Tạo router tạm thời để không crash
        from fastapi import APIRouter
        api_router = APIRouter()
        
        @api_router.get("/test")
        async def test_endpoint():
            return {"message": "API router import failed, using fallback"}

# Initialize FastAPI app
app = FastAPI(
    title="AI Services API",
    description="REST API for AI model training and prediction",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-services"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "AI Services API",
        "version": "1.0.0",
        "health": "/health",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "4003"))
    logger.info(f"Starting AI Services API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)