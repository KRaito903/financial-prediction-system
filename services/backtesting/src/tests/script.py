import pandas as pd
import matplotlib
matplotlib.use("TkAgg")  # Use the Tkinter GUI backend
import matplotlib.pyplot as plt
import os
from pathlib import Path
from py_services.backtestService import BacktestService, CrossoverMAStrategy

# Load mock data
current_dir = Path(__file__).resolve().parent
mock_data_path = current_dir.parent / "data" / "mock_backtest_data.csv"
if not os.path.exists(mock_data_path):
    raise FileNotFoundError(f"Mock data file not found at {mock_data_path}")

data = pd.read_csv(mock_data_path, index_col="Date", parse_dates=True)

# Create backtest service and strategy
service = BacktestService()
strategy = CrossoverMAStrategy(fast_ma_period=50, slow_ma_period=200)

# Run the backtest
backtest_result = service.run_vectorized_backtest(
    data=data,
    strategy=strategy,
    period="1D",
    init_cash=100000,
    fees=0.01,
    slippage=0.01,
)

# Display portfolio statistics
print(backtest_result.get_stats())

# Display portfolio value over time
portfolio = backtest_result.get_portfolio()
portfolio_value = portfolio.value()
portfolio_value.plot(title="Portfolio Value Over Time")
plt.show()
