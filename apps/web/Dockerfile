# =========================================================================
# NEXT.JS FRONTEND DOCKERFILE
# =========================================================================
FROM node:20-alpine AS base

# Install PNPM and build essentials
RUN npm install -g pnpm

WORKDIR /workspace

# Copy Monorepo workspace configurations
COPY package.json pnpm-workspace.yaml ./

# Copy local monorepo packages (Prisma DB client, contracts, config)
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

# Install all dependencies (caching layer)
RUN pnpm install --frozen-lockfile

# Copy the rest of the source directories
COPY packages/db/ ./packages/db/
COPY packages/config/ ./packages/config/
COPY packages/contracts/ ./packages/contracts/
COPY packages/ui/ ./packages/ui/
COPY apps/web/ ./apps/web/

# Generate the Prisma database client
RUN pnpm --filter @sakhaa-forge/db generate

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# Production Runner stage
FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /workspace

# Copy build artifacts and dependencies from base stage
COPY --from=base /workspace /workspace

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start the Next.js server
CMD ["pnpm", "--filter", "web", "start"]
