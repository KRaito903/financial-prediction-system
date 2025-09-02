import os
from src.data.loader.data_repository import DataRepository
import pandas as pd
import os

class CSVLoader(DataRepository):
    """
     Đọc tất cả file csv vào save vào 1 DataFrame và trả về DataFrame đó
     có thêm cột symbol để phan biệt các coin khác nhau
    """
    def __init__(self,file_path):
        self.file_path = file_path
        self.symbols = self._get_all_symbols()

    def _get_all_symbols(self):
        files = os.listdir(self.file_path)
        symbols = [file.split(".")[0] for file in files if file.endswith(".csv")]
        return symbols

    def load_all_data(self) -> pd.DataFrame:
        all_dfs = []
        for symbol in self.symbols:
            df = pd.read_csv(self.file_path + f"/{symbol}.csv")
            df["symbol"] = symbol
            all_dfs.append(df)
        
        combined_df = pd.concat(all_dfs)
        # Sắp xếp lại theo cả symbol và thời gian
        combined_df.sort_values(['symbol', 'timestamp'], inplace=True)
        combined_df.reset_index(drop=True, inplace=True)

        combined_df['timestamp'] = pd.to_datetime(combined_df['timestamp'])
        combined_df.set_index('timestamp', inplace=True)

        return combined_df
