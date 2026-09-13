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
    await sendNotification({
      db,
      notification_type: 'CASE_CREATED',
      related_entity_type: 'case_assignments',
      related_entity_id: assignment.id,
      recipient_profile_id: professionalId,
      recipient_email: profile.email,
      subject: 'Du er tildelt en ny sag — Kursskifte',
      body: `Du er blevet tildelt en ny sag.\n\nSe sagen og tilhørende dokumentation:\n${base}/dashboard/cases/${caseId}`,
    })
  }

  return assignment
}
