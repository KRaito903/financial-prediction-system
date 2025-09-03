from abc import ABC, abstractmethod

class IService(ABC):
  """
  Interface for AI Service.
  """

  @abstractmethod
  def generate(self, prompt: str) -> str:
    """
    Process the input data and return a result.

    :param data: The input data to be processed.
    :return: The processed result as a string.
    """
    ...