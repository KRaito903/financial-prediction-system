from abc import ABC, abstractmethod
import pandas as pd

class DataSaverStrategy(ABC):
    @abstractmethod
    def save_data(self, df: pd.DataFrame, **kwargs) -> None:
        """
        abstract lưu trữ dữ liệu dưới nhiều dạng khác nhau có thể csv hoặc parquet...
        """
        pass
