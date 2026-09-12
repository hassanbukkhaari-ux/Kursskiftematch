import { NextRequest } from 'next/server'
import { ok, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/cases/:id/eligibility — diagnostic breakdown of exactly why each
// active professional does or doesn't pass v_professionals_available (the
// matching eligibility filter), mirrored read-only in application code —
// same "compare, don't touch the view" approach as the planned-hours SYS1
// comparison. Built because "0 candidates" alone gives admin nothing to act
// on: every gating condition here has silently excluded real candidates
// before (capacity/availability/case-load all default to values that make
// a freshly-registered professional invisible to matching), with no error
// anywhere pointing at which one.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const svc = createServiceClient() as any

    const { data: caseRow, error: caseError } = await svc.from('cases').select('id').eq('id', id).single()
    if (caseError || !caseRow) return notFound('Case')

    const { data: professionals, error: proError } = await svc
      .from('professionals')
      .select('id, availability_status, capacity_hours_week, max_concurrent_cases, profiles!inner(full_name)')
      .eq('status', 'ACTIVE')

    if (proError) return serverError(proError.message)

    const proIds = (professionals ?? []).map((p: any) => p.id)
    const { data: assignments, error: assignError } = proIds.length > 0
      ? await svc
          .from('case_assignments')
          .select('professional_id, cases!inner(weekly_hours, status)')
          .in('professional_id', proIds)
          .is('ended_at', null)
      : { data: [], error: null }

    if (assignError) return serverError(assignError.message)

    // Mirrors the view exactly: current_assignments counts every non-ended
    // assignment regardless of the case's own status; current_hours_assigned
    // only sums weekly_hours from assignments to a case that is ACTIVE.
    const assignmentCountByPro = new Map<string, number>()
    const hoursAssignedByPro = new Map<string, number>()
    for (const row of assignments ?? []) {
      assignmentCountByPro.set(row.professional_id, (assignmentCountByPro.get(row.professional_id) ?? 0) + 1)
      if (row.cases?.status === 'ACTIVE') {
        hoursAssignedByPro.set(row.professional_id, (hoursAssignedByPro.get(row.professional_id) ?? 0) + (row.cases?.weekly_hours ?? 0))
      }
    }

    const breakdown = (professionals ?? []).map((p: any) => {
      const currentAssignments = assignmentCountByPro.get(p.id) ?? 0
      const currentHoursAssigned = hoursAssignedByPro.get(p.id) ?? 0
      const availabilityOk = p.availability_status !== 'UNAVAILABLE'
      const caseLoadOk = currentAssignments < (p.max_concurrent_cases ?? 0)
      const capacityOk = currentHoursAssigned < (p.capacity_hours_week ?? 0)
      return {
        professional_id: p.id,
        full_name: p.profiles?.full_name ?? 'Ukendt',
        availability_status: p.availability_status,
        availability_ok: availabilityOk,
        current_assignments: currentAssignments,
        max_concurrent_cases: p.max_concurrent_cases,
        case_load_ok: caseLoadOk,
        current_hours_assigned: currentHoursAssigned,
        capacity_hours_week: p.capacity_hours_week,
        capacity_ok: capacityOk,
        eligible: availabilityOk && caseLoadOk && capacityOk,
      }
    })

    breakdown.sort((a: { eligible: boolean }, b: { eligible: boolean }) => Number(b.eligible) - Number(a.eligible))

    return ok({ breakdown })
  })
}
