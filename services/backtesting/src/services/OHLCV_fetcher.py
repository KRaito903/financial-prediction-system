import requests
import pandas as pd
from datetime import datetime, timedelta
import time
import os
from dotenv import load_dotenv

load_dotenv()


class BinanceOHLCV:
    def __init__(self):
        self.base_url = os.getenv("BINANCE_API_URL", "https://api.binance.com")
        self.session = requests.Session()

    def get_ohlcv(
        self, symbol, interval, limit=1000, start_time=None, end_time=None
    ) -> list[dict]:
        """
        Get OHLCV data from Binance API

        Args:
            symbol (str): Trading pair symbol (e.g., 'BTCUSDT')
            interval (str): Kline interval ('1m', '5m', '1h', '1d', etc.)
            limit (int): Number of records (max 1000)
            start_time (int): Start time (Unix timestamp in ms)
            end_time (int): End time (Unix timestamp in ms)

        Returns:
            list of dict: List of OHLCV data points
        """
        url = f"{self.base_url}/api/v3/klines"
        if start_time is None:
            start_time = int(
                (datetime.now() - timedelta(days=limit)).timestamp() * 1000
            )  # Default to 'limit' days ago in ms
        if end_time is None:
            end_time = int(datetime.now().timestamp() * 1000)  # Current time in ms
        params = {
            "symbol": symbol,
            "interval": interval,
            "startTime": start_time,
            "endTime": end_time,
            "limit": limit,
        }
        response = self.session.get(url, params=params)
        data = response.json()

        if response.status_code != 200:
            raise Exception(f"Error fetching data: {data}")

        ohlcv = []
        for entry in data:
            ohlcv.append(
                {
                    "Date": datetime.fromtimestamp(entry[0] / 1000),
                    "Open": float(entry[1]),
                    "High": float(entry[2]),
                    "Low": float(entry[3]),
                    "Close": float(entry[4]),
                    "Volume": float(entry[5]),
                }
            )
        return ohlcv
