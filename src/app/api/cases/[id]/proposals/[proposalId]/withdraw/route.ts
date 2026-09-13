import { NextRequest } from 'next/server'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

// PATCH /api/cases/:id/proposals/:proposalId/withdraw — admin pulls back a
// proposal still awaiting the municipality's response, so a different
// candidate can be proposed instead. Used both when the municipality has
// asked for changes or declined, and when admin needs to switch candidates
// for a reason that never went through the municipality at all (e.g. the
// professional themselves said no outside the system).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const { id, proposalId } = await params
  return withAdminAuth(request, async (userId) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data: proposal, error: proposalError } = await dba
      .from('case_proposals')
      .select('id, case_id, status')
      .eq('id', proposalId)
      .eq('case_id', id)
      .single()

    if (proposalError || !proposal) return notFound('Proposal')
    if (proposal.status !== 'SENT') {
      return badRequest(`Kan ikke trække et forslag tilbage med status: ${proposal.status}`)
    }

    const now = new Date().toISOString()

    const { error: updateError } = await dba
      .from('case_proposals')
      .update({ status: 'WITHDRAWN' })
      .eq('id', proposalId)

    if (updateError) return serverError(updateError.message)

    await dba.from('cases').update({ status: 'OPEN', updated_at: now }).eq('id', id)

    await logAuditEvent(db, {
      event_type: 'PROPOSAL_WITHDRAWN',
      actor_id: userId,
      resource_type: 'case_proposals',
      resource_id: proposalId,
      metadata: { case_id: id },
    })

    return ok({ ok: true })
  })
}
