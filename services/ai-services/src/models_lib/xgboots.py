from src.models_lib.base_model import BaseModel
import pandas as pd

class XGBootsModel(BaseModel):
    def __init__(self):
        super().__init__()
        self.model = None

    def train(self, X_train: pd.DataFrame, y_train: pd.Series):
        pass

    def predict(self, X: pd.DataFrame) -> pd.Series:
        pass

    def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> float:
        pass