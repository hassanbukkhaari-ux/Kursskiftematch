import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const TransferSchema = z.object({
  session_log_ids: z.array(z.string().uuid()).min(1),
  transfer_note: z.string().max(1000).optional(),
})

// PATCH /api/cases/:id/handover/:handoverId/transfer-sessions — WF-008
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; handoverId: string }> }
) {
  const { id, handoverId } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = TransferSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify handover exists, belongs to this case, and is in a transferable state
    const { data: handover, error: handoverError } = await db
      .from('case_handovers')
      .select('id, case_id, outgoing_professional_id, incoming_professional_id, status, transferred_session_logs')
      .eq('id', handoverId)
      .eq('case_id', id)
      .single()

    if (handoverError || !handover) return notFound('Handover')
    if (!['INITIATED', 'IN_PROGRESS'].includes(handover.status)) {
      return badRequest(`Cannot transfer sessions for a handover with status: ${handover.status}`)
    }
    if (!handover.incoming_professional_id) {
      return badRequest('Incoming professional must be set before transferring sessions')
    }

    // Verify all session logs belong to this case
    const { data: sessionLogs, error: logsError } = await db
      .from('session_logs')
      .select('id')
      .eq('case_id', id)
      .in('id', parsed.data.session_log_ids)

    if (logsError) return serverError(logsError.message)
    if ((sessionLogs?.length ?? 0) !== parsed.data.session_log_ids.length) {
      return badRequest('One or more session log IDs do not belong to this case')
    }

    // Create transfer records for each session log
    const transfers = parsed.data.session_log_ids.map(logId => ({
      session_log_id: logId,
      from_professional_id: handover.outgoing_professional_id,
      to_professional_id: handover.incoming_professional_id as string,
      approved_by: userId,
      reason: `Handover ${handoverId}`,
      transfer_note: parsed.data.transfer_note ?? null,
    }))

    const { error: transferError } = await db
      .from('session_log_transfers')
      .insert(transfers)

    if (transferError) return serverError(transferError.message)

    // Merge with any previously transferred logs
    const existing = (handover.transferred_session_logs ?? []) as string[]
    const merged = Array.from(new Set([...existing, ...parsed.data.session_log_ids]))

    const { data: updated, error: updateError } = await db
      .from('case_handovers')
      .update({
        status: 'IN_PROGRESS',
        session_logs_transferred: true,
        transferred_session_logs: merged,
      })
      .eq('id', handoverId)
      .select()
      .single()

    if (updateError || !updated) return serverError(updateError?.message)

    for (const logId of parsed.data.session_log_ids) {
      await logAuditEvent(db, {
        event_type: 'SESSION_LOG_TRANSFERRED',
        actor_id: userId,
        resource_type: 'session_log_transfers',
        resource_id: logId,
        metadata: {
          handover_id: handoverId,
          case_id: id,
          from_professional_id: handover.outgoing_professional_id,
          to_professional_id: handover.incoming_professional_id,
        },
      })
    }

    return ok(updated)
  })
}
