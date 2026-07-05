-- Migration: professional_documents (credential vault)
-- Dependency: professionals, profiles

CREATE TABLE IF NOT EXISTS professional_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
    CONSTRAINT valid_type CHECK (document_type IN (
      'CV', 'CRIMINAL_RECORD', 'CHILD_PROTECTION', 'DRIVING_LICENSE', 'QUALIFICATION', 'INSURANCE', 'OTHER'
    )),
  status TEXT NOT NULL DEFAULT 'PENDING_UPLOAD',
    CONSTRAINT valid_status CHECK (status IN ('PENDING_UPLOAD', 'UNVERIFIED', 'VERIFIED', 'ARCHIVED')),
  file_path TEXT,
  file_hash TEXT,
  uploaded_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES profiles(id),
  expiry_date DATE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  verification_notes TEXT,
  re_upload_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_professional_documents_professional_id ON professional_documents(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_documents_status ON professional_documents(status);
CREATE INDEX IF NOT EXISTS idx_professional_documents_archived_at ON professional_documents(archived_at);
CREATE INDEX IF NOT EXISTS idx_professional_documents_expiry_date ON professional_documents(expiry_date);

ALTER TABLE professional_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional_documents_select_policy" ON professional_documents
  FOR SELECT
  USING (
    professional_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "professional_documents_insert_policy" ON professional_documents
  FOR INSERT
  WITH CHECK (
    professional_id = auth.uid()
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "professional_documents_update_policy" ON professional_documents
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "professional_documents_delete_blocked" ON professional_documents
  FOR DELETE
  USING (FALSE);
