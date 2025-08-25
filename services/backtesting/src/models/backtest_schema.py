import strawberry
from typing import List, Optional
from ..services.backtestService import BacktestServiceFactory, BacktestService, CrossoverMAStrategy
import pandas as pd


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


@strawberry.type
class PortfolioValue:
    Date: str
    portfolio_value: float


@strawberry.type
class BacktestResult:
    status: str
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
def run_backtest(service: BacktestService, input: BacktestInput) -> BacktestResult:
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

        portfolio_values = result.get_portfolio_values()
        portfolio_data = [
            PortfolioValue(Date=str(date), portfolio_value=float(row["value"]))
            for date, row in portfolio_values.iterrows()
        ]

        stats = result.get_stats()
        metrics = BacktestMetrics(
            total_return=stats.get("total_return", 0.0),
            sharpe_ratio=stats.get("sharpe_ratio", 0.0),
            max_drawdown=stats.get("max_drawdown", 0.0),
            win_rate=stats.get("win_rate", 0.0),
            profit_factor=stats.get("profit_factor", 0.0),
        )

        return BacktestResult(status="success", data=portfolio_data, metrics=metrics)

    except Exception as e:
        return BacktestResult(
            status=f"error: {str(e)}",
            data=[],
            metrics=BacktestMetrics(
                total_return=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                win_rate=0.0,
                profit_factor=0.0,
            ),
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
    def run_vectorized_backtest(self, input: BacktestInput) -> BacktestResult:
        service = BacktestServiceFactory.create_service("vectorized")
        return run_backtest(service, input)

    @strawberry.mutation
    def run_event_driven_backtest(self, input: BacktestInput) -> BacktestResult:
        service = BacktestServiceFactory.create_service("event-driven")
        return run_backtest(service, input)


schema = strawberry.Schema(query=Query, mutation=Mutation)