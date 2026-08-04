# Root Cause Analysis: Route-Transition Latency in `apps/web`

> **Status:** RCA complete and source-verified. This is a diagnostic report, not a claim that any fix has shipped.
> **Scope:** `apps/web` — Next.js `16.2.9` / React `19.2.4` App Router, Supabase Auth, Prisma + Postgres.
> **Date:** 2026-08-04

---

## 1. Symptom and run context

The application is unacceptably slow when shifting from one path/route to another. Confirmed run context:

- Running via **`pnpm dev` natively on Windows** (not Docker, not a production build).
- Slow **every time, even on repeat visits** — so it is *not* only first-visit route compilation; there is a real per-request cost.
- **Smooth client-side transitions** (no full-page reload / white flash) that just take long to surface content.

## 2. Method

Followed the systematic-debugging skill (Phase 1–3: gather evidence before proposing any fix). Three parallel Explore agents covered the routing, client-rendering, and server/build layers. **Every load-bearing claim below was personally verified against the source.** Two agent claims were wrong and dropped (see §6): a `db.ts` dev-Prisma "bug" (the code is the correct global-cached pattern) and a "render-blocking Fontshare stylesheet" (the layout uses self-hosted `next/font`; no remote CSS).

Stack facts: Next.js `16.2.9`, React `19.2.4`, App Router. Auth = Supabase (`@supabase/ssr`) pointed at a **remote** hosted instance (`https://wvaeojetbolxtihnmddg.supabase.co`). DB = Prisma + Postgres via the `@sakhaa-forge/db` workspace package. No SWR/React Query, no React Context providers at all. `next.config.ts` is effectively empty. **Zero `loading.tsx`/`error.tsx`/`Suspense` in the entire app** (glob-confirmed). **Zero `useMemo`/`useCallback`/`React.memo`/`next/dynamic`/`next/script` anywhere** (grep-confirmed).

---

## 3. The single most probable dominant factor

> **Every route transition triggers one or more remote Supabase Auth `getUser()` network roundtrips — once in middleware on every matched request, and again inside `getAuthenticatedSession()` on every authenticated page/API — followed by a Prisma DB *write* (`user.upsert`) plus 1–2 DB queries, all with no streaming boundary, so the browser shows nothing new until the whole server chain finishes.**

Against a **remote** Supabase instance reached from a Windows dev machine, each `getUser()` is a real network RTT (easily 150–500 ms depending on region). It runs **2–3× per navigation** (middleware for the page, middleware again for the client page's follow-up `/api/jobs` call, plus `getAuthenticatedSession` inside that API call). Nothing is cached across requests. This alone explains "slow every time, even on repeat, smooth but nothing appears."

Evidence:

- `apps/web/src/middleware.ts:34-36` — `await supabase.auth.getUser()` on every matched request; matcher `:60-71` matches all pages **and** `/api/*`. The result is **unused** for API routes (`:42`,`:46` short-circuit) and in dev (`isDevBypass` is true in non-prod, `:43`), yet the remote call still fires every time.
- `apps/web/src/lib/auth.ts:20` — `getAuthenticatedSession` is wrapped in React `cache()` (dedupes **within one request only**, not across navigations or the page→API boundary). It calls `supabase.auth.getUser()` **again** (`:43`, second remote roundtrip), then `prisma.user.upsert` (`:81-91`, a **DB write every navigation**), `prisma.platformAdmin.upsert`/`findUnique` (`:99-108`), `prisma.workspace.findFirst` (`:115-122`), `prisma.membership.findFirst` (`:125-131`), and possible `membership.update`/`workspace.create` writes (`:136-160`). It also awaits `cookies()` (`:21`), opting routes out of static rendering.

**Net per-navigation cost (authenticated):** ≈2 remote Supabase `getUser()` roundtrips (middleware + route) + ≥1 DB write + 1–2 DB queries, every single time, with no cross-request cache. For client-component pages (dashboard, settings, profile) the soft-nav RSC is light, but the page's `useEffect` then fires `/api/jobs` (or `/api/me`) — a *separate* request that re-runs the **whole** middleware + `getAuthenticatedSession` chain again.

---

## 4. Multi-factor root cause (ranked, all verified)

### Tier 1 — Per-navigation server roundtrips (hits EVERY transition)
1. **Middleware `getUser()` remote roundtrip on every matched request** — `middleware.ts:34-36`, matcher `:60-71` (broad; includes `/api/*`). Fires even when the result is unused (API routes, dev bypass).
2. **`getAuthenticatedSession` re-does Supabase + a DB write + queries per request** — `auth.ts:43,81-91,99-122`. `cache()` only dedupes within one request; it does not bridge middleware→route (different runtimes) or page→follow-up-API-call.
3. **Admin layout guard compounds it** — `(admin)/admin/layout.tsx:12` calls `requirePlatformAdminSession()` → `getAuthenticatedSession()` **plus** `prisma.platformAdmin.findUnique` (`adminAuth.ts:16-18`) on every admin tab switch.

### Tier 2 — No streaming / no loading boundaries (why a "smooth" nav shows nothing)
4. **Zero `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, or `<Suspense>` in all of `apps/web/src`** (glob-confirmed). Server-rendered routes (admin pages, `analysis/[jobId]`, `share/[token]`) block the entire navigation until **all** awaited DB queries finish — no intermediate UI. This is precisely why a soft-nav feels "frozen": the browser holds the old view until the full RSC payload returns.
5. **Dynamic routes default to dynamic rendering** — no `generateStaticParams`, no `export const dynamic`/`revalidate`/`fetchCache` anywhere. `analysis/[jobId]` (6 includes at `page.tsx:9-19`), `results/[jobId]`, `share/[token]` fetch fresh from Prisma every visit. Even the public marketing landing is forced dynamic because `app/page.tsx:6` calls `getAuthenticatedSession()` (→ `cookies()`).

### Tier 3 — Client-side remounts & fetch waterfalls (post-paint latency)
6. **No shared `(app)` group layout** (only root + `(admin)/admin/layout.tsx` exist). Every app-page navigation **remounts `<AppNavbar>`** and `<WorkspaceSwitcher>`, which re-fires `fetch("/api/workspaces")` on every transition (`WorkspaceSwitcher.tsx:20-31`) — and `/api/workspaces` **does not exist** (404; glob-confirmed — still runs middleware Supabase roundtrip).
7. **Sequential fetch waterfalls (none parallelized):** dashboard `handleSelectJob` = 4 sequential awaits (`dashboard/page.tsx:134-175`: `/api/jobs/{id}` → `/api/jobs/{id}/artifacts` → score JSON → llm JSON); `results/[jobId]/page.tsx:196-241` same 4-step; `settings/billing/page.tsx:13-36` 2-step; `settings/members/page.tsx:37-61` 2-step.
8. **Every settings page fetches the full `/api/jobs` list just to read `data.workspace`** (workspace, usage, billing, members pages) — redundant full-list fetch per mount.
9. **`/api/jobs/[job_id]` can take up to 2 s** — `api/jobs/[job_id]/route.ts:80-85,130-135` does an external fetch to the GPU worker with `AbortSignal.timeout(2000)`; this sits inside the dashboard's selection waterfall and 1s-poll.
10. **Aggressive polling re-triggers the full auth+DB chain:** dashboard 3s (`dashboard/page.tsx:130`) + 1s (`:184`); `static-report.tsx:65-75` every 1.5s; `video-report.tsx:132-134` `router.refresh()` every 4s (re-runs the 6-include Prisma query + middleware).
11. **Broken polling effect:** `dashboard/page.tsx:196` has `[selectedJobId, jobs]` as deps — `jobs` changes every 3s from the other interval, so the 1s interval is torn down and recreated every 3s.
12. **No data-fetching/cache layer** (no SWR/React Query, no Context) → every mount refetches from zero; no dedupe, no background revalidation.

### Tier 4 — Heavy components & zero memoization (render cost)
13. **Zero `useMemo`/`useCallback`/`React.memo`/`next/dynamic`/`next/script`** in the entire codebase (grep-confirmed). Dashboard is **894 lines** with 16 `useState`; `filteredJobs` recomputed via `.filter()` every render (`:313-326`); all handlers recreated every render. Each 3s poll re-renders the whole 894-line subtree + `<AppNavbar>` (props `user`/`workspace` are fresh object refs after each `fetchJobs`, `:118-119`).
14. **Heavy components eagerly bundled (no `next/dynamic`):** `JobWizard.tsx` (18.9 KB) + `SignalJobWizard.tsx` (17 KB) statically imported into dashboard (`:5-6`) but only rendered conditionally; `static-report.tsx` (34 KB) + `video-report.tsx` (35 KB) eagerly imported into `analysis/[jobId]/page.tsx`.
15. **Login page creates the Supabase browser client on every render** (`login/page.tsx:10-13`) rather than once.

### Tier 5 — Dev-mode aggravation (the user runs `pnpm dev`)
16. **On-demand route compilation + dev React runtime + unminified JS** — secondary (slowness on repeat visits proves it is not the dominant cause), but it stacks on top and must be measured (see §5 Phase 0) to attribute correctly.

### Tier 6 — Wasted 404 roundtrips & hard navigations
17. **404 roundtrips on every `AppNavbar` mount** (`/api/workspaces`) and every billing mount (`/api/billing/status`, `settings/billing/page.tsx:21`) — both routes confirmed absent. Each 404 still runs the middleware Supabase roundtrip.
18. **Hard navigations bypass client routing** and re-trigger full SSR + middleware + the full auth chain: `dashboard/page.tsx:888` (`window.location.href = /analysis/{jobId}`); `WorkspaceSwitcher.tsx:35` (`window.location.reload()` on workspace switch); logout → `/login`; billing → Stripe. (These specific actions cause a flash; the user's main symptom is the soft-navs, but these compound specific flows.)

### Tier 7 — Heavy / uncached server queries (extends the blocking render)
19. **5 sequential Prisma awaits** in `(admin)/admin/page.tsx:6-14` (not `Promise.all`).
20. **6-include `findUnique`** in `analysis/[jobId]/page.tsx:9-19`.
21. **Unbounded `findMany` (no `take`):** `api/jobs/route.ts:14-20`, `api/analysis/jobs/route.ts:13-20`, `(admin)/admin/workspaces/page.tsx:5-17`, `(admin)/admin/workers/page.tsx:5-7`, `api/admin/users/route.ts:14-30` (the last has **no `where` clause** — loads every credit-balance row).

---

## 5. Recommended fixes (phased, by impact / risk)

### Phase 0 — Diagnostics & baseline (do first; read-only)
The user runs `pnpm dev`, so the key question is *how much latency is dev-only compilation/HMR/React-dev-runtime vs. real architectural cost*.
- **Dev-vs-prod isolation (critical):** run `pnpm build && pnpm start` (or `pnpm --filter web build && start`) and time the same navigations. If prod is fast and dev is slow, a large share is dev compilation, not architecture.
- **Time the auth chain:** temporary `performance.now()` around `supabase.auth.getUser()` in `middleware.ts:34-36` and `auth.ts:43`, and around the Prisma block `auth.ts:81-153`. Capture middleware getUser ms, route getUser ms, Prisma-chain ms, total `/api/jobs` ms.
- **Verify `db.ts`:** add a module-scope instantiation counter in dev to confirm whether Prisma churn is real (the code looks correct). If stable, do nothing.
- **Baseline Network/Performance tab:** record LCP/FCP and the `/api/jobs` waterfall for a dashboard nav and an analysis nav, in both dev and prod.

### Phase 1 — Cut the duplicated remote Supabase roundtrip + DB-write (highest impact)
Ordered low-risk-first. This is the dominant cost and hits every transition.

**1a. Short-circuit middleware `getUser()` for `/api/*` and dev-bypass (quick win, zero auth risk)** — `middleware.ts:34-50`. Move `isAuthPage`/`isApiRoute`/`isDevBypass` (`:38-43`) *before* `getUser()`. Skip the remote call when its result is unused: `isApiRoute` → return `response` (no redirect ever applies to `/api/*`); `isDevBypass && !isAuthPage` → skip. Removes one Supabase roundtrip on every API hit — including the 3s/1s dashboard polls and the 404s. Risk: none to auth — only skips a call whose result was already discarded. Verify the page redirect still fires for unauthenticated page visits.

**1b. Replace per-navigation `user.upsert` with conditional update/create (low risk)** — `auth.ts:81-91`. `findUnique({ where:{id}, select:{id,email} })` → `create` if missing; `update` email only if `stored.email !== user.email`; else skip. Converts a DB **write every navigation** into a read + a write only on first login/email change. Same pattern optionally for `platformAdmin.upsert` (`:98-103`, 4 hardcoded admin emails only). Risk: low — create path preserved; verify the user row exists before the membership/workspace queries that follow.

**1c. Thread middleware-resolved user to the route via header (medium risk — biggest page-nav win)** — `middleware.ts` + `auth.ts:20-45`. When middleware *does* run `getUser()` (page routes) and finds a user, forward verified identity so `getAuthenticatedSession` skips its redundant `getUser()`: (1) middleware **strips** any incoming client-supplied `x-auth-user-*` headers first (anti-spoofing); (2) only when `user` is present, sets `x-auth-user-id`/`email`/minimal metadata on the forwarded request; (3) `getAuthenticatedSession` reads `headers()` and uses them when present, else falls back to `getUser()`. Removes the second roundtrip on every page nav (pages 2→1). **Critical risks:** header spoofing — middleware must always strip client values and must always run on matched routes; API routes (which skip `getUser()` in 1a) must NOT set the header, so their `getAuthenticatedSession` re-verifies via Supabase. Per-request only — never cache across requests (logout invalidates next request). **Safe fallback:** if this risk is unacceptable, skip 1c and keep pages at 2 roundtrips — you still get 1a (API 2→1) + 1b (no write). Verify: only one `getUser()` per page nav; unauthed page nav still redirects to `/login`; a forged client `x-auth-user-id` is ignored on both page and API routes.

**1d. (Optional, dev) Dev-bypass header** — when `isDevBypass && !isAuthPage`, set `x-dev-bypass: 1`; `getAuthenticatedSession` honors it only when `NODE_ENV !== 'production'` and skips straight to the dev-bypass workspace path (`auth.ts:57-77`). Dev-only; defense-in-depth so a prod build can never be tricked.

### Phase 2 — Add streaming so navigations aren't frozen (high perceived-latency win, low risk)
Purely additive, zero behavior change. Add `loading.tsx` to the routes that block longest:
- `apps/web/src/app/(app)/loading.tsx` (app-shell skeleton — every app-page nav)
- `apps/web/src/app/(admin)/admin/loading.tsx` (admin routes with sequential counts)
- `apps/web/src/app/analysis/[jobId]/loading.tsx` (6-include `findUnique`)
- `apps/web/src/app/share/[token]/loading.tsx` (public share)
- Wrap slow *sections* of heavy pages in `<Suspense>` so fast parts stream first. Verify skeleton paints within ~1 frame of nav.

### Phase 3 — Shared `(app)` layout + fix 404s + workspace threading (high impact, low-medium risk)
**3a. Create a shared `(app)/layout.tsx`** that calls `getAuthenticatedSession()` once and renders `<AppNavbar>` + `<WorkspaceSwitcher>` with workspace as a prop; individual pages stop rendering their own `<AppNavbar>`. Route groups don't change URLs, so paths stay identical. Removes navbar remount + `/api/workspaces` re-fetch on every app-page nav, and stabilizes `user`/`workspace` object refs (kills the fresh-ref re-render). Keep `app/page.tsx`, `/login`, `/auth/callback` *outside* the group. Verify all app URLs unchanged.
**3b. Stop the 404 fetches:** `WorkspaceSwitcher.tsx:20-31` (`/api/workspaces`) and `settings/billing/page.tsx:21` (`/api/billing/status`). Take workspace as a prop from the layout (no mount-time fetch); fetch the workspace list lazily on dropdown open, or create a real lightweight `/api/workspaces` route. For billing, create `/api/billing/status` if real or remove the fetch if vestigial.
**3c. Drop the full `/api/jobs` fetch on settings pages** (workspace/usage/billing/members fetch it only to read `data.workspace`): thread the workspace down from the layout; if usage needs job stats, add a dedicated lightweight `/api/workspace/usage` endpoint instead.
**3d. (Follow-up) SWR/React Query** to dedupe mounts and enable background revalidation for poll-heavy client data. New dependency; ensure auth-gated data is **not** cached with a long cross-session TTL.

### Phase 4 — Client fetch waterfalls & polling (impact, low-medium risk)
**4a. Parallelize independent fetches** — `dashboard/page.tsx:134-175` and `results/[jobId]/page.tsx:196-241`: job + artifacts are independent (artifacts only needs `job_id`, already known) → `Promise.all([job, artifacts])`; then score + llm depend on artifacts → `Promise.all([score, llm])`. 4 steps → 2. Billing/members 2-step → `Promise.all`. Only parallelize genuinely independent fetches.
**4b. Fix the polling effect** — `dashboard/page.tsx:130` (3s) and `:184`/`:196` (1s): use a ref for latest `jobs` so the 1s interval isn't recreated every 3s; consider raising to 4–5s and aligning the two intervals to avoid overlapping refetches. Verify running-job liveness still updates promptly.
**4c. Stabilize `<AppNavbar>` props** — after 3a the layout is a server component calling `getAuthenticatedSession` once, so `user`/`workspace` are stable across app-group navigations (fresh-ref problem vanishes). Add `React.memo` on `<AppNavbar>`/expensive children as belt-and-suspenders.
**4d. Throttle/decouple report pollers** — `static-report.tsx:65-75` (1.5s), `video-report.tsx:132-134` (`router.refresh()` every 4s re-runs the 6-include Prisma query + middleware). Increase intervals, stop polling on terminal status, and replace `router.refresh()` with a targeted status-only refetch (SWR mutation) instead of re-rendering the whole RSC tree.

### Phase 5 — Memoization + code-splitting (render cost, low risk)
**5a. Code-split eagerly-bundled heavy components** — `next/dynamic(() => import("..."), { ssr: false })` for `JobWizard` + `SignalJobWizard` (dashboard `:5-6`, conditionally rendered) and for `static-report`/`video-report` (analysis page — load the right report by job type without shipping both).
**5b. Memoize dashboard hot paths** — `useMemo` for `filteredJobs` (`dashboard/page.tsx:313-326`, deps `jobs` + filters); `useCallback` for handlers passed to memoized children; `React.memo` on expensive children; stabilize the `jobs` array ref when unchanged. Don't over-memo with stale deps — verify filters re-apply when `jobs` changes.
**5c. Move login Supabase client into `useMemo`** — `login/page.tsx:10-13`.

### Phase 6 — Server query efficiency (blocking render, low-medium risk)
**6a. Parallelize admin counts** — `(admin)/admin/page.tsx:6-14` → `Promise.all`.
**6b. Bound unbounded `findMany`** — add `take` (+ `orderBy`) to `api/jobs/route.ts:14-20`, `api/analysis/jobs/route.ts:13-20`, `(admin)/admin/workspaces/page.tsx:5-17`, `(admin)/admin/workers/page.tsx:5-7`; add a `where` to `api/admin/users/route.ts:14-30`; add pagination UI where the list is user-facing.
**6c. Audit the 6-include `findUnique`** — `analysis/[jobId]/page.tsx:9-19`: move includes not needed for initial render to a client fetch (with a Suspense boundary) so the server payload shrinks and the route renders sooner.
**6d. Don't block job-status on the GPU-worker fetch** — `api/jobs/[job_id]/route.ts:80-85,130-135` (2s timeout) makes selecting/polling a running job take up to 2s. Return job status immediately and fetch GPU progress via a separate field/endpoint, or lower the timeout and surface "worker unreachable" gracefully. Per project rules: treat provider timeout as `unknown` and reconcile — don't silently swallow worker errors.

### Phase 7 — Config + hard navs + static landing (low risk)
**7a. `db.ts` — verify, don't fix.** `db.ts:17-26` already uses the correct global-cached pattern. Use the Phase 0 counter; if churn is real, investigate the root cause (e.g., the package being re-evaluated by HMR) rather than re-adding a guard that's already present. Don't "fix" correct code.
**7b. `next.config.ts`** — add `transpilePackages: ['@sakhaa-forge/db']` (helps dev HMR + prod bundling); add `experimental.optimizePackageImports` if any barrel-export-heavy packages. Verify build still succeeds.
**7c. Replace hard `window.location` navigations with client routing** — `dashboard/page.tsx:888` → `router.push(`/analysis/${jobId}`)`; `WorkspaceSwitcher.tsx:35` → `router.refresh()`/`router.replace` instead of `reload()`. Keep logout → `/login` and billing → Stripe as full navigations (intentional, external/state-clearing).
**7d. Make the public landing static** — `app/page.tsx:6` forces dynamic by calling `getAuthenticatedSession()`. Move the auth-gated redirect out of the landing: let middleware handle unauthed → `/login` (`middleware.ts:46-50`), render the landing statically for everyone with a client-side "go to dashboard" button that routes to `/dashboard`. Don't render personalized data on the static landing.
*(No font work — fonts are already self-hosted via `next/font`.)*

---

## 6. Not a factor (corrected agent claims)
- **No render-blocking remote font CSS.** `app/layout.tsx` uses self-hosted `next/font/google` (Outfit/Inter/JetBrains Mono), no `<head>` link; `globals.css:1` is `@import "tailwindcss"` (build-time) and `:92-94` maps to `next/font` vars. Fonts are self-hosted — **not** a latency source. (Two agents + the Plan agent all carried a phantom "Fontshare stylesheet"; verified false.)
- **No dev-mode Prisma-client churn.** `db.ts:17-26` is the correct `globalForPrisma.prisma ?? new PrismaClient()` pattern with global assignment in non-prod. (Mis-flagged by an agent; verified false.)

## 7. Dead code (not a per-navigation factor, but noted)
- `lib/rateLimit.ts` (`checkRateLimit`) is **never called** anywhere — adds no cost, gives no protection.
- `lib/usage.ts` has **no importer** in `apps/web/src` — credit reservation does not run on job creation in the web app.

---

## 8. What NOT to do
- **No cross-request caching of auth-gated/tenant-scoped data.** No `unstable_cache`/route cache with a long TTL around `getAuthenticatedSession` results or tenant queries — would serve stale data across users/tenants and undermine RLS.
- **Do not weaken RLS.** All Prisma queries stay user-scoped; header-threading changes *how* identity reaches the route, not *what* the DB enforces.
- **Do not remove the middleware page redirect.** Only skip `getUser()` where its result is unused (`/api/*`, dev-bypass non-auth). The unauthed → `/login` redirect for pages must stay.
- **Do not make auth-gated pages static** to be fast — that caches personalized data. The `cookies()`-forced dynamic at `auth.ts:21` is correct for security on auth-gated routes.
- **Do not trust client-supplied auth headers.** Middleware must strip incoming `x-auth-user-*` before setting its own (1c). API routes that skip `getUser()` must not honor any client-supplied auth header.
- **Do not cache the Supabase user across requests.** Header threading is per-request only; never persist it in a module-level cache that survives logout/cookie rotation.
- **Do not parallelize fetches with real data dependencies** (score/llm JSON depend on the artifacts list — those stay sequential *after* artifacts resolves).
- **Do not silently swallow GPU-worker errors** — treat provider timeout as `unknown` and reconcile per project rules.
- **Do not strip `cookies()` from `getAuthenticatedSession`** to force pages static.

---

## 9. Verification (end-to-end, per phase)
After each phase, re-measure the Phase 0 timings and compare. Re-run the **dev-vs-prod comparison** after every phase — if a phase only improves dev and not prod, it addressed dev compilation, not architecture (useful for prioritization).
- **Phase 0:** time `/api/jobs` full chain; record LCP/FCP for dashboard + analysis navs in both `pnpm dev` and `pnpm build && pnpm start`. (Mandatory split.)
- **Phase 1:** confirm exactly one `getUser()` per page nav (was 2); zero `getUser()` in middleware for `/api/*`; DB writes drop to ~0 on repeat authed navs (Prisma log: no `upsert`/`update` steady-state); security check — forged client `x-auth-user-id` ignored on page + API routes; unauthed page nav still redirects to `/login`.
- **Phase 2:** skeleton paints within one frame of nav (Performance tab) for `(app)`, `admin`, `analysis/[jobId]`, `share/[token]`.
- **Phase 3:** `/api/workspaces` + `/api/billing/status` 404s gone from Network tab; `<AppNavbar>` does not remount on app-page nav (React Profiler: no commit for navbar subtree); settings pages no longer fetch `/api/jobs`.
- **Phase 4:** dashboard select-job goes 4 sequential → 2 grouped steps (Network waterfall); 1s interval not recreated every 3s (Profiler: effect not re-running on every `jobs` change).
- **Phase 5:** dynamic chunks for wizards/reports load only when used; dashboard re-render cost drops (Profiler "Why did this render?" shows stable refs).
- **Phase 6:** admin page render time drops after `Promise.all`; `findMany` queries carry `take`.
- **Phase 7:** soft navs for analysis/workspace-switch (no full SSR); `db.ts` instantiation count stable in dev (document if no change was needed).
- **Regression:** run `tests/unit/saas-phase*.test.mjs` to ensure auth/RBAC/billing behavior is unchanged; manual click-through `/` → `/dashboard` → `/analysis/[jobId]` → `/share/[token]` → admin tabs confirming reduced latency and no auth regressions (redirects, 401s, cross-tenant leaks).

---

## 10. Critical files
- `apps/web/src/middleware.ts`
- `apps/web/src/lib/auth.ts`
- `apps/web/src/lib/db.ts` (verify only)
- `apps/web/src/app/(app)/dashboard/page.tsx`
- `apps/web/src/app/layout.tsx` (no font work needed)
- new `apps/web/src/app/(app)/layout.tsx` (Phase 3a)
- `apps/web/src/components/layout/WorkspaceSwitcher.tsx`, `AppNavbar.tsx`
- `apps/web/src/app/analysis/[jobId]/page.tsx` + `static-report.tsx` + `video-report.tsx`
- `(admin)/admin/page.tsx`; `api/jobs/route.ts`; `api/jobs/[job_id]/route.ts`; `api/analysis/jobs/route.ts`; `api/admin/users/route.ts`
- `apps/web/next.config.ts` (Phase 7b)