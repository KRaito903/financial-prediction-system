import pandas as pd
from typing import Tuple
from pytorch_forecasting import TimeSeriesDataSet

def create_future_target(df: pd.DataFrame, target_col: str = 'close', shift_periods: int = -1) -> pd.DataFrame:
    """
    Tạo cột target bằng cách dịch chuyển giá trị của một cột trong tương lai về hiện tại.
    Đây là bước quan trọng nhất để model học cách dự đoán tương lai.
    
    :param df: DataFrame đầu vào.
    :param target_col: Cột cần dự đoán (e.g., 'close').
    :param shift_periods: -1 có nghĩa là giá của 1 kỳ tiếp theo.
    :return: DataFrame với cột 'target' mới.
    """
    df_copy = df.copy()
    
    # Dùng groupby('symbol') để đảm bảo không bị "rò rỉ" target từ coin này sang coin khác
    df_copy['target'] = df_copy.groupby(level='symbol')[target_col].shift(shift_periods)
    
    # Dữ liệu cuối cùng của mỗi symbol sẽ không có target, ta loại bỏ chúng
    df_copy.dropna(subset=['target'], inplace=True)
    
    return df_copy

def split_features_target(df: pd.DataFrame, target_col: str = 'target') -> Tuple[pd.DataFrame, pd.Series]:
    """
    Tách DataFrame thành X (features) và y (target).
    """
    y = df[target_col]
    X = df.drop(columns=[target_col])
    return X, y

def split_by_date(X: pd.DataFrame, y: pd.Series, split_date: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Chia dữ liệu train/test một cách chính xác cho chuỗi thời gian bằng một mốc thời gian.
    
    :param X: DataFrame chứa features.
    :param y: Series chứa target.
    :param split_date: Ngày dùng để chia (e.g., '2023-01-01').
    :return: X_train, X_test, y_train, y_test
    """
    split_datetime = pd.to_datetime(split_date)
    
    X_train = X[X.index < split_datetime]
    y_train = y[y.index < split_datetime]
    
    X_test = X[X.index >= split_datetime]
    y_test = y[y.index >= split_datetime]
    
    print(f"Data split at {split_date}:")
    print(f"- Training set: {len(X_train)} samples")
    print(f"- Test set: {len(X_test)} samples")
    
    return X_train, X_test, y_train, y_test


def create_timeseries_dataset(
    data: pd.DataFrame, 
    target_col: str, 
    time_idx_col: str,
    group_ids: list,
    max_encoder_length: int,
    max_prediction_length: int,
    static_categoricals: list,
    time_varying_known_reals: list,
    time_varying_unknown_reals: list
    ):
    """
    Chuyển đổi một DataFrame đã qua feature engineering thành một TimeSeriesDataSet.
    """
    print("Creating TimeSeriesDataSet for PyTorch Forecasting...")
    
    # Lọc ra các cột feature thực sự tồn tại trong dataframe để tránh lỗi
    time_varying_known_reals = [col for col in time_varying_known_reals if col in data.columns]
    time_varying_unknown_reals = [col for col in time_varying_unknown_reals if col in data.columns]

    training_cutoff = data[time_idx_col].max() - max_prediction_length
    
    dataset = TimeSeriesDataSet(
        data[lambda x: x[time_idx_col] <= training_cutoff],
        time_idx=time_idx_col,
        target=target_col,
        group_ids=group_ids,
        max_encoder_length=max_encoder_length,
        max_prediction_length=max_prediction_length,
        static_categoricals=static_categoricals,
        time_varying_known_reals=time_varying_known_reals,
        time_varying_unknown_reals=time_varying_unknown_reals,
        allow_missing_timesteps=True,
        add_relative_time_idx=True,
        add_target_scales=True,
        add_encoder_length=True,
    )
    
    print("TimeSeriesDataSet created successfully.")
    return dataset