import pandas as pd
import vectorbt as vbt
import numpy as np

# Set random seed for reproducibility
np.random.seed(42)


def vectorized_backtest_strategy(
    data,
    period="1D",
    init_cash=10000,
    fees=0.001,
    slippage=0.001,
    slow_ma_period=50,
    fast_ma_period=20,
):
    """
    Backtest a trading strategy using vectorbt.

    :param data: DataFrame containing OHLCV data.
    :param period: Frequency of the data (default is '1D').
    :param init_cash: Initial capital for backtesting (default is 10000).
    :param fees: Trading fees as a decimal (default is 0.001, which is 0.1%).
    :param slippage: Slippage as a decimal (default is 0.001, which is 0.1%).
    :param slow_ma_period: Period for slow moving average (default is 50).
    :param fast_ma_period: Period for fast moving average (default is 20).
    :return: Backtest results as a vbt.Portfolio object.
    """
    # Ensure data is in the correct format
    if not isinstance(data, pd.DataFrame):
        raise ValueError("Data must be a pandas DataFrame.")

    # Convert index to datetime if not already
    if not pd.api.types.is_datetime64_any_dtype(data.index):
        data.index = pd.to_datetime(data.index)
    # Data is likely daily, so resample is unnecessary
    fast_ma = data["Close"].rolling(window=fast_ma_period).mean()
    slow_ma = data["Close"].rolling(window=slow_ma_period).mean()
    # Print number of NaN values
    print(f"NaN values in fast MA: {fast_ma.isna().sum()}")
    print(f"NaN values in slow MA: {slow_ma.isna().sum()}")

    # A more complex strategy suggested by Copilot, originally using simple strategy, fast > slow: entries, fast < slow: exits
    # Check for valid signal data
    valid_idx = ~fast_ma.isna() & ~slow_ma.isna()
    print(f"Number of valid data points: {valid_idx.sum()}")
    
    # Check if any crossovers exist included previous day to avoid lookahead bias
    entries = (fast_ma.shift(1) <= slow_ma.shift(1)) & (fast_ma > slow_ma) & valid_idx
    exits = (fast_ma.shift(1) >= slow_ma.shift(1)) & (fast_ma < slow_ma) & valid_idx

    print(f"Number of entry signals: {entries.sum()}")
    print(f"Number of exit signals: {exits.sum()}")
    
    # If no signals were generated, create some basic signals for testing
    if entries.sum() == 0 and exits.sum() == 0:
        print("No signals detected - using simple strategy for testing")
        # Simple strategy: enter on first up day, exit on first down day
        entries = (data["Close"] > data["Close"].shift(1)) & valid_idx
        entries = entries & ~entries.shift(1, fill_value=False)  # Only enter on first up day
        exits = (data["Close"] < data["Close"].shift(1)) & valid_idx
        exits = exits & ~exits.shift(1, fill_value=False)  # Only exit on first down day
        print(f"New entry signals: {entries.sum()}, exit signals: {exits.sum()}")

    # Create a portfolio using vectorbt
    portfolio = vbt.Portfolio.from_signals(
        data["Close"],
        entries=entries,
        exits=exits,
        freq=period,
        init_cash=init_cash,
        fees=fees,
        slippage=slippage,
    )
    return portfolio
