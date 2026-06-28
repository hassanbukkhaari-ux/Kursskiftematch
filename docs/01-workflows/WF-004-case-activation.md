# WF-004: Case Activation

**Workflow ID:** WF-004  
**Title:** Case Activation — Transition from Matched to Active  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Case Domain

---

## PURPOSE

Formally activate a matched case by transitioning both the case and its associated grant from their pending states to active, enabling professional session documentation and hour registration to begin.

---

## ACTORS

- **Case Coordinator (Admin)** — Reviews case readiness and executes activation
- **Governance Domain** — Logs activation events

---

## TRIGGER

Case Coordinator navigates to a case with status=MATCHED and confirms it is ready for professional engagement to begin.

---

## PRECONDITIONS

- Case exists with status=MATCHED
- CaseAssignment exists for the case with ended_at IS NULL (professional assigned via WF-003)
- CaseGrant exists with status=PENDING (created via WF-002)
- Professional status=ACTIVE

---

## MAIN FLOW

1. **Admin reviews case readiness**
   - Admin confirms:
     - Professional is in place (CaseAssignment exists with ended_at IS NULL)
     - Grant is confirmed (CaseGrant exists with status=PENDING)
     - Case details are complete
   - Admin clicks "Activate Case"

2. **System validates preconditions**
   - Checks: case.status = MATCHED
   - Checks: CaseAssignment with ended_at IS NULL exists
   - Checks: CaseGrant with status = PENDING exists
   - If any check fails: activation is rejected with an error message
   - No partial activation is permitted

3. **System executes atomic activation**
   - Within a single database transaction:
     - cases.status: MATCHED → ACTIVE
     - case_grants.status: PENDING → ACTIVE
     - case_grants.activated_at = NOW()
   - Both succeed together or neither succeeds
   - If transaction fails: case and grant remain in their previous states
   - Event: `CASE_ACTIVATED` logged
   - Event: `GRANT_ACTIVATED` logged

4. **Workflow complete**
   - Case is now ACTIVE
   - Grant is now ACTIVE
   - Professional may begin session documentation (WF-005) immediately
   - Professional may begin hour registration (WF-006) immediately
   - No notification is generated to the professional (WF-003 handles assignment notification)

---

## ALTERNATIVE FLOWS

### A1: No Active CaseGrant
- System detects: no CaseGrant with status=PENDING exists
- Activation is rejected
- Admin is shown error: "No grant available. Create a grant via WF-002 before activating this case."
- Case remains in status=MATCHED
- No audit event is generated for the failed attempt

### A2: CaseAssignment Missing
- System detects: no CaseAssignment with ended_at IS NULL exists
- Activation is rejected
- Admin is shown error: "No professional assigned. Run matching via WF-003 before activating."
- Case remains in status=MATCHED

### A3: Transaction Failure
- Database transaction fails (e.g., concurrent modification, connection error)
- Both cases.status and case_grants.status remain unchanged
- Admin is shown error: "Activation failed. Please try again."
- No partial state change occurs
- No audit events are logged

---

## BUSINESS RULES

1. **Activation is a manual administrative action** — No automatic activation is permitted
2. **Activation is atomic** — cases.status and case_grants.status change together or not at all
3. **A valid CaseGrant is required** — No CaseGrant with status=PENDING = activation fails
4. **CaseAssignment must exist** — Professional must be assigned before activation
5. **No notification is generated at activation** — Professional was notified at assignment (WF-003)
6. **WF-005 and WF-006 may begin immediately** — Session documentation and hour registration are both unlocked the moment the case is ACTIVE
7. **There must never be an inconsistent state** — Case=ACTIVE with Grant=PENDING, or Grant=ACTIVE with Case=MATCHED, are prohibited states

---

## AUDIT EVENTS

- `CASE_ACTIVATED` — cases.status transitioned from MATCHED to ACTIVE
- `GRANT_ACTIVATED` — case_grants.status transitioned from PENDING to ACTIVE

---

## OUTPUTS

- cases.status = ACTIVE
- case_grants.status = ACTIVE
- case_grants.activated_at = timestamp of activation
- Audit trail of activation with actor (Case Coordinator)

---

## DATA STRUCTURES

**cases (modified at activation):**
- status: MATCHED → ACTIVE

**case_grants (modified at activation):**
- status: PENDING → ACTIVE
- activated_at: TIMESTAMPTZ set to NOW()

---

## WORKFLOW CONNECTIONS

| Reference | Direction | Description |
|-----------|-----------|-------------|
| WF-002 | Upstream | Creates the CaseGrant (status=PENDING) required by WF-004 |
| WF-003 | Upstream | Creates the CaseAssignment required by WF-004; sends professional notification |
| WF-005 | Downstream | Professional may begin session documentation after WF-004 completes |
| WF-006 | Downstream | Professional may begin hour registration after WF-004 completes |
| WF-008 | Downstream | Professional handover can occur while case is ACTIVE |
| WF-012 | Downstream | Case closure (not yet documented) |

---

## OPEN QUESTIONS

1. Should admin be able to add a note at activation (e.g., "Delayed start due to family consent")?
2. Should system display a confirmation summary of case details and grant allocation before the activation button is clicked?
3. Should there be a re-activation path if a case is accidentally activated prematurely?

---

**This workflow is implementation-ready. Depends on CaseAssignment (WF-003) and CaseGrant (WF-002). Enables WF-005 and WF-006.**
