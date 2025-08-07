from py_services.backtestService import vectorized_backtest_strategy as vbt_strategy
import pandas as pd
import matplotlib
import tkinter as tk

matplotlib.use("TkAgg")  # Use the Tkinter GUI backend
import matplotlib.pyplot as plt
import os
from pathlib import Path

# Load mock data
current_dir = Path(__file__).resolve().parent
mock_data_path = current_dir.parent / "data" / "mock_backtest_data.csv"
if not os.path.exists(mock_data_path):
    raise FileNotFoundError(f"Mock data file not found at {mock_data_path}")

data = pd.read_csv(mock_data_path, index_col="Date", parse_dates=True)

portfolio = vbt_strategy(
    data=data,
    period="1D",
    init_cash=10000,
    fees=0.001,
    slippage=0.001,
    slow_ma_period=50,
    fast_ma_period=20,
)

# Display portfolio statistics
print(portfolio.stats())
# Display portfolio value over time
portfolio_value = portfolio.value()
portfolio_value.plot(title="Portfolio Value Over Time")
plt.show()
