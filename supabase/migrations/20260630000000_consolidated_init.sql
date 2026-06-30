-- =============================================================================
-- CONSOLIDATED INIT MIGRATION
-- Run this once in the Supabase SQL editor (as postgres / service role).
-- Idempotent: uses IF NOT EXISTS, DROP IF EXISTS, CREATE OR REPLACE.
-- Fixes: all RLS policies now use is_admin() instead of
--        auth.jwt()->>'role' = 'admin' which never evaluates to true in
--        Supabase Auth (the JWT role claim is always 'authenticated').
-- Structure: functions → tables → indexes → FKs → RLS → policies → views
--            → seed data → admin profile
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- FUNCTIONS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'professional')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TABLES (FK-safe order — no inline RLS or policies)
-- ---------------------------------------------------------------------------

-- TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  full_name   TEXT,
  role        TEXT        NOT NULL DEFAULT 'professional',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'professional'))
);

-- TABLE: municipalities
CREATE TABLE IF NOT EXISTS public.municipalities (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     TEXT        NOT NULL UNIQUE,
  status                   TEXT        NOT NULL DEFAULT 'ACTIVE',
  sagsbehandler_name       TEXT,
  sagsbehandler_email      TEXT,
  sagsbehandler_phone      TEXT,
  secondary_contact_name   TEXT,
  secondary_contact_email  TEXT,
  secondary_contact_phone  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- TABLE: inbound_inquiries
CREATE TABLE IF NOT EXISTS public.inbound_inquiries (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type  TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'PENDING',
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitter_name   TEXT        NOT NULL,
  submitter_email  TEXT        NOT NULL,
  submitter_phone  TEXT,
  organization_name TEXT,
  message          TEXT,
  form_data        JSONB       NOT NULL DEFAULT '{}'::JSONB,
  source_url       TEXT,
  ip_hash          TEXT,
  captcha_verified BOOLEAN     NOT NULL DEFAULT FALSE,
  reviewed_by      UUID        REFERENCES public.profiles(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_to_type TEXT,
  converted_to_id  UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_submission_type CHECK (submission_type IN (
    'MUNICIPALITY_INQUIRY', 'PROFESSIONAL_APPLICATION', 'PARTNER_LEAD'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'PENDING', 'REVIEWED', 'CONVERTED', 'REJECTED', 'SPAM'
  ))
);

-- TABLE: professionals
CREATE TABLE IF NOT EXISTS public.professionals (
  id                   UUID          PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  profession           TEXT          NOT NULL,
  experience_years     INTEGER       NOT NULL DEFAULT 0,
  target_age_groups    TEXT[]        DEFAULT ARRAY[]::TEXT[],
  max_complexity_level TEXT          NOT NULL DEFAULT 'MEDIUM',
  qualifications       TEXT[]        DEFAULT ARRAY[]::TEXT[],
  capacity_hours_week  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  max_concurrent_cases INTEGER       NOT NULL DEFAULT 3,
  availability_days    TEXT[]        DEFAULT ARRAY[]::TEXT[],
  availability_status  TEXT          NOT NULL DEFAULT 'AVAILABLE',
  status               TEXT          NOT NULL DEFAULT 'REGISTERED',
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  archived_at          TIMESTAMPTZ,
  CONSTRAINT valid_profession CHECK (profession IN (
    'TEACHER', 'PEDAGOGUE', 'NURSE', 'PSYCHOLOGIST', 'SOCIAL_WORKER', 'COUNSELOR', 'OTHER'
  )),
  CONSTRAINT valid_experience        CHECK (experience_years >= 0),
  CONSTRAINT valid_complexity        CHECK (max_complexity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  CONSTRAINT valid_capacity          CHECK (capacity_hours_week >= 0),
  CONSTRAINT valid_concurrent        CHECK (max_concurrent_cases > 0),
  CONSTRAINT valid_availability_status CHECK (availability_status IN ('AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE')),
  CONSTRAINT valid_status            CHECK (status IN ('REGISTERED', 'ACTIVE', 'INACTIVE', 'ARCHIVED'))
);

-- TABLE: professional_documents
CREATE TABLE IF NOT EXISTS public.professional_documents (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id     UUID        NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  document_type       TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'PENDING_UPLOAD',
  file_path           TEXT,
  file_hash           TEXT,
  uploaded_at         TIMESTAMPTZ,
  uploaded_by         UUID        REFERENCES public.profiles(id),
  expiry_date         DATE,
  verified_at         TIMESTAMPTZ,
  verified_by         UUID        REFERENCES public.profiles(id),
  verification_notes  TEXT,
  re_upload_required  BOOLEAN     DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at         TIMESTAMPTZ,
  CONSTRAINT valid_type   CHECK (document_type IN (
    'CV', 'CRIMINAL_RECORD', 'CHILD_PROTECTION', 'DRIVING_LICENSE', 'QUALIFICATION', 'INSURANCE', 'OTHER'
  )),
  CONSTRAINT valid_status CHECK (status IN ('PENDING_UPLOAD', 'UNVERIFIED', 'VERIFIED', 'ARCHIVED'))
);

-- TABLE: cases
CREATE TABLE IF NOT EXISTS public.cases (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id          UUID         NOT NULL REFERENCES public.municipalities(id),
  status                   TEXT         NOT NULL DEFAULT 'OPEN',
  citizen_initials         CHAR(2)      NOT NULL,
  citizen_age_range        TEXT         NOT NULL,
  citizen_notes            TEXT,
  weekly_hours             DECIMAL(5,2) NOT NULL DEFAULT 0,
  complexity_level         TEXT         NOT NULL DEFAULT 'LOW',
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  archived_at              TIMESTAMPTZ,
  data_retention_expires_at TIMESTAMPTZ,
  CONSTRAINT valid_status     CHECK (status IN ('OPEN', 'MATCHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
  CONSTRAINT valid_age        CHECK (citizen_age_range IN ('0-5', '6-12', '13-18', '18+')),
  CONSTRAINT valid_hours      CHECK (weekly_hours >= 0),
  CONSTRAINT valid_complexity CHECK (complexity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- TABLE: case_complexity_factors
CREATE TABLE IF NOT EXISTS public.case_complexity_factors (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID        NOT NULL UNIQUE REFERENCES public.cases(id) ON DELETE CASCADE,
  mental_health     BOOLEAN     DEFAULT FALSE,
  family_instability BOOLEAN    DEFAULT FALSE,
  school            BOOLEAN     DEFAULT FALSE,
  violence          BOOLEAN     DEFAULT FALSE,
  substance_use     BOOLEAN     DEFAULT FALSE,
  criminality       BOOLEAN     DEFAULT FALSE,
  multiple_agencies BOOLEAN     DEFAULT FALSE,
  diagnosis         TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: case_assignments
CREATE TABLE IF NOT EXISTS public.case_assignments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID        NOT NULL REFERENCES public.cases(id),
  professional_id   UUID        NOT NULL REFERENCES public.professionals(id),
  assignment_status TEXT        NOT NULL DEFAULT 'ACTIVE',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  assigned_by       UUID        NOT NULL REFERENCES public.profiles(id),
  assignment_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (assignment_status IN ('ACTIVE', 'TRANSITIONED', 'TERMINATED', 'ARCHIVED'))
);

-- TABLE: case_grants
CREATE TABLE IF NOT EXISTS public.case_grants (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID          NOT NULL REFERENCES public.cases(id),
  municipality_id UUID          NOT NULL REFERENCES public.municipalities(id),
  granted_hours   DECIMAL(8,2)  NOT NULL,
  period_start    DATE          NOT NULL,
  period_end      DATE          NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'PENDING',
  created_by      UUID          NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  activated_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ,
  CONSTRAINT valid_hours  CHECK (granted_hours > 0),
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'ACTIVE', 'ARCHIVED', 'REVOKED'))
);

-- TABLE: case_handovers
CREATE TABLE IF NOT EXISTS public.case_handovers (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                  UUID        NOT NULL REFERENCES public.cases(id),
  outgoing_professional_id UUID        NOT NULL REFERENCES public.professionals(id),
  incoming_professional_id UUID        REFERENCES public.professionals(id),
  reason                   TEXT        NOT NULL,
  status                   TEXT        NOT NULL DEFAULT 'INITIATED',
  handover_note            TEXT,
  session_logs_transferred BOOLEAN     DEFAULT FALSE,
  transferred_session_logs UUID[],
  created_by               UUID        NOT NULL REFERENCES public.profiles(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at             TIMESTAMPTZ,
  CONSTRAINT valid_reason CHECK (reason IN (
    'PROFESSIONAL_UNAVAILABLE', 'WORKLOAD_EXCEEDED', 'REQUEST_PROFESSIONAL',
    'REQUEST_CASE', 'BETTER_MATCH', 'SAFEGUARDING_CONCERN', 'OTHER'
  )),
  CONSTRAINT valid_status CHECK (status IN ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- TABLE: session_logs
CREATE TABLE IF NOT EXISTS public.session_logs (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                     UUID        NOT NULL REFERENCES public.cases(id),
  professional_id             UUID        NOT NULL REFERENCES public.professionals(id),
  session_date                DATE        NOT NULL,
  duration_minutes            INTEGER     NOT NULL,
  status                      TEXT        NOT NULL DEFAULT 'DRAFT',
  observations                TEXT,
  citizen_mood_tone           TEXT,
  follow_up_needed            BOOLEAN     DEFAULT FALSE,
  follow_up_reason            TEXT,
  safeguarding_concern_flag   BOOLEAN     DEFAULT FALSE,
  safeguarding_detail         TEXT,
  safeguarding_acknowledged_at TIMESTAMPTZ,
  safeguarding_acknowledged_by UUID       REFERENCES public.profiles(id),
  participant_names           TEXT[],
  location                    TEXT,
  created_by                  UUID        NOT NULL REFERENCES public.professionals(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_retention_expires_at   TIMESTAMPTZ,
  CONSTRAINT valid_session_date CHECK (session_date <= CURRENT_DATE),
  CONSTRAINT valid_duration     CHECK (duration_minutes >= 1),
  CONSTRAINT valid_status       CHECK (status IN ('DRAFT', 'FINAL', 'CORRECTED', 'ARCHIVED'))
);

-- TABLE: session_log_corrections
CREATE TABLE IF NOT EXISTS public.session_log_corrections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id   UUID        NOT NULL REFERENCES public.session_logs(id) ON DELETE CASCADE,
  correction_note  TEXT        NOT NULL,
  correction_reason TEXT       NOT NULL,
  created_by       UUID        NOT NULL REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_reason CHECK (correction_reason IN (
    'TYPO', 'WRONG_TIME', 'CLARIFICATION', 'OMISSION', 'SAFEGUARDING', 'OTHER'
  ))
);

-- TABLE: session_log_transfers
CREATE TABLE IF NOT EXISTS public.session_log_transfers (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id        UUID        NOT NULL REFERENCES public.session_logs(id),
  from_professional_id  UUID        NOT NULL REFERENCES public.professionals(id),
  to_professional_id    UUID        NOT NULL REFERENCES public.professionals(id),
  approved_by           UUID        NOT NULL REFERENCES public.profiles(id),
  reason                TEXT        NOT NULL,
  transfer_note         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visibility_granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: registered_hours
CREATE TABLE IF NOT EXISTS public.registered_hours (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          UUID          NOT NULL REFERENCES public.cases(id),
  professional_id  UUID          NOT NULL REFERENCES public.professionals(id),
  work_date        DATE          NOT NULL,
  work_type        TEXT          NOT NULL,
  hours            DECIMAL(4,2)  NOT NULL,
  session_log_id   UUID          REFERENCES public.session_logs(id),
  status           TEXT          NOT NULL DEFAULT 'PENDING',
  submitted_at     TIMESTAMPTZ,
  grant_period_id  UUID          REFERENCES public.case_grants(id),
  description      TEXT,
  outside_grant_reason TEXT,
  reviewed_by      UUID          REFERENCES public.profiles(id),
  reviewed_at      TIMESTAMPTZ,
  review_note      TEXT,
  created_by       UUID          NOT NULL REFERENCES public.professionals(id),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_by       UUID          REFERENCES public.profiles(id),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  archived_at      TIMESTAMPTZ,
  CONSTRAINT valid_type   CHECK (work_type IN (
    'DIRECT_SESSION', 'TRANSPORT', 'DOCUMENTATION', 'COORDINATION', 'CRISIS_RESPONSE', 'TRAINING', 'OTHER'
  )),
  CONSTRAINT valid_hours  CHECK (hours >= 0.25 AND hours <= 8),
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'OUTSIDE_GRANT'))
);

-- TABLE: contact_logs
CREATE TABLE IF NOT EXISTS public.contact_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID        NOT NULL REFERENCES public.cases(id),
  professional_id UUID        NOT NULL REFERENCES public.professionals(id),
  contact_type    TEXT        NOT NULL,
  logged_at       TIMESTAMPTZ NOT NULL,
  logged_by       UUID        NOT NULL REFERENCES public.profiles(id),
  note            TEXT,
  outcome         TEXT,
  follow_up_required BOOLEAN  DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_type CHECK (contact_type IN ('PHONE_CALL', 'EMAIL', 'IN_PERSON', 'OTHER'))
);

-- TABLE: contact_disclosures
CREATE TABLE IF NOT EXISTS public.contact_disclosures (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                     UUID        NOT NULL REFERENCES public.cases(id),
  disclosed_to_professional_id UUID       NOT NULL REFERENCES public.professionals(id),
  disclosed_by                UUID        NOT NULL REFERENCES public.profiles(id),
  disclosed_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contact_method              TEXT        NOT NULL,
  sagsbehandler_name          TEXT,
  sagsbehandler_email         TEXT,
  sagsbehandler_phone         TEXT,
  reason                      TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_method CHECK (contact_method IN ('EMAIL', 'PHONE', 'MEETING'))
);

-- TABLE: match_runs (final_assignment_id FK added after case_assignments exists)
CREATE TABLE IF NOT EXISTS public.match_runs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             UUID        NOT NULL REFERENCES public.cases(id),
  triggered_by        UUID        NOT NULL REFERENCES public.profiles(id),
  triggered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status              TEXT        NOT NULL DEFAULT 'INITIATED',
  algorithm_version   TEXT        NOT NULL DEFAULT '1.0',
  final_assignment_id UUID,
  assigned_at         TIMESTAMPTZ,
  selected_by         UUID        REFERENCES public.profiles(id),
  selected_at         TIMESTAMPTZ,
  selected_reason     TEXT,
  matching_criteria   JSONB,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN (
    'INITIATED', 'SCORED', 'ASSIGNED', 'OVERRIDDEN', 'CANCELLED'
  ))
);

-- TABLE: match_candidates
CREATE TABLE IF NOT EXISTS public.match_candidates (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  match_run_id         UUID          NOT NULL REFERENCES public.match_runs(id),
  professional_id      UUID          NOT NULL REFERENCES public.professionals(id),
  rank                 INTEGER       NOT NULL,
  overall_score        DECIMAL(5,2)  NOT NULL,
  qualifications_score DECIMAL(5,2)  NOT NULL,
  availability_score   DECIMAL(5,2)  NOT NULL,
  capacity_score       DECIMAL(5,2)  NOT NULL,
  complexity_fit_score DECIMAL(5,2)  NOT NULL,
  algorithm_version    TEXT          NOT NULL DEFAULT '1.0',
  scoring_explanation  TEXT          NOT NULL,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_score CHECK (overall_score >= 0 AND overall_score <= 100)
);

-- TABLE: audit_events
CREATE TABLE IF NOT EXISTS public.audit_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT        NOT NULL,
  actor_id      UUID        REFERENCES public.profiles(id),
  resource_type TEXT        NOT NULL,
  resource_id   UUID        NOT NULL,
  metadata      JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: notification_log
CREATE TABLE IF NOT EXISTS public.notification_log (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type     TEXT        NOT NULL,
  related_entity_type   TEXT        NOT NULL,
  related_entity_id     UUID        NOT NULL,
  recipient_profile_id  UUID        REFERENCES public.profiles(id),
  recipient_email       TEXT,
  delivery_channel      TEXT        NOT NULL DEFAULT 'EMAIL',
  status                TEXT        NOT NULL DEFAULT 'PENDING',
  attempt_count         INTEGER     NOT NULL DEFAULT 0,
  failure_reason        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at               TIMESTAMPTZ,
  failed_at             TIMESTAMPTZ,
  CONSTRAINT valid_notification_type CHECK (notification_type IN (
    'INQUIRY_RECEIVED', 'PROFESSIONAL_APPLICATION_RECEIVED', 'CASE_CREATED',
    'SAFEGUARDING_FLAGGED', 'HOURS_SUBMITTED', 'DOCUMENT_ACTION_REQUIRED', 'CASE_CLOSED'
  )),
  CONSTRAINT valid_delivery_channel CHECK (delivery_channel IN (
    'EMAIL', 'IN_APP', 'SMS', 'PUSH', 'TEAMS', 'SLACK'
  )),
  CONSTRAINT valid_status       CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  CONSTRAINT valid_attempt_count CHECK (attempt_count >= 0 AND attempt_count <= 3),
  CONSTRAINT recipient_required CHECK (recipient_profile_id IS NOT NULL OR recipient_email IS NOT NULL)
);

-- TABLE: deletion_schedules
CREATE TABLE IF NOT EXISTS public.deletion_schedules (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type                 TEXT        NOT NULL,
  record_id                   UUID        NOT NULL,
  scheduled_for_deletion_at   TIMESTAMPTZ NOT NULL,
  retention_expired_at        TIMESTAMPTZ NOT NULL,
  reason                      TEXT        NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at                 TIMESTAMPTZ,
  CONSTRAINT valid_reason CHECK (reason IN ('RETENTION_EXPIRED', 'USER_REQUEST', 'LEGAL_REQUIREMENT'))
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_municipalities_status ON public.municipalities(status);
CREATE INDEX IF NOT EXISTS idx_municipalities_name   ON public.municipalities(name);

CREATE INDEX IF NOT EXISTS idx_inbound_inquiries_status          ON public.inbound_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inbound_inquiries_submission_type ON public.inbound_inquiries(submission_type);
CREATE INDEX IF NOT EXISTS idx_inbound_inquiries_submitted_at    ON public.inbound_inquiries(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_professionals_status              ON public.professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_archived_at         ON public.professionals(archived_at);
CREATE INDEX IF NOT EXISTS idx_professionals_availability_status ON public.professionals(availability_status);
CREATE INDEX IF NOT EXISTS idx_professionals_profession          ON public.professionals(profession);
CREATE INDEX IF NOT EXISTS idx_professionals_max_complexity      ON public.professionals(max_complexity_level);

CREATE INDEX IF NOT EXISTS idx_professional_documents_professional_id ON public.professional_documents(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_documents_status          ON public.professional_documents(status);
CREATE INDEX IF NOT EXISTS idx_professional_documents_archived_at     ON public.professional_documents(archived_at);
CREATE INDEX IF NOT EXISTS idx_professional_documents_expiry_date     ON public.professional_documents(expiry_date);

CREATE INDEX IF NOT EXISTS idx_cases_municipality_id           ON public.cases(municipality_id);
CREATE INDEX IF NOT EXISTS idx_cases_status                    ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_complexity_level          ON public.cases(complexity_level);
CREATE INDEX IF NOT EXISTS idx_cases_archived_at               ON public.cases(archived_at);
CREATE INDEX IF NOT EXISTS idx_cases_data_retention_expires_at ON public.cases(data_retention_expires_at);

CREATE INDEX IF NOT EXISTS idx_case_complexity_factors_case_id ON public.case_complexity_factors(case_id);

CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id         ON public.case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_professional_id ON public.case_assignments(professional_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_ended_at        ON public.case_assignments(ended_at);
CREATE INDEX IF NOT EXISTS idx_case_assignments_current         ON public.case_assignments(case_id, ended_at) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS one_active_assignment_per_case ON public.case_assignments(case_id) WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_case_grants_case_id ON public.case_grants(case_id);
CREATE INDEX IF NOT EXISTS idx_case_grants_period  ON public.case_grants(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_case_grants_status  ON public.case_grants(status);

CREATE INDEX IF NOT EXISTS idx_case_handovers_case_id ON public.case_handovers(case_id);
CREATE INDEX IF NOT EXISTS idx_case_handovers_status  ON public.case_handovers(status);

CREATE INDEX IF NOT EXISTS idx_session_logs_case_id          ON public.session_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_professional_id  ON public.session_logs(professional_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_date     ON public.session_logs(session_date);
CREATE INDEX IF NOT EXISTS idx_session_logs_status           ON public.session_logs(status);
CREATE INDEX IF NOT EXISTS idx_session_logs_data_retention   ON public.session_logs(data_retention_expires_at);

CREATE INDEX IF NOT EXISTS idx_session_log_corrections_session_log_id ON public.session_log_corrections(session_log_id);

CREATE INDEX IF NOT EXISTS idx_session_log_transfers_session_log_id      ON public.session_log_transfers(session_log_id);
CREATE INDEX IF NOT EXISTS idx_session_log_transfers_to_professional_id  ON public.session_log_transfers(to_professional_id);

CREATE INDEX IF NOT EXISTS idx_registered_hours_case_id         ON public.registered_hours(case_id);
CREATE INDEX IF NOT EXISTS idx_registered_hours_archived_at     ON public.registered_hours(archived_at);
CREATE INDEX IF NOT EXISTS idx_registered_hours_professional_id ON public.registered_hours(professional_id);
CREATE INDEX IF NOT EXISTS idx_registered_hours_work_date       ON public.registered_hours(work_date);
CREATE INDEX IF NOT EXISTS idx_registered_hours_status          ON public.registered_hours(status);
CREATE INDEX IF NOT EXISTS idx_registered_hours_session_log_id  ON public.registered_hours(session_log_id);
CREATE INDEX IF NOT EXISTS idx_registered_hours_grant_period    ON public.registered_hours(grant_period_id);

CREATE INDEX IF NOT EXISTS idx_contact_logs_case_id         ON public.contact_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_professional_id ON public.contact_logs(professional_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_logged_at       ON public.contact_logs(logged_at);

CREATE INDEX IF NOT EXISTS idx_contact_disclosures_case_id                    ON public.contact_disclosures(case_id);
CREATE INDEX IF NOT EXISTS idx_contact_disclosures_disclosed_to_professional_id ON public.contact_disclosures(disclosed_to_professional_id);

CREATE INDEX IF NOT EXISTS idx_match_runs_case_id           ON public.match_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_match_runs_status            ON public.match_runs(status);
CREATE INDEX IF NOT EXISTS idx_match_runs_algorithm_version ON public.match_runs(algorithm_version);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_runs_active_per_case
  ON public.match_runs(case_id)
  WHERE status IN ('INITIATED', 'SCORED');

CREATE INDEX IF NOT EXISTS idx_match_candidates_match_run_id    ON public.match_candidates(match_run_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_professional_id ON public.match_candidates(professional_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_rank            ON public.match_candidates(match_run_id, rank);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_candidates_unique_rank ON public.match_candidates(match_run_id, rank);

CREATE INDEX IF NOT EXISTS idx_audit_events_event_type    ON public.audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id      ON public.audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type ON public.audit_events(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_id   ON public.audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at    ON public.audit_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_log_status               ON public.notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_notification_type    ON public.notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_related_entity       ON public.notification_log(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at           ON public.notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_recipient_profile_id ON public.notification_log(recipient_profile_id)
  WHERE recipient_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deletion_schedules_scheduled_for_deletion_at
  ON public.deletion_schedules(scheduled_for_deletion_at);
CREATE INDEX IF NOT EXISTS idx_deletion_schedules_executed_at
  ON public.deletion_schedules(executed_at)
  WHERE executed_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_deletion_schedules_unique_pending
  ON public.deletion_schedules(record_type, record_id)
  WHERE executed_at IS NULL;

-- ---------------------------------------------------------------------------
-- FOREIGN KEYS (circular: match_runs → case_assignments)
-- ---------------------------------------------------------------------------
ALTER TABLE public.match_runs
  DROP CONSTRAINT IF EXISTS fk_match_runs_final_assignment;
ALTER TABLE public.match_runs
  ADD CONSTRAINT fk_match_runs_final_assignment
  FOREIGN KEY (final_assignment_id) REFERENCES public.case_assignments(id);

-- ---------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY (all tables)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_inquiries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_complexity_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_assignments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_grants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_handovers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_log_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_log_transfers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_hours        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_disclosures     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_runs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_candidates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_schedules      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS POLICIES (all tables — after all tables exist)
-- ---------------------------------------------------------------------------

-- profiles
DROP POLICY IF EXISTS "profiles_select_policy"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_blocked"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_blocked"  ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_insert_blocked" ON public.profiles
  FOR INSERT WITH CHECK (FALSE);
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE
  USING      (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_delete_blocked" ON public.profiles
  FOR DELETE USING (FALSE);

-- municipalities
DROP POLICY IF EXISTS "municipalities_select_policy"  ON public.municipalities;
DROP POLICY IF EXISTS "municipalities_insert_policy"  ON public.municipalities;
DROP POLICY IF EXISTS "municipalities_update_policy"  ON public.municipalities;
DROP POLICY IF EXISTS "municipalities_delete_blocked" ON public.municipalities;
CREATE POLICY "municipalities_select_policy" ON public.municipalities
  FOR SELECT USING (is_admin() OR status = 'ACTIVE');
CREATE POLICY "municipalities_insert_policy" ON public.municipalities
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "municipalities_update_policy" ON public.municipalities
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "municipalities_delete_blocked" ON public.municipalities
  FOR DELETE USING (FALSE);

-- inbound_inquiries
DROP POLICY IF EXISTS "inbound_inquiries_select_policy"  ON public.inbound_inquiries;
DROP POLICY IF EXISTS "inbound_inquiries_insert_policy"  ON public.inbound_inquiries;
DROP POLICY IF EXISTS "inbound_inquiries_update_policy"  ON public.inbound_inquiries;
DROP POLICY IF EXISTS "inbound_inquiries_delete_blocked" ON public.inbound_inquiries;
CREATE POLICY "inbound_inquiries_select_policy"  ON public.inbound_inquiries FOR SELECT USING (is_admin());
CREATE POLICY "inbound_inquiries_insert_policy"  ON public.inbound_inquiries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "inbound_inquiries_update_policy"  ON public.inbound_inquiries FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "inbound_inquiries_delete_blocked" ON public.inbound_inquiries FOR DELETE USING (FALSE);

-- professionals
DROP POLICY IF EXISTS "professionals_select_policy"  ON public.professionals;
DROP POLICY IF EXISTS "professionals_insert_policy"  ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_policy"  ON public.professionals;
DROP POLICY IF EXISTS "professionals_delete_blocked" ON public.professionals;
CREATE POLICY "professionals_select_policy" ON public.professionals
  FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "professionals_insert_policy" ON public.professionals
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "professionals_update_policy" ON public.professionals
  FOR UPDATE USING (is_admin() OR auth.uid() = id) WITH CHECK (is_admin() OR auth.uid() = id);
CREATE POLICY "professionals_delete_blocked" ON public.professionals
  FOR DELETE USING (FALSE);

-- professional_documents
DROP POLICY IF EXISTS "professional_documents_select_policy"  ON public.professional_documents;
DROP POLICY IF EXISTS "professional_documents_insert_policy"  ON public.professional_documents;
DROP POLICY IF EXISTS "professional_documents_update_policy"  ON public.professional_documents;
DROP POLICY IF EXISTS "professional_documents_delete_blocked" ON public.professional_documents;
CREATE POLICY "professional_documents_select_policy" ON public.professional_documents
  FOR SELECT USING (professional_id = auth.uid() OR is_admin());
CREATE POLICY "professional_documents_insert_policy" ON public.professional_documents
  FOR INSERT WITH CHECK (professional_id = auth.uid() OR is_admin());
CREATE POLICY "professional_documents_update_policy" ON public.professional_documents
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "professional_documents_delete_blocked" ON public.professional_documents
  FOR DELETE USING (FALSE);

-- cases (references case_assignments — safe because case_assignments exists now)
DROP POLICY IF EXISTS "cases_select_policy"  ON public.cases;
DROP POLICY IF EXISTS "cases_insert_policy"  ON public.cases;
DROP POLICY IF EXISTS "cases_update_policy"  ON public.cases;
DROP POLICY IF EXISTS "cases_delete_blocked" ON public.cases;
CREATE POLICY "cases_select_policy" ON public.cases
  FOR SELECT USING (
    is_admin()
    OR EXISTS(
      SELECT 1 FROM public.case_assignments
      WHERE case_id = cases.id AND professional_id = auth.uid() AND ended_at IS NULL
    )
  );
CREATE POLICY "cases_insert_policy"  ON public.cases FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "cases_update_policy"  ON public.cases FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "cases_delete_blocked" ON public.cases FOR DELETE USING (FALSE);

-- case_complexity_factors (references case_assignments — safe now)
DROP POLICY IF EXISTS "case_complexity_select_policy"  ON public.case_complexity_factors;
DROP POLICY IF EXISTS "case_complexity_insert_policy"  ON public.case_complexity_factors;
DROP POLICY IF EXISTS "case_complexity_update_policy"  ON public.case_complexity_factors;
DROP POLICY IF EXISTS "case_complexity_delete_blocked" ON public.case_complexity_factors;
CREATE POLICY "case_complexity_select_policy" ON public.case_complexity_factors
  FOR SELECT USING (
    is_admin()
    OR EXISTS(
      SELECT 1 FROM public.case_assignments
      WHERE case_id = case_complexity_factors.case_id
        AND professional_id = auth.uid()
        AND ended_at IS NULL
    )
  );
CREATE POLICY "case_complexity_insert_policy"  ON public.case_complexity_factors FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "case_complexity_update_policy"  ON public.case_complexity_factors FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "case_complexity_delete_blocked" ON public.case_complexity_factors FOR DELETE USING (FALSE);

-- case_assignments
DROP POLICY IF EXISTS "case_assignments_select_policy"   ON public.case_assignments;
DROP POLICY IF EXISTS "case_assignments_insert_policy"   ON public.case_assignments;
DROP POLICY IF EXISTS "case_assignments_update_blocked"  ON public.case_assignments;
DROP POLICY IF EXISTS "case_assignments_delete_blocked"  ON public.case_assignments;
CREATE POLICY "case_assignments_select_policy" ON public.case_assignments
  FOR SELECT USING (is_admin() OR professional_id = auth.uid());
CREATE POLICY "case_assignments_insert_policy"  ON public.case_assignments FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "case_assignments_update_blocked" ON public.case_assignments FOR UPDATE USING (FALSE);
CREATE POLICY "case_assignments_delete_blocked" ON public.case_assignments FOR DELETE USING (FALSE);

-- case_grants
DROP POLICY IF EXISTS "case_grants_select_policy"  ON public.case_grants;
DROP POLICY IF EXISTS "case_grants_insert_policy"  ON public.case_grants;
DROP POLICY IF EXISTS "case_grants_update_policy"  ON public.case_grants;
DROP POLICY IF EXISTS "case_grants_delete_blocked" ON public.case_grants;
CREATE POLICY "case_grants_select_policy" ON public.case_grants
  FOR SELECT USING (
    is_admin()
    OR EXISTS(
      SELECT 1 FROM public.case_assignments
      WHERE case_id = case_grants.case_id AND professional_id = auth.uid() AND ended_at IS NULL
    )
  );
CREATE POLICY "case_grants_insert_policy"  ON public.case_grants FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "case_grants_update_policy"  ON public.case_grants FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "case_grants_delete_blocked" ON public.case_grants FOR DELETE USING (FALSE);

-- case_handovers
DROP POLICY IF EXISTS "case_handovers_select_policy"  ON public.case_handovers;
DROP POLICY IF EXISTS "case_handovers_insert_policy"  ON public.case_handovers;
DROP POLICY IF EXISTS "case_handovers_update_policy"  ON public.case_handovers;
DROP POLICY IF EXISTS "case_handovers_delete_blocked" ON public.case_handovers;
CREATE POLICY "case_handovers_select_policy"  ON public.case_handovers FOR SELECT USING (is_admin());
CREATE POLICY "case_handovers_insert_policy"  ON public.case_handovers FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "case_handovers_update_policy"  ON public.case_handovers FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "case_handovers_delete_blocked" ON public.case_handovers FOR DELETE USING (FALSE);

-- session_logs
DROP POLICY IF EXISTS "session_logs_select_policy"  ON public.session_logs;
DROP POLICY IF EXISTS "session_logs_insert_policy"  ON public.session_logs;
DROP POLICY IF EXISTS "session_logs_update_policy"  ON public.session_logs;
DROP POLICY IF EXISTS "session_logs_delete_blocked" ON public.session_logs;
CREATE POLICY "session_logs_select_policy" ON public.session_logs
  FOR SELECT USING (professional_id = auth.uid() OR is_admin());
CREATE POLICY "session_logs_insert_policy" ON public.session_logs
  FOR INSERT WITH CHECK (professional_id = auth.uid() OR is_admin());
CREATE POLICY "session_logs_update_policy" ON public.session_logs
  FOR UPDATE
  USING      (professional_id = auth.uid() OR is_admin())
  WITH CHECK ((professional_id = auth.uid() AND status = 'DRAFT') OR is_admin());
CREATE POLICY "session_logs_delete_blocked" ON public.session_logs FOR DELETE USING (FALSE);

-- session_log_corrections
DROP POLICY IF EXISTS "session_log_corrections_select_policy"  ON public.session_log_corrections;
DROP POLICY IF EXISTS "session_log_corrections_insert_policy"  ON public.session_log_corrections;
DROP POLICY IF EXISTS "session_log_corrections_update_blocked" ON public.session_log_corrections;
DROP POLICY IF EXISTS "session_log_corrections_delete_blocked" ON public.session_log_corrections;
CREATE POLICY "session_log_corrections_select_policy" ON public.session_log_corrections
  FOR SELECT USING (
    is_admin()
    OR EXISTS(SELECT 1 FROM public.session_logs sl WHERE sl.id = session_log_id AND sl.professional_id = auth.uid())
  );
CREATE POLICY "session_log_corrections_insert_policy" ON public.session_log_corrections
  FOR INSERT WITH CHECK (
    is_admin()
    OR EXISTS(SELECT 1 FROM public.session_logs sl WHERE sl.id = session_log_id AND sl.professional_id = auth.uid())
  );
CREATE POLICY "session_log_corrections_update_blocked" ON public.session_log_corrections FOR UPDATE USING (FALSE);
CREATE POLICY "session_log_corrections_delete_blocked" ON public.session_log_corrections FOR DELETE USING (FALSE);

-- session_log_transfers
DROP POLICY IF EXISTS "session_log_transfers_select_policy"  ON public.session_log_transfers;
DROP POLICY IF EXISTS "session_log_transfers_insert_policy"  ON public.session_log_transfers;
DROP POLICY IF EXISTS "session_log_transfers_update_blocked" ON public.session_log_transfers;
DROP POLICY IF EXISTS "session_log_transfers_delete_blocked" ON public.session_log_transfers;
CREATE POLICY "session_log_transfers_select_policy" ON public.session_log_transfers
  FOR SELECT USING (to_professional_id = auth.uid() OR is_admin());
CREATE POLICY "session_log_transfers_insert_policy"  ON public.session_log_transfers FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "session_log_transfers_update_blocked" ON public.session_log_transfers FOR UPDATE USING (FALSE);
CREATE POLICY "session_log_transfers_delete_blocked" ON public.session_log_transfers FOR DELETE USING (FALSE);

-- registered_hours
DROP POLICY IF EXISTS "registered_hours_select_policy"  ON public.registered_hours;
DROP POLICY IF EXISTS "registered_hours_insert_policy"  ON public.registered_hours;
DROP POLICY IF EXISTS "registered_hours_update_policy"  ON public.registered_hours;
DROP POLICY IF EXISTS "registered_hours_delete_blocked" ON public.registered_hours;
CREATE POLICY "registered_hours_select_policy" ON public.registered_hours
  FOR SELECT USING (professional_id = auth.uid() OR is_admin());
CREATE POLICY "registered_hours_insert_policy" ON public.registered_hours
  FOR INSERT WITH CHECK (professional_id = auth.uid() OR is_admin());
CREATE POLICY "registered_hours_update_policy" ON public.registered_hours
  FOR UPDATE
  USING      (professional_id = auth.uid() OR is_admin())
  WITH CHECK ((professional_id = auth.uid() AND status IN ('PENDING', 'SUBMITTED')) OR is_admin());
CREATE POLICY "registered_hours_delete_blocked" ON public.registered_hours FOR DELETE USING (FALSE);

-- contact_logs
DROP POLICY IF EXISTS "contact_logs_select_policy"  ON public.contact_logs;
DROP POLICY IF EXISTS "contact_logs_insert_policy"  ON public.contact_logs;
DROP POLICY IF EXISTS "contact_logs_update_blocked" ON public.contact_logs;
DROP POLICY IF EXISTS "contact_logs_delete_blocked" ON public.contact_logs;
CREATE POLICY "contact_logs_select_policy" ON public.contact_logs
  FOR SELECT USING (professional_id = auth.uid() OR is_admin());
CREATE POLICY "contact_logs_insert_policy" ON public.contact_logs
  FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);
CREATE POLICY "contact_logs_update_blocked" ON public.contact_logs FOR UPDATE USING (FALSE);
CREATE POLICY "contact_logs_delete_blocked" ON public.contact_logs FOR DELETE USING (FALSE);

-- contact_disclosures
DROP POLICY IF EXISTS "contact_disclosures_select_policy"  ON public.contact_disclosures;
DROP POLICY IF EXISTS "contact_disclosures_insert_policy"  ON public.contact_disclosures;
DROP POLICY IF EXISTS "contact_disclosures_update_blocked" ON public.contact_disclosures;
DROP POLICY IF EXISTS "contact_disclosures_delete_blocked" ON public.contact_disclosures;
CREATE POLICY "contact_disclosures_select_policy"  ON public.contact_disclosures FOR SELECT USING (is_admin());
CREATE POLICY "contact_disclosures_insert_policy"  ON public.contact_disclosures FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "contact_disclosures_update_blocked" ON public.contact_disclosures FOR UPDATE USING (FALSE);
CREATE POLICY "contact_disclosures_delete_blocked" ON public.contact_disclosures FOR DELETE USING (FALSE);

-- match_runs
DROP POLICY IF EXISTS "match_runs_select_policy"  ON public.match_runs;
DROP POLICY IF EXISTS "match_runs_insert_policy"  ON public.match_runs;
DROP POLICY IF EXISTS "match_runs_update_policy"  ON public.match_runs;
DROP POLICY IF EXISTS "match_runs_delete_blocked" ON public.match_runs;
CREATE POLICY "match_runs_select_policy"  ON public.match_runs FOR SELECT USING (is_admin());
CREATE POLICY "match_runs_insert_policy"  ON public.match_runs FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "match_runs_update_policy"  ON public.match_runs FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "match_runs_delete_blocked" ON public.match_runs FOR DELETE USING (FALSE);

-- match_candidates
DROP POLICY IF EXISTS "match_candidates_select_policy"  ON public.match_candidates;
DROP POLICY IF EXISTS "match_candidates_insert_policy"  ON public.match_candidates;
DROP POLICY IF EXISTS "match_candidates_update_blocked" ON public.match_candidates;
DROP POLICY IF EXISTS "match_candidates_delete_blocked" ON public.match_candidates;
CREATE POLICY "match_candidates_select_policy"  ON public.match_candidates FOR SELECT USING (is_admin());
CREATE POLICY "match_candidates_insert_policy"  ON public.match_candidates FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "match_candidates_update_blocked" ON public.match_candidates FOR UPDATE USING (FALSE);
CREATE POLICY "match_candidates_delete_blocked" ON public.match_candidates FOR DELETE USING (FALSE);

-- audit_events
DROP POLICY IF EXISTS "audit_events_select_policy" ON public.audit_events;
DROP POLICY IF EXISTS "audit_events_insert_policy" ON public.audit_events;
DROP POLICY IF EXISTS "audit_events_immutable"     ON public.audit_events;
DROP POLICY IF EXISTS "audit_events_delete_blocked" ON public.audit_events;
CREATE POLICY "audit_events_select_policy" ON public.audit_events
  FOR SELECT USING (is_admin() OR actor_id = auth.uid());
CREATE POLICY "audit_events_insert_policy"  ON public.audit_events FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);
CREATE POLICY "audit_events_immutable"      ON public.audit_events FOR UPDATE USING (FALSE);
CREATE POLICY "audit_events_delete_blocked" ON public.audit_events FOR DELETE USING (FALSE);

-- notification_log
DROP POLICY IF EXISTS "notification_log_select_policy"  ON public.notification_log;
DROP POLICY IF EXISTS "notification_log_insert_policy"  ON public.notification_log;
DROP POLICY IF EXISTS "notification_log_update_policy"  ON public.notification_log;
DROP POLICY IF EXISTS "notification_log_delete_blocked" ON public.notification_log;
CREATE POLICY "notification_log_select_policy"  ON public.notification_log FOR SELECT USING (is_admin());
CREATE POLICY "notification_log_insert_policy"  ON public.notification_log FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);
CREATE POLICY "notification_log_update_policy"  ON public.notification_log FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "notification_log_delete_blocked" ON public.notification_log FOR DELETE USING (FALSE);

-- deletion_schedules
DROP POLICY IF EXISTS "deletion_schedules_select_policy"  ON public.deletion_schedules;
DROP POLICY IF EXISTS "deletion_schedules_insert_policy"  ON public.deletion_schedules;
DROP POLICY IF EXISTS "deletion_schedules_update_policy"  ON public.deletion_schedules;
DROP POLICY IF EXISTS "deletion_schedules_delete_blocked" ON public.deletion_schedules;
CREATE POLICY "deletion_schedules_select_policy"  ON public.deletion_schedules FOR SELECT USING (is_admin());
CREATE POLICY "deletion_schedules_insert_policy"  ON public.deletion_schedules FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);
CREATE POLICY "deletion_schedules_update_policy"  ON public.deletion_schedules FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "deletion_schedules_delete_blocked" ON public.deletion_schedules FOR DELETE USING (FALSE);

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_cases_with_professional AS
SELECT
  c.id,
  c.municipality_id,
  c.status,
  c.citizen_initials,
  c.citizen_age_range,
  c.complexity_level,
  c.weekly_hours,
  ca.professional_id,
  ca.id              AS assignment_id,
  ca.started_at      AS assignment_started_at,
  cg.granted_hours   AS active_grant_hours,
  rh.approved_hours_used
FROM public.cases c
LEFT JOIN public.case_assignments ca ON c.id = ca.case_id AND ca.ended_at IS NULL
LEFT JOIN LATERAL (
  SELECT granted_hours
  FROM public.case_grants
  WHERE case_id = c.id AND status = 'ACTIVE'
  LIMIT 1
) cg ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(hours), 0) AS approved_hours_used
  FROM public.registered_hours
  WHERE case_id = c.id AND status = 'APPROVED'
) rh ON true;

CREATE OR REPLACE VIEW public.v_professionals_available AS
SELECT
  p.id,
  p.profession,
  p.experience_years,
  p.max_complexity_level,
  p.target_age_groups,
  p.qualifications,
  p.capacity_hours_week,
  p.max_concurrent_cases,
  p.availability_status,
  p.availability_days,
  COUNT(ca.id)                        AS current_assignments,
  COALESCE(SUM(c.weekly_hours), 0)    AS current_hours_assigned
FROM public.professionals p
LEFT JOIN public.case_assignments ca ON p.id = ca.professional_id AND ca.ended_at IS NULL
LEFT JOIN public.cases c ON ca.case_id = c.id AND c.status = 'ACTIVE'
WHERE p.status = 'ACTIVE'
  AND p.availability_status != 'UNAVAILABLE'
GROUP BY p.id
HAVING
  COUNT(ca.id) < p.max_concurrent_cases
  AND COALESCE(SUM(c.weekly_hours), 0) < p.capacity_hours_week;

CREATE OR REPLACE VIEW public.v_grant_usage AS
SELECT
  cg.id,
  cg.case_id,
  cg.granted_hours,
  COALESCE(SUM(rh.hours), 0)                              AS approved_hours,
  (cg.granted_hours - COALESCE(SUM(rh.hours), 0))        AS remaining_hours,
  (cg.granted_hours - COALESCE(SUM(rh.hours), 0)) < 0    AS over_grant
FROM public.case_grants cg
LEFT JOIN public.registered_hours rh
  ON cg.id = rh.grant_period_id AND rh.status = 'APPROVED'
GROUP BY cg.id;

-- ---------------------------------------------------------------------------
-- SEED: municipalities
-- ---------------------------------------------------------------------------
INSERT INTO public.municipalities (id, name, status, sagsbehandler_name, sagsbehandler_email, sagsbehandler_phone)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Aarhus Kommune',  'ACTIVE',   'Lars Nielsen',   'lars.nielsen@aarhus.dk',    '+4512345678'),
  ('11111111-0000-0000-0000-000000000002', 'Odense Kommune',  'ACTIVE',   'Mette Jensen',   'mette.jensen@odense.dk',    '+4598765432'),
  ('11111111-0000-0000-0000-000000000003', 'Aalborg Kommune', 'ACTIVE',   'Søren Pedersen', 'soren.pedersen@aalborg.dk', '+4587654321'),
  ('11111111-0000-0000-0000-000000000004', 'Esbjerg Kommune', 'ACTIVE',   NULL,             NULL,                        NULL),
  ('11111111-0000-0000-0000-000000000005', 'Randers Kommune', 'INACTIVE', NULL,             NULL,                        NULL)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- ADMIN PROFILE: hassanbukkhaari@gmail.com
-- The auth.users row must already exist (created via Supabase Auth Dashboard).
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT
  u.id,
  'hassanbukkhaari@gmail.com',
  'Hassan Bukkhaari',
  'admin',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'hassanbukkhaari@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role       = 'admin',
      full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = NOW();

COMMIT;
