import os
import atexit
from threading import Thread

from dotenv import load_dotenv
load_dotenv()

###############################################
###############################################
# initialize components
from SentimentAnalysis.SentimentAnalysisMediator import SentimentAnalysisMediator
from SentimentSelector.SentimentSelectorMediator import SentimentSelectorMediator
from NewsCrawler.CryptoNewsCrawler import CryptoNewsCrawler
from AIService.GeminiService import GeminiService
from DataProcessor.DataProcessorGemini import DataProcessorGemini
from PredictModel.PredictModelFinBert import PredictModelFinBert
from NewsRepository.NewsRepositoryPostgres import NewsRepositoryPostgres
from psycopg_pool import ConnectionPool
from kafka import KafkaProducer, KafkaConsumer
import json
from KafkaEvent.KafkaRequest import KafkaRequest
from KafkaEvent.KafkaResponse import KafkaResponse

crawler = CryptoNewsCrawler()
ai_service = GeminiService(api_key=os.getenv('GEMINI_API_KEY'))
processor = DataProcessorGemini(service=ai_service)
predictor = PredictModelFinBert()

DB_CONNECTION_STRING = os.environ.get("DATABASE_URL")
connectionPool = ConnectionPool(
  conninfo=DB_CONNECTION_STRING,
  min_size=2,
  max_size=10,
  open=True
)
repository = NewsRepositoryPostgres(pool=connectionPool)
atexit.register(connectionPool.close)

sentiment_analysis = SentimentAnalysisMediator(
  crawler=crawler,
  ai_service=ai_service,
  processor=processor,
  predictor=predictor,
  repository=repository
)

consumer = KafkaConsumer(
  'sentiment_news_requests',
  bootstrap_servers=['kafka:9092'],
  value_deserializer=lambda x: json.loads(x.decode('utf-8')),
  api_version_auto_timeout_ms=10000
)
atexit.register(consumer.close)

producer = KafkaProducer(
  bootstrap_servers=['kafka:9092'],
  value_serializer=lambda x: json.dumps(x).encode('utf-8'),
  api_version_auto_timeout_ms=10000
)
atexit.register(producer.close)

sentiment_selector = SentimentSelectorMediator(repository=repository)
###############################################
###############################################
# kafka thread
def kafka_thread():
  while True:
    try:
      for message in consumer:
        print("Message received.")
        values = message.value
        request = KafkaRequest(id=values['id'], from_service=values['from_service'], name=values['name'], payload=values['payload'])
        match request.name:
          case 'analyze':
            sentiment_analysis.process()
            print("Analysis completed.")
          case 'select':
              n_records = request.payload.get('n') if request.payload and request.payload.get('n') else 1
              res = sentiment_selector.process(n_records=n_records)
              producer.send('sentiment_news_responses', value=str({
                'id': request.id,
                'to_service': request.from_service,
                'name': request.name,
                'payload': [item.__dict__() for item in res]
              }))
              print(f"Response sent for request id {request.id}.")
          case _:
            print(f"Unknown request name: {request.name}")
            continue
    except Exception as e:
      print(f"Error in Kafka thread: {e}")

###############################################
###############################################
# flask and graphql
from flask import Flask
from flask_cors import CORS

from typing import List

app = Flask(__name__)
CORS(app)

import strawberry
from strawberry.flask.views import GraphQLView
from datetime import datetime, timezone

@strawberry.federation.type(keys=["id"])
class News:
  id: strawberry.ID
  subject: str
  text: str
  title: str
  url: str
  published_time: str
  sentiment_score: int
  created_at: float
  last_modified_at: float

@strawberry.type
class Query:
  @strawberry.field
  def news(self, page: int = 1, limit: int = 10) -> List["News"]:
    news_items = repository.get_all(page=page, limit=limit)
    for item in news_items:
      item.published_time = datetime.fromtimestamp(item.published_time, tz=timezone.utc).strftime('%d/%m/%Y %H:%M:%S') if item.published_time else None
    return news_items

schema = strawberry.federation.Schema(
  enable_federation_2=True,
  query=Query,
  types=[News]
)

app.add_url_rule(
  "/graphql",
  view_func=GraphQLView.as_view("graphql_view", schema=schema),
)
###############################################
###############################################
# Job schedule thread
import schedule
import time
schedule.every(1).hour.do(sentiment_analysis.process)
def schedule_thread():
  while True:
    try:
      schedule.run_pending()
      time.sleep(1)
    except Exception as e:
      print(f"Error in schedule thread: {e}")
###############################################
###############################################
# Start service
print('Starting service...')
kafka_thrd = Thread(target=kafka_thread, daemon=True)
kafka_thrd.start()
schedule_thrd = Thread(target=schedule_thread, daemon=True)
schedule_thrd.start()