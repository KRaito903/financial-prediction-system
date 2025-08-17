from abc import ABC
from dataclasses import dataclass

@dataclass
class IRawNews(ABC):
  title: str
  sub_header: str