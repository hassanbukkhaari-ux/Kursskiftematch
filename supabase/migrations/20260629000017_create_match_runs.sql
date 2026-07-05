-- Migration: match_runs
-- Dependency: cases, profiles, case_assignments (final_assignment_id — forward ref, nullable OK)

CREATE TABLE IF NOT EXISTS match_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  triggered_by UUID NOT NULL REFERENCES profiles(id),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'INITIATED',
    CONSTRAINT valid_status CHECK (status IN (
      'INITIATED', 'SCORED', 'ASSIGNED', 'OVERRIDDEN', 'CANCELLED'
    )),
  algorithm_version TEXT NOT NULL DEFAULT '1.0',
  final_assignment_id UUID, -- FK to case_assignments added after table creation (circular)
  assigned_at TIMESTAMPTZ,
  selected_by UUID REFERENCES profiles(id),
  selected_at TIMESTAMPTZ,
  selected_reason TEXT,
  matching_criteria JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_runs_case_id ON match_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_match_runs_status ON match_runs(status);
CREATE INDEX IF NOT EXISTS idx_match_runs_algorithm_version ON match_runs(algorithm_version);

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_runs_active_per_case
  ON match_runs(case_id)
  WHERE status IN ('INITIATED', 'SCORED');

-- Add FK to case_assignments after both tables exist
ALTER TABLE match_runs
  ADD CONSTRAINT fk_match_runs_final_assignment
  FOREIGN KEY (final_assignment_id) REFERENCES case_assignments(id);

ALTER TABLE match_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_runs_select_policy" ON match_runs
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "match_runs_insert_policy" ON match_runs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "match_runs_update_policy" ON match_runs
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "match_runs_delete_blocked" ON match_runs
  FOR DELETE
  USING (FALSE);
