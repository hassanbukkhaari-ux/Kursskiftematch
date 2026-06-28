# WF-012: Case Closure and Archival

**Workflow ID:** WF-012  
**Title:** Case Closure and Archival — ACTIVE → COMPLETED → ARCHIVED  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Case Domain

---

## PURPOSE

Formally conclude a case in two distinct administrative steps: (1) **Closure** transitions the case from ACTIVE to COMPLETED, ending professional assignment and locking new activity; (2) **Archival** transitions the case from COMPLETED to ARCHIVED, setting the GDPR data retention countdown. These are separate actions to preserve a deliberate gap between closure and archival.

---

## ACTORS

- **Case Coordinator (Admin)** — Initiates both closure and archival
- **Governance Domain** — Logs closure and archival events

---

## OVERVIEW: TWO-STEP LIFECYCLE

```
ACTIVE → [CASE CLOSURE] → COMPLETED → [CASE ARCHIVAL] → ARCHIVED
```

Each step is a separate, explicit admin action. They can occur on the same day or weeks apart. Archival does not happen automatically after closure.

---

# PART 1: CASE CLOSURE (ACTIVE → COMPLETED)

## TRIGGER

Case Coordinator determines that professional support for a citizen is complete and navigates to "Close Case" for an ACTIVE case.

---

## PRECONDITIONS

- Case exists with status=ACTIVE
- At least one CaseAssignment exists with ended_at IS NULL

---

## MAIN FLOW (CLOSURE)

1. **Admin initiates case closure**
   - Navigates to case with status=ACTIVE
   - Clicks "Close Case"

2. **System runs pre-closure checks**

   **Hard blockers (prevent closure):**
   - registered_hours WHERE case_id = this case AND status = 'PENDING' exist
     → Admin is shown: "This case has pending hours awaiting approval. Resolve all PENDING hours before closing."
     → Closure is rejected until all PENDING hours are APPROVED, REJECTED, or OUTSIDE_GRANT-reviewed

   **Advisory warnings (do not block closure):**
   - registered_hours WHERE case_id = this case AND status = 'OUTSIDE_GRANT' AND reviewed_by IS NULL exist
     → Admin is shown: "This case has unreviewed outside-grant hours. Consider resolving via WF-007 before closing."
     → Admin may proceed despite this warning
   - session_logs WHERE case_id = this case AND status = 'DRAFT' exist
     → Admin is shown: "This case has unfinalised session logs. Consider finalising before closing."
     → Admin may proceed despite this warning

   **No warning / no block:**
   - registered_hours WHERE status = 'REJECTED' — already resolved, no action needed
   - registered_hours WHERE status = 'APPROVED' — already resolved
   - registered_hours WHERE status = 'OUTSIDE_GRANT' AND reviewed_by IS NOT NULL — already reviewed via WF-007

3. **Admin confirms closure**
   - Admin confirms they wish to close the case
   - No closure reason is required in MVP

4. **System executes closure (within a single transaction)**
   - cases.status: ACTIVE → COMPLETED
   - For each CaseAssignment WHERE case_id = this case AND ended_at IS NULL:
     - ended_at = NOW()
     - assignment_status = TERMINATED
   - Event: `CASE_CLOSED` logged
   - Event: `CASE_ASSIGNMENT_ENDED` logged (one event per assignment ended)
   - Both succeed together or neither succeeds

5. **Post-closure state**
   - No new session_logs may be created for this case
   - No new registered_hours may be submitted for this case
   - Existing DRAFT session logs: **see Open Question 3 — this rule is not yet locked**
   - Case is visible to admin; professional may still view historical records
   - Case does not advance to ARCHIVED automatically

---

# PART 2: CASE ARCHIVAL (COMPLETED → ARCHIVED)

## TRIGGER

Case Coordinator is satisfied that all post-closure review is complete and initiates archival of a COMPLETED case.

---

## PRECONDITIONS

- Case exists with status=COMPLETED

---

## MAIN FLOW (ARCHIVAL)

1. **Admin initiates case archival**
   - Navigates to case with status=COMPLETED
   - Clicks "Archive Case"
   - No pre-archival blockers in MVP

2. **System executes archival (within a single transaction)**
   - cases.status: COMPLETED → ARCHIVED
   - cases.archived_at = NOW()
   - cases.data_retention_expires_at = archived_at + INTERVAL '7 years'
   - For each CaseGrant WHERE case_id = this case AND status = 'ACTIVE':
     - case_grants.status = ARCHIVED
     - case_grants.archived_at = NOW()
   - Event: `CASE_ARCHIVED` logged
   - Both case and grant changes succeed together or neither succeeds

3. **Post-archival state**
   - Case is immutable
   - GDPR retention countdown has started (data_retention_expires_at set)
   - Case becomes eligible for GDPR deletion via WF-013 after data_retention_expires_at
   - Case remains readable by admin until deleted

---

## ALTERNATIVE FLOWS

### A1: Closure Blocked by PENDING Hours
- Admin attempts closure
- System detects registered_hours with status=PENDING
- Closure is rejected with the list of pending hour entries
- Admin must either:
  - Approve the hours (WF-006)
  - Reject the hours (WF-006)
  - Flag as OUTSIDE_GRANT for WF-007 review
- Then re-attempt closure

### A2: Admin Proceeds Despite Advisory Warnings
- Admin acknowledges one or both advisory warnings (unreviewed OUTSIDE_GRANT hours, DRAFT session logs)
- Admin confirms closure
- System closes the case as per main flow
- Warning conditions are not automatically resolved — they remain in their current state

### A3: Archival of Case with No Active Grants
- Case has no CaseGrant records with status=ACTIVE (e.g., all grants were already ARCHIVED or REVOKED)
- Archival proceeds normally
- Grant archival step produces no changes (no qualifying grants)
- Event: `CASE_ARCHIVED` is still logged

### A4: Archival Immediately After Closure
- Admin closes and archives on the same day
- Both steps are permitted in sequence without a mandatory waiting period
- MVP imposes no minimum time between closure and archival

---

## BUSINESS RULES

### Closure Rules
1. **PENDING hours are a hard block** — Closure is refused until all registered_hours with status=PENDING are resolved
2. **REJECTED hours do not block** — Already-decided hours do not prevent closure
3. **OUTSIDE_GRANT hours without review are advisory only** — Admin sees a warning but may close regardless
4. **DRAFT session logs are advisory only** — Admin sees a warning but may close regardless
5. **Closure ends all active assignments atomically** — All CaseAssignments with ended_at IS NULL receive ended_at = NOW() and assignment_status = TERMINATED in the same transaction as cases.status → COMPLETED
6. **No new activity after COMPLETED** — No new session_logs or registered_hours can be created for a COMPLETED case

### Archival Rules
7. **Archival is a separate manual step** — No automatic archival after closure
8. **Grant archival is atomic with case archival** — All ACTIVE case_grants receive status=ARCHIVED and archived_at=NOW() in the same transaction
9. **data_retention_expires_at is set at archival** — Value is archived_at + 7 years (INTERVAL); set once and never changed
10. **Archived cases are immutable** — No status change, field edit, or content change after status=ARCHIVED

---

## NOTIFICATION EVENTS

WF-012 emits the following notification events. The workflow records the notification type and recipient — it does not specify delivery channel. Channel assignment is owned by WF-014 (Notification Dispatch, pending ADR-010 ratification).

| Notification Type | Recipient | Trigger |
|---|---|---|
| `CASE_ASSIGNMENT_TERMINATED` | Professional | Closure transaction ends the CaseAssignment (assignment_status = TERMINATED) — one notification per terminated assignment |

**Notes:**
- `CASE_ASSIGNMENT_TERMINATED` informs the professional that their engagement on the case has formally ended. This is distinct from the WF-008 handover notification (which uses TRANSITIONED status for a planned transfer to another professional).
- No outbound notification is generated for `CASE_ARCHIVED` — archival is an internal administrative operation; admin is the actor and requires no notification.
- Admin receives no notification for closure or archival actions they personally initiate.

---

## AUDIT EVENTS

- `CASE_CLOSED` — Case transitions from ACTIVE to COMPLETED

**Metadata:**
```json
{
  "case_id": "uuid",
  "closed_by": "uuid",
  "warnings_acknowledged": ["DRAFT_SESSION_LOGS", "OUTSIDE_GRANT_HOURS"]
}
```

- `CASE_ASSIGNMENT_ENDED` — CaseAssignment ended as part of closure

**Metadata:**
```json
{
  "case_assignment_id": "uuid",
  "case_id": "uuid",
  "professional_id": "uuid",
  "ended_by": "uuid",
  "assignment_status": "TERMINATED"
}
```

- `CASE_ARCHIVED` — Case transitions from COMPLETED to ARCHIVED

**Metadata:**
```json
{
  "case_id": "uuid",
  "archived_by": "uuid",
  "archived_at": "timestamp",
  "data_retention_expires_at": "timestamp"
}
```

---

## OUTPUTS

**After Closure:**
- cases.status = COMPLETED
- All CaseAssignments ended (ended_at = NOW(), assignment_status = TERMINATED)
- Audit trail: CASE_CLOSED, CASE_ASSIGNMENT_ENDED

**After Archival:**
- cases.status = ARCHIVED
- cases.archived_at = set
- cases.data_retention_expires_at = archived_at + 7 years
- All previously ACTIVE case_grants: status = ARCHIVED, archived_at = set
- Audit trail: CASE_ARCHIVED

---

## DATA STRUCTURES

**cases (modified at closure):**
- status: ACTIVE → COMPLETED

**case_assignments (modified at closure):**
- ended_at: TIMESTAMPTZ set to NOW()
- assignment_status: ACTIVE → TERMINATED

**cases (modified at archival):**
- status: COMPLETED → ARCHIVED
- archived_at: TIMESTAMPTZ set to NOW()
- data_retention_expires_at: TIMESTAMPTZ set to archived_at + INTERVAL '7 years'

**case_grants (modified at archival, if status=ACTIVE):**
- status: ACTIVE → ARCHIVED
- archived_at: TIMESTAMPTZ set to NOW()

---

## TS-001 AMENDMENTS REQUIRED

None. All fields required by this workflow (cases.status, cases.archived_at, cases.data_retention_expires_at, case_assignments.ended_at, case_assignments.assignment_status, case_grants.status, case_grants.archived_at) are already defined in TS-001.

---

## WORKFLOW CONNECTIONS

| Reference | Direction | Description |
|-----------|-----------|-------------|
| WF-004 | Upstream | Case must have been activated (status=ACTIVE) via WF-004 before closure |
| WF-005 | Upstream | DRAFT session logs generate advisory warning at closure; should be finalized before closing |
| WF-006 | Upstream | PENDING registered_hours BLOCK closure; must be resolved first |
| WF-007 | Upstream | Unreviewed OUTSIDE_GRANT hours generate advisory warning at closure; WF-007 review clears the warning |
| WF-008 | Lateral | Professional handover (WF-008) ends the outgoing assignment via TRANSITIONED status; WF-012 closure ends assignments via TERMINATED status |
| WF-013 | Downstream | GDPR data retention and deletion triggered by data_retention_expires_at set during archival |

---

## OPEN QUESTIONS

1. Should admin be required to enter a closure reason (e.g., GOAL_MET, WITHDRAWN, FUNDING_ENDED)?
2. Should there be a mandatory review period between closure and archival (e.g., 30-day minimum)?
3. **[DECISION REQUIRED] Can DRAFT session logs be finalized after case closure?**

   This rule has not been locked. The following options exist:

   **Option A — Permanently locked at closure**
   - Logic: Case is COMPLETED; active documentation should be finished before closure. The advisory warning gave admin the opportunity to delay closure.
   - Consequence: Any DRAFT log at the moment of closure is permanently frozen. The professional has no recourse. The session may have occurred but is never formally finalized. The correction flow (WF-005 A2) is also unavailable, as it requires FINAL status first.
   - Risk: Creates a permanent documentation gap for any session not finalized before closure. Punishes professionals for administrative delays outside their control.

   **Option B — Finalization permitted after closure, no time limit**
   - Logic: Session logs document real sessions that occurred before closure. The right to finalize that documentation does not expire when the case closes. Creating new session logs is blocked; finalizing existing ones is completing work already in progress.
   - Consequence: Professional can finalize DRAFT session logs on a COMPLETED case at any time. Finalized logs appear on the case record retroactively.
   - Risk: A DRAFT log finalized weeks or months after closure appears as new final content on a closed case. Could create confusion if the case is also being prepared for archival.

   **Option C — Grace period after closure (e.g., 7 or 14 days)**
   - Logic: Give professionals a defined window; then lock.
   - Consequence: Requires tracking grace period start (closure date) and enforcing a cutoff, either via a scheduled job or at-query enforcement. Adds implementation complexity.
   - Risk: Window length is arbitrary and requires a separate policy decision. Likely over-engineered for MVP.

   **Option D — Finalization permitted while COMPLETED; locked at ARCHIVED**
   - Logic: The COMPLETED → ARCHIVED gap is specifically designed as a review window. Allow session log finalization during that window. ARCHIVED = fully and truly immutable.
   - Consequence: Natural cutoff using the existing two-step lifecycle. No additional timer or enforcement logic required. Professional retains access to their DRAFT logs until admin archives the case. Admin controls the archival timeline.
   - Risk: Admin must deliberately archive when they intend to close out documentation. In practice, this means the review window is the operative finalization deadline.

   **Recommendation: Option D.** It uses the existing lifecycle correctly — COMPLETED is a review state, ARCHIVED is an immutable state. It requires no new enforcement logic, respects professional accountability, and does not create an arbitrary time limit. The advisory warning at closure still serves its purpose: it signals to admin that documentation is incomplete, giving them a reason to delay archival.

   **This question is blocking the implementation-ready declaration for WF-012 and must be explicitly locked before this workflow is marked APPROVED.**
4. Should admin receive a summary of all case activity (hours total, sessions count, duration) at the closure confirmation screen?
5. Should the system allow re-opening a COMPLETED case to ACTIVE (e.g., if support resumes after a short break)?

---

**This workflow is APPROVED except for one pending decision: Open Question 3 (DRAFT session log finalization after closure) has not been locked. All other business rules, flows, and TS-001 amendments are approved. Owned by Case Domain. Depends on WF-004 (activation), WF-005 (session logs), WF-006 (registered hours), and WF-007 (outside-grant review). Triggers GDPR data retention countdown via WF-013.**
