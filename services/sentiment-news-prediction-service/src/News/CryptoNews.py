class CryptoNews:
  def __init__(self, subject: str, text: str, title: str, url: str, published_time: float, sentiment_score: int | None = None, created_at: float | None = None, last_modified_at: float | None = None, id: int | None = None):
    """
    Initializes a new instance of the CryptoNews class.
    :param subject: The subject (related field, such as bitcoin, nft, altcoin,...) of the news.
    :param text: The brief text content of the news.
    :param title: The title of the news.
    """
    self.__id = id
    self.__subject = subject
    self.__text = text
    self.__title = title
    self.__url = url
    self.__published_time = published_time
    self.__sentiment_score = sentiment_score
    self.__created_at = created_at
    self.__last_modified_at = last_modified_at

  @property
  def id(self):
    return self.__id
  
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
  def sentiment_score(self):
    return self.__sentiment_score
  
  @sentiment_score.setter
  def sentiment_score(self, value: int):
    self.__sentiment_score = value

  @property
  def url(self):
    return self.__url
  
  @property
  def published_time(self):
    return self.__published_time
  
  @property
  def created_at(self):
    return self.__created_at
  
  @property
  def last_modified_at(self):
    return self.__last_modified_at
  
  def __str__(self):
    return f"CryptoNews(id={self.__id}, subject={self.__subject}, text={self.__text}, title={self.__title}, url={self.__url}, published_time={self.__published_time}, sentiment_score={self.__sentiment_score}, created_at={self.__created_at}, last_modified_at={self.__last_modified_at})"
  
  def __repr__(self):
    return str(self)