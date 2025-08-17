from .INews import INews

class CryptoNews(INews):
  def __init__(self, subject: str, text: str, title: str, sentiment: int | None = None):
    """
    Initializes a new instance of the CryptoNews class.
    :param subject: The subject (related field, such as bitcoin, nft, altcoin,...) of the news.
    :param text: The brief text content of the news.
    :param title: The title of the news.
    """
    self.__subject = subject
    self.__text = text
    self.__title = title
    self.__sentiment = sentiment

  @property
  def subject(self):
    return self.__subject
  
  @property
  def text(self):
    return self.__text
  
  @property
  def title(self):
    return self.__title
  
  @property
  def sentiment(self):
    return self.__sentiment
  @sentiment.setter
  
  def sentiment(self, value: int):
    self.__sentiment = value
  
  def __str__(self):
    return f"CryptoNews(subject={self.__subject}, text={self.__text}, title={self.__title})"