# src/features/feature_engineer.py

import pandas as pd
import talib as ta
import numpy as np
from sklearn.preprocessing import StandardScaler
import yaml
from typing import Optional

class FeatureEngineer:
    """
    Lớp chịu trách nhiệm biến dữ liệu thô thành các features sẵn sàng cho model (thêm các dữ liệu dặc trưng để học khôn hơn)
    Chuẩn hoá dữ liệu vào trong khoảng 
    Toàn bộ quá trình được điều khiển bởi một file config
    """
    def __init__(self, config_path: str = "configs/main_config.yaml"):
        """
        Khởi tạo FeatureEngineer và tải file cấu hình

        """
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)['feature_engineering']
        
        self.scaler = StandardScaler()
        self.fitted_scaler = None
        # Đọc từ sentiment nếu cần
        # self.sentiment_pipeline = pipeline("sentiment-analysis", model="ProsusAI/finbert")
        print("FeatureEngineer initialized with config.")

    def _integrate_sentiment(self, price_df: pd.DataFrame, news_df: Optional[pd.DataFrame]) -> pd.DataFrame:
        """Tích hợp điểm sentiment từ dữ liệu tin tức vào dữ liệu giá."""
        if not self.config['sentiment']['enabled'] or news_df is None or news_df.empty:
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

    def _standardize_features(self, df: pd.DataFrame, is_training: bool) -> pd.DataFrame:
        """Chuẩn hóa các features được định nghĩa trong config."""
        features_to_scale = self.config['features_to_scale']
        # Lọc ra những cột thực sự tồn tại trong DataFrame để tránh lỗi
        existing_features = [col for col in features_to_scale if col in df.columns]

        if is_training:
            print("Fitting scaler on training data and transforming...")
            df[existing_features] = self.scaler.fit_transform(df[existing_features])
            self.fitted_scaler = self.scaler
        else:
            if self.fitted_scaler is None:
                raise RuntimeError("Scaler has not been fitted. Please process training data first.")
            print("Transforming data using fitted scaler...")
            df[existing_features] = self.fitted_scaler.transform(df[existing_features])
        return df

    def process(self, price_df: pd.DataFrame, news_df: Optional[pd.DataFrame] = None, is_training: bool = False) -> pd.DataFrame:
        """
        Pipeline xử lý hoàn chỉnh: từ dữ liệu thô đến dữ liệu sẵn sàng cho model.
        """
        df = price_df.copy()

        # Tích hơp sentiment nếu có không thì vẫn giữa nhm để 0 hết
        df = self._integrate_sentiment(df, news_df)

        # Tạo các features được định nghĩa trong config
        # Dùng groupby để đảm bảo tính toán trên từng symbol riêng biệt
        # group_keys=False để tránh tạo thêm một level index không cần thiết
        df = df.groupby('symbol', group_keys=False).apply(self._create_symbol_features)
        
        #  Loại bỏ các dòng bị rỗng (sinh ra từ lag, rolling...)
        df.dropna(inplace=True)
        
        # Chuẩn hóa dữ liệu
        df = self._standardize_features(df, is_training)

        print(f"Feature engineering complete. Final data shape: {df.shape}")
        return df

    def _create_symbol_features(self, group: pd.DataFrame) -> pd.DataFrame:
        """
        Hàm helper để áp dụng việc tạo feature cho một symbol duy nhất.
        """
        # Tạo time-based features
        for feature in self.config.get('time_based_features', []):
            if feature == 'weekofyear':
                group[feature] = group.index.isocalendar().week
            else:
                group[feature] = getattr(group.index, feature)

        # Tạo lag features
        for lag_conf in self.config.get('lag_features', []):
            column = lag_conf['column']
            for period in lag_conf['periods']:
                group[f'{column}_lag_{period}'] = group[column].shift(period)
        
        # Tạo technical indicators sử dụng TA-Lib, này nhiều chỉ số nó hơi khó hiểu.
        for indicator in self.config.get('technical_indicators', []):
            indicator_name = indicator['name'].lower()
            params = indicator.get('params', {})
            
            if indicator_name == 'ema':
                length = params.get('length', 12)
                group[f'EMA_{length}'] = ta.EMA(group['close'], timeperiod=length)
            elif indicator_name == 'sma':
                length = params.get('length', 50)
                group[f'SMA_{length}'] = ta.SMA(group['close'], timeperiod=length)
            elif indicator_name == 'rsi':
                length = params.get('length', 14)
                group[f'RSI_{length}'] = ta.RSI(group['close'], timeperiod=length)
            elif indicator_name == 'bbands':
                length = params.get('length', 20)
                std = params.get('std', 2)
                bb_upper, bb_middle, bb_lower = ta.BBANDS(group['close'], timeperiod=length, nbdevup=std, nbdevdn=std)
                group[f'BBM_{length}_{std}'] = bb_middle  # Moving Average
                group[f'BBP_{length}_{std}'] = (group['close'] - bb_lower) / (bb_upper - bb_lower)  # %B
            elif indicator_name == 'macd':
                fast = params.get('fast', 12)
                slow = params.get('slow', 26)
                signal = params.get('signal', 9)
                macd, macd_signal, macd_hist = ta.MACD(group['close'], fastperiod=fast, slowperiod=slow, signalperiod=signal)
                group[f'MACD_{fast}_{slow}_{signal}'] = macd
                group[f'MACDs_{fast}_{slow}_{signal}'] = macd_signal
                group[f'MACDh_{fast}_{slow}_{signal}'] = macd_hist
            
        return group