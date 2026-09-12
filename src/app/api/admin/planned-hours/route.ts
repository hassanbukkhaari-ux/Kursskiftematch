import { NextRequest } from 'next/server'
import { ok, badRequest, withAdminAuth } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/planned-hours?week_start=YYYY-MM-DD — rollup of all professionals'
// planned hours for one week, for the admin oversight view.
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('week_start')
    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return badRequest('week_start (YYYY-MM-DD) er påkrævet')
    }

    const svc = createServiceClient() as any

    const weekEnd = new Date(`${weekStart}T00:00:00`)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().slice(0, 10)

    const [
      { data: planned, error: plannedError },
      { data: professionals, error: proError },
      { data: actual, error: actualError },
      { data: assignments, error: assignmentsError },
    ] = await Promise.all([
      svc
        .from('planned_hours')
        .select('id, case_id, professional_id, planned_hours, cases!inner(citizen_initials, citizen_age_range)')
        .eq('week_start', weekStart),
      svc
        .from('professionals')
        .select('id, capacity_hours_week, profiles!inner(full_name)')
        .eq('status', 'ACTIVE'),
      // Actual hours logged in the same calendar week, across all professionals —
      // shown alongside the plan so admin can see whether it was actually followed.
      svc
        .from('registered_hours')
        .select('professional_id, case_id, hours')
        .gte('work_date', weekStart)
        .lte('work_date', weekEndStr)
        .neq('status', 'REJECTED')
        .is('archived_at', null),
      // Read-only mirror of what v_professionals_available.current_hours_assigned
      // computes for matching (sum of active cases' declared weekly_hours per
      // assigned professional) — surfaced here for comparison only. This does
      // NOT change matching itself; see the "Fire briller" audit (SYS1) for why
      // that calculation stays untouched until it's been compared against real
      // data over time.
      svc
        .from('case_assignments')
        .select('professional_id, cases!inner(weekly_hours, status)')
        .is('ended_at', null),
    ])

    if (plannedError || proError || actualError || assignmentsError) {
      return badRequest((plannedError ?? proError ?? actualError ?? assignmentsError)?.message ?? 'Kunne ikke hente data')
    }

    const matchingHoursByPro = new Map<string, number>()
    for (const row of assignments ?? []) {
      if (row.cases?.status !== 'ACTIVE') continue
      matchingHoursByPro.set(row.professional_id, (matchingHoursByPro.get(row.professional_id) ?? 0) + (row.cases?.weekly_hours ?? 0))
    }
    const matchingHours = Array.from(matchingHoursByPro.entries()).map(([professional_id, hours]) => ({ professional_id, hours }))

    return ok({
      week_start: weekStart,
      planned: planned ?? [],
      professionals: professionals ?? [],
      actual: actual ?? [],
      matchingHours,
    })
  })
}
