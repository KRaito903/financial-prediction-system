# This code generates mock OHLCV (Open, High, Low, Close, Volume) financial data for vectorized backtesting.
# It simulates a trading environment with daily price movements and saves the data to a CSV file
# for use in backtesting strategies.

import pandas as pd
import numpy as np


def generate_ohlcv_mock_data(
    n_days=1000,
    initial_price=100,
    mu=0.0008,
    sigma=0.018,
    intra_day_vol=0.008,
    base_volume=100000,
    volume_volatility=0.3,
    # Create stronger trend changes for MA crossovers
    trend_change_prob=0.06,  # Increased from 0.03
    trend_strength=0.004,  # Increased from 0.002
    jump_prob=0.02,  # Increased from 0.01
    jump_size=0.04,  # Increased from 0.03
    # Add parameter to control crossovers
    ma_crossover_pairs=[(20, 50), (50, 100), (50, 200), (100, 300)],
    ensure_crossovers=True,
):
    """
    Generate mock OHLCV financial data optimized for moving average crossovers.

    Parameters:
    - n_days (int): Number of business days to generate data for (default: 1000).
    - ma_crossover_pairs (list): List of moving average pairs to ensure crossovers for.
    - ensure_crossovers (bool): Whether to ensure crossovers for specified MA pairs.

    Returns:
    - pd.DataFrame: DataFrame with dates as index and columns for 'OPEN', 'HIGH', 'LOW', 'CLOSE', 'VOLUME'.
    """
    # Generate business days
    dates = pd.date_range(start="2020-01-01", periods=n_days, freq="B")

    # Initialize log returns array
    log_returns = np.zeros(n_days)

    # Generate stronger trends that will create crossovers
    current_trend = np.random.choice([-1, 1]) * trend_strength

    # Ensure we have at least one trend change every 30-50 days
    forced_trend_changes = np.zeros(n_days, dtype=bool)

    # Force trend changes to create crossovers
    if ensure_crossovers:
        # Find the largest slow MA period
        max_period = max([slow for _, slow in ma_crossover_pairs])

        # Force trend changes after each slow MA period
        for i in range(max_period, n_days, max(40, max_period // 2)):
            # Force a trend change here
            forced_trend_changes[i] = True

    # Generate log returns with trends and occasional jumps
    for i in range(n_days):
        # Check for trend change (either random or forced)
        if forced_trend_changes[i] or np.random.random() < trend_change_prob:
            # Reverse the trend direction for clearer crossovers
            current_trend = -current_trend

        # Base return with trend
        daily_return = np.random.normal(mu + current_trend, sigma)

        # Add occasional jumps (simulating news events)
        if np.random.random() < jump_prob:
            jump_direction = np.random.choice([-1, 1])
            daily_return += jump_direction * jump_size

        log_returns[i] = daily_return

    # Calculate close prices using cumulative sum of log returns
    close_prices = initial_price * np.exp(np.cumsum(log_returns))

    # Initialize other price arrays
    open_prices = np.zeros(n_days)
    high_prices = np.zeros(n_days)
    low_prices = np.zeros(n_days)
    volumes = np.zeros(n_days)

    # Set first open price and volume
    open_prices[0] = initial_price
    volumes[0] = base_volume

    # Generate open, high, low, and volume
    for i in range(1, n_days):
        open_prices[i] = close_prices[i - 1]
        vol_multiplier = 1.0
        if abs(log_returns[i]) > sigma * 2:
            vol_multiplier = 1.5
        volumes[i] = (
            base_volume * vol_multiplier * (1 + volume_volatility * np.random.randn())
        )

    for i in range(n_days):
        price1 = open_prices[i] * (1 + intra_day_vol * np.random.randn())
        price2 = open_prices[i] * (1 + intra_day_vol * np.random.randn())
        high_prices[i] = max(open_prices[i], close_prices[i], price1, price2)
        low_prices[i] = min(open_prices[i], close_prices[i], price1, price2)

    # Ensure volume is positive and rounded
    volumes = np.maximum(volumes, 0).round(0)

    # Create DataFrame
    df = pd.DataFrame(
        {
            "Open": open_prices,
            "High": high_prices,
            "Low": low_prices,
            "Close": close_prices,
            "Volume": volumes,
        },
        index=dates,
    )

    # Round price columns to 2 decimal places
    df[["Open", "High", "Low", "Close"]] = df[["Open", "High", "Low", "Close"]].round(2)

    # Verify crossovers exist for each MA pair
    if ensure_crossovers:
        for fast_period, slow_period in ma_crossover_pairs:
            fast_ma = df["Close"].rolling(window=fast_period).mean()
            slow_ma = df["Close"].rolling(window=slow_period).mean()

            # Check for crossovers
            entries = (fast_ma.shift(1) <= slow_ma.shift(1)) & (fast_ma > slow_ma)
            exits = (fast_ma.shift(1) >= slow_ma.shift(1)) & (fast_ma < slow_ma)

            print(
                f"MA {fast_period}/{slow_period}: {entries.sum()} entry signals, {exits.sum()} exit signals"
            )

    return df


# Generate the mock OHLCV data
df = generate_ohlcv_mock_data(
    n_days=1000, ma_crossover_pairs=[(20, 50), (50, 100), (50, 200), (100, 300)]
)

# Save to CSV for use in backtesting
df.to_csv("data/mock_backtest_data.csv", index_label="Date")

# Display the first few rows to verify
print(df.head())
