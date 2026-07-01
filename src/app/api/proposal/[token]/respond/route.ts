import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

const RespondSchema = z.object({
  decision: z.enum(['ACCEPTED', 'DECLINED']),
  response_note: z.string().optional(),
})

// POST /api/proposal/:token/respond — public, municipality accepts or declines
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  let body: unknown
  try { body = await request.json() } catch { return badRequest('Invalid JSON') }

  const parsed = RespondSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { createServiceClient } = await import('@/lib/supabase/server')
  const db = createServiceClient()
  const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

  // Look up proposal by response_token
  const { data: proposal } = await dba
    .from('case_proposals')
    .select('*')
    .eq('response_token', token)
    .single()

  if (!proposal) return notFound('Proposal')
  if (proposal.status !== 'SENT') return badRequest('This proposal has already been responded to')

  const now = new Date().toISOString()

  // Update proposal status
  const { error: updateError } = await dba
    .from('case_proposals')
    .update({
      status: parsed.data.decision,
      responded_at: now,
      municipality_response_note: parsed.data.response_note || null,
    })
    .eq('id', proposal.id)

  if (updateError) return serverError(updateError.message)

  if (parsed.data.decision === 'ACCEPTED') {
    // Create case assignment (professional now officially assigned)
    const { data: assignment, error: assignError } = await dba
      .from('case_assignments')
      .insert({
        case_id: proposal.case_id,
        professional_id: proposal.professional_id,
        assigned_by: proposal.created_by,
        assignment_reason: `Kommunen accepterede forslag ${proposal.id}`,
      })
      .select('id')
      .single()

    if (assignError || !assignment) return serverError(assignError?.message)

    // Activate case
    await dba.from('cases').update({ status: 'ACTIVE', updated_at: now }).eq('id', proposal.case_id)

    // Notify admin
    await sendNotification({
      db,
      notification_type: 'PROPOSAL_ACCEPTED',
      related_entity_type: 'case_proposals',
      related_entity_id: proposal.id,
      subject: 'Kommunen har accepteret forslaget — Kursskiftematch',
      body: `Kommunen har accepteret forslaget for sag ${proposal.case_id}.\n\nLog ind for at aktivere sagen og dele kontaktoplysninger med fagpersonen.`,
    })

    await logAuditEvent(db, {
      event_type: 'PROPOSAL_ACCEPTED',
      actor_id: null,
      resource_type: 'case_proposals',
      resource_id: proposal.id,
      metadata: { case_id: proposal.case_id, professional_id: proposal.professional_id },
    })

    return ok({ status: 'ACCEPTED', case_id: proposal.case_id })
  } else {
    // DECLINED — reopen case for admin to re-evaluate
    await dba.from('cases').update({ status: 'OPEN', updated_at: now }).eq('id', proposal.case_id)

    await sendNotification({
      db,
      notification_type: 'PROPOSAL_DECLINED',
      related_entity_type: 'case_proposals',
      related_entity_id: proposal.id,
      subject: 'Kommunen har afvist forslaget — Kursskiftematch',
      body: `Kommunen har afvist forslaget for sag ${proposal.case_id}.\n\nLog ind for at gennemgå og sende et nyt forslag.`,
    })

    await logAuditEvent(db, {
      event_type: 'PROPOSAL_DECLINED',
      actor_id: null,
      resource_type: 'case_proposals',
      resource_id: proposal.id,
      metadata: { case_id: proposal.case_id, response_note: parsed.data.response_note },
    })

    return ok({ status: 'DECLINED', case_id: proposal.case_id })
  }
}
