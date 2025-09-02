import os
import pandas as pd
from src.data.loader.data_repository import DataRepository

class ParquetLoader(DataRepository):
    def __init__(self, file_path):
        self.file_path = file_path
        self.symbols = self._get_all_symbols()

    def _get_all_symbols(self):
        files = os.listdir(self.file_path)
        return [file.split(".")[0] for file in files if file.endswith(".parquet")]

    def load_all_data(self) -> pd.DataFrame:
        all_dfs = []
        for symbol in self.symbols:
            df = pd.read_parquet(f"{self.file_path}/{symbol}.parquet")
            df["symbol"] = symbol
            all_dfs.append(df)

        combined_df = pd.concat(all_dfs)
        combined_df.sort_values(["symbol", "timestamp"], inplace=True)
        return combined_df
