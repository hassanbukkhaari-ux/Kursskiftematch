import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import { activateAssignment } from '@/lib/cases/activate-assignment'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'
import { logAuditEvent } from '@/lib/audit'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

const RespondSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE', 'REQUEST_CHANGES']),
  note: z.string().optional(),
})

// POST /api/municipality/proposals/:token/respond — public, no login. The
// municipality's sagsbehandler reaches this from the email link sent in
// api/match-runs/[id]/assign; the token itself is the only authentication,
// so every DB access here uses the service client, never the RLS-bound one.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { limited } = rateLimit(`proposal-respond:${getClientIp(request)}`, { windowMs: 15 * 60 * 1000, max: 20 })
  if (limited) return rateLimitResponse()

  let body: unknown
  try { body = await request.json() } catch { return badRequest('Invalid JSON') }

  const parsed = RespondSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  if (parsed.data.action !== 'ACCEPT' && !parsed.data.note?.trim()) {
    return badRequest('En begrundelse er påkrævet')
  }

  const db = createServiceClient()
  const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: proposal, error: proposalError } = await dba
    .from('case_proposals')
    .select('id, case_id, professional_id, created_by, status, response_token')
    .eq('response_token', token)
    .maybeSingle()

  if (proposalError) return serverError(proposalError.message)
  if (!proposal) return notFound('Proposal')
  if (proposal.status !== 'SENT') {
    return badRequest('Dette forslag er ikke længere aktivt.')
  }

  const now = new Date().toISOString()

  if (parsed.data.action === 'ACCEPT') {
    let assignment
    try {
      assignment = await activateAssignment({
        db,
        caseId: proposal.case_id,
        professionalId: proposal.professional_id,
        assignedBy: proposal.created_by,
        assignmentReason: 'Kommunen accepterede forslaget',
        auditMetadata: { proposal_id: proposal.id, via_municipality_response: true },
      })
    } catch (e) {
      return serverError(e instanceof Error ? e.message : 'Failed to activate assignment')
    }

    await dba
      .from('case_proposals')
      .update({ status: 'ACCEPTED', responded_at: now })
      .eq('id', proposal.id)

    await logAuditEvent(db, {
      event_type: 'PROPOSAL_ACCEPTED',
      resource_type: 'case_proposals',
      resource_id: proposal.id,
      metadata: { case_id: proposal.case_id, assignment_id: assignment.id },
    })

    const { data: adminProfile } = await db.from('profiles').select('email').eq('id', proposal.created_by).single()
    if (adminProfile?.email) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
      await sendNotification({
        db,
        notification_type: 'PROPOSAL_ACCEPTED',
        related_entity_type: 'case_proposals',
        related_entity_id: proposal.id,
        recipient_email: adminProfile.email,
        subject: 'Kommunen har accepteret forslaget — Kursskifte',
        body: `Kommunen har accepteret forslaget for sagen — sagen er nu aktiv.\n\nSe sagen:\n${base}/admin/cases/${proposal.case_id}`,
      })
    }

    return ok({ ok: true, status: 'ACCEPTED' })
  }

  const newStatus = parsed.data.action === 'DECLINE' ? 'DECLINED' : 'CHANGES_REQUESTED'

  const { error: updateError } = await dba
    .from('case_proposals')
    .update({ status: newStatus, responded_at: now, municipality_response_note: parsed.data.note })
    .eq('id', proposal.id)

  if (updateError) return serverError(updateError.message)

  await dba.from('cases').update({ status: 'OPEN', updated_at: now }).eq('id', proposal.case_id)

  await logAuditEvent(db, {
    event_type: newStatus === 'DECLINED' ? 'PROPOSAL_DECLINED' : 'PROPOSAL_CHANGES_REQUESTED',
    resource_type: 'case_proposals',
    resource_id: proposal.id,
    metadata: { case_id: proposal.case_id, note: parsed.data.note },
  })

  const { data: adminProfile } = await db.from('profiles').select('email').eq('id', proposal.created_by).single()
  if (adminProfile?.email) {
    const notificationType = newStatus === 'DECLINED' ? 'PROPOSAL_DECLINED' : 'PROPOSAL_CHANGES_REQUESTED'
    const { subject, body: emailBody } = adminEmailBody(notificationType, proposal.case_id)
    await sendNotification({
      db,
      notification_type: notificationType,
      related_entity_type: 'case_proposals',
      related_entity_id: proposal.id,
      recipient_email: adminProfile.email,
      subject,
      body: `${emailBody}\n\nKommunens note:\n"${parsed.data.note}"`,
    })
  }

  const { data: proProfile } = await db.from('profiles').select('email').eq('id', proposal.professional_id).single()
  if (proProfile?.email) {
    const label = newStatus === 'DECLINED' ? 'afvist' : 'bedt om ændringer til'
    await sendNotification({
      db,
      notification_type: newStatus === 'DECLINED' ? 'PROPOSAL_DECLINED' : 'PROPOSAL_CHANGES_REQUESTED',
      related_entity_type: 'case_proposals',
      related_entity_id: proposal.id,
      recipient_profile_id: proposal.professional_id,
      recipient_email: proProfile.email,
      subject: 'Opdatering på et foreslået forløb — Kursskifte',
      body: `Kommunen har ${label} forslaget om et forløb du var foreslået til. Kursskifte følger op.`,
    })
  }

  return ok({ ok: true, status: newStatus })
}
