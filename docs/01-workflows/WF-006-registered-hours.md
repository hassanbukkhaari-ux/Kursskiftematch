# WF-006: Registered Hours and Hour Approval

**Workflow ID:** WF-006  
**Title:** Hours Registration, Submission, and Admin Approval  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Delivery Domain (submission) + Governance Domain (approval)

---

## PURPOSE

Enable professionals to register hours worked on cases (for payroll and grant tracking), submit them for approval, and allow admin to approve, reject, or flag as outside grant.

---

## ACTORS

- **Professional** — Registers and submits hours
- **Case Coordinator (Admin)** — Approves, rejects, or reviews hours

---

## TRIGGER

Professional navigates to "Register Hours" after completing sessions or other billable work.

---

## PRECONDITIONS

- Professional is assigned to case (CaseAssignment exists)
- Work is recent enough to record accurately (MVP: no hard cutoff, manual discipline)
- Case has active grant allocation (CaseGrant)

---

## MAIN FLOW

1. **Professional enters hour details**
   - Selects case
   - Selects work_date
   - Selects work_type (DIRECT_SESSION, TRANSPORT, DOCUMENTATION, COORDINATION, CRISIS_RESPONSE, TRAINING, OTHER)
   - Enters hours (0.25 to 8.0)
   - Optional: Links to session_log (if DIRECT_SESSION)
   - Optional: Adds description/notes
   - Hours created with status=PENDING

2. **Professional reviews and submits**
   - Confirms accuracy
   - Submits hours
   - Hours status → SUBMITTED
   - Event: `HOURS_SUBMITTED` logged

3. **Admin receives pending approval**
   - Views hours in approval queue
   - Can review professional's session log (if linked)
   - Can view case details, grant remaining
   - Checks: Hours reasonable? Session documented? Within grant?

4. **System auto-checks grant remaining**
   - Query: remaining_hours = SUM(grant) - SUM(approved hours)
   - If submitted_hours + approved > grant:
     - Mark hours as status=OUTSIDE_GRANT (don't auto-reject)
     - Alert admin
     - Proceed to outside grant review (WF-007)
   - If within grant: Proceed to step 5

5. **Admin approves hours**
   - Reviews submission
   - Approves (status=APPROVED)
   - Hours now count toward professional payroll and grant usage
   - Event: `HOURS_APPROVED` logged

6. **Workflow complete**
   - Professional's hours recorded
   - Grant remaining_hours updated
   - Can be exported for payroll

---

## ALTERNATIVE FLOWS

### A1: Admin Rejects Hours
- Admin finds issue (e.g., hours too high, no session documented, case already closed)
- Sets status=REJECTED with note
- Professional notified (manual email)
- Professional can re-submit corrected hours
- Event: `HOURS_REJECTED` logged with reason

### A2: Hours Exceed Grant (Outside Grant)
- System detects: submitted_hours > remaining_grant
- Status automatically → OUTSIDE_GRANT
- Redirect to WF-007 (Outside Grant Review)
- Not approved until reviewed

### A3: Professional Modifies Pending Hours
- If status=PENDING (not yet submitted), professional can edit
- If status=SUBMITTED or later, cannot edit (create correction request)
- Change logged in audit trail

---

## BUSINESS RULES

1. **Hours must be submitted before approval** (status: PENDING → SUBMITTED → APPROVED)
2. **Outside grant hours require explicit review** (WF-007)
3. **Approved hours are immutable** (cannot unapprove without audit reason)
4. **Hours link to session is optional** (some work doesn't have sessions)
5. **Only ACTIVE professionals can register hours** (INACTIVE, ARCHIVED cannot)
6. **Professional cannot approve own hours** (only admin)
7. **Grant calculation is automatic** (no manual override of grant)

---

## AUDIT EVENTS

- `HOURS_REGISTERED` — Professional creates hours entry
- `HOURS_SUBMITTED` — Professional submits for approval
- `HOURS_APPROVED` — Admin approves
- `HOURS_REJECTED` — Admin rejects (with reason)
- `HOURS_OUTSIDE_GRANT_FLAGGED` — Auto-flagged as exceeding grant
- `HOURS_MODIFIED` — Hours edited before submission

---

## OUTPUTS

- RegisteredHours record with status=APPROVED
- Audit trail of approval
- Grant remaining_hours decreased
- Payroll-ready record

---

## GRANT TRACKING LOGIC

```
remaining_hours = grant.granted_hours - SUM(approved_hours for this grant)

If new_hours + approved_total > grant.granted_hours:
  Status = OUTSIDE_GRANT (awaiting review per WF-007)
Else:
  Can be APPROVED directly
```

**Example:**
- Grant: 24 hours/month
- Approved so far: 18 hours
- Professional submits: 4 hours
- Remaining: 24 - 18 - 4 = 2 hours ✓ (within grant)
- Status: APPROVED

- Professional submits: 8 hours
- New total would be: 24 - 18 - 8 = -2 hours ✗ (exceeds grant)
- Status: OUTSIDE_GRANT (awaiting review)

---

## OPEN QUESTIONS

1. Can professional edit hours after submission but before approval?
2. What is SLA for admin hour approval (1 day? 1 week)?
3. Should system enforce minimum hours (0.25)?
4. Should system warn professional if hours seem high (> 8/day)?
5. Can approved hours be reversed if mistake found later?

---

## API ENDPOINTS

| Trin | Metode | Endpoint | Auth | Tabel |
|---|---|---|---|---|
| Registrer timer | `POST` | `/api/registered-hours` | Professional/Admin | `registered_hours` |
| Rediger timer (PENDING) | `PATCH` | `/api/registered-hours/:id` | Own (PENDING) | `registered_hours` |
| Indsend timer til godkendelse | `POST` | `/api/registered-hours/:id/submit` | Own | `registered_hours` |
| Godkend/afvis timer (admin) | `POST` | `/api/registered-hours/:id/review` | Admin | `registered_hours` |
| Hent timerliste | `GET` | `/api/registered-hours` | Own/Admin | `registered_hours` |
| Hent enkelt post | `GET` | `/api/registered-hours/:id` | Own/Admin | `registered_hours` |

**TS-002 reference:** §7.10–7.15 (Registered Hours Endpoints)

---

**This workflow is implementation-ready. Entities defined in DOMAIN_MODEL_DATABASE_SPEC.md**
