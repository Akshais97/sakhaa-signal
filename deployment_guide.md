# TribeV2 Ad Scorer App — Standalone Deployment Guide (Windows)

This document provides a comprehensive, step-by-step guide to installing, configuring, and deploying the **TribeV2 Ad Scorer** application on a new Windows machine. It covers both the standard local development runtime and the fully dockerized production orchestration.

---

## 1. System Requirements & Prerequisites

To ensure the application compiles and runs without issues, verify that the host machine satisfies the following conditions.

### Hardware Prerequisites
* **CPU:** Intel Core i7 / AMD Ryzen 7 (64-bit) or higher.
* **RAM:** 16 GB minimum (32 GB recommended to support local model execution and Docker containers).
* **GPU (Crucial for GPU Worker):** NVIDIA CUDA-compatible GPU (e.g., RTX 3060/4060 or higher) with a minimum of 8 GB VRAM.

### Software Installation Checklist
Follow these installation links exactly to match the current runtime environment:

1. **Node.js (v24.15.0):**
   * Download and install the LTS version of Node.js (v24.15.0 or stable v24.x) from the [official Node.js site](https://nodejs.org/).
   * Verify using: `node -v`
2. **Git:**
   * Install [Git for Windows](https://git-scm.com/) to manage package dependencies and workspaces.
3. **PNPM (v11.x):**
   * This project uses pnpm workspaces. Install PNPM globally:
     ```powershell
     npm install -g pnpm
     ```
   * Verify using: `pnpm -v` (Should print `11.x.x` or similar).
4. **Docker Desktop & WSL2:**
   * Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
   * During installation, ensure the **WSL2 backend** option is checked.
5. **NVIDIA Driver & CUDA Toolkit (GPU Only):**
   * Install the latest game-ready or studio NVIDIA drivers.
   * Install the [CUDA Toolkit 12.x](https://developer.nvidia.com/cuda-toolkit).
6. **NVIDIA Container Toolkit (Docker GPU Passthrough):**
   * Necessary to allow dockerized containers running in WSL2 to communicate with physical NVIDIA GPU cores.
   * Enable the integration inside Docker Desktop (Settings -> WSL 2 Integration -> Select your distro).

---

## 2. Environment Configuration

The application requires specific environment variables to connect the Next.js frontend with the DB and Vast.ai GPU worker.

### Step 2.1: Duplicate Env Templates
Duplicate the `.env.example` file in both the **root** folder and `/apps/web` folder, renaming it to `.env`:
```powershell
copy .env.example .env
copy apps/web/.env.example apps/web/.env
```

### Step 2.2: Set Environment Variables
Open the `.env` file at the project root and fill in the required keys:

```ini
# --- Database Connections ---
DATABASE_URL="postgresql://v0_migration:local_only@localhost:5432/v0?schema=public"

# --- Studio Services Configuration ---
PORT=3000
GPU_WORKER_URL="http://localhost:8080" # Points to locally running worker (or Vast.ai IP)
GPU_WORKER_TOKEN="your-secure-internal-auth-token-123"

# --- Local Storage Simulator Keys ---
STORAGE_LOCAL_ROOT="./.local/storage/v0-local-artifacts"
```

---

## 3. Database & Services Bootstrapping

Before executing the web server, you must run PostgreSQL/Redis and execute the database migrations.

### Step 3.1: Start Postgres & Redis Services
Launch the background dependencies via docker-compose:
```powershell
docker compose -f infra/docker/docker-compose.local.yml up -d
```
*Verify they are running by checking `docker ps` for ports `5432` (Postgres) and `6379` (Redis).*

### Step 3.2: Initialize Local S3 Storage Simulator
Run the project script to configure the storage directories inside `.local/`:
```powershell
pnpm services:up
```

### Step 3.3: Run Database Migrations
Create and execute the database tables using Prisma CLI:
```powershell
# Generate Prisma Client Types
pnpm db:generate

# Execute Migration Scripts
pnpm db:migrate:dev
```

---

## 4. Running the App in Development Mode

You can run the web client and python worker locally in development mode:

### Step 4.1: Start the Web Client
Start the Next.js frontend:
```powershell
pnpm dev:web
```
*The app will be accessible at: [http://localhost:3000](http://localhost:3000)*

### Step 4.2: Start the GPU Worker (Python Dev)
If running the python worker locally without Docker:
1. Initialize the Python virtual environment:
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r apps/gpu-worker/requirements.txt
   ```
2. Launch the FastAPI worker:
   ```powershell
   pnpm dev:gpu
   ```
   *The worker will listen on: [http://localhost:8080](http://localhost:8080)*

---

## 5. Running the App in Production Mode (Docker Containerized)

To build the entire stack into standalone Docker containers (Next.js + FastAPI + Postgres + Redis):

### Step 5.1: Build Docker Images
Build the production images from the root directory:
```powershell
# Build Frontend
docker build -t akshais97/video-to-marketing-frontend:latest -f apps/web/Dockerfile .

# Build GPU Worker
docker build -t akshais97/video-to-marketing-outcome:latest -f apps/gpu-worker/Dockerfile .
```

### Step 5.2: Orchestrate Stack
To boot both components together with GPU capabilities enabled:
```powershell
docker compose up -d
```

---

## 6. Windows Troubleshooting & Common Pitfalls

If you encounter errors during setup, consult the following steps:

* **Error: "Failed to connect to postgresql"**
  * Solution: Check if another application (like a local PostgreSQL service) is already using port `5432`. Stop it or change the port mapping in `infra/docker/docker-compose.local.yml` and updates the `.env` database URL connection string.
* **Error: "Execution Policy Restriction"**
  * When running `.venv\Scripts\Activate.ps1`, PowerShell might block script execution. Run the following command first:
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
    ```
* **Error: "Prisma generated client not found"**
  * Solution: Make sure to run `pnpm db:generate` inside the root workspace directory before starting the dev server or builds.
