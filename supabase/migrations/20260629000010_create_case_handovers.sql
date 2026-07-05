-- Migration: case_handovers
-- Dependency: cases, professionals, profiles

CREATE TABLE IF NOT EXISTS case_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  outgoing_professional_id UUID NOT NULL REFERENCES professionals(id),
  incoming_professional_id UUID REFERENCES professionals(id),
  reason TEXT NOT NULL,
    CONSTRAINT valid_reason CHECK (reason IN (
      'PROFESSIONAL_UNAVAILABLE', 'WORKLOAD_EXCEEDED', 'REQUEST_PROFESSIONAL',
      'REQUEST_CASE', 'BETTER_MATCH', 'SAFEGUARDING_CONCERN', 'OTHER'
    )),
  status TEXT NOT NULL DEFAULT 'INITIATED',
    CONSTRAINT valid_status CHECK (status IN ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  handover_note TEXT,
  session_logs_transferred BOOLEAN DEFAULT FALSE,
  transferred_session_logs UUID[],
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_case_handovers_case_id ON case_handovers(case_id);
CREATE INDEX IF NOT EXISTS idx_case_handovers_status ON case_handovers(status);

ALTER TABLE case_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "case_handovers_select_policy" ON case_handovers
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "case_handovers_insert_policy" ON case_handovers
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "case_handovers_update_policy" ON case_handovers
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "case_handovers_delete_blocked" ON case_handovers
  FOR DELETE
  USING (FALSE);
