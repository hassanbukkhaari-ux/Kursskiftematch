-- =============================================================================
-- Adds logistics_score to match_candidates for the new logistics-fit scoring
-- dimension (transport, akut-readiness, gender preference, geography, gender
-- experience). Nullable: it's genuinely absent, not zero, when a case states
-- none of these requirements — same "no data = no effect" pattern as the
-- rest of the algorithm's optional signals.
-- Safe: additive only, no data touched.
-- =============================================================================

ALTER TABLE public.match_candidates
  ADD COLUMN IF NOT EXISTS logistics_score DECIMAL(5, 2);
