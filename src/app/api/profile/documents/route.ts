import { withAuth } from '@/lib/api-response'
import { badRequest, created, serverError } from '@/lib/api-response'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const ALLOWED_TYPES = new Set(['CV', 'QUALIFICATION', 'DRIVING_LICENSE', 'OTHER'])

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    let body: { document_type?: string; file_path?: string; file_name?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (!body.document_type || !ALLOWED_TYPES.has(body.document_type)) {
      return badRequest('Ugyldig dokumenttype')
    }
    if (!body.file_path) return badRequest('file_path required')

    // Ensure professionals row exists (INSERT policy is admin-only, use service client)
    const svc = createServiceClient()
    await svc.from('professionals').upsert(
      { id: userId, profession: 'OTHER' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    const { data, error } = await dba.from('professional_documents').upsert(
      {
        professional_id: userId,
        document_type: body.document_type,
        file_path: body.file_path,
        file_name: body.file_name ?? null,
        status: 'UNVERIFIED',
        uploaded_at: new Date().toISOString(),
        uploaded_by: userId,
      },
      { onConflict: 'professional_id,document_type' }
    ).select('id').single()

    if (error) { console.error('[documents POST]', error); return serverError(error.message) }
    return created({ id: data.id })
  })
}
