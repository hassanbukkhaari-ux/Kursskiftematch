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

  // A case's previous run can land at zero candidates (nobody in the pool
  // passed v_professionals_available's filters yet) and there was no way
  // back from that: it stays SCORED forever, which the "start a new run"
  // page treated as "already handled" and refused to let admin re-run —
  // even after the underlying professional data was fixed. Superseding any
  // still-open run for this case (never assigned, so nothing depends on it)
  // keeps exactly one live run per case and lets a re-run always proceed.
  await db
    .from('match_runs')
    .update({ status: 'CANCELLED' })
    .eq('case_id', caseId)
    .is('final_assignment_id', null)
    .in('status', ['INITIATED', 'SCORED'])

  const { data: complexityRows } = await db
    .from('case_complexity_factors')
    .select('*')
    .eq('case_id', caseId)
    .limit(1)

  const complexity = complexityRows?.[0] || null

  // The case's tagged problem areas (e.g. "Skolevægring") — used to weigh
  // candidates by relevant real-world experience, not just years worked.
  const { data: caseProblemAreas } = await (db as any)
    .from('case_problem_areas')
    .select('problem_areas(label_da)')
    .eq('case_id', caseId)
  const problemAreaLabels: string[] = (caseProblemAreas ?? [])
    .map((r: any) => r.problem_areas?.label_da)
    .filter(Boolean)

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

  // Each candidate's stated target-group experience (e.g. a teacher who has
  // selected "Skolevægring" on their profile), fetched in one batched query.
  const proIds = (professionals ?? []).map(p => p.id)
  const { data: targetGroupRows } = proIds.length > 0
    ? await (db as any)
        .from('professional_target_groups')
        .select('professional_id, target_group_types(name)')
        .in('professional_id', proIds)
    : { data: [] }
  const targetGroupsByPro = new Map<string, string[]>()
  for (const row of targetGroupRows ?? []) {
    const list = targetGroupsByPro.get(row.professional_id) ?? []
    if (row.target_group_types?.name) list.push(row.target_group_types.name)
    targetGroupsByPro.set(row.professional_id, list)
  }

  // Logistics fields (gender, transport, geography, acute readiness) aren't
  // exposed by v_professionals_available — fetched directly from
  // professionals, read-only, same pattern as the target-group query above.
  const { data: logisticsRows } = proIds.length > 0
    ? await (db as any)
        .from('professionals')
        .select('id, gender, experience_with_genders, can_transport_citizen, has_drivers_license, has_own_car, can_take_acute, geography')
        .in('id', proIds)
    : { data: [] }
  const logisticsByPro = new Map<string, {
    gender: string | null
    experience_with_genders: string[]
    can_transport_citizen: boolean
    has_drivers_license: boolean
    has_own_car: boolean
    can_take_acute: boolean
    geography: string[]
  }>()
  for (const row of logisticsRows ?? []) {
    logisticsByPro.set(row.id, {
      gender: row.gender,
      experience_with_genders: row.experience_with_genders ?? [],
      can_transport_citizen: !!row.can_transport_citizen,
      has_drivers_license: !!row.has_drivers_license,
      has_own_car: !!row.has_own_car,
      can_take_acute: !!row.can_take_acute,
      geography: row.geography ?? [],
    })
  }

  const caseInput = {
    complexity_level: caseRow.complexity_level as ComplexityLevel,
    weekly_hours: caseRow.weekly_hours,
    citizen_age_range: caseRow.citizen_age_range,
    violence: complexity?.violence ?? false,
    substance_use: complexity?.substance_use ?? false,
    criminality: complexity?.criminality ?? false,
    problem_area_labels: problemAreaLabels,
    urgency: caseRow.urgency,
    preferred_prof_gender: caseRow.preferred_prof_gender,
    citizen_gender: caseRow.citizen_gender,
    transport_needs: caseRow.transport_needs,
    geographical_area: caseRow.geographical_area,
  }

  const scored = (professionals || []).map(pro => {
    const logistics = logisticsByPro.get(pro.id)
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
        target_group_names: targetGroupsByPro.get(pro.id) ?? [],
        gender: logistics?.gender as 'MALE' | 'FEMALE' | 'OTHER' | null | undefined,
        experience_with_genders: logistics?.experience_with_genders as ('BOYS' | 'GIRLS')[] | undefined,
        can_transport_citizen: logistics?.can_transport_citizen,
        has_drivers_license: logistics?.has_drivers_license,
        has_own_car: logistics?.has_own_car,
        can_take_acute: logistics?.can_take_acute,
        geography: logistics?.geography,
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
