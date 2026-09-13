import { withAuth, ok, badRequest, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: docId } = await params
  return withAuth(request, async (userId) => {
    const svc = createServiceClient()

    const { data: doc } = await (svc as any)
      .from('professional_documents')
      .select('file_path, file_name')
      .eq('id', docId)
      .eq('professional_id', userId)
      .single()

    if (!doc) return badRequest('Dokument ikke fundet')

    const { data, error } = await svc.storage
      .from('professional-documents')
      .createSignedUrl(doc.file_path, 300) // 5 min expiry

    if (error || !data) return serverError(error?.message ?? 'Could not create download URL')

    return ok({ url: data.signedUrl, file_name: doc.file_name })
  })
}
