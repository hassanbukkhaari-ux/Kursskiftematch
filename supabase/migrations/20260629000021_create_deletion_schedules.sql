-- Migration: deletion_schedules (GDPR retention tracking)
-- Dependency: none (polymorphic record references)

CREATE TABLE IF NOT EXISTS deletion_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  scheduled_for_deletion_at TIMESTAMPTZ NOT NULL,
  retention_expired_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
    CONSTRAINT valid_reason CHECK (reason IN (
      'RETENTION_EXPIRED', 'USER_REQUEST', 'LEGAL_REQUIREMENT'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deletion_schedules_scheduled_for_deletion_at ON deletion_schedules(scheduled_for_deletion_at);
CREATE INDEX IF NOT EXISTS idx_deletion_schedules_executed_at ON deletion_schedules(executed_at)
  WHERE executed_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_deletion_schedules_unique_pending
  ON deletion_schedules(record_type, record_id)
  WHERE executed_at IS NULL;

ALTER TABLE deletion_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deletion_schedules_select_policy" ON deletion_schedules
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "deletion_schedules_insert_policy" ON deletion_schedules
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');

CREATE POLICY "deletion_schedules_update_policy" ON deletion_schedules
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system')
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');

CREATE POLICY "deletion_schedules_delete_blocked" ON deletion_schedules
  FOR DELETE
  USING (FALSE);
