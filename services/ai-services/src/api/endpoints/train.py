from fastapi import APIRouter, Depends
from ...models.schemas import TrainingRequest, TrainingResponse
from ...utils.auth import get_current_user
from ...services.ai_service import AIService

router = APIRouter()

@router.post("", response_model=TrainingResponse)
async def train_model(
    request: TrainingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Run training pipeline"""
    return await AIService.run_training(
        datatype=request.datatype,
        pre_len=request.pre_len,
        seq_len=request.seq_len
    )