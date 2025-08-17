from abc import ABC, abstractmethod

class IPredictModel(ABC):
  @abstractmethod
  def predict(self, input_data):
    """
    Predicts the output based on the input data.

    :param data: Input data for prediction.
    :return: Predicted output.
    """
    ...