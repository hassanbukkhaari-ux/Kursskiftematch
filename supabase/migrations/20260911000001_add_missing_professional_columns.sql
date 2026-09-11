-- Add columns referenced in the profile API that were missing from the initial migration
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS education         text,
  ADD COLUMN IF NOT EXISTS experience_years  int,
  ADD COLUMN IF NOT EXISTS gender            text,
  ADD COLUMN IF NOT EXISTS daily_occupation  text;
