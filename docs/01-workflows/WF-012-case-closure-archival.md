# WF-012: Case Closure and Archival

**Workflow ID:** WF-012  
**Title:** Case Closure and Archival  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Case Domain

---

## PURPOSE

Formally close a completed case and transition it to archival. Ensures all documentation is finalized, the professional's assignment is ended, and the case enters the 7-year retention period before GDPR deletion.

---

## ACTORS

- **Admin** — Initiates closure and archival
- **Professional** — Should have finalized all session logs and hours before closure
- **System** — Sets `archived_at` and `data_retention_expires_at` on archival

---

## TRIGGER

Admin initiates case closure when:
- Support goals are achieved (case complete)
- Citizen no longer needs support (natural end)
- Municipality withdraws funding (grant exhausted or cancelled)
- Case opened in error (OPEN → ARCHIVED directly)

---

## PRECONDITIONS

For ACTIVE → COMPLETED:
- Case `status = 'ACTIVE'`
- All `session_logs` should be in `FINAL` or `ARCHIVED` status (admin verifies)
- All `registered_hours` should be reviewed (no `PENDING` or `SUBMITTED` hours outstanding)
- At least one active `case_assignment` exists (`ended_at IS NULL`)

For COMPLETED → ARCHIVED:
- Case `status = 'COMPLETED'`

For OPEN → ARCHIVED (case opened in error or abandoned before matching):
- Case `status = 'OPEN'`

---

## MAIN FLOW

### Phase 1: Close Active Case (ACTIVE → COMPLETED)

**Step 1 — Admin reviews case for closure readiness**

Admin checks:
- All session logs finalized (no `DRAFT` session logs)
- All registered hours reviewed (no `PENDING`/`SUBMITTED` outstanding)
- Professional has submitted final notes if applicable

**Step 2 — Admin calls PATCH /api/cases/:id with `status: COMPLETED`**

System:
- Validates preconditions (no open drafts outstanding — advisory check)
- Updates `cases.status = 'COMPLETED'`
- Updates `cases.updated_at = NOW()`
- Sets `case_assignments.ended_at = NOW()` for all active assignments (or via separate endpoint `POST /api/cases/:id/assignments/:assignmentId/end`)
- Audit event: `CASE_COMPLETED` — `{ "resource_type": "cases", "resource_id": "<case_id>" }`

**Step 3 — Professional is notified**

System writes to `notification_log`:
- Type: `CASE_CLOSED`
- Recipient: professional assigned to the case
- Content: case reference, closure date

---

### Phase 2: Archive Completed Case (COMPLETED → ARCHIVED)

**Step 4 — Admin calls PATCH /api/cases/:id with `status: ARCHIVED`** (or system auto-archives after configurable period)

System:
- Updates `cases.status = 'ARCHIVED'`
- Sets `cases.archived_at = NOW()`
- Sets `cases.data_retention_expires_at = NOW() + INTERVAL '7 years'`
- Audit event: `CASE_ARCHIVED` — `{ "resource_type": "cases", "resource_id": "<case_id>" }`

**Step 5 — Session logs archived**

Admin or system:
- Updates all `session_logs` for this case: `status = 'ARCHIVED'`
- Sets `session_logs.data_retention_expires_at = NOW() + INTERVAL '7 years'`
- Audit event: `SESSION_LOG_ARCHIVED` per log

**Step 6 — System creates deletion schedule entry**

System calls `POST /api/deletion-schedules`:
- `record_type = 'cases'`
- `record_id = <case_id>`
- `scheduled_for_deletion_at = data_retention_expires_at + INTERVAL '24 hours'`
- `retention_expired_at = data_retention_expires_at`
- `reason = 'RETENTION_EXPIRED'`

This entry triggers WF-013 (GDPR Retention and Deletion) at expiry.

---

## ALTERNATIVE FLOWS

### A1: Open Case Abandoned (OPEN → ARCHIVED)

Case was created but never progressed to matching or activation:

1. Admin calls PATCH /api/cases/:id with `status: ARCHIVED`
2. System sets `archived_at = NOW()`, `data_retention_expires_at = NOW() + INTERVAL '7 years'`
3. Audit event: `CASE_ARCHIVED`
4. No session logs or assignments to close (none exist yet)

### A2: Outstanding Hours at Closure

If `registered_hours` with `status = 'PENDING'` or `status = 'SUBMITTED'` exist when admin tries to close:
- System WARNS admin (does not block — admin can proceed)
- Admin should review hours before closure
- Outstanding hours can still be approved/rejected after case is COMPLETED
- Transition to ARCHIVED should wait until all hours are resolved

### A3: Safeguarding Flag Open at Closure

If a `session_log` has `safeguarding_flagged = TRUE` and `safeguarding_acknowledged = FALSE`:
- System WARNS admin (does not block)
- Admin should ensure safeguarding concern is actioned before closure
- Safeguarding concerns are not blocked by archival

---

## STATE TRANSITIONS

```
OPEN → MATCHED (WF-003)
OPEN → ARCHIVED (A1: abandoned)
MATCHED → ACTIVE (WF-004)
MATCHED → OPEN (WF-003 cancelled)
ACTIVE → COMPLETED (this workflow, Phase 1)
COMPLETED → ARCHIVED (this workflow, Phase 2)
```

All transitions are one-way. No reversal from COMPLETED or ARCHIVED.

---

## BUSINESS RULES

1. **Assignments must be ended** — All `case_assignments` with `ended_at IS NULL` must be ended when transitioning ACTIVE → COMPLETED.
2. **archived_at is set once** — Once set, `archived_at` is never updated. Immutable timestamp.
3. **data_retention_expires_at is derived** — Calculated as `archived_at + 7 years`. Never stored separately from this formula.
4. **7-year retention** — All archived cases are retained for 7 years from archival date, then physically deleted via WF-013.
5. **Session logs follow case** — Session logs are archived concurrently with the case; their own `data_retention_expires_at` is set to the same date.
6. **No reactivation** — Cases cannot transition back from COMPLETED or ARCHIVED. A new case must be created for resumed support.
7. **Admin-only transitions** — Status changes to COMPLETED and ARCHIVED are admin-only (RLS enforced).

---

## TS-001 TABLES

**cases** — Case Domain

| Column | Type | Notes |
|---|---|---|
| `status` | TEXT | CHECK: OPEN, MATCHED, ACTIVE, COMPLETED, ARCHIVED |
| `archived_at` | TIMESTAMPTZ | Set when status → ARCHIVED |
| `data_retention_expires_at` | TIMESTAMPTZ | Set when status → ARCHIVED; `archived_at + 7 years` |

**case_assignments** — Case Domain

| Column | Type | Notes |
|---|---|---|
| `ended_at` | TIMESTAMPTZ | Set when assignment ends; NULL = still active |

---

## AUDIT EVENTS

| Event | Trigger |
|---|---|
| `CASE_COMPLETED` | ACTIVE → COMPLETED transition |
| `CASE_ARCHIVED` | COMPLETED → ARCHIVED transition (or OPEN → ARCHIVED) |
| `SESSION_LOG_ARCHIVED` | Session log archived with case |

---

## OUTPUTS

- `cases.status = 'COMPLETED'` then `'ARCHIVED'`
- `cases.archived_at` set
- `cases.data_retention_expires_at` set (7 years from archival)
- All `case_assignments.ended_at` set
- All `session_logs.status = 'ARCHIVED'`
- `deletion_schedules` entry created for future WF-013 execution

---

## RELATED WORKFLOWS

- **WF-003 (Match Run and Assignment)** — Creates the assignment; this workflow ends it
- **WF-004 (Case Activation)** — Activates case; this workflow closes it
- **WF-008 (Professional Handover)** — Alternative path that also ends assignments and may result in closure
- **WF-013 (GDPR Retention and Deletion)** — Physically deletes the case after 7-year retention expires
