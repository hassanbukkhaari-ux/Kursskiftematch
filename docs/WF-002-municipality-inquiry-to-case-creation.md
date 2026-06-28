# WF-013: GDPR Retention and Deletion

**Workflow ID:** WF-013  
**Title:** Data Retention Policy and Right-to-be-Forgotten Implementation  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Governance Domain

---

## PURPOSE

Automatically schedule and execute data deletion after retention periods expire, respecting GDPR right-to-be-forgotten (Article 17) while maintaining immutable audit trail.

---

## ACTORS

- **System (Scheduled Job)** — Automatic deletion processor
- **Governance Domain** — Retention policy enforcement
- **Admin** — Reviews scheduled deletions before execution (optional override)

---

## TRIGGER

Automatic: Runs nightly. For each archived record, checks if retention_expires_at < TODAY.

---

## PRECONDITIONS

- Record is archived (status=ARCHIVED or soft-deleted)
- data_retention_expires_at timestamp exists
- 7 years have passed since archival (default retention period)

---

## MAIN FLOW

### Phase 1: Schedule for Deletion (Week of expiry)

1. **System identifies expired records**
   - Query: WHERE archived_at IS NOT NULL AND data_retention_expires_at < TODAY
   - Check tables:
     - cases (if archived)
     - professionals (if archived)
     - session_logs (if archived)
     - registered_hours (if archived)
     - professional_documents (if archived)
   - Each record marked for deletion

2. **System creates retention schedule**
   - For each expired record: Create DeletionSchedule entry
   - DeletionSchedule:
     - record_type (table name)
     - record_id (UUID)
     - scheduled_for_deletion_at (timestamp)
     - retention_expired_at (data_retention_expires_at value)
   - Event: `DATA_DELETION_SCHEDULED` logged

3. **Admin review window (optional)**
   - MVP: No mandatory review (automatic processing)
   - Phase 2: Optional admin interface to review before deletion
   - Can override if retention extended (e.g., legal hold)

### Phase 2: Execute Deletion (Nightly, after 24hr window)

4. **System executes deletion**
   - For each DeletionSchedule where scheduled_for_deletion_at < NOW:
     - Read record completely (for audit)
     - **Soft-delete** (not hard delete):
       - Set status=DELETED
       - Set deleted_at=NOW
       - Keep all other data intact
     - **DO NOT:** Hard delete from database
     - Event: `DATA_DELETED` logged (audit-only, no sensitive content)

5. **Audit trail of deletion**
   - Create AuditEvent: DATA_DELETED
   - Metadata:
     - record_type, record_id
     - deleted_at, reason="Retention period expired"
     - retention_period_years: 7
   - This event is immutable (can never be deleted)

6. **Workflow complete**
   - Record is soft-deleted (logical removal)
   - Cannot be queried in user-facing API
   - Audit trail remains (DATA_DELETED event immutable)
   - Data still recoverable via database if needed for legal investigation

---

## ALTERNATIVE FLOWS

### A1: Retention Extended (Legal Hold)
- Admin may extend retention for legal reasons
- Before scheduled deletion:
  - DeletionSchedule.scheduled_for_deletion_at = new_date
  - Event: `RETENTION_EXTENDED` logged with reason
  - Deletion postponed

### A2: Manual Data Subject Deletion Request
- Professional or citizen requests right-to-be-forgotten (not waiting for 7 years)
- Process similar to Phase 1-2, but triggered immediately:
  - DeletionSchedule created immediately
  - 30-day delay (legal requirement in many jurisdictions) before execution
  - Admin can review and approve
  - Deletion proceeds after 30 days
  - Event: `DATA_SUBJECT_DELETION_REQUESTED` logged

### A3: Hard Deletion (If Required)
- If legal requirement mandates complete removal (rare):
  - Not implemented in MVP (soft delete only)
  - Would require careful handling of foreign keys
  - Phase 2 decision if needed

---

## BUSINESS RULES

1. **Default retention: 7 years** after case/professional archived
2. **Soft delete only** — No hard database deletes (preserve audit trail)
3. **Audit trail immutable** — DATA_DELETED event cannot be deleted
4. **Right-to-be-forgotten respected** — Can request early deletion (30-day delay)
5. **No automatic hard deletion** — Must be explicit and audited
6. **Retention can be extended** — Legal holds override automatic schedule

---

## RETENTION BY RECORD TYPE

| Record Type | Retention Start | Retention Period | Deletion Method |
|---|---|---|---|
| Case | archived_at | 7 years | Soft delete |
| Professional | archived_at | 7 years | Soft delete |
| SessionLog | archived_at | 7 years | Soft delete |
| RegisteredHours | archived_at | 7 years | Soft delete |
| ProfessionalDocument | archived_at | 7 years | Soft delete |
| AuditEvents | created_at | Never (perpetual) | Never |
| ContactDisclosure | created_at | 7 years | Soft delete |

**Note:** AuditEvents are perpetual (never deleted) to maintain immutable audit trail.

---

## AUDIT EVENTS

- `DATA_DELETION_SCHEDULED` — Record marked for future deletion
- `RETENTION_EXTENDED` — Deletion postponed by admin decision
- `DATA_DELETED` — Record soft-deleted (status=DELETED, deleted_at set)
- `DATA_SUBJECT_DELETION_REQUESTED` — Manual request from user
- `DATA_SUBJECT_DELETION_APPROVED` — Admin approved deletion request
- `DATA_SUBJECT_DELETION_EXECUTED` — Deletion executed post 30-day delay

---

## OUTPUTS

- Record status changed to DELETED (soft delete)
- deleted_at timestamp recorded
- Audit event logged (immutable)
- Record no longer visible in user-facing API
- Record recoverable via direct database query (if needed for legal)

---

## DATA STRUCTURES

**DeletionSchedule:**
- id (UUID)
- record_type (table name)
- record_id (UUID of record to delete)
- scheduled_for_deletion_at (timestamp)
- retention_expired_at (when retention ended)
- reason (enum: RETENTION_EXPIRED, USER_REQUEST, LEGAL_REQUIREMENT)
- created_at, executed_at (null until deletion)

---

## EXAMPLE TIMELINE

**Case archived on 2019-06-27:**
- data_retention_expires_at = 2026-06-27 (7 years later)

**On 2026-06-27:** System checks, record is expired

**2026-06-27 (Week of expiry):**
- DeletionSchedule created
- Event: `DATA_DELETION_SCHEDULED` logged
- Admin optional review window

**2026-07-01 (Nightly deletion run):**
- scheduled_for_deletion_at < NOW
- Case.status = DELETED
- Case.deleted_at = 2026-07-01
- Event: `DATA_DELETED` logged
- Case no longer queryable in API
- AuditEvent of deletion remains immutable

**Future (2030):**
- If legal investigation needed: Database admin can query deleted case
- Audit trail shows when/why deletion occurred
- Immutable proof of GDPR compliance

---

## OPEN QUESTIONS

1. Should 30-day delay apply to automatic expirations (7-year retention)? Or only user-requested?
2. Should deletion be reversible during 30-day delay?
3. Should there be admin UI for DeletionSchedule review? (Recommended for Phase 2)
4. What happens if foreign key constraints prevent deletion?
5. Should audit events older than 30 years be deleted? (Recommendations: perpetual, but optional policy)

---

## GDPR COMPLIANCE NOTES

This workflow implements:
- ✅ **Article 17 (Right to be Forgotten):** User can request deletion (30-day delay respected)
- ✅ **Data Minimization:** Soft delete removes from user view
- ✅ **Retention Justification:** 7 years is standard for financial/healthcare records
- ✅ **Audit Trail:** Deletion events immutable, proving compliance
- ✅ **Legal Holds:** Can extend retention for legitimate reasons

---

**This workflow is implementation-ready. Deletion scheduled via background jobs (e.g., cron, cloud scheduler).**
