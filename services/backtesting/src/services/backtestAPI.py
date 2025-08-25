from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import json
import uvicorn
from strawberry.fastapi import GraphQLRouter

# Use relative import for files in the same directory
from .backtestService import (
    BacktestServiceFactory,
    CrossoverMAStrategy,
    VectorizedBacktestResult,
)

# Import GraphQL schema
from ..models.backtest_schema import schema
app = FastAPI()


class BacktestVectorizedInput(BaseModel):
    data: list  # List of OHLCV data
    maCrossoverParams: Optional[dict] = (
        None  # Parameters for MA crossover strategy. For example fast 20, slow 50
    )
    period: str = "1D"
    initCash: float = 10000.0
    fees: float = 0.001
    slippage: float = 0.001
    fixedSize: Optional[bool] = None  # If True, use fixed size for vectorized backtest
    percentSize: Optional[float] = (
        None  # If fixedSize is False, use percentage size for vectorized backtest
    )
    useFallback: bool = (
        True  # If True, use fallback to change to another strategy(simple moving average) if the strategy fails
    )


@app.post("/backtest/vectorized")
async def run_vectorized_backtest(input: BacktestVectorizedInput):
    # Convert input data to DataFrame
    data = pd.DataFrame(input.data)
    data["Date"] = pd.to_datetime(data["Date"])
    data.set_index("Date", inplace=True)

    # Create backtest service instance
    service = BacktestServiceFactory.create_service("vectorized")
    # Create strategy with the provided parameters
    strategy = CrossoverMAStrategy(
        fast_ma_period=(
            input.maCrossoverParams.get("fast", 20) if input.maCrossoverParams else 20
        ),
        slow_ma_period=(
            input.maCrossoverParams.get("slow", 50) if input.maCrossoverParams else 50
        ),
    )

    # Set backtest parameters
    backtest_params = {
        "data": data,
        "strategy": strategy,
        "period": input.period,
        "init_cash": input.initCash,
        "fees": input.fees,
        "slippage": input.slippage,
        "fixed_size": input.fixedSize,
        "percent_size": input.percentSize,
        "use_fallback": input.useFallback,
    }

    # Run the backtest
    try:
        result: VectorizedBacktestResult = service.run_backtest(**backtest_params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Better format for GraphQL consumption - structured response with metadata
    return {
        "status": "success",
        "data": result.get_portfolio_values().to_dict(orient="records"),
        "metrics": result.get_stats(),  # Include performance metrics
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Add GraphQL endpoint
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

# To run the FastAPI server, use the command: uvicorn src.services.backtestAPI:app --reload --port 5050