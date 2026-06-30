import { NextRequest } from 'next/server'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

// PATCH /api/cases/:id/handover/:handoverId/complete — WF-008 completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; handoverId: string }> }
) {
  const { id, handoverId } = await params
  return withAdminAuth(request, async (userId) => {
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
      .update({ status: 'COMPLETED', completed_at: now })
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

    return ok(updated)
  })
}
