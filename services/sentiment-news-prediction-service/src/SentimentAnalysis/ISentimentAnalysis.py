from abc import ABC, abstractmethod

class ISentimentAnalysis(ABC):
  @abstractmethod
  def process(self):
    """
    Analyze the sentiment of the given text and return a sentiment score.

    :return: A sentiment score, where positive values indicate positive sentiment,
              negative values indicate negative sentiment, and zero indicates neutral sentiment.
    """
    ...