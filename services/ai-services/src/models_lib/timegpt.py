from src.models_lib.model_config.timegpt_config import TimeGPTConfig, TimeGPTDataConfig
from src.models_lib.base_model import BaseModel
import pandas as pd
from nixtla import NixtlaClient

class TimeGPTModel(BaseModel):
    def __init__(self, config: TimeGPTConfig):
        self.api_key = config.api_key
        self.pred = config.pred
        if self.api_key is not None:
            self.client = NixtlaClient(api_key=self.api_key)
        else:
            self.client = None

    def train(self, X_train: pd.DataFrame, y_train: pd.Series):
        pass

    def fetch_data_and_predict(self, config: TimeGPTDataConfig):
        data = config.fetcher.fetch_data(
            symbol=config.symbol,
            interval=config.interval,
            start_str=config.start_str
        )
        data_processed = config.engineer.transform(df=data, symbol=config.symbol)
        pred = self.predict(data_processed)
        return pred

    def predict(self, df: pd.DataFrame):
        df.rename(columns={"symbol": "unique_id"}, inplace=True)
        fcst = self.client.forecast(
            df=df,
            h=self.pred,
            time_col='timestamp',
            target_col='close'
        )
        fcst = fcst.rename(columns={"unique_id": "symbol","TimeGPT": "close"})
        return fcst

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> float:
        pass