from fastapi import APIRouter
from .endpoints import auth, predict, train

api_router = APIRouter()

# Authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Prediction routes
api_router.include_router(predict.router, prefix="/predict", tags=["predict"])

# Training routes
api_router.include_router(train.router, prefix="/train", tags=["train"])