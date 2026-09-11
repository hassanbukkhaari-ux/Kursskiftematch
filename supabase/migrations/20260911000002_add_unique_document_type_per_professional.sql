-- Ensure at most one record per professional per document type
-- (supports admin upsert for managed documents like straffeattest/børneattest)
ALTER TABLE public.professional_documents
  ADD CONSTRAINT professional_documents_professional_id_document_type_key
  UNIQUE (professional_id, document_type);
