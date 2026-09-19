-- =============================================================================
-- ADDITIVE ONLY: closes a race condition in case_number generation.
--
-- generate_case_number() (migration 20260707000000) computed the next
-- sequence number as MAX(...) + 1 with no locking. Two case-creation
-- requests landing in the same second could both read the same MAX before
-- either commits, then both try to insert the same case_number — the
-- second insert fails outright on the UNIQUE constraint with a raw
-- database error instead of a clean retry or friendly message.
--
-- Fix: take a transaction-scoped advisory lock keyed on the day's date part
-- before computing the sequence, so concurrent inserts for the same day
-- serialize instead of racing. pg_advisory_xact_lock auto-releases at
-- commit/rollback, needs no new table, and inserts for different days never
-- block each other. Function body is otherwise unchanged.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  date_part TEXT;
  next_seq  INTEGER;
BEGIN
  -- Only generate when case_number is not already set
  IF NEW.case_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  date_part := TO_CHAR(NOW() AT TIME ZONE 'Europe/Copenhagen', 'YYMMDD');

  -- Serializes concurrent inserts for the same day — without this, two
  -- simultaneous case creations could compute the same next_seq and one
  -- would fail on the unique constraint.
  PERFORM pg_advisory_xact_lock(hashtext('case_number:' || date_part));

  SELECT COALESCE(
    MAX(
      CAST(SPLIT_PART(case_number, '-', 3) AS INTEGER)
    ), 0
  ) + 1
  INTO next_seq
  FROM public.cases
  WHERE case_number LIKE 'KS-' || date_part || '-%';

  NEW.case_number := 'KS-' || date_part || '-' || LPAD(next_seq::TEXT, 3, '0');

  RETURN NEW;
END;
$$;

COMMIT;
