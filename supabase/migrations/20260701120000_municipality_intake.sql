-- =============================================================================
-- MUNICIPALITY INTAKE PORTAL + PROPOSAL WORKFLOW
-- Adds: PROPOSED case status, intake tracking, case_proposals table
-- Safe: additive only, all IF NOT EXISTS / IF EXISTS guards
-- =============================================================================

BEGIN;

-- ── 1. Allow NULL triggered_by on match_runs (system-triggered intake runs) ──
ALTER TABLE public.match_runs ALTER COLUMN triggered_by DROP NOT NULL;

-- ── 2. Add PROPOSED to case status constraint ────────────────────────────────────
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE public.cases ADD CONSTRAINT valid_status
  CHECK (status IN ('OPEN', 'MATCHED', 'PROPOSED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'));

-- ── 3. Intake tracking columns on cases ────────────────────────────────────
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS intake_token         UUID    DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS intake_contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS intake_contact_email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_intake_token
  ON public.cases(intake_token) WHERE intake_token IS NOT NULL;

-- ── 4. case_proposals ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.case_proposals (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                    UUID        NOT NULL REFERENCES public.cases(id),
  professional_id            UUID        NOT NULL REFERENCES public.professionals(id),
  proposal_note              TEXT,
  estimated_hours_week       DECIMAL(5,2),
  status                     TEXT        NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT valid_proposal_status CHECK (status IN ('DRAFT','SENT','ACCEPTED','DECLINED')),
  response_token             UUID        NOT NULL DEFAULT gen_random_uuid(),
  created_by                 UUID        NOT NULL REFERENCES public.profiles(id),
  sent_at                    TIMESTAMPTZ,
  responded_at               TIMESTAMPTZ,
  municipality_response_note TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_case_proposals_response_token
  ON public.case_proposals(response_token);
CREATE INDEX IF NOT EXISTS idx_case_proposals_case_id
  ON public.case_proposals(case_id);

ALTER TABLE public.case_proposals ENABLE ROW LEVEL SECURITY;

-- Admin has full access; no municipality-facing RLS needed (they use public token endpoints)
CREATE POLICY "case_proposals_admin_all" ON public.case_proposals
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── 5. New notification types ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'PROPOSAL_SENT';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'PROPOSAL_ACCEPTED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
