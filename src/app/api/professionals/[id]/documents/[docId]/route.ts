import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, notFound, badRequest, forbidden, serverError, withAuth, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import type { Database } from '@/types/database'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'

const UpdateDocumentSchema = z.object({
  status: z.enum(['PENDING_UPLOAD', 'UNVERIFIED', 'VERIFIED', 'ARCHIVED']).optional(),
  verification_notes: z.string().optional(),
  re_upload_required: z.boolean().optional(),
  expiry_date: z.string().optional(),
  file_path: z.string().optional(),
  file_hash: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params
  return withAuth(request, async (userId, role) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = UpdateDocumentSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    // Only admin can verify or archive; professional can only re-upload
    if (role !== 'admin') {
      const adminFields = ['status', 'verification_notes']
      const attempted = Object.keys(parsed.data).filter(k => adminFields.includes(k))
      if (attempted.length > 0) return forbidden()
    }

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    type DocUpdate = Database['public']['Tables']['professional_documents']['Update']
    const update: DocUpdate = {
      ...parsed.data,
      ...(parsed.data.status === 'VERIFIED'
        ? { verified_at: new Date().toISOString(), verified_by: userId, re_upload_required: false }
        : {}),
      ...(parsed.data.file_path
        ? { uploaded_at: new Date().toISOString(), uploaded_by: userId, status: 'UNVERIFIED' as const, re_upload_required: false }
        : {}),
    }

    const { data, error } = await db
      .from('professional_documents')
      .update(update)
      .eq('id', docId)
      .eq('professional_id', id)
      .select()
      .single()

    if (error || !data) return notFound('Document')

    await logAuditEvent(db, {
      event_type: 'DOCUMENT_UPDATED',
      actor_id: userId,
      resource_type: 'professional_documents',
      resource_id: docId,
      metadata: { status: parsed.data.status, professional_id: id },
    })

    // Notify professional if re_upload_required set to true
    if (parsed.data.re_upload_required === true) {
      const { subject, body: emailBody } = adminEmailBody('DOCUMENT_ACTION_REQUIRED', docId)
      await sendNotification({
        db,
        notification_type: 'DOCUMENT_ACTION_REQUIRED',
        related_entity_type: 'professional_documents',
        related_entity_id: docId,
        recipient_profile_id: id,
        subject,
        body: emailBody,
      })
    }

    return ok(data)
  })
}
