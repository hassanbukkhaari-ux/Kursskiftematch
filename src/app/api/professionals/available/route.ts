import { NextRequest } from 'next/server'
import { ok, serverError, withAdminAuth } from '@/lib/api-response'

// GET /api/professionals/available — returns professionals eligible for matching
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const complexity = searchParams.get('complexity')
    const age_range = searchParams.get('age_range')
    const min_hours = parseFloat(searchParams.get('min_hours') || '0')

    const { data, error } = await db
      .from('v_professionals_available')
      .select(`
        id, profession, experience_years, max_complexity_level,
        target_age_groups, qualifications, capacity_hours_week,
        max_concurrent_cases, availability_status, availability_days,
        current_assignments, current_hours_assigned
      `)

    if (error) return serverError()

    let filtered = data || []

    // Apply server-side filters not expressible in the view
    if (complexity) {
      const ordinal: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
      const required = ordinal[complexity] || 0
      filtered = filtered.filter(p => (ordinal[p.max_complexity_level] || 0) >= required)
    }

    if (age_range) {
      filtered = filtered.filter(p => p.target_age_groups?.includes(age_range))
    }

    if (min_hours > 0) {
      filtered = filtered.filter(p =>
        (p.capacity_hours_week - p.current_hours_assigned) >= min_hours
      )
    }

    return ok({ data: filtered, count: filtered.length })
  })
}
