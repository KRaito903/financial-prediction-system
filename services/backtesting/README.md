# Backtesting Service

The Backtesting Service is a component of the financial prediction system designed to simulate trading strategies on historical financial data. It supports both vectorized and event-driven backtesting approaches, enabling users to evaluate the performance of trading strategies under various market conditions.

## Features

- **OHLCV Data Simulation**: Generate mock financial data for testing strategies.
- **Vectorized Backtesting**: High-performance backtesting using vectorized operations.
- **Event-Driven Backtesting**: Simulates real-world trading environments with event-based execution.
- **Moving Average Crossover Strategies**: Built-in support for testing crossover strategies.
- **REST and GraphQL APIs**: Expose backtesting functionality through APIs for integration with client applications.

## Architecture

The service is structured into multiple layers:
- **API Gateway Layer**: Handles API requests and routes them to the appropriate endpoints.
- **API Layer**: Implements REST and GraphQL endpoints using FastAPI and Strawberry.
- **Service Layer**: Contains the core backtesting logic for vectorized and event-driven approaches.
- **Strategy Layer**: Defines trading strategies, including moving average crossovers.
- **Result Types**: Formats backtesting results for API responses.

Refer to the `architecture.mermaid` file for a detailed diagram of the system architecture.

## Prerequisites

- Python 3.9 or higher
- Required dependencies listed in `requirements.txt`

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd financial-prediction-system/services/backtesting
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Generating Mock Data

Run the `mockDataGenerator.py` script to generate mock OHLCV data:
```bash
python -m src/mockDataGenerator
```
The generated data will be saved to `src/data/mock_backtest_data.csv`.

### Running the Service

Start the FastAPI server:
```bash
uvicorn src.main:app --reload
```

### Running with `run.py`

You can also use the `run.py` script to launch the backtesting service or execute specific tasks:
```bash
python run.py
```
Refer to the script's help or source code for available options and usage details.

### Testing Strategies

Use the API to test trading strategies by providing the required parameters. Example strategies include:
- Moving Average Crossover
- Simple Buy-and-Hold

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
