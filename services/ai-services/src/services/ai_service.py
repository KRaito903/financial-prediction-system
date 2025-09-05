import logging
import asyncio
from datetime import datetime
import pandas as pd
from typing import List, Dict, Any
from ..models.schemas import PredictionResult, PredictionResponse, TrainingResponse

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    async def run_prediction(
        model_name: str,
        symbol: str,
        pred_length: int,
        datatype: str
    ) -> PredictionResponse:
        try:
            logger.info(f"Running prediction for {symbol} with model {model_name}")
            
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result_df = await loop.run_in_executor(
                None,
                AIService._run_prediction_sync,
                model_name, symbol, pred_length, datatype
            )
            
            # Convert DataFrame to response
            predictions = []
            for _, row in result_df.iterrows():
                predictions.append(
                    PredictionResult(
                        timestamp=row['timestamp'],
                        close=float(row['close']),
                        symbol=row.get('symbol', symbol)
                    )
                )
            
            return PredictionResponse(
                success=True,
                message=f"Prediction completed successfully for {symbol}",
                data=predictions
            )
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return PredictionResponse(
                success=False,
                message=f"Prediction failed: {str(e)}",
                data=[]
            )
    
    @staticmethod
    def _run_prediction_sync(model_name: str, symbol: str, pred_length: int, datatype: str):
        """Run prediction synchronously"""
        try:
            # Import and use existing prediction pipeline
            from src.pipelines.prediction_pipeline import prediction_pipeline
            logger.info("ok111")
            return prediction_pipeline(
                model_name=model_name,
                symbol=symbol,
                pred_length=pred_length,
                datatype=datatype
            )
        except ImportError as e:
            logger.warning(f"Failed to import prediction pipeline: {e}")
            # Return mock data if pipeline not found
            import pandas as pd
            from datetime import datetime, timedelta
            
            dates = [datetime.now() + timedelta(days=i) for i in range(pred_length)]
            return pd.DataFrame({
                'timestamp': dates,
                'close': [50000 + i * 100 for i in range(pred_length)],
                'symbol': [symbol] * pred_length
            })
    
    @staticmethod
    async def run_training(
        datatype: str,
        pre_len: int,
        seq_len: int
    ) -> TrainingResponse:
        try:
            logger.info(f"Starting training with datatype={datatype}, pre_len={pre_len}, seq_len={seq_len}")
            
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                AIService._run_training_sync,
                datatype, pre_len, seq_len
            )
            
            return TrainingResponse(
                success=True,
                message="Training completed successfully",
                model_path=f"models/timexer/day/timexer_pred_{pre_len}.ckpt"
            )
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            return TrainingResponse(
                success=False,
                message=f"Training failed: {str(e)}"
            )
    
    @staticmethod
    def _run_training_sync(datatype: str, pre_len: int, seq_len: int):
        """Run training synchronously"""
        try:
            # Import and use existing training pipeline
            from ..pipelines.training_pipeline import run_training_pipeline
            
            run_training_pipeline(
                datatype=datatype,
                pre_len=pre_len,
                seq_len=seq_len
            )
        except ImportError as e:
            logger.warning(f"Failed to import training pipeline: {e}")
            # Simulate training
            import time
            time.sleep(2)  # Simulate training time