-- Migration: contact_disclosures (immutable sagsbehandler contact sharing audit)
-- Dependency: cases, professionals, profiles

CREATE TABLE IF NOT EXISTS contact_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  disclosed_to_professional_id UUID NOT NULL REFERENCES professionals(id),
  disclosed_by UUID NOT NULL REFERENCES profiles(id),
  disclosed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contact_method TEXT NOT NULL,
    CONSTRAINT valid_method CHECK (contact_method IN ('EMAIL', 'PHONE', 'MEETING')),
  sagsbehandler_name TEXT,
  sagsbehandler_email TEXT,
  sagsbehandler_phone TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_disclosures_case_id ON contact_disclosures(case_id);
CREATE INDEX IF NOT EXISTS idx_contact_disclosures_disclosed_to_professional_id ON contact_disclosures(disclosed_to_professional_id);

ALTER TABLE contact_disclosures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_disclosures_select_policy" ON contact_disclosures
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "contact_disclosures_insert_policy" ON contact_disclosures
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "contact_disclosures_update_blocked" ON contact_disclosures
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "contact_disclosures_delete_blocked" ON contact_disclosures
  FOR DELETE
  USING (FALSE);
