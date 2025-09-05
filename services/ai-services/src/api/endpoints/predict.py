from fastapi import APIRouter, Depends
from ...models.schemas import PredictionRequest, PredictionResponse
from ...utils.auth import get_current_user
from ...services.ai_service import AIService

router = APIRouter()

@router.post("", response_model=PredictionResponse)
async def predict(
    request: PredictionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Run prediction pipeline"""
    return await AIService.run_prediction(
        model_name=request.model_name,
        symbol=request.symbol,
        pred_length=request.pred_length,
        datatype=request.datatype
    )