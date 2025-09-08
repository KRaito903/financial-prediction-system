from src.data.loader.data_repository import DataRepository

class DataLoaderService:
    def __init__(self, data_repository: DataRepository):
        self.data_repository = data_repository

    def load_data(self):
        return self.data_repository.load_all_data()