-- Migration: Capacity module for professionals
-- Adds: available_from_date, availability_note columns
-- Adds: professional_availability_periods table (vacation/pause)
-- Updates: v_professionals_available view to respect vacation/pause and available_from_date

-- 1. New columns on professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS available_from_date DATE,
  ADD COLUMN IF NOT EXISTS availability_note   TEXT;

-- 2. Availability periods table
CREATE TABLE IF NOT EXISTS public.professional_availability_periods (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID        NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  period_type     TEXT        NOT NULL CHECK (period_type IN ('VACATION', 'PAUSE')),
  start_date      DATE        NOT NULL,
  end_date        DATE,
  note            TEXT,
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avail_periods_professional
  ON public.professional_availability_periods(professional_id);

CREATE INDEX IF NOT EXISTS idx_avail_periods_dates
  ON public.professional_availability_periods(start_date, end_date);

-- RLS
ALTER TABLE public.professional_availability_periods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'professional_availability_periods' AND policyname = 'Admins manage availability periods'
  ) THEN
    CREATE POLICY "Admins manage availability periods"
      ON public.professional_availability_periods FOR ALL TO authenticated
      USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'professional_availability_periods' AND policyname = 'Professional reads own periods'
  ) THEN
    CREATE POLICY "Professional reads own periods"
      ON public.professional_availability_periods FOR SELECT TO authenticated
      USING (professional_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'professional_availability_periods' AND policyname = 'Professional manages own periods'
  ) THEN
    CREATE POLICY "Professional manages own periods"
      ON public.professional_availability_periods FOR INSERT TO authenticated
      WITH CHECK (professional_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'professional_availability_periods' AND policyname = 'Professional deletes own periods'
  ) THEN
    CREATE POLICY "Professional deletes own periods"
      ON public.professional_availability_periods FOR DELETE TO authenticated
      USING (professional_id = auth.uid());
  END IF;
END $$;

-- 3. Update v_professionals_available:
--    Exclude professionals currently in vacation/pause AND with future available_from_date
CREATE OR REPLACE VIEW public.v_professionals_available AS
SELECT
  p.id,
  p.profession,
  p.experience_years,
  p.max_complexity_level,
  p.target_age_groups,
  p.qualifications,
  p.capacity_hours_week,
  p.max_concurrent_cases,
  p.availability_status,
  p.availability_days,
  p.available_from_date,
  COUNT(ca.id)                        AS current_assignments,
  COALESCE(SUM(c.weekly_hours), 0)    AS current_hours_assigned
FROM public.professionals p
LEFT JOIN public.case_assignments ca
  ON p.id = ca.professional_id AND ca.ended_at IS NULL
LEFT JOIN public.cases c
  ON ca.case_id = c.id AND c.status = 'ACTIVE'
WHERE p.status = 'ACTIVE'
  AND p.availability_status != 'UNAVAILABLE'
  -- Not currently in a vacation or pause period
  AND NOT EXISTS (
    SELECT 1 FROM public.professional_availability_periods pap
    WHERE pap.professional_id = p.id
      AND pap.start_date <= CURRENT_DATE
      AND (pap.end_date IS NULL OR pap.end_date >= CURRENT_DATE)
  )
  -- Not marked as available only from a future date
  AND (p.available_from_date IS NULL OR p.available_from_date <= CURRENT_DATE)
GROUP BY p.id
HAVING
  COUNT(ca.id) < p.max_concurrent_cases
  AND COALESCE(SUM(c.weekly_hours), 0) < p.capacity_hours_week;
