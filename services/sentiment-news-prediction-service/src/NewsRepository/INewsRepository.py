from abc import ABC, abstractmethod

class INewsRepository(ABC):
  """
  Interface for News Repository.
  """
  # @abstractmethod
  # def get_all(self, page: int = 1, limit: int = 10) -> list:
  #   """
  #   Fetch news from the specified source.

  #   :param page: The page number to fetch news from.
  #   :param limit: The maximum number of news items on the page to fetch.
  #   :return: A list of news items.
  #   """
  #   ...
  # @abstractmethod
  # def get_by_id(self, id: int):
  #   """
  #   Fetch a news item by its ID.

  #   :param id: The ID of the news item to fetch.
  #   :return: An instance of INews corresponding to the given ID.
  #   """
  #   ...
  
  # @abstractmethod
  # def get_by_timeframe(self, start, end) -> list:
  #   """
  #   Fetch news within a specific timeframe.

  #   :param start: The start datetime for the timeframe.
  #   :param end: The end datetime for the timeframe.
  #   :return: A list of news items within the specified timeframe.
  #   """
  #   ...
  
  @abstractmethod
  def get_n_latest(self, n: int) -> list:
    """
    Create a new news item.

    :param news: An instance of INews to be created.
    :return: None
    """
    ...

  @abstractmethod
  def get_by_url(self, url: str):
    ...

  @abstractmethod
  def create(self, news) -> int:
    """
    Create a new news item.

    :param news: An instance of INews to be created.
    :return: The ID of the newly created news item.
    """
    ...

  @abstractmethod
  def create_many(self, news_list) -> None:
    ...
  
  # @abstractmethod
  # def update(self, options: dict) -> bool:
  #   """
  #   Update an existing news item.

  #   :param news: An instance of INews to be updated.
  #   :return: None
  #   """
  #   ...

  @abstractmethod
  def delete_by_id(self, id: int):
    """
    Delete a news item by its ID.

    :param id: The ID of the news item to delete.
    :return: None
    """
    ...

  @abstractmethod
  def delete_all(self):
    ...