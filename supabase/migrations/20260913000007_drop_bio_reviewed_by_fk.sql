-- =============================================================================
-- Fix: bio_reviewed_by broke every profiles(...) embed rooted at professionals
--
-- 20260913000006_professional_bio_review.sql added
-- professionals.bio_reviewed_by UUID REFERENCES profiles(id) — a second
-- foreign key between professionals and profiles, alongside the original
-- identity relationship (professionals.id REFERENCES profiles(id)). Once
-- both existed, PostgREST could no longer infer which relationship a plain
-- `profiles(...)` embed meant, and started rejecting the query with
-- "Could not embed because more than one relationship was found for
-- 'professionals' and 'profiles'" — breaking every admin page that embeds
-- a professional's profile (Kontaktpersoner, Matching, Planlægning,
-- Sagsdetaljer, Statusrapporter, Timer, Sessionslogs, several cron jobs...).
--
-- bio_reviewed_by only ever needs to hold *a* valid admin id for an audit
-- trail — nothing reads it as a joined relationship — so the FK constraint
-- was never load-bearing for any feature, only for this outage. Dropped
-- here by dynamic lookup (robust to whatever Postgres actually named it)
-- rather than guessing the default-generated constraint name.
--
-- Safe: drops one constraint only. The column and its data are untouched.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'professionals'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'bio_reviewed_by'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.professionals DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

COMMIT;
