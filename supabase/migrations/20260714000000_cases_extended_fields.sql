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

COMMENT ON COLUMN cases.citizen_name IS 'Full name — only visible in authenticated admin/professional portal. Never exposed on public or token pages (GDPR).';
COMMENT ON COLUMN cases.citizen_dob IS 'Date of birth — authenticated portal only (GDPR).';
COMMENT ON COLUMN cases.legal_basis IS 'Legal basis: BARNETS_LOV_32 (children 0-17), SEL_76 (youth 18-22 efterværn), SEL_85 (adults 18+), SEL_99 (sociale mødesteder).';
