from src.data.savers.s3_saver import S3Saver
from src.data.savers.base_saver import DataSaverStrategy
from src.data.savers.csv_saver import CSVSaver
from src.data.savers.parquet_saver import ParquetSaver



class SaverFactory:
    _SAVER_MAPPING = {
    "csv": CSVSaver,
    "parquet": ParquetSaver,
    "s3": S3Saver,
    }

    @staticmethod
    def create_data_saver(strategy: str, **kwargs) -> DataSaverStrategy:
        saver_class = SaverFactory._SAVER_MAPPING.get(strategy)
        if not saver_class:
            raise ValueError(f"Unknown saver strategy: {strategy}")
        return saver_class(**kwargs)