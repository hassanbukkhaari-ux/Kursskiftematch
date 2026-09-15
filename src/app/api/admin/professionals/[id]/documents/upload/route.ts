import { withAdminAuth, badRequest, created, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const DOC_TYPES = new Set(['CV', 'QUALIFICATION', 'DRIVING_LICENSE', 'OTHER'])

// POST /api/admin/professionals/[id]/documents/upload — registers a document
// admin just uploaded (via /upload-url above) on the contact person's
// behalf. Lands as UNVERIFIED, same as a self-upload — the existing
// approve/reject buttons in the admin UI take it from there.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: professionalId } = await params
  return withAdminAuth(request, async (adminId) => {
    let body: { document_type?: string; file_path?: string; file_name?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (!body.document_type || !DOC_TYPES.has(body.document_type)) {
      return badRequest('Ugyldig dokumenttype')
    }
    if (!body.file_path) return badRequest('file_path required')

    const svc = createServiceClient() as any

    await svc.from('professionals').upsert(
      { id: professionalId, profession: 'OTHER' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const { data, error } = await svc.from('professional_documents').upsert(
      {
        professional_id: professionalId,
        document_type: body.document_type,
        file_path: body.file_path,
        file_name: body.file_name ?? null,
        status: 'UNVERIFIED',
        uploaded_at: new Date().toISOString(),
        uploaded_by: adminId,
      },
      { onConflict: 'professional_id,document_type' }
    ).select('id').single()

    if (error) { console.error('[admin documents/upload]', error); return serverError(error.message) }
    return created({ id: data.id })
  })
}
