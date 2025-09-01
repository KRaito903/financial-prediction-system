import pandas as pd
from binance.client import Client
from src.data.fetchers.base_fetcher import DataFetchStrategy
from src.utils.standardizer import standardize_schema

class BinanceFetchStrategy(DataFetchStrategy):
    def __init__(self, api_key: str, api_secret: str):
        self.client = Client(api_key, api_secret)

    def fetch_data(self, **kwargs) -> pd.DataFrame:
        """
        Fetch dữ liệu từ Binance API
        """
        try: 
            symbol = kwargs.get("symbol", "BTCUSDT")
            interval = kwargs.get("interval", "1h")
            start_str = kwargs.get("start_str", "1 Jan, 2020")
            klines = self.client.get_historical_klines(symbol, interval, start_str)
            df = pd.DataFrame(klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume', 
                'close_time', 'quote_asset_volume', 'number_of_trades', 
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            # df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
            # df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            # df.set_index('timestamp', inplace=True)
            # df = df.astype(float)
            return standardize_schema(df, source="binance")
        except Exception as e:
            print(f"Error fetching data from Binance API: {e}")
            return pd.DataFrame()
