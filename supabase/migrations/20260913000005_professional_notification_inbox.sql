-- =============================================================================
-- Professional-facing notification inbox
-- notification_log_select_policy was is_admin()-only — a professional had no
-- way to see their own notification history in the app at all, entirely
-- dependent on the email actually arriving and being read. Lets a
-- professional read their own rows; writes (including marking read) stay
-- centralized through application code, same as every other write to this
-- table. Also adds the notification types needed to stop several real
-- events (hours review outcome, activation, handover completion) from
-- going unnotified or mis-categorized.
-- Safe: additive only, drop+recreate of a CHECK constraint and one policy,
-- no data touched.
-- =============================================================================

BEGIN;

ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "notification_log_select_policy" ON public.notification_log;
CREATE POLICY "notification_log_select_policy" ON public.notification_log
  FOR SELECT USING (is_admin() OR auth.uid() = recipient_profile_id);

ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notification_log ADD CONSTRAINT valid_notification_type CHECK (notification_type IN (
  'INQUIRY_RECEIVED', 'PROFESSIONAL_APPLICATION_RECEIVED', 'CASE_CREATED',
  'SAFEGUARDING_FLAGGED', 'HOURS_SUBMITTED', 'DOCUMENT_ACTION_REQUIRED',
  'CASE_CLOSED', 'HANDOVER_INITIATED', 'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED',
  'PROPOSAL_DECLINED', 'FOLLOW_UP_NEEDED', 'STATUS_REPORT_REQUESTED',
  'STATUS_REPORT_REMINDER', 'STATUS_REPORT_SUBMITTED', 'GRANT_ACTIVATED',
  'PROPOSAL_CHANGES_REQUESTED', 'STATUS_REPORT_SHARED',
  'HOURS_APPROVED', 'HOURS_REJECTED', 'PROFESSIONAL_ACTIVATED', 'HANDOVER_COMPLETED'
));

COMMIT;
