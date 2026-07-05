import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, forbidden, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'

const CreateDocumentSchema = z.object({
  document_type: z.enum(['CV', 'CRIMINAL_RECORD', 'CHILD_PROTECTION', 'DRIVING_LICENSE', 'QUALIFICATION', 'INSURANCE', 'OTHER']),
  file_path: z.string().optional(),
  file_hash: z.string().optional(),
  expiry_date: z.string().optional(),
})

// GET /api/professionals/:id/documents
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data, error } = await db
      .from('professional_documents')
      .select('*')
      .eq('professional_id', id)
      .order('created_at', { ascending: false })

    if (error) return serverError()
    return ok(data)
  })
}

// POST /api/professionals/:id/documents
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateDocumentSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const isUpload = !!parsed.data.file_path
    const { data, error } = await db
      .from('professional_documents')
      .insert({
        professional_id: id,
        document_type: parsed.data.document_type,
        status: isUpload ? 'UNVERIFIED' : 'PENDING_UPLOAD',
        file_path: parsed.data.file_path || null,
        file_hash: parsed.data.file_hash || null,
        expiry_date: parsed.data.expiry_date || null,
        uploaded_at: isUpload ? new Date().toISOString() : null,
        uploaded_by: isUpload ? userId : null,
      })
      .select()
      .single()

    if (error) return serverError(error.message)

    await logAuditEvent(db, {
      event_type: 'DOCUMENT_UPLOADED',
      actor_id: userId,
      resource_type: 'professional_documents',
      resource_id: data.id,
      metadata: { document_type: data.document_type, professional_id: id },
    })

    // Notify admin of new application document
    if (isUpload) {
      const { subject, body: emailBody } = adminEmailBody('PROFESSIONAL_APPLICATION_RECEIVED', data.id)
      await sendNotification({
        db,
        notification_type: 'PROFESSIONAL_APPLICATION_RECEIVED',
        related_entity_type: 'inbound_inquiries',
        related_entity_id: data.id,
        recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
        subject,
        body: emailBody,
      })
    }

    return created(data)
  })
}
