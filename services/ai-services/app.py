# main_api.py
# Cài đặt: pip install fastapi uvicorn

from datetime import datetime
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from src.pipelines.training_pipeline import run_training_pipeline

app = FastAPI(title="AI Prediction Training API")

# Định nghĩa input cho API
class TrainingParams(BaseModel):
    datatype: str = '1d'
    pre_len: int = 7
    seq_len: int = 30

# Lưu trạng thái của các job training
training_jobs = {}

@app.post("/train")
def trigger_training_job(params: TrainingParams, background_tasks: BackgroundTasks):
    """
    Endpoint để kích hoạt một job training mới.
    Nó sẽ chạy ngầm và trả về ID của job ngay lập tức.
    """
    job_id = f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Thêm job vào danh sách background để FastAPI chạy ngầm
    # API sẽ không bị block trong lúc model đang train
    background_tasks.add_task(run_training_pipeline, params.datatype, params.pre_len, params.seq_len)
    
    training_jobs[job_id] = "running"
    
    return {"message": "Training job started successfully.", "job_id": job_id}

@app.get("/status/{job_id}")
def get_job_status(job_id: str):
    """
    Endpoint để kiểm tra trạng thái của một job (ví dụ đơn giản).
    """
    status = training_jobs.get(job_id, "not_found")
    return {"job_id": job_id, "status": status}