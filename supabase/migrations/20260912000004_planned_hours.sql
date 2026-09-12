-- Planned hours: forward-looking weekly hour planning per case, distinct
-- from registered_hours (actuals logged after the fact). One row per
-- case + professional + ISO week (week_start is always a Monday).

CREATE TABLE IF NOT EXISTS public.planned_hours (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  week_start      date NOT NULL,
  planned_hours   numeric(5,2) NOT NULL CHECK (planned_hours >= 0 AND planned_hours <= 80),
  created_by      uuid NOT NULL REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, professional_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_planned_hours_professional_week
  ON public.planned_hours(professional_id, week_start);
CREATE INDEX IF NOT EXISTS idx_planned_hours_case_week
  ON public.planned_hours(case_id, week_start);

ALTER TABLE public.planned_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals manage own planned_hours" ON public.planned_hours;
CREATE POLICY "Professionals manage own planned_hours" ON public.planned_hours
  FOR ALL TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all planned_hours" ON public.planned_hours;
CREATE POLICY "Admins manage all planned_hours" ON public.planned_hours
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
