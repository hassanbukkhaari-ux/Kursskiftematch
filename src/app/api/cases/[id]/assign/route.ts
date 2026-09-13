import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { activateAssignment } from '@/lib/cases/activate-assignment'

const AssignSchema = z.object({
  professional_id: z.string().uuid(),
  notes: z.string().optional(),
})

// POST /api/cases/:id/assign — manual assignment, bypassing the matching
// algorithm (and the municipality proposal step it goes through) entirely.
// For when a real candidate exists but doesn't surface through automatic
// matching (e.g. their capacity/availability was never set up correctly)
// and admin needs to assign them directly. Active cases go through
// /handover instead, which enforces the overlap-meeting step.
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

    const { data: caseRow, error: caseError } = await db
      .from('cases')
      .select('id, status')
      .eq('id', id)
      .single()

    if (caseError || !caseRow) return notFound('Case')
    if (!['OPEN', 'MATCHED', 'PROPOSED'].includes(caseRow.status)) {
      return badRequest(
        caseRow.status === 'ACTIVE'
          ? 'Sagen har allerede en kontaktperson — brug Overdragelse for at skifte.'
          : 'Sagen kan ikke tildeles i denne status.'
      )
    }

    const { data: pro, error: proError } = await db
      .from('professionals')
      .select('id, status')
      .eq('id', parsed.data.professional_id)
      .single()

    if (proError || !pro) return notFound('Professional')
    if (pro.status !== 'ACTIVE') {
      return badRequest('Fagpersonen er ikke aktiv og kan ikke tildeles en sag.')
    }

    // A manual assign supersedes any proposal awaiting a municipality
    // response — withdraw it so a stale token link can't still act on it.
    await (db as any)
      .from('case_proposals')
      .update({ status: 'WITHDRAWN' })
      .eq('case_id', id)
      .eq('status', 'SENT')

    let assignment
    try {
      assignment = await activateAssignment({
        db,
        caseId: id,
        professionalId: parsed.data.professional_id,
        assignedBy: userId,
        assignmentReason: parsed.data.notes ? `Manuel tildeling: ${parsed.data.notes}` : 'Manuel tildeling',
        auditMetadata: { manual: true },
      })
    } catch (e) {
      return serverError(e instanceof Error ? e.message : 'Failed to assign')
    }

    return ok(assignment)
  })
}
