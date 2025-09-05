import logging
import numpy as np
import pickle
import dotenv
import yaml
from src.features.feature_engineer import FeatureEngineer
from src.models_lib.model_factory import ModelFactory
import os
from src.data.fecther_factory import FetcherFactory
from src.pipelines.training_pipeline import run_training_pipeline
import glob
from src.models_lib.model_config.timexer_config import TimeXerConfig, TimexerDataConfig
from src.models_lib.model_config.timegpt_config import TimeGPTDataConfig, TimeGPTConfig
from src.utils.ensemble import ForecastEnsemble

logger = logging.getLogger(__name__)

dotenv.load_dotenv()

# Config
CONFIG_PATH = "configs/main_config.yaml"


def prediction_pipeline(model_name: str = "Ensemble", symbol: str = "BTCUSDT", pred_length: int = 7, datatype: str = "1d"):

    with open(CONFIG_PATH, 'r') as f:
        read_config = yaml.safe_load(f)


    # Xác định khoảng fetch data
    date_fetch = "2023-01-01" if (pred_length <= 7) else "2021-01-01"
    hour_fetch = "2025-01-01" if (pred_length <= 7) else "2024-01-01"

    # Tạo fetcher và engineer + loader
    fetcher = FetcherFactory.create_data_fetcher("binance", api_key=os.getenv("API-Key"), api_secret=os.getenv("Secret-Key"))
    engineer = FeatureEngineer(lags=read_config['fe']['lags'], emas=read_config['fe']['emas'], add_volatility=read_config['fe']['add_volatility'], add_rsi=read_config['fe']['add_rsi'], add_datetime=read_config['fe']['add_datetime'])
    
    # API for TimeGPT
    api = os.getenv("TimeGPT-API-Key")
   
    # path for timexer
    path = "models/timexer/day/"
    model_path = f"timexer_pred_{pred_length}.ckpt"
    with open(f"artifacts/normalizer_{pred_length}.pkl", "rb") as f:
        norm = pickle.load(f)
   
    # config model and data
    #timeGPT
    timegpt_config = TimeGPTConfig(
        api_key=api,
        pred=pred_length
    )

    timegpt_data_config = TimeGPTDataConfig(
        fetcher=fetcher,
        engineer=engineer,
        symbol=symbol,
        interval=datatype,
        start_str=hour_fetch if datatype == "1h" else date_fetch
    )

    #timexer
    timexer_config = TimeXerConfig(
        data=None,
        pred=pred_length,
        seq=60,
        path=path,
        model_path=path + model_path
    )

    timexer_data_config = TimexerDataConfig(
        symbol=symbol,
        interval="1d",
        fetcher=fetcher,
        engineer=engineer,
        norm=norm
    )

    # Nếu api chọn model TimeGPT
    if (model_name == "TimeGPT" or model_name == "Ensemble"):
        print('Using TimeGPT model')
        model = ModelFactory.get_model("TimeGPT", config=timegpt_config)
        timegpt_pred = model.fetch_data_and_predict(config=timegpt_data_config)
        print(timegpt_pred)
        if model_name == "TimeGPT":
            return timegpt_pred
    
    # Check path
    list_model = [os.path.basename(f) for f in glob.glob("models/timexer/day/*")]
    check = model_path in list_model
    # Training model nếu không tìm thấy
    if not check:
        run_training_pipeline(datatype='1d', pre_len=pred_length, seq_len=60)

    # load model timexer, chuẩn hoá dữ liệu
    timexer = ModelFactory.get_model("TimeXer", config=timexer_config)
    timexer_pred = timexer.fetch_data_and_predict(config=timexer_data_config)
    print(timexer_pred)
    if model_name == "TimeXer":
        return timexer_pred
    
    # Sử dụng phương pháp đơn giản nhưng hiệu quả là trung bình nhân (do chưa train được weighted_avg) => có thể mơ rộng trong tương lai

    ensemble = ForecastEnsemble(method="weighted_avg", weights=[0.66, 0.34])

    arr1 = np.array(timegpt_pred['close'])
    arr2 = np.array(timexer_pred['close'])

    forecasts = np.vstack([arr1, arr2]).T 
    ensemble_pred = ensemble.predict(forecasts)

    # Gắn lại kết quả trả về
    timexer_pred["close"] = ensemble_pred
    print(timexer_pred)
    return timexer_pred

if __name__ == "__main__":
    prediction_pipeline(model_name="Ensemble", symbol="BTCUSDT", pred_length=7, datatype="1d")