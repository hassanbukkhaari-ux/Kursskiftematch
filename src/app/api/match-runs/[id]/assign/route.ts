import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const AssignSchema = z.object({
  professional_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
  notes: z.string().optional(),
})

// POST /api/match-runs/:id/assign — human decision step (WF-003)
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
      .select('id, professional_id, overall_score')
      .eq('id', parsed.data.candidate_id)
      .eq('match_run_id', id)
      .single()

    if (candError || !candidate) return notFound('Candidate not found in this match run')
    if (candidate.professional_id !== parsed.data.professional_id) {
      return badRequest('professional_id does not match the specified candidate')
    }

    // End any existing active assignment for this case
    await db
      .from('case_assignments')
      .update({ ended_at: new Date().toISOString() })
      .eq('case_id', run.case_id)
      .is('ended_at', null)

    // Create the new assignment
    const { data: assignment, error: assignError } = await db
      .from('case_assignments')
      .insert({
        case_id: run.case_id,
        professional_id: parsed.data.professional_id,
        assigned_by: userId,
        assignment_reason: parsed.data.notes || null,
      })
      .select()
      .single()

    if (assignError || !assignment) return serverError(assignError?.message)

    // Determine target case status: intake cases wait for municipality proposal acceptance
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const { data: caseRow } = await dba.from('cases').select('intake_contact_email').eq('id', run.case_id).single()
    const isIntakeCase = !!(caseRow?.intake_contact_email)
    const newCaseStatus = isIntakeCase ? 'MATCHED' : 'ACTIVE'

    // Link assignment back to match run + update case status
    await Promise.all([
      db.from('match_runs')
        .update({
          final_assignment_id: assignment.id,
          selected_by: userId,
          selected_at: new Date().toISOString(),
          assigned_at: new Date().toISOString(),
          status: 'ASSIGNED',
        })
        .eq('id', id),
      dba.from('cases')
        .update({ status: newCaseStatus, updated_at: new Date().toISOString() })
        .eq('id', run.case_id),
    ])

    await logAuditEvent(db, {
      event_type: 'PROFESSIONAL_ASSIGNED',
      actor_id: userId,
      resource_type: 'case_assignments',
      resource_id: assignment.id,
      metadata: {
        case_id: run.case_id,
        professional_id: parsed.data.professional_id,
        match_run_id: id,
        match_score: candidate.overall_score,
      },
    })

    return ok(assignment)
  })
}
