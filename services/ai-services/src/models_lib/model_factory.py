from src.models_lib.base_model import BaseModel
from src.models_lib.xgboots import XGBoots
from src.models_lib.timegpt import TimeGPT
from src.models_lib.timexer import TimeXer



class ModelFactory:

    _MODEL_MAPPING = {
    "XGBoots": XGBoots,
    "TimeGPT": TimeGPT,
    "TimeXer": TimeXer,
    }

    @staticmethod
    def get_model(model_name: str, **kwargs) -> BaseModel:
        model_class = ModelFactory._MODEL_MAPPING.get(model_name)
        if model_class:
            return model_class(**kwargs)
        else:
            raise ValueError(f"Unknown model name: {model_name}")