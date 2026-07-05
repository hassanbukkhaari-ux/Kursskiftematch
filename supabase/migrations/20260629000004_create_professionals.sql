-- Migration: professionals
-- Dependency: profiles

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profession TEXT NOT NULL,
    CONSTRAINT valid_profession CHECK (profession IN (
      'TEACHER', 'PEDAGOGUE', 'NURSE', 'PSYCHOLOGIST', 'SOCIAL_WORKER', 'COUNSELOR', 'OTHER'
    )),
  experience_years INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT valid_experience CHECK (experience_years >= 0),
  target_age_groups TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_complexity_level TEXT NOT NULL DEFAULT 'MEDIUM',
    CONSTRAINT valid_complexity CHECK (max_complexity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  qualifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  capacity_hours_week DECIMAL(5, 2) NOT NULL DEFAULT 0,
    CONSTRAINT valid_capacity CHECK (capacity_hours_week >= 0),
  max_concurrent_cases INTEGER NOT NULL DEFAULT 3,
    CONSTRAINT valid_concurrent CHECK (max_concurrent_cases > 0),
  availability_days TEXT[] DEFAULT ARRAY[]::TEXT[],
  availability_status TEXT NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT valid_availability_status CHECK (availability_status IN ('AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE')),
  status TEXT NOT NULL DEFAULT 'REGISTERED',
    CONSTRAINT valid_status CHECK (status IN ('REGISTERED', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_archived_at ON professionals(archived_at);
CREATE INDEX IF NOT EXISTS idx_professionals_availability_status ON professionals(availability_status);
CREATE INDEX IF NOT EXISTS idx_professionals_profession ON professionals(profession);
CREATE INDEX IF NOT EXISTS idx_professionals_max_complexity ON professionals(max_complexity_level);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professionals_select_policy" ON professionals
  FOR SELECT
  USING (
    auth.uid() = id
    OR auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "professionals_insert_policy" ON professionals
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "professionals_update_policy" ON professionals
  FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'admin'
    OR auth.uid() = id
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
    OR auth.uid() = id
  );

CREATE POLICY "professionals_delete_blocked" ON professionals
  FOR DELETE
  USING (FALSE);
