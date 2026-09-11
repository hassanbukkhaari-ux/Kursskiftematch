import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, notFound, badRequest, forbidden, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import type { Database } from '@/types/database'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'

const UpdateSessionLogSchema = z.object({
  observations: z.string().optional(),
  citizen_mood_tone: z.string().optional(),
  follow_up_needed: z.boolean().optional(),
  follow_up_reason: z.string().optional(),
  participant_names: z.array(z.string()).optional(),
  location: z.string().optional(),
  action: z.enum(['FINALIZE', 'FLAG_SAFEGUARDING', 'ACKNOWLEDGE_SAFEGUARDING']).optional(),
  safeguarding_detail: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data, error } = await db
      .from('session_logs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return notFound('Session log')
    if (role !== 'admin' && data.professional_id !== userId) return forbidden()

    return ok(data)
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = UpdateSessionLogSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data: existing, error: fetchError } = await db
      .from('session_logs')
      .select('id, status, professional_id, safeguarding_concern_flag, created_at')
      .eq('id', id)
      .single()

    if (fetchError || !existing) return notFound('Session log')
    if (role !== 'admin' && existing.professional_id !== userId) return forbidden()

    // Professionals can only edit within 24 hours of creation
    if (role !== 'admin' && existing.status === 'DRAFT') {
      const createdAt = new Date(existing.created_at as string).getTime()
      const hoursSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60)
      if (hoursSinceCreation > 24 && parsed.data.action !== 'FLAG_SAFEGUARDING') {
        return badRequest('Sessionsloggen kan ikke redigeres efter 24 timer. Kontakt admin for ændringer.')
      }
    }

    const { action, ...fields } = parsed.data
    type SessionLogUpdate = Database['public']['Tables']['session_logs']['Update']
    const update: SessionLogUpdate = {}

    // Apply field updates (only allowed on DRAFT)
    if (Object.keys(fields).length > 0) {
      if (existing.status !== 'DRAFT' && role !== 'admin') {
        return badRequest('Only DRAFT session logs can be edited')
      }
      Object.assign(update, fields)
    }

    if (action === 'FINALIZE') {
      if (existing.status !== 'DRAFT') return badRequest('Only DRAFT logs can be finalized')
      update.status = 'FINAL'
    }

    if (action === 'FLAG_SAFEGUARDING') {
      if (!parsed.data.safeguarding_detail) return badRequest('safeguarding_detail is required when flagging')
      update.safeguarding_concern_flag = true
      update.safeguarding_detail = parsed.data.safeguarding_detail
    }

    if (action === 'ACKNOWLEDGE_SAFEGUARDING') {
      if (role !== 'admin') return forbidden()
      update.safeguarding_acknowledged_at = new Date().toISOString()
      update.safeguarding_acknowledged_by = userId
    }

    const { data, error } = await db
      .from('session_logs')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return serverError(error?.message)

    await logAuditEvent(db, {
      event_type: 'SESSION_LOG_UPDATED',
      actor_id: userId,
      resource_type: 'session_logs',
      resource_id: id,
      metadata: { action, updated_fields: Object.keys(fields) },
    })

    // Notify admin when safeguarding is flagged
    if (action === 'FLAG_SAFEGUARDING') {
      const { subject, body: emailBody } = adminEmailBody('SAFEGUARDING_FLAGGED', id)
      await sendNotification({
        db,
        notification_type: 'SAFEGUARDING_FLAGGED',
        related_entity_type: 'session_logs',
        related_entity_id: id,
        recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
        subject,
        body: emailBody,
      })
    }

    return ok(data)
  })
}
