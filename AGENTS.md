# AGENTS.md — TribeV2 Ad Scorer App

## 1. Project Identity

This repository is for the **TribeV2 Ad Scorer application**.

The app has two main parts:

```text
1. Vercel Frontend App
   - Next.js UI
   - OAuth/login
   - upload flow
   - job dashboard
   - progress view
   - result preview
   - download links

2. Vast.ai GPU Backend
   - FastAPI GPU worker
   - video/audio/text preprocessing
   - TribeV2 encoders
   - fused tensor creation
   - transformer inference
   - HCP-MMP1 mapping
   - 15/17 cluster outputs
   - EP / VP / CS / BR scoring
   - Conversion / Brand Recall analysis
   - LLM explanation
   - artifact bundle export
```

This is not the ERP application.

---

## 2. Correct Runtime Split

### Frontend Runtime

Hosted on:

```text
Vercel
```

Owns:

```text
Next.js frontend
OAuth/login
user session
project/job creation UI
video upload UI
job progress UI
results page
download buttons
frontend API calls
```

Does not own:

```text
GPU inference
video encoding
transformer execution
HCP mapping
artifact generation
large file processing
```

### GPU Backend Runtime

Hosted on:

```text
Vast.ai or any NVIDIA GPU host
```

Owns:

```text
FastAPI processing API
object storage video download
TribeV2 pipeline execution
encoded feature export
raw transformer output export
HCP-MMP1 mapping
15-cluster outputs
17-cluster A-Q outputs
marketing score export
LLM explanation adapter
result ZIP generation
training-ready ZIP generation
artifact upload
```

Does not own:

```text
public login page
OAuth
billing
user dashboard
frontend routing
campaign UI
```

---

## 3. Recommended Repository Shape

Use either one monorepo or two repositories.

Preferred monorepo:

```text
tribev2-ad-scorer/
  apps/
    web/
      Next.js frontend hosted on Vercel

    gpu-worker/
      FastAPI GPU backend hosted on Vast.ai

  packages/
    shared-contracts/
      shared TypeScript/Python-compatible schemas if needed

  docs/
    Design.md
    GPU_PIPELINE_MINIMAL_SPEC.md
    AGENTS.md
```

If using separate repos:

```text
tribev2-ad-scorer-web
tribev2-ad-scorer-gpu-worker
```

---

## 4. Frontend App Responsibilities

The frontend agent must build the user-facing app.

Required screens:

```text
Login page
Dashboard page
Create scoring job page
Video upload page
Job progress page
Result summary page
Artifact download page
```

Required frontend actions:

```text
authenticate user
create job record
request presigned upload URL
upload video to object storage
send processing request to GPU backend/control API
poll job status
display EP / VP / CS / BR scores
display Conversion analysis
display Brand Recall analysis
display LLM explanation preview
show download links for result bundle and training bundle
```

The frontend must not upload large videos through Vercel server functions unless explicitly required. Prefer direct browser upload to object storage using presigned URLs.

---

## 5. GPU Backend Responsibilities

The GPU backend agent must build the processing worker.

Required processing flow:

```text
1. Receive signed job request
2. Validate service token
3. Download video from object storage
4. Store original video locally
5. Extract frames
6. Extract audio
7. Generate or ingest transcript
8. Segment video
9. Run video encoder
10. Save video encoded features
11. Run audio encoder
12. Save audio encoded features
13. Run text encoder
14. Save text encoded features
15. Create fused transformer input tensor
16. Save fused transformer input files
17. Run current TribeV2 transformer/inference model
18. Save raw transformer outputs
19. Decode brain/outcome heads
20. Map outputs to HCP-MMP1
21. Generate 15-cluster outputs if requested
22. Generate 17-cluster A-Q outputs if requested
23. Compute EP / VP / CS / BR
24. Compute Conversion and Brand Recall analysis
25. Build LLM evidence bundle
26. Run LLM explanation if enabled
27. Package result bundles
28. Upload artifacts to object storage
29. Return/update final manifest
```

---

## 6. Frontend to Backend Interaction

The user interacts only with the frontend.

Correct flow:

```text
User
→ Vercel frontend
→ OAuth/login
→ create job
→ upload video to object storage
→ frontend/control API sends job to Vast.ai GPU backend
→ GPU backend processes video
→ GPU backend uploads artifacts
→ frontend displays results
```

The frontend should not call unauthenticated Vast.ai endpoints.

The GPU backend should accept only signed/internal requests.

---

## 7. API Boundary

### Frontend/control API should expose

```text
POST /api/jobs
GET /api/jobs
GET /api/jobs/{job_id}
POST /api/jobs/{job_id}/upload-url
POST /api/jobs/{job_id}/start
GET /api/jobs/{job_id}/artifacts
GET /api/jobs/{job_id}/download
```

### GPU backend should expose

```text
GET /health
POST /api/gpu/jobs/run
GET /api/gpu/jobs/{job_id}
GET /api/gpu/jobs/{job_id}/manifest
```

Frontend users should not directly use the GPU backend API.

---

## 8. Required Job Payload to GPU Backend

```json
{
  "job_id": "job_123",
  "video_object_key": "uploads/job_123/original_video.mp4",
  "project_name": "Mantri Project",
  "video_name": "main_ad_video",
  "cluster_mode": "both",
  "output_mode": "full_export",
  "run_llm_explanation": true,
  "brand_name": "optional",
  "campaign_name": "optional",
  "target_audience": "optional",
  "creative_objective": "optional"
}
```

Allowed `cluster_mode`:

```text
15
17
both
```

Allowed `output_mode`:

```text
scoring_only
training_export_only
scoring_and_training_export
full_export
```

---

## 9. Required Output Artifact Contract

Each completed GPU job must produce:

```text
/data/outputs/{job_id}/
  input/
  preprocessing/
  encoded_features/
  transformer_inputs/
  raw_transformer_outputs/
  decoded_outputs/
  hcp_mapping/
  cluster_15_outputs/
  cluster_17_outputs/
  marketing_scores/
  llm_inputs/
  llm_explanation/
  training_export/
  exports/
  manifest.json
```

Mandatory artifacts:

```text
encoded_features/video_embeddings.pt
encoded_features/audio_embeddings.pt
encoded_features/text_embeddings.pt
transformer_inputs/fused_sequence_tensor.pt
raw_transformer_outputs/raw_predictions.npy
hcp_mapping/brain_area_activations.csv
marketing_scores/marketing_scores.json
marketing_scores/marketing_outcome_scores.csv
training_export/training_ready_bundle.zip
exports/full_result_bundle.zip
manifest.json
```

---

## 10. HCP and Cluster Rules

HCP-MMP1 is canonical.

```text
fsaverage5 outputs
→ HCP-MMP1 parcels
→ HCP region activations
→ 15-cluster aggregation
→ 17-cluster aggregation
```

The 17-cluster architecture must contain exactly A-Q.

```text
A Visual
B Face/Scene
C Theory of Mind
D Arousal
E Episodic Memory
F Value/Self
G Language
H Music
I Attention
J Friction
K Motor/Embodied
L Surprise
M Audio-Visual Binding
N Trust
O Aesthetic
P Valence Direction
Q Narrative Temporal Coherence
```

Any 17-cluster output missing A-Q must fail validation.

---

## 11. Score Rules

The deterministic pipeline owns all numeric scores.

Mandatory scores:

```text
EP: Emotional Pull
VP: Visual Pull
CS: Cognitive Stickiness
BR: Brand Recall
Conversion Support
Brand Recall Potential
```

Rules:

```text
LLM may explain scores.
LLM must not calculate scores.
LLM must not overwrite scores.
LLM must not mutate score files.
Frontend must display deterministic scores from saved score artifacts.
```

---

## 12. LLM Explanation Rules

The LLM receives structured evidence only after deterministic outputs are complete.

It must explain:

```text
why Conversion is at its current level
why Brand Recall is at its current level
what is genuinely good
what is weak
what should be improved
steps to improve
15-cluster vs 17-cluster differences
HCP/brain/cluster evidence supporting the conclusion
```

Save outputs as:

```text
llm_explanation/explanation_report.md
llm_explanation/explanation_report.json
llm_explanation/executive_summary.txt
```

If the LLM fails, the deterministic result bundle should still complete unless the job explicitly requires LLM output.

---

## 13. Security Rules

Frontend:

```text
Use OAuth/login.
Protect dashboard routes.
Do not expose GPU_WORKER_TOKEN to browser.
Use presigned URLs for video upload/download.
```

GPU backend:

```text
Reject requests without GPU_WORKER_TOKEN.
Do not expose public processing endpoints.
Do not hardcode secrets.
Do not log API keys.
Do not store artifacts publicly.
Use private object storage.
```

Required GPU backend header:

```text
Authorization: Bearer <GPU_WORKER_TOKEN>
```

---

## 14. Storage Rules

Object storage owns:

```text
original video
encoded features
fused transformer inputs
raw transformer outputs
HCP mapping outputs
cluster outputs
marketing scores
LLM explanation
full result bundle
training-ready bundle
manifest.json
```

Database owns only metadata:

```text
user id
project id
job id
job status
artifact object keys
content hashes
timestamps
error messages
model version
pipeline version
```

Do not store large binaries in PostgreSQL.

---

## 15. Frontend Build Rules

Frontend stack:

```text
Next.js
OAuth/Auth provider
Tailwind/shadcn optional
Vercel deployment
```

Frontend must call its own backend/control routes first, not the Vast.ai GPU worker directly from the browser.

Good:

```text
Browser → Vercel API route/control backend → Vast.ai GPU backend
```

Bad:

```text
Browser → Vast.ai GPU backend with secret token
```

---

## 16. GPU Worker Build Rules

GPU worker stack:

```text
FastAPI
Uvicorn
PyTorch with CUDA
ffmpeg
OpenCV
NumPy
Pandas
Scikit-learn
Transformers if needed
Torchaudio/librosa if needed
S3-compatible storage client
LLM API client optional
```

Docker image must not include:

```text
frontend app
OAuth system
billing
Prisma/NestJS unless explicitly selected later
large training dataset
permanent output artifacts
```

Expose only:

```text
8000
```

---

## 17. Job States

Use these states for the GPU worker:

```text
RECEIVED
AUTHORIZED
DOWNLOADING_INPUT
VALIDATING
PREPROCESSING
ENCODING_VIDEO
ENCODING_AUDIO
ENCODING_TEXT
BUILDING_FUSED_INPUT
RUNNING_TRANSFORMER
EXPORTING_RAW_OUTPUTS
DECODING_HEADS
MAPPING_HCP
GENERATING_15_CLUSTER_OUTPUTS
GENERATING_17_CLUSTER_OUTPUTS
SCORING_MARKETING_OUTCOMES
RUNNING_LLM_EXPLANATION
PACKAGING_RESULTS
UPLOADING_ARTIFACTS
COMPLETED
FAILED
CANCELLED
```

Frontend should map these states into user-friendly progress labels.

---

## 18. Build Order

Build in this order:

```text
1. Frontend auth/login shell
2. Job creation UI
3. Object storage upload flow
4. Job database metadata
5. GPU backend health endpoint
6. GPU backend signed job endpoint
7. Frontend/control route to trigger GPU job
8. GPU object storage download
9. Local output folder contract
10. TribeV2 script wrappers
11. Encoded feature export validation
12. Raw transformer output validation
13. HCP-MMP1 mapping
14. 15/17 cluster outputs
15. Marketing score exports
16. LLM evidence bundle
17. LLM explanation adapter
18. Result ZIP packaging
19. Artifact upload
20. Frontend job progress page
21. Frontend result page
22. Frontend download links
23. Docker build for GPU worker
24. Vast.ai GPU test
25. Vercel deployment test
```

---

## 19. Agent Behavior Rules

When modifying this repo:

```text
Keep frontend and GPU worker boundaries clear.
Do not put GPU processing in Vercel.
Do not expose GPU worker token in browser.
Do not make Vast.ai the public login app.
Do not remove mandatory training artifacts.
Do not let LLM calculate or mutate deterministic scores.
Do not change HCP-MMP1 target without explicit approval.
Do not change 17-cluster A-Q contract.
Do not store large binaries in Git.
Do not hardcode secrets.
Do not silently skip failed pipeline stages.
Prefer small, verifiable changes.
Add or update tests for behavior changes.
```

---

## 20. Definition of Done

The full app is done when:

```text
1. User can log in on Vercel frontend.
2. User can create a scoring job.
3. User can upload a video to object storage.
4. Frontend/control layer can trigger the Vast.ai GPU backend.
5. GPU backend rejects unauthorized requests.
6. GPU backend downloads the video.
7. GPU backend runs the full TribeV2 pipeline.
8. Encoded features are saved.
9. Fused transformer inputs are saved.
10. Raw transformer outputs are saved.
11. HCP-MMP1 outputs are saved.
12. 15-cluster outputs work when requested.
13. 17-cluster A-Q outputs work when requested.
14. EP / VP / CS / BR outputs are saved.
15. Conversion and Brand Recall analysis files are saved.
16. LLM explanation is generated when enabled.
17. full_result_bundle.zip is created.
18. training_ready_bundle.zip is created.
19. manifest.json is complete.
20. Artifacts are uploaded to object storage.
21. Frontend shows progress.
22. Frontend shows result summary.
23. Frontend provides download links.
24. GPU worker Docker image runs on Vast.ai.
25. Frontend deploys on Vercel.
```
