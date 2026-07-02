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
}

export interface CaseInput {
  complexity_level: ComplexityLevel
  weekly_hours: number
  citizen_age_range: string
  violence: boolean
  substance_use: boolean
  criminality: boolean
}

export interface MatchScores {
  qualifications_score: number
  availability_score: number
  capacity_score: number
  complexity_fit_score: number
  overall_score: number
  scoring_explanation: string
  match_strengths: string[]
  attention_points: string[]
}

export function scoreCandidate(
  professional: ProfessionalInput,
  caseData: CaseInput
): MatchScores {
  const qualifications_score = computeQualificationsScore(professional)
  const availability_score = computeAvailabilityScore(professional, caseData)
  const capacity_score = computeCapacityScore(professional, caseData)
  const complexity_fit_score = computeComplexityFitScore(professional, caseData)

  const overall_score = parseFloat(
    (
      (qualifications_score + availability_score + capacity_score + complexity_fit_score) / 4
    ).toFixed(2)
  )

  const scoring_explanation = buildExplanation(professional, caseData, {
    qualifications_score,
    availability_score,
    capacity_score,
    complexity_fit_score,
    overall_score,
  })

  const { match_strengths, attention_points } = buildStrengthsAndAttentionPoints({
    qualifications_score,
    availability_score,
    capacity_score,
    complexity_fit_score,
    professional,
    caseData,
  })

  return {
    qualifications_score,
    availability_score,
    capacity_score,
    complexity_fit_score,
    overall_score,
    scoring_explanation,
    match_strengths,
    attention_points,
  }
}

function computeQualificationsScore(professional: ProfessionalInput): number {
  const experience_score = Math.min(professional.experience_years * 4, 50)
  const profession_score = 25 // MVP v1.0: all profession types eligible for all cases
  const certification_score = professional.has_certifications ? 25 : 0
  return Math.min(experience_score + profession_score + certification_score, 100)
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

  return parts.join(' + ') + '.'
}

function buildStrengthsAndAttentionPoints(params: {
  qualifications_score: number
  availability_score: number
  capacity_score: number
  complexity_fit_score: number
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
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Acceptable'
  if (score >= 20) return 'Poor'
  return 'Not suitable'
}

export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 60) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

export const ALGORITHM_VERSION = '1.1'
