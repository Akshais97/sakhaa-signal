# TribeV2 Ad Scorer — Infrastructure & Architecture Specification

This document details the production-ready infrastructure and runtime architecture for the **TribeV2 Ad Scorer** application. It outlines the hybrid hosting configuration on **Railway** (Control Plane) and **Vast.ai** (Compute Tier), the pull-based job processing queue, and data storage configurations.

---

## 1. System Architecture Overview

The system is structured as a three-tier architecture split across a persistent Control Tier (hosted on Railway) and an ephemeral, high-performance Compute Tier (hosted on Vast.ai).

```mermaid
graph TD
    subgraph Client Tier
        Browser[User Browser]
    end

    subgraph Railway Control Plane
        NextJS[Next.js App: Frontend + Control API]
        Postgres[(PostgreSQL Database)]
    end

    subgraph Storage Tier
        B2[(Backblaze B2 Bucket)]
    end

    subgraph Compute Tier Vast.ai
        Worker[GPU FastAPI Worker Container]
    end

    %% Network interactions
    Browser -->|1. Request Upload & Job| NextJS
    NextJS -->|2. Return Presigned URL| Browser
    Browser -->|3. PUT upload video directly| B2
    NextJS -->|4. Insert QUEUED job| Postgres
    Worker -->|5. Outbound Poll /claim| NextJS
    NextJS -->|6. Atomically claim & return job| Postgres
    Worker -->|7. GET download video| B2
    Worker -->|8. Run GPU Creative Analysis| Worker
    Worker -->|9. PUT report artifacts ZIP & logs| B2
    Worker -->|10. POST callback status update| NextJS
    NextJS -->|11. Update DB Succeeded/Failed| Postgres
    Browser -->|12. Fetch results / logs| NextJS
```

---

## 2. Component Specifications

### A. Control Plane (Next.js Application)
* **Hosting Platform:** **Railway**
* **Runtime:** Node.js 24+ persistent container process (`next start`).
* **Database Connection:** Direct pooling via Prisma (using PostgreSQL standard port `5432` without serverless connection pooler overhead).
* **Responsibilities:**
  * Serves the React frontend pages and user dashboard.
  * Autogenerates secure, S3-compatible Backblaze B2 presigned URLs for client browser uploads (bypassing server size constraints).
  * Creates job metadata in PostgreSQL.
  * Manages the job distribution queue `/api/jobs/claim` atomically.
  * Receives job progress webhooks and updates database states.
  * Redirects client download requests directly to presigned B2 artifact paths.

### B. Database Tier (PostgreSQL)
* **Hosting Platform:** **Supabase / Railway**
* **ORM:** Prisma Client (`@sakhaa-forge/db`).
* **Security:** Row Level Security (RLS) enabled on all tables by default.
* **Responsibilities:** Stores workspaces, memberships, user sessions, and job metadata (status, attempt heartbeat logs, and B2 object keys).

### C. Storage Tier (Backblaze B2)
* **Protocol:** S3-Compatible API.
* **Buckets:**
  * `B2_BUCKET_QUARANTINE`: Stores original video uploads.
  * `B2_BUCKET_PRIVATE_ARTIFACTS`: Stores results (embeddings, mapping, marketing scores, ZIP bundles, and logs).
* **CORS Settings:** Configured to accept `PUT` and `OPTIONS` methods from the Railway frontend domain.

### D. Compute Tier (GPU Worker)
* **Hosting Platform:** **Vast.ai** (NVIDIA CUDA hardware instances).
* **Runtime:** Docker container built from `pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime`.
* **Exposed Ports:** **None** (Outbound traffic only).
* **Responsibilities:**
  * Periodically polls `/api/jobs/claim` on the Control Plane to claim jobs.
  * Downloads original video from B2.
  * Performs frame, audio, and transcript feature extraction.
  * Runs the TribeV2 transformer model.
  * Maps outputs to the HCP-MMP1 cortical parcellations.
  * Generates 15/17 cluster cognitive outputs, marketing outcome scores, and LLM summary bundles.
  * Uploads final result ZIP archives and execution logs directly to B2.
  * Invokes the Next.js status webhook callback on completion.

---

## 3. Data Flow Specification

### Phase 1: Direct-to-Bucket Upload & Job Initialization
1. Browser requests an upload URL from Next.js.
2. Next.js creates a `CREATED` job record and returns a Backblaze B2 presigned PUT URL.
3. Browser performs a direct `PUT` upload to the B2 bucket.
4. Browser notifies Next.js that the upload is complete; Next.js transitions the job status in PostgreSQL to `QUEUED`.

### Phase 2: Pull-Based Compute Execution
1. The GPU worker container polls `/api/jobs/claim` on Railway.
2. Next.js runs an atomic transaction selecting the oldest `QUEUED` job using row locking:
   ```sql
   SELECT id FROM jobs WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
   ```
3. Next.js marks the job status as `RUNNING` in the database and returns the job parameters (Job ID, object key) to the GPU worker.
4. The GPU worker downloads the video from B2 and starts processing.
5. The worker posts intermediate progress milestones (e.g., `ENCODING_VIDEO`, `MAPPING_HCP`) to `/api/jobs/[job_id]/callback` to update the user dashboard.

### Phase 3: Completion & Download
1. The worker compiles outcomes, builds the results ZIP bundle, and uploads it to B2.
2. The worker sends the final callback payload (`status: COMPLETED` or `status: FAILED` with error trace) to the Next.js API.
3. Next.js saves the final state in PostgreSQL.
4. The user clicks "Download Results" in the browser; Next.js signs a B2 GET URL and redirects the user’s browser directly to B2 for download.

---

## 4. Key Environment Variables

### Control Plane (Railway Next.js)
```ini
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# S3/B2 Storage Config
OBJECT_STORAGE_PROVIDER="s3"
AWS_ENDPOINT_URL="https://s3.eu-central-003.backblazeb2.com"
AWS_DEFAULT_REGION="eu-central-003"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
B2_BUCKET_QUARANTINE="dockerize-sakhaa-forge-quarantine"
B2_BUCKET_PRIVATE_ARTIFACTS="dockerize-sakhaa-forge-private-artifacts"

# Security Tokens
GPU_WORKER_TOKEN="your-secure-internal-auth-token"
```

### Compute Worker (Vast.ai Docker Container)
```ini
# Storage Client Config
OBJECT_STORAGE_PROVIDER="s3"
AWS_ENDPOINT_URL="https://s3.eu-central-003.backblazeb2.com"
AWS_DEFAULT_REGION="eu-central-003"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
B2_BUCKET_QUARANTINE="dockerize-sakhaa-forge-quarantine"
B2_BUCKET_PRIVATE_ARTIFACTS="dockerize-sakhaa-forge-private-artifacts"

# Next.js API Access
CONTROL_API_URL="https://your-nextjs-railway-domain.com"
GPU_WORKER_TOKEN="your-secure-internal-auth-token"

# HuggingFace Auth (For gated LLaMA / model weights download)
HF_TOKEN="your-huggingface-read-token"
```
