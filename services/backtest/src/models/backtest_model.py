from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    # Special type for MongoDB ObjectId, converts to/from string
    # An Adapter for Pydantic to handle MongoDB ObjectId
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):  # if not ObjectId
            raise ValueError("Invalid objectid")
        return ObjectId(v)  # return ObjectId instance

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        field_schema = handler(core_schema)
        field_schema.update(type="string", format="object-id")
        return field_schema


# Pydantic equivalents for Strawberry types to match BacktestResult structure
class MAStrategyPydantic(BaseModel):
    fast_ma_period: int = Field(alias="fast")
    slow_ma_period: int = Field(alias="slow")

    class Config:
        validate_by_name = True


class PortfolioValuePydantic(BaseModel):
    Date: str = Field(alias="date")
    portfolio_value: float = Field(alias="value")
    signal: str = Field(default="hold")

    class Config:
        validate_by_name = True


class BacktestMetricsPydantic(BaseModel):
    total_return: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    total_trades: Optional[int] = 0
    winning_trades: Optional[int] = 0
    losing_trades: Optional[int] = 0
    strategy_name: str = "Moving Average Crossover"


class BacktestPydanticResult(BaseModel):
    """
    Document model for persisted backtest results.

    - `result` is a flexible dictionary accepting stats produced by either
    VectorizedBacktestResult.get_stats() or EventDrivenBacktestResult.get_stats().
    - `data` is optional and can store a time series (list of dicts
    with date/value) produced by get_portfolio_values().
    """

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str  # ID of the user who ran the backtest
    symbol: str  # Trading symbol (e.g., "AAPL")
    strategy: Dict[str, Any]  # Strategy parameters as dict
    # Basic performance metrics (kept for convenience/compatibility)
    total_return: Optional[float] = None
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    profit_factor: Optional[float] = None
    status: str = "success"
    # Optionally store time-series portfolio values as list of {"Date": ..., "portfolio_value": ...}
    data: Optional[List[Dict[str, Any]]] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class BacktestResponse(BaseModel):
    """
    Response model returned by the API, now aligned with BacktestResult structure.
    Includes core fields like status, strategy, data, and metrics for consistency.
    """

    id: str
    symbol: str
    status: str = "success"  # Default status for completed backtests
    strategy: Optional[MAStrategyPydantic] = None
    winning_trades: int = 0
    losing_trades: int = 0
    total_trades: int = 0
    profit_factor: Optional[float] = None
    data: List[PortfolioValuePydantic] = []
    metrics: BacktestMetricsPydantic = BacktestMetricsPydantic()
    created_at: datetime
    updated_at: datetime
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    profit_factor: Optional[float] = None

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
