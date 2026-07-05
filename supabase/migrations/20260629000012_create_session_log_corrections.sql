-- Migration: session_log_corrections (immutable correction records)
-- Dependency: session_logs, profiles

CREATE TABLE IF NOT EXISTS session_log_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id UUID NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
  correction_note TEXT NOT NULL,
  correction_reason TEXT NOT NULL,
    CONSTRAINT valid_reason CHECK (correction_reason IN (
      'TYPO', 'WRONG_TIME', 'CLARIFICATION', 'OMISSION', 'SAFEGUARDING', 'OTHER'
    )),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_log_corrections_session_log_id ON session_log_corrections(session_log_id);

ALTER TABLE session_log_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_log_corrections_select_policy" ON session_log_corrections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_logs sl
      WHERE sl.id = session_log_id
        AND sl.professional_id = auth.uid()
    )
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "session_log_corrections_insert_policy" ON session_log_corrections
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM session_logs sl
      WHERE sl.id = session_log_id
        AND sl.professional_id = auth.uid()
    )
  );

CREATE POLICY "session_log_corrections_update_blocked" ON session_log_corrections
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "session_log_corrections_delete_blocked" ON session_log_corrections
  FOR DELETE
  USING (FALSE);
