-- Migration: inbound_inquiries (public intake form)
-- Dependency: profiles (reviewed_by FK)

CREATE TABLE IF NOT EXISTS inbound_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type TEXT NOT NULL,
    CONSTRAINT valid_submission_type CHECK (submission_type IN (
      'MUNICIPALITY_INQUIRY', 'PROFESSIONAL_APPLICATION', 'PARTNER_LEAD'
    )),
  status TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN (
      'PENDING', 'REVIEWED', 'CONVERTED', 'REJECTED', 'SPAM'
    )),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  submitter_phone TEXT,
  organization_name TEXT,
  message TEXT,
  form_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  source_url TEXT,
  ip_hash TEXT,
  captcha_verified BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_to_type TEXT,
  converted_to_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbound_inquiries_status ON inbound_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inbound_inquiries_submission_type ON inbound_inquiries(submission_type);
CREATE INDEX IF NOT EXISTS idx_inbound_inquiries_submitted_at ON inbound_inquiries(submitted_at DESC);

ALTER TABLE inbound_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbound_inquiries_select_policy" ON inbound_inquiries
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "inbound_inquiries_insert_policy" ON inbound_inquiries
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');

CREATE POLICY "inbound_inquiries_update_policy" ON inbound_inquiries
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "inbound_inquiries_delete_blocked" ON inbound_inquiries
  FOR DELETE
  USING (FALSE);
