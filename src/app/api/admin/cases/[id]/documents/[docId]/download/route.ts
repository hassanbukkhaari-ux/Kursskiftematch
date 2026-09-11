import { withAdminAuth, ok, badRequest, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id: caseId, docId } = await params
  return withAdminAuth(request, async () => {
    const svc = createServiceClient()

    const { data: doc } = await (svc as any)
      .from('case_documents')
      .select('storage_path, file_name')
      .eq('id', docId)
      .eq('case_id', caseId)
      .single()

    if (!doc) return badRequest('Dokument ikke fundet')

    const { data, error } = await svc.storage
      .from('case-documents')
      .createSignedUrl(doc.storage_path, 300) // 5 min expiry

    if (error || !data) return serverError(error?.message ?? 'Could not create download URL')

    return ok({ url: data.signedUrl, file_name: doc.file_name })
  })
}
