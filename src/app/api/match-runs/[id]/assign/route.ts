import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

const AssignSchema = z.object({
  professional_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
  notes: z.string().optional(),
})

const PROFESSION_LABEL: Record<string, string> = {
  TEACHER: 'en lærer', PEDAGOGUE: 'en pædagog', NURSE: 'en sygeplejerske',
  PSYCHOLOGIST: 'en psykolog', SOCIAL_WORKER: 'en socialrådgiver',
  COUNSELOR: 'en vejleder', OTHER: 'en kvalificeret fagperson',
}

// POST /api/match-runs/:id/assign — human decision step (WF-003). Sends a
// proposal to the municipality instead of activating the case immediately:
// CLAUDE.md requires the municipality to be notified when a candidate is
// found and to remain an active actor in the case, and the schema for this
// (case_proposals.response_token) has existed since 20260701120000 without
// any application code ever using it. The case only becomes ACTIVE once the
// municipality accepts via their token link (see
// /api/municipality/proposals/[token]/respond).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = AssignSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Verify match run exists and is COMPLETED
    const { data: run, error: runError } = await db
      .from('match_runs')
      .select('id, status, case_id, final_assignment_id')
      .eq('id', id)
      .single()

    if (runError || !run) return notFound('Match run')
    if (run.status !== 'SCORED') return badRequest('Match run must be SCORED before assigning')
    if (run.final_assignment_id) return badRequest('Assignment has already been made for this match run')

    // Verify the candidate belongs to this match run
    const { data: candidate, error: candError } = await db
      .from('match_candidates')
      .select('id, professional_id, overall_score, eligible, ineligibility_reason')
      .eq('id', parsed.data.candidate_id)
      .eq('match_run_id', id)
      .single()

    if (candError || !candidate) return notFound('Candidate not found in this match run')
    if (candidate.professional_id !== parsed.data.professional_id) {
      return badRequest('professional_id does not match the specified candidate')
    }

    const { data: caseRow, error: caseError } = await dba
      .from('cases')
      .select('id, status, case_number, citizen_initials, citizen_age_range, complexity_level, weekly_hours, municipality_id, intake_contact_email, intake_contact_name')
      .eq('id', run.case_id)
      .single()

    if (caseError || !caseRow) return notFound('Case')
    if (!['OPEN', 'MATCHED', 'PROPOSED'].includes(caseRow.status)) {
      return badRequest('Sagen kan ikke få foreslået en kandidat i denne status.')
    }

    const { data: pro, error: proError } = await db
      .from('professionals')
      .select('id, profession, status')
      .eq('id', parsed.data.professional_id)
      .single()

    if (proError || !pro) return notFound('Professional')
    if (pro.status !== 'ACTIVE') {
      return badRequest('Fagpersonen er ikke aktiv og kan ikke foreslås til en sag.')
    }

    // Supersede any proposal still awaiting a response for this case —
    // there should only ever be one live token per case.
    await dba.from('case_proposals').update({ status: 'WITHDRAWN' }).eq('case_id', run.case_id).eq('status', 'SENT')

    const now = new Date().toISOString()
    const { data: proposal, error: proposalError } = await dba
      .from('case_proposals')
      .insert({
        case_id: run.case_id,
        professional_id: parsed.data.professional_id,
        proposal_note: parsed.data.notes || null,
        status: 'SENT',
        created_by: userId,
        sent_at: now,
      })
      .select()
      .single()

    if (proposalError || !proposal) return serverError(proposalError?.message || 'Failed to create proposal')

    await dba.from('cases').update({ status: 'PROPOSED', updated_at: now }).eq('id', run.case_id)

    await logAuditEvent(db, {
      event_type: 'PROPOSAL_SENT',
      actor_id: userId,
      resource_type: 'case_proposals',
      resource_id: proposal.id,
      metadata: {
        case_id: run.case_id,
        professional_id: parsed.data.professional_id,
        match_run_id: id,
        match_score: candidate.overall_score,
        proposed_despite_ineligibility: candidate.eligible === false ? candidate.ineligibility_reason : undefined,
      },
    })

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'

    // Notify the municipality's sagsbehandler — the per-case contact set at
    // intake takes priority over the municipality's default, same pattern
    // used in dashboard/cases/[id]/page.tsx. GDPR: never the professional's
    // name, only their role — and only the citizen's initials + age range.
    const { data: muni } = await db
      .from('municipalities')
      .select('sagsbehandler_name, sagsbehandler_email')
      .eq('id', caseRow.municipality_id)
      .single()

    const sagsbehandlerEmail = caseRow.intake_contact_email || muni?.sagsbehandler_email
    if (sagsbehandlerEmail) {
      const roleLabel = PROFESSION_LABEL[pro.profession] ?? PROFESSION_LABEL.OTHER
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
    }

    // Let the professional know they've been proposed — not yet assigned.
    const { data: profile } = await db.from('profiles').select('email').eq('id', parsed.data.professional_id).single()
    if (profile?.email) {
      await sendNotification({
        db,
        notification_type: 'PROPOSAL_SENT',
        related_entity_type: 'case_proposals',
        related_entity_id: proposal.id,
        recipient_profile_id: parsed.data.professional_id,
        recipient_email: profile.email,
        subject: 'Du er foreslået til en sag — Kursskifte',
        body: `Du er foreslået som kontaktperson til en sag. Kommunen skal godkende forslaget, før sagen bliver aktiv — du hører fra os igen når det sker.`,
      })
    }

    return ok(proposal)
  })
}
