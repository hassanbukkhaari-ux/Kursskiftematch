import { NextRequest } from 'next/server'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

const PROFESSION_LABEL: Record<string, string> = {
  TEACHER: 'en lærer', PEDAGOGUE: 'en pædagog', NURSE: 'en sygeplejerske',
  PSYCHOLOGIST: 'en psykolog', SOCIAL_WORKER: 'en socialrådgiver',
  COUNSELOR: 'en vejleder', OTHER: 'en kvalificeret fagperson',
}

// POST /api/admin/proposals/:id/resend — re-sends the exact same proposal
// e-mail (same unchanged response_token, so the municipality's link still
// works) to the case's sagsbehandler, for when the original message was
// lost or never arrived. Does not touch case_proposals state — only ever
// resends, never re-creates or extends the proposal.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params
  return withAdminAuth(request, async (userId) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data: proposal, error: proposalError } = await dba
      .from('case_proposals')
      .select('id, case_id, professional_id, status, response_token')
      .eq('id', proposalId)
      .single()

    if (proposalError || !proposal) return notFound('Proposal')
    if (proposal.status !== 'SENT') {
      return badRequest(`Kan ikke gensende et forslag med status: ${proposal.status}`)
    }

    const { data: caseRow, error: caseError } = await dba
      .from('cases')
      .select('id, case_number, citizen_initials, citizen_age_range, municipality_id, intake_contact_email')
      .eq('id', proposal.case_id)
      .single()

    if (caseError || !caseRow) return notFound('Case')

    const { data: pro, error: proError } = await db
      .from('professionals')
      .select('profession')
      .eq('id', proposal.professional_id)
      .single()

    if (proError || !pro) return notFound('Professional')

    const { data: muni } = await db
      .from('municipalities')
      .select('sagsbehandler_email')
      .eq('id', caseRow.municipality_id)
      .single()

    const sagsbehandlerEmail = caseRow.intake_contact_email || muni?.sagsbehandler_email
    if (!sagsbehandlerEmail) {
      return badRequest('Ingen e-mailadresse er registreret for kommunens kontaktperson på denne sag.')
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
    const roleLabel = PROFESSION_LABEL[pro.profession] ?? PROFESSION_LABEL.OTHER

    await sendNotification({
      db,
      notification_type: 'PROPOSAL_SENT',
      related_entity_type: 'case_proposals',
      related_entity_id: proposal.id,
      recipient_email: sagsbehandlerEmail,
      subject: `Kursskifte: Forslag til kontaktperson — sag ${caseRow.case_number ?? ''} (gensendt)`,
      body: [
        `Kursskifte har fundet ${roleLabel} til sagen for borger ${caseRow.citizen_initials} (${caseRow.citizen_age_range}).`,
        '',
        `Se forslaget og godkend eller afvis her:`,
        `${base}/municipality/proposals/${proposal.response_token}`,
      ].join('\n'),
    })

    await logAuditEvent(db, {
      event_type: 'PROPOSAL_RESENT',
      actor_id: userId,
      resource_type: 'case_proposals',
      resource_id: proposal.id,
      metadata: { case_id: proposal.case_id, recipient_email: sagsbehandlerEmail },
    })

    return ok({ ok: true })
  })
}
