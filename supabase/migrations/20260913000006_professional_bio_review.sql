-- =============================================================================
-- Professional bio review workflow
-- The "Om mig som kontaktperson" bio was written to be shown only to admin
-- ("Vises for administrator"). We now want to show an approved version of it
-- (plus case-specific match highlights) to the municipality on the public
-- proposal page — a much less trusted audience than admin, and CLAUDE.md's
-- data-separation rule ("Professional names/contact info are never shared
-- with the municipality") is non-negotiable. A professional's free-text bio
-- is exactly the kind of field someone could (accidentally or not) put their
-- name, phone number, or workplace into, so it must never reach the
-- municipality without a human admin having read and approved that specific
-- text first — the same review-before-external-exposure pattern already
-- used for documents (professional_documents.status/verified_by).
-- Safe: additive only, no data touched.
-- =============================================================================

BEGIN;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS bio_status TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS bio_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bio_reviewed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS bio_review_note TEXT;

ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS valid_bio_status;
ALTER TABLE public.professionals ADD CONSTRAINT valid_bio_status
  CHECK (bio_status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'));

-- Backfill: anyone who already wrote a real bio under the old "admin-only"
-- promise did nothing wrong and shouldn't be forced to re-submit just
-- because the workflow now exists — but it still needs an admin's eyes on
-- it before it can go out to a municipality, so PENDING_REVIEW (not
-- APPROVED) is the correct starting state, never DRAFT (which would look
-- like it was never submitted).
UPDATE public.professionals
SET bio_status = 'PENDING_REVIEW'
WHERE bio IS NOT NULL AND length(trim(bio)) >= 50 AND bio_status = 'DRAFT';

COMMIT;
