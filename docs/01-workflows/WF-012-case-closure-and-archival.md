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
   - Existing DRAFT session logs may be edited and finalized by the professional during the COMPLETED review window
   - Once the case reaches ARCHIVED status, all remaining DRAFT session logs are permanently locked from further editing or finalization
   - Case is visible to admin; professional may still view and complete documentation on historical records
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
   - All remaining DRAFT session logs are permanently locked — no further editing or finalization is permitted
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
- If DRAFT session logs exist, archiving immediately locks them permanently — admin should consider whether documentation should be completed first

### A5: Professional Finalizes DRAFT Session Log During COMPLETED Window
- After case closure, professional navigates to the COMPLETED case
- Professional can still access and edit existing DRAFT session logs
- Professional finalizes the DRAFT: session_log.status transitions DRAFT → FINAL (per WF-005 main flow)
- No new session_logs may be created — only existing DRAFTs may be finalized
- The finalized session log joins the case record; it is visible to admin alongside previously FINAL logs
- Once admin archives the case (COMPLETED → ARCHIVED), this window closes permanently

---

## BUSINESS RULES

### Closure Rules
1. **PENDING hours are a hard block** — Closure is refused until all registered_hours with status=PENDING are resolved
2. **REJECTED hours do not block** — Already-decided hours do not prevent closure
3. **OUTSIDE_GRANT hours without review are advisory only** — Admin sees a warning but may close regardless
4. **DRAFT session logs are advisory only** — Admin sees a warning but may close regardless
5. **Closure ends all active assignments atomically** — All CaseAssignments with ended_at IS NULL receive ended_at = NOW() and assignment_status = TERMINATED in the same transaction as cases.status → COMPLETED
6. **No new activity after COMPLETED** — No new session_logs or registered_hours can be created for a COMPLETED case
7. **DRAFT session logs may be finalized during the COMPLETED window** — Professional may edit and finalize existing DRAFT session logs while the case is COMPLETED; this access ends permanently when the case is ARCHIVED

### Archival Rules
8. **Archival is a separate manual step** — No automatic archival after closure
9. **Grant archival is atomic with case archival** — All ACTIVE case_grants receive status=ARCHIVED and archived_at=NOW() in the same transaction
10. **data_retention_expires_at is set at archival** — Value is archived_at + 7 years (INTERVAL); set once and never changed
11. **Archived cases are immutable** — No status change, field edit, or content change after status=ARCHIVED; all remaining DRAFT session logs are permanently locked at this point

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
| WF-005 | Upstream | DRAFT session logs generate advisory warning at closure; may still be finalized during the COMPLETED window; locked permanently at ARCHIVED |
| WF-006 | Upstream | PENDING registered_hours BLOCK closure; must be resolved first |
| WF-007 | Upstream | Unreviewed OUTSIDE_GRANT hours generate advisory warning at closure; WF-007 review clears the warning |
| WF-008 | Lateral | Professional handover (WF-008) ends the outgoing assignment via TRANSITIONED status; WF-012 closure ends assignments via TERMINATED status |
| WF-013 | Downstream | GDPR data retention and deletion triggered by data_retention_expires_at set during archival |

---

## OPEN QUESTIONS

1. Should admin be required to enter a closure reason (e.g., GOAL_MET, WITHDRAWN, FUNDING_ENDED)?
2. Should there be a mandatory review period between closure and archival (e.g., 30-day minimum)?
3. Should admin receive a summary of all case activity (hours total, sessions count, duration) at the closure confirmation screen?
4. Should the system allow re-opening a COMPLETED case to ACTIVE (e.g., if support resumes after a short break)?

---

**This workflow is implementation-ready. No TS-001 schema amendments are required. Owned by Case Domain. Depends on WF-004 (activation), WF-005 (session logs), WF-006 (registered hours), and WF-007 (outside-grant review). Triggers GDPR data retention countdown via WF-013. DRAFT session log finalization window: permitted during COMPLETED status, permanently locked at ARCHIVED (Decision: Option D, locked).**
