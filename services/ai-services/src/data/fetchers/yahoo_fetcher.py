from .base_fetcher import DataFetchStrategy
import yfinance as yf
import pandas as pd

class YahooFetchStrategy(DataFetchStrategy):
    def fetch_data(self, **kwargs) -> pd.DataFrame:
        """
        Fetch dữ liệu từ Yahoo Finance API
        """
        try:
            symbol = kwargs.get("symbol", "BTC-USD")
            interval = kwargs.get("interval", "1d")
            start_date = kwargs.get("start_date", "2020-01-01")
            df = yf.download(symbol, start=start_date, interval=interval)
            df.reset_index(inplace=True)
            return df
        except Exception as e:
            print(f"Error fetching data from Yahoo Finance API: {e}")
            return pd.DataFrame()