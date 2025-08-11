import pandas as pd
import matplotlib
matplotlib.use("TkAgg")  # Use the Tkinter GUI backend
import matplotlib.pyplot as plt
import os
from pathlib import Path
from py_services.backtestService import (
    BacktestServiceFactory,
    CrossoverMAStrategy,
    VectorizedBacktestResult,
    EventDrivenBacktestResult
)

# Load mock data
current_dir = Path(__file__).resolve().parent
mock_data_path = current_dir.parent / "data" / "mock_backtest_data.csv"
if not os.path.exists(mock_data_path):
    raise FileNotFoundError(f"Mock data file not found at {mock_data_path}")

data = pd.read_csv(mock_data_path, index_col="Date", parse_dates=True)

# Create strategy with the same parameters for both backtests
strategy = CrossoverMAStrategy(fast_ma_period=20, slow_ma_period=50)

# Common backtest parameters
backtest_params = {
    "data": data,
    "strategy": strategy,
    "period": "1D",
    "init_cash": 100000,
    "fees": 0.01,
    "slippage": 0.01,
}

# Create backtest services using the factory
vectorized_service = BacktestServiceFactory.create_service("vectorized")
event_driven_service = BacktestServiceFactory.create_service("event_driven")

# Run both backtests
vectorized_result = vectorized_service.run_backtest(**backtest_params)
event_driven_result = event_driven_service.run_backtest(**backtest_params)

# Display results
print("\n" + "="*50)
print("VECTORIZED BACKTEST RESULTS")
print("="*50)
print(vectorized_result.get_stats())

print("\n" + "="*50)
print("EVENT-DRIVEN BACKTEST RESULTS")
print("="*50)
print(event_driven_result.get_stats())

# Create a figure with two subplots for comparing results
plt.figure(figsize=(12, 10))

# Plot vectorized backtest portfolio value
plt.subplot(2, 1, 1)
if isinstance(vectorized_result, VectorizedBacktestResult):
    portfolio = vectorized_result.get_portfolio()
    portfolio_value = portfolio.value()
    portfolio_value.plot(title="Vectorized Backtest - Portfolio Value")
    plt.grid(True)
    plt.ylabel("Value ($)")

# Plot event-driven backtest portfolio value
plt.subplot(2, 1, 2)
if isinstance(event_driven_result, EventDrivenBacktestResult):
    # For event-driven, we need to extract and reconstruct the portfolio value
    results = event_driven_result.get_portfolio()
    plt.title("Event-Driven Backtest - Final Portfolio Value")
    plt.bar(['Initial Value', 'Final Value'], 
            [results.get('initial_value', 0), results.get('final_value', 0)],
            color=['blue', 'green'])
    plt.grid(True, axis='y')
    plt.ylabel("Value ($)")

plt.tight_layout()
plt.show()

# Performance comparison table
print("\n" + "="*50)
print("PERFORMANCE COMPARISON")
print("="*50)
vec_stats = vectorized_result.get_stats()
event_stats = event_driven_result.get_stats()

comparison = pd.DataFrame({
    'Vectorized': [
        vec_stats.get('total_return', 0),
        vec_stats.get('sharpe_ratio', 0),
        vec_stats.get('max_drawdown', 0),
        vec_stats.get('win_rate', 0)
    ],
    'Event-Driven': [
        event_stats.get('total_return', 0),
        event_stats.get('sharpe_ratio', 0),
        event_stats.get('max_drawdown', 0),
        event_stats.get('win_rate', 0)
    ]
}, index=['Total Return (%)', 'Sharpe Ratio', 'Max Drawdown (%)', 'Win Rate (%)'])

print(comparison)
