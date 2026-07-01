import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'
import { Resend } from 'resend'

const CreateProposalSchema = z.object({
  professional_id: z.string().uuid(),
  proposal_note: z.string().optional(),
  estimated_hours_week: z.number().positive().optional(),
  send_now: z.boolean().default(false),
})

// GET /api/cases/:id/proposal — list proposals for a case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data, error } = await dba
      .from('case_proposals')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: false })

    if (error) return serverError()
    return ok(data)
  })
}

// POST /api/cases/:id/proposal — create (and optionally send) a proposal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateProposalSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Load case + verify it has intake contact
    const { data: caseRow } = await dba.from('cases').select('id, status, intake_contact_email, intake_contact_name').eq('id', id).single()
    if (!caseRow) return notFound('Case')
    if (!caseRow.intake_contact_email) return badRequest('This case was not created via intake — proposals are only for intake cases')
    if (!['MATCHED', 'PROPOSED'].includes(caseRow.status)) return badRequest('Case must be MATCHED or PROPOSED to create a proposal')

    // Verify professional exists
    const { data: pro } = await db.from('professionals').select('id').eq('id', parsed.data.professional_id).single()
    if (!pro) return notFound('Professional')

    const proposalInsert: Record<string, unknown> = {
      case_id: id,
      professional_id: parsed.data.professional_id,
      proposal_note: parsed.data.proposal_note || null,
      estimated_hours_week: parsed.data.estimated_hours_week || null,
      created_by: userId,
      status: 'DRAFT',
    }

    if (parsed.data.send_now) {
      proposalInsert.status = 'SENT'
      proposalInsert.sent_at = new Date().toISOString()
    }

    const { data: proposal, error: proposalError } = await dba
      .from('case_proposals')
      .insert(proposalInsert)
      .select()
      .single()

    if (proposalError || !proposal) return serverError(proposalError?.message)

    // Set case to PROPOSED
    await dba.from('cases').update({ status: 'PROPOSED', updated_at: new Date().toISOString() }).eq('id', id)

    if (parsed.data.send_now) {
      // Send anonymized email to municipality contact
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kursskiftematch.dk'
      const responseUrl = `${appUrl}/proposal/${proposal.response_token}`

      const emailBody = buildMunicipalityProposalEmail({
        contactName: caseRow.intake_contact_name || 'Sagsbehandler',
        proposalNote: parsed.data.proposal_note,
        estimatedHoursWeek: parsed.data.estimated_hours_week,
        responseUrl,
      })

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Kursskiftematch <noreply@kursskiftematch.dk>',
          to: caseRow.intake_contact_email,
          subject: 'Forslag til kontaktperson — Kursskiftematch',
          text: emailBody,
        })
      } catch (err) {
        console.error('[proposal] Failed to send municipality email:', err)
      }

      // Notify admin
      await sendNotification({
        db,
        notification_type: 'PROPOSAL_SENT',
        related_entity_type: 'case_proposals',
        related_entity_id: proposal.id,
        subject: 'Forslag sendt til kommunen — Kursskiftematch',
        body: `Et forslag er sendt til kommunen for sag ${id}.\n\nAfvent kommunens svar.`,
      })
    }

    await logAuditEvent(db, {
      event_type: parsed.data.send_now ? 'PROPOSAL_SENT' : 'PROPOSAL_CREATED',
      actor_id: userId,
      resource_type: 'case_proposals',
      resource_id: proposal.id,
      metadata: { case_id: id, professional_id: parsed.data.professional_id, sent: parsed.data.send_now },
    })

    return created(proposal)
  })
}

function buildMunicipalityProposalEmail(opts: {
  contactName: string
  proposalNote?: string
  estimatedHoursWeek?: number
  responseUrl: string
}): string {
  const lines = [
    `Kære ${opts.contactName},`,
    '',
    'Vi har nu gennemført den faglige kvalitetssikring og har identificeret en velegnet kontaktperson til den pågældende sag.',
    '',
    'Vi deler ikke kontaktpersonens navn eller kontaktoplysninger på dette tidspunkt — det sker først, når I bekræfter forslaget.',
    '',
  ]

  if (opts.estimatedHoursWeek) {
    lines.push(`Estimeret timeforbrug: ${opts.estimatedHoursWeek} timer/uge`, '')
  }

  if (opts.proposalNote) {
    lines.push('Bemærkning fra Kursskifte:', opts.proposalNote, '')
  }

  lines.push(
    'For at acceptere eller afvise forslaget, klik på linket nedenfor:',
    opts.responseUrl,
    '',
    'Linket er personligt og kan kun bruges én gang.',
    '',
    'Har I spørgsmål, er I velkomne til at kontakte os.',
    '',
    'Med venlig hilsen',
    'Kursskiftematch',
  )

  return lines.join('\n')
}
