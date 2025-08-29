# Backtesting Service

The Backtesting Service is a component of the financial prediction system designed to simulate trading strategies on historical financial data. It supports both vectorized and event-driven backtesting approaches, enabling users to evaluate the performance of trading strategies under various market conditions.

## Features

- **OHLCV Data Simulation**: Generate mock financial data for testing strategies.
- **Vectorized Backtesting**: High-performance backtesting using vectorized operations.
- **Event-Driven Backtesting**: Simulates real-world trading environments with event-based execution.
- **Moving Average Crossover Strategies**: Built-in support for testing crossover strategies.
- **REST and GraphQL APIs**: Expose backtesting functionality through APIs for integration with client applications.
- **Docker Support**: Easily deployable via Docker for consistent environments.

## Architecture

The service is structured into multiple layers:
- **API Gateway Layer**: Handles API requests and routes them to the appropriate endpoints.
- **API Layer**: Implements REST and GraphQL endpoints using FastAPI and Strawberry.
- **Service Layer**: Contains the core backtesting logic for vectorized and event-driven approaches.
- **Strategy Layer**: Defines trading strategies, including moving average crossovers.
- **Result Types**: Formats backtesting results for API responses.

Refer to the `architecture.mermaid` file for a detailed diagram of the system architecture.

## Prerequisites

- Python 3.9 or higher (for local development)
- Docker (for containerized deployment)
- Required dependencies listed in `requirements.txt` (automatically handled in Docker)

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd financial-prediction-system/services/backtesting
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Docker Deployment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd financial-prediction-system/services/backtesting
   ```

2. Ensure the `.env` file is present with required environment variables (e.g., MongoDB URI, Binance API URL).

3. Build the Docker image:
   ```bash
   docker build -t backtest:latest .
   ```

4. Run the container:
   ```bash
   docker run -p 5050:5050 --rm --env-file .env backtest:latest
   ```

   This command:
   - Maps port 5050 on the host to port 5050 in the container.
   - Uses `--rm` to automatically remove the container when it stops.
   - Loads environment variables from the `.env` file.
   - Runs the latest tagged image of the backtest service.

   The service will be accessible at `http://localhost:5050` for the REST API and `http://localhost:5050/graphql` for GraphQL.

## Usage

### Generating Mock Data

Run the `mockDataGenerator.py` script to generate mock OHLCV data:
```bash
python -m src/mockDataGenerator
```
The generated data will be saved to `src/data/mock_backtest_data.csv`.

### Running the Service

#### Local Development

Start the FastAPI server:
```bash
uvicorn src.backtest_API:app --reload
```

#### Using `run.py`

You can also use the `run.py` script to launch the backtesting service or execute specific tasks:
```bash
python run.py
```
Refer to the script's help or source code for available options and usage details.

#### Docker

After building and running the Docker container as described in the Installation section, the service will be running and ready to accept requests.

### Testing Strategies

Use the API to test trading strategies by providing the required parameters. Example strategies include:
- Moving Average Crossover
- Simple Buy-and-Hold

#### Example GraphQL Query

To test a vectorized backtest via GraphQL:

```graphql
mutation RunVectorizedBacktest($input: BacktestInput!) {
  run_vectorized_backtest(input: $input) {
    status
    strategy {
      fast_ma_period
      slow_ma_period
    }
    data {
      Date
      portfolio_value
    }
    metrics {
      total_return
      sharpe_ratio
      max_drawdown
      win_rate
      profit_factor
      total_trades
      winning_trades
      losing_trades
    }
  }
}
```

With variables:
```json
{
  "input": {
    "userId": "user123",
    "symbol": "BTCUSDT",
    "fetchInput": {
      "symbol": "BTCUSDT",
      "interval": "1d",
      "limit": 100,
      "startDate": "2023-01-01",
      "endDate": "2023-12-31"
    },
    "maCrossoverParams": {
      "fast": 10,
      "slow": 30
    },
    "period": "1D",
    "initCash": 10000.0,
    "fees": 0.001,
    "slippage": 0.001,
    "fixedSize": null,
    "percentSize": 0.1,
    "useFallback": true
  }
}
```

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
