from src.models_lib.base_model import BaseModel
import pandas as pd
from nixtla import NixtlaClient

class TimeGPTModel(BaseModel):
    def __init__(self, **kargs):
        self.api_key = kargs.get("api_key", None)
        self.seq = kargs.get("seq", 6)
        if self.api_key is not None:
            self.client = NixtlaClient(api_key=self.api_key)
        else:
            self.client = None

    def train(self, X_train: pd.DataFrame, y_train: pd.Series):
        pass

    def predict(self, df: pd.DataFrame):
        df.rename(columns={"symbol": "unique_id"}, inplace=True)
        fcst = self.client.forecast(
            df=df,
            h=self.seq,
            time_col='timestamp',
            target_col='close'
        )
        fcst = fcst.rename(columns={"unique_id": "symbol","TimeGPT": "close"})
        return fcst

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> float:
        pass