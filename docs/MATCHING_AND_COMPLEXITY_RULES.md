# Matching and Complexity Rules: Kurskifte-Match

**Date:** June 27, 2026  
**Status:** APPROVED (blocking document for Tech Spec)  
**Purpose:** Define complexity calculation, matching algorithm, and related business rules

---

## PART 1: CASE COMPLEXITY CALCULATION

### Complexity Factors (Binary)

CaseComplexityFactors entity has 8 boolean factors:

```
├─ mental_health: Boolean (mental health diagnosis or concerns)
├─ family_instability: Boolean (family disruption, domestic issues)
├─ school: Boolean (school attendance, education concerns)
├─ violence: Boolean (violence history or exposure)
├─ substance_use: Boolean (substance abuse issues)
├─ criminality: Boolean (criminal behavior or justice system involvement)
├─ multiple_agencies: Boolean (multiple agencies involved in case)
└─ diagnosis: String | NULL (specific diagnosis if relevant)
```

### Calculation Rule

**Complexity level is calculated from factor COUNT + WEIGHT:**

```
LOW:      0-1 factors
MEDIUM:   2-3 factors
HIGH:     4-5 factors
CRITICAL: 6+ factors OR (violence=true AND substance_use=true) OR (violence=true AND criminality=true)
```

**Special Rules:**
- If violence=true AND substance_use=true → minimum CRITICAL (override count-based)
- If violence=true AND criminality=true → minimum CRITICAL (override count-based)
- If family_instability=true AND multiple_agencies=true → minimum HIGH (override count-based)
- multiple_agencies alone does NOT make HIGH (must have 4+ other factors)

**Implementation:**
```python
def calculate_complexity_level(factors):
    count = sum([
        factors.mental_health,
        factors.family_instability,
        factors.school,
        factors.violence,
        factors.substance_use,
        factors.criminality,
        factors.multiple_agencies,
    ])
    
    # Check special rules first
    if factors.violence and factors.substance_use:
        return "CRITICAL"
    if factors.violence and factors.criminality:
        return "CRITICAL"
    if factors.family_instability and factors.multiple_agencies and count >= 3:
        return "HIGH"
    
    # Default count-based
    if count >= 6:
        return "CRITICAL"
    elif count >= 4:
        return "HIGH"
    elif count >= 2:
        return "MEDIUM"
    else:
        return "LOW"
```

### Who Sets Complexity?

- **Input:** Case Coordinator (during case creation or assessment)
- **When:** When case created from municipality inquiry (WF-002)
- **Review:** Can be updated if new information emerges
- **Immutable:** NO - can change as situation evolves

### Complexity Factor Notes

Optional text field (max 500 chars) for coordinator to explain reasoning:
- Example: "Youth has dual diagnosis (ADHD + anxiety) and recent school exclusion. Stable family but needs structure."

---

## PART 2: MATCHING RULES & ALGORITHM

### Matching Inputs

When a match run is triggered for a case, system considers:

**From Case:**
- Complexity level (LOW|MEDIUM|HIGH|CRITICAL)
- Weekly hours needed (e.g., 4.5 hours)
- Citizen age range (0-5, 6-12, 13-18, 18+)
- Special needs/factors (from complexity assessment)

**From Professional Pool (Available Only):**
- Status = ACTIVE (not REGISTERED, INACTIVE, ARCHIVED)
- Not already at max_concurrent_cases
- Remaining capacity >= case weekly hours
- max_complexity_level >= case complexity level
- Has credentials verified (all VERIFIED documents)
- Not all credentials expiring in <30 days
- availability_status = AVAILABLE (not ON_LEAVE, UNAVAILABLE)

### Matching Scoring Factors

MatchCandidate has 4 score components (0-100 each):

```
├─ qualifications_score: Decimal(0-100)
│  └─ Based on: experience_years, profession match, certifications
│
├─ availability_score: Decimal(0-100)
│  └─ Based on: hours available this week, max concurrent cases, current load
│
├─ capacity_score: Decimal(0-100)
│  └─ Based on: total hours remaining, complexity ceiling, specialization
│
└─ complexity_fit_score: Decimal(0-100)
   └─ Based on: target_age_groups match, complexity experience, special skills
```

### MVP Matching Weights (Suggested)

**Overall Score = Weighted Average:**

```
overall_score = (
  qualifications_score * 0.25 +
  availability_score * 0.25 +
  capacity_score * 0.25 +
  complexity_fit_score * 0.25
)
```

**Individual Scoring (Each 0-100):**

**Qualifications Score:**
```
base = 50
+ (experience_years × 2) [0-50 max]
+ (profession_match × 25) [yes=25, no=0]
+ (certifications × 25) [yes=25, no=0]
= 0-100
```

**Availability Score:**
```
capacity_available = remaining_hours_this_week / required_hours
capacity_score = (capacity_available × 100) [capped at 100]
concurrent_load = current_concurrent_cases / max_concurrent_cases
load_penalty = (concurrent_load × 20) [penalty 0-20]
score = capacity_score - load_penalty
= 0-100
```

**Capacity Score:**
```
complexity_margin = (professional.max_complexity_level - case.complexity_level)
if complexity_margin < 0:
  score = 0  # Professional cannot handle complexity
elif complexity_margin == 0:
  score = 50  # Borderline fit
else:
  score = 50 + (complexity_margin × 25)  # Comfort margin
= 0-100
```

**Complexity Fit Score:**
```
age_match = (citizen_age_range in target_age_groups) ? 50 : 0
complexity_experience = years_at_case_complexity * 5 [0-50 max]
special_skills = check factors (violence, substance, etc) ? 25 : 0
score = age_match + complexity_experience + special_skills
= 0-100
```

### Score Interpretation

```
80-100: Excellent fit → Rank 1
60-79:  Good fit → Rank 2
40-59:  Acceptable fit → Rank 3
20-39:  Poor fit → Not recommended (may show if no others)
< 20:   Not suitable → Do not show
```

### Matching Output

For each match run:
1. **Score** all eligible professionals (deterministic, same inputs = same score)
2. **Rank** by score (80+, then 60+, then 40+)
3. **Generate explanation** for each candidate:
   - "Excellent qualifications (15 years pedagogue) + strong availability (3/4 hours) but some complexity margin. Familiar with school-based support."
   - No score details shown to coordinator (opaque algorithm, not manipulable)
4. **Recommend** top 3 candidates
5. **Record decision** when coordinator selects professional
6. **Create CaseAssignment** (not automatic)

### Deterministic Requirement

**Same inputs MUST always produce same scores.** Algorithm must NOT use randomization, time-based variation, or external data that changes.

If algorithm is changed (v1.0 → v1.1):
- All future match runs use v1.1
- Historical match runs preserve v1.0 scores
- Version visible in MatchRun.algorithm_version

### Human-in-the-Loop Requirement

**NEVER auto-assign.** Process:
1. Admin triggers match run
2. System scores candidates
3. System recommends top 3
4. **Admin reviews recommendations**
5. **Admin explicitly selects professional** (may choose different from top 3)
6. Admin explains reason if overriding top choice
7. System creates CaseAssignment

Admin can:
- ✅ Accept recommendation
- ✅ Choose different candidate
- ✅ Reject all and try different match criteria
- ✅ Manually select if no suitable candidates
- ❌ Cannot auto-confirm
- ❌ Cannot assign based only on algorithm

### No Automatic Assignment

Explicitly forbidden:
- ❌ Assign top-ranked candidate automatically
- ❌ Assign if score > threshold without review
- ❌ Auto-reassign when better candidate appears
- ❌ Batch assignments without review

Every assignment is explicit human decision with potential override reason logged.

---

## PART 3: EDGE CASES & EXCEPTIONS

### What if no candidates meet complexity ceiling?

**Rule:** Show anyway with note "No professionals at required complexity level"
- Admin must make decision:
  - Train professional to higher level (not MVP)
  - Accept slightly overqualified professional (underutilized)
  - Refer case to external agency
- Decision is logged

### What if no candidates have capacity?

**Rule:** Show anyway with note "No available capacity this week"
- Admin can:
  - Wait for professional to have capacity
  - Reduce hours (discuss with municipality)
  - Refer case
- Decision is logged

### What if professional is perfect but just went ON_LEAVE?

**Rule:** Professional doesn't appear in candidate pool (status = INACTIVE)
- System doesn't match
- Coordinator must wait or choose different professional

### What if case complexity drops?

**Rule:** Can run new match (e.g., CRITICAL → HIGH case)
- Previous match run is preserved
- New match run starts fresh
- Both are audited

---

## PART 4: ALGORITHM VERSIONING

### Versioning Rules

**Format:** X.Y (major.minor)
- v1.0: Initial algorithm (weights, factors, formulas)
- v1.1: Minor adjustment (e.g., weight tweak)
- v2.0: Major change (e.g., new scoring factor)

**On Version Change:**
1. New version used for all future match runs
2. Old match runs preserve version used (immutable)
3. Explanation for version change documented (in commit message, architecture notes)
4. Backwards compatibility considered (can v2.0 reproduce v1.0?)

**Immutability:**
- MatchRun records which version created the scores
- Cannot re-score historical match runs with new algorithm
- Explainability preserved (can see why v1.0 recommended person X)

---

## PART 5: EXAMPLE SCENARIOS

### Scenario 1: Simple MEDIUM Complexity Case

**Case:**
- Citizen age: 14
- Complexity: MEDIUM (school issues + family instability)
- Hours needed: 3/week

**Professional Candidates:**
- Alice: Pedagogue, 5 years exp, target_age=13-18, max_complexity=HIGH, capacity=4h/week available
  - Qualifications: 70 (5 years × 2 + 25 profession + 25 cert)
  - Availability: 100 (3/4 hours needed)
  - Capacity: 75 (can handle HIGH, case is MEDIUM)
  - Complexity fit: 75 (age match + experience)
  - **Overall: 80** → Excellent fit

- Bob: Nurse, 8 years exp, target_age=0-12 (no match), max_complexity=CRITICAL, capacity=5h/week
  - Qualifications: 80 (8 years × 2 + 25 profession + 25 cert)
  - Availability: 100 (5/3 hours needed)
  - Capacity: 100 (can handle CRITICAL easily)
  - Complexity fit: 25 (age mismatch, no experience with 13-18)
  - **Overall: 51** → Acceptable fit

**Recommendation:** Alice (80). Admin accepts.

### Scenario 2: Complex CRITICAL Case, No Suitable Candidates

**Case:**
- Citizen age: 16
- Complexity: CRITICAL (violence + substance + multiple agencies)
- Hours: 6/week

**Professional Candidates:**
- Carl: Social worker, 12 years, target=13-18, max_complexity=HIGH (not CRITICAL)
  - Capacity score: 0 (cannot handle CRITICAL, max is HIGH)
  - **Overall: 25** → Not suitable

- Diana: Psychologist, 6 years, target=13-18, max_complexity=CRITICAL, but at capacity
  - Availability: 30 (only 1/6 hours available)
  - **Overall: 40** → Poor fit

**System output:** "No professionals at required complexity level with adequate capacity"

**Admin options:**
1. Assign Diana anyway (underutilized)
2. Assign Carl with note "Exceeds complexity ceiling, monitor closely"
3. Refer to external specialist
4. Wait for Diana to free up

Admin decision logged.

---

## PART 6: FUTURE ENHANCEMENTS (NOT MVP)

Phase 2+ could include:
- Machine learning for scoring weights
- Citizen preference matching
- Geographic/transport matching
- Professional specialization scoring
- Outcome-based algorithm optimization
- A/B testing different algorithms

**For MVP:** Deterministic, explainable, human-validated algorithm.

---

## OPEN QUESTIONS FOR TECH SPEC

1. Should Professional have a "specialization" field? (violence, substance, family, education, etc.)
2. Should matching consider geographic proximity?
3. Should matching consider professional gender preference (if provided)?
4. How far back does "experience_years" calculation go?
5. Should rejected candidates be re-shown in future match runs?
6. How is experience at a particular complexity level tracked?

---

**This document locks the matching and complexity rules for Technical Specification.**  
**Algorithm weights are suggested; final calibration may happen in Phase 2 based on real data.**
