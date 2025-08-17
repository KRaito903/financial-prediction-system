from abc import ABC, abstractmethod

class INews(ABC):
  @abstractmethod
  def __init__(self, subject: str, text: str, title: str):
    """
    Initializes a new instance of the INew class.
    :param subject: The subject (related field, such as bitcoin, nft, altcoin,...) of the news.
    :param text: The brief text content of the news.
    :param title: The title of the news.
    """
    ...

  @abstractmethod
  def subject(self) -> str:
    """
    Returns the subject of the news.
    :return: The subject of the news.
    """
    ...

  @abstractmethod
  def text(self) -> str:
    """
    Returns the text content of the news.
    :return: The text content of the news.
    """
    ...
    
  @abstractmethod
  def title(self) -> str:
    """
    Returns the title of the news.
    :return: The title of the news.
    """
    ...