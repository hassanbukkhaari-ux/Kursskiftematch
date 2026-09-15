-- =============================================================================
-- Notify admin when a professional logs vacation/pause
--
-- Adding an availability period previously had no side effect admin would
-- ever see proactively (only visible by opening that professional's profile).
-- Admin needs to know immediately so they can decide whether the citizen or
-- municipality caseworker should be informed, and whether an active case
-- should be handed over temporarily or continue with the same contact
-- person once they're back.
--
-- Safe: extends an existing CHECK constraint only, same pattern as every
-- prior notification_type addition in this project. No data changes.
-- =============================================================================

BEGIN;

ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notification_log ADD CONSTRAINT valid_notification_type CHECK (notification_type IN (
  'INQUIRY_RECEIVED', 'PROFESSIONAL_APPLICATION_RECEIVED', 'CASE_CREATED',
  'SAFEGUARDING_FLAGGED', 'HOURS_SUBMITTED', 'DOCUMENT_ACTION_REQUIRED',
  'CASE_CLOSED', 'HANDOVER_INITIATED', 'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED',
  'PROPOSAL_DECLINED', 'FOLLOW_UP_NEEDED', 'STATUS_REPORT_REQUESTED',
  'STATUS_REPORT_REMINDER', 'STATUS_REPORT_SUBMITTED', 'GRANT_ACTIVATED',
  'PROPOSAL_CHANGES_REQUESTED', 'STATUS_REPORT_SHARED',
  'HOURS_APPROVED', 'HOURS_REJECTED', 'PROFESSIONAL_ACTIVATED', 'HANDOVER_COMPLETED',
  'PROFESSIONAL_AVAILABILITY_PERIOD_ADDED'
));

COMMIT;
