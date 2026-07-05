-- Migration: notification_log (outbound notification tracking)
-- Dependency: profiles

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
    CONSTRAINT valid_notification_type CHECK (notification_type IN (
      'INQUIRY_RECEIVED',
      'PROFESSIONAL_APPLICATION_RECEIVED',
      'CASE_CREATED',
      'SAFEGUARDING_FLAGGED',
      'HOURS_SUBMITTED',
      'DOCUMENT_ACTION_REQUIRED',
      'CASE_CLOSED'
    )),
  related_entity_type TEXT NOT NULL,
  related_entity_id UUID NOT NULL,
  recipient_profile_id UUID REFERENCES profiles(id),
  recipient_email TEXT,
  delivery_channel TEXT NOT NULL DEFAULT 'EMAIL',
    CONSTRAINT valid_delivery_channel CHECK (delivery_channel IN (
      'EMAIL', 'IN_APP', 'SMS', 'PUSH', 'TEAMS', 'SLACK'
    )),
  status TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT valid_attempt_count CHECK (attempt_count >= 0 AND attempt_count <= 3),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  CONSTRAINT recipient_required CHECK (
    recipient_profile_id IS NOT NULL OR recipient_email IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_notification_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_related_entity ON notification_log(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_recipient_profile_id ON notification_log(recipient_profile_id)
  WHERE recipient_profile_id IS NOT NULL;

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_log_select_policy" ON notification_log
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "notification_log_insert_policy" ON notification_log
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');

CREATE POLICY "notification_log_update_policy" ON notification_log
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system')
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');

CREATE POLICY "notification_log_delete_blocked" ON notification_log
  FOR DELETE
  USING (FALSE);
