from SentimentAnalysis.ISentimentAnalysis import ISentimentAnalysis
from NewsCrawler.NewsCrawler import NewsCrawler
from NewsCrawler.IRawNews import IRawNews
from DataProcessor.IDataProcessor import IDataProcessor
from News.CryptoNews import CryptoNews
from AIService.IService import IService
from PredictModel.IPredictModel import IPredictModel
from NewsRepository.INewsRepository import INewsRepository

class SentimentAnalysisMediator(ISentimentAnalysis):
  def __init__(self, crawler: NewsCrawler, ai_service: IService, processor: IDataProcessor, predictor: IPredictModel, repository: INewsRepository):
    super().__init__()
    self.__crawler = crawler
    self.__gemini_service = ai_service
    self.__processor = processor
    self.__predictor = predictor
    self.__repository = repository

  def __crawl_news(self):
    return self.__crawler.crawl()
  
  def __get_processed_news(self, raw_news: list[IRawNews]) -> list[CryptoNews]:
    processed_news = []
    subjects = self.__processor.process_array(list_raw_data=[news.sub_header for news in raw_news])
    for i in range(len(raw_news)):
      news = raw_news[i]
      subject = subjects[i]

      crypto_type = subject.get('crypto_type')
      text = news.sub_header
      title = news.title
      published_time = news.published_time
      url = news.url

      processed_news.append(CryptoNews(subject=crypto_type, text=text, title=title, url=url, published_time=published_time))
    return processed_news

  def __prep_data_for_prediction(self, news: CryptoNews):
    return [item.text for item in news]
  
  def __conduct_news_after_prediction(self, news_list: list[CryptoNews], predicted_label):
    """
    Process the news after prediction to include sentiment scores.

    :param news: List of INews objects.
    :param predicted_label: List of predicted sentiment labels.
    :return: List of INews objects with sentiment scores.
    """
    for i in range(len(news_list)):
      news_list[i].sentiment_score = int(predicted_label[i] - 1) # Adjusting the score to be in the range of -1 to 1
    return news_list

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
    for news in processed_news:
      print(news)
      
    # 3. predict
    input_data = self.__prep_data_for_prediction(processed_news)
    predicted_label = self.__predictor.predict(input_data)
    processed_news = self.__conduct_news_after_prediction(processed_news, predicted_label)

    # 4. store to database
    self.__repository.create_many(news_list=processed_news)