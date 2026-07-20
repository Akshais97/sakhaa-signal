import os
import uuid
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager
from app.pipeline import run_pipeline
from fastapi import FastAPI, HTTPException, Header, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

# Global cache for health check status
health_status = {
    "status": "healthy",
    "cuda_available": False,
    "device_name": "CPU",
    "pipeline_version": "tribev2-ad-scorer-v1.0"
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-import torch and check CUDA during startup to avoid slow first requests
    print("[STARTUP] Pre-importing PyTorch and checking CUDA...")
    try:
        import torch
        health_status["cuda_available"] = torch.cuda.is_available()
        health_status["device_name"] = torch.cuda.get_device_name(0) if health_status["cuda_available"] else "CPU"
        print(f"[STARTUP SUCCESS] PyTorch imported. CUDA available: {health_status['cuda_available']} ({health_status['device_name']})")
    except Exception as e:
        print(f"[STARTUP WARNING] Failed to import PyTorch or check CUDA: {e}")
    yield

app = FastAPI(title="TribeV2 GPU Worker API", version="1.0.0", lifespan=lifespan)

# Security
security = HTTPBearer()

def get_worker_token() -> str:
    token = os.environ.get("GPU_WORKER_TOKEN")
    if not token:
        # Default fallback for local testing in development
        return "dev-worker-token-123"
    return token

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    expected_token = get_worker_token()
    if credentials.credentials != expected_token:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid GPU worker token"
        )
    return credentials.credentials

# Schemas
class JobPayload(BaseModel):
    job_id: str
    video_object_key: str
    project_name: str
    video_name: str
    cluster_mode: str = "both" # 15, 17, or both
    output_mode: str = "full_export" # scoring_only, training_export_only, scoring_and_training_export, full_export
    run_llm_explanation: bool = True
    brand_name: Optional[str] = None
    campaign_name: Optional[str] = None
    target_audience: Optional[str] = None
    creative_objective: Optional[str] = None

# In-memory job state store for development
jobs_db: Dict[str, Dict[str, Any]] = {}

def process_job_async(job_id: str, payload: JobPayload):
    def update_status(state: str):
        # Abort if the user cancelled the job
        if jobs_db.get(job_id, {}).get("status") == "CANCELLED":
            raise ValueError("Job cancelled by user")
        jobs_db[job_id]["status"] = state

    try:
        jobs_db[job_id]["status"] = "AUTHORIZED"
        result = run_pipeline(job_id, payload.model_dump(), update_status)
        
        # Check one last time before marking complete
        if jobs_db.get(job_id, {}).get("status") == "CANCELLED":
            raise ValueError("Job cancelled by user")
            
        # Set final completion state and manifest
        jobs_db[job_id]["status"] = "COMPLETED"
        jobs_db[job_id]["manifest"] = result.get("manifest")
    except Exception as e:
        if str(e) == "Job cancelled by user" or jobs_db.get(job_id, {}).get("status") == "CANCELLED":
            jobs_db[job_id]["status"] = "CANCELLED"
        else:
            jobs_db[job_id]["status"] = "FAILED"
            jobs_db[job_id]["error_message"] = str(e)

# Endpoints
@app.get("/health")
def health_check():
    return health_status

@app.post("/api/gpu/jobs/run")
def run_job(
    payload: JobPayload,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_token)
):
    job_id = payload.job_id
    if job_id in jobs_db:
        raise HTTPException(status_code=400, detail="Job ID already exists")
    
    # Initialize state
    jobs_db[job_id] = {
        "status": "RECEIVED",
        "payload": payload.model_dump(),
        "error_message": None,
        "manifest": None
    }
    
    # Trigger job in background
    background_tasks.add_task(process_job_async, job_id, payload)
    
    return {
        "job_id": job_id,
        "status": "RECEIVED",
        "message": "Job successfully queued on GPU worker."
    }

@app.get("/api/gpu/jobs/{job_id}")
def get_job_status(job_id: str, token: str = Depends(verify_token)):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job_info = jobs_db[job_id]
    
    # Read the local log file if it exists
    log_path = ROOT_DIR / ".local" / "storage" / "v0-local-artifacts" / "exports" / job_id / "execution_logs.txt"
    logs = []
    if log_path.exists():
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                logs = [line.strip() for line in f.readlines() if line.strip()]
        except Exception:
            pass
            
    return {
        "status": job_info["status"],
        "payload": job_info["payload"],
        "error_message": job_info.get("error_message"),
        "manifest": job_info.get("manifest"),
        "logs": logs
    }

@app.get("/api/gpu/jobs/{job_id}/manifest")
def get_job_manifest(job_id: str, token: str = Depends(verify_token)):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_info = jobs_db[job_id]
    if job_info["status"] != "COMPLETED":
        raise HTTPException(
            status_code=400, 
            detail=f"Manifest not available. Job is in state: {job_info['status']}"
        )
    return job_info["manifest"]

@app.post("/api/gpu/jobs/{job_id}/cancel")
def cancel_job(job_id: str, token: str = Depends(verify_token)):
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    
    current_status = jobs_db[job_id]["status"]
    if current_status in ["COMPLETED", "FAILED", "CANCELLED"]:
        return {"status": current_status, "message": "Job already terminated"}
        
    jobs_db[job_id]["status"] = "CANCELLED"
    return {"status": "CANCELLED", "message": "Job cancellation request sent"}
