from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional, List
import logging
from ..utils.uploader import uploader
from ..models.backtest_schema import MLBacktestInput, BacktestResult, run_and_save_backtest
from ..services.backtest_service import BacktestServiceFactory, MLTradingStrategy
from ..utils.OHLCV_fetcher import BinanceOHLCV
import pandas as pd
import datetime
from tempfile import SpooledTemporaryFile
import os

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/models", tags=["Model Management"])


@router.post("/upload")
async def upload_model(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    model_name: Optional[str] = Form(None)
):
    """
    Upload an ML model file.
    
    Args:
        file: The model file to upload
        user_id: ID of the user uploading the model
        model_name: Optional custom name for the model
        
    Returns:
        Dictionary containing upload information
    """
    try:
        result = await uploader.upload_model(file, user_id, model_name)
        return {
            "success": True,
            "message": "Model uploaded successfully",
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading model: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/user/{user_id}")
async def get_user_models(user_id: str):
    """
    Get list of ML models uploaded by a user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        List of model information
    """
    try:
        models = uploader.get_user_models(user_id)
        return {
            "success": True,
            "data": models
        }
    except Exception as e:
        logger.error(f"Error fetching user models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")


@router.delete("/user/{user_id}/model/{filename}")
async def delete_model(user_id: str, filename: str):
    """
    Delete an ML model file.
    
    Args:
        user_id: ID of the user
        filename: Name of the file to delete
        
    Returns:
        Success status
    """
    try:
        success = uploader.delete_model(user_id, filename)
        if success:
            return {
                "success": True,
                "message": "Model deleted successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Model not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting model: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.get("/user/{user_id}/model/{filename}/path")
async def get_model_path(user_id: str, filename: str):
    """
    Get the path to a specific model file.
    
    Args:
        user_id: ID of the user
        filename: Name of the model file
        
    Returns:
        File path information
    """
    try:
        path = uploader.get_model_path(user_id, filename)
        if path:
            return {
                "success": True,
                "data": {
                    "filename": filename,
                    "file_path": path
                }
            }
        else:
            raise HTTPException(status_code=404, detail="Model not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model path: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model path: {str(e)}")


@router.post("/backtest/ml")
async def run_ml_backtest_with_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    symbol: str = Form(...),
    interval: str = Form("1d"),
    limit: int = Form(1000),
    threshold: float = Form(0.5),
    period: str = Form("1D"),
    init_cash: float = Form(10000.0),
    fees: float = Form(0.001),
    slippage: float = Form(0.001),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    feature_columns: Optional[str] = Form(None),
    fixed_size: Optional[bool] = Form(None),
    percent_size: Optional[float] = Form(None)
):
    """
    Run ML backtest with uploaded model file.
    
    Args:
        file: The ML model file
        user_id: ID of the user
        symbol: Trading symbol (e.g., 'BTCUSDT')
        interval: Kline interval ('1m', '5m', '1h', '1d', etc.)
        limit: Number of data points to fetch
        threshold: ML model prediction threshold
        period: Backtest period
        init_cash: Initial cash amount
        fees: Trading fees
        slippage: Slippage amount
        start_date: Start date in 'YYYY-MM-DD' format
        end_date: End date in 'YYYY-MM-DD' format
        feature_columns: Comma-separated feature column names
        fixed_size: Whether to use fixed position size
        percent_size: Percentage of portfolio to use per trade
        
    Returns:
        Backtest results
    """
    try:
        # Upload the model file temporarily
        upload_result = await uploader.upload_model(
            file, 
            user_id, 
            f"temp_ml_model_{datetime.datetime.utcnow().timestamp()}"
        )
        model_path = upload_result["file_path"]
        
        # Parse feature columns if provided
        feature_cols = None
        if feature_columns:
            feature_cols = [col.strip() for col in feature_columns.split(",")]
        
        # Create ML service
        service = BacktestServiceFactory.create_service("ml")
        
        # Fetch OHLCV data
        from ..models.backtest_schema import fetch_ohlcv_data
        fetched_data = await fetch_ohlcv_data(
            symbol=symbol,
            interval=interval,
            limit=limit,
            start_date=start_date,
            end_date=end_date,
        )
        
        # Transform fetched data to DataFrame
        data_dict_list = [
            {
                "Date": item["Date"],
                "Open": item["Open"],
                "High": item["High"],
                "Low": item["Low"],
                "Close": item["Close"],
                "Volume": item["Volume"],
            }
            for item in fetched_data
        ]
        data = pd.DataFrame(data_dict_list)
        data["Date"] = pd.to_datetime(data["Date"])
        data.set_index("Date", inplace=True)
        
        # Create ML strategy
        strategy = MLTradingStrategy(
            model_path=model_path,
            feature_columns=feature_cols,
            threshold=threshold,
        )
        
        backtest_params = {
            "data": data,
            "strategy": strategy,
            "period": period,
            "init_cash": init_cash,
            "fees": fees,
            "slippage": slippage,
            "fixed_size": fixed_size,
            "percent_size": percent_size,
        }
        
        # Run the backtest
        result = service.run_backtest(**backtest_params)
        
        # Extract and format data for response
        portfolio_values = result.get_portfolio_values_with_signals()
        portfolio_data = []
        
        for _, row in portfolio_values.iterrows():
            if isinstance(portfolio_values.index, pd.DatetimeIndex):
                date_value = str(row.name)
            elif "Date" in row:
                date_value = str(row["Date"])
            else:
                date_value = str(datetime.datetime.now())
                
            portfolio_data.append({
                "Date": date_value,
                "portfolio_value": float(row.get("value", row.get("portfolio_value", 0))),
                "signal": row.get("signal", "hold"),
            })
        
        # Calculate metrics
        stats = result.get_stats()
        portfolio = result.get_portfolio()
        all_trades = (
            portfolio.trades.records_readable if portfolio else pd.DataFrame()
        )
        winning_trades = len(all_trades[all_trades["Return"] > 0])
        losing_trades = len(all_trades[all_trades["Return"] <= 0])
        total_trades = len(all_trades)
        win_rate = (
            (winning_trades / total_trades) * 100 if total_trades > 0 else 0.0
        )
        
        # Prepare response
        response_data = {
            "success": True,
            "data": {
                "symbol": symbol,
                "status": "success",
                "portfolio_data": portfolio_data,
                "metrics": {
                    "strategy_name": strategy.get_strategy_name(),
                    "total_return": stats.get("total_return", 0.0),
                    "sharpe_ratio": stats.get("sharpe_ratio", 0.0),
                    "max_drawdown": stats.get("max_drawdown", 0.0),
                    "win_rate": win_rate,
                },
                "winning_trades": winning_trades,
                "losing_trades": losing_trades,
                "total_trades": total_trades,
                "profit_factor": stats.get("profit_factor", None),
                "created_at": datetime.datetime.utcnow().isoformat(),
            }
        }
        
        # Clean up the temporary model file
        try:
            if os.path.exists(model_path):
                os.remove(model_path)
                logger.info(f"Temporary model file cleaned up: {model_path}")
        except Exception as cleanup_error:
            logger.warning(f"Could not clean up temporary file {model_path}: {cleanup_error}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error during ML backtest with file upload: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"ML backtest failed: {str(e)}"
        )
