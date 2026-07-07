-- =============================================================================
-- ADDITIVE ONLY: urgency field + KS-YYMMDD-NNN case_number on cases table
-- No existing columns, rows, or constraints are dropped or altered.
-- Safe to re-run.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. urgency column
--    ⚪ NORMAL | 🟡 HURTIG | 🔴 AKUT
-- ---------------------------------------------------------------------------
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT 'NORMAL';

ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS valid_urgency;
ALTER TABLE public.cases ADD CONSTRAINT valid_urgency
  CHECK (urgency IN ('NORMAL', 'HURTIG', 'AKUT'));

-- Fast sort index — admin list always orders AKUT to top
CREATE INDEX IF NOT EXISTS idx_cases_urgency ON public.cases(urgency);

-- ---------------------------------------------------------------------------
-- 2. case_number column: KS-YYMMDD-NNN (e.g. KS-260707-001)
-- ---------------------------------------------------------------------------
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS case_number TEXT;
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_case_number_unique;
ALTER TABLE public.cases ADD CONSTRAINT cases_case_number_unique UNIQUE (case_number);

CREATE INDEX IF NOT EXISTS idx_cases_case_number ON public.cases(case_number);

-- ---------------------------------------------------------------------------
-- 3. Generator function
-- ---------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_generate_case_number ON public.cases;
CREATE TRIGGER trg_generate_case_number
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_case_number();

-- ---------------------------------------------------------------------------
-- 4. Back-fill existing rows (if any) that have no case_number yet
--    Uses a stable sort (created_at) so reruns are idempotent.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  date_part TEXT;
  seq INTEGER;
BEGIN
  FOR r IN
    SELECT id, created_at
    FROM public.cases
    WHERE case_number IS NULL
    ORDER BY created_at
  LOOP
    date_part := TO_CHAR(r.created_at AT TIME ZONE 'Europe/Copenhagen', 'YYMMDD');

    SELECT COALESCE(MAX(CAST(SPLIT_PART(case_number, '-', 3) AS INTEGER)), 0) + 1
    INTO seq
    FROM public.cases
    WHERE case_number LIKE 'KS-' || date_part || '-%';

    UPDATE public.cases
    SET case_number = 'KS-' || date_part || '-' || LPAD(seq::TEXT, 3, '0')
    WHERE id = r.id;
  END LOOP;
END;
$$;

COMMIT;
