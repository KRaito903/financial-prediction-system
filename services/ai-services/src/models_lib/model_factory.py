from src.models_lib.base_model import BaseModel
from src.models_lib.xgboots import XGBootsModel
from src.models_lib.timegpt import TimeGPTModel
from src.models_lib.timexer import TimeXerModel



class ModelFactory:
    _MODEL_MAPPING = {
    "XGBoots": XGBootsModel,
    "TimeGPT": TimeGPTModel,
    "TimeXer": TimeXerModel,
    }

    @staticmethod
    def get_model(model_name: str, **kwargs) -> BaseModel:
        model_class = ModelFactory._MODEL_MAPPING.get(model_name)
        if model_class:
            return model_class(**kwargs)
        else:
            raise ValueError(f"Unknown model name: {model_name}")