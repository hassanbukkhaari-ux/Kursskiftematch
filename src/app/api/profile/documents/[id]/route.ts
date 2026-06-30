import { withAdminAuth, withAuth } from '@/lib/api-response'
import { badRequest, forbidden, ok, serverError } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// Professional: upload a document (set file_url + status=UPLOADED)
// Admin: approve, reject, or change status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  return withAuth(request, async (userId, role) => {
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const db = await createClient()

    if (role === 'admin') {
      const action = body.action as string | undefined
      const patch: Record<string, unknown> = {}

      if (action === 'APPROVE') {
        patch.status = 'APPROVED'
        patch.verified_at = new Date().toISOString()
        patch.verified_by = userId
      } else if (action === 'REJECT') {
        patch.status = 'REJECTED'
        patch.verification_notes = body.note ?? null
      } else if (body.status) {
        patch.status = body.status
      } else {
        return badRequest('Provide action (APPROVE | REJECT) or status')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (db as any).from('professional_documents').update(patch).eq('id', id)
      if (error) return serverError(error.message)
      return ok({ ok: true })
    }

    // Professional: can only upload their own docs
    const { data: doc, error: fetchErr } = await db
      .from('professional_documents')
      .select('professional_id, status')
      .eq('id', id)
      .single()

    if (fetchErr || !doc) return serverError('Document not found')
    if (doc.professional_id !== userId) return forbidden()

    // Professionals can only set file_url (upload)
    if (!body.file_url) return badRequest('file_url required')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db as any)
      .from('professional_documents')
      .update({ file_url: body.file_url, file_name: body.file_name ?? null, status: 'UPLOADED', uploaded_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
