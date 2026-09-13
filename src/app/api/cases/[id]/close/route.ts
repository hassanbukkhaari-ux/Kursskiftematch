import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'

const CloseCaseSchema = z.object({
  reason: z.string().min(1),
  retention_years: z.number().int().min(1).max(10).default(5),
})

// POST /api/cases/:id/close — admin only, WF-012
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CloseCaseSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify case exists and is in a closable state
    const { data: existing, error: fetchError } = await db
      .from('cases')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) return notFound('Case')
    if (existing.status === 'ARCHIVED') return badRequest('Case is already archived')

    const retentionExpiry = new Date()
    retentionExpiry.setFullYear(retentionExpiry.getFullYear() + parsed.data.retention_years)

    const { data, error } = await db
      .from('cases')
      .update({
        status: 'COMPLETED',
        data_retention_expires_at: retentionExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return serverError(error?.message)

    // Capture who was actively assigned before ending the assignment, so
    // they can be notified the case is closed.
    const { data: activeAssignments } = await db
      .from('case_assignments')
      .select('professional_id')
      .eq('case_id', id)
      .is('ended_at', null)

    // End all active assignments
    await db
      .from('case_assignments')
      .update({ ended_at: new Date().toISOString() })
      .eq('case_id', id)
      .is('ended_at', null)

    await logAuditEvent(db, {
      event_type: 'CASE_CLOSED',
      actor_id: userId,
      resource_type: 'cases',
      resource_id: id,
      metadata: { reason: parsed.data.reason, retention_expires_at: retentionExpiry.toISOString() },
    })

    const { subject, body: emailBody } = adminEmailBody('CASE_CLOSED', id)
    await sendNotification({
      db,
      notification_type: 'CASE_CLOSED',
      related_entity_type: 'cases',
      related_entity_id: id,
      recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
      subject,
      body: emailBody,
    })

    const professionalIds = [...new Set((activeAssignments ?? []).map(a => a.professional_id))]
    if (professionalIds.length > 0) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
      const { data: profiles } = await db.from('profiles').select('id, email').in('id', professionalIds)
      for (const p of profiles ?? []) {
        if (!p.email) continue
        await sendNotification({
          db,
          notification_type: 'CASE_CLOSED',
          related_entity_type: 'cases',
          related_entity_id: id,
          recipient_profile_id: p.id,
          recipient_email: p.email,
          subject: 'Sag afsluttet — Kursskifte',
          body: `En sag du var tilknyttet er nu afsluttet.\n\nSe dine sager:\n${base}/dashboard/cases`,
        })
      }
    }

    return ok(data)
  })
}
