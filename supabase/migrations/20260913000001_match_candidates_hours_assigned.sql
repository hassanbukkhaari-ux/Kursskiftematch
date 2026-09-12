-- =============================================================================
-- Adds current_hours_assigned to match_candidates. The matching UI showed a
-- professional's raw weekly capacity (e.g. 37t) with no way to see it had
-- already been reduced by hours committed to other active cases (e.g. 10t
-- assigned -> 27t actually free) — the exact number run-match.ts computes
-- per candidate already, just never persisted for display.
-- Safe: additive only, no data touched.
-- =============================================================================

ALTER TABLE public.match_candidates
  ADD COLUMN IF NOT EXISTS current_hours_assigned DECIMAL(6, 2) NOT NULL DEFAULT 0;
