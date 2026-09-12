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

    const [{ data: planned, error: plannedError }, { data: professionals, error: proError }] = await Promise.all([
      svc
        .from('planned_hours')
        .select('id, case_id, professional_id, planned_hours, cases!inner(citizen_initials, citizen_age_range)')
        .eq('week_start', weekStart),
      svc
        .from('professionals')
        .select('id, capacity_hours_week, profiles!inner(full_name)')
        .eq('status', 'ACTIVE'),
    ])

    if (plannedError || proError) {
      return badRequest((plannedError ?? proError)?.message ?? 'Kunne ikke hente data')
    }

    return ok({ week_start: weekStart, planned: planned ?? [], professionals: professionals ?? [] })
  })
}
