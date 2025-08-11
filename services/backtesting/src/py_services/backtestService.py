import pandas as pd
import vectorbt as vbt
import numpy as np
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Union

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
        entries = (fast_ma.shift(1) <= slow_ma.shift(1)) & (fast_ma > slow_ma) & valid_idx
        exits = (fast_ma.shift(1) >= slow_ma.shift(1)) & (fast_ma < slow_ma) & valid_idx
        
        return entries, exits


class SimpleStrategy(TradingStrategy):
    """Simple up/down day strategy as fallback."""
    
    def get_strategy_name(self) -> str:
        return "Simple_UpDown_Strategy"
    
    def generate_signals(self, data: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
        valid_idx = ~data["Close"].isna() & ~data["Close"].shift(1).isna()
        
        entries = (data["Close"] > data["Close"].shift(1)) & valid_idx
        entries = entries & ~entries.shift(1, fill_value=False)  # Only enter on first up day
        
        exits = (data["Close"] < data["Close"].shift(1)) & valid_idx
        exits = exits & ~exits.shift(1, fill_value=False)  # Only exit on first down day
        
        return entries, exits


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


class BacktestResult:
    """Value object to store backtest results."""
    
    def __init__(self, portfolio: vbt.Portfolio, strategy_name: str):
        self.portfolio = portfolio
        self.strategy_name = strategy_name
        
    def get_stats(self) -> Dict[str, Any]:
        """Return key performance statistics."""
        stats = self.portfolio.stats()
        if stats is None:
            return {
                "strategy_name": self.strategy_name,
                "total_return": 0.0,
                "sharpe_ratio": 0.0,
                "max_drawdown": 0.0,
                "win_rate": 0.0
            }
        return {
            "strategy_name": self.strategy_name,
            "total_return": stats["Total Return [%]"],
            "sharpe_ratio": stats["Sharpe Ratio"],
            "max_drawdown": stats["Max Drawdown [%]"],
            "win_rate": stats["Win Rate [%]"]
        }
        
    def get_portfolio(self) -> vbt.Portfolio:
        """Return the raw portfolio object for custom analysis."""
        return self.portfolio


class BacktestService:
    """Service class for performing backtests using different approaches (vectorized and event-driven)."""
    
    def __init__(self):
        self.preprocessor = DataPreprocessor()
    
    def run_vectorized_backtest(
        self,
        data: pd.DataFrame,
        strategy: Optional[TradingStrategy] = None,
        period: str = "1D",
        init_cash: float = 10000,
        fees: float = 0.001,
        slippage: float = 0.001,
        use_fallback: bool = True
    ) -> BacktestResult:
        """
        Backtest a trading strategy using vectorized approach with vectorbt.

        Args:
            data: DataFrame containing OHLCV data.
            strategy: Strategy to use for generating signals (default is CrossoverMAStrategy).
            period: Frequency of the data (default is '1D').
            init_cash: Initial capital for backtesting (default is 10000).
            fees: Trading fees as a decimal (default is 0.001, which is 0.1%).
            slippage: Slippage as a decimal (default is 0.001, which is 0.1%).
            use_fallback: Whether to use fallback strategy if primary generates no signals.

        Returns:
            BacktestResult object containing the results.
        """
        # Set default strategy if none provided
        if strategy is None:
            strategy = CrossoverMAStrategy()
        
        # Preprocess data
        processed_data = self.preprocessor.validate_and_preprocess(data)
        
        # Generate signals from the strategy
        entries, exits = strategy.generate_signals(processed_data)
        
        # Log signal information
        print(f"Strategy: {strategy.get_strategy_name()}")
        print(f"Number of entry signals: {entries.sum()}")
        print(f"Number of exit signals: {exits.sum()}")
        
        # If no signals and fallback enabled, try fallback strategy
        if use_fallback and (entries.sum() == 0 or exits.sum() == 0):
            print("No signals detected - using simple strategy as fallback")
            fallback = SimpleStrategy()
            entries, exits = fallback.generate_signals(processed_data)
            strategy = fallback
            print(f"Fallback entry signals: {entries.sum()}, exit signals: {exits.sum()}")

        # Create a portfolio using vectorbt
        portfolio = vbt.Portfolio.from_signals(
            processed_data["Close"],
            entries=entries,
            exits=exits,
            freq=period,
            init_cash=init_cash,
            fees=fees,
            slippage=slippage,
        )
        
        return BacktestResult(portfolio, strategy.get_strategy_name())
    
    def run_event_driven_backtest(
        self,
        data: pd.DataFrame,
        strategy: Optional[TradingStrategy] = None,
        init_cash: float = 10000,
        fees: float = 0.001,
        slippage: float = 0.001,
        use_fallback: bool = True
    ) -> BacktestResult:
        """
        Backtest a trading strategy using event-driven approach.
        
        Args:
            data: DataFrame containing OHLCV data.
            strategy: Strategy to use for generating signals.
            init_cash: Initial capital for backtesting.
            fees: Trading fees as a decimal.
            slippage: Slippage as a decimal.
            
        Returns:
            BacktestResult object containing the results.
            
        Note:
            This method is currently not implemented and will be added in future updates.
        """
        # TODO: Implement event-driven backtesting logic
        # This would involve:
        # 1. Iterating through data row by row
        # 2. Maintaining portfolio state
        # 3. Processing events (signals, fills, etc.) as they occur
        # 4. Tracking performance metrics in real-time
        raise NotImplementedError("Event-driven backtesting is not yet implemented")
    
    # Keep the original method name for backward compatibility
    def run_backtest(self, *args, **kwargs) -> BacktestResult:
        """Alias for run_vectorized_backtest for backward compatibility."""
        return self.run_vectorized_backtest(*args, **kwargs)