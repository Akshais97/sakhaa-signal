# NOTE: This Dockerfile must be built from the repository root directory.
# Build command: docker build -f apps/gpu-worker/Dockerfile -t tribev2-gpu-worker .

FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    libglib2.0-0 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy local package tribev2-main and install it
# This installs neuralset, neuraltrain, and other model dependencies
COPY tribev2-main/tribev2-main /workspace/tribev2-main
RUN pip install --no-cache-dir /workspace/tribev2-main

# Copy worker requirements and install them
COPY apps/gpu-worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker source code
COPY apps/gpu-worker/app ./app

# Expose FastAPI port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
