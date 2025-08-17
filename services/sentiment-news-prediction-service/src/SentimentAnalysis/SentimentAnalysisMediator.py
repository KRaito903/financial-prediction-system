from SentimentAnalysis.ISentimentAnalysis import ISentimentAnalysis
from NewsCrawler.NewsCrawler import NewsCrawler
from DataProcessor.IDataProcessor import IDataProcessor
from News.CryptoNews import CryptoNews
from AIService.IService import IService
from PredictModel.IPredictModel import IPredictModel

class SentimentAnalysisMediator(ISentimentAnalysis):
  def __init__(self, crawler: NewsCrawler, ai_service: IService, processor: IDataProcessor, predictor: IPredictModel):
    super().__init__()
    self.__crawler = crawler
    self.__gemini_service = ai_service
    self.__processor = processor
    self.__predictor = predictor

  def __crawl_news(self):
    return self.__crawler.crawl()
  
  def __get_processed_news(self, raw_news):
    processed_news = []
    subjects = self.__processor.process_array(list_raw_data=[news.sub_header for news in raw_news])
    for i in range(len(raw_news)):
      news = raw_news[i]
      subject = subjects[i]

      crypto_type = subject.get('crypto_type')
      text = news.sub_header
      title = news.title

      processed_news.append(CryptoNews(subject=crypto_type, text=text, title=title))
    return processed_news

  def __prep_data_for_prediction(self, news):
    return [item.text for item in news]
  
  def __conduct_news_after_prediction(self, news, predicted_label):
    """
    Process the news after prediction to include sentiment scores.

    :param news: List of INews objects.
    :param predicted_label: List of predicted sentiment labels.
    :return: List of INews objects with sentiment scores.
    """
    for i in range(len(news)):
      news[i].sentiment_score = predicted_label[i]
    return news

  def process(self):
    """
    Analyze the sentiment of the given text and return a sentiment score.

    :return: A sentiment score, where positive values indicate positive sentiment,
              negative values indicate negative sentiment, and zero indicates neutral sentiment.
    """
    # 1. crawl the raw news
    raw_news = self.__crawl_news()

    # 2. process the raw news
    processed_news = self.__get_processed_news(raw_news)
      
    # 3. predict
    input_data = self.__prep_data_for_prediction(processed_news)
    predicted_label = self.__predictor.predict(input_data)
    processed_news = self.__conduct_news_after_prediction(processed_news, predicted_label)

    # 4. store to database
    ...