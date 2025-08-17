from abc import ABC, abstractmethod

class IDataProcessor(ABC):
  """
  Interface for Data Processor.
  """

  @abstractmethod
  def process(self, raw_data: str) -> str:
      """
      Process the input data and return a result.

      :param raw_data: The input data to be processed.
      :return: The processed result as a string.
      """
      ...