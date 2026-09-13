-- =============================================================================
-- Municipality token-based proposal + status-report channel
-- Builds the application layer for infrastructure laid down but never used:
-- case_proposals (response_token, DRAFT/SENT/ACCEPTED/DECLINED) has had zero
-- application code referencing it since 20260701120000_municipality_intake.sql.
-- Adds the two extra proposal outcomes this workflow needs, and a token +
-- sharing metadata on status_reports for the separate report-delivery side
-- of the same channel. Safe: additive only, drop+recreate of a CHECK
-- constraint, no data touched.
-- =============================================================================

BEGIN;

-- ── 1. case_proposals: admin can withdraw a sent proposal (to re-propose a
-- different candidate), and the municipality can ask for changes without a
-- flat decline.
ALTER TABLE public.case_proposals DROP CONSTRAINT IF EXISTS valid_proposal_status;
ALTER TABLE public.case_proposals ADD CONSTRAINT valid_proposal_status
  CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'CHANGES_REQUESTED'));

-- ── 2. status_reports: token + sharing metadata for the municipality-facing
-- delivery link, mirroring case_proposals.response_token.
ALTER TABLE public.status_reports
  ADD COLUMN IF NOT EXISTS response_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS shared_with_municipality_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES public.profiles(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_status_reports_response_token
  ON public.status_reports(response_token);

-- ── 3. notification_type: two new admin-facing notifications for this flow.
ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notification_log ADD CONSTRAINT valid_notification_type CHECK (notification_type IN (
  'INQUIRY_RECEIVED', 'PROFESSIONAL_APPLICATION_RECEIVED', 'CASE_CREATED',
  'SAFEGUARDING_FLAGGED', 'HOURS_SUBMITTED', 'DOCUMENT_ACTION_REQUIRED',
  'CASE_CLOSED', 'HANDOVER_INITIATED', 'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED',
  'PROPOSAL_DECLINED', 'FOLLOW_UP_NEEDED', 'STATUS_REPORT_REQUESTED',
  'STATUS_REPORT_REMINDER', 'STATUS_REPORT_SUBMITTED', 'GRANT_ACTIVATED',
  'PROPOSAL_CHANGES_REQUESTED', 'STATUS_REPORT_SHARED'
));

COMMIT;
