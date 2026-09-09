-- Extended case fields for matching, GDPR-compliant citizen profiling, and legal basis
-- All columns are nullable; existing rows are unaffected.

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS intake_contact_phone      TEXT,
  ADD COLUMN IF NOT EXISTS citizen_name              TEXT,
  ADD COLUMN IF NOT EXISTS citizen_dob               DATE,
  ADD COLUMN IF NOT EXISTS legal_basis               TEXT CHECK (legal_basis IN ('BARNETS_LOV_32', 'SEL_76', 'SEL_85', 'SEL_99')),
  ADD COLUMN IF NOT EXISTS expected_duration_months  INTEGER CHECK (expected_duration_months > 0),
  ADD COLUMN IF NOT EXISTS diagnoses                 TEXT,
  ADD COLUMN IF NOT EXISTS daily_function            TEXT,
  ADD COLUMN IF NOT EXISTS citizen_interests         TEXT,
  ADD COLUMN IF NOT EXISTS preferred_prof_gender     TEXT CHECK (preferred_prof_gender IN ('MALE', 'FEMALE', 'NO_PREF')),
  ADD COLUMN IF NOT EXISTS required_languages        TEXT[],
  ADD COLUMN IF NOT EXISTS transport_needs           TEXT CHECK (transport_needs IN ('JA', 'NEJ')),
  ADD COLUMN IF NOT EXISTS geographical_area         TEXT;

