-- Migration: case_assignments (temporal professional assignments)
-- Dependency: cases, professionals, profiles

CREATE TABLE IF NOT EXISTS case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  assignment_status TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT valid_status CHECK (assignment_status IN ('ACTIVE', 'TRANSITIONED', 'TERMINATED', 'ARCHIVED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  assignment_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id ON case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_professional_id ON case_assignments(professional_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_ended_at ON case_assignments(ended_at);
CREATE INDEX IF NOT EXISTS idx_case_assignments_current ON case_assignments(case_id, ended_at)
  WHERE ended_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS one_active_assignment_per_case
  ON case_assignments(case_id)
  WHERE ended_at IS NULL;

ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_assignments_select_policy" ON case_assignments
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'
    OR professional_id = auth.uid()
  );

CREATE POLICY "case_assignments_insert_policy" ON case_assignments
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "case_assignments_update_blocked" ON case_assignments
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "case_assignments_delete_blocked" ON case_assignments
  FOR DELETE
  USING (FALSE);
