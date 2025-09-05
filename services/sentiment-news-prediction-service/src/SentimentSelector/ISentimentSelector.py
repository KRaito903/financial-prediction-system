from abc import ABC, abstractmethod

class ISentimentSelector(ABC):
  @abstractmethod
  def process(self, n_records: int = 1) -> list:
    ...