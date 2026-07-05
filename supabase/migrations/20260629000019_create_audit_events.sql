-- Migration: audit_events (immutable event log)
-- Dependency: profiles

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type ON audit_events(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_id ON audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_events_select_policy" ON audit_events
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'
    OR actor_id = auth.uid()
  );

CREATE POLICY "audit_events_insert_policy" ON audit_events
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');

CREATE POLICY "audit_events_immutable" ON audit_events
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "audit_events_delete_blocked" ON audit_events
  FOR DELETE
  USING (FALSE);
