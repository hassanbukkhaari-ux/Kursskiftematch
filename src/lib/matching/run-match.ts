import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ComplexityLevel } from '@/types/database'
import { scoreCandidate, ALGORITHM_VERSION } from './algorithm'

type DB = SupabaseClient<Database>

export interface RunMatchResult {
  runId: string
  candidateCount: number
  status: 'SCORED' | 'CANCELLED'
}

// Core matching logic — shared between admin-triggered and system-triggered (intake) runs.
// triggeredBy is the admin user ID, or null for system-triggered intake runs.
export async function runMatchForCase(
  db: DB,
  caseId: string,
  triggeredBy: string | null,
): Promise<RunMatchResult> {
  const { data: caseRow, error: caseError } = await db
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()

  if (caseError || !caseRow) throw new Error('Case not found')

  const { data: complexityRows } = await db
    .from('case_complexity_factors')
    .select('*')
    .eq('case_id', caseId)
    .limit(1)

  const complexity = complexityRows?.[0] || null

  const { data: matchRun, error: runError } = await db
    .from('match_runs')
    .insert({
      case_id: caseId,
      triggered_by: triggeredBy,
      algorithm_version: ALGORITHM_VERSION,
      status: 'INITIATED',
    })
    .select()
    .single()

  if (runError || !matchRun) throw new Error(runError?.message || 'Failed to create match run')

  const { data: professionals, error: proError } = await db
    .from('v_professionals_available')
    .select(`
      id, experience_years, target_age_groups, max_complexity_level,
      capacity_hours_week, max_concurrent_cases, availability_status,
      current_assignments, current_hours_assigned, qualifications
    `)

  if (proError) {
    await db.from('match_runs').update({ status: 'CANCELLED' }).eq('id', matchRun.id)
    return { runId: matchRun.id, candidateCount: 0, status: 'CANCELLED' }
  }

  const caseInput = {
    complexity_level: caseRow.complexity_level as ComplexityLevel,
    weekly_hours: caseRow.weekly_hours,
    citizen_age_range: caseRow.citizen_age_range,
    violence: complexity?.violence ?? false,
    substance_use: complexity?.substance_use ?? false,
    criminality: complexity?.criminality ?? false,
  }

  const scored = (professionals || []).map(pro => {
    const scores = scoreCandidate(
      {
        id: pro.id,
        experience_years: pro.experience_years,
        target_age_groups: pro.target_age_groups || [],
        max_complexity_level: pro.max_complexity_level as ComplexityLevel,
        capacity_hours_week: pro.capacity_hours_week,
        max_concurrent_cases: pro.max_concurrent_cases,
        current_assignments: Number(pro.current_assignments),
        current_hours_assigned: Number(pro.current_hours_assigned),
        has_certifications: Array.isArray(pro.qualifications) && pro.qualifications.length > 0,
        availability_status: pro.availability_status,
      },
      caseInput,
    )
    const { match_strengths: _ms, attention_points: _ap, ...dbScores } = scores
    return { match_run_id: matchRun.id, professional_id: pro.id, ...dbScores }
  })

  scored.sort((a, b) => b.overall_score - a.overall_score)
  const candidateRows = scored.map((c, i) => ({ ...c, rank: i + 1 }))

  if (candidateRows.length > 0) {
    const { error: insertError } = await db.from('match_candidates').insert(candidateRows)
    if (insertError) {
      await db.from('match_runs').update({ status: 'CANCELLED' }).eq('id', matchRun.id)
      return { runId: matchRun.id, candidateCount: 0, status: 'CANCELLED' }
    }
  }

  await db.from('match_runs').update({ status: 'SCORED' }).eq('id', matchRun.id)

  return { runId: matchRun.id, candidateCount: candidateRows.length, status: 'SCORED' }
}
