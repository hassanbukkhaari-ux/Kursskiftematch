import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

const AssignSchema = z.object({
  professional_id: z.string().uuid(),
  notes: z.string().optional(),
})

// POST /api/cases/:id/assign — manual assignment, bypassing the matching
// algorithm entirely. For when a real candidate exists but doesn't surface
// through automatic matching (e.g. their capacity/availability was never
// set up correctly) and admin needs to assign them directly. Active cases
// go through /handover instead, which enforces the overlap-meeting step.
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
      .select('id, status, profiles!inner(full_name, email)')
      .eq('id', parsed.data.professional_id)
      .single()

    if (proError || !pro) return notFound('Professional')
    if (pro.status !== 'ACTIVE') {
      return badRequest('Fagpersonen er ikke aktiv og kan ikke tildeles en sag.')
    }

    // End any existing active assignment for this case (defensive — matches
    // the same-shape logic in the algorithmic assign route).
    await db
      .from('case_assignments')
      .update({ ended_at: new Date().toISOString() })
      .eq('case_id', id)
      .is('ended_at', null)

    const { data: assignment, error: assignError } = await db
      .from('case_assignments')
      .insert({
        case_id: id,
        professional_id: parsed.data.professional_id,
        assigned_by: userId,
        assignment_reason: parsed.data.notes
          ? `Manuel tildeling: ${parsed.data.notes}`
          : 'Manuel tildeling',
      })
      .select()
      .single()

    if (assignError || !assignment) return serverError(assignError?.message)

    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any
    await dba.from('cases').update({ status: 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', id)

    await logAuditEvent(db, {
      event_type: 'PROFESSIONAL_ASSIGNED',
      actor_id: userId,
      resource_type: 'case_assignments',
      resource_id: assignment.id,
      metadata: { case_id: id, professional_id: parsed.data.professional_id, manual: true },
    })

    const proProfile = (pro as any).profiles
    if (proProfile?.email) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
      await sendNotification({
        db,
        notification_type: 'CASE_CREATED',
        related_entity_type: 'case_assignments',
        related_entity_id: assignment.id,
        recipient_profile_id: parsed.data.professional_id,
        recipient_email: proProfile.email,
        subject: 'Du er tildelt en ny sag — Kursskifte',
        body: `Du er blevet tildelt en ny sag.\n\nSe sagen og tilhørende dokumentation:\n${base}/dashboard/cases/${id}`,
      })
    }

    return ok(assignment)
  })
}
