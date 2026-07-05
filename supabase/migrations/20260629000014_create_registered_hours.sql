-- Migration: registered_hours (time tracking)
-- Dependency: cases, professionals, session_logs, case_grants, profiles

CREATE TABLE IF NOT EXISTS registered_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  work_date DATE NOT NULL,
  work_type TEXT NOT NULL,
    CONSTRAINT valid_type CHECK (work_type IN (
      'DIRECT_SESSION', 'TRANSPORT', 'DOCUMENTATION', 'COORDINATION', 'CRISIS_RESPONSE', 'TRAINING', 'OTHER'
    )),
  hours DECIMAL(4, 2) NOT NULL,
    CONSTRAINT valid_hours CHECK (hours >= 0.25 AND hours <= 8),
  session_log_id UUID REFERENCES session_logs(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'OUTSIDE_GRANT')),
  submitted_at TIMESTAMPTZ,
  grant_period_id UUID REFERENCES case_grants(id),
  description TEXT,
  outside_grant_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_by UUID NOT NULL REFERENCES professionals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_registered_hours_case_id ON registered_hours(case_id);
CREATE INDEX IF NOT EXISTS idx_registered_hours_archived_at ON registered_hours(archived_at);
CREATE INDEX IF NOT EXISTS idx_registered_hours_professional_id ON registered_hours(professional_id);
CREATE INDEX IF NOT EXISTS idx_registered_hours_work_date ON registered_hours(work_date);
CREATE INDEX IF NOT EXISTS idx_registered_hours_status ON registered_hours(status);
CREATE INDEX IF NOT EXISTS idx_registered_hours_session_log_id ON registered_hours(session_log_id);
CREATE INDEX IF NOT EXISTS idx_registered_hours_grant_period ON registered_hours(grant_period_id);

ALTER TABLE registered_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registered_hours_select_policy" ON registered_hours
  FOR SELECT
  USING (
    professional_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "registered_hours_insert_policy" ON registered_hours
  FOR INSERT
  WITH CHECK (
    professional_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "registered_hours_update_policy" ON registered_hours
  FOR UPDATE
  USING (
    professional_id = auth.uid() OR auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    (professional_id = auth.uid() AND status IN ('PENDING', 'SUBMITTED'))
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "registered_hours_delete_blocked" ON registered_hours
  FOR DELETE
  USING (FALSE);
