-- Indexes for status_report_requests / status_reports — added after the tables
-- shipped without any (see infrastructure audit finding C2). All listing pages
-- and the reminder/auto-report crons filter on these columns.

CREATE INDEX IF NOT EXISTS idx_status_report_requests_professional_status
  ON public.status_report_requests(professional_id, status);

CREATE INDEX IF NOT EXISTS idx_status_report_requests_case
  ON public.status_report_requests(case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_report_requests_pending_deadline
  ON public.status_report_requests(deadline)
  WHERE status IN ('PENDING', 'ACKNOWLEDGED');

CREATE INDEX IF NOT EXISTS idx_status_reports_request_id
  ON public.status_reports(request_id);

-- Simplify the professional-facing RLS policy: professional_id already IS the
-- profile id (professionals.id references profiles.id 1:1), so the nested
-- professionals/profiles join was doing unnecessary work per row.
DROP POLICY IF EXISTS "Professionals read own status_report_requests" ON public.status_report_requests;
CREATE POLICY "Professionals read own status_report_requests"
  ON public.status_report_requests FOR SELECT TO authenticated
  USING (
    professional_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Professionals update own status_report_requests" ON public.status_report_requests;
CREATE POLICY "Professionals update own status_report_requests"
  ON public.status_report_requests FOR UPDATE TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

DROP POLICY IF EXISTS "Professionals manage own status_reports" ON public.status_reports;
CREATE POLICY "Professionals manage own status_reports"
  ON public.status_reports FOR ALL TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());
