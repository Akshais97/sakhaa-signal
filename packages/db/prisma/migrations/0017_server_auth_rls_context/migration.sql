-- Prisma connects directly to PostgreSQL and therefore has no Supabase JWT
-- identity function. Tenant authorization is carried in transaction-local
-- app.current_user_id, set by the web control plane after validating Supabase
-- Auth with getUser().
CREATE OR REPLACE FUNCTION public.app_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE artifacts FORCE ROW LEVEL SECURITY;
ALTER TABLE analysis_jobs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_select_self ON users;
CREATE POLICY user_select_self ON users FOR SELECT USING (id = public.app_current_user_id());

DROP POLICY IF EXISTS user_insert_self ON users;
CREATE POLICY user_insert_self ON users FOR INSERT WITH CHECK (id = public.app_current_user_id());

DROP POLICY IF EXISTS membership_select_own_workspace ON memberships;
CREATE POLICY membership_select_own_workspace ON memberships
  FOR SELECT USING (user_id = public.app_current_user_id());

DROP POLICY IF EXISTS workspace_select_member ON workspaces;
CREATE POLICY workspace_select_member ON workspaces FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.workspace_id = workspaces.id
      AND m.user_id = public.app_current_user_id()
      AND m.status = 'ACTIVE'
  )
);

DROP POLICY IF EXISTS workspace_insert_current_creation ON workspaces;
CREATE POLICY workspace_insert_current_creation ON workspaces FOR INSERT WITH CHECK (
  id::text = current_setting('app.current_workspace_id', true)
);

DROP POLICY IF EXISTS membership_insert_creator_owner ON memberships;
CREATE POLICY membership_insert_creator_owner ON memberships FOR INSERT WITH CHECK (
  workspace_id::text = current_setting('app.current_workspace_id', true)
  AND user_id = public.app_current_user_id()
  AND role = 'OWNER'
  AND status = 'ACTIVE'
);

DROP POLICY IF EXISTS artifacts_workspace_isolation ON artifacts;
CREATE POLICY artifacts_workspace_isolation ON artifacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = artifacts.workspace_id
        AND m.user_id = public.app_current_user_id()
        AND m.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = artifacts.workspace_id
        AND m.user_id = public.app_current_user_id()
        AND m.status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS analysis_jobs_workspace_access ON analysis_jobs;
CREATE POLICY analysis_jobs_workspace_access ON analysis_jobs
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = analysis_jobs.workspace_id
        AND m.user_id = public.app_current_user_id()
        AND m.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = analysis_jobs.workspace_id
        AND m.user_id = public.app_current_user_id()
        AND m.status = 'ACTIVE'
    )
  );

CREATE OR REPLACE FUNCTION public.can_access_analysis_job(target_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM analysis_jobs j
    JOIN memberships m ON m.workspace_id = j.workspace_id
    WHERE j.id = target_job_id
      AND m.user_id = public.app_current_user_id()
      AND m.status = 'ACTIVE'
  );
$$;
