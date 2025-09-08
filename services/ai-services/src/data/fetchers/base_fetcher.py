from abc import ABC, abstractmethod
import pandas as pd


class DataFetchStrategy(ABC):
    """
    Một interface cho việc fetch dữ liệu từ nhiều nguồn khác nhau
    Khác class khác nếu iml lại cần có phuơng thức fetch_data

    """
    @abstractmethod
    def fetch_data(self, **kwargs) -> pd.DataFrame:
        """
        Phương thức trừu tượng để fetch dữ liệu
        Tuy các việc fetch data mà **kwargs sẽ có thể khác nhau (API key, hoặc lấy từ sentiment analysis )
        """
        pass

