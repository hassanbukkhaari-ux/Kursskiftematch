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

-- HANDOVER_INITIATED notification type (goes to incoming professional)
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'HANDOVER_INITIATED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
