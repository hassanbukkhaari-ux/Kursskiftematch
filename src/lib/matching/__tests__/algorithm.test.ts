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
