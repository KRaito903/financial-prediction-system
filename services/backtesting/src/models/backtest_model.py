from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from vectorbt import Trades


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



class BacktestPydanticResult(BaseModel):
    """
    Document model for persisted backtest results.

    - `result` is a flexible dictionary accepting stats produced by either
    VectorizedBacktestResult.get_stats() or EventDrivenBacktestResult.get_stats().
    - `portfolio_values` is optional and can store a time series (list of dicts
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

    # Flexible result field to accommodate either backtest result type
    result: Dict[str, Any] = Field(default_factory=dict)
    # Optionally store time-series portfolio values as list of {"date": ..., "value": ...}
    portfolio_values: Optional[List[Dict[str, Any]]] = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class BacktestResponse(BaseModel):
    """
    Response model returned by the API. `result` mirrors the flexible stats dict
    from the backtest implementations. `win_rate` is preserved for convenience,
    but if missing the client can use `result.get('win_rate')`.
    """

    id: str
    symbol: str
    strategy: Dict[str, Any]
    trades: List[Dict[str, Any]] = []
    total_return: Optional[float]
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: Optional[float] = None  # Calculated field (kept for compatibility)
    result: Optional[Dict[str, Any]] = None
    portfolio_values: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    @property
    def win_rate_calc(self) -> Optional[float]:
        """Calculate win rate; fallback to `result['win_rate']` if available."""
        if self.total_trades > 0:
            return (self.winning_trades / self.total_trades) * 100
        if self.result:
            try:
                val = self.result.get("win_rate")
                if val is not None:
                    return float(val)
            except Exception:
                pass
        return
