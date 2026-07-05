-- Migration: case_grants (municipal budget allocation)
-- Dependency: cases, municipalities, profiles

CREATE TABLE IF NOT EXISTS case_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  municipality_id UUID NOT NULL REFERENCES municipalities(id),
  granted_hours DECIMAL(8, 2) NOT NULL,
    CONSTRAINT valid_hours CHECK (granted_hours > 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
    CONSTRAINT valid_period CHECK (period_end > period_start),
  status TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'ACTIVE', 'ARCHIVED', 'REVOKED')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_case_grants_case_id ON case_grants(case_id);
CREATE INDEX IF NOT EXISTS idx_case_grants_period ON case_grants(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_case_grants_status ON case_grants(status);

ALTER TABLE case_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_grants_select_policy" ON case_grants
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'
    OR EXISTS(
      SELECT 1 FROM case_assignments
      WHERE case_id = case_grants.case_id
      AND professional_id = auth.uid()
      AND ended_at IS NULL
    )
  );

CREATE POLICY "case_grants_insert_policy" ON case_grants
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "case_grants_update_policy" ON case_grants
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "case_grants_delete_blocked" ON case_grants
  FOR DELETE
  USING (FALSE);
