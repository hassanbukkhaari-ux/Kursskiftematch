-- Migration: contact_logs (professional-sagsbehandler communication)
-- Dependency: cases, professionals, profiles

CREATE TABLE IF NOT EXISTS contact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  contact_type TEXT NOT NULL,
    CONSTRAINT valid_type CHECK (contact_type IN ('PHONE_CALL', 'EMAIL', 'IN_PERSON', 'OTHER')),
  logged_at TIMESTAMPTZ NOT NULL,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  note TEXT,
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_logs_case_id ON contact_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_professional_id ON contact_logs(professional_id);
CREATE INDEX IF NOT EXISTS idx_contact_logs_logged_at ON contact_logs(logged_at);

ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_logs_select_policy" ON contact_logs
  FOR SELECT
  USING (
    professional_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "contact_logs_insert_policy" ON contact_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' IN ('admin', 'professional'));

CREATE POLICY "contact_logs_update_blocked" ON contact_logs
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "contact_logs_delete_blocked" ON contact_logs
  FOR DELETE
  USING (FALSE);
