import { withAdminAuth, ok, badRequest, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params
  return withAdminAuth(request, async () => {
    let body: { file_name?: string; mime_type?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const { file_name, mime_type } = body
    if (!file_name) return badRequest('file_name er påkrævet')

    // Sanitise the filename — keep only last path segment and safe chars
    const safe = file_name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
    const storagePath = `cases/${caseId}/${Date.now()}_${safe}`

    const svc = createServiceClient()
    const { data, error } = await svc.storage
      .from('case-documents')
      .createSignedUploadUrl(storagePath)

    if (error || !data) return serverError(error?.message ?? 'Could not create upload URL')

    return ok({
      upload_url: data.signedUrl,
      storage_path: storagePath,
      token: data.token,
    })
  })
}
