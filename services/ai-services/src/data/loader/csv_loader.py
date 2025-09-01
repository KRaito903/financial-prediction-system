from src.data.loader.data_repository import DataRepository
import pandas as pd

class CSVLoader(DataRepository):
    """
     Đọc tất cả file csv vào save vào 1 DataFrame và trả về DataFrame đó
     có thêm cột symbol để phan biệt các coin khác nhau
    """
    def __init__(self, symbols, file_path):
        self.symbols = symbols
        self.file_path = file_path

    def load_all_data(self) -> pd.DataFrame:
        all_dfs = []
        for symbol in self.symbols:
            df = pd.read_csv(self.file_path + f"/{symbol}.csv")
            df["symbol"] = symbol
            all_dfs.append(df)
        
        combined_df = pd.concat(all_dfs)

        # Sắp xếp lại theo cả symbol và thời gian
        combined_df.sort_values(['symbol', 'timestamp'], inplace=True)
        return combined_df
