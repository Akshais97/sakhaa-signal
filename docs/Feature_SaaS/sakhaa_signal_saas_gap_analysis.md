# Sakhaa Signal — Full-Fledged SaaS Gap Analysis

**Repository:** `Akshais97/sakhaa-signal`  
**Date:** 2026-08-03  
**Scope:** Missing product, engineering, security, operations, billing, admin, and launch-readiness layers required to convert the current creative-analysis application into a full-fledged SaaS application.

---

## 1. Executive Summary

Sakhaa Signal already has the core creative-analysis product direction in place: users can upload media, create analysis jobs, process static/video creatives, generate scores, store evidence, and view reports. The application is moving from a feature-ready creative intelligence tool toward a commercial SaaS.

However, the current codebase is not yet a complete SaaS product. The missing pieces are mostly not the creative-analysis engines themselves. The missing pieces are the SaaS operating layer around the product:

- Public website and conversion funnel
- User profile and account management
- Workspace settings
- Team management and invites
- Admin dashboard
- Billing, subscriptions, credits, and usage metering
- Proper role-based access control enforcement
- Production-grade authentication guards
- Upload hardening
- Rate limiting and abuse prevention
- Customer support, audit logs, observability, and legal pages
- Deployment, monitoring, and recovery workflows

The application should now be treated as having two layers:

```text
Layer 1 — Product Engine
Upload creative → analyze static/video → generate evidence → score → report

Layer 2 — SaaS Shell
Website → signup → onboarding → workspace → billing → teams → usage limits → admin → support → operations
```

The product engine is mostly underway. The SaaS shell is the main missing area.

---

## 2. Current Application State

### 2.1 What Exists

The current repository appears to include:

- Next.js web application
- Supabase-based Google OAuth login
- Auth callback route
- Middleware using Supabase session handling
- Prisma database layer
- User, workspace, membership, and role schema
- Analysis job schema
- Static and video analysis job creation
- Upload/presign/direct-upload routes
- B2/S3-compatible storage support with local fallback
- CPU worker that polls, leases, processes, and completes analysis jobs
- Static creative analysis
- Video standard analysis
- Report artifact generation
- Job stages, scores, findings, evidence, and reports
- Basic dashboard-style authenticated product interface

### 2.2 What This Means

The application is not just a mock UI. It has real backend structure. But it is still closer to a working internal product/application than a sellable SaaS.

The difference is important:

| Area | Internal App | Full SaaS |
|---|---|---|
| Auth | Login works | Login, logout, sessions, secure guards, recovery, account lifecycle |
| Users | User table exists | Profile, preferences, account settings, deletion/export |
| Workspaces | Workspace schema exists | Workspace settings, members, roles, invitations, billing owner |
| Jobs | Jobs run | Jobs run with quotas, retries, failure recovery, user notifications |
| Uploads | Upload route exists | Validated, scanned, metered, size-limited, abuse-protected uploads |
| Admin | Usually absent | Required for customers, jobs, failures, usage, billing, support |
| Billing | Optional for internal app | Mandatory for SaaS |
| Support | Manual | In-product support, issue reporting, admin tools |
| Monitoring | Logs only | Metrics, errors, alerts, runbooks |
| Legal | Not required | Terms, privacy, refund, AI disclaimers, retention policy |

---

## 3. High-Level SaaS Gap Verdict

| Category | Current Status | SaaS Readiness |
|---|---:|---:|
| Core creative analysis | Mostly present | Medium to High |
| Auth/login | Partial | Medium |
| JWT/API auth hardening | Partial | Low to Medium |
| Landing page | Missing | Low |
| User profile | Missing | Low |
| Workspace settings | Missing | Low |
| Team management | Missing | Low |
| RBAC enforcement | Partial | Low |
| Admin dashboard | Missing | Low |
| Billing/subscriptions | Missing | Critical gap |
| Usage credits/metering | Missing | Critical gap |
| Upload security | Partial | Low |
| Rate limiting | Missing | Critical gap |
| Observability | Missing/unclear | Low |
| Customer support tooling | Missing | Low |
| Legal/compliance pages | Missing | Low |
| Production deployment readiness | Partial | Medium |
| SaaS launch readiness | Not ready | Low |

---

## 4. Missing SaaS Modules

---

# PART A — PUBLIC SAAS EXPERIENCE

## 5. Landing Page / Marketing Website

### Status

Missing.

The application currently uses the main surface as the logged-in product/dashboard experience. For a SaaS, `/` should not immediately behave like an internal tool. It should act as a public acquisition page unless the user is already logged in and intentionally enters the app.

### Required Pages

| Page | Purpose |
|---|---|
| `/` | Main landing page |
| `/pricing` | Plans, credits, usage, and billing explanation |
| `/features` | Explain static analysis, video analysis, reports, and recommendations |
| `/use-cases` | PPC ads, social creatives, reels, performance marketing audits |
| `/security` | Explain upload privacy, storage, retention, and access controls |
| `/docs` or `/help` | Basic help center and product guide |
| `/contact` | Sales/support contact |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/refund-policy` | Refund and cancellation policy |

### Landing Page Sections

The landing page should include:

1. Hero section
2. Product explanation
3. Upload → analyze → improve flow
4. Static creative analysis section
5. Video creative analysis section
6. Evidence-backed scoring section
7. Sample report preview
8. Pricing teaser
9. Security/privacy section
10. FAQ
11. CTA to sign in/sign up

### Recommended Route Structure

```text
apps/web/src/app/
  (marketing)/
    page.tsx
    pricing/page.tsx
    features/page.tsx
    use-cases/page.tsx
    security/page.tsx
    contact/page.tsx
  (auth)/
    login/page.tsx
    auth/callback/route.ts
  (app)/
    dashboard/page.tsx
    analysis/[jobId]/page.tsx
    settings/page.tsx
    profile/page.tsx
  (admin)/
    admin/page.tsx
```

### Acceptance Criteria

- Public visitors can understand the product without logging in.
- CTA leads to login/signup.
- Logged-in users can go to dashboard.
- SEO metadata exists.
- Pricing and legal pages exist before paid launch.
- Landing page does not make unsupported predictive or medical/scientific claims.

---

## 6. Signup, Login, Logout, and Auth UX

### Status

Partially implemented.

Google OAuth exists. Auth callback exists. Supabase session handling exists. But SaaS-grade auth UX is incomplete.

### Missing

- Logout button
- Signup-specific onboarding flow
- Auth error page
- Session expired handling
- Account switch handling
- Magic link or email/password fallback, if desired
- Redirect safety validation
- Auth loading states
- Account deletion request
- Re-auth before sensitive changes
- Clear production behavior when unauthenticated

### Critical Issue

Development fallback behavior must be strictly disabled in production. A production route must never silently create or use a local demo user/workspace when no valid authenticated user exists.

### Required Auth Helper Behavior

```text
If production and no valid user:
  return 401 / redirect to login

If development and dev bypass is enabled:
  allow local dev workspace

If development and dev bypass is disabled:
  behave like production
```

### Acceptance Criteria

- Every protected API route fails closed.
- No unauthenticated user can create jobs.
- No unauthenticated user can upload files.
- No unauthenticated user can view reports.
- Logout works.
- Session expiry gracefully returns user to login.

---

# PART B — USER, WORKSPACE, AND TEAM SAAS LAYER

## 7. User Profile Page

### Status

Missing.

The schema has a `User` model, but the application needs a proper profile/account page.

### Required Profile Features

| Feature | Description |
|---|---|
| Display name | User can edit their name |
| Email display | Show account email from Supabase |
| Avatar | Pull from Google profile or upload custom avatar |
| Timezone | Important for notifications and usage reports |
| Notification preferences | Email me on job completion/failure/quota |
| Connected login provider | Google account info |
| Account security | Active sessions, logout all devices if supported |
| Account deletion | Request/delete account flow |
| Data export | Export user/account data if needed |

### Suggested Route

```text
/app/profile
```

### Suggested Data Additions

Current `User` is minimal. Add:

```prisma
model UserProfile {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @unique @map("user_id") @db.Uuid
  avatarUrl         String?  @map("avatar_url")
  timezone          String?  @db.VarChar(80)
  locale            String?  @db.VarChar(20)
  notificationPrefs Json?    @map("notification_prefs")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
}
```

### Acceptance Criteria

- User can view and edit profile.
- User can change notification preferences.
- Profile page is accessible from app header.
- User cannot edit another user’s profile.
- Changes are audited for sensitive fields.

---

## 8. Workspace Settings

### Status

Partially modeled, UI missing.

The schema has `Workspace`, `Membership`, `WorkspaceCapability`, and `ServiceCredential`. But the SaaS needs workspace-level settings screens.

### Required Workspace Settings

| Section | Required Features |
|---|---|
| General | Workspace name, slug, logo |
| Members | List members, roles, invite, remove |
| Roles | Manage user permissions |
| Billing | Plan, invoices, payment method, credits |
| Usage | Number of analyses, storage, video minutes, credits |
| Security | Allowed domains, API keys later, audit logs |
| Retention | Raw media retention, report retention |
| Danger zone | Delete workspace, transfer ownership |

### Suggested Routes

```text
/app/settings
/app/settings/workspace
/app/settings/members
/app/settings/billing
/app/settings/usage
/app/settings/security
/app/settings/audit-log
```

### Acceptance Criteria

- Workspace owners can update workspace settings.
- Admins can manage users, depending on permission model.
- Reviewers cannot manage billing or members.
- Workspace delete requires confirmation and ownership.
- Workspace switching works if user belongs to multiple workspaces.

---

## 9. Team Invites

### Status

Missing.

Membership exists, but invitation lifecycle is missing.

### Why This Matters

A SaaS product needs to let agencies, marketing teams, and clients invite other users. Directly creating memberships is not enough.

### Required Invite Flow

```text
Owner/Admin enters email
  ↓
Chooses role
  ↓
Invite record created
  ↓
Email sent with secure token
  ↓
Recipient logs in/signs up
  ↓
Invite accepted
  ↓
Membership created
```

### Required Invite States

- Pending
- Accepted
- Expired
- Revoked

### Suggested Prisma Model

```prisma
model WorkspaceInvite {
  id             String   @id @default(uuid()) @db.Uuid
  workspaceId    String   @map("workspace_id") @db.Uuid
  email          String   @db.VarChar(320)
  role           MembershipRole
  tokenHash      String   @map("token_hash") @db.Char(64)
  invitedById    String   @map("invited_by_id") @db.Uuid
  status         String   @default("PENDING") @db.VarChar(40)
  expiresAt      DateTime @map("expires_at") @db.Timestamptz(6)
  acceptedAt     DateTime? @map("accepted_at") @db.Timestamptz(6)
  revokedAt      DateTime? @map("revoked_at") @db.Timestamptz(6)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([workspaceId, status])
  @@unique([workspaceId, email, status])
  @@map("workspace_invites")
}
```

### Required API Routes

```text
POST /api/workspace/invites
GET  /api/workspace/invites
POST /api/workspace/invites/[inviteId]/revoke
POST /api/workspace/invites/accept
```

### Acceptance Criteria

- Owner/Admin can invite users.
- Invite email is sent.
- Expired invites cannot be used.
- Revoked invites cannot be used.
- Invite token is stored hashed, not raw.
- Accepted invite creates membership once only.

---

# PART C — AUTHORIZATION AND RBAC

## 10. RBAC Enforcement

### Status

Partial.

The schema has membership roles:

```text
OWNER
ADMIN
CLIENT_MANAGER
REVIEWER
```

But route-level permission enforcement is not yet complete enough for SaaS.

### Problem

A schema-level role is not the same as RBAC. Real RBAC needs:

- Central permission definition
- Central guard/helper
- Route-level enforcement
- UI-level permission hiding
- Tests for every permission-sensitive route

### Required Permission Matrix

| Action | Owner | Admin | Client Manager | Reviewer |
|---|---:|---:|---:|---:|
| View dashboard | Yes | Yes | Yes | Yes |
| Create analysis job | Yes | Yes | Yes | No or limited |
| View report | Yes | Yes | Yes | Yes |
| Delete job/report | Yes | Yes | Maybe | No |
| Invite members | Yes | Yes | No | No |
| Change roles | Yes | Maybe | No | No |
| Remove members | Yes | Yes | No | No |
| Manage billing | Yes | No/Optional | No | No |
| Manage workspace settings | Yes | Yes | No | No |
| View usage | Yes | Yes | Yes | No/Read-only |
| View audit logs | Yes | Yes | No | No |
| Access admin dashboard | Platform admin only | No | No | No |

### Recommended Helper

```ts
export type Permission =
  | "job:create"
  | "job:read"
  | "job:delete"
  | "report:read"
  | "member:invite"
  | "member:update_role"
  | "member:remove"
  | "billing:manage"
  | "workspace:update"
  | "workspace:delete"
  | "audit:read";

export function roleCan(role: MembershipRole, permission: Permission): boolean {
  // central matrix
}
```

### Required Route Guard Pattern

```ts
const session = await requireWorkspaceSession();

await requirePermission(session, "job:create");

return createJob();
```

### API Routes That Need RBAC

- Job creation
- Job cancellation
- Upload presign
- Direct upload
- Report view
- Report export
- Workspace update
- Member invite
- Member remove
- Role update
- Billing update
- Admin endpoints

### Acceptance Criteria

- Every sensitive route uses one shared guard.
- Permission tests exist.
- UI hides actions the user cannot perform.
- Backend remains the source of truth.
- A Reviewer cannot bypass UI and call APIs directly.

---

## 11. Platform Admin vs Workspace Admin

### Status

Missing.

The current role model covers workspace roles, but SaaS also needs platform-level admins.

### Why Separate Platform Admin?

Workspace admins manage their own workspace. Platform admins manage the SaaS business.

Platform admins need to inspect:

- All workspaces
- All users
- All jobs
- Failed jobs
- Storage usage
- Abuse/flagged uploads
- Billing status
- Worker health
- Support issues

Workspace admins must not have global visibility.

### Suggested Model

```prisma
enum PlatformRole {
  SUPER_ADMIN
  SUPPORT
  OPERATIONS
  FINANCE
}

model PlatformAdmin {
  id        String       @id @default(uuid()) @db.Uuid
  userId    String       @unique @map("user_id") @db.Uuid
  role      PlatformRole
  status    RecordStatus @default(ACTIVE)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")

  @@map("platform_admins")
}
```

### Acceptance Criteria

- Platform admin is separate from workspace membership.
- No workspace user can access `/admin`.
- Admin actions are audited.
- Support/admin impersonation, if added, is heavily audited.

---

# PART D — BILLING, SUBSCRIPTIONS, AND USAGE

## 12. Billing and Subscription System

### Status

Missing.

This is one of the biggest SaaS blockers.

Creative analysis has real compute/API/storage costs. Users should not be able to run unlimited jobs without a plan, credits, trial, or internal allowlist.

### Required Billing Provider Decision

Choose one:

| Provider | Best For |
|---|---|
| Stripe | Global SaaS, cards, subscriptions, invoices |
| Razorpay | India-first payments, UPI/cards/netbanking |
| Hybrid | Razorpay for India + Stripe for international |

For a first SaaS version, choose one provider and ship. Avoid implementing both immediately unless required.

### Required Billing Concepts

- Customer
- Subscription
- Plan
- Price
- Credits
- Usage
- Invoice
- Payment method
- Payment status
- Trial
- Failed payment
- Cancellation
- Refund

### Suggested Plans

| Plan | Use Case |
|---|---|
| Free Trial | Limited credits for testing |
| Starter | Small businesses, static analysis focus |
| Growth | Agencies and paid media teams |
| Pro | Higher video limits and team seats |
| Enterprise | Custom pricing, higher limits, dedicated support |

### Suggested Prisma Models

```prisma
model BillingCustomer {
  id                 String   @id @default(uuid()) @db.Uuid
  workspaceId        String   @unique @map("workspace_id") @db.Uuid
  provider           String   @db.VarChar(40)
  providerCustomerId String   @map("provider_customer_id") @db.VarChar(200)
  billingEmail       String?  @map("billing_email") @db.VarChar(320)
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  @@map("billing_customers")
}

model Subscription {
  id                     String   @id @default(uuid()) @db.Uuid
  workspaceId            String   @map("workspace_id") @db.Uuid
  provider               String   @db.VarChar(40)
  providerSubscriptionId String   @map("provider_subscription_id") @db.VarChar(200)
  planCode               String   @map("plan_code") @db.VarChar(80)
  status                 String   @db.VarChar(40)
  currentPeriodStart     DateTime @map("current_period_start")
  currentPeriodEnd       DateTime @map("current_period_end")
  cancelAtPeriodEnd      Boolean  @default(false) @map("cancel_at_period_end")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  @@index([workspaceId, status])
  @@map("subscriptions")
}
```

### Required Billing Routes

```text
GET  /api/billing/status
POST /api/billing/checkout
POST /api/billing/portal
POST /api/webhooks/billing
GET  /api/billing/invoices
```

### Acceptance Criteria

- User cannot run paid analysis without credits/active plan.
- Billing webhooks are idempotent.
- Workspace billing status is cached.
- Failed payments block or degrade paid usage.
- Billing actions are restricted to owner/billing role.
- Webhook signatures are verified.

---

## 13. Usage Metering and Credits

### Status

Missing.

Usage metering is mandatory because every analysis can cost money.

### What To Meter

| Usage Type | Example |
|---|---|
| Static analysis count | 1 image analysis |
| Video analysis count | 1 video analysis |
| Video duration | seconds/minutes analyzed |
| TribeV2 GPU usage | GPU minutes |
| Storage usage | raw media + reports |
| API model cost | GPT/Groq/Vision calls |
| Report exports | PDF/ZIP exports |
| Seats | workspace members |

### Required Flow

```text
User creates job
  ↓
System estimates required credits
  ↓
Check workspace has enough credits
  ↓
Reserve credits
  ↓
Run job
  ↓
Finalize actual usage
  ↓
Refund unused reserved credits or charge overage
```

### Suggested Models

```prisma
model UsageLedger {
  id              String   @id @default(uuid()) @db.Uuid
  workspaceId     String   @map("workspace_id") @db.Uuid
  analysisJobId   String?  @map("analysis_job_id") @db.Uuid
  usageType       String   @map("usage_type") @db.VarChar(80)
  quantity        Decimal  @db.Decimal(12, 4)
  unit            String   @db.VarChar(40)
  creditsDelta    Decimal  @map("credits_delta") @db.Decimal(12, 4)
  reason          String   @db.VarChar(200)
  metadata        Json?
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([workspaceId, createdAt])
  @@map("usage_ledger")
}

model CreditBalance {
  id          String   @id @default(uuid()) @db.Uuid
  workspaceId String   @unique @map("workspace_id") @db.Uuid
  balance     Decimal  @db.Decimal(12, 4)
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("credit_balances")
}
```

### Required Enforcement Points

- Before upload
- Before job creation
- Before worker claims job
- Before expensive provider calls
- Before report export
- Before retry

### Acceptance Criteria

- Every job has estimated and actual cost.
- Failed jobs are charged/refunded according to policy.
- Usage is visible in billing/usage page.
- Admin can inspect usage by workspace.
- Credits cannot go negative unless overage is explicitly enabled.

---

# PART E — ADMIN DASHBOARD

## 14. Platform Admin Dashboard

### Status

Missing.

A full SaaS needs an internal operations panel.

### Required Admin Sections

| Section | Purpose |
|---|---|
| Overview | Total users, workspaces, jobs, revenue, failures |
| Users | Search users, view account, status, workspaces |
| Workspaces | Workspace status, plan, usage, members |
| Jobs | All analysis jobs, status, duration, failures |
| Failed Jobs | Triage failed jobs and retry/refund |
| Workers | CPU/GPU worker health, queue lag, lease status |
| Storage | Object counts, sizes, quarantine, failed uploads |
| Billing | Subscriptions, invoices, failed payments |
| Usage | Credits consumed, API/GPU costs |
| Support | User issues, report complaints |
| Audit Logs | Security-sensitive events |
| Feature Flags | Enable/disable capabilities by workspace |
| Abuse Review | Suspicious uploads, repeated failures, high usage |

### Suggested Routes

```text
/admin
/admin/users
/admin/workspaces
/admin/jobs
/admin/jobs/failed
/admin/workers
/admin/billing
/admin/usage
/admin/storage
/admin/audit
/admin/support
/admin/feature-flags
```

### Admin Dashboard MVP

First version should include:

1. Workspace list
2. User list
3. Job list
4. Failed job view
5. Worker status
6. Usage summary
7. Manual credit adjustment
8. Feature capability toggle
9. Audit log

### Acceptance Criteria

- Only platform admins can access `/admin`.
- Every admin action creates an audit event.
- Failed jobs can be inspected.
- Workspace usage can be viewed.
- Admin can disable a workspace.
- Admin can grant internal credits.
- Admin can see worker health.

---

# PART F — UPLOAD, STORAGE, AND MEDIA SECURITY

## 15. Upload Hardening

### Status

Partial.

Upload routes exist, but production-grade SaaS upload handling needs stronger validation and abuse prevention.

### Current Concern

The direct upload proxy accepts a request payload and writes it to object storage/local fallback. The artifact can be marked `CLEAN` after upload. For production, uploaded files should not be trusted immediately.

### Required Upload Stages

```text
QUARANTINED
  ↓
VALIDATING
  ↓
CLEAN / REJECTED
  ↓
ANALYSIS_READY
  ↓
DELETED / EXPIRED
```

### Required Checks

| Check | Required |
|---|---:|
| File size limit | Yes |
| MIME type validation | Yes |
| Extension validation | Yes |
| Magic-byte sniffing | Yes |
| Empty file rejection | Yes |
| Max video duration | Yes |
| Max resolution | Yes |
| Frame-rate sanity | Yes |
| Audio codec sanity | Yes |
| Malware scan | Strongly recommended |
| Workspace storage quota | Yes |
| User permission check | Yes |
| Rate limit | Yes |
| Duplicate checksum detection | Recommended |
| Content moderation/abuse scan | Recommended |

### Recommended Upload Limits for MVP

| Media Type | Limit |
|---|---|
| Static image | 10 MB |
| Standard video | 250 MB |
| Video duration | 60 seconds initially |
| Resolution | Up to 1080x1920 initially |
| Formats | JPG, PNG, WebP, MP4, MOV, WebM |

### Acceptance Criteria

- Upload route requires auth.
- Upload route checks workspace permission.
- Upload route validates size and type before accepting.
- Artifact is not marked `CLEAN` until validation passes.
- Worker refuses to process non-clean artifacts.
- Failed validation gives user-friendly error.

---

## 16. Storage Lifecycle and Retention

### Status

Partial.

Object storage is present, but SaaS retention policies are missing.

### Required Storage Policies

| Object Type | Suggested Retention |
|---|---|
| Raw uploaded media | 7–30 days by plan |
| Extracted frames | 7–30 days |
| Audio/transcripts | 30–90 days |
| JSON reports | 90 days or plan-based |
| PDF/ZIP exports | 30–90 days |
| Failed temporary files | 24–72 hours |
| Audit logs | 1–7 years depending on policy |

### Required Features

- Delete raw media after retention window
- Delete workspace data after account deletion
- User-controlled delete report/media
- Admin retention override
- Storage cleanup cron
- Orphan object cleanup
- Object-key access authorization
- Signed URLs with expiry

### Acceptance Criteria

- No private object is publicly accessible.
- Reports/media require workspace authorization.
- Expired signed URLs stop working.
- Deleting a job deletes or schedules deletion of related media.
- Retention policy is visible to user.

---

# PART G — JOB SYSTEM, QUEUES, AND WORKERS

## 17. Job Reliability and Queue Management

### Status

Partially implemented.

The worker leases jobs and processes them, but SaaS-level queue reliability needs more controls.

### Required Job Features

| Feature | Required |
|---|---:|
| Retry policy | Yes |
| Max attempts | Yes |
| Dead-letter state | Yes |
| Cancel job | Yes |
| Pause/resume queue | Admin |
| Job timeout | Yes |
| Lease recovery | Yes |
| Worker heartbeat | Yes |
| Queue position | Useful |
| User notifications | Yes |
| Cost reservation | Yes |
| Idempotency | Yes |

### Required Statuses

Current statuses are good, but SaaS should also clearly distinguish:

```text
QUEUED
LEASED
RUNNING
RETRY_WAIT
SUCCEEDED
FAILED
FAILED_REFUNDED
FAILED_CHARGED
CANCEL_REQUESTED
CANCELLED
EXPIRED
DEAD_LETTER
```

### Required Worker Heartbeat Model

```prisma
model WorkerHeartbeat {
  id             String   @id @default(uuid()) @db.Uuid
  workerId       String   @map("worker_id") @db.VarChar(160)
  workerType     String   @map("worker_type") @db.VarChar(80)
  status         String   @db.VarChar(40)
  currentJobId   String?  @map("current_job_id") @db.Uuid
  lastSeenAt     DateTime @map("last_seen_at")
  metadata       Json?
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([workerId])
  @@index([workerType, status, lastSeenAt])
  @@map("worker_heartbeats")
}
```

### Acceptance Criteria

- Stuck jobs are visible.
- Failed jobs have structured reasons.
- Admin can retry eligible failures.
- User can see progress and final error.
- Expensive jobs cannot run without usage reservation.
- Worker heartbeat is visible in admin dashboard.

---

## 18. GPU Worker / TribeV2 SaaS Readiness

### Status

Architecture exists conceptually, but full SaaS operational readiness is not complete.

### Missing

- GPU worker lifecycle management
- Vast.ai/on-demand GPU orchestration
- Warm pool or manual worker mode
- Secure worker authentication
- Worker-to-backend claim protocol
- GPU cost tracking
- Long-running job timeout/retry
- Artifact upload reconciliation
- Per-job GPU logs
- Admin view of GPU queue and failures

### Recommended Worker Modes

| Mode | Description | When to Use |
|---|---|---|
| CPU Worker | Static and video standard analysis | Always-on cheap worker |
| GPU Worker Manual | One or more manually running GPU workers | MVP |
| GPU Worker Warm Pool | Keep one GPU online during business hours | Early paid beta |
| GPU Worker On-Demand | Create GPU instance per queue demand | Later |
| Hybrid | CPU always-on + GPU burst | Best long-term |

### Acceptance Criteria

- Full analysis cannot silently fail if GPU unavailable.
- User sees clear mode availability.
- Admin sees GPU worker health.
- GPU costs are attributed to workspace/job.
- Long TribeV2 jobs have retry and timeout policy.

---

# PART H — API SECURITY AND ABUSE PROTECTION

## 19. Rate Limiting

### Status

Missing.

This is critical because uploads and analysis jobs are expensive.

### Required Rate Limits

| Endpoint | Suggested Limit |
|---|---|
| Login/auth callback | Moderate |
| Upload presign | Per user/workspace |
| Direct upload | Per user/workspace/IP |
| Job creation | Per workspace/plan |
| Report fetching | Generous but limited |
| Admin actions | Low and audited |
| Webhooks | Signature-based, no generic open access |

### Options

- Upstash Redis rate limiting
- Vercel KV
- Redis/BullMQ-backed limiter
- Cloudflare/WAF in front

### Acceptance Criteria

- A user cannot spam job creation.
- A user cannot upload unlimited large files.
- Anonymous users cannot hit expensive endpoints.
- Rate limit errors are user-friendly.
- Admin can inspect suspicious usage.

---

## 20. API Key System

### Status

Missing.

Not required for MVP, but useful later.

### When To Add

Add only after dashboard SaaS is stable.

### Required Features

- API key creation
- Key hashing
- Last used timestamp
- Workspace scope
- Permission scopes
- Revocation
- Rate limits
- Webhook callback URLs

### Suggested Future Routes

```text
POST /api/v1/analysis
GET  /api/v1/analysis/[jobId]
GET  /api/v1/reports/[jobId]
POST /api/v1/webhooks/test
```

---

# PART I — OBSERVABILITY, LOGGING, AND SUPPORT

## 21. Error Tracking and Monitoring

### Status

Missing or unclear.

A SaaS must know when jobs fail, payments fail, uploads fail, workers disappear, or reports break.

### Required Stack

| Need | Suggested Tool |
|---|---|
| Frontend/backend errors | Sentry |
| Logs | Axiom, Better Stack, Datadog, Logtail |
| Uptime | Better Stack, Checkly |
| Metrics | Prometheus/Grafana or hosted equivalent |
| Traces | OpenTelemetry |
| Product analytics | PostHog |
| Queue metrics | BullMQ dashboard or custom admin |

### Required Events

- User signed in
- Workspace created
- File uploaded
- Upload failed
- Analysis job created
- Analysis job started
- Analysis job failed
- Analysis job completed
- Report viewed
- Billing checkout started
- Payment succeeded
- Payment failed
- Credits exhausted
- Admin changed workspace setting

### Acceptance Criteria

- Critical failures create alerts.
- Worker downtime creates alerts.
- Error logs include jobId/workspaceId safely.
- PII and media content are not logged.
- Admin can inspect failed jobs without reading raw private media unnecessarily.

---

## 22. Customer Support Layer

### Status

Missing.

### Required Support Features

- Help/contact page
- In-app support button
- “Report a problem with this analysis”
- Failed job support CTA
- Support ticket metadata: jobId, workspaceId, browser, timestamp
- Admin support view
- Optional chat widget

### Acceptance Criteria

- User can report issue from report page.
- Support receives job/report context.
- Admin can see issue history.
- Support actions are audited.

---

# PART J — EMAIL AND NOTIFICATIONS

## 23. Transactional Emails

### Status

Missing.

### Required Emails

| Email | Trigger |
|---|---|
| Welcome email | First signup |
| Invite email | Team invite |
| Job completed | Analysis success |
| Job failed | Analysis failure |
| Credits low | Below threshold |
| Credits exhausted | Cannot run more jobs |
| Payment succeeded | Billing event |
| Payment failed | Billing event |
| Subscription cancelled | Billing event |
| Workspace deleted | Workspace lifecycle |
| Security alert | Role change, email change, suspicious activity |

### Suggested Providers

- Resend
- Postmark
- SendGrid
- AWS SES

### Acceptance Criteria

- Transactional email provider is configured.
- Email templates are versioned.
- Emails are not sent repeatedly due to retry/webhook duplication.
- Users can configure notification preferences.

---

## 24. In-App Notifications

### Status

Missing.

### Required Notification Model

```prisma
model Notification {
  id          String   @id @default(uuid()) @db.Uuid
  workspaceId String?  @map("workspace_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  type        String   @db.VarChar(80)
  title       String   @db.VarChar(200)
  body        String   @db.Text
  readAt      DateTime? @map("read_at")
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([userId, readAt, createdAt])
  @@map("notifications")
}
```

### Acceptance Criteria

- User sees job completed/failed notifications.
- User can mark notifications as read.
- Notifications are workspace-scoped where relevant.

---

# PART K — LEGAL, COMPLIANCE, AND TRUST

## 25. Legal Pages

### Status

Missing.

### Required Before Paid Launch

- Terms of Service
- Privacy Policy
- Refund Policy
- Cancellation Policy
- Acceptable Use Policy
- AI Output Disclaimer
- Data Retention Policy
- Security Overview
- Cookie Policy, if tracking cookies are used

### Important AI Disclaimer

The product should clearly state:

- Scores are directional and evidence-assisted.
- The product does not guarantee ad performance.
- The product does not measure actual human brain activity.
- The product does not replace media testing or campaign analytics.
- Recommendations should be reviewed by marketers before use.

### Acceptance Criteria

- Footer links legal pages.
- Signup references Terms and Privacy.
- Billing references Refund/Cancellation.
- Report page includes AI/output limitation note.

---

## 26. Privacy and Media Handling

### Status

Partial.

Private storage exists conceptually, but user-facing privacy controls are missing.

### Required User-Facing Trust Features

- Explain where uploads are stored
- Explain who can access them
- Explain how long raw media is retained
- Allow user to delete raw media/report
- Restrict employee/admin access
- Log admin access to customer data
- Signed URLs only
- No public buckets for private media

### Acceptance Criteria

- Users understand retention.
- Users can delete media.
- Admin access is audited.
- Private media is not exposed through static public URLs.

---

# PART L — PRODUCT UX COMPLETION

## 27. Dashboard Improvements

### Status

Present but incomplete for SaaS.

### Missing

- Workspace switcher
- Account/profile menu
- Usage/credits display
- Plan status badge
- “New analysis” quota check
- Recent reports
- Failed jobs with retry/contact support
- Search/filter improvements
- Pagination
- Empty states for first-time users
- Loading skeletons
- Notifications bell
- Upgrade CTA when credits exhausted

### Acceptance Criteria

- User knows remaining credits.
- User knows current workspace.
- User can find old reports.
- Failed jobs are understandable.
- First-time user knows what to do.

---

## 28. Report Sharing and Export

### Status

Partial.

Reports exist, but SaaS needs sharing/export workflows.

### Required Features

- Download report as PDF
- Download raw JSON, if plan allows
- Download evidence ZIP, if plan allows
- Share report with team
- Public/private share link with expiry
- Revoke share link
- Add notes/comments to report
- Duplicate job or re-run analysis

### Suggested Model

```prisma
model ReportShareLink {
  id             String   @id @default(uuid()) @db.Uuid
  analysisJobId  String   @map("analysis_job_id") @db.Uuid
  workspaceId    String   @map("workspace_id") @db.Uuid
  tokenHash      String   @map("token_hash") @db.Char(64)
  expiresAt      DateTime? @map("expires_at")
  revokedAt      DateTime? @map("revoked_at")
  createdById    String   @map("created_by_id") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([analysisJobId])
  @@map("report_share_links")
}
```

### Acceptance Criteria

- Reports are private by default.
- Shared links are revocable.
- Shared links can expire.
- Workspace members can access reports according to role.

---

## 29. Onboarding Flow

### Status

Missing.

### Required Flow

```text
First login
  ↓
Create or join workspace
  ↓
Choose role/use case
  ↓
Optional: invite team
  ↓
Optional: select plan/free trial
  ↓
Upload first creative
  ↓
View first report
```

### Required Onboarding Screens

- Welcome
- Workspace setup
- Use-case selection
- Plan/trial selection
- First upload
- Report explanation

### Acceptance Criteria

- New user is not dropped into a confusing blank dashboard.
- User understands static vs video vs full TribeV2 analysis.
- User gets first successful analysis quickly.
- User sees limits/trial credits.

---

# PART M — DATABASE AND BACKEND COMPLETION

## 30. Missing Database Models Summary

Current schema already has strong product-engine models. Add these SaaS-layer models:

| Model | Purpose |
|---|---|
| `UserProfile` | Profile/preferences |
| `WorkspaceInvite` | Team invite lifecycle |
| `PlatformAdmin` | SaaS admin roles |
| `BillingCustomer` | Payment provider customer mapping |
| `Subscription` | Active plan/subscription |
| `Invoice` | Invoice records |
| `CreditBalance` | Workspace credits |
| `UsageLedger` | Metered usage |
| `PlanLimit` | Plan entitlements |
| `Notification` | In-app notifications |
| `EmailEvent` | Transactional email tracking |
| `WorkerHeartbeat` | Worker health |
| `ReportShareLink` | Shareable report URLs |
| `SupportTicket` | User issue reporting |
| `RateLimitEvent` | Abuse/rate-limit audit |
| `DataDeletionRequest` | Account/workspace deletion workflow |

---

## 31. Required API Route Groups

### Public/Auth

```text
GET  /
GET  /pricing
GET  /features
GET  /terms
GET  /privacy
GET  /login
GET  /auth/callback
POST /api/auth/logout
```

### App

```text
GET  /api/me
PATCH /api/me/profile
GET  /api/workspaces
POST /api/workspaces
PATCH /api/workspaces/[workspaceId]
GET  /api/workspaces/[workspaceId]/members
POST /api/workspaces/[workspaceId]/invites
POST /api/workspaces/[workspaceId]/invites/[inviteId]/revoke
POST /api/workspaces/invites/accept
```

### Analysis

```text
POST /api/uploads/presign
PUT  /api/uploads/direct
GET  /api/uploads/view
POST /api/analysis/jobs
GET  /api/analysis/jobs
GET  /api/analysis/jobs/[jobId]
POST /api/analysis/jobs/[jobId]/cancel
POST /api/analysis/jobs/[jobId]/retry
GET  /api/analysis/jobs/[jobId]/report
POST /api/analysis/jobs/[jobId]/share
```

### Billing

```text
GET  /api/billing/status
POST /api/billing/checkout
POST /api/billing/portal
GET  /api/billing/invoices
POST /api/webhooks/billing
```

### Admin

```text
GET  /api/admin/overview
GET  /api/admin/users
GET  /api/admin/workspaces
GET  /api/admin/jobs
GET  /api/admin/workers
POST /api/admin/jobs/[jobId]/retry
POST /api/admin/workspaces/[workspaceId]/disable
POST /api/admin/workspaces/[workspaceId]/credits
GET  /api/admin/audit
```

---

# PART N — TESTING AND QUALITY

## 32. Required Test Coverage

### Current State

The repo has test scripts and some unit/integration/e2e testing paths. SaaS-specific tests need to be added.

### Required Tests

| Test Area | Required Cases |
|---|---|
| Auth | Unauthenticated cannot access app/API |
| RBAC | Reviewer cannot create/manage restricted resources |
| Workspace isolation | User cannot access another workspace’s jobs |
| Uploads | Invalid type/size rejected |
| Job creation | Requires auth, credits, clean artifact |
| Billing | Webhook signature, idempotency |
| Usage | Credits reserved/finalized/refunded |
| Invites | Accept/revoke/expire |
| Admin | Only platform admin can access |
| Reports | Private by default, share links expire |
| Rate limiting | Abuse is blocked |
| Worker | Lease, retry, timeout, failed job |

### Acceptance Criteria

- CI runs lint, typecheck, unit, integration, and e2e.
- Security-sensitive routes have tests.
- Tests cover cross-tenant access denial.
- Billing webhook tests cover duplicate events.

---

# PART O — DEPLOYMENT AND OPERATIONS

## 33. Deployment Readiness

### Status

Partial.

The repo has scripts and monorepo structure, but SaaS launch requires deployment runbooks.

### Required Environments

| Environment | Purpose |
|---|---|
| Local | Development |
| Preview | PR deployments |
| Staging | Production-like testing |
| Production | Real users |

### Required Environment Variables

Group by area:

```text
App:
NEXT_PUBLIC_APP_URL
NODE_ENV

Supabase:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWKS_URL
SUPABASE_JWT_ISSUER
SUPABASE_JWT_AUDIENCE

Database:
DATABASE_URL
DIRECT_DATABASE_URL

Storage:
OBJECT_STORAGE_PROVIDER
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ENDPOINT_URL
AWS_REGION
B2_BUCKET_QUARANTINE
B2_BUCKET_PRIVATE_ARTIFACTS

AI Providers:
OPENAI_API_KEY
GROQ_API_KEY
GOOGLE_APPLICATION_CREDENTIALS or relevant CV provider config

Billing:
BILLING_PROVIDER
STRIPE_SECRET_KEY or RAZORPAY_KEY_SECRET
WEBHOOK_SECRET

Email:
EMAIL_PROVIDER
RESEND_API_KEY or POSTMARK_TOKEN

Observability:
SENTRY_DSN
LOGGING_API_KEY
POSTHOG_KEY

Security:
INTERNAL_ADMIN_ALLOWLIST
WORKER_SHARED_SECRET
```

### Required Runbooks

- Deploy web
- Deploy CPU worker
- Deploy GPU worker
- Rotate secrets
- Restore database backup
- Recover stuck jobs
- Refund failed job
- Disable abusive workspace
- Purge user data
- Respond to storage outage
- Respond to billing webhook failure

---

# PART P — PRIORITY ROADMAP

## 34. Recommended Build Order

### Phase 1 — SaaS Shell Foundation

Goal: Make the app navigable and user/account aware.

- Move current app dashboard to `/dashboard` or `/app`
- Build public landing page
- Add app shell/navigation
- Add profile menu
- Add logout
- Add profile page
- Add workspace settings page
- Remove production auth fallback
- Add route groups

### Phase 2 — RBAC and Workspace Management

Goal: Make multi-user workspace usage safe.

- Add central `requireWorkspaceSession()`
- Add central `requirePermission()`
- Enforce RBAC on every route
- Add members page
- Add invites
- Add role management
- Add audit events for sensitive actions

### Phase 3 — Billing and Usage

Goal: Prevent unlimited expensive compute usage.

- Add plans
- Add billing customer/subscription models
- Integrate Stripe or Razorpay
- Add credits
- Add usage ledger
- Add quota checks before uploads/jobs
- Add billing page
- Add usage page

### Phase 4 — Admin Dashboard

Goal: Operate the SaaS.

- Add platform admin model
- Add `/admin`
- Add users/workspaces/jobs pages
- Add failed jobs page
- Add worker health page
- Add credit adjustment
- Add feature flags/capabilities UI
- Add audit log viewer

### Phase 5 — Production Hardening

Goal: Make it safe for external users.

- Add upload validation
- Add malware/content safety scanning
- Add rate limiting
- Add Sentry/logging/alerts
- Add email notifications
- Add legal pages
- Add retention cleanup jobs
- Add support/report issue flow

### Phase 6 — Growth and Enterprise Readiness

Goal: Make it commercially scalable.

- Add report sharing
- Add PDF export
- Add API keys
- Add webhooks
- Add team comments
- Add advanced admin tooling
- Add enterprise controls
- Add custom retention
- Add SSO later if needed

---

# PART Q — MVP LAUNCH CHECKLIST

## 35. Minimum Required Before Beta

```text
[ ] Public landing page
[ ] Login/logout
[ ] Production auth fallback removed
[ ] Dashboard route separated from public website
[ ] Profile page
[ ] Workspace settings page
[ ] Members page
[ ] Team invites
[ ] Central RBAC helper
[ ] RBAC applied to upload/job/report routes
[ ] Upload file size/type validation
[ ] Workspace usage limits
[ ] Basic credits system
[ ] Basic billing page or manual-credit beta mode
[ ] Admin dashboard MVP
[ ] Failed job admin view
[ ] Worker heartbeat
[ ] Sentry/error tracking
[ ] Transactional email for job complete/fail
[ ] Terms and Privacy pages
[ ] AI output disclaimer
[ ] Data retention policy
```

---

## 36. Minimum Required Before Paid Launch

```text
[ ] Stripe/Razorpay checkout
[ ] Billing webhook verification
[ ] Subscription status enforcement
[ ] Invoice view
[ ] Credits/usage ledger
[ ] Rate limiting
[ ] Upload hardening and quarantine validation
[ ] Signed private report/media access
[ ] Report export
[ ] Report sharing permissions
[ ] Admin usage dashboard
[ ] Admin billing dashboard
[ ] Audit log UI
[ ] Support issue reporting
[ ] Storage cleanup jobs
[ ] Backup/restore runbook
[ ] Production monitoring alerts
[ ] Refund/cancellation policy
[ ] Security page
```

---

# PART R — CRITICAL IMPLEMENTATION NOTES

## 37. Do Not Build These Too Early

Avoid adding these before the SaaS foundation is stable:

- Public API access
- Complex enterprise SSO
- Multiple payment providers
- Fully automated GPU instance orchestration
- White-labeling
- Advanced analytics dashboards
- Marketplace integrations
- Multi-region hosting
- Complex approval workflows

These are useful later, but they will slow down launch if done before billing, RBAC, admin, and usage controls.

---

## 38. Highest-Risk Missing Items

The top five risks are:

1. **No billing/usage control**  
   Users can potentially trigger expensive work without a commercial constraint.

2. **RBAC only partially enforced**  
   Schema roles exist, but APIs need centralized permission checks.

3. **Production auth fallback risk**  
   Dev fallback behavior must never be active in production.

4. **Upload trust model is too weak**  
   Uploaded artifacts need quarantine, validation, scanning, and stricter processing gates.

5. **No admin dashboard**  
   Without admin tools, you cannot support users, inspect failures, manage billing, or operate the SaaS.

---

## 39. Practical Next Sprint Recommendation

The next sprint should not add more analysis features. It should build the SaaS skeleton.

### Sprint: SaaS Foundation V1

#### Deliverables

1. Public landing page at `/`
2. App dashboard moved to `/dashboard`
3. Profile page
4. Workspace settings page
5. Logout flow
6. Central auth/session helper
7. Central RBAC helper
8. RBAC applied to analysis job routes
9. Upload route auth/permission validation
10. Basic usage counter per workspace
11. Admin-only route guard
12. Admin dashboard shell

#### Definition of Done

- Unauthenticated users can only access public/auth/legal pages.
- Authenticated users land in dashboard.
- User can edit profile.
- User can view workspace settings.
- Owner/Admin/Reviewer permissions behave differently.
- Upload/job creation requires permission.
- Admin page is inaccessible to normal users.
- No local/dev fallback is active in production.
- Tests cover workspace isolation.

---

## 40. Final Verdict

Sakhaa Signal is feature-rich on the creative-analysis side, but incomplete as a SaaS.

The missing work is not “more AI features.” The missing work is the SaaS business/product infrastructure:

```text
Website
→ Signup
→ Onboarding
→ Workspace
→ Team
→ RBAC
→ Billing
→ Usage credits
→ Admin
→ Support
→ Monitoring
→ Legal
→ Retention
→ Production hardening
```

Once these layers are added, the existing creative-analysis engine can be packaged and sold as a real SaaS product.
