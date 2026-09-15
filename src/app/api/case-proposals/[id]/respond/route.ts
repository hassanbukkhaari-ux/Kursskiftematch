import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, forbidden, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

const RespondSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
})

const PROFESSION_LABEL: Record<string, string> = {
  TEACHER: 'en lærer', PEDAGOGUE: 'en pædagog', NURSE: 'en sygeplejerske',
  PSYCHOLOGIST: 'en psykolog', SOCIAL_WORKER: 'en socialrådgiver',
  COUNSELOR: 'en vejleder', OTHER: 'en kvalificeret fagperson',
}

// POST /api/case-proposals/:id/respond — the professional confirms or
// declines a match offer (case_proposals.status = 'DRAFT'). Only on ACCEPT
// does the proposal actually go to the municipality — see
// /api/match-runs/[id]/assign, where the offer is created.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = RespondSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data: proposal, error: proposalError } = await dba
      .from('case_proposals')
      .select('id, case_id, professional_id, status, created_by')
      .eq('id', id)
      .single()

    if (proposalError || !proposal) return notFound('Proposal')
    if (proposal.professional_id !== userId) return forbidden()
    if (proposal.status !== 'DRAFT') {
      return badRequest('Dette match er ikke længere aktivt.')
    }

    const now = new Date().toISOString()

    if (parsed.data.action === 'DECLINE') {
      const { error: updateError } = await dba
        .from('case_proposals')
        .update({ status: 'PROFESSIONAL_DECLINED', responded_at: now })
        .eq('id', id)
      if (updateError) return serverError(updateError.message)

      await dba.from('cases').update({ status: 'OPEN', updated_at: now }).eq('id', proposal.case_id)

      await logAuditEvent(db, {
        event_type: 'MATCH_OFFER_DECLINED',
        actor_id: userId,
        resource_type: 'case_proposals',
        resource_id: proposal.id,
        metadata: { case_id: proposal.case_id },
      })

      const { data: adminProfile } = await db.from('profiles').select('email').eq('id', proposal.created_by).single()
      if (adminProfile?.email) {
        await sendNotification({
          db,
          notification_type: 'MATCH_OFFER_DECLINED',
          related_entity_type: 'cases',
          related_entity_id: proposal.case_id,
          recipient_email: adminProfile.email,
          subject: 'Fagperson er ikke ledig — vælg en ny kandidat — Kursskifte',
          body: `Den tilbudte kontaktperson er ikke ledig til sagen. Vælg en ny kandidat fra en ny match-kørsel.\n\nÅbn sagen:\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'}/admin/cases/${proposal.case_id}`,
        })
      }

      return ok({ ok: true, status: 'PROFESSIONAL_DECLINED' })
    }

    // ACCEPT — actually send the proposal to the municipality now.
    const { data: caseRow, error: caseError } = await dba
      .from('cases')
      .select('id, case_number, citizen_initials, citizen_age_range, municipality_id, intake_contact_email')
      .eq('id', proposal.case_id)
      .single()

    if (caseError || !caseRow) return notFound('Case')

    const { data: muni } = await db
      .from('municipalities')
      .select('sagsbehandler_email')
      .eq('id', caseRow.municipality_id)
      .single()

    const sagsbehandlerEmail = caseRow.intake_contact_email || muni?.sagsbehandler_email
    if (!sagsbehandlerEmail) {
      // Shouldn't happen — assign already validated this — but the case
      // could theoretically have changed since. Don't silently fail the
      // professional's accept; let admin know it needs manual attention.
      const { data: adminProfile } = await db.from('profiles').select('email').eq('id', proposal.created_by).single()
      if (adminProfile?.email) {
        await sendNotification({
          db,
          notification_type: 'DOCUMENT_ACTION_REQUIRED',
          related_entity_type: 'cases',
          related_entity_id: proposal.case_id,
          recipient_email: adminProfile.email,
          subject: 'Fagperson accepterede — men mangler kommune-kontakt — Kursskifte',
          body: `Fagpersonen har accepteret matchet, men sagen mangler en e-mail til kommunens sagsbehandler, så forslaget kunne ikke sendes. Tilføj kontaktoplysningen og send forslaget manuelt.\n\nÅbn sagen:\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'}/admin/cases/${proposal.case_id}`,
        })
      }
      return badRequest('Sagen mangler en e-mailadresse for kommunens sagsbehandler. Kursskifte er underrettet og følger op.')
    }

    const { data: pro } = await db.from('professionals').select('profession').eq('id', userId).single()

    const { error: updateError } = await dba
      .from('case_proposals')
      .update({ status: 'SENT', sent_at: now, responded_at: now })
      .eq('id', id)
    if (updateError) return serverError(updateError.message)

    await dba.from('cases').update({ status: 'PROPOSED', updated_at: now }).eq('id', proposal.case_id)

    await logAuditEvent(db, {
      event_type: 'MATCH_OFFER_ACCEPTED',
      actor_id: userId,
      resource_type: 'case_proposals',
      resource_id: proposal.id,
      metadata: { case_id: proposal.case_id },
    })

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'

    // GDPR: never the professional's name to the municipality, only their
    // role — and only the citizen's initials + age range.
    const roleLabel = PROFESSION_LABEL[pro?.profession ?? ''] ?? PROFESSION_LABEL.OTHER
    await sendNotification({
      db,
      notification_type: 'PROPOSAL_SENT',
      related_entity_type: 'case_proposals',
      related_entity_id: proposal.id,
      recipient_email: sagsbehandlerEmail,
      subject: `Kursskifte: Forslag til kontaktperson — sag ${caseRow.case_number ?? ''}`,
      body: [
        `Kursskifte har fundet ${roleLabel} til sagen for borger ${caseRow.citizen_initials} (${caseRow.citizen_age_range}).`,
        '',
        `Se forslaget og godkend eller afvis her:`,
        `${base}/municipality/proposals/${proposal.response_token}`,
      ].join('\n'),
    })

    const { data: adminProfile } = await db.from('profiles').select('email').eq('id', proposal.created_by).single()
    if (adminProfile?.email) {
      await sendNotification({
        db,
        notification_type: 'PROPOSAL_SENT',
        related_entity_type: 'case_proposals',
        related_entity_id: proposal.id,
        recipient_email: adminProfile.email,
        subject: 'Fagperson bekræftede — forslag sendt til kommunen — Kursskifte',
        body: `Fagpersonen bekræftede tilgængelighed, og forslaget er nu sendt til kommunen.\n\nÅbn sagen:\n${base}/admin/cases/${proposal.case_id}`,
      })
    }

    return ok({ ok: true, status: 'SENT' })
  })
}
