import asyncio
from graphql_api.types import PredictionRow, TrainResult
from src.pipelines.training_pipeline import run_training_pipeline
from src.pipelines.prediction_pipeline import prediction_pipeline
from graphql_api.dependencies import executor

# Train resolver
async def resolve_train_model(datatype: str, pred_len: int):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, run_training_pipeline, datatype, pred_len)
    return TrainResult(**result)  # trả về instance của TrainResult

# Predict resolver
async def resolve_predict_model(model_name: str, pred_len: int, symbol: str, datatype: str):
    loop = asyncio.get_event_loop()
    df = await loop.run_in_executor(executor, prediction_pipeline, model_name, symbol, pred_len, datatype)
    records = df.to_dict(orient="records")
    return [PredictionRow(**r) for r in records]  # trả về list của PredictionRow
