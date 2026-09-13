import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

const CompleteSchema = z.object({
  overlap_meeting_completed: z.boolean().default(false),
})

// PATCH /api/cases/:id/handover/:handoverId/complete — WF-008 completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; handoverId: string }> }
) {
  const { id, handoverId } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown = {}
    try { body = await request.json() } catch { /* body is optional */ }
    const parsed = CompleteSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify handover exists and belongs to this case
    const { data: handover, error: handoverError } = await db
      .from('case_handovers')
      .select('id, case_id, outgoing_professional_id, incoming_professional_id, status')
      .eq('id', handoverId)
      .eq('case_id', id)
      .single()

    if (handoverError || !handover) return notFound('Handover')
    if (!['INITIATED', 'IN_PROGRESS'].includes(handover.status)) {
      return badRequest(`Cannot complete a handover with status: ${handover.status}`)
    }

    // A named replacement is only meaningful with a confirmed overlap
    // meeting between outgoing and incoming professional — the two
    // mandatory steps CLAUDE.md ties together. No named replacement means
    // the case is reverting to the open pool instead, where an overlap
    // meeting has nobody to be held with.
    if (handover.incoming_professional_id && !parsed.data.overlap_meeting_completed) {
      return badRequest('Overlapsmøde skal bekræftes afholdt, før overdragelsen kan fuldføres.')
    }

    const now = new Date().toISOString()

    // End the outgoing professional's active assignment
    await db
      .from('case_assignments')
      .update({ ended_at: now })
      .eq('case_id', id)
      .eq('professional_id', handover.outgoing_professional_id)
      .is('ended_at', null)

    // Create new assignment for incoming professional if one is specified
    if (handover.incoming_professional_id) {
      const { error: assignError } = await db
        .from('case_assignments')
        .insert({
          case_id: id,
          professional_id: handover.incoming_professional_id,
          assigned_by: userId,
          assignment_reason: `Handover from professional ${handover.outgoing_professional_id}`,
        })

      if (assignError) return serverError(assignError.message)
    } else {
      // No incoming professional — case reverts to OPEN for re-matching
      await db
        .from('cases')
        .update({ status: 'OPEN', updated_at: now })
        .eq('id', id)
    }

    // Mark handover completed
    const { data: updated, error: updateError } = await db
      .from('case_handovers')
      .update({
        status: 'COMPLETED',
        completed_at: now,
        overlap_meeting_completed_at: parsed.data.overlap_meeting_completed ? now : null,
      })
      .eq('id', handoverId)
      .select()
      .single()

    if (updateError || !updated) return serverError(updateError?.message)

    await logAuditEvent(db, {
      event_type: 'HANDOVER_COMPLETED',
      actor_id: userId,
      resource_type: 'case_handovers',
      resource_id: handoverId,
      metadata: {
        case_id: id,
        outgoing_professional_id: handover.outgoing_professional_id,
        incoming_professional_id: handover.incoming_professional_id ?? null,
      },
    })

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
    const recipientIds = [handover.outgoing_professional_id, handover.incoming_professional_id].filter(
      (v): v is string => !!v
    )
    if (recipientIds.length > 0) {
      const { data: profiles } = await db.from('profiles').select('id, email').in('id', recipientIds)
      for (const p of profiles ?? []) {
        if (!p.email) continue
        await sendNotification({
          db,
          notification_type: 'HANDOVER_COMPLETED',
          related_entity_type: 'case_handovers',
          related_entity_id: handoverId,
          recipient_profile_id: p.id,
          recipient_email: p.email,
          subject: 'Overdragelse fuldført — Kursskifte',
          body: `Overdragelsen af en sag er nu fuldført.${handover.incoming_professional_id ? '' : ' Sagen er gået tilbage i matching-puljen.'}\n\nSe dine sager:\n${base}/dashboard/cases`,
        })
      }
    }

    return ok(updated)
  })
}
