from dataclasses import dataclass
from typing import Any
import pandas as pd


@dataclass
class TimeXerConfig:
   data: pd.DataFrame = None
   pred: int = None
   seq: int = None
   path: str = None
   model_path: str = None

@dataclass
class TimexerDataConfig:
     symbol: str = None
     interval: str = None
     fetcher: Any = None
     engineer: Any = None
     norm: Any = None