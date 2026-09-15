import { withAdminAuth, badRequest, ok, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// Same document types a professional can upload themselves (CV, education
// certificates, driving licence, other) — not CRIMINAL_RECORD/CHILD_PROTECTION,
// which Kursskifte obtains directly and marks verified without a file
// (see [id]/documents/route.ts).
const DOC_TYPES = new Set(['CV', 'QUALIFICATION', 'DRIVING_LICENSE', 'OTHER'])

// POST /api/admin/professionals/[id]/upload-url — signed URL for admin to
// upload a document on behalf of a contact person who sent it by email,
// phone, or paper instead of uploading it themselves.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: professionalId } = await params
  return withAdminAuth(request, async () => {
    let body: { document_type?: string; file_name?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (!body.file_name) return badRequest('file_name required')
    if (!body.document_type || !DOC_TYPES.has(body.document_type)) {
      return badRequest('Ugyldig dokumenttype')
    }

    const ext = body.file_name.split('.').pop()?.toLowerCase() ?? 'bin'
    const svc = createServiceClient()

    await svc.storage.createBucket('professional-documents', { public: false }).catch(() => {})

    const path = `${professionalId}/${body.document_type}/${Date.now()}.${ext}`
    const { data, error } = await svc.storage
      .from('professional-documents')
      .createSignedUploadUrl(path)

    if (error) return serverError(error.message)
    return ok({ signed_url: data.signedUrl, path })
  })
}
