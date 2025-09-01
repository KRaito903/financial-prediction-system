import pandas as pd
import vectorbt as vbt
import backtrader as bt
import numpy as np
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, TypeVar, Generic
import joblib
import os
from sklearn.preprocessing import StandardScaler


# Set random seed for reproducibility
np.random.seed(42)


class TradingStrategy(ABC):
    """Base strategy interface following Interface Segregation Principle."""

    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
        """Generate entry and exit signals based on strategy logic."""
        pass

    @abstractmethod
    def get_strategy_name(self) -> str:
        """Return the name of the strategy."""
        pass


class CrossoverMAStrategy(TradingStrategy):
    """Moving Average Crossover Strategy implementation."""

    def __init__(self, fast_ma_period: int = 20, slow_ma_period: int = 50):
        self.fast_ma_period = fast_ma_period
        self.slow_ma_period = slow_ma_period

    def get_strategy_name(self) -> str:
        return f"MA_Crossover_{self.fast_ma_period}_{self.slow_ma_period}"

    def generate_signals(self, data: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
        # Calculate moving averages
        fast_ma = data["Close"].rolling(window=self.fast_ma_period).mean()
        slow_ma = data["Close"].rolling(window=self.slow_ma_period).mean()

        # Check for valid signal data
        valid_idx = ~fast_ma.isna() & ~slow_ma.isna()

        # Generate entry and exit signals
        entries = (
            (fast_ma.shift(1) <= slow_ma.shift(1)) & (fast_ma > slow_ma) & valid_idx
        )
        exits = (fast_ma.shift(1) >= slow_ma.shift(1)) & (fast_ma < slow_ma) & valid_idx

        return entries, exits


class SimpleStrategy(TradingStrategy):
    """Simple up/down day strategy as fallback."""

    def get_strategy_name(self) -> str:
        return "Simple_UpDown_Strategy"

    def generate_signals(self, data: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
        valid_idx = ~data["Close"].isna() & ~data["Close"].shift(1).isna()

        entries = (data["Close"] > data["Close"].shift(1)) & valid_idx
        entries = entries & ~entries.shift(
            1, fill_value=False
        )  # Only enter on first up day

        exits = (data["Close"] < data["Close"].shift(1)) & valid_idx
        exits = exits & ~exits.shift(1, fill_value=False)  # Only exit on first down day

        return entries, exits


class MLTradingStrategy(TradingStrategy):
    """Machine Learning based trading strategy."""

    def __init__(
        self,
        model_path: str,
        scaler_path: Optional[str] = None,
        feature_columns: Optional[list] = None,
        threshold: float = 0.5,
    ):
        """
        Initialize ML trading strategy.

        Args:
            model_path: Path to the saved ML model (pickle file)
            feature_columns: List of column names to use as features. If None, uses default OHLCV features
            threshold: Probability threshold for signal generation (default 0.5)
        """
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.feature_columns = feature_columns or [
            "Open",
            "High",
            "Low",
            "Close",
            "Volume",
        ]
        self.threshold = threshold
        self.model = None
        self.scaler = None
        self._load_model()

    def _load_model(self):
        """Load the ML model and scaler from disk."""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")

            # Load the model (assuming it's saved with joblib)
            self.model = joblib.load(self.model_path)
            if self.model is None:
                raise ValueError("Loaded model is None")
            else:
                print(self.model)
            # Try to load scaler if it exists (common pattern)
            scaler_path = self.scaler_path or self.model_path.replace(".pkl", "_scaler.pkl")
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                print(f"Scaler loaded from {scaler_path}")
                print(self.scaler)
            else:
                # Create a default scaler if none exists
                self.scaler = StandardScaler()
                print("No scaler found, using default StandardScaler")

        except Exception as e:
            raise ValueError(f"Failed to load ML model: {str(e)}")

    def _extract_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Extract features from OHLCV data for ML model."""
        features = data[self.feature_columns].copy()

        # Add some basic technical indicators as features
        if "Close" in features.columns:
            # Simple moving averages
            features["SMA_5"] = data["Close"].rolling(window=5).mean()
            features["SMA_10"] = data["Close"].rolling(window=10).mean()
            features["SMA_20"] = data["Close"].rolling(window=20).mean()

            # Price changes
            features["Returns"] = data["Close"].pct_change()
            features["Returns_5"] = data["Close"].pct_change(5)

            # Volatility
            features["Volatility_5"] = data["Close"].rolling(window=5).std()
            features["Volatility_10"] = data["Close"].rolling(window=10).std()

        if "Volume" in features.columns:
            # Volume indicators
            features["Volume_SMA_5"] = data["Volume"].rolling(window=5).mean()
            features["Volume_Ratio"] = (
                data["Volume"] / data["Volume"].rolling(window=5).mean()
            )

        # Fill NaN values
        features = features.bfill().ffill().fillna(0)

        return features

    def get_strategy_name(self) -> str:
        return f"ML_Model_{os.path.basename(self.model_path)}"

    def generate_signals(self, data: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
        """
        Generate trading signals using the ML model.

        The model should output probabilities or binary predictions.
        For binary classification:
        - 1 = Buy signal
        - 0 = Sell signal or hold

        For probability outputs, we use the threshold to determine signals.
        """
        if self.model is None:
            raise ValueError("ML model not loaded")

        # Extract features
        features = self._extract_features(data)

        # Scale features if scaler is available
        if self.scaler is not None:
            features_scaled = pd.DataFrame(
                self.scaler.transform(features),
                columns=features.columns,
                index=features.index,
            )
        else:
            features_scaled = features

        # Make predictions
        try:
            if hasattr(self.model, "predict_proba"):
                # Model supports probability predictions
                probabilities = self.model.predict_proba(features_scaled)
                if probabilities.shape[1] == 2:
                    # Binary classification - take probability of positive class
                    predictions = probabilities[:, 1]
                else:
                    # Multi-class - take highest probability
                    predictions = np.max(probabilities, axis=1)
            else:
                # Model only supports direct predictions
                predictions = self.model.predict(features_scaled)

            # Generate signals based on predictions
            if predictions.dtype in [np.float32, np.float64]:
                # Probability-based signals
                buy_signals = predictions > self.threshold
                sell_signals = predictions < (1 - self.threshold)
            else:
                # Binary classification signals
                buy_signals = predictions == 1
                sell_signals = predictions == 0

            # Convert to pandas Series with proper indexing
            entries = pd.Series(buy_signals, index=data.index, dtype=bool)
            exits = pd.Series(sell_signals, index=data.index, dtype=bool)

            # Clean up signals (avoid overlapping signals)
            # If we have a buy signal, don't sell on the same day
            exits = exits & ~entries

            return entries, exits

        except Exception as e:
            raise ValueError(f"Failed to generate signals with ML model: {str(e)}")


class DataPreprocessor:
    """Responsible for data validation and preprocessing."""

    @staticmethod
    def validate_and_preprocess(data: pd.DataFrame) -> pd.DataFrame:
        """Validate and preprocess input data."""
        # Ensure data is in the correct format
        if not isinstance(data, pd.DataFrame):
            raise ValueError("Data must be a pandas DataFrame.")

        # Ensure required columns exist
        required_columns = ["Close"]
        if not all(col in data.columns for col in required_columns):
            raise ValueError(f"Data must contain required columns: {required_columns}")

        # Make a copy to avoid modifying the original data
        processed_data = data.copy()

        # Convert index to datetime if not already
        if not pd.api.types.is_datetime64_any_dtype(processed_data.index):
            processed_data.index = pd.to_datetime(processed_data.index)

        return processed_data


class BacktestResult(ABC):
    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Return key performance statistics."""
        pass

    @abstractmethod
    def get_portfolio(self) -> Any:
        """Return the raw portfolio object for custom analysis."""
        pass


class VectorizedBacktestResult(BacktestResult):
    """Value object to store backtest results."""

    def __init__(
        self,
        portfolio: vbt.Portfolio,
        strategy_name: str,
        entries: Optional[pd.Series] = None,
        exits: Optional[pd.Series] = None,
    ):
        self.portfolio = portfolio
        self.strategy_name = strategy_name
        self.entries = entries
        self.exits = exits

    def get_stats(self) -> Dict[str, Any]:
        """Return key performance statistics."""
        stats = self.portfolio.stats()
        if stats is None:
            return {
                "strategy_name": self.strategy_name,
                "total_return": 0.0,
                "sharpe_ratio": 0.0,
                "max_drawdown": 0.0,
                "win_rate": 0.0,
            }
        return {
            "strategy_name": self.strategy_name,
            "total_return": stats["Total Return [%]"],
            "sharpe_ratio": stats["Sharpe Ratio"],
            "max_drawdown": stats["Max Drawdown [%]"],
            "win_rate": stats["Win Rate [%]"],
        }

    def get_portfolio(self) -> vbt.Portfolio:
        """Return the raw portfolio object for custom analysis."""
        return self.portfolio

    def get_portfolio_values(self) -> pd.DataFrame:
        """Return the portfolio values as a DataFrame."""
        if self.portfolio.value() is None:
            return pd.DataFrame(columns=["Date", "value"])
        return (
            self.portfolio.value()
            .to_frame(name="value")
            .reset_index()
            .rename(columns={"index": "Date"})
        )

    def get_portfolio_values_with_signals(self) -> pd.DataFrame:
        """Return the portfolio values with buy/sell signals as a DataFrame."""
        if self.portfolio.value() is None:
            return pd.DataFrame(columns=["Date", "value", "signal"])

        # Get portfolio values
        portfolio_df = (
            self.portfolio.value()
            .to_frame(name="value")
            .reset_index()
            .rename(columns={"index": "Date"})
        )

        # Add signal column
        portfolio_df["signal"] = "hold"

        # Add buy signals if available
        if self.entries is not None:
            buy_dates = self.entries[self.entries == True].index
            portfolio_df.loc[portfolio_df["Date"].isin(buy_dates), "signal"] = "buy"

        # Add sell signals if available (sell takes precedence over buy on same day)
        if self.exits is not None:
            sell_dates = self.exits[self.exits == True].index
            portfolio_df.loc[portfolio_df["Date"].isin(sell_dates), "signal"] = "sell"

        return portfolio_df


class EventDrivenBacktestResult(BacktestResult):
    """Value object to store event-driven backtest results."""

    def __init__(self, results: Dict[str, Any], strategy_name: str):
        """
        Initialize with backtrader results.

        Args:
            results: Dictionary containing backtrader results and metrics
            strategy_name: Name of the strategy used
        """
        self.results = results
        self.strategy_name = strategy_name

    def get_stats(self) -> Dict[str, Any]:
        """Return key performance statistics."""
        return {
            "strategy_name": self.strategy_name,
            "total_return": self.results.get("total_return", 0.0),
            "sharpe_ratio": self.results.get("sharpe_ratio", 0.0),
            "max_drawdown": self.results.get("max_drawdown", 0.0),
            "win_rate": self.results.get("win_rate", 0.0),
            "total_trades": self.results.get("total_trades", 0),
        }

    def get_portfolio(self) -> Dict[str, Any]:
        """Return the raw backtrader results for custom analysis."""
        return self.results

    def get_portfolio_values(self) -> pd.DataFrame:
        """Return the portfolio values as a DataFrame."""
        # Backtrader does not provide time series portfolio values directly
        # This is a placeholder implementation
        return pd.DataFrame(columns=["Date", "value"])

    def get_portfolio_values_with_signals(self) -> pd.DataFrame:
        """Return the portfolio values with signals as a DataFrame (event-driven doesn't support signals)."""
        # Event-driven backtests don't have signal data, so we return values without signals
        portfolio_df = self.get_portfolio_values()
        if not portfolio_df.empty:
            portfolio_df["signal"] = "hold"
        return portfolio_df


# Define a type variable for the result type
T = TypeVar("T", bound=BacktestResult)


class BacktestService(ABC, Generic[T]):
    """Abstract base class for backtest services."""

    def __init__(self, preprocessor: Optional[DataPreprocessor] = None):
        self.preprocessor = preprocessor or DataPreprocessor()

    @abstractmethod
    def run_backtest(
        self,
        data: pd.DataFrame,
        strategy: Optional[TradingStrategy] = None,
    ) -> T:
        """Run a backtest using the specified strategy and data."""
        pass


class VectorizedBacktestService(BacktestService[VectorizedBacktestResult]):
    """Service for vectorized backtesting using vectorbt."""

    def run_backtest(
        self,
        data: pd.DataFrame,
        strategy: Optional[TradingStrategy] = None,
        period: str = "1D",
        init_cash: float = 10000,
        fees: float = 0.001,
        slippage: float = 0.001,
        fixed_size: Optional[int] = None,
        percent_size: Optional[float] = None,
        use_fallback: bool = True,
    ) -> VectorizedBacktestResult:
        """
        Backtest a trading strategy using vectorized approach with vectorbt.

        Args:
            data: DataFrame containing OHLCV data.
            strategy: Strategy to use for generating signals (default is CrossoverMAStrategy).
            period: Frequency of the data (default is '1D').
            init_cash: Initial capital for backtesting (default is 10000).
            fees: Trading fees as a decimal (default is 0.001, which is 0.1%).
            slippage: Slippage as a decimal (default is 0.001, which is 0.1%).
            fixed_size: Fixed position size (number of shares/contracts).
            percent_size: Percentage of portfolio to allocate per position.
            use_fallback: Whether to use fallback strategy if primary generates no signals.

        Returns:
            VectorizedBacktestResult object containing the results.
        """
        # Set default strategy if none provided
        if strategy is None:
            strategy = CrossoverMAStrategy()

        # Preprocess data
        processed_data = self.preprocessor.validate_and_preprocess(data)

        # Generate signals from the strategy
        entries, exits = strategy.generate_signals(processed_data)

        # If no signals and fallback enabled, try fallback strategy
        if use_fallback and (entries.sum() == 0 or exits.sum() == 0):
            print("No signals detected - using simple strategy as fallback")
            fallback = SimpleStrategy()
            entries, exits = fallback.generate_signals(processed_data)
            strategy = fallback
            print(
                f"Fallback entry signals: {entries.sum()}, exit signals: {exits.sum()}"
            )

        # Check sizing parameters
        if fixed_size is not None and percent_size is not None:
            raise ValueError(
                "Cannot use both fixed size and percent size sizers at the same time."
            )

        # Create portfolio kwargs
        portfolio_kwargs = {
            "close": processed_data["Close"],
            "entries": entries,
            "exits": exits,
            "freq": period,
            "init_cash": init_cash,
            "fees": fees,
            "slippage": slippage,
        }

        # Add sizing parameter if provided
        if fixed_size is not None:
            portfolio_kwargs["size"] = fixed_size
        elif percent_size is not None:
            portfolio_kwargs["size"] = percent_size

        # Create portfolio
        portfolio = vbt.Portfolio.from_signals(**portfolio_kwargs)
        return VectorizedBacktestResult(
            portfolio, strategy.get_strategy_name(), entries, exits
        )


# Backtrader strategy that works with our TradingStrategy interface
class BacktraderStrategyAdapter(bt.Strategy):
    """Adapter to use our TradingStrategy with Backtrader."""

    params = (
        ("trading_strategy", None),
        ("data", None),
    )

    def __init__(self):
        self.trading_strategy = getattr(self.params, "trading_strategy", None)
        self.data_feed = getattr(self.params, "data", None)
        self.order = None

        # Generate signals using our trading strategy
        if self.trading_strategy and self.data_feed is not None:
            self.entries, self.exits = self.trading_strategy.generate_signals(
                self.data_feed
            )
        else:
            self.entries = pd.Series()
            self.exits = pd.Series()
    
    def notify_order(self, order):
        """Called when order status changes"""
        if order.status in [order.Completed, order.Canceled, order.Rejected]:
            self.order = None  # Clear the order when it's no longer pending
    
    def next(self):
        if self.order:
            return
            
        # Get current date from backtrader
        current_date = self.data.datetime.datetime(0)
        
        # Look up signals for this specific date
        if current_date in self.entries.index:
            # Check entry signal for this specific date
            if self.entries.loc[current_date]:
                self.order = self.buy()
                print(f"BUY at {current_date}, price: {self.data.close[0]}")
                
        if current_date in self.exits.index:
            # Check exit signal for this specific date
            if self.exits.loc[current_date] and self.position:
                self.order = self.sell()
                print(f"SELL at {current_date}, price: {self.data.close[0]}")


class EventDrivenBacktestService(BacktestService[EventDrivenBacktestResult]):
    """Service for event-driven backtesting using Backtrader."""

    def run_backtest(
        self,
        data: pd.DataFrame,
        strategy: Optional[TradingStrategy] = None,
        init_cash: float = 10000,
        fees: float = 0.001,
        slippage: float = 0.001,
        fixed_size: Optional[int] = None,
        percent_size: Optional[float] = None,
        period: str = "1D",
        use_fallback: bool = True,
    ) -> EventDrivenBacktestResult:
        """
        Backtest a trading strategy using event-driven approach.

        Args:
            data: DataFrame containing OHLCV data.
            strategy: Strategy to use for generating signals.
            init_cash: Initial capital for backtesting.
            fees: Trading fees as a decimal.
            slippage: Slippage as a decimal.
            fixed_size: Number of shares/contracts to trade.
            percent_size: Percentage of portfolio to allocate per position.
            period: Frequency of the data. Not directly used in Backtrader but kept for interface consistency.
            use_fallback: Whether to use fallback strategy if primary generates no signals.

        Returns:
            EventDrivenBacktestResult object containing the results.
        """
        # Preprocess data
        processed_data = self.preprocessor.validate_and_preprocess(data)

        # Set default strategy if none provided
        if strategy is None:
            strategy = CrossoverMAStrategy()

        # Generate signals
        entries, exits = strategy.generate_signals(processed_data)

        # If no signals and fallback enabled, try fallback strategy
        if use_fallback and (entries.sum() == 0 or exits.sum() == 0):
            print("No signals detected - using simple strategy as fallback")
            fallback = SimpleStrategy()
            entries, exits = fallback.generate_signals(processed_data)
            strategy = fallback
            print(
                f"Fallback entry signals: {entries.sum()}, exit signals: {exits.sum()}"
            )

        # Check sizing parameters
        if fixed_size is not None and percent_size is not None:
            raise ValueError(
                "Cannot use both fixed size and percent size sizers at the same time."
            )

        # Setup Cerebro engine
        cerebro = bt.Cerebro()

        # Add our strategy wrapped in the adapter
        cerebro.addstrategy(
            BacktraderStrategyAdapter, trading_strategy=strategy, data=processed_data
        )

        # Set broker parameters
        cerebro.broker.setcash(init_cash)
        cerebro.broker.setcommission(commission=fees)
        cerebro.broker.set_slippage_perc(slippage)

        # Add sizing if provided
        if fixed_size is not None:
            cerebro.addsizer(bt.sizers.FixedSize, stake=fixed_size)
        elif percent_size is not None:
            cerebro.addsizer(bt.sizers.PercentSizer, percents=percent_size * 100)

        # Add analyzers
        cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe")
        cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name="trades")
        cerebro.addanalyzer(bt.analyzers.Returns, _name="returns")
        cerebro.addanalyzer(bt.analyzers.SQN, _name="sqn")

        # Run the backtest
        results = cerebro.run()

        if len(results) == 0:
            # No results, return default values
            return EventDrivenBacktestResult(
                results={
                    "final_value": init_cash,
                    "initial_value": init_cash,
                    "total_return": 0.0,
                    "sharpe_ratio": 0.0,
                    "max_drawdown": 0.0,
                    "win_rate": 0.0,
                    "total_trades": 0,
                },
                strategy_name=strategy.get_strategy_name(),
            )

        # Get the first strategy from results
        strat = results[0]

        # Extract metrics from analyzers
        final_value = cerebro.broker.getvalue()

        # Get metrics from analyzers if available
        sharpe = 0.0
        if hasattr(strat.analyzers, "sharpe"):
            sharpe_analyzer = strat.analyzers.sharpe.get_analysis()
            if hasattr(sharpe_analyzer, "sharperatio"):
                sharpe = sharpe_analyzer.sharperatio

        drawdown = 0.0
        if hasattr(strat.analyzers, "drawdown"):
            dd_analyzer = strat.analyzers.drawdown.get_analysis()
            if hasattr(dd_analyzer, "max"):
                drawdown = dd_analyzer.max.drawdown

        win_rate = 0.0
        total_trades = 0
        if hasattr(strat.analyzers, "trades"):
            trades_analyzer = strat.analyzers.trades.get_analysis()
            total = trades_analyzer.get("total", {}).get("total", 0)
            if total > 0:
                won = trades_analyzer.get("won", {}).get("total", 0)
                win_rate = (won / total) * 100
            total_trades = total

        # Create and return the result object
        return EventDrivenBacktestResult(
            results={
                "final_value": final_value,
                "initial_value": init_cash,
                "total_return": (final_value - init_cash) / init_cash * 100,
                "sharpe_ratio": sharpe,
                "max_drawdown": drawdown,
                "win_rate": win_rate,
                "total_trades": total_trades,
            },
            strategy_name=strategy.get_strategy_name(),
        )


class MLBacktestService(BacktestService[VectorizedBacktestResult]):
    """Service for backtesting using custom machine learning models."""

    def run_backtest(
        self,
        data: pd.DataFrame,
        strategy: Optional[TradingStrategy] = None,
        period: str = "1D",
        init_cash: float = 10000,
        fees: float = 0.001,
        slippage: float = 0.001,
        fixed_size: Optional[int] = None,
        percent_size: Optional[float] = None,
        model_path: Optional[str] = None,
        feature_columns: Optional[list] = None,
        threshold: float = 0.5,
    ) -> VectorizedBacktestResult:
        """
        Backtest a custom ML model strategy.

        Args:
            data: DataFrame containing OHLCV data.
            strategy: TradingStrategy instance (should be MLTradingStrategy).
            model_path: Path to the saved ML model file (alternative to strategy).
            feature_columns: List of column names to use as features.
            threshold: Probability threshold for signal generation.
            period: Frequency of the data (default is '1D').
            init_cash: Initial capital for backtesting (default is 10000).
            fees: Trading fees as a decimal (default is 0.001, which is 0.1%).
            slippage: Slippage as a decimal (default is 0.001, which is 0.1%).
            fixed_size: Fixed position size (number of shares/contracts).
            percent_size: Percentage of portfolio to allocate per position.

        Returns:
            VectorizedBacktestResult object containing the results.
        """
        # Create ML strategy if not provided
        if strategy is None:
            if model_path is None:
                raise ValueError("Either strategy or model_path must be provided")
            strategy = MLTradingStrategy(
                model_path=model_path,
                feature_columns=feature_columns,
                threshold=threshold,
            )
        # Ensure it's an ML strategy
        if not isinstance(strategy, MLTradingStrategy):
            raise ValueError("Strategy must be an instance of MLTradingStrategy")

        # Preprocess data
        processed_data = self.preprocessor.validate_and_preprocess(data)

        # Generate signals from the ML strategy
        entries, exits = strategy.generate_signals(processed_data)

        # Check sizing parameters
        if fixed_size is not None and percent_size is not None:
            raise ValueError(
                "Cannot use both fixed size and percent size sizers at the same time."
            )

        # Create portfolio kwargs
        portfolio_kwargs = {
            "close": processed_data["Close"],
            "entries": entries,
            "exits": exits,
            "freq": period,
            "init_cash": init_cash,
            "fees": fees,
            "slippage": slippage,
        }

        # Add sizing parameter if provided
        if fixed_size is not None:
            portfolio_kwargs["size"] = fixed_size
        elif percent_size is not None:
            portfolio_kwargs["size"] = percent_size

        # Create portfolio
        portfolio = vbt.Portfolio.from_signals(**portfolio_kwargs)
        return VectorizedBacktestResult(
            portfolio, strategy.get_strategy_name(), entries, exits
        )


class BacktestServiceFactory:
    """Factory for creating backtest services."""

    @staticmethod
    def create_service(service_type: str) -> BacktestService:
        """Create a backtest service of the specified type."""
        if service_type.lower() == "vectorized":
            return VectorizedBacktestService()
        elif service_type.lower() == "event-driven":
            return EventDrivenBacktestService()
        elif service_type.lower() in ["model", "ml"]:
            return MLBacktestService()
        else:
            raise ValueError(f"Unknown backtest service type: {service_type}")
