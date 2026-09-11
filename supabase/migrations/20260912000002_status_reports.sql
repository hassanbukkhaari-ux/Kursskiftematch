-- Status report requests: admin requests a report from the assigned professional
-- Status reports: the professional's filled-in template

CREATE TABLE IF NOT EXISTS public.status_report_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  professional_id     uuid NOT NULL REFERENCES public.professionals(id),
  requested_by        uuid NOT NULL REFERENCES public.profiles(id),
  report_type         text NOT NULL CHECK (report_type IN ('MONTHLY', 'EXTENDED', 'FINAL')),
  deadline            date NOT NULL,
  message             text,
  status              text NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'ACKNOWLEDGED', 'SUBMITTED', 'REVIEWED')),
  promised_date       date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.status_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id            uuid NOT NULL REFERENCES public.status_report_requests(id) ON DELETE CASCADE,
  professional_id       uuid NOT NULL REFERENCES public.professionals(id),
  case_id               uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  period_start          date NOT NULL,
  period_end            date NOT NULL,
  -- Template fields
  everyday_situation    text,
  work_focus            text,
  progress_resources    text,
  challenges            text,
  concern_level         text CHECK (concern_level IN ('NONE', 'MINOR', 'CONCERN')),
  concern_text          text,
  collaboration         text,
  recommendation        text,
  overall_assessment    text CHECK (overall_assessment IN ('ON_TRACK', 'ADJUSTING', 'RECOMMEND_CLOSE')),
  submitted_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.status_report_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_reports ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on requests
CREATE POLICY "Admins manage status_report_requests"
  ON public.status_report_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Professionals can read and update their own requests
CREATE POLICY "Professionals read own status_report_requests"
  ON public.status_report_requests FOR SELECT TO authenticated
  USING (
    professional_id IN (
      SELECT id FROM public.professionals WHERE id = (
        SELECT id FROM public.professionals
        JOIN public.profiles ON professionals.id = profiles.id
        WHERE profiles.id = auth.uid()
        LIMIT 1
      )
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Professionals update own status_report_requests"
  ON public.status_report_requests FOR UPDATE TO authenticated
  USING (
    professional_id IN (
      SELECT p.id FROM public.professionals p
      JOIN public.profiles pr ON p.id = pr.id
      WHERE pr.id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id IN (
      SELECT p.id FROM public.professionals p
      JOIN public.profiles pr ON p.id = pr.id
      WHERE pr.id = auth.uid()
    )
  );

-- Admins can do everything on reports
CREATE POLICY "Admins manage status_reports"
  ON public.status_reports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Professionals can manage their own reports
CREATE POLICY "Professionals manage own status_reports"
  ON public.status_reports FOR ALL TO authenticated
  USING (
    professional_id IN (
      SELECT p.id FROM public.professionals p
      JOIN public.profiles pr ON p.id = pr.id
      WHERE pr.id = auth.uid()
    )
  )
  WITH CHECK (
    professional_id IN (
      SELECT p.id FROM public.professionals p
      JOIN public.profiles pr ON p.id = pr.id
      WHERE pr.id = auth.uid()
    )
  );
