from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
# Use relative import for files in the same directory
from .backtestService import (
    BacktestServiceFactory,
    CrossoverMAStrategy,
    VectorizedBacktestResult
)
import pandas as pd
import json
import uvicorn


app = FastAPI()
class BacktestVectorizedInput(BaseModel):
    data: list # List of OHLCV data
    maCrossoverParams: Optional[dict] = None # Parameters for MA crossover strategy. For example fast 20, slow 50
    period: str = "1D"
    initCash: float = 10000.0
    fees: float = 0.001
    slippage: float = 0.001
    fixedSize: Optional[bool] = None # If True, use fixed size for vectorized backtest
    percentSize: Optional[float] = None # If fixedSize is False, use percentage size for vectorized backtest
    useFallback: bool = True # If True, use fallback to change to another strategy(simple moving average) if the strategy fails
    
@app.post("/backtest/vectorized")
async def run_vectorized_backtest(input: BacktestVectorizedInput):
    # Convert input data to DataFrame
    data = pd.DataFrame(input.data)
    data['Date'] = pd.to_datetime(data['Date'])
    data.set_index('Date', inplace=True)

    # Create backtest service instance
    service = BacktestServiceFactory.create_service("vectorized")
    # Create strategy with the provided parameters
    strategy = CrossoverMAStrategy(
        fast_ma_period=input.maCrossoverParams.get('fast', 20) if input.maCrossoverParams else 20,
        slow_ma_period=input.maCrossoverParams.get('slow', 50) if input.maCrossoverParams else 50,
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
        "use_fallback": input.useFallback
    }
    
    # Run the backtest
    result: VectorizedBacktestResult = service.run_backtest(**backtest_params)

    # Return the result as a dictionary
    result_json = result.get_portfolio_values().to_dict(orient='records')
    return json.dumps(result_json, indent=2)
  
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
  
    
if __name__ == "__main__":
    uvicorn.run(app, host="1127.0.0.1", port=5050)
# To run the FastAPI server, use the command: