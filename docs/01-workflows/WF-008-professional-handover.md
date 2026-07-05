# WF-008: Professional Handover

**Workflow ID:** WF-008  
**Title:** Structured Professional Handover — Change Case Assignment  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Case Domain

---

## PURPOSE

Formally transition a case from one professional to another, ensuring continuity of care, documentation transfer, and explicit decision-making.

---

## ACTORS

- **Case Coordinator (Admin)** — Initiates handover
- **Outgoing Professional** — Being removed from case
- **Incoming Professional** — Taking over case
- **Governance Domain** — Logs handover events

---

## TRIGGER

Case Coordinator initiates handover when:
- Current professional going on leave
- Professional requesting case removal
- Better match found (rematch)
- Safeguarding concern with current professional
- Workload management

---

## PRECONDITIONS

- Case exists with status != ARCHIVED
- Professional currently assigned (CaseAssignment with ended_at IS NULL)
- Incoming professional (if any) is ACTIVE and has capacity

---

## MAIN FLOW

1. **Admin initiates handover**
   - Input: Case, outgoing professional, reason
   - Creates CaseHandover record
   - CaseHandover status=INITIATED
   - Reason: PROFESSIONAL_UNAVAILABLE, WORKLOAD_EXCEEDED, REQUEST_PROFESSIONAL, REQUEST_CASE, BETTER_MATCH, SAFEGUARDING_CONCERN, OTHER
   - Event: `HANDOVER_INITIATED` logged

2. **Admin specifies incoming professional**
   - Option A: Assign specific professional (already decided)
   - Option B: Run matching (WF-003) for new assignment
   - Option C: Case terminating (no incoming professional)
   - CaseHandover.incoming_professional_id = NULL (if terminating)

3. **System prepares documentation transfer**
   - CaseHandover asks: "Transfer session logs to incoming professional?"
   - If YES: List all session logs from outgoing professional
   - Admin selects which to transfer (usually all)
   - Creates SessionLogTransfer records (immutable, audited)
   - Event: `SESSION_LOG_TRANSFERRED` logged per transfer

4. **Admin confirms handover in progress**
   - CaseHandover status=IN_PROGRESS
   - Both professionals notified (outgoing: ending case, incoming: new case)
   - System prevents double-assignment during this state

5. **Admin completes handover**
   - Confirms all documentation transferred
   - Confirms incoming professional ready
   - CaseHandover status=COMPLETED
   - System creates new CaseAssignment for incoming professional (ended_at IS NULL)
   - System ends old CaseAssignment (sets ended_at = NOW)
   - Case status unchanged (remains ACTIVE or MATCHED)
   - Event: `HANDOVER_COMPLETED` logged

6. **Workflow complete**
   - New professional assigned
   - Previous professional no longer assigned (but history preserved)
   - Session logs visible to new professional (via SessionLogTransfer)
   - Case continuous, no disruption

---

## ALTERNATIVE FLOWS

### A1: Case Terminating (No Incoming Professional)
- Admin selects incoming_professional_id = NULL
- CaseHandover status=COMPLETED
- CaseAssignment for outgoing professional ends
- No new CaseAssignment created
- Case status remains ACTIVE (can be closed separately via WF-012)

### A2: Professional Requests Own Removal
- Professional submits request (system message or email)
- Admin reviews and initiates handover
- Admin selects new professional or terminates
- Otherwise same flow

### A3: Emergency Handover (Safeguarding)
- Safeguarding concern identified
- Admin rapidly initiates handover
- Fast-tracked approval
- All history transferred
- Same flow but flagged as urgent

### A4: Handover Cancelled
- During IN_PROGRESS state, admin cancels
- Outgoing professional remains assigned
- CaseHandover status=CANCELLED
- No CaseAssignment changes
- Event: `HANDOVER_CANCELLED` logged

---

## BUSINESS RULES

1. **Handover is explicit structured process** — Not automatic reassignment
2. **Cannot skip documentation transfer** — Must explicitly handle session logs
3. **New professional inherits case history** — Can see previous sessions via transfer
4. **Only one active assignment at a time** — CaseAssignment where ended_at IS NULL is unique
5. **CaseAssignment never updated** — Always create new record for new professional
6. **Documentation transfer is immutable** — Creates audit trail of who accessed what

---

## AUDIT EVENTS

- `HANDOVER_INITIATED` — Handover started
- `SESSION_LOG_TRANSFERRED` — Session log made visible to incoming professional
- `HANDOVER_IN_PROGRESS` — Transfer underway
- `HANDOVER_COMPLETED` — New professional now assigned
- `HANDOVER_CANCELLED` — Handover cancelled, original continues

---

## OUTPUTS

- Old CaseAssignment ended (ended_at set)
- New CaseAssignment created for incoming professional
- SessionLogTransfer records created (audit trail)
- Case continuous (no gap in assignment)
- Audit trail of handover reason and process

---

## DATA STRUCTURES

**CaseHandover:**
- case_id, outgoing_professional_id, incoming_professional_id (nullable)
- reason (enum)
- status (INITIATED, IN_PROGRESS, COMPLETED, CANCELLED)
- handover_note (optional text, encrypted)
- session_logs_transferred (boolean)
- transferred_session_logs (array of session_log IDs)
- created_by (admin), created_at, completed_at

**SessionLogTransfer:**
- session_log_id, from_professional_id, to_professional_id
- approved_by (admin), reason, transfer_note
- created_at (immutable), visibility_granted_at

---

## EXAMPLE SCENARIO

**Case: Teenager with school engagement issues (MEDIUM complexity, 4h/week)**

Current: Professional Alice assigned for 3 months

**Event:** Alice going on maternity leave

**Process:**
1. Admin initiates handover: reason=PROFESSIONAL_UNAVAILABLE
2. Admin runs matching to find replacement
3. System recommends Bob (pedagogue, school experience, available)
4. Admin approves: incoming=Bob
5. System lists 12 session logs from Alice (3 months × 4/week)
6. Admin confirms all will transfer
7. SessionLogTransfer created (12 records) for Bob to view Alice's work
8. Handover marked IN_PROGRESS
9. Bob and Alice notified
10. Admin confirms: Handover COMPLETED
11. Old CaseAssignment (Alice) ends
12. New CaseAssignment (Bob) begins
13. Bob can now view Alice's session history
14. Case continues seamlessly

---

## OPEN QUESTIONS

1. Can handover happen while case status=OPEN (pre-matching)? Or only MATCHED/ACTIVE?
2. Should outgoing professional retain view access to case history after handover?
3. Should incoming professional be able to view outgoing professional's contact info?
4. Should handover be scheduled in advance (e.g., "handover on date X")?
5. Is there a delay/overlap period where both professionals are assigned?

---

## API ENDPOINTS

| Trin | Metode | Endpoint | Auth | Tabel |
|---|---|---|---|---|
| Opret overdragelse | `POST` | `/api/cases/:id/handovers` | Admin | `case_handovers` |
| Opdater overdragelse | `PATCH` | `/api/cases/:id/handovers/:handoverId` | Admin | `case_handovers` |
| Overfør sessionlogs | `POST` | `/api/session-logs/:id/transfers` | Admin | `session_log_transfers` |
| Afslut gammel tildeling | `POST` | `/api/cases/:id/assignments/:assignmentId/end` | Admin | `case_assignments` |
| Opdater fagpersonstatus | `PATCH` | `/api/professionals/:id` | Admin | `professionals` |
| Opret ny tildeling | `POST` | `/api/cases/:id/assignments` | Admin | `case_assignments` |

**TS-002 reference:** §6.10–6.12 (Handovers), §7.8 (Session Log Transfers), §6.6 (Assignments), §4.4 (Professional status)

---

**This workflow is implementation-ready. Related to CaseAssignment temporal model and SessionLogTransfer audit.**
