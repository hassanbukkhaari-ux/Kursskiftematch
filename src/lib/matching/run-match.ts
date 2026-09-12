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

  // Query the base table directly, not v_professionals_available — every
  // active professional is scored and stored here, eligible or not.
  // Silently dropping anyone who failed availability/case-load/capacity
  // meant admin had no way to see, search for, or manually assign a
  // candidate the algorithm excluded, and a run that excluded everyone
  // looked identical to a run with genuinely no professionals at all.
  const { data: professionals, error: proError } = await db
    .from('professionals')
    .select(`
      id, experience_years, target_age_groups, max_complexity_level,
      capacity_hours_week, max_concurrent_cases, availability_status,
      qualifications, gender, experience_with_genders, can_transport_citizen,
      has_drivers_license, has_own_car, can_take_acute, geography
    `)
    .eq('status', 'ACTIVE')

  if (proError) {
    await db.from('match_runs').update({ status: 'CANCELLED' }).eq('id', matchRun.id)
    return { runId: matchRun.id, candidateCount: 0, status: 'CANCELLED' }
  }

  const proIds = (professionals ?? []).map(p => p.id)

  // Each candidate's stated target-group experience (e.g. a teacher who has
  // selected "Skolevægring" on their profile), fetched in one batched query.
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

  // Each candidate's stated languages, fetched the same way as target-group
  // experience — a batched join against the lookup table's names.
  const { data: languageRows } = proIds.length > 0
    ? await (db as any)
        .from('professional_languages')
        .select('professional_id, language_types(name)')
        .in('professional_id', proIds)
    : { data: [] }
  const languagesByPro = new Map<string, string[]>()
  for (const row of languageRows ?? []) {
    const list = languagesByPro.get(row.professional_id) ?? []
    if (row.language_types?.name) list.push(row.language_types.name)
    languagesByPro.set(row.professional_id, list)
  }

  // current_assignments / current_hours_assigned — mirrors exactly what
  // v_professionals_available computes (every non-ended assignment counts
  // toward the case-load limit; only assignments to an ACTIVE-status case
  // count toward hours), just computed here instead of through the view,
  // since we're no longer filtering through it.
  const { data: assignmentRows } = proIds.length > 0
    ? await (db as any)
        .from('case_assignments')
        .select('professional_id, cases!inner(weekly_hours, status)')
        .in('professional_id', proIds)
        .is('ended_at', null)
    : { data: [] }
  const assignmentCountByPro = new Map<string, number>()
  const hoursAssignedByPro = new Map<string, number>()
  for (const row of assignmentRows ?? []) {
    assignmentCountByPro.set(row.professional_id, (assignmentCountByPro.get(row.professional_id) ?? 0) + 1)
    if (row.cases?.status === 'ACTIVE') {
      hoursAssignedByPro.set(row.professional_id, (hoursAssignedByPro.get(row.professional_id) ?? 0) + (row.cases?.weekly_hours ?? 0))
    }
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
    required_languages: caseRow.required_languages,
  }

  const scored = (professionals || []).map(pro => {
    const currentAssignments = assignmentCountByPro.get(pro.id) ?? 0
    const currentHoursAssigned = hoursAssignedByPro.get(pro.id) ?? 0

    // Same three conditions v_professionals_available's HAVING clause
    // enforces — computed here as metadata instead of a hard exclusion, so
    // admin can see exactly why and still choose to assign anyway.
    const availabilityOk = pro.availability_status !== 'UNAVAILABLE'
    const caseLoadOk = currentAssignments < (pro.max_concurrent_cases ?? 0)
    const capacityOk = currentHoursAssigned < (pro.capacity_hours_week ?? 0)
    const eligible = availabilityOk && caseLoadOk && capacityOk

    const reasons: string[] = []
    if (!availabilityOk) reasons.push('Ikke tilgængelig')
    if (!caseLoadOk) reasons.push(`Nået maks. antal sager (${currentAssignments}/${pro.max_concurrent_cases ?? 0})`)
    if (!capacityOk) reasons.push(`Ingen ledig kapacitet (${currentHoursAssigned}/${pro.capacity_hours_week ?? 0} t)`)

    const scores = scoreCandidate(
      {
        id: pro.id,
        experience_years: pro.experience_years,
        target_age_groups: pro.target_age_groups || [],
        max_complexity_level: pro.max_complexity_level as ComplexityLevel,
        capacity_hours_week: pro.capacity_hours_week,
        max_concurrent_cases: pro.max_concurrent_cases,
        current_assignments: currentAssignments,
        current_hours_assigned: currentHoursAssigned,
        has_certifications: Array.isArray(pro.qualifications) && pro.qualifications.length > 0,
        availability_status: pro.availability_status,
        target_group_names: targetGroupsByPro.get(pro.id) ?? [],
        gender: pro.gender as 'MALE' | 'FEMALE' | 'OTHER' | null | undefined,
        experience_with_genders: pro.experience_with_genders as ('BOYS' | 'GIRLS')[] | undefined,
        can_transport_citizen: pro.can_transport_citizen ?? undefined,
        has_drivers_license: pro.has_drivers_license ?? undefined,
        has_own_car: pro.has_own_car ?? undefined,
        can_take_acute: pro.can_take_acute ?? undefined,
        geography: pro.geography ?? undefined,
        languages: languagesByPro.get(pro.id) ?? undefined,
      },
      caseInput,
    )
    const { match_strengths: _ms, attention_points: _ap, ...dbScores } = scores
    return {
      match_run_id: matchRun.id,
      professional_id: pro.id,
      ...dbScores,
      eligible,
      ineligibility_reason: reasons.length > 0 ? reasons.join('; ') : null,
      current_hours_assigned: currentHoursAssigned,
    }
  })

  // Eligible candidates first (ranked by score), so the ordinary case still
  // reads exactly as before; everyone else follows, also ranked by score,
  // so a strong-but-currently-unavailable candidate isn't buried under a
  // weak one who happens to be free.
  scored.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1
    return b.overall_score - a.overall_score
  })
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
