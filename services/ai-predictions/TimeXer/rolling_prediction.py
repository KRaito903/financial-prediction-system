#!/usr/bin/env python3
"""
Rolling Prediction với TimeXer
- Lấy 168 dòng để dự đoán 24 dòng tiếp theo
- Tính MSE, MAE cho kết quả dự đoán
- Vẽ biểu đồ so sánh giá thực tế vs dự đoán
"""

import torch
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from exp.exp_long_term_forecasting import Exp_Long_Term_Forecast
from data_provider.data_factory import data_provider
import warnings
import os
from tqdm import tqdm
warnings.filterwarnings('ignore')

class TimeXerRollingPredictor:
    def __init__(self, checkpoint_path):
        """
        Khởi tạo rolling predictor
        """
        self.checkpoint_path = checkpoint_path
        self.args = self.create_args()
        self.exp = Exp_Long_Term_Forecast(self.args)
        
        # Load scaler từ dữ liệu train gốc
        train_data, _ = data_provider(self.args, flag='train')
        self.scaler = train_data.scaler
        
        # Load model
        self.load_model()
        
        # Kết quả dự đoán
        self.predictions = []
        self.actual_values = []
        self.dates = []
        
    def create_args(self):
        """Tạo args phải match với model đã train"""
        class Args:
            def __init__(self):
                # PHẢI MATCH với model đã train
                self.task_name = 'long_term_forecast'
                self.is_training = 0
                self.model_id = 'CRYPTO_168_24'
                self.model = 'TimeXer'
                self.data = 'custom'
                self.root_path = './dataset/crypto/'
                self.data_path = 'all_coins_processed.csv'
                self.features = 'MS'
                self.target = 'Close'
                self.freq = 'd'
                self.checkpoints = './checkpoints/'
                self.seq_len = 168
                self.label_len = 48
                self.pred_len = 24
                self.seasonal_patterns = 'Monthly'
                self.inverse = False
                
                # Model params - PHẢI MATCH
                self.expand = 2
                self.d_conv = 4
                self.top_k = 5
                self.num_kernels = 6
                self.enc_in = 7
                self.dec_in = 7
                self.c_out = 1
                self.d_model = 256
                self.n_heads = 8
                self.e_layers = 1
                self.d_layers = 1
                self.d_ff = 256
                self.moving_avg = 25
                self.factor = 1
                self.distil = True
                self.dropout = 0.1
                self.embed = 'timeF'
                self.activation = 'gelu'
                self.output_attention = False
                self.channel_independence = 1
                self.decomp_method = 'moving_avg'
                self.use_norm = 1
                self.down_sampling_layers = 0
                self.down_sampling_window = 1
                self.down_sampling_method = None
                self.seg_len = 48
                self.patch_len = 24
                
                # GPU/CPU
                self.use_gpu = False
                self.gpu = 0
                self.use_multi_gpu = False
                self.devices = '0,1,2,3'
                self.num_workers = 0
                self.batch_size = 1
                self.use_dtw = False
                self.p_hidden_dims = [128, 128]
                self.p_hidden_layers = 2
                
                # Augmentation attributes
                self.augmentation_ratio = 0
                self.seed = 2
                self.jitter = False
                self.scaling = False
                self.permutation = False
                self.randompermutation = False
                self.magwarp = False
                self.timewarp = False
                self.windowslice = False
                self.windowwarp = False
                self.rotation = False
                self.spawner = False
                self.dtwwarp = False
                self.shapedtwwarp = False
                self.wdba = False
                self.discdtw = False
                self.discsdtw = False
                self.extra_tag = ""
        
        return Args()
    
    def load_model(self):
        """Load model từ checkpoint"""
        if not os.path.exists(self.checkpoint_path):
            raise FileNotFoundError(f"Không tìm thấy checkpoint: {self.checkpoint_path}")
            
        checkpoint = torch.load(self.checkpoint_path, map_location='cpu')
        self.exp.model.load_state_dict(checkpoint)
        self.exp.model.eval()
        print(f"✅ Model loaded from {self.checkpoint_path}")
    
    def predict_single_window(self, input_data):
        """
        Dự đoán cho 1 window 168 ngày
        """
        # Normalize input
        normalized_data = self.scaler.transform(input_data)
        
        # Chuyển sang tensor
        input_tensor = torch.FloatTensor(normalized_data).unsqueeze(0)  # (1, 168, 7)
        
        # Tạo time features (mock)
        x_mark = torch.zeros(1, 168, 4)
        
        # Tạo decoder input
        dec_inp = torch.zeros(1, self.args.pred_len, 7)
        dec_mark = torch.zeros(1, self.args.pred_len, 4)
        
        # Dự đoán
        with torch.no_grad():
            prediction = self.exp.model(input_tensor, x_mark, dec_inp, dec_mark)
            prediction = prediction.squeeze(0).cpu().numpy()  # (24, 1)
        
        # Inverse transform
        dummy_data = np.zeros((24, 7))
        dummy_data[:, -1] = prediction[:, 0]
        inverse_pred = self.scaler.inverse_transform(dummy_data)
        predicted_prices = inverse_pred[:, -1]
        
        return predicted_prices
    
    def rolling_prediction(self, csv_file, start_idx=0, max_windows=None, step_size=24):
        """
        Thực hiện rolling prediction
        Args:
            csv_file: File BTC đã chuẩn hóa
            start_idx: Index bắt đầu
            max_windows: Số lượng windows tối đa (None = all)
            step_size: Bước nhảy (mặc định 24 = không overlap)
        """
        print(f"🔮 Starting rolling prediction on {csv_file}")
        
        # Load data
        df = pd.read_csv(csv_file)
        print(f"📊 Total data points: {len(df)}")
        
        # Columns cần thiết
        feature_cols = ['High', 'Low', 'Open', 'Volume', 'Marketcap', 'Coin_ID', 'Close']
        
        # Tính số windows có thể dự đoán
        seq_len = 168
        pred_len = 24
        max_possible = (len(df) - seq_len - pred_len) // step_size + 1
        
        if max_windows is None:
            max_windows = max_possible
        else:
            max_windows = min(max_windows, max_possible)
        
        print(f"📈 Will predict {max_windows} windows")
        print(f"   Sequence length: {seq_len} days")
        print(f"   Prediction length: {pred_len} days")
        print(f"   Step size: {step_size} days")
        
        # Reset results
        self.predictions = []
        self.actual_values = []
        self.dates = []
        
        # Rolling prediction
        for i in tqdm(range(max_windows), desc="Predicting windows"):
            # Tính index cho window hiện tại
            window_start = start_idx + i * step_size
            input_end = window_start + seq_len
            target_end = input_end + pred_len
            
            # Kiểm tra bounds
            if target_end > len(df):
                break
            
            # Lấy input data (168 ngày)
            input_data = df.iloc[window_start:input_end][feature_cols].values
            
            # Lấy actual values (24 ngày tiếp theo)
            actual_data = df.iloc[input_end:target_end]['Close'].values
            
            # Lấy dates
            dates = df.iloc[input_end:target_end]['date'].values
            
            # Dự đoán
            try:
                predicted_prices = self.predict_single_window(input_data)
                
                # Lưu kết quả
                self.predictions.extend(predicted_prices)
                self.actual_values.extend(actual_data)
                self.dates.extend(dates)
                
            except Exception as e:
                print(f"❌ Error at window {i}: {e}")
                continue
        
        print(f"✅ Completed {len(self.predictions)} predictions")
        
        # Tính metrics
        self.calculate_metrics()
        
        return self.predictions, self.actual_values, self.dates
    
    def calculate_metrics(self):
        """Tính MSE, MAE và các metrics khác"""
        if len(self.predictions) == 0:
            print("❌ No predictions to calculate metrics")
            return
        
        pred_array = np.array(self.predictions)
        actual_array = np.array(self.actual_values)
        
        # Tính metrics
        mse = np.mean((pred_array - actual_array) ** 2)
        mae = np.mean(np.abs(pred_array - actual_array))
        rmse = np.sqrt(mse)
        mape = np.mean(np.abs((pred_array - actual_array) / actual_array)) * 100
        
        # R-squared
        ss_res = np.sum((actual_array - pred_array) ** 2)
        ss_tot = np.sum((actual_array - np.mean(actual_array)) ** 2)
        r2 = 1 - (ss_res / ss_tot)
        
        print(f"\n📊 Prediction Metrics:")
        print(f"   MSE:  {mse:.2f}")
        print(f"   MAE:  {mae:.2f}")
        print(f"   RMSE: {rmse:.2f}")
        print(f"   MAPE: {mape:.2f}%")
        print(f"   R²:   {r2:.4f}")
        
        # Lưu metrics
        self.metrics = {
            'MSE': mse,
            'MAE': mae,
            'RMSE': rmse,
            'MAPE': mape,
            'R2': r2,
            'n_predictions': len(self.predictions)
        }
        
        return self.metrics
    
    def plot_results(self, save_path='btc_rolling_prediction.png', max_points=2000):
        """
        Vẽ biểu đồ so sánh giá thực tế vs dự đoán
        """
        if len(self.predictions) == 0:
            print("❌ No predictions to plot")
            return
        
        print(f"📈 Creating prediction plot...")
        
        # Tạo DataFrame
        results_df = pd.DataFrame({
            'Date': self.dates,
            'Actual': self.actual_values,
            'Predicted': self.predictions
        })
        
        # Convert date to datetime
        results_df['Date'] = pd.to_datetime(results_df['Date'])
        
        # Subsample nếu quá nhiều điểm
        if len(results_df) > max_points:
            step = len(results_df) // max_points
            results_df = results_df.iloc[::step]
            print(f"   Subsampled to {len(results_df)} points for plotting")
        
        # Tạo plot
        plt.figure(figsize=(20, 12))
        
        # Main plot - Time series
        plt.subplot(2, 2, 1)
        plt.plot(results_df['Date'], results_df['Actual'], 
                label='Actual Price', color='blue', linewidth=1.5, alpha=0.8)
        plt.plot(results_df['Date'], results_df['Predicted'], 
                label='Predicted Price', color='red', linewidth=1.5, alpha=0.8)
        plt.title('BTC Price: Actual vs Predicted (Rolling Prediction)', fontsize=14)
        plt.xlabel('Date', fontsize=12)
        plt.ylabel('Price ($)', fontsize=12)
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        
        # Scatter plot
        plt.subplot(2, 2, 2)
        plt.scatter(results_df['Actual'], results_df['Predicted'], 
                   alpha=0.5, color='purple', s=10)
        
        # Perfect prediction line
        min_price = min(results_df['Actual'].min(), results_df['Predicted'].min())
        max_price = max(results_df['Actual'].max(), results_df['Predicted'].max())
        plt.plot([min_price, max_price], [min_price, max_price], 
                'r--', label='Perfect Prediction', linewidth=2)
        
        plt.title('Actual vs Predicted Scatter Plot', fontsize=14)
        plt.xlabel('Actual Price ($)', fontsize=12)
        plt.ylabel('Predicted Price ($)', fontsize=12)
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Residuals plot
        plt.subplot(2, 2, 3)
        residuals = results_df['Predicted'] - results_df['Actual']
        plt.plot(results_df['Date'], residuals, color='green', linewidth=1, alpha=0.7)
        plt.axhline(y=0, color='red', linestyle='--', linewidth=2)
        plt.title('Prediction Residuals Over Time', fontsize=14)
        plt.xlabel('Date', fontsize=12)
        plt.ylabel('Residuals ($)', fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        
        # Histogram of residuals
        plt.subplot(2, 2, 4)
        plt.hist(residuals, bins=50, alpha=0.7, color='orange', edgecolor='black')
        plt.axvline(x=0, color='red', linestyle='--', linewidth=2)
        plt.title('Distribution of Prediction Residuals', fontsize=14)
        plt.xlabel('Residuals ($)', fontsize=12)
        plt.ylabel('Frequency', fontsize=12)
        plt.grid(True, alpha=0.3)
        
        # Add metrics text
        if hasattr(self, 'metrics'):
            metrics_text = f"""Metrics:
MSE: ${self.metrics['MSE']:,.0f}
MAE: ${self.metrics['MAE']:,.0f}
RMSE: ${self.metrics['RMSE']:,.0f}
MAPE: {self.metrics['MAPE']:.1f}%
R²: {self.metrics['R2']:.4f}
N: {self.metrics['n_predictions']:,}"""
            
            plt.figtext(0.02, 0.02, metrics_text, fontsize=10, 
                       bbox=dict(boxstyle="round,pad=0.5", facecolor="lightgray"))
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"📊 Plot saved to {save_path}")
        plt.show()
        
        # Lưu results
        results_csv = save_path.replace('.png', '_results.csv')
        results_df.to_csv(results_csv, index=False)
        print(f"📄 Results saved to {results_csv}")
        
        return results_df


def main():
    """Main function"""
    print("🚀 TimeXer Rolling Prediction Analysis")
    print("="*60)
    
    # Checkpoint path
    checkpoint_path = './checkpoints/long_term_forecast_CRYPTO_168_24_TimeXer_custom_ftMS_sl168_ll48_pl24_dm256_nh8_el1_dl1_df256_expand2_dc4_fc1_ebtimeF_dtTrue_test_0/checkpoint.pth'
    
    # Input file
    btc_file = 'btc_normalized_for_timexer.csv'
    
    if not os.path.exists(btc_file):
        print(f"❌ File không tồn tại: {btc_file}")
        print("Hãy chạy normalize_btc_data.py trước!")
        return
    
    try:
        # Khởi tạo predictor
        predictor = TimeXerRollingPredictor(checkpoint_path)
        
        # Chạy rolling prediction
        # Bắt đầu từ index 168 để có đủ dữ liệu
        # Giới hạn 50 windows để test (có thể tăng lên)
        predictions, actuals, dates = predictor.rolling_prediction(
            btc_file, 
            start_idx=168, 
            max_windows=50,  # Tăng lên nếu muốn test nhiều hơn
            step_size=24
        )
        
        # Vẽ biểu đồ
        results_df = predictor.plot_results('btc_rolling_prediction.png')
        
        print(f"\n🎉 Analysis completed!")
        print(f"📁 Output files:")
        print(f"   - btc_rolling_prediction.png (biểu đồ)")
        print(f"   - btc_rolling_prediction_results.csv (kết quả)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
