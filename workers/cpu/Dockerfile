FROM node:24-slim AS base

# Install system dependencies (ffmpeg, ffprobe, openssl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@11.7.0

WORKDIR /app

# Copy root workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./

# Copy required package manifests and code
COPY packages/db ./packages/db
COPY packages/contracts ./packages/contracts
COPY packages/engines ./packages/engines
COPY workers/cpu ./workers/cpu

# Install workspace dependencies
RUN pnpm install

# Build dependencies and signal-cpu-worker
RUN pnpm --filter @sakhaa-forge/db generate
RUN pnpm --filter @sakhaa-forge/contracts build
RUN pnpm --filter @sakhaa-signal/engines build
RUN pnpm --filter signal-cpu-worker build

ENV NODE_ENV=production
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe

CMD ["pnpm", "--filter", "signal-cpu-worker", "start"]
