-- Migration: session_log_transfers (immutable session sharing audit)
-- Dependency: session_logs, professionals, profiles

CREATE TABLE IF NOT EXISTS session_log_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id UUID NOT NULL REFERENCES session_logs(id),
  from_professional_id UUID NOT NULL REFERENCES professionals(id),
  to_professional_id UUID NOT NULL REFERENCES professionals(id),
  approved_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  transfer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visibility_granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_log_transfers_session_log_id ON session_log_transfers(session_log_id);
CREATE INDEX IF NOT EXISTS idx_session_log_transfers_to_professional_id ON session_log_transfers(to_professional_id);

ALTER TABLE session_log_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_log_transfers_select_policy" ON session_log_transfers
  FOR SELECT
  USING (
    to_professional_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "session_log_transfers_insert_policy" ON session_log_transfers
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "session_log_transfers_update_blocked" ON session_log_transfers
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "session_log_transfers_delete_blocked" ON session_log_transfers
  FOR DELETE
  USING (FALSE);
