-- =============================================================================
-- Fix: notification_type CHECK constraint was never updated for several types
-- that application code has been sending since they were introduced
-- (FOLLOW_UP_NEEDED, STATUS_REPORT_REQUESTED, STATUS_REPORT_REMINDER,
-- STATUS_REPORT_SUBMITTED) — every such notification_log insert has been
-- silently rejected, so those emails were never sent.
-- Also adds GRANT_ACTIVATED for the new grant-activation notification.
-- Safe: additive only, drop+recreate of a CHECK constraint, no data touched.
-- =============================================================================

BEGIN;

ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notification_log ADD CONSTRAINT valid_notification_type CHECK (notification_type IN (
  'INQUIRY_RECEIVED', 'PROFESSIONAL_APPLICATION_RECEIVED', 'CASE_CREATED',
  'SAFEGUARDING_FLAGGED', 'HOURS_SUBMITTED', 'DOCUMENT_ACTION_REQUIRED',
  'CASE_CLOSED', 'HANDOVER_INITIATED', 'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED',
  'PROPOSAL_DECLINED', 'FOLLOW_UP_NEEDED', 'STATUS_REPORT_REQUESTED',
  'STATUS_REPORT_REMINDER', 'STATUS_REPORT_SUBMITTED', 'GRANT_ACTIVATED'
));

COMMIT;
