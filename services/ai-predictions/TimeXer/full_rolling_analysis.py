#!/usr/bin/env python3
"""
Extended Rolling Prediction - Chạy toàn bộ dataset
"""

import sys
import os
sys.path.append(os.getcwd())

from rolling_prediction import TimeXerRollingPredictor
import pandas as pd

def run_full_analysis():
    """Chạy rolling prediction cho toàn bộ dataset"""
    
    print("🚀 Full BTC Rolling Prediction Analysis")
    print("="*60)
    
    # Files
    checkpoint_path = './checkpoints/long_term_forecast_CRYPTO_168_24_TimeXer_custom_ftMS_sl168_ll48_pl24_dm256_nh8_el1_dl1_df256_expand2_dc4_fc1_ebtimeF_dtTrue_test_0/checkpoint.pth'
    btc_file = 'btc_normalized_for_timexer.csv'
    
    if not os.path.exists(btc_file):
        print(f"❌ File không tồn tại: {btc_file}")
        return
    
    # Kiểm tra số lượng data có thể dự đoán
    df = pd.read_csv(btc_file)
    total_points = len(df)
    max_windows = (total_points - 168 - 24) // 24 + 1
    
    print(f"📊 Dataset info:")
    print(f"   Total points: {total_points}")
    print(f"   Max possible windows: {max_windows}")
    print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
    
    # Hỏi user số lượng windows muốn chạy
    try:
        user_input = input(f"\n🤔 Bạn muốn chạy bao nhiều windows? (max {max_windows}, enter = 100): ").strip()
        if user_input == "":
            num_windows = 100
        else:
            num_windows = int(user_input)
            num_windows = min(num_windows, max_windows)
    except:
        num_windows = 100
    
    print(f"✅ Sẽ chạy {num_windows} windows")
    
    try:
        # Khởi tạo predictor
        predictor = TimeXerRollingPredictor(checkpoint_path)
        
        # Chạy rolling prediction
        predictions, actuals, dates = predictor.rolling_prediction(
            btc_file, 
            start_idx=168, 
            max_windows=num_windows,
            step_size=24
        )
        
        # Vẽ biểu đồ
        results_df = predictor.plot_results(f'btc_full_rolling_{num_windows}windows.png')
        
        # In summary
        print(f"\n🎯 Final Results Summary:")
        print(f"   Total predictions: {len(predictions)}")
        print(f"   MSE: ${predictor.metrics['MSE']:,.0f}")
        print(f"   MAE: ${predictor.metrics['MAE']:,.0f}")  
        print(f"   MAPE: {predictor.metrics['MAPE']:.1f}%")
        print(f"   R²: {predictor.metrics['R2']:.4f}")
        
        # Phân tích theo thời gian
        results_df['Date'] = pd.to_datetime(results_df['Date'])
        results_df['Year'] = results_df['Date'].dt.year
        
        print(f"\n📈 Performance by Year:")
        yearly_stats = results_df.groupby('Year').agg({
            'Actual': ['mean', 'std'],
            'Predicted': ['mean', 'std']
        }).round(2)
        
        for year in sorted(results_df['Year'].unique()):
            year_data = results_df[results_df['Year'] == year]
            if len(year_data) > 0:
                mae_year = abs(year_data['Predicted'] - year_data['Actual']).mean()
                mape_year = (abs(year_data['Predicted'] - year_data['Actual']) / year_data['Actual']).mean() * 100
                print(f"   {year}: MAE=${mae_year:.0f}, MAPE={mape_year:.1f}%, N={len(year_data)}")
        
        print(f"\n📁 Output files:")
        print(f"   - btc_full_rolling_{num_windows}windows.png")
        print(f"   - btc_full_rolling_{num_windows}windows_results.csv")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_full_analysis()
