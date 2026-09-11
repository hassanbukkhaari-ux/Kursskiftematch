-- Case documents: files uploaded by admin (municipality correspondence, etc.)
-- Accessible by admin only — not visible to professionals (GDPR need-to-know)

CREATE TABLE IF NOT EXISTS public.case_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name       text NOT NULL,
  storage_path    text NOT NULL,
  mime_type       text,
  size_bytes      bigint,
  description     text,
  uploaded_by     uuid NOT NULL REFERENCES public.profiles(id),
  uploaded_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- Only admins can access case documents
CREATE POLICY "Admins can manage case documents"
  ON public.case_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Storage bucket for case documents (run separately if bucket doesn't exist)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents', 'case-documents', false)
-- ON CONFLICT DO NOTHING;
