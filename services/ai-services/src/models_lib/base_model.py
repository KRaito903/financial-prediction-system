from abc import ABC, abstractmethod
import pandas as pd

class BaseModel(ABC):
   @abstractmethod
   def train(self, train_data: pd.DataFrame, val_data: pd.DataFrame):
       pass

   @abstractmethod
   def predict(self, X: pd.DataFrame) -> pd.Series:
       pass

   @abstractmethod
   def evaluate(self, X_test: pd.DataFrame, y_test: pd.Series) -> float:
       pass