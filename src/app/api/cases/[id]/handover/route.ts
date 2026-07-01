import { NextRequest } from 'next/server'
import { z } from 'zod'
import { created, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification, handoverEmailBody } from '@/lib/notifications/service'
import type { HandoverReason } from '@/types/database'

const HandoverSchema = z.object({
  reason: z.enum([
    'PROFESSIONAL_UNAVAILABLE',
    'WORKLOAD_EXCEEDED',
    'REQUEST_PROFESSIONAL',
    'REQUEST_CASE',
    'BETTER_MATCH',
    'SAFEGUARDING_CONCERN',
    'OTHER',
  ]),
  incoming_professional_id: z.string().uuid().nullable().optional(),
  handover_note: z.string().max(2000).optional(),
  is_urgent: z.boolean().optional().default(false),
})

// POST /api/cases/:id/handover — initiate professional handover (WF-008, admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = HandoverSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify case is ACTIVE
    const { data: caseData, error: caseError } = await db
      .from('cases')
      .select('id, status')
      .eq('id', id)
      .single()

    if (caseError || !caseData) return notFound('Case')
    if (caseData.status !== 'ACTIVE') {
      return badRequest(`Handover requires an ACTIVE case, current status: ${caseData.status}`)
    }

    // Get current active assignment — outgoing professional
    const { data: assignment, error: assignError } = await db
      .from('case_assignments')
      .select('professional_id')
      .eq('case_id', id)
      .is('ended_at', null)
      .single()

    if (assignError || !assignment) {
      return badRequest('No active professional assignment found for this case')
    }

    // Get outgoing professional's display name for the notification email
    const { data: outgoingProfile } = await db
      .from('professionals')
      .select('profiles!inner(full_name)')
      .eq('id', assignment.professional_id)
      .single()

    const outgoingName = (outgoingProfile as any)?.profiles?.full_name ?? 'den tidligere kontaktperson'

    // Validate incoming professional exists if provided
    let incomingEmail: string | null = null
    if (parsed.data.incoming_professional_id) {
      const { data: pro } = await db
        .from('professionals')
        .select('id, status, profiles!inner(email, full_name)')
        .eq('id', parsed.data.incoming_professional_id)
        .single()

      if (!pro) return notFound('Incoming professional')
      if ((pro as any).status !== 'ACTIVE') {
        return badRequest('Incoming professional must have ACTIVE status')
      }
      incomingEmail = (pro as any).profiles?.email ?? null
    }

    const { data, error } = await db
      .from('case_handovers')
      .insert({
        case_id: id,
        outgoing_professional_id: assignment.professional_id,
        incoming_professional_id: parsed.data.incoming_professional_id ?? null,
        reason: parsed.data.reason as HandoverReason,
        status: 'INITIATED',
        handover_note: parsed.data.handover_note ?? null,
        is_urgent: parsed.data.is_urgent ?? false,
        session_logs_transferred: false,
        created_by: userId,
      })
      .select()
      .single()

    if (error || !data) return serverError(error?.message)

    await logAuditEvent(db, {
      event_type: 'HANDOVER_INITIATED',
      actor_id: userId,
      resource_type: 'case_handovers',
      resource_id: data.id,
      metadata: {
        case_id: id,
        outgoing_professional_id: assignment.professional_id,
        incoming_professional_id: parsed.data.incoming_professional_id ?? null,
        reason: parsed.data.reason,
        is_urgent: parsed.data.is_urgent ?? false,
      },
    })

    // Notify incoming professional if one is specified
    if (parsed.data.incoming_professional_id && incomingEmail) {
      const { subject, body: emailBody } = handoverEmailBody(
        id,
        outgoingName,
        parsed.data.is_urgent ?? false,
        parsed.data.handover_note,
      )
      await sendNotification({
        db,
        notification_type: 'HANDOVER_INITIATED',
        related_entity_type: 'cases',
        related_entity_id: id,
        recipient_profile_id: parsed.data.incoming_professional_id,
        recipient_email: incomingEmail,
        subject,
        body: emailBody,
      })
    }

    return created(data)
  })
}
