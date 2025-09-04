import pandas as pd
import numpy as np
import ta
from sklearn.preprocessing import StandardScaler
from typing import Optional

class FeatureEngineer:
    """
    Lớp chịu trách nhiệm biến dữ liệu thô thành các features sẵn sàng cho model (thêm các dữ liệu dặc trưng để học khôn hơn)
    """
    def __init__(self, lags=None, emas=None, add_volatility=True, add_rsi=True, add_datetime=True):
        """
        Parameters
        ----------
        lags : list[int] | None
            Các độ trễ muốn thêm, ví dụ [1, 7].
        emas : list[int] | None
            Các chu kỳ EMA muốn thêm, ví dụ [10, 20].
        add_volatility : bool
            Có thêm rolling volatility hay không.
        add_rsi : bool
            Có thêm RSI(14) hay không.
        add_datetime : bool
            Có tách datetime feature hay không.
        """
        self.lags = lags if lags else []
        self.emas = emas if emas else []
        self.add_volatility = add_volatility
        self.add_rsi = add_rsi
        self.add_datetime = add_datetime
    
    def _integrate_sentiment(self, price_df: pd.DataFrame, news_df: Optional[pd.DataFrame]) -> pd.DataFrame:
        """Tích hợp điểm sentiment từ dữ liệu tin tức vào dữ liệu giá."""
        if news_df is None or news_df.empty:
            price_df['sentiment_score'] = 0.0
            return price_df

        print("Integrating sentiment data...")
        # (Giả lập logic sentiment analysis)
        news_df['sentiment_score'] = [0.8, -0.5, 0.1] * (len(news_df) // 3 + 1)[:len(news_df)]
        
        sentiment_per_hour = news_df['sentiment_score'].resample('H').mean()
        
        price_df = pd.merge_asof(
            left=price_df.sort_index(),
            right=sentiment_per_hour.to_frame(name='sentiment_score').sort_index(),
            left_index=True,
            right_index=True,
            direction='backward'
        )
        price_df['sentiment_score'].fillna(0, inplace=True)
        return price_df

    def transform(self, df: pd.DataFrame, news_df: Optional[pd.DataFrame] = None, symbol: Optional[str] = None) -> pd.DataFrame:
        df = df.copy()
        df.reset_index(inplace=True)  # Đảm bảo 'timestamp' là cột thường

        if 'symbol' not in df.columns:
            df['symbol'] = symbol

        # Tích hợp sentiment data
        df = self._integrate_sentiment(df, news_df)

        # Lag features 
        for lag in self.lags:
            df[f"close_lag_{lag}"] = df.groupby("symbol")["close"].shift(lag)
        
        # EMA 
        for span in self.emas:
            df[f"ema_{span}"] = (
                df.groupby("symbol")["close"]
                  .transform(lambda x: x.ewm(span=span, adjust=False).mean())
            )
        
        # Volatility 
        if self.add_volatility:
            df["volatility_10"] = (
                df.groupby("symbol")["close"].transform(lambda x: x.rolling(10).std())
            )

        # RSI
        if self.add_rsi:
            df["rsi_14"] = (
                df.groupby("symbol")["close"]
                  .transform(lambda x: ta.momentum.RSIIndicator(x, window=14).rsi())
            )
        
        # Datetime features 
        if self.add_datetime and "timestamp" in df.columns:
            df["day_of_week"] = df["timestamp"].dt.weekday
            df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
            df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)


        df = df.dropna().reset_index(drop=True)
        df.set_index('timestamp', inplace=True)

        return df
