# training_pipeline.py

import os
import sys
import dotenv
import yaml
import pickle
from datetime import datetime
from binance.client import Client

# Use relative imports
from src.data.saver_factory import SaverFactory
from src.data.fecther_factory import FetcherFactory
from src.models_lib.timexer import TimeXerModel
from src.features.feature_engineer import FeatureEngineer
from src.utils.normalizer import Normalizer
from src.data.loader.csv_loader import CSVLoader
from src.data.loader.data_loader_service import DataLoaderService
from src.models_lib.timexer import TimeXerModel
from src.models_lib.model_factory import ModelFactory

dotenv.load_dotenv()

# Import các lớp và hàm helper đã xây dựng

# --- CONFIGURATION ---
CONFIG_PATH = "configs/main_config.yaml"
SYMBOLS_TO_TRAIN =  ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']
ARTIFACTS_DIR = "artifacts" # Thư mục để lưu tất cả các kết quả




def run_training_pipeline(datatype: str = '1d', pre_len: int = 7, seq_len: int = 30):
    """
    Thực thi toàn bộ quy trình training model từ đầu đến cuối.
    
    Args:
        datatype (str): Tần suất dữ liệu ('h' cho hàng giờ, 'd' cho hàng ngày).
        pre_len (int): Prediction length - số bước thời gian cần dự đoán.
        seq_len (int): Sequence length - số bước thời gian model nhìn lại (encoder).
    """
    print("=============================================")
    print("🚀 STARTING TRAINING PIPELINE...")
    print(f"Params: DataType='{datatype}', PredictionLength={pre_len}, SequenceLength={seq_len}")
    print("=============================================")

    with open(CONFIG_PATH, 'r') as f:
        read_config = yaml.safe_load(f)

    # Tạo thư mục lưu trữ kết quả cho lần chạy này
    # timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # run_artifact_dir = os.path.join(ARTIFACTS_DIR, timestamp)
    # os.makedirs(run_artifact_dir, exist_ok=True)
    # print(f"Artifacts for this run will be saved in: {run_artifact_dir}")

    # --- BƯỚC 1: TẢI DỮ LIỆU và SAVE ---
    # Khoi tao cac factory cho load + save + fetch
    fetch = FetcherFactory.create_data_fetcher("binance", api_key=os.getenv("API-Key"), api_secret=os.getenv("Secret-Key"))
    save = SaverFactory.create_data_saver("csv")

    print("\n[STEP 1/5] Loading data...")

    date_fetch = "2023-01-01" if pre_len < 7 else "2021-01-01"
    time_path = "day" if datatype == "1d" else "hour"

    print(f"Fetching data from {date_fetch}...")
    for symbol in read_config['coins']:
        data = fetch.fetch_data(
            symbol=symbol,
            interval=datatype,
            start_str=date_fetch,
        )
        save.save_data(data,file_path=f"data/raw/{time_path}/{symbol}.csv")

    # # --- BƯỚC 2: FEATURE ENGINEERING ---
    print("\n[STEP 2/5] Engineering features...")
    engineer = FeatureEngineer(lags=read_config['fe']['lags'], emas=read_config['fe']['emas'], add_volatility=read_config['fe']['add_volatility'], add_rsi=read_config['fe']['add_rsi'], add_datetime=read_config['fe']['add_datetime'])
    loader = CSVLoader(file_path=f"data/raw/{time_path}")
    # luu backup 2 cai data cho norm
    data = DataLoaderService(loader).load_data()
    data_processed = engineer.transform(data)
    save.save_data(data_processed, file_path=f"data/processed/{time_path}_fe.csv")

    #Chuẩn hoá dữ liệu
    norm = Normalizer(method="standard", per_symbol=True, columns=read_config['numeric_cols'])
    data_normalized = norm.fit_transform(data_processed)
    save.save_data(data_normalized, file_path=f"data/processed/{time_path}_norm.csv")

    ## Bước train và lưu model:
    
    model = ModelFactory.get_model("TimeXer",data=data_processed, pred=pre_len, seq=seq_len, path="models/timexer/day", model_path=None)
    print(model)
    model.train()

if __name__ == '__main__':
    # Chạy pipeline trực tiếp từ command line để test
    run_training_pipeline(datatype='1d', pre_len=7, seq_len=30)