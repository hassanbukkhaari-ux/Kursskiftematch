-- Migration: municipalities reference data
-- Dependency: none

CREATE TABLE IF NOT EXISTS municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
  sagsbehandler_name TEXT,
  sagsbehandler_email TEXT,
  sagsbehandler_phone TEXT,
  secondary_contact_name TEXT,
  secondary_contact_email TEXT,
  secondary_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_municipalities_status ON municipalities(status);
CREATE INDEX IF NOT EXISTS idx_municipalities_name ON municipalities(name);

ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "municipalities_select_policy" ON municipalities
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin' OR status = 'ACTIVE');

CREATE POLICY "municipalities_insert_policy" ON municipalities
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "municipalities_update_policy" ON municipalities
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "municipalities_delete_blocked" ON municipalities
  FOR DELETE
  USING (FALSE);
