import pandas as pd
from src.data.savers.base_saver import DataSaverStrategy

class ParquetSaver(DataSaverStrategy):
    def save_data(self, df: pd.DataFrame, **kwargs) -> None:
        file_path = kwargs.get("file_path", "output.parquet")
        df.to_parquet(file_path, index=False)