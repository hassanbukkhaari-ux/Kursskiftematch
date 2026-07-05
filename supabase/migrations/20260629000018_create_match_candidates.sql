-- Migration: match_candidates (scored candidates per match run)
-- Dependency: match_runs, professionals

CREATE TABLE IF NOT EXISTS match_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_run_id UUID NOT NULL REFERENCES match_runs(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  rank INTEGER NOT NULL,
  overall_score DECIMAL(5, 2) NOT NULL,
    CONSTRAINT valid_score CHECK (overall_score >= 0 AND overall_score <= 100),
  qualifications_score DECIMAL(5, 2) NOT NULL,
  availability_score DECIMAL(5, 2) NOT NULL,
  capacity_score DECIMAL(5, 2) NOT NULL,
  complexity_fit_score DECIMAL(5, 2) NOT NULL,
  algorithm_version TEXT NOT NULL DEFAULT '1.0',
  scoring_explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_candidates_match_run_id ON match_candidates(match_run_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_professional_id ON match_candidates(professional_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_rank ON match_candidates(match_run_id, rank);

CREATE UNIQUE INDEX IF NOT EXISTS idx_match_candidates_unique_rank
  ON match_candidates(match_run_id, rank);

ALTER TABLE match_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_candidates_select_policy" ON match_candidates
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "match_candidates_insert_policy" ON match_candidates
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');

CREATE POLICY "match_candidates_update_blocked" ON match_candidates
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "match_candidates_delete_blocked" ON match_candidates
  FOR DELETE
  USING (FALSE);
