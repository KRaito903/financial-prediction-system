"""
AI Services Server Launcher
chạy tối ưu cho FastAPI với Uvicorn
"""
import os
import sys
from pathlib import Path

# Setup project environment
PROJECT_ROOT = Path(__file__).parent
os.environ['PYTHONPATH'] = str(PROJECT_ROOT)

def start_server(mode: str = "dev"):
    """Start the FastAPI server with different modes"""
    import uvicorn
    
    config = {
        "app": "src.main:app",
        "host": "0.0.0.0",
        "port": 4003,
    }
    
    if mode == "dev":
        print("🚀 Starting in DEVELOPMENT mode...")
        config.update({
            "reload": True,
            "reload_dirs": [str(PROJECT_ROOT / "src")],
            "reload_excludes": [".venv", "__pycache__", "*.pyc", ".git"],
            "log_level": "info",
        })
    elif mode == "prod":
        print("🚀 Starting in PRODUCTION mode...")
        config.update({
            "workers": 4,
            "log_level": "warning",
            "access_log": False,
        })
    else:
        print("❌ Invalid mode. Use 'dev' or 'prod'")
        return
    
    uvicorn.run(**config)

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "dev"
    start_server(mode)