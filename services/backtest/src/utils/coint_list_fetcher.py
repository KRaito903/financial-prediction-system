import aiohttp
import os
from dotenv import load_dotenv
from typing import Optional, List

load_dotenv()


class CoinListFetcher:
    def __init__(self):
        self.base_url = os.getenv("BINANCE_API_URL", "https://api.binance.com")
        self.api_url = f"{self.base_url}/api/v3/exchangeInfo"

    async def fetch_coin_list(self) -> Optional[List[str]]:
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(self.api_url) as response:
                    coins = await response.json()
                coin = [symbol["symbol"] for symbol in coins["symbols"]]
                return coin
            except Exception as e:
                print(f"Error fetching coin list: {e}")
                return []
