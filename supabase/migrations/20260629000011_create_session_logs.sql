-- Migration: session_logs (professional work documentation)
-- Dependency: cases, professionals, profiles

CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  session_date DATE NOT NULL,
    CONSTRAINT valid_session_date CHECK (session_date <= CURRENT_DATE),
  duration_minutes INTEGER NOT NULL,
    CONSTRAINT valid_duration CHECK (duration_minutes >= 1),
  status TEXT NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'FINAL', 'CORRECTED', 'ARCHIVED')),
  observations TEXT,
  citizen_mood_tone TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_reason TEXT,
  safeguarding_concern_flag BOOLEAN DEFAULT FALSE,
  safeguarding_detail TEXT,
  safeguarding_acknowledged_at TIMESTAMPTZ,
  safeguarding_acknowledged_by UUID REFERENCES profiles(id),
  participant_names TEXT[],
  location TEXT,
  created_by UUID NOT NULL REFERENCES professionals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_retention_expires_at TIMESTAMPTZ,
  CONSTRAINT valid_final_date CHECK (
    status != 'FINAL' OR created_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_session_logs_case_id ON session_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_professional_id ON session_logs(professional_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_date ON session_logs(session_date);
CREATE INDEX IF NOT EXISTS idx_session_logs_status ON session_logs(status);
CREATE INDEX IF NOT EXISTS idx_session_logs_data_retention ON session_logs(data_retention_expires_at);

ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_logs_select_policy" ON session_logs
  FOR SELECT
  USING (
    professional_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "session_logs_insert_policy" ON session_logs
  FOR INSERT
  WITH CHECK (
    professional_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "session_logs_update_policy" ON session_logs
  FOR UPDATE
  USING (
    professional_id = auth.uid() OR auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    (professional_id = auth.uid() AND status = 'DRAFT')
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "session_logs_delete_blocked" ON session_logs
  FOR DELETE
  USING (FALSE);
