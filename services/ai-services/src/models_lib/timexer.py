import torch
from .base_model import BaseModel
from pytorch_forecasting import TimeSeriesDataSet
import lightning as L
import pandas as pd
from typing import Dict, Any
import pandas as pd
import lightning.pytorch as pl
from lightning.pytorch.callbacks import EarlyStopping, ModelCheckpoint
from lightning.pytorch.tuner import Tuner
from pytorch_forecasting import TimeSeriesDataSet
from pytorch_forecasting.metrics import QuantileLoss
from pytorch_forecasting.models.timexer import TimeXer

class TimeXerModel(BaseModel):
    
    def __init__(self, **kagrs):
        """
        Khởi tạo chỉ với các tham số, model thật sẽ được tạo lúc training.
        """
        self.data =  kagrs.get('data', None)
        self.pred = kagrs.get('pred', None)
        self.seq = kagrs.get('seq', None)
        self.path = kagrs.get('path', None)
        self.model_path = None
        if kagrs.get("model_path") is not None:
            self.model_path = kagrs.get("model_path")
        else:
            self._create_model()

    def _create_model(self):
        self.data["time_idx"] = (self.data["timestamp"] - self.data["timestamp"].min()).dt.days

        max_encoder_length = self.pred   # số ngày nhìn lại
        max_prediction_length = self.seq  # số ngày dự đoán tới

        training_cutoff = self.data["time_idx"].max() - max_prediction_length

        training = TimeSeriesDataSet(
            self.data[self.data.time_idx <= training_cutoff],
            time_idx="time_idx",
            target="close",
            group_ids=["symbol"],

            # biến tĩnh
            static_categoricals=["symbol"],

            # biến đã biết trước theo thời gian
            time_varying_known_reals=[
                "time_idx", "day_of_week", "day_sin", "day_cos"
            ],

            # biến chưa biết trước (model phải dự đoán)
            time_varying_unknown_reals=[
                "open", "high", "low", "close", "volume",
                "sentiment_score", "close_lag_1", "close_lag_7",
                "ema_10", "ema_20", "volatility_10", "rsi_14"
            ],

            max_encoder_length=max_encoder_length,
            max_prediction_length=max_prediction_length,
        )
        training.save(self.path + "/timexer_dataset.pkl")

        # 3. Train/Val dataloader
        validation = TimeSeriesDataSet.from_dataset(
            training, self.data, predict=True, stop_randomization=True
        )

        batch_size = 128
        self.train_dataloader = training.to_dataloader(train=True, batch_size=batch_size, num_workers=0)
        self.val_dataloader = validation.to_dataloader(train=False, batch_size=batch_size, num_workers=0)

        # 4. Trainer với EarlyStopping + Save Model
        early_stop_callback = EarlyStopping(
            monitor="val_loss", min_delta=1e-4, patience=3, verbose=False, mode="min"
        )

        checkpoint_callback = ModelCheckpoint(
            dirpath=self.path + "/days/",
            filename=f"timexer-{self.pred}-{self.seq}",
            monitor="val_loss",
            save_top_k=1,
            mode="min"
        )

        self.trainer = pl.Trainer(
            max_epochs=30,
            accelerator="auto",
            gradient_clip_val=0.1,
            limit_train_batches=30,
            callbacks=[early_stop_callback, checkpoint_callback],
        )

        # 5. Model TimeXer
        self.model = TimeXer.from_dataset(
            training,
            context_length=max_encoder_length,
            prediction_length=max_prediction_length,
            hidden_size=64,
            n_heads=4,
            e_layers=2,
            d_ff=256,
            dropout=0.1,
            learning_rate=0.03,
            output_size=7,   # quantile loss => cần output_size=7
            loss=QuantileLoss(),
            log_interval=2,
            reduce_on_plateau_patience=4,
        )
        self.model_path = checkpoint_callback.best_model_path
        print(f"Number of parameters in network: {self.model.size()/1e3:.1f}k")

    def train(self, **kwargs):
        """
        Huấn luyện model TimeXer.
        Lưu ý: Input là TimeSeriesDataSet, không phải DataFrame.
        """
        self.trainer.fit(
            self.model,
            train_dataloaders=self.train_dataloader,
            val_dataloaders=self.val_dataloader,
        )
        print("Training complete.")

    def predict(self, data_to_predict: pd.DataFrame, **kwargs):
        """
        Dự đoán trên dữ liệu mới (phải là DataFrame).
        """
        # Thêm các dòng mới với timestamp = ngày cuối + 1, +2, ..., +seq
        last_day = data_to_predict["timestamp"].max()
        new_rows = []
        for i in range(1, self.seq + 1):
            new_row = data_to_predict.iloc[-1].copy()
            new_row["timestamp"] = last_day + pd.Timedelta(days=i)
            new_rows.append(new_row)
        data_to_predict = pd.concat([data_to_predict, pd.DataFrame(new_rows)], ignore_index=True)


        timexer_loaded = TimeXer.load_from_checkpoint(self.model_path)
        training_loaded = torch.load(self.path + "/timexer_dataset.pkl", weights_only=False)

        min_timestamp_original = data_to_predict["timestamp"].min()
        data_to_predict["time_idx"] = (data_to_predict["timestamp"] - min_timestamp_original).dt.days

        new_prediction_dataset = TimeSeriesDataSet.from_dataset(
            training_loaded, data_to_predict, predict=True, stop_randomization=True
        )

        new_dataloader = new_prediction_dataset.to_dataloader(
            train=False, batch_size=128, num_workers=0
        )

        predictions = timexer_loaded.predict(new_dataloader)
        pred_values = predictions[0].detach().cpu().numpy()

        # Lấy các timestamp mới đã thêm vào
        future_timestamps = data_to_predict["timestamp"].iloc[-self.seq:].reset_index(drop=True)

        # Trả về DataFrame với các cột: timestamp, close
        result_df = pd.DataFrame({
            "timestamp": future_timestamps,
            "close": pred_values
        })
        return result_df

    def evaluate(self, **kwargs) -> Dict[str, Any]:
        """Đánh giá model trên tập validation."""
        if self.trainer is None:
            print("Trainer not available. Evaluation metrics are calculated during training.")
            return {}
        
        # Lấy loss tốt nhất trên tập validation từ trainer
        best_val_loss = self.trainer.callback_metrics.get("val_loss", -1.0)
        metrics = {"best_validation_loss": best_val_loss.item()}
        print(f"Evaluation Metrics: {metrics}")
        return metrics