from dataclasses import dataclass
from typing import Any


@dataclass
class TimeGPTConfig:
    api_key: str
    pred: int

@dataclass
class TimeGPTDataConfig:
    fetcher: Any
    engineer: Any
    symbol: str
    interval: str
    start_str: str
