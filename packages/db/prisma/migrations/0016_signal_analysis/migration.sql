-- Synchronize Supabase Auth identities into the application-owned user table.
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    'ACTIVE',
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS sync_auth_user_to_public_users ON auth.users;
    CREATE TRIGGER sync_auth_user_to_public_users
    AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_public_users();

    INSERT INTO public.users (id, email, display_name, status, created_at, updated_at)
    SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
           'ACTIVE', COALESCE(created_at, now()), now()
    FROM auth.users
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
      updated_at = now();
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE analysis_mode AS ENUM ('STATIC_STANDARD', 'VIDEO_STANDARD', 'FULL_WITH_TRIBEV2');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS analysis_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspaces(id),
  title varchar(240), mode analysis_mode NOT NULL, status job_status NOT NULL DEFAULT 'QUEUED',
  progress_percent integer NOT NULL DEFAULT 0, current_stage varchar(120),
  input_artifact_id uuid NOT NULL, input_object_key varchar(500) NOT NULL, media_type varchar(80) NOT NULL,
  duration_seconds double precision, brand_name varchar(160), target_platform varchar(80), placement varchar(80),
  creative_goal varchar(240), selected_model varchar(80), lease_owner varchar(160), lease_expires_at timestamptz,
  error_message text, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analysis_jobs_workspace_status_created_idx ON analysis_jobs(workspace_id, status, created_at);
CREATE INDEX IF NOT EXISTS analysis_jobs_status_lease_idx ON analysis_jobs(status, lease_expires_at);

CREATE TABLE IF NOT EXISTS analysis_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_job_id uuid NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  stage_name varchar(120) NOT NULL, stage_order integer NOT NULL DEFAULT 1, status job_status NOT NULL DEFAULT 'QUEUED',
  started_at timestamptz, completed_at timestamptz, metadata jsonb
);
CREATE INDEX IF NOT EXISTS analysis_stages_job_name_idx ON analysis_stages(analysis_job_id, stage_name);

CREATE TABLE IF NOT EXISTS evidence_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_job_id uuid NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  observation_type varchar(120) NOT NULL, label text, start_ms integer, end_ms integer, bounding_box jsonb,
  confidence double precision NOT NULL DEFAULT 1.0, provider varchar(120) NOT NULL, raw_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evidence_observations_job_type_idx ON evidence_observations(analysis_job_id, observation_type);

CREATE TABLE IF NOT EXISTS rule_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_job_id uuid NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  rule_code varchar(120) NOT NULL, status varchar(40) NOT NULL, expected text, actual text,
  severity varchar(40) NOT NULL DEFAULT 'MEDIUM', evidence_ids jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rule_results_job_code_idx ON rule_results(analysis_job_id, rule_code);

CREATE TABLE IF NOT EXISTS category_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_job_id uuid NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  category varchar(120) NOT NULL, score double precision NOT NULL, confidence double precision NOT NULL DEFAULT 1.0,
  weight double precision NOT NULL DEFAULT 1.0, breakdown jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS category_scores_job_category_idx ON category_scores(analysis_job_id, category);

CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_job_id uuid NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  type varchar(60) NOT NULL, category varchar(120) NOT NULL, title varchar(240) NOT NULL, description text NOT NULL,
  recommendation text, impact_priority varchar(40) NOT NULL DEFAULT 'MEDIUM', timestamp_ms integer, evidence_ids jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS findings_job_type_idx ON findings(analysis_job_id, type);

CREATE TABLE IF NOT EXISTS report_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), analysis_job_id uuid NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  report_type varchar(80) NOT NULL, object_key varchar(500) NOT NULL, schema_version varchar(40) NOT NULL,
  summary_json jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_artifacts_job_type_idx ON report_artifacts(analysis_job_id, report_type);

ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_artifacts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_analysis_job(target_job_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM analysis_jobs j JOIN memberships m ON m.workspace_id = j.workspace_id
    WHERE j.id = target_job_id AND m.user_id = auth.uid() AND m.status = 'ACTIVE'
  );
$$;

DROP POLICY IF EXISTS analysis_jobs_workspace_access ON analysis_jobs;
CREATE POLICY analysis_jobs_workspace_access ON analysis_jobs USING (
  EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id = analysis_jobs.workspace_id AND m.user_id = auth.uid() AND m.status = 'ACTIVE')
) WITH CHECK (
  EXISTS (SELECT 1 FROM memberships m WHERE m.workspace_id = analysis_jobs.workspace_id AND m.user_id = auth.uid() AND m.status = 'ACTIVE')
);

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['analysis_stages','evidence_observations','rule_results','category_scores','findings','report_artifacts'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS analysis_job_access ON %I', table_name);
    EXECUTE format('CREATE POLICY analysis_job_access ON %I USING (public.can_access_analysis_job(analysis_job_id)) WITH CHECK (public.can_access_analysis_job(analysis_job_id))', table_name);
  END LOOP;
END $$;
