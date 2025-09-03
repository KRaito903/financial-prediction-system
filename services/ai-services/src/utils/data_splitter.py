from sklearn.model_selection import train_test_split
import pandas as pd

def split_data(df: pd.DataFrame, target_col: str = "close" ,test_size: float = 0.2, shuffle: bool = False):
    X = df.drop(columns=[target_col])
    y = df[target_col]
    return train_test_split(X, y, test_size=test_size, shuffle=shuffle)