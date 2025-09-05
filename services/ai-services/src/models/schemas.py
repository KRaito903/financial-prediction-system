from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Authentication models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    message: str

class UserInfo(BaseModel):
    user_id: str
    username: str

# Prediction models
class PredictionRequest(BaseModel):
    model_name: str = "Ensemble"
    symbol: str = "BTCUSDT"
    pred_length: int = 7
    datatype: str = "1d"

class PredictionResult(BaseModel):
    timestamp: datetime
    close: float
    symbol: str

class PredictionResponse(BaseModel):
    success: bool
    message: str
    data: List[PredictionResult]

# Training models
class TrainingRequest(BaseModel):
    datatype: str = "1d"
    pre_len: int = 7
    seq_len: int = 60

class TrainingResponse(BaseModel):
    success: bool
    message: str
    model_path: Optional[str] = None