import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

interface ActivateAssignmentParams {
  db: SupabaseClient<Database>
  caseId: string
  professionalId: string
  // Who is responsible for this assignment existing — an admin for a manual
  // or algorithmic assign, or the admin who originally sent the proposal
  // when a municipality accepts it via their token link.
  assignedBy: string
  assignmentReason?: string | null
  auditMetadata?: Json
}

// Ends any existing active assignment for the case, creates the new one,
// activates the case, and notifies the professional. The one place every
// path that turns "this professional" into "the case's active assignment"
// converges — manual admin override, algorithmic assign, and a
// municipality accepting a proposal — so the activation behavior (and any
// future change to it) only needs to exist once.
export async function activateAssignment(params: ActivateAssignmentParams) {
  const { db, caseId, professionalId, assignedBy, assignmentReason, auditMetadata } = params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dba = db as any

  await dba
    .from('case_assignments')
    .update({ ended_at: new Date().toISOString() })
    .eq('case_id', caseId)
    .is('ended_at', null)

  const { data: assignment, error: assignError } = await dba
    .from('case_assignments')
    .insert({
      case_id: caseId,
      professional_id: professionalId,
      assigned_by: assignedBy,
      assignment_reason: assignmentReason ?? null,
    })
    .select()
    .single()

  if (assignError || !assignment) {
    throw new Error(assignError?.message || 'Failed to create assignment')
  }

  await dba.from('cases').update({ status: 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', caseId)

  await logAuditEvent(db, {
    event_type: 'PROFESSIONAL_ASSIGNED',
    actor_id: assignedBy,
    resource_type: 'case_assignments',
    resource_id: assignment.id,
    metadata: { case_id: caseId, professional_id: professionalId, ...(auditMetadata as object ?? {}) },
  })

  const { data: profile } = await db.from('profiles').select('email').eq('id', professionalId).single()
  if (profile?.email) {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'

    // The natural next step once a case goes active is that the contact
    // person and the municipality's sagsbehandler hold an opstartsmøde —
    // brief the contact person on the citizen before work starts. That
    // expectation previously lived nowhere in the system, so the professional
    // only learned they'd been assigned, not what to do next. Same
    // per-case-overrides-municipality-default precedence as the case page.
    const { data: caseRow } = await dba
      .from('cases')
      .select('municipality_id, intake_contact_name, intake_contact_email, intake_contact_phone')
      .eq('id', caseId)
      .single()
    const { data: muni } = caseRow?.municipality_id
      ? await dba.from('municipalities').select('sagsbehandler_name, sagsbehandler_email, sagsbehandler_phone').eq('id', caseRow.municipality_id).single()
      : { data: null }
    const sagsbehandlerName = caseRow?.intake_contact_name || muni?.sagsbehandler_name || null
    const sagsbehandlerEmail = caseRow?.intake_contact_email || muni?.sagsbehandler_email || null
    const sagsbehandlerPhone = caseRow?.intake_contact_phone || muni?.sagsbehandler_phone || null

    const startupLines = sagsbehandlerName || sagsbehandlerEmail || sagsbehandlerPhone
      ? [
          '',
          'Næste skridt: tag selv kontakt til kommunens sagsbehandler for at aftale et opstartsmøde, hvor I gennemgår borgeren sammen, inden forløbet starter.',
          '',
          `Sagsbehandler: ${[sagsbehandlerName, sagsbehandlerEmail, sagsbehandlerPhone].filter(Boolean).join(' · ')}`,
        ]
      : [
          '',
          'Næste skridt: tag kontakt til kommunens sagsbehandler for at aftale et opstartsmøde, inden forløbet starter. Sagsbehandlerens kontaktoplysninger mangler endnu på sagen — kontakt Kursskifte hvis du ikke kan finde dem.',
        ]

    await sendNotification({
      db,
      notification_type: 'CASE_CREATED',
      related_entity_type: 'case_assignments',
      related_entity_id: assignment.id,
      recipient_profile_id: professionalId,
      recipient_email: profile.email,
      subject: 'Du er tildelt en ny sag — Kursskifte',
      body: [
        'Du er blevet tildelt en ny sag.',
        '',
        `Se sagen og tilhørende dokumentation:\n${base}/dashboard/cases/${caseId}`,
        ...startupLines,
      ].join('\n'),
    })
  }

  return assignment
}
