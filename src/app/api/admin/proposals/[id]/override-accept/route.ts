import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { activateAssignment } from '@/lib/cases/activate-assignment'
import { logAuditEvent } from '@/lib/audit'

const OverrideSchema = z.object({
  note: z.string().max(1000).optional(),
})

// PATCH /api/admin/proposals/:id/override-accept — admin marks a SENT
// proposal as accepted without the municipality having used their token
// link, for when the sagsbehandler agreed verbally (phone/meeting) but the
// email with the response link went missing. Reuses the same
// activateAssignment() the token-based accept path uses, so activation
// behaves identically either way — only how "accepted" was recorded differs.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { body = {} }

    const parsed = OverrideSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data: proposal, error: proposalError } = await dba
      .from('case_proposals')
      .select('id, case_id, professional_id, created_by, status')
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) return notFound('Proposal')
    if (proposal.status !== 'SENT') {
      return badRequest(`Kan ikke markere som accepteret med status: ${proposal.status}`)
    }

    const now = new Date().toISOString()
    const responseNote = parsed.data.note?.trim()
      ? `Manuelt registreret af admin: ${parsed.data.note.trim()}`
      : 'Manuelt registreret af admin — kommunen bekræftede uden for systemet'

    let assignment
    try {
      assignment = await activateAssignment({
        db,
        caseId: proposal.case_id,
        professionalId: proposal.professional_id,
        assignedBy: userId,
        assignmentReason: 'Kommunen accepterede forslaget (manuelt registreret af admin)',
        auditMetadata: { proposal_id: proposal.id, admin_override: true },
      })
    } catch (e) {
      return serverError(e instanceof Error ? e.message : 'Failed to activate assignment')
    }

    const { error: updateError } = await dba
      .from('case_proposals')
      .update({ status: 'ACCEPTED', responded_at: now, municipality_response_note: responseNote })
      .eq('id', proposal.id)

    if (updateError) return serverError(updateError.message)

    await logAuditEvent(db, {
      event_type: 'PROPOSAL_ACCEPTED_ADMIN_OVERRIDE',
      actor_id: userId,
      resource_type: 'case_proposals',
      resource_id: proposal.id,
      metadata: { case_id: proposal.case_id, assignment_id: assignment.id, note: parsed.data.note ?? null },
    })

    return ok({ ok: true, status: 'ACCEPTED' })
  })
}
