from SentimentSelector.ISentimentSelector import ISentimentSelector
from News.CryptoNews import CryptoNews
from NewsRepository.INewsRepository import INewsRepository

class SentimentSelectorMediator(ISentimentSelector):
  def __init__(self, repository: INewsRepository):
    self.__repository = repository

  def process(self, n_records: int = 1) -> list[CryptoNews]:
    return self.__select(n_records=n_records)

  def __select(self, n_records: int) -> list[CryptoNews]:
    return self.__repository.get_n_latest(n=n_records)