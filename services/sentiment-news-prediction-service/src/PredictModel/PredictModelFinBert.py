from .IPredictModel import IPredictModel
import os
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

class PredictModelFinBert(IPredictModel):
  """
  Predict model using FinBERT for sentiment analysis.
  """
  def __init__(self):
    self.__setup()

  def __setup(self):
    self.__device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    model_path = os.path.join(os.path.dirname(__file__), '../../model-finbert-sentiment')
    self.__model = AutoModelForSequenceClassification.from_pretrained(model_path).to(self.__device)

    self.__tokenizer = AutoTokenizer.from_pretrained(model_path)

  def predict(self, input_data):
    """
    Predicts the output based on the input data.
    
    :param data: Input data for prediction.
    :return: Predicted output.
    """
    # Placeholder for actual prediction logic
    tokenized_data = self.__tokenizer(list(input_data), padding=True, truncation=True, return_tensors='pt').to(self.__device)
    self.__model.eval()
    with torch.no_grad():
      inputs = {key: value.to(self.__device) for key, value in tokenized_data.items()}
      outputs = self.__model(**inputs)
      logits = outputs.logits
      _, predicted_labels = torch.max(logits, 1)
    return predicted_labels.cpu().numpy()