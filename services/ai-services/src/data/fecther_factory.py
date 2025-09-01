from .fetchers.base_fetcher import DataFetchStrategy
from .fetchers.binace_fetcher import BinanceFetchStrategy
from .fetchers.yahoo_fetcher import YahooFetchStrategy


FACTORY_MAPPING = {
    "binance": BinanceFetchStrategy,
    "yahoo": YahooFetchStrategy,
}

def create_data_fetcher(strategy_name: str, **kwargs) -> DataFetchStrategy:
    """
    tạo các data fetcher khác nhau

    """
    strategy_class = FACTORY_MAPPING.get(strategy_name)
    if not strategy_class:
        raise ValueError(f"Unknown strategy: {strategy_name}")
    return strategy_class(**kwargs)