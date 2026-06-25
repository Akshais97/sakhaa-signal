import os
import pytest
from fastapi.testclient import TestClient
from app.main import app, jobs_db

client = TestClient(app)

# Ensure the mock DB is cleared for tests
@pytest.fixture(autouse=True)
def run_before_and_after_tests():
    jobs_db.clear()
    yield
    jobs_db.clear()

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "cuda_available" in data

def test_run_job_unauthorized():
    payload = {
        "job_id": "test-job-123",
        "video_object_key": "uploads/test-job-123/original.mp4",
        "project_name": "Test Project",
        "video_name": "test_video",
    }
    response = client.post("/api/gpu/jobs/run", json=payload)
    assert response.status_code == 401  # FastAPI yields 401 Unauthorized for missing HTTPBearer header


def test_run_job_authorized_default_token():
    payload = {
        "job_id": "test-job-123",
        "video_object_key": "uploads/test-job-123/original.mp4",
        "project_name": "Test Project",
        "video_name": "test_video",
    }
    # Default token is "dev-worker-token-123"
    headers = {"Authorization": "Bearer dev-worker-token-123"}
    response = client.post("/api/gpu/jobs/run", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == "test-job-123"
    assert data["status"] == "RECEIVED"

def test_get_job_status():
    headers = {"Authorization": "Bearer dev-worker-token-123"}
    # Setup job state manually in mock DB
    jobs_db["test-job-123"] = {
        "status": "RUNNING",
        "payload": {},
        "error_message": None,
        "manifest": None
    }
    response = client.get("/api/gpu/jobs/test-job-123", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RUNNING"
