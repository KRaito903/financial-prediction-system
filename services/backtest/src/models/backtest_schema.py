import strawberry
from typing import List, Optional, Dict, Any
import datetime
from ..resolvers.resolvers import QueryResolvers, MutationResolvers, EntityResolvers


# Input types
@strawberry.input
class OHLCVFetchInput:
    symbol: str
    interval: str = "1d"
    limit: int = 1000
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@strawberry.input
class MACrossoverParamsInput:
    fast: int = 20
    slow: int = 50


@strawberry.input
class BacktestInput:
    user_id: str
    symbol: str
    fetch_input: OHLCVFetchInput
    maCrossoverParams: Optional[MACrossoverParamsInput] = None
    modelFile: Optional[str] = None
    modelScalerFile: Optional[str] = None
    period: str = "1D"
    initCash: float = 10000.0
    fees: float = 0.001
    slippage: float = 0.001
    fixedSize: Optional[bool] = None
    percentSize: Optional[float] = None
    useFallback: bool = True


@strawberry.input
class HistoricalDataInput:
    user_id: str


# Remove federation from non-entity types - these are just regular types
@strawberry.type
class ModelInfo:
    filename: str
    file_path: str
    relative_path: str
    file_size: int
    created_time: float
    modified_time: float


@strawberry.type
class CoinList:
    coins: Optional[List[str]] = None


@strawberry.type
class OHLCVFetchResult:
    Date: str
    Open: float
    High: float
    Low: float
    Close: float
    Volume: float


@strawberry.type
class BacktestMetrics:
    strategy_name: str = "Moving Average Crossover"
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float


@strawberry.type
class PortfolioValue:
    Date: str
    portfolio_value: float
    signal: str = "hold"


@strawberry.type
class MAStrategy:
    fast_ma_period: int
    slow_ma_period: int


@strawberry.federation.type(keys=["id"])
class BacktestResult:
    id: str
    symbol: str
    status: str
    strategy: Optional[MAStrategy] = None
    data: List[PortfolioValue]
    metrics: BacktestMetrics
    created_at: datetime.datetime
    updated_at: datetime.datetime
    winning_trades: int
    losing_trades: int
    total_trades: int
    profit_factor: Optional[float] = None

    # Add reference resolver if this entity needs to be resolvable by other services
    @classmethod
    async def resolve_reference(cls, id: str) -> Optional["BacktestResult"]:
        """Resolve BacktestResult by ID for Apollo Federation."""
        return await EntityResolvers.resolve_backtest_result_reference(id)

# GraphQL schema
@strawberry.federation.type
class Query:
    @strawberry.field
    def health() -> str:
        return QueryResolvers.health()

    @strawberry.field
    async def fetch_ohlcv(self, input: OHLCVFetchInput) -> List[OHLCVFetchResult]:
        return await QueryResolvers.fetch_ohlcv(input)

    @strawberry.field
    async def fetch_coin_list(self) -> CoinList:
        return await QueryResolvers.fetch_coin_list()

    @strawberry.field
    async def fetch_backtest_history(
        self, input: HistoricalDataInput
    ) -> Optional[List[BacktestResult]]:
        return await QueryResolvers.fetch_backtest_history(input)

    @strawberry.field
    async def get_user_models(self, user_id: str) -> List[ModelInfo]:
        return await QueryResolvers.get_user_models(user_id)

@strawberry.federation.type
class Mutation:
    @strawberry.mutation
    async def run_vectorized_backtest(self, input: BacktestInput) -> BacktestResult:
        return await MutationResolvers.run_vectorized_backtest(input)

    @strawberry.mutation
    async def run_event_driven_backtest(self, input: BacktestInput) -> BacktestResult:
        return await MutationResolvers.run_event_driven_backtest(input)

    @strawberry.mutation
    async def run_ml_backtest(self, input: BacktestInput) -> BacktestResult:
        return await MutationResolvers.run_ml_backtest(input)


schema = strawberry.federation.Schema(
    query=Query, 
    mutation=Mutation, 
    enable_federation_2=True,
    types=[BacktestResult]
)