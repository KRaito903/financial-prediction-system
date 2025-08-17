import os
from dotenv import load_dotenv
load_dotenv()

from SentimentAnalysis.SentimentAnalysisMediator import SentimentAnalysisMediator
from NewsCrawler.CryptoNewsCrawler import CryptoNewsCrawler
from AIService.GeminiService import GeminiService
from DataProcessor.DataProcessorGemini import DataProcessorGemini
from PredictModel.PredictModelFinBert import PredictModelFinBert

crawler = CryptoNewsCrawler()
ai_service = GeminiService(api_key=os.getenv('GEMINI_API_KEY'))
processor = DataProcessorGemini(service=ai_service)
predictor = PredictModelFinBert()

s = SentimentAnalysisMediator(
  crawler=crawler,
  ai_service=ai_service,
  processor=processor,
  predictor=predictor
)

s.process()