-- Seed data for Kursskiftematch development/testing
-- NOTE: Auth users must be created via Supabase Auth API before this seed runs.
-- This seed only inserts reference data and test records.
-- Use seed_users.ts script to create auth.users entries first.

-- ================================================================
-- MUNICIPALITIES (reference data)
-- ================================================================
INSERT INTO municipalities (id, name, status, sagsbehandler_name, sagsbehandler_email, sagsbehandler_phone)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Aarhus Kommune', 'ACTIVE', 'Lars Nielsen', 'lars.nielsen@aarhus.dk', '+4512345678'),
  ('11111111-0000-0000-0000-000000000002', 'Odense Kommune', 'ACTIVE', 'Mette Jensen', 'mette.jensen@odense.dk', '+4598765432'),
  ('11111111-0000-0000-0000-000000000003', 'Aalborg Kommune', 'ACTIVE', 'Søren Pedersen', 'soren.pedersen@aalborg.dk', '+4587654321'),
  ('11111111-0000-0000-0000-000000000004', 'Esbjerg Kommune', 'ACTIVE', NULL, NULL, NULL),
  ('11111111-0000-0000-0000-000000000005', 'Randers Kommune', 'INACTIVE', NULL, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- NOTE: profiles and professionals are seeded via the admin UI
-- or the seed_users.ts script which creates auth users first.
-- The SQL below provides the profile/professional rows assuming
-- the auth users already exist with these UUIDs.
-- ================================================================

-- Admin profile (seed only if auth user exists with this UUID)
-- Professional profiles (seed only if auth users exist)

-- For local development, run: npx supabase db seed after creating auth users via Dashboard

-- ================================================================
-- TEST CASES (safe reference data, no PII)
-- ================================================================
-- These cases reference municipality IDs that are seeded above.
-- They can only be inserted after professionals are assigned.
-- Use the admin UI to create test cases with proper assignments.
