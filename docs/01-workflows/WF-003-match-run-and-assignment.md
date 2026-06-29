# WF-003: Match Run and Professional Assignment

**Workflow ID:** WF-003  
**Title:** Matching Run — Scoring, Recommending, and Assigning Professionals  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Matching Domain + Case Domain (decision)

---

## PURPOSE

Enable Case Coordinator to trigger a matching algorithm that scores available professionals for a case, see ranked recommendations, and explicitly select which professional to assign.

---

## ACTORS

- **Case Coordinator (Admin)** — Triggers match, reviews recommendations, selects professional
- **Matching Engine** — Scores candidates deterministically
- **Governance Domain** — Logs all decisions

---

## TRIGGER

Case Coordinator clicks "Find Professional" or "Re-Match" for a case that is status=OPEN and marked as ready for assignment.

---

## PRECONDITIONS

- Case exists with status=OPEN (at minimum)
- Case has complexity_level assessed
- Case has weekly_hours defined
- At least one ACTIVE professional with capacity exists

---

## MAIN FLOW

1. **Admin initiates match run**
   - Input: Case ID
   - System creates MatchRun record
   - MatchRun status=INITIATED
   - Event: `MATCH_RUN_TRIGGERED` logged

2. **System identifies eligible professionals**
   - Filter: status=ACTIVE, not at max_concurrent_cases, capacity >= case hours
   - Filter: max_complexity_level >= case complexity_level
   - Filter: all documents VERIFIED and not expired (or expiring soon)
   - Filter: availability_status != UNAVAILABLE
   - Result: Pool of 0 or more candidates

3. **System scores each candidate**
   - Algorithm: MATCHING_AND_COMPLEXITY_RULES.md
   - Scores: qualifications, availability, capacity, complexity_fit
   - Overall score = weighted average
   - All scores deterministic (same inputs = same output)
   - Event: `CANDIDATES_SCORED` logged

4. **System ranks candidates**
   - Sort by overall_score (descending)
   - Rank 1, 2, 3, etc.
   - MatchRun status=SCORED

5. **System generates explanations**
   - For each ranked candidate: human-readable explanation
   - Example: "Excellent qualifications (12 years experience) + available capacity (4.5/6 hours) + good complexity fit. Experienced with school-based cases."
   - Explanations do NOT reveal scores to coordinator (opaque algorithm)
   - Event: `MATCH_EXPLANATION_GENERATED` logged

6. **System recommends to coordinator**
   - Show top 3 candidates (if available)
   - Show explanations (not scores)
   - Show "no suitable candidates" message if count < 1
   - MatchRun status=ASSIGNED (awaiting human decision)

7. **Case Coordinator reviews and selects**
   - Coordinator can:
     - Accept recommendation (select rank 1)
     - Choose different rank (rank 2, 3)
     - Reject all and retry matching (e.g., adjust complexity, accept lower score)
     - Manually assign different professional
   - Coordinator must provide reason if overriding top choice

8. **System creates CaseAssignment**
   - New CaseAssignment record created with selected professional
   - CaseAssignment status=ACTIVE
   - Case status → MATCHED
   - Event: `HUMAN_DECISION_RECORDED` logged with reason

9. **Workflow complete**
   - Professional is now assigned
   - Professional can view case
   - Professional can start session logging

---

## ALTERNATIVE FLOWS

### A1: No Suitable Candidates
- System shows message: "No professionals with required capacity and complexity level"
- Coordinator options:
  - Reduce case complexity (discuss with case creator)
  - Reduce hours requirement
  - Accept lower score by retrying
  - Manually assign (override)
  - Refer case to external agency
- Event: `MATCH_NO_CANDIDATES` logged with coordinator action

### A2: Coordinator Overrides Recommendation
- Coordinator selects different professional than rank 1
- System requires explanation: "Why are you selecting rank 2 instead of rank 1?"
- Event: `HUMAN_DECISION_OVERRIDE` logged with reason

### A3: Retry Matching with Different Criteria
- Coordinator rejects all recommendations
- Clicks "Retry with different criteria"
- Adjusts complexity, hours, or other filters (if allowed)
- New MatchRun initiated (loop to step 1)
- Old MatchRun preserved for audit (status=CANCELLED)

---

## BUSINESS RULES

1. **Matching is recommendation only** — Admin MUST explicitly decide
2. **No automatic assignment** — Top-ranked candidate is NOT auto-assigned
3. **Algorithm is deterministic** — Same inputs always produce same scores
4. **Algorithm is transparent** — Explanations provided (though not scores)
5. **Admin can override** — Can assign differently from recommendation with explanation
6. **Scores are immutable** — Historical scores preserved for explainability
7. **Algorithm versioning** — MatchRun records algorithm version used

---

## AUDIT EVENTS

- `MATCH_RUN_TRIGGERED` — Match initiated
- `CANDIDATES_SCORED` — All candidates scored
- `MATCH_EXPLANATION_GENERATED` — Explanations created
- `HUMAN_DECISION_RECORDED` — Admin selected professional
- `HUMAN_DECISION_OVERRIDE` — Admin selected non-top candidate (with reason)
- `MATCH_NO_CANDIDATES` — No suitable candidates
- `MATCH_CANCELLED` — Admin cancelled match and retried

---

## OUTPUTS

- CaseAssignment created (professional now assigned to case)
- Case status transitioned to MATCHED
- MatchRun record preserved (immutable, for audit trail)
- Professional notified of assignment (via email/manual contact)

---

## DATA STRUCTURES

**MatchRun:**
- case_id, triggered_by, triggered_at
- algorithm_version (e.g., "1.0")
- status (INITIATED, SCORED, ASSIGNED, OVERRIDDEN, CANCELLED)
- final_assignment_id (which professional chosen)
- selected_by, selected_at, selected_reason (if override)

**MatchCandidate:**
- match_run_id, professional_id, rank
- qualifications_score, availability_score, capacity_score, complexity_fit_score
- overall_score (weighted average)
- scoring_explanation (human-readable)

---

## OPEN QUESTIONS

1. Should coordinator see detailed scoring factors or only explanation?
2. Should system prevent immediate re-matching (e.g., wait 1 hour)?
3. Should coordinator be able to add notes to match decision?
4. Should algorithm weights be configurable (v1.1, v2.0)?
5. Should there be a time limit on assignment decision (e.g., 24 hours to decide)?

---

## API ENDPOINTS

| Trin | Metode | Endpoint | Auth | Tabel |
|---|---|---|---|---|
| Hent tilgængelige fagpersoner | `GET` | `/api/professionals/available` | Admin | `v_professionals_available` |
| Start match-kørsel | `POST` | `/api/match-runs` | Admin | `match_runs`, `match_candidates` |
| Hent match-kørsel | `GET` | `/api/match-runs/:id` | Admin | `match_runs` |
| Hent kandidater | `GET` | `/api/match-runs/:id/candidates` | Admin | `match_candidates` |
| Tildel fagperson | `POST` | `/api/match-runs/:id/assign` | Admin | `match_runs`, `case_assignments` |

**TS-002 reference:** §8.1–8.6 (Matching Domain Endpoints)

---

**This workflow is implementation-ready. Algorithm defined in MATCHING_AND_COMPLEXITY_RULES.md**
