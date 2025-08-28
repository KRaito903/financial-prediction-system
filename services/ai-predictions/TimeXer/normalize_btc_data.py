#!/usr/bin/env python3
"""
Chương trình chuẩn hóa file BTC CSV từ 2018-2025 thành format cho TimeXer
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

def normalize_btc_csv(input_file, output_file, coin_id=9):
    """
    Chuẩn hóa file BTC CSV thành format TimeXer
    
    Args:
        input_file: Đường dẫn file BTC CSV gốc
        output_file: Đường dẫn file CSV đầu ra
        coin_id: ID của coin (mặc định 9 cho BTC)
    """
    
    print(f"🔄 Processing BTC data from {input_file}")
    
    # Đọc file CSV gốc
    df = pd.read_csv(input_file)
    print(f"📊 Original data shape: {df.shape}")
    print(f"📝 Original columns: {list(df.columns)}")
    
    # Hiển thị vài dòng đầu
    print("\n📋 Sample original data:")
    print(df.head(3))
    
    # Tạo DataFrame mới với format chuẩn cho TimeXer
    normalized_df = pd.DataFrame()
    
    # 1. Xử lý Date column
    # Chuyển 'Open time' thành datetime và format lại
    df['Open time'] = pd.to_datetime(df['Open time'])
    normalized_df['date'] = df['Open time'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    # 2. Map các columns OHLCV
    column_mapping = {
        'High': 'High',
        'Low': 'Low', 
        'Open': 'Open',
        'Close': 'Close',
        'Volume': 'Volume'
    }
    
    for new_col, old_col in column_mapping.items():
        if old_col in df.columns:
            normalized_df[new_col] = df[old_col].astype(float)
        else:
            print(f"⚠️  Column '{old_col}' not found, using default values")
            normalized_df[new_col] = 1.0
    
    # 3. Tính Market Cap (ước tính = Close * Volume)
    # Vì không có market cap thực, ta ước tính hoặc dùng giá trị mặc định
    normalized_df['Marketcap'] = normalized_df['Close'] * normalized_df['Volume'] * 1000  # Scale up
    
    # 4. Thêm Coin_ID
    normalized_df['Coin_ID'] = coin_id
    
    # 5. Sắp xếp lại thứ tự columns theo format TimeXer
    final_columns = ['date', 'High', 'Low', 'Open', 'Volume', 'Marketcap', 'Coin_ID', 'Close']
    normalized_df = normalized_df[final_columns]
    
    # 6. Xử lý missing values và outliers
    print(f"\n🔍 Checking data quality...")
    print(f"   Missing values per column:")
    missing_info = normalized_df.isnull().sum()
    for col, missing in missing_info.items():
        if missing > 0:
            print(f"      {col}: {missing}")
    
    # Fill missing values
    numeric_columns = ['High', 'Low', 'Open', 'Close', 'Volume', 'Marketcap']
    for col in numeric_columns:
        if normalized_df[col].isnull().any():
            normalized_df[col] = normalized_df[col].fillna(method='ffill').fillna(method='bfill')
    
    # 7. Kiểm tra và sửa logic errors (High < Low, etc.)
    print(f"\n🔧 Fixing data logic errors...")
    
    # Đảm bảo High >= Low
    mask = normalized_df['High'] < normalized_df['Low']
    if mask.any():
        print(f"   Fixed {mask.sum()} cases where High < Low")
        # Swap High and Low
        normalized_df.loc[mask, ['High', 'Low']] = normalized_df.loc[mask, ['Low', 'High']].values
    
    # Đảm bảo High >= Open, Close và Low <= Open, Close  
    normalized_df['High'] = normalized_df[['High', 'Open', 'Close']].max(axis=1)
    normalized_df['Low'] = normalized_df[['Low', 'Open', 'Close']].min(axis=1)
    
    # 8. Remove duplicates nếu có
    original_len = len(normalized_df)
    normalized_df = normalized_df.drop_duplicates(subset=['date'])
    if len(normalized_df) < original_len:
        print(f"   Removed {original_len - len(normalized_df)} duplicate dates")
    
    # 9. Sort by date
    normalized_df = normalized_df.sort_values('date').reset_index(drop=True)
    
    # 10. Thống kê cuối
    print(f"\n📊 Normalized data statistics:")
    print(f"   Final shape: {normalized_df.shape}")
    print(f"   Date range: {normalized_df['date'].min()} to {normalized_df['date'].max()}")
    print(f"   Close price range: ${normalized_df['Close'].min():.2f} - ${normalized_df['Close'].max():.2f}")
    print(f"   Average daily volume: {normalized_df['Volume'].mean():.2f}")
    
    print(f"\n📋 Sample normalized data:")
    print(normalized_df.head())
    print("...")
    print(normalized_df.tail())
    
    # 11. Lưu file
    normalized_df.to_csv(output_file, index=False)
    print(f"\n✅ Normalized data saved to: {output_file}")
    
    return normalized_df


def create_prediction_sample(normalized_file, sample_days=168, output_sample='btc_168_days_sample.csv'):
    """
    Tạo file mẫu 168 ngày cuối để dự đoán
    """
    df = pd.read_csv(normalized_file)
    
    # Lấy 168 ngày cuối
    sample_df = df.tail(sample_days).copy().reset_index(drop=True)
    
    # Lưu sample
    sample_df.to_csv(output_sample, index=False)
    
    print(f"📄 Created prediction sample: {output_sample}")
    print(f"   Sample shape: {sample_df.shape}")
    print(f"   Date range: {sample_df['date'].min()} to {sample_df['date'].max()}")
    print(f"   Last close price: ${sample_df['Close'].iloc[-1]:.2f}")
    
    return sample_df


def main():
    """Main function"""
    print("🚀 BTC Data Normalizer for TimeXer")
    print("="*50)
    
    # Input và output files
    input_file = 'btc_1d_data_2018_to_2025.csv'
    output_file = 'btc_normalized_for_timexer.csv'
    sample_file = 'btc_168_days_sample.csv'
    
    # Kiểm tra file input
    if not os.path.exists(input_file):
        print(f"❌ File không tồn tại: {input_file}")
        print("Hãy đảm bảo file BTC CSV có tên 'btc_1d_data_2018_to_2025.csv'")
        return
    
    try:
        # 1. Chuẩn hóa dữ liệu
        normalized_df = normalize_btc_csv(input_file, output_file, coin_id=9)
        
        # 2. Tạo sample 168 ngày để dự đoán
        sample_df = create_prediction_sample(output_file, 168, sample_file)
        
        print(f"\n🎉 Hoàn thành!")
        print(f"📁 Files được tạo:")
        print(f"   1. {output_file} - Full normalized data ({len(normalized_df)} rows)")
        print(f"   2. {sample_file} - 168 days sample for prediction")
        
        print(f"\n📖 Cách sử dụng:")
        print(f"   1. Để train model mới: sử dụng {output_file}")
        print(f"   2. Để dự đoán với model đã train:")
        print(f"      python3 predict_new_data.py {sample_file}")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
