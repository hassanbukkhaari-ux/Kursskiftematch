-- file_name was accidentally omitted from professional_documents
-- (it exists on professional_certificates but was never added here)
ALTER TABLE public.professional_documents
  ADD COLUMN IF NOT EXISTS file_name text;
