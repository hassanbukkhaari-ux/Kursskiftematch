import { NextRequest } from 'next/server'
import { ok, notFound, serverError, withAdminAuth } from '@/lib/api-response'

// GET /api/match-runs/:id/candidates — admin only, returns ranked candidates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify match run exists
    const { data: run, error: runError } = await db
      .from('match_runs')
      .select('id, status, case_id')
      .eq('id', id)
      .single()

    if (runError || !run) return notFound('Match run')

    const { data, error } = await db
      .from('match_candidates')
      .select(`
        id, rank, overall_score,
        qualifications_score, availability_score, capacity_score, complexity_fit_score, logistics_score,
        eligible, ineligibility_reason, current_hours_assigned,
        scoring_explanation,
        professional_id,
        professionals!inner(
          id, profession, experience_years, max_complexity_level,
          target_age_groups, qualifications, capacity_hours_week,
          max_concurrent_cases, availability_status, availability_days,
          profiles!inner(full_name, email)
        )
      `)
      .eq('match_run_id', id)
      .order('rank', { ascending: true })

    if (error) return serverError()
    return ok({ data, count: data?.length || 0, match_run: run })
  })
}
