import pandas as pd
from abc import ABC, abstractmethod

class DataRepository(ABC):
    @abstractmethod
    def load_all_data(self) -> pd.DataFrame:
        pass
