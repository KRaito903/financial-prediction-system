#!/usr/bin/env python3
"""
Script dự đoán TimeXer với file CSV mới
Input: File CSV có 168 dòng dữ liệu
Output: Dự đoán 24 ngày tiếp theo
"""

import torch
import numpy as np
import pandas as pd
from exp.exp_long_term_forecasting import Exp_Long_Term_Forecast
from data_provider.data_factory import data_provider
import argparse
import warnings
import os
warnings.filterwarnings('ignore')

class TimeXerNewDataPredictor:
    def __init__(self, checkpoint_path):
        """
        Khởi tạo predictor với checkpoint đã train
        """
        self.checkpoint_path = checkpoint_path
        self.args = self.create_args()
        self.exp = Exp_Long_Term_Forecast(self.args)
        
        # Load scaler từ dữ liệu train gốc
        train_data, _ = data_provider(self.args, flag='train')
        self.scaler = train_data.scaler
        
        # Load model
        self.load_model()
        
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
    
    def prepare_input_data(self, csv_file):
        """
        Chuẩn bị dữ liệu input từ CSV file
        CSV phải có format: High, Low, Open, Volume, Marketcap, Coin_ID, Close
        """
        # Đọc CSV
        df = pd.read_csv(csv_file)
        print(f"📊 Loaded data shape: {df.shape}")
        
        # Kiểm tra số dòng
        if len(df) != 168:
            raise ValueError(f"CSV phải có đúng 168 dòng, nhưng có {len(df)} dòng!")
        
        # Kiểm tra columns cần thiết
        required_cols = ['High', 'Low', 'Open', 'Volume', 'Marketcap', 'Coin_ID', 'Close']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            print(f"⚠️  Thiếu columns: {missing_cols}")
            print(f"Available columns: {list(df.columns)}")
            
            # Tự động map columns nếu có thể
            df = self.auto_map_columns(df)
        
        # Lấy features theo thứ tự đúng
        feature_data = df[required_cols].values  # (168, 7)
        
        # Normalize bằng scaler từ dữ liệu train
        normalized_data = self.scaler.transform(feature_data)
        
        print(f"✅ Data prepared: {normalized_data.shape}")
        return normalized_data, df
    
    def auto_map_columns(self, df):
        """Tự động map columns nếu tên khác"""
        column_mapping = {
            'high': 'High',
            'low': 'Low', 
            'open': 'Open',
            'volume': 'Volume',
            'marketcap': 'Marketcap',
            'market_cap': 'Marketcap',
            'coin_id': 'Coin_ID',
            'coinid': 'Coin_ID',
            'close': 'Close',
            'price': 'Close'
        }
        
        # Rename columns
        df_renamed = df.copy()
        df_renamed.columns = [column_mapping.get(col.lower(), col) for col in df.columns]
        
        # Thêm columns thiếu với giá trị mặc định
        required_cols = ['High', 'Low', 'Open', 'Volume', 'Marketcap', 'Coin_ID', 'Close']
        for col in required_cols:
            if col not in df_renamed.columns:
                if col == 'Coin_ID':
                    df_renamed[col] = 0  # Default coin ID
                elif col in ['High', 'Low', 'Open']:
                    # Nếu thiếu OHLC, dùng Close
                    if 'Close' in df_renamed.columns:
                        df_renamed[col] = df_renamed['Close']
                    else:
                        df_renamed[col] = 1.0
                else:
                    df_renamed[col] = 1.0  # Default value
        
        return df_renamed
    
    def predict(self, csv_file, output_file='prediction_24_days.csv'):
        """
        Dự đoán 24 ngày tiếp theo
        """
        print(f"🔮 Predicting next 24 days from {csv_file}")
        
        # Chuẩn bị input
        input_data, original_df = self.prepare_input_data(csv_file)
        
        # Chuyển sang tensor
        input_tensor = torch.FloatTensor(input_data).unsqueeze(0)  # (1, 168, 7)
        
        # Tạo time features (mock)
        x_mark = torch.zeros(1, 168, 4)  # (batch, seq_len, time_features)
        
        # Tạo decoder input
        dec_inp = torch.zeros(1, self.args.pred_len, 7)  # (1, 24, 7)
        dec_mark = torch.zeros(1, self.args.pred_len, 4)  # (1, 24, 4)
        
        # Dự đoán
        with torch.no_grad():
            prediction = self.exp.model(input_tensor, x_mark, dec_inp, dec_mark)
            prediction = prediction.squeeze(0).cpu().numpy()  # (24, 1)
        
        # Inverse transform để có giá trị thực
        # Tạo dummy data cho inverse transform
        dummy_data = np.zeros((24, 7))
        dummy_data[:, -1] = prediction[:, 0]  # Close price ở cột cuối
        
        inverse_pred = self.scaler.inverse_transform(dummy_data)
        predicted_prices = inverse_pred[:, -1]  # Lấy Close price
        
        # Tạo DataFrame kết quả
        result_df = pd.DataFrame({
            'Day': range(1, 25),
            'Predicted_Close_Price': predicted_prices
        })
        
        # Thêm thông tin bổ sung
        last_price = original_df['Close'].iloc[-1] if 'Close' in original_df.columns else predicted_prices[0]
        result_df['Change_from_Last'] = predicted_prices - last_price
        result_df['Change_Percent'] = (result_df['Change_from_Last'] / last_price) * 100
        
        # Lưu kết quả
        result_df.to_csv(output_file, index=False)
        
        print(f"✅ Prediction completed!")
        print(f"📄 Results saved to: {output_file}")
        print(f"📊 Summary:")
        print(f"   Last historical price: ${last_price:.2f}")
        print(f"   First predicted price: ${predicted_prices[0]:.2f}")
        print(f"   Last predicted price (Day 24): ${predicted_prices[-1]:.2f}")
        print(f"   Total change: ${predicted_prices[-1] - last_price:.2f} ({((predicted_prices[-1] - last_price) / last_price * 100):.1f}%)")
        
        return result_df, predicted_prices


def main():
    """Main function để sử dụng script"""
    import sys
    
    print("🚀 TimeXer New Data Predictor")
    print("=" * 50)
    
    # Checkpoint path
    checkpoint_path = './checkpoints/long_term_forecast_CRYPTO_168_24_TimeXer_custom_ftMS_sl168_ll48_pl24_dm256_nh8_el1_dl1_df256_expand2_dc4_fc1_ebtimeF_dtTrue_test_0/checkpoint.pth'
    
    # Kiểm tra input file
    if len(sys.argv) != 2:
        print("Usage: python predict_new_data.py <input_csv_file>")
        print("Example: python predict_new_data.py my_168_days_data.csv")
        return
    
    input_csv = sys.argv[1]
    
    if not os.path.exists(input_csv):
        print(f"❌ File không tồn tại: {input_csv}")
        return
    
    try:
        # Khởi tạo predictor
        predictor = TimeXerNewDataPredictor(checkpoint_path)
        
        # Dự đoán
        result_df, predictions = predictor.predict(input_csv)
        
        # Hiển thị kết quả
        print("\n📈 Top 10 predicted days:")
        print(result_df.head(10).to_string(index=False))
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
