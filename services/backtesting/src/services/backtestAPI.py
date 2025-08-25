from fastapi import FastAPI, HTTPException
from strawberry.fastapi import GraphQLRouter
from ..models.backtest_schema import schema, BacktestInput  # Import BacktestInput from schema
from ..services.backtestService import BacktestServiceFactory, CrossoverMAStrategy
import pandas as pd

app = FastAPI()


@app.post("/backtest/vectorized")
async def run_vectorized_backtest(input: BacktestInput):  # Use BacktestInput
    # Convert input data to DataFrame
    data = pd.DataFrame([vars(item) for item in input.data])  # Convert Strawberry input to dict
    data["Date"] = pd.to_datetime(data["Date"])
    data.set_index("Date", inplace=True)

    # Create backtest service instance
    service = BacktestServiceFactory.create_service("vectorized")
    strategy = CrossoverMAStrategy(
        fast_ma_period=input.maCrossoverParams.fast if input.maCrossoverParams else 20,
        slow_ma_period=input.maCrossoverParams.slow if input.maCrossoverParams else 50,
    )

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

    try:
        result = service.run_backtest(**backtest_params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "success",
        "data": result.get_portfolio_values().to_dict(orient="records"),
        "metrics": result.get_stats(),
    }


@app.post("/backtest/event-driven")
async def run_event_driven_backtest(input: BacktestInput):  # Use BacktestInput
    # Convert input data to DataFrame
    data = pd.DataFrame([vars(item) for item in input.data])  # Convert Strawberry input to dict
    data["Date"] = pd.to_datetime(data["Date"])
    data.set_index("Date", inplace=True)

    # Create backtest service instance
    service = BacktestServiceFactory.create_service("event-driven")
    strategy = CrossoverMAStrategy(
        fast_ma_period=input.maCrossoverParams.fast if input.maCrossoverParams else 20,
        slow_ma_period=input.maCrossoverParams.slow if input.maCrossoverParams else 50,
    )

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

    try:
        result = service.run_backtest(**backtest_params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "success",
        "data": result.get_portfolio_values().to_dict(orient="records"),
        "metrics": result.get_stats(),
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Add GraphQL endpoint
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

# To run the FastAPI server, use the command: uvicorn src.services.backtestAPI:app --reload --port 5050
# Or use the run.py script for more options