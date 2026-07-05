# WF-013: GDPR Retention and Deletion

**Workflow ID:** WF-013  
**Title:** Data Retention Policy and Scheduled Deletion  
**Status:** APPROVED for MVP  
**Version:** 2.0  
**Owner:** Governance Domain  
**Updated:** Rewritten to align with TS-001 lifecycle model (ADR-007: no status=DELETED, no deleted_at)

---

## PURPOSE

Schedule and execute physical deletion of records after their retention period expires, respecting GDPR Article 17 (right to erasure) while maintaining an immutable audit trail. Deletion here refers to physical removal from the database — not a status flag — because no `DELETED` status exists in the data model.

---

## ACTORS

- **System (Scheduled Job)** — Nightly cron that identifies expired records and executes scheduled deletions
- **Admin** — May impose legal holds, approve right-to-erasure requests

---

## TRIGGER

Nightly scheduled job. Two sequential passes per run:
1. **Identification pass** — Find records past retention period; create `deletion_schedules` entries
2. **Execution pass** — Physically delete records whose `scheduled_for_deletion_at` has passed

---

## PRECONDITIONS

- For lifecycle entities: record has `status = 'ARCHIVED'` and `archived_at` is set
- For contact_disclosures: record exists (write-once; no ARCHIVED state)
- For inbound_inquiries: record has qualifying status and is past its retention window
- No legal hold is active on the record (no future `scheduled_for_deletion_at` already set in deletion_schedules)

---

## RETENTION POLICY

| Record Type | Retention Starts | Period | Notes |
|---|---|---|---|
| `cases` | `archived_at` | 7 years | `data_retention_expires_at` column set at archival |
| `professionals` | `archived_at` | 7 years | |
| `session_logs` | `archived_at` | 7 years | `data_retention_expires_at` column set at archival |
| `registered_hours` | `archived_at` | 7 years | |
| `professional_documents` | `archived_at` | 7 years | |
| `contact_disclosures` | `created_at` | 7 years | Write-once; no ARCHIVED state |
| `inbound_inquiries` (SPAM, REJECTED) | `created_at` | 90 days | Short retention; low-value |
| `inbound_inquiries` (PENDING or REVIEWED, unconverted) | `created_at` | 90 days | Stale unconverted inquiries |
| `inbound_inquiries` (CONVERTED) | Canonical object's `archived_at` | 7 years | Follows the case or professional it generated |
| `audit_events` | `created_at` | Perpetual | Never deleted — immutable compliance trail |

---

## MAIN FLOW

### Phase 1: Identify Expired Records (Nightly identification pass)

**Step 1 — Query expired records**

System queries each table for records past their retention period that have not yet been scheduled for deletion:

**Cases (use data_retention_expires_at if present):**
```sql
SELECT id, 'cases' AS record_type, data_retention_expires_at AS retention_expired_at
FROM cases
WHERE status = 'ARCHIVED'
  AND data_retention_expires_at < NOW()
  AND id NOT IN (SELECT record_id FROM deletion_schedules WHERE executed_at IS NULL)
```

**Professionals, registered_hours, professional_documents (calculate from archived_at):**
```sql
-- Example for professionals
SELECT id, 'professionals' AS record_type, archived_at + INTERVAL '7 years' AS retention_expired_at
FROM professionals
WHERE status = 'ARCHIVED'
  AND archived_at + INTERVAL '7 years' < NOW()
  AND id NOT IN (SELECT record_id FROM deletion_schedules WHERE executed_at IS NULL)
```

**Session logs (use data_retention_expires_at):**
```sql
SELECT id, 'session_logs' AS record_type, data_retention_expires_at AS retention_expired_at
FROM session_logs
WHERE status = 'ARCHIVED'
  AND data_retention_expires_at < NOW()
  AND id NOT IN (SELECT record_id FROM deletion_schedules WHERE executed_at IS NULL)
```

**Contact disclosures:**
```sql
SELECT id, 'contact_disclosures' AS record_type, created_at + INTERVAL '7 years' AS retention_expired_at
FROM contact_disclosures
WHERE created_at + INTERVAL '7 years' < NOW()
  AND id NOT IN (SELECT record_id FROM deletion_schedules WHERE executed_at IS NULL)
```

**Inbound inquiries — SPAM/REJECTED (90 days):**
```sql
SELECT id, 'inbound_inquiries' AS record_type, created_at + INTERVAL '90 days' AS retention_expired_at
FROM inbound_inquiries
WHERE status IN ('SPAM', 'REJECTED')
  AND created_at + INTERVAL '90 days' < NOW()
  AND id NOT IN (SELECT record_id FROM deletion_schedules WHERE executed_at IS NULL)
```

**Inbound inquiries — unconverted PENDING/REVIEWED (90 days):**
```sql
SELECT id, 'inbound_inquiries' AS record_type, created_at + INTERVAL '90 days' AS retention_expired_at
FROM inbound_inquiries
WHERE status IN ('PENDING', 'REVIEWED')
  AND converted_to_id IS NULL
  AND created_at + INTERVAL '90 days' < NOW()
  AND id NOT IN (SELECT record_id FROM deletion_schedules WHERE executed_at IS NULL)
```

**Inbound inquiries — CONVERTED (follows canonical object's 7-year retention):**
- Handled indirectly: when the canonical case or professional is deleted in Phase 2, the associated inquiry is also deleted as part of FK cascade handling.

---

**Step 2 — Create DeletionSchedule entries**

For each expired record identified in Step 1:

```sql
INSERT INTO deletion_schedules (
  record_type,
  record_id,
  scheduled_for_deletion_at,
  retention_expired_at,
  reason
) VALUES (
  :record_type,
  :record_id,
  NOW() + INTERVAL '24 hours',  -- 24-hour window for admin review
  :retention_expired_at,
  'RETENTION_EXPIRED'
);
```

Audit event for each record scheduled:
- Event type: `DATA_DELETION_SCHEDULED`
- Metadata: `{ "record_type": "<table>", "scheduled_for": "<timestamp>" }`

---

### Phase 2: Execute Scheduled Deletions (Nightly execution pass)

**Step 3 — Query ready-to-execute deletion schedules**

```sql
SELECT * FROM deletion_schedules
WHERE scheduled_for_deletion_at < NOW()
  AND executed_at IS NULL;
```

**Step 4 — Physical deletion per record type**

For each schedule entry, delete the record and its dependents in FK-safe order:

**Deleting a case:**
1. Delete `session_log_corrections` where `session_log_id IN (SELECT id FROM session_logs WHERE case_id = :id)`
2. Delete `session_log_transfers` where `session_log_id IN (...)`
3. Delete `session_logs` where `case_id = :id`
4. Delete `registered_hours` where `case_id = :id`
5. Delete `contact_logs` where `case_id = :id`
6. Delete `contact_disclosures` where `case_id = :id` (if within retention)
7. Delete `case_assignments` where `case_id = :id`
8. Delete `case_grants` where `case_id = :id`
9. Delete `case_complexity_factors` where `case_id = :id`
10. Delete `match_candidates` where `match_run_id IN (SELECT id FROM match_runs WHERE case_id = :id)`
11. Delete `match_runs` where `case_id = :id`
12. Delete `case_handovers` where `case_id = :id`
13. Delete `inbound_inquiries` where `converted_to_id = :id` (CONVERTED inquiries follow case)
14. DELETE FROM `cases` WHERE `id = :id`

**Deleting a professional:**
1. Verify no active assignments: abort if `case_assignments` with `professional_id = :id AND ended_at IS NULL` exists
2. Delete `professional_documents` where `professional_id = :id`
3. DELETE FROM `professionals` WHERE `id = :id`
4. DELETE FROM `profiles` WHERE `id = :id` (CASCADE handles this if FK is ON DELETE CASCADE)

**Deleting a session_log, registered_hours, contact_disclosure, or inbound_inquiry:**
- Direct DELETE by primary key

**Step 5 — Mark schedule as executed**

```sql
UPDATE deletion_schedules
SET executed_at = NOW()
WHERE id = :schedule_id;
```

**Step 6 — Create immutable audit event**

For each record deleted:
- Event type: `DATA_DELETED`
- Metadata: `{ "record_type": "<table>", "retention_years": 7 }` (no sensitive fields — ADR-004)
- This audit event is never deleted (perpetual)

---

## ALTERNATIVE FLOWS

### A1: Legal Hold (Retention Extended)

Admin may delay deletion before `scheduled_for_deletion_at` arrives:

1. Admin updates: `DELETE FROM deletion_schedules WHERE id = :id` and re-inserts with new `scheduled_for_deletion_at`  
   (or updates the field if an admin endpoint is available)
2. Audit event: `RETENTION_EXTENDED` — metadata: `{ "record_type": "...", "new_date": "...", "reason": "..." }`
3. System skips this record on the next execution pass

### A2: Manual Right-to-be-Forgotten Request (Article 17)

For a professional who requests erasure before the 7-year period:

1. Admin verifies: no active case assignments, no pending hours awaiting approval
2. Admin sets professional status = 'ARCHIVED', `archived_at = NOW()` (if not already)
3. Admin creates DeletionSchedule entry with `scheduled_for_deletion_at = NOW() + INTERVAL '30 days'` and `reason = 'USER_REQUEST'`
4. Audit event: `DATA_SUBJECT_DELETION_REQUESTED`
5. After 30 days, Phase 2 execution proceeds normally
6. Audit events: `DATA_SUBJECT_DELETION_APPROVED`, then `DATA_DELETED` on execution

Note: Citizens never authenticate and never submit requests directly. Any citizen erasure request arrives via the sagsbehandler or admin and is handled administratively.

### A3: Abort on Active Assignment

If during Step 4 a professional has active case assignments:
- Abort deletion for that professional
- Log warning to notification_log
- Do NOT mark executed_at
- Admin must resolve the active assignment before deletion can proceed

---

## BUSINESS RULES

1. **No status=DELETED exists** — The only soft-delete mechanism is `status=ARCHIVED` + `archived_at`. Records do not get a "deleted" status flag.
2. **Deletion is physical** — After retention expires, records are hard-deleted from the database. The `deletion_schedules` table records the schedule and execution timestamp.
3. **Audit events are perpetual** — `audit_events` rows are never deleted. The DATA_DELETED event proves GDPR compliance even after the source record is gone.
4. **24-hour window before execution** — `scheduled_for_deletion_at = NOW() + 24 hours` gives admin time to impose a legal hold.
5. **CONVERTED inbound_inquiries follow canonical object** — When a case or professional is deleted, any associated CONVERTED inbound_inquiry is deleted in the same operation.
6. **90-day short retention for non-converted inquiries** — SPAM, REJECTED, and unconverted PENDING/REVIEWED inquiries are low-value and deleted after 90 days.
7. **Referential integrity** — Deletion must respect FK ordering. Child records are deleted before parent records.
8. **Audit event metadata is non-sensitive** — DATA_DELETED metadata contains only `record_type` and `retention_years`, never citizen initials, names, or case details (ADR-004).

---

## AUDIT EVENTS

| Event | When | Metadata |
|---|---|---|
| `DATA_DELETION_SCHEDULED` | DeletionSchedule entry created | `{ "record_type": "...", "scheduled_for": "..." }` |
| `RETENTION_EXTENDED` | Legal hold imposed | `{ "record_type": "...", "new_date": "...", "reason": "..." }` |
| `DATA_DELETED` | Record physically deleted | `{ "record_type": "...", "retention_years": 7 }` |
| `DATA_SUBJECT_DELETION_REQUESTED` | Manual erasure request initiated | `{ "record_type": "professionals" }` |
| `DATA_SUBJECT_DELETION_APPROVED` | Admin approved request | `{ "record_type": "professionals" }` |

---

## OUTPUTS

- Record physically removed from database
- `deletion_schedules.executed_at` set to NOW()
- `DATA_DELETED` audit event logged (immutable)
- Record no longer accessible via any query

---

## EXAMPLE TIMELINE

**Case archived 2019-06-27:**
- `archived_at = 2019-06-27`
- `data_retention_expires_at = 2026-06-27`

**2026-06-27 (identification pass):**
- Case identified as expired
- `deletion_schedules` entry created: `scheduled_for_deletion_at = 2026-06-28T00:00:00Z`
- Event: `DATA_DELETION_SCHEDULED`

**2026-06-28 (execution pass):**
- `scheduled_for_deletion_at < NOW()`, `executed_at IS NULL`
- Child records deleted (session_logs, registered_hours, etc.)
- `DELETE FROM cases WHERE id = :id`
- `deletion_schedules.executed_at = 2026-06-28T00:00:00Z`
- Event: `DATA_DELETED` — `{ "record_type": "cases", "retention_years": 7 }`
- Case is permanently removed from the database

**After 2026-06-28:**
- No case record exists in `cases` table
- `deletion_schedules` row remains (proof of execution)
- `audit_events` DATA_DELETED row remains (immutable compliance proof)

---

## GDPR COMPLIANCE

- ✅ **Article 17 (Right to Erasure):** Records physically deleted after retention period; early deletion via A2 flow
- ✅ **Article 5(1)(e) (Storage Limitation):** 7-year retention for case/professional data; 90 days for low-value inquiry data
- ✅ **Data Minimization:** Short retention for unconverted inbound_inquiries; no retention of data beyond legal basis
- ✅ **Audit Trail:** DATA_DELETED event is immutable and proves deletion occurred, even after source record is gone
- ✅ **Legal Holds:** Retention can be extended (A1) for legitimate legal reasons


---

## API ENDPOINTS

| Trin | Metode | Endpoint | Auth | Tabel |
|---|---|---|---|---|
| Hent sletningsplan | `GET` | `/api/deletion-schedules` | Admin | `deletion_schedules` |
| Opret sletningsplan | `POST` | `/api/deletion-schedules` | Admin/System | `deletion_schedules` |
| Hent notifikationslog | `GET` | `/api/notification-log` | Admin | `notification_log` |
| Genforsøg notifikation | `POST` | `/api/notification-log/:id/retry` | Admin | `notification_log` |

**TS-002 reference:** §9.1–9.5 (Governance Domain Endpoints)
