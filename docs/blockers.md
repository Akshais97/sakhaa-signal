# TribeV2 Ad Scorer — Production Deployment Blockers

This document highlights the remaining blocker issues and architectural gaps that must be resolved to deploy the **TribeV2 Ad Scorer** Next.js frontend (on Vercel) and FastAPI GPU backend (on Vast.ai) live on the internet.

---

## 1. Artifact Downloads API Gaps (Critical Blocker)
* **Target File:** [apps/web/src/app/api/storage/download/route.ts](file:///e:/dockerizing/Tribe%20V2%20Based%20Ad%20Scorer%20and%20Generator/apps/web/src/app/api/storage/download/route.ts)
* **Issue:** 
  The download endpoint `/api/storage/download` is currently hardcoded to read from the local disk `.local/storage/v0-local-artifacts`. On Vercel, when a user attempts to download any job results (like `full_result_bundle.zip`), the serverless function will look inside its own read-only/ephemeral storage and throw a `404 File Not Found` error.
* **Fix:** 
  Update the route to check the `OBJECT_STORAGE_PROVIDER` setting. When set to `s3` or `b2`, use the `@aws-sdk/client-s3` library to generate a presigned S3 GET URL for the requested file key in `B2_BUCKET_PRIVATE_ARTIFACTS` and redirect the client browser to it:
  ```typescript
  return NextResponse.redirect(presignedUrl);
  ```
  This keeps Vercel stateless and offloads the file download bandwidth and execution time from serverless functions.

---

## 2. No Webhook Callback for Job Status Syncing (Critical Blocker)
* **Target Files:** [apps/web/src/app/api/jobs/[job_id]/route.ts](file:///e:/dockerizing/Tribe%20V2%20Based%20Ad%20Scorer%20and%20Generator/apps/web/src/app/api/jobs/[job_id]/route.ts) & [apps/gpu-worker/app/main.py](file:///e:/dockerizing/Tribe%20V2%20Based%20Ad%20Scorer%20and%20Generator/apps/gpu-worker/app/main.py)
* **Issue:** 
  1. **Active Polling Dependency:** Currently, the database status only updates to `SUCCEEDED` or `FAILED` when the user's browser is active and querying `/api/jobs/[job_id]`. If the user closes the dashboard tab while a job is running, the database status will remain stuck in `RUNNING` or `QUEUED` indefinitely.
  2. **Worker Ephemerality:** Because the GPU worker maintains its job queue `jobs_db` in-memory, if the Vast.ai instance restarts or is re-rented, it loses all historical job statuses. If the database was not updated before the reboot, the frontend will poll the new worker container, get a `404 Job not found` error, and mark the job as permanently failed.
* **Fix:** 
  Expose a webhook endpoint in the Next.js control layer (e.g., `POST /api/jobs/[job_id]/callback`) that the GPU worker calls immediately upon completing or failing a job. The worker should send a signed request to this callback to update the Postgres database.

---

## 3. Hugging Face Gated Model Access (Runtime Blocker)
* **Target File:** [apps/gpu-worker/app/pipeline.py](file:///e:/dockerizing/Tribe%20V2%20Based%20Ad%20Scorer%20and%20Generator/apps/gpu-worker/app/pipeline.py) (line 280)
* **Issue:** 
  The TribeV2 pipeline imports and initializes `TribeModel.from_pretrained("facebook/tribev2")`. The TRIBE v2 model relies on gated components (specifically LLaMA model representations). Running the Docker image on a clean Vast.ai GPU host will throw an authorization error and fail to download the weights.
* **Fix:** 
  1. You must accept Meta's model license terms on HuggingFace.
  2. You must generate a read-access token and pass it to the Vast.ai Docker container as the `HF_TOKEN` environment variable so the model downloader can authenticate.

---

## 4. Authentication and Access Control (Production Blocker)
* **Target File:** [apps/web/src/app/api/jobs/route.ts](file:///e:/dockerizing/Tribe%20V2%20Based%20Ad%20Scorer%20and%20Generator/apps/web/src/app/api/jobs/route.ts)
* **Issue:** 
  The frontend uses a development placeholder (`getOrCreateActiveWorkspace`) that automatically seeds a `Demo User` and `Demo Workspace` to bypass authentication.
* **Fix:** 
  Replace this dev fallback with a live OAuth or Session Provider integration (such as NextAuth, Supabase Auth, or Clerk) to secure user workspaces and data separation in production.

---

## 5. Postgres Connection Pooling (Performance Blocker)
* **Target File:** [apps/web/src/lib/db.ts](file:///e:/dockerizing/Tribe%20V2%20Based%20Ad%20Scorer%20and%20Generator/apps/web/src/lib/db.ts)
* **Issue:** 
  Vercel routes are serverless functions. Under user traffic, they scale up concurrently. Direct connections from multiple serverless instances will quickly exhaust your PostgreSQL database connection limits.
* **Fix:** 
  Ensure the live `DATABASE_URL` connects through a connection pooler (like Supabase Connection Pooler on port `6543` or Prisma Accelerate).

---

## 6. Vast.ai Dynamic Port Allocation (Operations Blocker)
* **Issue:** 
  Vast.ai allocates dynamic public ports mapped to internal container port `8000`. Every time you lease a new instance or restart a container, the public API endpoint URL changes.
* **Fix:** 
  You will need to manually update the `GPU_WORKER_URL` environment variable on Vercel each time the Vast.ai host address/port changes, or utilize a reverse proxy/dynamic DNS mapping.

---

## 7. CORS Configuration on Backblaze B2 (Browser Blocker)
* **Issue:** 
  Direct browser upload requires CORS (Cross-Origin Resource Sharing) permissions on the Backblaze B2 bucket `dockerize-sakhaa-forge-quarantine` for the `PUT` and `OPTIONS` methods.
* **Fix:** 
  Configure the CORS rules on your Backblaze B2 bucket console to allow uploads from your Vercel deployment domain.
