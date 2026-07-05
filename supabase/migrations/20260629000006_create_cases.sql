-- Migration: cases
-- Dependency: municipalities, profiles

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID NOT NULL REFERENCES municipalities(id),
  status TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT valid_status CHECK (status IN (
      'OPEN', 'MATCHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'
    )),
  citizen_initials CHAR(2) NOT NULL,
  citizen_age_range TEXT NOT NULL,
    CONSTRAINT valid_age CHECK (citizen_age_range IN ('0-5', '6-12', '13-18', '18+')),
  citizen_notes TEXT,
  weekly_hours DECIMAL(5, 2) NOT NULL DEFAULT 0,
    CONSTRAINT valid_hours CHECK (weekly_hours >= 0),
  complexity_level TEXT NOT NULL DEFAULT 'LOW',
    CONSTRAINT valid_complexity CHECK (complexity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  data_retention_expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cases_municipality_id ON cases(municipality_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_complexity_level ON cases(complexity_level);
CREATE INDEX IF NOT EXISTS idx_cases_archived_at ON cases(archived_at);
CREATE INDEX IF NOT EXISTS idx_cases_data_retention_expires_at ON cases(data_retention_expires_at);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cases_select_policy" ON cases
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'
    OR EXISTS(
      SELECT 1 FROM case_assignments
      WHERE case_id = cases.id
      AND professional_id = auth.uid()
      AND ended_at IS NULL
    )
  );

CREATE POLICY "cases_insert_policy" ON cases
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "cases_update_policy" ON cases
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "cases_delete_blocked" ON cases
  FOR DELETE
  USING (FALSE);
