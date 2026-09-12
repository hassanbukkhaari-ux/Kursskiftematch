import type { ComplexityLevel } from '@/types/database'

const COMPLEXITY_ORDINAL: Record<ComplexityLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
}

export interface ProfessionalInput {
  id: string
  experience_years: number
  target_age_groups: string[]
  max_complexity_level: ComplexityLevel
  capacity_hours_week: number
  max_concurrent_cases: number
  current_assignments: number
  current_hours_assigned: number
  has_certifications: boolean
  availability_status: string
  // Target-group areas the professional has stated experience with (e.g.
  // "Skolevægring"). Optional — omitted or empty means no signal either way.
  target_group_names?: string[]
  // Logistics fields from the professional's own profile — all optional.
  // Each only affects scoring when the case actually states a matching
  // requirement; a professional who hasn't filled one in is never
  // penalized for missing data, only for a stated requirement they can't meet.
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
  experience_with_genders?: ('BOYS' | 'GIRLS')[]
  can_transport_citizen?: boolean
  has_drivers_license?: boolean
  has_own_car?: boolean
  can_take_acute?: boolean
  geography?: string[]
}

export interface CaseInput {
  complexity_level: ComplexityLevel
  weekly_hours: number
  citizen_age_range: string
  violence: boolean
  substance_use: boolean
  criminality: boolean
  // The case's tagged problem areas, as Danish labels (e.g. "Skolevægring").
  // Uses the same controlled vocabulary as target_group_names by design —
  // problem_areas and target_group_types share several identical labels.
  problem_area_labels?: string[]
  // Logistics requirements from the case — all optional. Each is only
  // "applicable" (affects logistics_score) when actually stated; an unset
  // requirement never penalizes any candidate.
  urgency?: 'NORMAL' | 'HURTIG' | 'AKUT'
  preferred_prof_gender?: 'MALE' | 'FEMALE' | 'NO_PREF' | null
  citizen_gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
  transport_needs?: 'JA' | 'NEJ' | null
  geographical_area?: string | null
}

export interface MatchScores {
  qualifications_score: number
  availability_score: number
  capacity_score: number
  complexity_fit_score: number
  // null when the case states no logistics requirement the professional's
  // profile has a corresponding answer for — excluded from overall_score
  // entirely rather than counted as a penalty or a free pass.
  logistics_score: number | null
  overall_score: number
  scoring_explanation: string
  match_strengths: string[]
  attention_points: string[]
}

export function scoreCandidate(
  professional: ProfessionalInput,
  caseData: CaseInput
): MatchScores {
  const qualifications_score = computeQualificationsScore(professional, caseData)
  const availability_score = computeAvailabilityScore(professional, caseData)
  const capacity_score = computeCapacityScore(professional, caseData)
  const complexity_fit_score = computeComplexityFitScore(professional, caseData)
  const logistics_score = computeLogisticsScore(professional, caseData)

  // logistics_score only joins the average when the case actually states a
  // requirement it can speak to — a pair with none of that data behaves
  // identically to before this dimension existed (same /4 average).
  const dimensions = [qualifications_score, availability_score, capacity_score, complexity_fit_score]
  if (logistics_score !== null) dimensions.push(logistics_score)
  const overall_score = parseFloat(
    (dimensions.reduce((sum, d) => sum + d, 0) / dimensions.length).toFixed(2)
  )

  const scoring_explanation = buildExplanation(professional, caseData, {
    qualifications_score,
    availability_score,
    capacity_score,
    complexity_fit_score,
    logistics_score,
    overall_score,
  })

  const { match_strengths, attention_points } = buildStrengthsAndAttentionPoints({
    qualifications_score,
    availability_score,
    capacity_score,
    complexity_fit_score,
    logistics_score,
    professional,
    caseData,
  })

  return {
    qualifications_score,
    availability_score,
    capacity_score,
    complexity_fit_score,
    logistics_score,
    overall_score,
    scoring_explanation,
    match_strengths,
    attention_points,
  }
}

function computeQualificationsScore(professional: ProfessionalInput, caseData: CaseInput): number {
  const experience_score = Math.min(professional.experience_years * 4, 50)
  const relevance_score = computeRelevanceScore(professional, caseData)
  const certification_score = professional.has_certifications ? 25 : 0
  return Math.min(experience_score + relevance_score + certification_score, 100)
}

// What the professional actually works with day to day, weighed against
// what this specific case needs — e.g. a teacher's stated experience with
// "Skolevægring" should count for a case tagged with that same problem area.
// When there's nothing to compare (no tags on either side), this returns the
// same flat 25 the score used before relevance was measurable, so existing
// callers without tag data see no change in behavior.
function computeRelevanceScore(professional: ProfessionalInput, caseData: CaseInput): number {
  const caseLabels = caseData.problem_area_labels ?? []
  const proGroups = professional.target_group_names ?? []

  if (caseLabels.length === 0 || proGroups.length === 0) return 25

  const proGroupSet = new Set(proGroups)
  const overlap = caseLabels.filter(label => proGroupSet.has(label)).length
  const coverage = overlap / caseLabels.length
  return Math.round(coverage * 25)
}

function computeAvailabilityScore(
  professional: ProfessionalInput,
  caseData: CaseInput
): number {
  const remaining_hours =
    professional.capacity_hours_week - professional.current_hours_assigned
  const capacity_ratio = remaining_hours / caseData.weekly_hours
  const capacity_score = Math.min(capacity_ratio * 100, 100)

  const concurrent_load = professional.current_assignments / professional.max_concurrent_cases
  const load_penalty = concurrent_load * 20

  return Math.max(parseFloat((capacity_score - load_penalty).toFixed(2)), 0)
}

function computeCapacityScore(
  professional: ProfessionalInput,
  caseData: CaseInput
): number {
  const pro_ordinal = COMPLEXITY_ORDINAL[professional.max_complexity_level]
  const case_ordinal = COMPLEXITY_ORDINAL[caseData.complexity_level]
  const ordinal_margin = pro_ordinal - case_ordinal

  if (ordinal_margin < 0) return 0
  if (ordinal_margin === 0) return 50
  return Math.min(50 + ordinal_margin * 25, 100)
}

function computeComplexityFitScore(
  professional: ProfessionalInput,
  caseData: CaseInput
): number {
  const age_match = professional.target_age_groups.includes(caseData.citizen_age_range) ? 50 : 0
  const exp_fit = Math.min(professional.experience_years * 5, 50)

  const has_high_risk = caseData.violence || caseData.substance_use || caseData.criminality
  const pro_ordinal = COMPLEXITY_ORDINAL[professional.max_complexity_level]
  const special_skills = has_high_risk && pro_ordinal >= 3 ? 25 : 0

  return Math.min(age_match + exp_fit + special_skills, 100)
}

interface LogisticsCheck {
  label: string
  ok: boolean
}

// Every point of contact between a case's stated requirements and a
// professional's own profile that has nothing to do with qualifications or
// raw capacity: gender preference, transport, acute readiness, geography.
// Each check only applies when the case actually states the requirement —
// a professional who hasn't filled in an optional field is never treated
// as failing it, only as not applicable. Returns null (excluded from
// overall_score) when nothing on the case side applies to this candidate.
function computeLogisticsChecks(professional: ProfessionalInput, caseData: CaseInput): LogisticsCheck[] {
  const checks: LogisticsCheck[] = []

  if (caseData.transport_needs === 'JA') {
    const canTransport = !!(professional.can_transport_citizen && professional.has_drivers_license && professional.has_own_car)
    checks.push({ label: 'Kan transportere borgeren', ok: canTransport })
  }

  if (caseData.urgency === 'AKUT') {
    checks.push({ label: 'Kan tage akutte sager', ok: !!professional.can_take_acute })
  }

  if (caseData.preferred_prof_gender && caseData.preferred_prof_gender !== 'NO_PREF') {
    checks.push({ label: 'Opfylder kommunens køns-ønske', ok: professional.gender === caseData.preferred_prof_gender })
  }

  if (caseData.citizen_gender === 'MALE' || caseData.citizen_gender === 'FEMALE') {
    const experience = professional.experience_with_genders ?? []
    if (experience.length > 0) {
      const wanted = caseData.citizen_gender === 'MALE' ? 'BOYS' : 'GIRLS'
      checks.push({ label: 'Erfaring med borgerens køn', ok: experience.includes(wanted) })
    }
  }

  if (caseData.geographical_area) {
    const geography = professional.geography ?? []
    if (geography.length > 0) {
      checks.push({ label: 'Dækker sagens geografi', ok: geography.includes(caseData.geographical_area) })
    }
  }

  return checks
}

function computeLogisticsScore(professional: ProfessionalInput, caseData: CaseInput): number | null {
  const checks = computeLogisticsChecks(professional, caseData)
  if (checks.length === 0) return null
  const passed = checks.filter(c => c.ok).length
  return Math.round((passed / checks.length) * 100)
}

function buildExplanation(
  professional: ProfessionalInput,
  caseData: CaseInput,
  scores: Omit<MatchScores, 'scoring_explanation' | 'match_strengths' | 'attention_points'>
): string {
  const parts: string[] = []

  if (scores.qualifications_score >= 80) {
    parts.push(`Stærke faglige kvalifikationer (${professional.experience_years} års erfaring)`)
  } else if (scores.qualifications_score >= 60) {
    parts.push(`God faglig baggrund (${professional.experience_years} års erfaring)`)
  } else {
    parts.push(`Begrænset erfaring (${professional.experience_years} år)`)
  }

  const caseLabels = caseData.problem_area_labels ?? []
  const proGroups = professional.target_group_names ?? []
  if (caseLabels.length > 0 && proGroups.length > 0) {
    const matchedLabels = caseLabels.filter(label => proGroups.includes(label))
    parts.push(
      matchedLabels.length > 0
        ? `erfaring med sagens problemområder (${matchedLabels.join(', ')})`
        : 'ingen dokumenteret erfaring med sagens specifikke problemområder'
    )
  }

  const remaining = professional.capacity_hours_week - professional.current_hours_assigned
  if (scores.availability_score >= 80) {
    parts.push(`god kapacitet (${remaining.toFixed(1)}/${professional.capacity_hours_week} timer tilgængeligt)`)
  } else if (scores.availability_score >= 50) {
    parts.push(`begrænset kapacitet (${remaining.toFixed(1)} timer ledig)`)
  } else {
    parts.push(`lav kapacitet (${remaining.toFixed(1)} timer ledig)`)
  }

  if (scores.capacity_score >= 75) {
    parts.push('god kompleksitetsmatch')
  } else if (scores.capacity_score === 50) {
    parts.push('borderline kompleksitetsmatch')
  } else if (scores.capacity_score === 0) {
    parts.push('opfylder ikke kompleksitetskrav')
  }

  const ageMatch = professional.target_age_groups.includes(caseData.citizen_age_range)
  if (ageMatch) {
    parts.push(`aldersgruppe-match (${caseData.citizen_age_range})`)
  }

  if (scores.logistics_score !== null) {
    const failed = computeLogisticsChecks(professional, caseData).filter(c => !c.ok)
    parts.push(
      failed.length === 0
        ? 'opfylder alle logistiske krav (transport/køn/geografi/akut)'
        : `opfylder ikke: ${failed.map(c => c.label.toLowerCase()).join(', ')}`
    )
  }

  return parts.join(' + ') + '.'
}

function buildStrengthsAndAttentionPoints(params: {
  qualifications_score: number
  availability_score: number
  capacity_score: number
  complexity_fit_score: number
  logistics_score: number | null
  professional: ProfessionalInput
  caseData: CaseInput
}): { match_strengths: string[]; attention_points: string[] } {
  const { qualifications_score, availability_score, capacity_score, complexity_fit_score, professional, caseData } = params
  const strengths: string[] = []
  const attention: string[] = []

  if (qualifications_score >= 80) {
    strengths.push(`Stærke kvalifikationer inden for feltet (${professional.experience_years} år)`)
  }
  if (availability_score >= 80) {
    strengths.push('God tilgængelighed og kapacitet')
  }
  if (capacity_score >= 75) {
    strengths.push('Passer godt til sagens kompleksitetsniveau')
  }
  if (complexity_fit_score >= 80) {
    strengths.push('Erfaring med den relevante aldersgruppe og kompleksitetstype')
  }

  const caseLabels = caseData.problem_area_labels ?? []
  const proGroups = professional.target_group_names ?? []
  if (caseLabels.length > 0 && proGroups.length > 0) {
    const matchedLabels = caseLabels.filter(label => proGroups.includes(label))
    if (matchedLabels.length > 0) {
      strengths.push(`Dokumenteret erfaring med sagens problemområder: ${matchedLabels.join(', ')}`)
    } else {
      attention.push('Ingen dokumenteret erfaring med sagens problemområder')
    }
  }

  if (qualifications_score < 50) {
    attention.push('Begrænset erfaring — overvej mere erfaren fagperson')
  }
  if (availability_score < 40) {
    attention.push('Begrænset kapacitet denne uge')
  }
  if (capacity_score === 0) {
    attention.push('Overstiger fagpersonens maksimale kompleksitetsniveau')
  }
  if (capacity_score === 50) {
    attention.push('Borderline kompleksitetsmatch — monitor tæt')
  }
  if (!professional.target_age_groups.includes(caseData.citizen_age_range)) {
    attention.push(`Aldersgruppe ${caseData.citizen_age_range} er ikke i fagpersonens primærgruppe`)
  }

  const logisticsChecks = computeLogisticsChecks(professional, caseData)
  for (const check of logisticsChecks) {
    if (check.ok) {
      strengths.push(check.label)
    } else {
      attention.push(`${check.label} — ikke opfyldt`)
    }
  }

  return { match_strengths: strengths, attention_points: attention }
}

export function calculateComplexityLevel(factors: {
  mental_health: boolean
  family_instability: boolean
  school: boolean
  violence: boolean
  substance_use: boolean
  criminality: boolean
  multiple_agencies: boolean
}): ComplexityLevel {
  const count = [
    factors.mental_health,
    factors.family_instability,
    factors.school,
    factors.violence,
    factors.substance_use,
    factors.criminality,
    factors.multiple_agencies,
  ].filter(Boolean).length

  if (factors.violence && factors.substance_use) return 'CRITICAL'
  if (factors.violence && factors.criminality) return 'CRITICAL'
  if (factors.family_instability && factors.multiple_agencies && count >= 3) return 'HIGH'
  if (count >= 6) return 'CRITICAL'
  if (count >= 4) return 'HIGH'
  if (count >= 2) return 'MEDIUM'
  return 'LOW'
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Fremragende'
  if (score >= 60) return 'God'
  if (score >= 40) return 'Acceptabel'
  if (score >= 20) return 'Svag'
  return 'Ikke egnet'
}

export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 60) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

export const ALGORITHM_VERSION = '1.3'
