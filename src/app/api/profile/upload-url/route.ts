import { withAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const UPLOADABLE_TYPES = new Set(['CV', 'QUALIFICATION', 'DRIVING_LICENSE', 'OTHER'])
const BUCKET = 'professional-documents'

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    let body: { document_type?: string; file_name?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (!body.document_type || !UPLOADABLE_TYPES.has(body.document_type)) {
      return badRequest('Ugyldig dokumenttype')
    }
    if (!body.file_name) return badRequest('file_name required')

    const ext = body.file_name.split('.').pop()?.toLowerCase() ?? ''
    const safe = `${Date.now()}.${ext}`
    const path = `${userId}/${body.document_type}/${safe}`

    const svc = createServiceClient()
    const { data, error } = await svc.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error) return serverError(error.message)
    return ok({ signed_url: data.signedUrl, path, token: data.token })
  })
}
