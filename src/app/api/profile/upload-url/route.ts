import { withAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const DOC_TYPES = new Set(['CV', 'QUALIFICATION', 'DRIVING_LICENSE', 'OTHER'])

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    let body: { document_type?: string; file_name?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (!body.file_name) return badRequest('file_name required')

    const ext = body.file_name.split('.').pop()?.toLowerCase() ?? 'bin'
    const svc = createServiceClient()

    if (body.document_type === 'PROFILE_IMAGE') {
      const path = `${userId}/${Date.now()}.${ext}`
      const { data, error } = await svc.storage
        .from('profile-images')
        .createSignedUploadUrl(path)
      if (error) return serverError(error.message)
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${path}`
      return ok({ signed_url: data.signedUrl, path, public_url: publicUrl })
    }

    if (!body.document_type || !DOC_TYPES.has(body.document_type)) {
      return badRequest('Ugyldig dokumenttype')
    }

    const path = `${userId}/${body.document_type}/${Date.now()}.${ext}`
    const { data, error } = await svc.storage
      .from('professional-documents')
      .createSignedUploadUrl(path)

    if (error) return serverError(error.message)
    return ok({ signed_url: data.signedUrl, path })
  })
}
