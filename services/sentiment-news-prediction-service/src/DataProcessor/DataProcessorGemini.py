from .IDataProcessor import IDataProcessor
from AIService.IService import IService
import json

class DataProcessorGemini(IDataProcessor):
  """
  Data Processor for Gemini.
  """
  def __init__(self, service: IService):
    self.__service = service
  def __retrieve_json_from_string(self, str_json: str): 
    return json.loads(str_json)

  def process(self, raw_data: str) -> str:
    """
    Process the input data and return a result.

    :param raw_data: The input raw data to be processed.
    :return: The processed result as a json.
    """
    # Implement the processing logic specific to Gemini here
    prompt = f"""
You are an expert AI data not specializing in cryptocurrency news. Your task is to analyze the following text content from a news article and return a clean JSON object.

Based on the provided text, extract the `crypto_type` which identifies the primary subject. You must return exactly one value from this list: ['NFT', 'Bitcoin', 'Ethereum', 'Altcoin', 'Blockchain', 'DeFi'].

Do *NOT* include any explanations or text outside of the final JSON object, even the markdown notation of json codeblock.

Here is the raw data:
"{raw_data}"
    """
    res = self.__service.generate(prompt)
    res = res.strip('\n').removeprefix('```json').removesuffix('```')
    print(res)
    return self.__retrieve_json_from_string(res)
  
  def process_array(self, list_raw_data: list):
    """
    Process the input data and return a result.

    :param raw_data: The input raw data to be processed.
    :return: The processed result as a json.
    """
    # Implement the processing logic specific to Gemini here
    prompt = f"""
You are an expert data extraction AI. Your task is to analyze a list of short texts and identify the primary cryptocurrency or blockchain-related term mentioned in each.

The term you extract must be one of the following exact values: ['NFT', 'Bitcoin', 'Ethereum', 'Altcoin', 'Blockchain', 'DeFi'].

You will be given an aarray of texts. Your response must be a single, valid JSON array where each object corresponds to a text in the input list, maintaining the original order. Each object must have the structure: {{'crypto_type': '...'}}

Here is an example:
- Input:
```
[
  "The market is watching as the price of BTC continues to climb.",
  "This new digital art piece was just minted as a unique non-fungible token.",
  "Learn about the foundational distributed ledger technology that powers crypto.",
  "Is ETH the platform for the future of decentralized applications?",
  "Exploring the high-risk, high-reward world of smaller cap crypto coins.",
  "Yield farming is a popular strategy within decentralized finance.",
]
```
- Output:
```json
[
  {{"crypto_type": "Bitcoin"}},
  {{"crypto_type": "NFT"}},
  {{"crypto_type": "Blockchain"}},
  {{"crypto_type": "Ethereum"}},
  {{"crypto_type": "Altcoin"}},
  {{"crypto_type": "DeFi"}}
]
```

Now, process the following input:
{list_raw_data}
    """
    res = self.__service.generate(prompt)
    res = res.strip('\n').removeprefix('```json').removesuffix('```')
    return self.__retrieve_json_from_string(res)