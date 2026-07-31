# High Priority Bug Report: `POST /api/analysis/jobs` 500 Internal Server Error (`stageOrder` Schema Desynchronization)

**Document Identifier**: `agent_gemini_bug_report_analysis_job_creation_500_20260731_153819`  
**Date/Time**: `2026-07-31T15:38:19+05:30`  
**Severity**: `HIGH (CRITICAL PATH BLOCKER)`  
**Affected Subsystems**: `apps/web` (`/api/analysis/jobs`), `packages/db` (`@sakhaa-forge/db`), Next.js Dev Server Runtime Memory Cache  

---

## 1. Problem Description & Error Traceback

When attempting to upload a creative asset and submit a job via `SignalJobWizard.tsx`, the client encounters a `500 Internal Server Error` on `POST http://localhost:3000/api/analysis/jobs`.

### Client Stack Trace
```text
POST http://localhost:3000/api/analysis/jobs 500 (Internal Server Error)
(anonymous) @ SignalJobWizard.tsx:93
await in (anonymous)
executeDispatch @ react-dom-client.development.js:20610
runWithFiberInDEV @ react-dom-client.development.js:986
processDispatchQueue @ react-dom-client.development.js:20660
[JOB_WIZARD_ERROR] Error: Failed to create analysis job
    at handleSubmit (SignalJobWizard.tsx:111:15)
```

### Server Error Payload
```json
{
  "error": "Failed to create analysis job",
  "details": "Invalid `prisma.analysisJob.create()` invocation:\n{\n  data: {\n    id: \"5bcc0461-2481-4dee-a832-4c69dc3b591f\",\n    workspaceId: \"c8b6bbc4-2f5e-49bf-8e55-a13e90744eec\",\n    mode: \"STATIC_STANDARD\",\n    status: \"QUEUED\",\n    currentStage: \"QUEUED\",\n    progressPercent: 0,\n    inputArtifactId: \"319c49cc-7764-48ba-8898-b95861c46198\",\n    inputObjectKey: \"workspaces/c8b6bbc4-2f5e-49bf-8e55-a13e90744eec/analyses/319c49cc-7764-48ba-8898-b95861c46198/Social_Media_creative_sample.png\",\n    mediaType: \"image\",\n    title: \"Crash Club Static Analysis\",\n    brandName: \"Crash Club\",\n    targetPlatform: \"INSTAGRAM_REELS\",\n    placement: \"REEL\",\n    creativeGoal: \"\",\n    stages: {\n      create: [\n        {\n          stageName: \"DOWNLOAD_AND_VALIDATE\",\n          stageOrder: 1,\n          status: \"QUEUED\"\n        },\n        ...\n      ]\n    }\n  },\n  include: {\n    stages: true\n  }\n}\n\nUnknown argument `stageOrder`. Available options are marked with ?."
}
```

---

## 2. In-Depth First-Principles Root Cause Analysis (RCA)

### Fundamental Axiom: The Contract Invariant
In a statically typed ORM system (Prisma), query validation occurs at two distinct layers:
1. **Compile-time / Transpilation Layer**: TypeScript checks the static type definitions in `@sakhaa-forge/db` (`packages/db/generated/client/index.d.ts`).
2. **Runtime Memory Engine Layer**: The active Prisma Client instance in memory (`globalThis.prisma`) validates incoming GraphQL-style AST queries against the compiled DMMF (Data Model Meta Format) loaded into heap memory when `new PrismaClient()` was invoked.

### The Mechanism of Persistence

#### Layer 1: Schema Evolution
In `packages/db/prisma/schema.prisma`, `AnalysisStage` model is defined as:
```prisma
model AnalysisStage {
  id            String      @id @default(uuid()) @db.Uuid
  analysisJobId String      @map("analysis_job_id") @db.Uuid
  stageName     String      @map("stage_name") @db.VarChar(120)
  stageOrder    Int         @default(1) @map("stage_order")
  status        JobStatus   @default(QUEUED)
  ...
}
```

#### Layer 2: Next.js Development Singleton Pattern
In `apps/web/src/lib/db.ts`, Prisma Client is instantiated using the standard Next.js global singleton pattern to prevent database connection exhaustion during Hot Module Replacement (HMR):

```typescript
// apps/web/src/lib/db.ts
import { PrismaClient } from "@sakhaa-forge/db";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
```

#### Layer 3: The Process Isolation & Heap Memory Cache Gap
1. When `next dev` (Next.js development server) boots, Node.js evaluates `apps/web/src/lib/db.ts`.
2. `new PrismaClient()` constructs a query engine instance in heap memory and assigns it to `globalThis.prisma`.
3. When `prisma generate` is executed on disk (updating `packages/db/generated/client`), files on disk change.
4. **HOWEVER**, because Node.js does not reload module instances assigned to `globalThis`, `globalThis.prisma` remains pointing to the **OLD in-memory DMMF AST** loaded at initial boot time.
5. When `POST /api/analysis/jobs` is invoked, `import prisma from "@/lib/db"` evaluates `globalThis.prisma`.
6. The stale in-memory DMMF engine inspects `{ stageOrder: 1 }`, compares it against its cached pre-generation DMMF, fails to find `stageOrder`, and throws:
   `Unknown argument stageOrder. Available options are marked with ?.`

---

## 3. Why the Issue Persists

The issue persists because:
- **Process Memory Lock**: Running process PID 20992 (`next dev`) holds the stale `globalThis.prisma` instance in Node.js V8 heap memory.
- **TypeScript vs. Runtime Mismatch**: Rebuilding TypeScript files on disk (`pnpm build`) updates files on disk, but does NOT invalidate the live Node.js process memory of a running background `next dev` server.

---

## 4. Viable Solution Blueprint

To resolve this issue cleanly and permanently across all environments:

### Step 1: Kill Stale Next.js Dev Server Process
Terminate the running Next.js process holding stale `globalThis.prisma` in memory:
```powershell
taskkill /PID 20992 /F
# Or kill all node dev processes:
taskkill /IM node.exe /F
```

### Step 2: Regenerate Prisma Client & Push Schema
Re-run Prisma client generation and schema push to guarantee disk artifacts are aligned with Supabase PostgreSQL:
```bash
node packages/db/scripts/db-generate.mjs
node packages/db/scripts/db-push.mjs
```

### Step 3: Hard-Refresh In-Memory Singleton in `apps/web/src/lib/db.ts` (Architectural Prevention)
To prevent stale in-memory client persistence during development schema changes, update `apps/web/src/lib/db.ts` to invalidate `globalThis.prisma` when `SCHEMA_VERSION` or dev hot-reload occurs:

```typescript
import { PrismaClient } from "@sakhaa-forge/db";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  process.env.NODE_ENV === "development"
    ? new PrismaClient()
    : globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### Step 4: Restart Server & Verify
Start clean development server instance:
```bash
pnpm --filter web dev
```
Submitting a job via `SignalJobWizard.tsx` will now execute `prisma.analysisJob.create()` against the fresh DMMF engine with `stageOrder` recognized.
