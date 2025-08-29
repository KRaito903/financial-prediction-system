import os
import atexit
from dotenv import load_dotenv
load_dotenv()

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
  # key_serializer=lambda x: x.encode('utf-8'),
  api_version_auto_timeout_ms=10000
)
atexit.register(producer.close)

sentiment_analysis = SentimentAnalysisMediator(
  crawler=crawler,
  ai_service=ai_service,
  processor=processor,
  predictor=predictor,
  repository=repository
)

sentiment_selector = SentimentSelectorMediator(repository=repository)

print('Start listening...')
for message in consumer:
  try:
    values = message.value
    request = KafkaRequest(id=values['id'], from_service=values['from_service'], name=values['name'], payload=values['payload'])
    print(f"Received request: {request.__dict__}")
    match request.name:
      case 'analyze':
        sentiment_analysis.process()
        print("Analysis completed.")
      case 'select':
        n_records = request.payload.get('n') if request.payload and request.payload.get('n') else 1
        res = sentiment_selector.process(n_records=n_records)
        print(f"Sending response: {[item.__dict__ for item in res]}")
        producer.send('sentiment_news_responses', value=str({
          'id': request.id,
          'from_service': 'sentiment-service',
          'name': request.name,
          'payload': [item.__dict__ for item in res]
        }))
      case _:
        print(f"Unknown request name: {request.name}")
        continue
  except Exception as e:
    print(f"Error processing message: {e}")
    continue