from src.data.savers.base_saver import DataSaverStrategy
from src.data.savers.csv_saver import CSVSaver

SAVER_MAPPING = {
    "csv": CSVSaver,
}

def create_data_saver(strategy: str) -> DataSaverStrategy:
    saver_class = SAVER_MAPPING.get(strategy)
    if not saver_class:
        raise ValueError(f"Unknown saver strategy: {strategy}")
    return saver_class()