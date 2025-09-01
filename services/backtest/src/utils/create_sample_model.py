import asyncio
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from OHLCV_fetcher import BinanceOHLCV

async def main():
    fetcher = BinanceOHLCV()
    symbol = "BTCUSDT"
    interval = "1d"
    limit = 1000
    data = await fetcher.get_ohlcv(symbol, interval, limit)
    
    df = pd.DataFrame(data)
    df.set_index("Date", inplace=True)
    
    # Features similar to MLTradingStrategy
    df["SMA_5"] = df["Close"].rolling(5).mean()
    df["SMA_10"] = df["Close"].rolling(10).mean()
    df["SMA_20"] = df["Close"].rolling(20).mean()
    df["Returns"] = df["Close"].pct_change()
    df["Returns_5"] = df["Close"].pct_change(5)
    df["Volatility_5"] = df["Close"].rolling(5).std()
    df["Volatility_10"] = df["Close"].rolling(10).std()
    df["Volume_SMA_5"] = df["Volume"].rolling(5).mean()
    df["Volume_Ratio"] = df["Volume"] / df["Volume_SMA_5"]
    
    feature_cols = [
        "Open", "High", "Low", "Close", "Volume",
        "SMA_5", "SMA_10", "SMA_20",
        "Returns", "Returns_5",
        "Volatility_5", "Volatility_10",
        "Volume_SMA_5", "Volume_Ratio"
    ]
    
    # Target: 1 if next close > close (buy), 0 otherwise (sell)
    df["Target"] = (df["Close"].shift(-1) > df["Close"]).astype(int)
    
    df = df.dropna()
    
    X = df[feature_cols]
    y = df["Target"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    predictions = model.predict(X_test_scaled)
    print(f"Accuracy: {accuracy_score(y_test, predictions):.2f}")
    
    model_dir = "storage/sample_models"
    model_filename = "rf_model.pkl"
    model_path = f"{model_dir}/{model_filename}"
    scaler_path = f"{model_dir}/rf_model_scaler.pkl"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"Model saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")

if __name__ == "__main__":
    asyncio.run(main())