-- Migration: case_complexity_factors
-- Dependency: cases

CREATE TABLE IF NOT EXISTS case_complexity_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  mental_health BOOLEAN DEFAULT FALSE,
  family_instability BOOLEAN DEFAULT FALSE,
  school BOOLEAN DEFAULT FALSE,
  violence BOOLEAN DEFAULT FALSE,
  substance_use BOOLEAN DEFAULT FALSE,
  criminality BOOLEAN DEFAULT FALSE,
  multiple_agencies BOOLEAN DEFAULT FALSE,
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_complexity_factors_case_id ON case_complexity_factors(case_id);

ALTER TABLE case_complexity_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_complexity_select_policy" ON case_complexity_factors
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'
    OR EXISTS(
      SELECT 1 FROM case_assignments
      WHERE case_id = case_complexity_factors.case_id
      AND professional_id = auth.uid()
      AND ended_at IS NULL
    )
  );

CREATE POLICY "case_complexity_insert_policy" ON case_complexity_factors
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "case_complexity_update_policy" ON case_complexity_factors
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "case_complexity_delete_blocked" ON case_complexity_factors
  FOR DELETE
  USING (FALSE);
