from .IService import IService
from google import genai

class GeminiService(IService):
  """
  Gemini AI Service implementation.
  - 10 requests per minute;
  - 250 requests per day;
  - 250,000 tokens per minute.
  """
  def __init__(self, api_key: str, model_name: str = 'gemini-2.0-flash'):
    self.__api_key = api_key
    self.__model_name = model_name
    self.__client = genai.Client(api_key=self.__api_key)

  @property
  def model_name(self) -> str:
    """
    Returns the name of the model used by the Gemini AI service.

    :return: The model name as a string.
    """
    return self.__model_name

  def generate(self, prompt: str) -> str:
    """
    Process the input data using Gemini AI and return a result.

    :param data: The input data to be processed.
    :return: The processed result as a string.
    """
    res = self.__client.models.generate_content(
      model=self.__model_name,
      contents=prompt
    )

    return res.text