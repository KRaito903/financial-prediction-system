# training_pipeline.py

import os
import dotenv
import yaml
import pickle
# Use relative imports
from src.data.saver_factory import SaverFactory
from src.data.fecther_factory import FetcherFactory
from src.features.feature_engineer import FeatureEngineer
from src.utils.normalizer import Normalizer
from src.data.loader.csv_loader import CSVLoader
from src.data.loader.data_loader_service import DataLoaderService
from src.models_lib.model_factory import ModelFactory
from src.models_lib.timexer import TimeXerConfig

dotenv.load_dotenv()

# Import các lớp và hàm helper đã xây dựng

# --- CONFIGURATION ---
CONFIG_PATH = "configs/main_config.yaml"
SYMBOLS_TO_TRAIN =  ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']
ARTIFACTS_DIR = "artifacts" # Thư mục để lưu tất cả các kết quả


def run_training_pipeline(datatype: str = '1d', pre_len: int = 7, seq_len: int = 60):
    try:
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

        # TẢI DỮ LIỆU và SAVE
        # Khoi tao cac factory cho load + save + fetch
        fetch = FetcherFactory.create_data_fetcher("binance", api_key=os.getenv("API-Key"), api_secret=os.getenv("Secret-Key"))
        save = SaverFactory.create_data_saver("csv")

        print("\n Loading data...")

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

        # #  FEATURE ENGINEERING 
        print("\n Engineering features...")
        engineer = FeatureEngineer(lags=read_config['fe']['lags'], emas=read_config['fe']['emas'], add_volatility=read_config['fe']['add_volatility'], add_rsi=read_config['fe']['add_rsi'], add_datetime=read_config['fe']['add_datetime'])
        
        loader = CSVLoader(file_path=f"data/raw/{time_path}")
        data = DataLoaderService(loader).load_data()
        # luu backup 2 cai data cho norm

        data_processed = engineer.transform(data)

        #Chuẩn hoá dữ liệu cho từng đồng (per_symbol - True)
        norm = Normalizer(method="standard", per_symbol=True, columns=read_config['numeric_cols'])
        # Lưu lại file pkl thay vì sử dụng dataloader csv
        data_normalized = norm.fit_transform(data_processed)
        with open(f"artifacts/normalizer_{pre_len}.pkl", "wb") as f:
            pickle.dump(norm, f)

        ## Bước train và lưu model:
        timxer_config = TimeXerConfig(
            data=data_normalized,
            pred=pre_len,
            seq=seq_len,
            path="models/timexer/day",
            model_path=None
        )
        model = ModelFactory.get_model("TimeXer", config=timxer_config)
        print(model)
        model.train()
        # tra kết quả về cho model
        return {
            "model_name": f"timexer_pred_{pre_len}",
            "status": "success"
        }
    except Exception as e:
        return {
            "model_name": None,
            "status": {"error": str(e)}
        }

if __name__ == '__main__':
    # Chạy pipeline trực tiếp từ command line để test
    run_training_pipeline(datatype='1d', pre_len=8, seq_len=60)