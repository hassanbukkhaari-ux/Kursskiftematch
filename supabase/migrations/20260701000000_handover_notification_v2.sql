-- ================================================================
-- Handover & Notification improvements
-- ================================================================

-- is_urgent on case_handovers for escalation tracking
ALTER TABLE case_handovers
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE;

-- Store rendered email content on notification_log for admin review / debugging
ALTER TABLE notification_log
  ADD COLUMN IF NOT EXISTS subject   TEXT,
  ADD COLUMN IF NOT EXISTS body_text TEXT;

-- Update notification_type CHECK constraint to include HANDOVER_INITIATED
ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notification_log
  ADD CONSTRAINT valid_notification_type CHECK (notification_type IN (
    'INQUIRY_RECEIVED', 'PROFESSIONAL_APPLICATION_RECEIVED', 'CASE_CREATED',
    'SAFEGUARDING_FLAGGED', 'HOURS_SUBMITTED', 'DOCUMENT_ACTION_REQUIRED',
    'CASE_CLOSED', 'HANDOVER_INITIATED', 'PROPOSAL_DECLINED'
  ));
