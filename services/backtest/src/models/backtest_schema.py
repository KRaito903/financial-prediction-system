import strawberry
from typing import List, Optional, Dict, Any
import pandas as pd
from ..services.backtest_service import (
    BacktestServiceFactory,
    CrossoverMAStrategy,
)
from ..utils.mongodb_connector import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.backtest_model import BacktestPydanticResult
from ..services.backtest_database import BacktestDatabase, BacktestMapper
from ..utils.OHLCV_fetcher import BinanceOHLCV
from ..utils.coint_list_fetcher import CoinListFetcher
from ..utils.uploader import uploader
import datetime
from ..services.backtest_service import MLTradingStrategy
import requests
import os
from ..utils.file_cacher import file_cacher


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


@strawberry.type
class ModelInfo:
    filename: str
    file_path: str
    relative_path: str
    file_size: int
    created_time: float
    modified_time: float


# Output types
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


# Add an explicit Strawberry type for the MA strategy so Strawberry can resolve fields
@strawberry.type
class MAStrategy:
    fast_ma_period: int
    slow_ma_period: int


@strawberry.type
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


# Helper function to transform input data
def transform_input_data(input_data: List[OHLCVFetchResult]) -> pd.DataFrame:
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


async def fetch_ohlcv_data(
    symbol: str,
    interval: str,
    limit: int = 1000,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """_summary_

    Args:
        symbol (str): Pair of coins symbol (e.g., 'BTCUSDT')
        interval (str): Kline interval ('1m', '5m', '1h', '1d', etc.)
        limit (int, optional): _description_. Defaults to 1000.
        start_date (str, optional): Start date in 'YYYY-MM-DD' format. Defaults to None.
        end_date (str, optional): End date in 'YYYY-MM-DD' format. Defaults

    Returns:
        list[dict]: List of OHLCV data points
    """
    fetcher = BinanceOHLCV()
    start_date_unix = (
        int(datetime.datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
        if start_date
        else None
    )
    end_date_unix = (
        int(datetime.datetime.strptime(end_date, "%Y-%m-%d").timestamp() * 1000)
        if end_date
        else None
    )
    data = await fetcher.get_ohlcv(
        symbol,
        interval,
        limit=limit,
        start_time=start_date_unix,
        end_time=end_date_unix,
    )
    return data


# Abstracted backtest logic
async def run_and_save_backtest(
    service_type: str, input: BacktestInput
) -> BacktestResult:
    """Unified function for running and saving both regular and ML backtests."""

    # Determine if this is an ML backtest
    is_ml_backtest = input.modelFile is not None

    # Create appropriate service
    if is_ml_backtest:
        service = BacktestServiceFactory.create_service("ml")
    else:
        service = BacktestServiceFactory.create_service(service_type)

    # Always fetch OHLCV data
    fetched_data = await fetch_ohlcv_data(
        symbol=input.fetch_input.symbol,
        interval=input.fetch_input.interval,
        limit=input.fetch_input.limit,
        start_date=input.fetch_input.start_date,
        end_date=input.fetch_input.end_date,
    )

    # Transform fetched data to DataFrame
    data_dict_list = [
        {
            "Date": item["Date"],
            "Open": item["Open"],
            "High": item["High"],
            "Low": item["Low"],
            "Close": item["Close"],
            "Volume": item["Volume"],
        }
        for item in fetched_data
    ]
    data = pd.DataFrame(data_dict_list)
    data["Date"] = pd.to_datetime(data["Date"])
    data.set_index("Date", inplace=True)

    # Create strategy based on input type
    if is_ml_backtest and input.modelFile is not None:
        # Get the model URL from Supabase storage
        model_path = uploader.get_model_path(input.user_id, input.modelFile)
        scaler_path = None

        if input.modelScalerFile:
            scaler_path = uploader.get_model_path(input.user_id, input.modelScalerFile)
            print(f"Using scaler from Supabase: {input.modelScalerFile}")

        print(f"Using model from Supabase: {input.modelFile}")

        if not model_path:
            # Return error result directly instead of raising an exception
            return BacktestResult(
                id="",
                symbol=input.symbol,
                status=f"error: Model file {input.modelFile} not found in storage",
                data=[],
                metrics=BacktestMetrics(
                    total_return=0.0,
                    sharpe_ratio=0.0,
                    max_drawdown=0.0,
                    win_rate=0.0,
                ),
                strategy=None,
                profit_factor=0.0,
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                created_at=datetime.datetime.utcnow(),
                updated_at=datetime.datetime.utcnow(),
            )

        try:
            # Create user directory if it doesn't exist
            storage_base_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage"
            )
            user_model_dir = os.path.join(storage_base_dir, input.user_id)
            print(f"User model directory: {user_model_dir}")
            os.makedirs(user_model_dir, exist_ok=True)

            # Create paths for persistent storage
            model_filename = os.path.basename(input.modelFile)
            local_model_path = os.path.join(user_model_dir, model_filename)

            # Check if model file already exists in cache
            cached_model_path = await file_cacher.get_cached_file(
                f"{input.user_id}_{model_filename}"
            )

            if cached_model_path and os.path.exists(cached_model_path):
                print(f"Using cached model file: {cached_model_path}")
                local_model_path = cached_model_path
                # Update last_used time for the cached file
                await file_cacher.cache_file(
                    f"{input.user_id}_{model_filename}", local_model_path
                )
            else:
                # Download model from URL to persistent storage
                response = requests.get(model_path, stream=True)
                response.raise_for_status()  # Will raise an exception for HTTP errors

                # Write content to persistent file
                with open(local_model_path, "wb") as model_file:
                    for chunk in response.iter_content(chunk_size=8192):
                        model_file.write(chunk)

                print(f"Model saved to: {local_model_path}")

                # Cache the file path for future use
                await file_cacher.cache_file(
                    f"{input.user_id}_{model_filename}", local_model_path
                )

            local_scaler_path = None
            if scaler_path and input.modelScalerFile:
                scaler_filename = os.path.basename(input.modelScalerFile)
                local_scaler_path = os.path.join(user_model_dir, scaler_filename)

                # Check if scaler file already exists in cache
                cached_scaler_path = await file_cacher.get_cached_file(
                    f"{input.user_id}_{scaler_filename}"
                )

                if cached_scaler_path and os.path.exists(cached_scaler_path):
                    print(f"Using cached scaler file: {cached_scaler_path}")
                    local_scaler_path = cached_scaler_path
                    # Update last_used time for the cached file
                    await file_cacher.cache_file(
                        f"{input.user_id}_{scaler_filename}", local_scaler_path
                    )
                else:
                    # Download scaler from URL to persistent storage
                    response = requests.get(scaler_path, stream=True)
                    response.raise_for_status()

                    # Write content to persistent file
                    with open(local_scaler_path, "wb") as scaler_file:
                        for chunk in response.iter_content(chunk_size=8192):
                            scaler_file.write(chunk)

                    print(f"Scaler saved to: {local_scaler_path}")

                    # Cache the file path for future use
                    await file_cacher.cache_file(
                        f"{input.user_id}_{scaler_filename}", local_scaler_path
                    )

            # Use local file paths for the strategy
            strategy = MLTradingStrategy(
                model_path=local_model_path,
                scaler_path=local_scaler_path,
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
            }

        except requests.RequestException as e:
            return BacktestResult(
                id="",
                symbol=input.symbol,
                status=f"error: Failed to download model file: {str(e)}",
                data=[],
                metrics=BacktestMetrics(
                    total_return=0.0,
                    sharpe_ratio=0.0,
                    max_drawdown=0.0,
                    win_rate=0.0,
                ),
                strategy=None,
                profit_factor=0.0,
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                created_at=datetime.datetime.utcnow(),
                updated_at=datetime.datetime.utcnow(),
            )
        except Exception as e:
            return BacktestResult(
                id="",
                symbol=input.symbol,
                status=f"error: Failed to prepare ML model: {str(e)}",
                data=[],
                metrics=BacktestMetrics(
                    total_return=0.0,
                    sharpe_ratio=0.0,
                    max_drawdown=0.0,
                    win_rate=0.0,
                ),
                strategy=None,
                profit_factor=0.0,
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                created_at=datetime.datetime.utcnow(),
                updated_at=datetime.datetime.utcnow(),
            )
    else:
        # Regular backtest
        ma_params = {
            "fast_ma_period": (
                input.maCrossoverParams.fast if input.maCrossoverParams else 20
            ),
            "slow_ma_period": (
                input.maCrossoverParams.slow if input.maCrossoverParams else 50
            ),
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
        # For event-driven backtests, use regular portfolio values without signals
        if service_type == "event-driven":
            portfolio_values = result.get_portfolio_values()
            portfolio_data = [
                {
                    "Date": str(date),
                    "portfolio_value": float(row["value"]),
                    "signal": "hold",
                }
                for date, row in portfolio_values.iterrows()
            ]
        else:
            # For vectorized and ML backtests, use signals
            portfolio_values = result.get_portfolio_values_with_signals()
            portfolio_data = []

            # Check the structure of the DataFrame to handle dates properly
            for _, row in portfolio_values.iterrows():
                # Handle case where date might be in index or in column with different name
                if isinstance(portfolio_values.index, pd.DatetimeIndex):
                    date_value = str(row.name)  # Use index as date
                elif "Date" in row:
                    date_value = str(row["Date"])
                elif "Date" in row:
                    date_value = str(row["Date"])
                else:
                    # Fallback to first column or current date if no date found
                    date_value = (
                        str(row.iloc[0])
                        if len(row) > 0
                        else str(datetime.datetime.now())
                    )

                portfolio_data.append(
                    {
                        "Date": date_value,
                        "portfolio_value": float(row.get("value", 0.0)),
                        "signal": str(row.get("signal", "hold")),
                    }
                )

        stats = result.get_stats()

        # Check if the result has a portfolio to get trades from
        if service_type in ["vectorized", "ml"] or is_ml_backtest:
            portfolio = result.get_portfolio()
            all_trades = (
                portfolio.trades.records_readable if portfolio else pd.DataFrame()
            )
            winning_trades = len(all_trades[all_trades["Return"] > 0])
            losing_trades = len(all_trades[all_trades["Return"] <= 0])
            total_trades = len(all_trades)
            win_rate = (
                (winning_trades / total_trades) * 100 if total_trades > 0 else 0.0
            )
        else:
            # Handle event-driven results which may not have a portfolio object
            winning_trades = stats.get("winning_trades", 0)
            losing_trades = stats.get("losing_trades", 0)
            total_trades = stats.get("total_trades", 0)
            win_rate = stats.get("win_rate", 0)

        # Create strategy info for GraphQL response
        if is_ml_backtest:
            strategy_info = None  # ML models don't have MA parameters
        else:
            ma_params = {
                "fast_ma_period": (
                    input.maCrossoverParams.fast if input.maCrossoverParams else 20
                ),
                "slow_ma_period": (
                    input.maCrossoverParams.slow if input.maCrossoverParams else 50
                ),
            }
            strategy_info = MAStrategy(**ma_params)

        # Create the GraphQL response object
        graphql_result = BacktestResult(
            id="",  # Placeholder, as mutations don't have an ID yet; can be set if needed
            symbol=input.symbol,
            status="success",
            data=[PortfolioValue(**pv) for pv in portfolio_data],
            metrics=BacktestMetrics(
                total_return=stats.get("total_return", 0.0),
                sharpe_ratio=stats.get("sharpe_ratio", 0.0),
                max_drawdown=stats.get("max_drawdown", 0.0),
                win_rate=win_rate,
            ),
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            total_trades=total_trades,
            profit_factor=stats.get("profit_factor", None),
            strategy=strategy_info,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow(),
        )

        # Save to MongoDB
        db: AsyncIOMotorDatabase = get_database()
        mapper = BacktestMapper()
        database = BacktestDatabase(db, mapper)

        # Fix strategy dict keys to match expected model attributes
        strategy_dict = {}
        if not is_ml_backtest and input.maCrossoverParams:
            strategy_dict = {
                "fast_ma_period": input.maCrossoverParams.fast,
                "slow_ma_period": input.maCrossoverParams.slow,
            }
        else:
            # For ML backtests or when no MA params are provided, use default values
            # to satisfy the schema validation requirements
            strategy_dict = {
                "fast_ma_period": 0,  # Default value for ML models
                "slow_ma_period": 0,  # Default value for ML models
            }

        pydantic_result = {
            "user_id": input.user_id,
            "symbol": input.symbol,
            "strategy": strategy_dict,
            "total_return": graphql_result.metrics.total_return,
            "total_trades": graphql_result.total_trades,
            "winning_trades": graphql_result.winning_trades,
            "losing_trades": graphql_result.losing_trades,
            "win_rate": graphql_result.metrics.win_rate,
            "sharpe_ratio": stats.get("sharpe_ratio", 0.0),
            "max_drawdown": stats.get("max_drawdown", 0.0),
            "profit_factor": stats.get("profit_factor", 0.0),
            "metrics": {**stats, "strategy_name": strategy.get_strategy_name()},
            "data": [
                {
                    "Date": pv.Date,
                    "portfolio_value": pv.portfolio_value,
                    "signal": pv.signal,
                }
                for pv in graphql_result.data
            ],
        }
        backtest_doc = BacktestPydanticResult(**pydantic_result)

        insert_result = await database.insert_backtest(backtest_doc, input.user_id)
        if insert_result:
            print(f"Backtest result saved with ID: {insert_result.id}")
            graphql_result.id = str(insert_result.id)  # Update ID after saving

        return graphql_result

    except Exception as e:
        print(f"Error during backtest: {e}")
        return BacktestResult(
            id="",
            symbol=input.symbol,
            status=f"error: {str(e)}",
            data=[],
            metrics=BacktestMetrics(
                total_return=0.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                win_rate=0.0,
            ),
            strategy=None,
            profit_factor=0.0,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow(),
        )


# GraphQL schema
@strawberry.type
class Query:
    @strawberry.field
    def health() -> str:
        return "GraphQL API is healthy"

    @strawberry.field
    async def fetch_ohlcv(self, input: OHLCVFetchInput) -> List[OHLCVFetchResult]:
        data = await fetch_ohlcv_data(
            symbol=input.symbol,
            interval=input.interval,
            limit=input.limit,
            start_date=input.start_date,
            end_date=input.end_date,
        )
        return [
            OHLCVFetchResult(
                **{
                    "Date": str(item["Date"]),
                    "Open": item["Open"],
                    "High": item["High"],
                    "Low": item["Low"],
                    "Close": item["Close"],
                    "Volume": item["Volume"],
                }
            )
            for item in data
        ]

    @strawberry.field
    async def fetch_coin_list(self) -> CoinList:
        fetcher = CoinListFetcher()
        coins = await fetcher.fetch_coin_list()
        return CoinList(coins=coins)

    @strawberry.field
    async def fetch_backtest_history(
        self, input: HistoricalDataInput
    ) -> Optional[List[BacktestResult]]:
        mapper = BacktestMapper()
        db: AsyncIOMotorDatabase = get_database()
        database = BacktestDatabase(db, mapper)
        backtests = await database.list_backtests_for_user(input.user_id)
        if not backtests:
            return []
        results = []
        for bt in backtests:
            strategy = (
                MAStrategy(
                    fast_ma_period=bt.strategy.fast_ma_period if bt.strategy else 20,
                    slow_ma_period=bt.strategy.slow_ma_period if bt.strategy else 50,
                )
                if bt.strategy
                else None
            )
            portfolios = [
                PortfolioValue(Date=pv.Date, portfolio_value=pv.portfolio_value)
                for pv in bt.data
            ]
            metrics = BacktestMetrics(
                total_return=bt.metrics.total_return,
                sharpe_ratio=bt.metrics.sharpe_ratio,
                max_drawdown=bt.metrics.max_drawdown,
                win_rate=bt.metrics.win_rate or 0.0,
                strategy_name=bt.metrics.strategy_name,
            )
            result = BacktestResult(
                id=str(bt.id),
                symbol=bt.symbol,
                status="success",
                strategy=strategy,
                data=portfolios,
                metrics=metrics,
                winning_trades=bt.winning_trades,
                losing_trades=bt.losing_trades,
                total_trades=bt.total_trades,
                profit_factor=bt.profit_factor,
                created_at=bt.created_at,
                updated_at=bt.updated_at,
            )

            results.append(result)
        return results

    @strawberry.field
    async def get_user_models(self, user_id: str) -> List[ModelInfo]:
        """Get list of ML models uploaded by a user."""
        models = uploader.get_user_models(user_id)
        return [
            ModelInfo(
                filename=model["filename"],
                file_path=model["file_path"],
                relative_path=model["relative_path"],
                file_size=model["file_size"],
                created_time=model["created_time"],
                modified_time=model["modified_time"],
            )
            for model in models
        ]


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

    @strawberry.mutation
    async def run_ml_backtest(self, input: BacktestInput) -> BacktestResult:
        result: BacktestResult = await run_and_save_backtest("vectorized", input)
        return result


schema = strawberry.Schema(query=Query, mutation=Mutation)
