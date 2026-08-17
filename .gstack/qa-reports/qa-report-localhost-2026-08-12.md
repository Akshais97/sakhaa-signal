# QA Report — Authenticated upload presign

- Date: 2026-08-12
- Scope: `/dashboard` → new creative wizard → `POST /api/uploads/presign`
- Framework: Next.js 16, Supabase Auth, Prisma, Selenium/Chrome
- Mode: Focused regression

## Result

The authenticated browser resolved a persisted workspace and received HTTP 200 with a B2 upload URL, artifact ID, object key, and the expected workspace ID. The test-created artifact, membership, workspace, and user were removed during teardown.

## ISSUE-001 — Workspace resolution returned 503 before B2 presigning

- Severity: Critical
- Category: Functional / deployment configuration
- Root cause: The live database had RLS enabled but no policies and no `public.app_current_user_id()` helper, proving the security migration chain had not been applied. In addition, Prisma requests did not establish transaction-local `app.current_user_id`. A privileged local connection bypassed the incomplete RLS state, masking the production-only failure.
- Fix status: Verified locally
- Fix: Applied a self-healing RLS migration, established transaction-local user/workspace context for auth, presign, upload completion, and job creation, validated the Vercel database URL, and retained fail-closed tenant authorization.
- Regression test: `tests/e2e/presign-workspace.regression-1.test.mjs`
- Before evidence: `screenshots/presign-workspace-before.png`
- After evidence: `screenshots/presign-workspace-after.png`

## Verification

- Auth/application consistency: 3/3 Supabase Auth identities have application users and active memberships.
- Pooler concurrency reproduction: 12/12 exact Prisma workspace queries succeeded.
- Restricted-role RLS integration: zero memberships without context; correct active membership with context.
- Live database repair migration: applied and verified.
- Selenium: 1/1 passed.
- API result: HTTP 200; expected deterministic development workspace ID.
- Cleanup: passed.

## Health score

Scoped functional health: 100/100 after the fix.

## Top deployment action

Set Vercel `DATABASE_URL` to the transaction-pooler connection for the same project as `NEXT_PUBLIC_SUPABASE_URL`, using port `6543`, then redeploy. A mismatched/direct URL now fails explicitly with `DATABASE_CONFIGURATION_ERROR` instead of deploying a broken upload flow.

## PR summary

QA found one critical authenticated-presign failure, added deployment configuration guards and a Selenium regression test, and verified the scoped flow at 100/100.
