import strawberry
from typing import List, Optional, Dict, Any
from ..services.backtest_service import (
    BacktestServiceFactory,
    CrossoverMAStrategy,
)
import pandas as pd
from ..utils.mongodb_connector import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.backtest_model import BacktestPydanticResult
from ..services.backtest_database import BacktestDatabase, BacktestMapper


# Input types
@strawberry.input
class OHLCVDataInput:
    Date: str
    Open: float
    High: float
    Low: float
    Close: float
    Volume: float


@strawberry.input
class MACrossoverParamsInput:
    fast: int = 20
    slow: int = 50


@strawberry.input
class BacktestInput:
    user_id: str
    symbol: str
    data: List[OHLCVDataInput]
    maCrossoverParams: Optional[MACrossoverParamsInput] = None
    period: str = "1D"
    initCash: float = 10000.0
    fees: float = 0.001
    slippage: float = 0.001
    fixedSize: Optional[bool] = None
    percentSize: Optional[float] = None
    useFallback: bool = True


# Output types
@strawberry.type
class BacktestMetrics:
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    profit_factor: float
    total_trades: Optional[int] = None
    winning_trades: Optional[int] = None
    losing_trades: Optional[int] = None


@strawberry.type
class PortfolioValue:
    Date: str
    portfolio_value: float


# Add an explicit Strawberry type for the MA strategy so Strawberry can resolve fields
@strawberry.type
class MAStrategy:
    fast_ma_period: int
    slow_ma_period: int


@strawberry.type
class BacktestResult:
    status: str
    strategy: Optional[MAStrategy] = None
    data: List[PortfolioValue]
    metrics: BacktestMetrics


# Helper function to transform input data
def transform_input_data(input_data: List[OHLCVDataInput]) -> pd.DataFrame:
    data_dict_list = [
        {
            "Date": item.Date,
            "Open": item.Open,
            "High": item.High,
            "Low": item.Low,
            "Close": item.Close,
            "Volume": item.Volume,
        }
        for item in input_data
    ]
    data = pd.DataFrame(data_dict_list)
    data["Date"] = pd.to_datetime(data["Date"])
    data.set_index("Date", inplace=True)
    return data


# Abstracted backtest logic
# Abstracted backtest logic
async def run_and_save_backtest(service_type: str, input: BacktestInput) -> BacktestResult:
    # This is the unified function that both mutations will call
    service = BacktestServiceFactory.create_service(service_type)

    data = transform_input_data(input.data)
    ma_params = {
        "fast_ma_period": input.maCrossoverParams.fast if input.maCrossoverParams else 20,
        "slow_ma_period": input.maCrossoverParams.slow if input.maCrossoverParams else 50,
    }
    strategy = CrossoverMAStrategy(**ma_params)
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
        
        # Extract and format data for both GraphQL response and DB
        portfolio_values = result.get_portfolio_values()
        portfolio_data = [
            {"Date": str(date), "portfolio_value": float(row["value"])}
            for date, row in portfolio_values.iterrows()
        ]
        
        stats = result.get_stats()
        
        # Check if the result has a portfolio to get trades from
        if service_type == "vectorized":
            portfolio = result.get_portfolio()
            all_trades = portfolio.trades.records_readable if portfolio else pd.DataFrame()
            winning_trades = len(all_trades[all_trades["Return"] > 0])
            losing_trades = len(all_trades[all_trades["Return"] <= 0])
            total_trades = len(all_trades)
            win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0.0
        else:
            # Handle event-driven results which may not have a portfolio object
            winning_trades = stats.get("winning_trades", 0)
            losing_trades = stats.get("losing_trades", 0)
            total_trades = stats.get("total_trades", 0)
            win_rate = stats.get("win_rate", 0)

        # Create the GraphQL response object
        graphql_result = BacktestResult(
            status="success",
            data=[PortfolioValue(**pv) for pv in portfolio_data],
            metrics=BacktestMetrics(
                total_return=stats.get("total_return", 0.0),
                sharpe_ratio=stats.get("sharpe_ratio", 0.0),
                max_drawdown=stats.get("max_drawdown", 0.0),
                win_rate=win_rate,
                profit_factor=stats.get("profit_factor", 0.0),
                total_trades=total_trades,
                winning_trades=winning_trades,
                losing_trades=losing_trades,
            ),
            strategy=MAStrategy(**ma_params),
        )

        # Save to MongoDB
        db: AsyncIOMotorDatabase = get_database()
        mapper = BacktestMapper()
        database = BacktestDatabase(db, mapper)
        
        pydantic_result = {
            "user_id": input.user_id,
            "symbol": input.symbol,
            "strategy": input.maCrossoverParams.__dict__ if input.maCrossoverParams else {},
            "total_return": graphql_result.metrics.total_return,
            "total_trades": graphql_result.metrics.total_trades,
            "winning_trades": graphql_result.metrics.winning_trades,
            "losing_trades": graphql_result.metrics.losing_trades,
            "win_rate": graphql_result.metrics.win_rate,
            "result": stats,
            "portfolio_values": [{"date": pv.Date, "value": pv.portfolio_value} for pv in graphql_result.data],
        }
        backtest_doc = BacktestPydanticResult(**pydantic_result)
        
        insert_result = await database.insert_backtest(backtest_doc, input.user_id)
        if insert_result:
            print(f"Backtest result saved with ID: {insert_result.id}")
            
        return graphql_result

    except Exception as e:
        print(f"Error during backtest: {e}")
        return BacktestResult(
            status=f"error: {str(e)}",
            data=[],
            metrics=BacktestMetrics(
                total_return=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                win_rate=0.0,
                profit_factor=0.0,
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
            ),
            strategy=None,
        )


# GraphQL schema
@strawberry.type
class Query:
    @strawberry.field
    def health() -> str:
        return "GraphQL API is healthy"


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def run_vectorized_backtest(self, input: BacktestInput) -> BacktestResult:
        result: BacktestResult = await run_and_save_backtest("vectorized", input)
        return result

    @strawberry.mutation
    async def run_event_driven_backtest(self, input: BacktestInput) -> BacktestResult:
        result: BacktestResult = await run_and_save_backtest("event-driven", input)
        return result
    
schema = strawberry.Schema(query=Query, mutation=Mutation)