-- =============================================================================
-- Adds eligible + ineligibility_reason to match_candidates. Matching used to
-- silently drop anyone who failed availability/case-load/capacity checks —
-- they never got a row here at all, so admin had no way to see or manually
-- assign a candidate the algorithm excluded, and a run that excluded
-- everyone looked identical to a run with genuinely no professionals.
-- Every active professional now gets scored and stored regardless of
-- eligibility; these two columns carry why a given one can't be
-- auto-matched right now, without blocking a deliberate manual assignment.
-- Safe: additive only, no data touched. eligible defaults true so any
-- historical row (all of which were, by definition, eligible) reads correctly.
-- =============================================================================

ALTER TABLE public.match_candidates
  ADD COLUMN IF NOT EXISTS eligible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ineligibility_reason TEXT;
