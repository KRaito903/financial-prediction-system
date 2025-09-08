import os
import pandas as pd
from src.data.savers.base_saver import DataSaverStrategy


class CSVSaver(DataSaverStrategy):
    def save_data(self, df: pd.DataFrame, **kwargs) -> None:
        """
        Lưu thằng dataframe thành file csv thôi ở dang folder tuỳ chỉnh maybe nó ở craw
        file_path => đường dẫn lưu file raw csv
        """
        file_path = kwargs.get("file_path", "output.csv")
        df.to_csv(file_path, index=True)