-- =============================================================================
-- Adds overlap_meeting_completed_at to case_handovers. CLAUDE.md requires a
-- named replacement professional AND an overlap meeting as a mandatory step
-- before a handover can be considered done — but nothing in the schema or
-- API ever recorded whether that meeting actually happened, and no UI ever
-- called the existing "complete" endpoint at all. This column gives the
-- mandatory step somewhere to be recorded against the CaseHandover record.
-- Safe: additive only, no data touched.
-- =============================================================================

ALTER TABLE public.case_handovers
  ADD COLUMN IF NOT EXISTS overlap_meeting_completed_at TIMESTAMPTZ;
