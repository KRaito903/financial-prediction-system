# Backtesting Service

The Backtesting Service is a component of the financial prediction system designed to simulate trading strategies on historical financial data. It supports both vectorized and event-driven backtesting approaches, enabling users to evaluate the performance of trading strategies under various market conditions.

## Features

- **OHLCV Data Simulation**: Generate mock financial data for testing strategies.
- **Vectorized Backtesting**: High-performance backtesting using vectorized operations.
- **Event-Driven Backtesting**: Simulates real-world trading environments with event-based execution.
- **Moving Average Crossover Strategies**: Built-in support for testing crossover strategies.
- **Machine Learning Model Integration**: Upload and test custom ML models for trading signals.
- **REST and GraphQL APIs**: Expose backtesting functionality through APIs for integration with client applications.
- **File Upload Management**: FastAPI REST endpoints for uploading and managing ML model files.
- **Docker Support**: Easily deployable via Docker for consistent environments.

## Machine Learning Backtest Service

The service now supports custom machine learning models for generating trading signals. This feature allows users to upload trained ML models and evaluate their performance on historical data.

### Key Features

- **Model Format Support**: Compatible with scikit-learn models saved via joblib or pickle
- **File Upload API**: REST endpoints for model file management and backtesting
- **Automatic Feature Engineering**: Generates technical indicators from OHLCV data
- **Flexible Signal Generation**: Supports both binary classification and probability-based signals
- **Threshold Configuration**: Adjustable probability thresholds for signal generation
- **Same Result Format**: Returns data in the same format as other backtest services
- **Automatic Cleanup**: Temporary files are automatically removed after processing

### Supported Model Types

- Binary Classification: Models that predict buy (1) or sell/hold (0) signals
- Probability Models: Models with `predict_proba()` method for confidence-based signals
- Regression Models: Using threshold on continuous predictions

### Supported File Formats

- `.pkl` (Pickle)
- `.joblib` (Joblib)
- `.h5` (HDF5/Keras)
- `.pb` (TensorFlow)
- `.onnx` (ONNX)
- `.pt`, `.pth` (PyTorch)

### Automatic Features Generated

- Simple Moving Averages (SMA_5, SMA_10, SMA_20)
- Price Returns (daily and 5-day)
- Volatility measures (5-day and 10-day rolling std)
- Volume indicators (SMA and ratio)
- All original OHLCV data

## API Endpoints

### ML Model Management (REST API)

#### 1. Upload Model File
**POST** `/api/models/upload`

Upload an ML model file for a specific user.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: The model file (required)
  - `user_id`: User ID (required)
  - `model_name`: Custom model name (optional)

**Response:**
```json
{
  "success": true,
  "message": "Model uploaded successfully",
  "data": {
    "filename": "user123_MyModel_uuid.pkl",
    "original_filename": "my_model.pkl",
    "file_path": "/path/to/storage/user123/user123_MyModel_uuid.pkl",
    "relative_path": "storage/user123/user123_MyModel_uuid.pkl",
    "file_size": 1024,
    "user_id": "user123",
    "model_name": "MyModel",
    "file_extension": ".pkl"
  }
}
```

#### 2. Get User Models
**GET** `/api/models/user/{user_id}`

Retrieve all models uploaded by a specific user.

#### 3. Delete Model
**DELETE** `/api/models/user/{user_id}/model/{filename}`

Delete a specific model file.

#### 4. Get Model Path
**GET** `/api/models/user/{user_id}/model/{filename}/path`

Get the file system path for a specific model.

#### 5. ML Backtest with File Upload
**POST** `/api/models/backtest/ml`

Run an ML backtest with an uploaded model file.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: ML model file (required)
  - `user_id`: User ID (required)
  - `symbol`: Trading symbol, e.g., 'BTCUSDT' (required)
  - `interval`: Kline interval, e.g., '1d' (default: '1d')
  - `limit`: Number of data points (default: 1000)
  - `threshold`: ML prediction threshold (default: 0.5)
  - `period`: Backtest period (default: '1D')
  - `init_cash`: Initial cash (default: 10000.0)
  - `fees`: Trading fees (default: 0.001)
  - `slippage`: Slippage (default: 0.001)
  - Additional parameters for position sizing and date ranges

### GraphQL API

#### ML Backtest with File Upload (GraphQL)
```graphql
mutation RunMLBacktestWithFile($file: Upload!, $input: MLBacktestInput!) {
  run_ml_backtest_with_file(ml_model_file: $file, input: $input) {
    id
    symbol
    status
    data {
      Date
      portfolio_value
      signal
    }
    metrics {
      strategy_name
      total_return
      sharpe_ratio
      max_drawdown
      win_rate
    }
    winning_trades
    losing_trades
    total_trades
    profit_factor
  }
}
```

#### Traditional ML Backtest (GraphQL)
```graphql
mutation RunMLBacktest($input: MLBacktestInput!) {
  runMlBacktest(input: $input) {
    id
    symbol
    status
    metrics {
      totalReturn
      sharpeRatio
      maxDrawdown
      winRate
    }
    data {
      Date
      portfolioValue
    }
    totalTrades
    winningTrades
    losingTrades
  }
}
```

#### Vectorized Backtest (GraphQL)
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
      signal
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

## Usage Examples

### JavaScript/TypeScript (REST API)

```javascript
// Upload a model
const uploadModel = async (file, userId, modelName) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);
  if (modelName) formData.append('model_name', modelName);

  const response = await fetch('/api/models/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
};

// Run ML backtest with file
const runMLBacktest = async (file, backtestParams) => {
  const formData = new FormData();
  formData.append('file', file);
  
  Object.keys(backtestParams).forEach(key => {
    formData.append(key, backtestParams[key]);
  });

  const response = await fetch('/api/models/backtest/ml', {
    method: 'POST',
    body: formData,
  });

  return response.json();
};
```

### Python (REST API)

```python
import requests

# Upload a model
def upload_model(file_path, user_id, model_name=None):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'user_id': user_id}
        if model_name:
            data['model_name'] = model_name
        
        response = requests.post('/api/models/upload', files=files, data=data)
        return response.json()

# Run ML backtest
def run_ml_backtest(file_path, **params):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post('/api/models/backtest/ml', files=files, data=params)
        return response.json()
```

### GraphQL Examples

#### ML Backtest with File Upload
```javascript
const mutation = `
  mutation RunMLBacktestWithFile($file: Upload!, $input: MLBacktestInput!) {
    run_ml_backtest_with_file(ml_model_file: $file, input: $input) {
      id
      symbol
      status
      metrics {
        total_return
        sharpe_ratio
        max_drawdown
        win_rate
      }
    }
  }
`;

const formData = new FormData();
formData.append('operations', JSON.stringify({
  query: mutation,
  variables: {
    file: null,
    input: {
      user_id: "user123",
      symbol: "BTCUSDT",
      fetch_input: {
        symbol: "BTCUSDT",
        interval: "1d",
        limit: 1000
      },
      threshold: 0.6,
      feature_columns: ["Open", "High", "Low", "Close", "Volume"],
      initCash: 10000.0
    }
  }
}));

formData.append('map', JSON.stringify({ "0": ["variables.file"] }));
formData.append('0', modelFile);

fetch('http://localhost:5050/graphql', {
  method: 'POST',
  body: formData
});
```

#### Traditional ML Backtest with Model Path
```json
{
  "input": {
    "userId": "user123",
    "symbol": "BTCUSDT",
    "fetchInput": {
      "symbol": "BTCUSDT",
      "interval": "1d",
      "limit": 1000
    },
    "mlModel": {
      "modelPath": "/path/to/your/model.pkl",
      "featureColumns": ["Open", "High", "Low", "Close", "Volume"],
      "threshold": 0.6
    },
    "period": "1D",
    "initCash": 10000.0,
    "fees": 0.001,
    "slippage": 0.001
  }
}
```

## ML Model Requirements

Your ML model should:

1. **Accept OHLCV features**: The model will receive features extracted from OHLCV data
2. **Return predictions**: Either binary predictions (0/1) or probabilities
3. **Be compatible with scikit-learn**: Models should have `.predict()` or `.predict_proba()` methods
4. **Be properly serialized**: Use joblib, pickle, or other supported formats

### Example Model Structure
```python
# Features that will be automatically generated:
features = [
    'Open', 'High', 'Low', 'Close', 'Volume',  # Original OHLCV
    'SMA_5', 'SMA_10', 'SMA_20',              # Moving averages
    'Returns', 'Returns_5',                    # Price changes
    'Volatility_5', 'Volatility_10',          # Volatility measures
    'Volume_SMA_5', 'Volume_Ratio'            # Volume indicators
]

# Your model should be trained on similar features
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier()
model.fit(X_train, y_train)  # y_train: 1 for buy, 0 for sell/hold

# Save model
import joblib
joblib.dump(model, 'my_trading_model.pkl')
```

## Trading Signal Generation

The ML strategy generates signals based on your model's predictions:

- **Probability models**: Uses threshold (default 0.5) to determine buy/sell signals
- **Binary models**: Uses 1 for buy, 0 for sell/hold signals
- **Signal logic**: Avoids overlapping buy/sell signals on the same day

### Signal Indicators

The backtest results include signal indicators for each data point:

- **`"buy"`**: Indicates a buy signal was generated on this date
- **`"sell"`**: Indicates a sell signal was generated on this date  
- **`"hold"`**: No trading signal was generated (default for all other data points)

This allows you to see exactly when the strategy would have entered or exited positions.

## Architecture

The service is structured into multiple layers:
- **API Gateway Layer**: Handles API requests and routes them to the appropriate endpoints.
- **API Layer**: Implements REST and GraphQL endpoints using FastAPI and Strawberry.
- **Service Layer**: Contains the core backtesting logic for vectorized and event-driven approaches.
- **Strategy Layer**: Defines trading strategies, including moving average crossovers and ML models.
- **Result Types**: Formats backtesting results for API responses.
- **File Management**: Handles model file uploads, storage, and cleanup.

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
python run.py dev  # Development mode
python run.py prod  # Production mode
```
Refer to the script's help or source code for available options and usage details.

#### Docker

After building and running the Docker container as described in the Installation section, the service will be running and ready to accept requests.

The GraphQL interface will be available at: http://localhost:5050/graphql

### Testing

Run the test script to verify REST API endpoints:
```bash
python test_upload_api.py
```

Make sure the FastAPI server is running on the expected port (default: 5050).

## Migration Notes

### API Architecture Changes

The service now supports both REST and GraphQL APIs:

- **REST API**: Optimized for file uploads and model management
- **GraphQL API**: Maintained for backward compatibility and complex queries

### Benefits of Dual API Support

1. **Better File Handling**: FastAPI's native file upload support for REST endpoints
2. **Improved Performance**: Direct file streaming without GraphQL overhead
3. **Easier Client Integration**: Standard REST API with multipart/form-data
4. **Better Error Handling**: HTTP status codes and detailed error messages
5. **Backward Compatibility**: Existing GraphQL clients continue to work

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
