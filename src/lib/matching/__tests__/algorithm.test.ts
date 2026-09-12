import { describe, it, expect } from 'vitest'
import {
  scoreCandidate,
  calculateComplexityLevel,
  type ProfessionalInput,
  type CaseInput,
} from '../algorithm'

// ================================================================
// Test data helpers
// ================================================================

const baseProfessional = (overrides: Partial<ProfessionalInput> = {}): ProfessionalInput => ({
  id: 'test-pro',
  experience_years: 5,
  target_age_groups: ['6-12', '13-18'],
  max_complexity_level: 'HIGH',
  capacity_hours_week: 30,
  max_concurrent_cases: 3,
  current_assignments: 0,
  current_hours_assigned: 0,
  has_certifications: true,
  availability_status: 'AVAILABLE',
  ...overrides,
})

const baseCase = (overrides: Partial<CaseInput> = {}): CaseInput => ({
  complexity_level: 'MEDIUM',
  weekly_hours: 3,
  citizen_age_range: '13-18',
  violence: false,
  substance_use: false,
  criminality: false,
  ...overrides,
})

// ================================================================
// SCENARIO 1 from MATCHING_AND_COMPLEXITY_RULES.md
// Alice: 5 yrs, pedagogue, 13-18, HIGH complexity, 4h/week available
// Expected overall: 80
// ================================================================
describe('Scenario 1: MEDIUM complexity case', () => {
  it('Alice scores 80 (excellent fit)', () => {
    const alice: ProfessionalInput = {
      id: 'alice',
      experience_years: 5,
      target_age_groups: ['13-18'],
      max_complexity_level: 'HIGH',
      capacity_hours_week: 4,
      max_concurrent_cases: 99, // no load
      current_assignments: 0,
      current_hours_assigned: 0,
      has_certifications: true,
      availability_status: 'AVAILABLE',
    }
    const caseData: CaseInput = {
      complexity_level: 'MEDIUM',
      weekly_hours: 3,
      citizen_age_range: '13-18',
      violence: false,
      substance_use: false,
      criminality: false,
    }
    const scores = scoreCandidate(alice, caseData)

    // qualifications: min(5×4,50)=20 + 25 + 25 = 70
    expect(scores.qualifications_score).toBe(70)
    // availability: (4-0)/3 = 133% → capped 100; load=0/99×20=0; score=100
    expect(scores.availability_score).toBe(100)
    // capacity: HIGH(3)-MEDIUM(2)=1 → 50+25=75
    expect(scores.capacity_score).toBe(75)
    // complexity_fit: age=50(match 13-18); exp=min(5×5,50)=25; no violence → 0; total=75
    expect(scores.complexity_fit_score).toBe(75)
    // overall: (70+100+75+75)/4 = 80
    expect(scores.overall_score).toBe(80)
  })

  it('Bob scores 80.5 (excellent fit, marginal win)', () => {
    const bob: ProfessionalInput = {
      id: 'bob',
      experience_years: 8,
      target_age_groups: ['0-12'],
      max_complexity_level: 'CRITICAL',
      capacity_hours_week: 5,
      max_concurrent_cases: 99,
      current_assignments: 0,
      current_hours_assigned: 0,
      has_certifications: true,
      availability_status: 'AVAILABLE',
    }
    const caseData: CaseInput = {
      complexity_level: 'MEDIUM',
      weekly_hours: 3,
      citizen_age_range: '13-18',
      violence: false,
      substance_use: false,
      criminality: false,
    }
    const scores = scoreCandidate(bob, caseData)

    // qualifications: min(8×4,50)=32 + 25 + 25 = 82
    expect(scores.qualifications_score).toBe(82)
    // availability: (5-0)/3 = 166% → capped 100; load=0; score=100
    expect(scores.availability_score).toBe(100)
    // capacity: CRITICAL(4)-MEDIUM(2)=2 → min(50+50,100)=100
    expect(scores.capacity_score).toBe(100)
    // complexity_fit: age=0 (13-18 not in ['0-12']); exp=min(8×5,50)=40; no violence → 0; total=40
    expect(scores.complexity_fit_score).toBe(40)
    // overall: (82+100+100+40)/4 = 80.5
    expect(scores.overall_score).toBe(80.5)
  })
})

// ================================================================
// SCENARIO 2 from MATCHING_AND_COMPLEXITY_RULES.md
// CRITICAL case, no suitable candidates
// ================================================================
describe('Scenario 2: CRITICAL complexity case, limited candidates', () => {
  it('Carl: capacity_score = 0 because HIGH cannot handle CRITICAL', () => {
    const carl: ProfessionalInput = {
      id: 'carl',
      experience_years: 12,
      target_age_groups: ['13-18'],
      max_complexity_level: 'HIGH',
      capacity_hours_week: 20,
      max_concurrent_cases: 3,
      current_assignments: 0,
      current_hours_assigned: 0,
      has_certifications: true,
      availability_status: 'AVAILABLE',
    }
    const criticalCase: CaseInput = {
      complexity_level: 'CRITICAL',
      weekly_hours: 6,
      citizen_age_range: '13-18',
      violence: true,
      substance_use: true,
      criminality: false,
    }
    const scores = scoreCandidate(carl, criticalCase)

    // capacity: HIGH(3)-CRITICAL(4) = -1 → 0 (complexity ceiling exceeded)
    expect(scores.capacity_score).toBe(0)
    // Overall still dragged down by capacity=0 even if other dims are high
    // Rule: "Not suitable" means capacity_score=0 is the disqualifier shown in UI
    expect(scores.capacity_score).toBe(0)
  })

  it('Diana scores ~40 (acceptable but only 1/6 hours available)', () => {
    const diana: ProfessionalInput = {
      id: 'diana',
      experience_years: 6,
      target_age_groups: ['13-18'],
      max_complexity_level: 'CRITICAL',
      capacity_hours_week: 6,
      max_concurrent_cases: 3,
      current_assignments: 2,
      current_hours_assigned: 5,
      has_certifications: true,
      availability_status: 'AVAILABLE',
    }
    const criticalCase: CaseInput = {
      complexity_level: 'CRITICAL',
      weekly_hours: 6,
      citizen_age_range: '13-18',
      violence: true,
      substance_use: true,
      criminality: false,
    }
    const scores = scoreCandidate(diana, criticalCase)

    // availability: (6-5)/6 = 16.6% → ~16.67; load=2/3×20=13.33; score=max(16.67-13.33,0)=3.33
    expect(scores.availability_score).toBeLessThan(10)
    // overall should be ~40 or below
    expect(scores.overall_score).toBeLessThan(60)
  })
})

// ================================================================
// Algorithm determinism
// ================================================================
describe('Determinism requirement', () => {
  it('produces identical scores for identical inputs', () => {
    const pro = baseProfessional()
    const c = baseCase()
    const s1 = scoreCandidate(pro, c)
    const s2 = scoreCandidate(pro, c)
    expect(s1.overall_score).toBe(s2.overall_score)
    expect(s1.qualifications_score).toBe(s2.qualifications_score)
    expect(s1.availability_score).toBe(s2.availability_score)
    expect(s1.capacity_score).toBe(s2.capacity_score)
    expect(s1.complexity_fit_score).toBe(s2.complexity_fit_score)
  })
})

// ================================================================
// Complexity calculation (MATCHING_AND_COMPLEXITY_RULES.md Part 1)
// ================================================================
describe('calculateComplexityLevel', () => {
  it('violence + substance_use → CRITICAL (override)', () => {
    expect(calculateComplexityLevel({
      mental_health: false, family_instability: false, school: false,
      violence: true, substance_use: true, criminality: false, multiple_agencies: false,
    })).toBe('CRITICAL')
  })

  it('violence + criminality → CRITICAL (override)', () => {
    expect(calculateComplexityLevel({
      mental_health: false, family_instability: false, school: false,
      violence: true, substance_use: false, criminality: true, multiple_agencies: false,
    })).toBe('CRITICAL')
  })

  it('family_instability + multiple_agencies + 3 factors → HIGH', () => {
    expect(calculateComplexityLevel({
      mental_health: true, family_instability: true, school: false,
      violence: false, substance_use: false, criminality: false, multiple_agencies: true,
    })).toBe('HIGH')
  })

  it('family_instability + multiple_agencies only (count=2) → MEDIUM (not HIGH)', () => {
    expect(calculateComplexityLevel({
      mental_health: false, family_instability: true, school: false,
      violence: false, substance_use: false, criminality: false, multiple_agencies: true,
    })).toBe('MEDIUM')
  })

  it('0 factors → LOW', () => {
    expect(calculateComplexityLevel({
      mental_health: false, family_instability: false, school: false,
      violence: false, substance_use: false, criminality: false, multiple_agencies: false,
    })).toBe('LOW')
  })

  it('1 factor → LOW', () => {
    expect(calculateComplexityLevel({
      mental_health: true, family_instability: false, school: false,
      violence: false, substance_use: false, criminality: false, multiple_agencies: false,
    })).toBe('LOW')
  })

  it('2 factors → MEDIUM', () => {
    expect(calculateComplexityLevel({
      mental_health: true, family_instability: true, school: false,
      violence: false, substance_use: false, criminality: false, multiple_agencies: false,
    })).toBe('MEDIUM')
  })

  it('4 factors → HIGH', () => {
    expect(calculateComplexityLevel({
      mental_health: true, family_instability: true, school: true,
      violence: false, substance_use: false, criminality: false, multiple_agencies: true,
    })).toBe('HIGH')
  })

  it('5 factors without special combos → HIGH', () => {
    // Count: T+T+T+F+F+T+T = 5 → HIGH (4-5 factors, no special rule fires)
    expect(calculateComplexityLevel({
      mental_health: true, family_instability: true, school: true,
      violence: false, substance_use: false, criminality: true, multiple_agencies: true,
    })).toBe('HIGH')
  })

  it('all 7 factors true (violence+substance_use) → CRITICAL via special rule', () => {
    // Even with count=7, violence+substance_use special rule fires first → CRITICAL
    expect(calculateComplexityLevel({
      mental_health: true, family_instability: true, school: true,
      violence: true, substance_use: true, criminality: true, multiple_agencies: true,
    })).toBe('CRITICAL')
  })
})

// ================================================================
// Real-world relevance: profession/daily-work matched against the
// case's tagged problem areas (e.g. a teacher's "Skolevægring"
// experience matched to a case tagged with the same problem area)
// ================================================================
describe('Qualifications: problem-area relevance', () => {
  it('falls back to the flat baseline (25) when neither side has tags', () => {
    const pro = baseProfessional({ experience_years: 0, has_certifications: false })
    const c = baseCase()
    const scores = scoreCandidate(pro, c)
    // qualifications: experience=0 + relevance=25 (no data) + certification=0 = 25
    expect(scores.qualifications_score).toBe(25)
  })

  it('scores full relevance when the professional covers every tagged problem area', () => {
    const pro = baseProfessional({
      experience_years: 0,
      has_certifications: false,
      target_group_names: ['Skolevægring', 'Angst'],
    })
    const c = baseCase({ problem_area_labels: ['Skolevægring'] })
    const scores = scoreCandidate(pro, c)
    // qualifications: experience=0 + relevance=25 (full coverage) + certification=0 = 25
    expect(scores.qualifications_score).toBe(25)
  })

  it('scores zero relevance when the professional has stated groups but none match', () => {
    const pro = baseProfessional({
      experience_years: 0,
      has_certifications: false,
      target_group_names: ['Misbrug'],
    })
    const c = baseCase({ problem_area_labels: ['Skolevægring'] })
    const scores = scoreCandidate(pro, c)
    // qualifications: experience=0 + relevance=0 (no overlap) + certification=0 = 0
    expect(scores.qualifications_score).toBe(0)
  })

  it('scores partial relevance proportional to coverage', () => {
    const pro = baseProfessional({
      experience_years: 0,
      has_certifications: false,
      target_group_names: ['Skolevægring'],
    })
    const c = baseCase({ problem_area_labels: ['Skolevægring', 'Angst'] })
    const scores = scoreCandidate(pro, c)
    // relevance: 1/2 coverage × 25 = 12.5 → rounds to 13
    expect(scores.qualifications_score).toBe(13)
  })

  it('names the matched problem area in the explanation text', () => {
    const pro = baseProfessional({ target_group_names: ['Skolevægring'] })
    const c = baseCase({ problem_area_labels: ['Skolevægring'] })
    const scores = scoreCandidate(pro, c)
    expect(scores.scoring_explanation).toContain('Skolevægring')
  })
})

// ================================================================
// Score caps and edge cases
// ================================================================
describe('Score boundary conditions', () => {
  it('qualifications_score caps at 100 for very experienced professionals', () => {
    const pro = baseProfessional({ experience_years: 30, has_certifications: true })
    const scores = scoreCandidate(pro, baseCase())
    expect(scores.qualifications_score).toBeLessThanOrEqual(100)
  })

  it('capacity_score = 0 when professional cannot handle case complexity', () => {
    const pro = baseProfessional({ max_complexity_level: 'LOW' })
    const c = baseCase({ complexity_level: 'HIGH' })
    const scores = scoreCandidate(pro, c)
    expect(scores.capacity_score).toBe(0)
  })

  it('availability_score = 0 when no remaining capacity', () => {
    const pro = baseProfessional({
      capacity_hours_week: 3,
      current_hours_assigned: 3,
    })
    const c = baseCase({ weekly_hours: 3 })
    const scores = scoreCandidate(pro, c)
    expect(scores.availability_score).toBe(0)
  })

  it('complexity_fit_score includes special_skills bonus for HIGH/CRITICAL prof on violence case', () => {
    const pro = baseProfessional({ max_complexity_level: 'HIGH', experience_years: 0 })
    const c = baseCase({ violence: true, citizen_age_range: '13-18' })
    const scores = scoreCandidate(pro, c)
    // age=50 + exp=0 + special_skills=25 = 75
    expect(scores.complexity_fit_score).toBe(75)
  })
})

// ================================================================
// Logistics fit: transport, akut-readiness, gender preference,
// geography and gender experience — each only applies when the case
// actually states the requirement.
// ================================================================
describe('Logistics fit', () => {
  it('is null and excluded from overall_score when the case states no logistics requirement', () => {
    const pro = baseProfessional()
    const c = baseCase()
    const scores = scoreCandidate(pro, c)
    expect(scores.logistics_score).toBeNull()
    // overall_score is still the plain /4 average of the four base dimensions
    const manualAverage = parseFloat((
      (scores.qualifications_score + scores.availability_score + scores.capacity_score + scores.complexity_fit_score) / 4
    ).toFixed(2))
    expect(scores.overall_score).toBe(manualAverage)
  })

  it('scores 100 when transport is required and the professional can provide it', () => {
    const pro = baseProfessional({ can_transport_citizen: true, has_drivers_license: true, has_own_car: true })
    const c = baseCase({ transport_needs: 'JA' })
    const scores = scoreCandidate(pro, c)
    expect(scores.logistics_score).toBe(100)
  })

  it('scores 0 when transport is required and the professional is missing any part of it', () => {
    const pro = baseProfessional({ can_transport_citizen: true, has_drivers_license: true, has_own_car: false })
    const c = baseCase({ transport_needs: 'JA' })
    const scores = scoreCandidate(pro, c)
    expect(scores.logistics_score).toBe(0)
  })

  it('does not check transport when the case does not require it', () => {
    const pro = baseProfessional({ can_transport_citizen: false })
    const c = baseCase({ transport_needs: 'NEJ' })
    const scores = scoreCandidate(pro, c)
    expect(scores.logistics_score).toBeNull()
  })

  it('penalizes a professional who cannot take acute cases when the case is AKUT', () => {
    const pro = baseProfessional({ can_take_acute: false })
    const c = baseCase({ urgency: 'AKUT' })
    const scores = scoreCandidate(pro, c)
    expect(scores.logistics_score).toBe(0)
    expect(scores.attention_points.some(a => a.includes('akutte'))).toBe(true)
  })

  it('rewards matching the municipality\'s stated gender preference', () => {
    const pro = baseProfessional({ gender: 'FEMALE' })
    const c = baseCase({ preferred_prof_gender: 'FEMALE' })
    const scores = scoreCandidate(pro, c)
    expect(scores.logistics_score).toBe(100)
  })

  it('ignores gender preference when the case has none (NO_PREF)', () => {
    const pro = baseProfessional({ gender: 'MALE' })
    const c = baseCase({ preferred_prof_gender: 'NO_PREF' })
    const scores = scoreCandidate(pro, c)
    expect(scores.logistics_score).toBeNull()
  })

  it('checks gender experience only when the professional has stated any', () => {
    const proWithNoData = baseProfessional({ experience_with_genders: [] })
    const proWithMatch = baseProfessional({ experience_with_genders: ['BOYS'] })
    const c = baseCase({ citizen_gender: 'MALE' })
    expect(scoreCandidate(proWithNoData, c).logistics_score).toBeNull()
    expect(scoreCandidate(proWithMatch, c).logistics_score).toBe(100)
  })

  it('checks geography only when the professional has stated any coverage area', () => {
    const proWithNoData = baseProfessional({ geography: [] })
    const proWithCoverage = baseProfessional({ geography: ['Aarhus'] })
    const proWithoutCoverage = baseProfessional({ geography: ['Odense'] })
    const c = baseCase({ geographical_area: 'Aarhus' })
    expect(scoreCandidate(proWithNoData, c).logistics_score).toBeNull()
    expect(scoreCandidate(proWithCoverage, c).logistics_score).toBe(100)
    expect(scoreCandidate(proWithoutCoverage, c).logistics_score).toBe(0)
  })

  it('checks languages only when both the case requires one and the professional has stated any', () => {
    const proWithNoData = baseProfessional({ languages: [] })
    const proWithMatch = baseProfessional({ languages: ['Arabisk', 'Dansk'] })
    const proWithoutMatch = baseProfessional({ languages: ['Polsk'] })
    const c = baseCase({ required_languages: ['Arabisk', 'Somali'] })
    expect(scoreCandidate(proWithNoData, c).logistics_score).toBeNull()
    expect(scoreCandidate(proWithMatch, c).logistics_score).toBe(100)
    expect(scoreCandidate(proWithoutMatch, c).logistics_score).toBe(0)
  })

  it('checks evening/weekend/night availability only when the case requires it', () => {
    const proNone = baseProfessional({ can_work_evening: false, can_work_weekend: false, can_work_night: false })
    const proAll = baseProfessional({ can_work_evening: true, can_work_weekend: true, can_work_night: true })
    expect(scoreCandidate(proNone, baseCase({})).logistics_score).toBeNull()
    expect(scoreCandidate(proNone, baseCase({ requires_evening: true })).logistics_score).toBe(0)
    expect(scoreCandidate(proAll, baseCase({ requires_evening: true })).logistics_score).toBe(100)
    expect(scoreCandidate(proNone, baseCase({ requires_weekend: true })).logistics_score).toBe(0)
    expect(scoreCandidate(proAll, baseCase({ requires_weekend: true })).logistics_score).toBe(100)
    expect(scoreCandidate(proNone, baseCase({ requires_night: true })).logistics_score).toBe(0)
    expect(scoreCandidate(proAll, baseCase({ requires_night: true })).logistics_score).toBe(100)
  })

  it('averages multiple applicable checks together', () => {
    const pro = baseProfessional({
      can_transport_citizen: true, has_drivers_license: true, has_own_car: true, // passes
      can_take_acute: false, // fails
    })
    const c = baseCase({ transport_needs: 'JA', urgency: 'AKUT' })
    const scores = scoreCandidate(pro, c)
    expect(scores.logistics_score).toBe(50)
  })

  it('joins overall_score as a fifth dimension only when applicable', () => {
    const pro = baseProfessional({ can_take_acute: true })
    const c = baseCase({ urgency: 'AKUT' })
    const scores = scoreCandidate(pro, c)
    const manualAverage = parseFloat((
      (scores.qualifications_score + scores.availability_score + scores.capacity_score + scores.complexity_fit_score + 100) / 5
    ).toFixed(2))
    expect(scores.overall_score).toBe(manualAverage)
  })
})
