# WF-005: Session Documentation

**Workflow ID:** WF-005  
**Title:** Session Documentation — Professional Session Log Lifecycle  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Delivery Domain

---

## PURPOSE

Enable professionals to create, edit, finalize, and correct session logs that document citizen interactions, maintaining an accurate and immutable record of professional practice.

---

## ACTORS

- **Professional** — Creates, edits, finalizes, and requests corrections to session logs
- **Case Coordinator (Admin)** — Views finalized session logs; monitors stale and overdue DRAFT logs; acknowledges safeguarding concerns
- **Governance Domain** — Logs session documentation events

---

## TRIGGER

Professional completes a session with a citizen and navigates to "Log Session" for the assigned case.

---

## PRECONDITIONS

- Case exists with status=ACTIVE (activated via WF-004)
- Professional is assigned to case (CaseAssignment exists with ended_at IS NULL)
- Professional status=ACTIVE

---

## MAIN FLOW

1. **Professional creates session log**
   - Selects case
   - Enters session_date
   - Enters duration_minutes
   - Enters participant_names (encrypted)
   - Enters location (encrypted)
   - Writes observations (encrypted)
   - Records citizen_mood_tone (encrypted)
   - Sets safeguarding_concern_flag = FALSE (default)
   - Session log created with status=DRAFT
   - Event: `SESSION_LOG_CREATED` logged

2. **Professional edits DRAFT**
   - May update any field while status=DRAFT
   - Each save is reflected immediately
   - No version history in MVP (last saved state is current)
   - Professional may set safeguarding_concern_flag = TRUE at any point while DRAFT

3. **Professional reviews and finalizes**
   - Reviews all content for accuracy
   - Clicks "Finalize Session Log"
   - System transitions: status=DRAFT → FINAL
   - FINAL record is immutable — no fields can be edited after this point
   - Event: `SESSION_LOG_FINALIZED` logged
   - If safeguarding_concern_flag = TRUE: Event `SAFEGUARDING_CONCERN_FLAGGED` logged

4. **Workflow complete (standard path)**
   - Session log is now FINAL
   - Visible to Case Coordinator
   - Can be linked to registered hours as an optional reference (WF-006)
   - Record preserved per data retention policy (WF-013)

---

## ALTERNATIVE FLOWS

### A1: Safeguarding Concern Identified
- Professional sets safeguarding_concern_flag = TRUE during step 1 or 2
- Professional enters safeguarding_detail (encrypted) describing the concern
- Safeguarding flag does not block finalization
- Upon finalization, session log with safeguarding_concern_flag = TRUE appears on admin dashboard as unacknowledged
- Case Coordinator reviews and acknowledges the concern:
  - Sets safeguarding_acknowledged_at = NOW()
  - Sets safeguarding_acknowledged_by = coordinator's profile ID
  - Event: `SAFEGUARDING_CONCERN_ACKNOWLEDGED` logged
- No automatic external notification is generated in MVP
- Severity classification and escalation pathways are Phase 2 features

### A2: Correction After Finalization
- Professional identifies an error in a FINAL session log
- Professional cannot edit the original record (immutable)
- Professional creates a correction via session_log_corrections:
  - correction_note: human-readable description of what was corrected and how (required)
  - correction_reason: TYPO / WRONG_TIME / CLARIFICATION / OMISSION / OTHER (required)
- The correction record does not store original or corrected field values — this is intentional per ADR-004 (privacy-safe pattern). The correction_note provides a human-readable explanation without reproducing sensitive content.
- Correction is appended — original FINAL record is not modified
- session_log.status transitions: FINAL → CORRECTED
- Event: `SESSION_LOG_CORRECTION_SUBMITTED` logged
- Case Coordinator can view both the original record and the correction

### A3: Stale DRAFT (Abandoned Log)
- Professional creates a DRAFT but does not finalize it
- System marks DRAFT as stale after 7 days since last modification
- Stale DRAFTs appear on Case Coordinator dashboard for operational follow-up
- No automatic status transition occurs
- No audit event is generated solely because a DRAFT became stale
- Professional may continue editing and finalize at any time

### A4: Overdue DRAFT (Advisory Deadline Exceeded)
- Session log remains in DRAFT more than 48 hours after session_date
- System marks DRAFT as overdue (advisory indicator only)
- Overdue DRAFTs appear on Case Coordinator dashboard alongside stale DRAFT indicators
- No blocking of WF-006 occurs
- No automatic escalation occurs
- Professional may still finalize the DRAFT after the advisory period

### A5: Session Log Transferred During Handover
- If a professional handover occurs (WF-008), the incoming professional may gain access to finalized session logs via SessionLogTransfer records
- Only FINAL and CORRECTED session logs are eligible for transfer — DRAFT logs are not transferred
- Original professional retains their own session logs in their history
- Transfer is logged per WF-008 audit trail

---

## BUSINESS RULES

1. **Professional finalizes independently** — No admin approval is required to transition DRAFT → FINAL
2. **FINAL records are immutable** — No direct edits after finalization; corrections use session_log_corrections
3. **Corrections are append-only** — The original FINAL record is never modified
4. **Safeguarding flag does not block finalization** — Flagging and acknowledgement are a separate administrative track
5. **DRAFT logs are never auto-deleted or auto-archived** — Abandoned DRAFTs persist until manually archived by admin
6. **48-hour finalization is advisory only** — No enforcement, no blocking, no escalation in MVP
7. **Session link to hours is optional** — Professionals may register hours without referencing a session log (WF-006)
8. **Only ACTIVE professionals on ACTIVE cases can create session logs** — Assignment and case status verified at creation
9. **Encrypted fields at rest** — observations, citizen_mood_tone, safeguarding_detail, participant_names, location are encrypted using TweetNaCl.js

---

## AUDIT EVENTS

- `SESSION_LOG_CREATED` — Professional creates DRAFT session log
- `SESSION_LOG_FINALIZED` — Professional transitions DRAFT → FINAL
- `SESSION_LOG_CORRECTION_SUBMITTED` — Correction appended to a FINAL log
- `SAFEGUARDING_CONCERN_FLAGGED` — Session log finalized with safeguarding_concern_flag = TRUE
- `SAFEGUARDING_CONCERN_ACKNOWLEDGED` — Case Coordinator acknowledges a safeguarding concern

---

## OUTPUTS

- session_log record with status=FINAL (or CORRECTED if corrected after finalization)
- Audit trail of all lifecycle events
- session_log_corrections records for any post-FINAL amendments
- Safeguarding acknowledgement recorded on session_log row (if applicable)
- Admin dashboard indicators for stale and overdue DRAFTs

---

## DATA STRUCTURES

**session_logs:**
- case_id, professional_id
- session_date DATE, duration_minutes INTEGER
- participant_names TEXT (encrypted), location TEXT (encrypted)
- observations TEXT (encrypted), citizen_mood_tone TEXT (encrypted)
- safeguarding_concern_flag BOOLEAN DEFAULT FALSE
- safeguarding_detail TEXT (encrypted, nullable)
- safeguarding_acknowledged_at TIMESTAMPTZ NULL
- safeguarding_acknowledged_by UUID REFERENCES profiles(id) NULL
- status IN ('DRAFT', 'FINAL', 'CORRECTED', 'ARCHIVED')
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

**session_log_corrections:**
- session_log_id UUID NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE
- correction_note TEXT NOT NULL (human-readable description of what was corrected — no sensitive content reproduced, per ADR-004)
- correction_reason TEXT NOT NULL IN ('TYPO', 'WRONG_TIME', 'CLARIFICATION', 'OMISSION', 'OTHER')
- created_by UUID NOT NULL REFERENCES profiles(id)
- created_at TIMESTAMPTZ NOT NULL (immutable)

---

## ADMIN DASHBOARD INDICATORS

| Indicator | Condition | Suggested Action |
|-----------|-----------|------------------|
| Overdue DRAFT | DRAFT older than 48 hours since session_date | Operational follow-up with professional |
| Stale DRAFT | DRAFT not modified in 7 or more days | Operational follow-up with professional |
| Unacknowledged Safeguarding | FINAL with safeguarding_concern_flag=TRUE and safeguarding_acknowledged_at IS NULL | Case Coordinator must acknowledge |

---

## WORKFLOW CONNECTIONS

| Reference | Direction | Description |
|-----------|-----------|-------------|
| WF-004 | Upstream | Case must be ACTIVE before session logs can be created |
| WF-006 | Downstream | Hour registration may optionally reference a session log ID |
| WF-008 | Lateral | Handover transfers FINAL and CORRECTED session logs to incoming professional |
| WF-013 | Downstream | GDPR data retention and deletion applies to session logs |

---

## TS-001 AMENDMENTS

All required amendments have been applied to `docs/02-technical-specification/TECHNICAL_SPECIFICATION_PHASE_1_DATABASE.md`:

- `session_logs.duration_minutes INTEGER NOT NULL` — added
- `session_logs.safeguarding_acknowledged_at TIMESTAMPTZ` — added
- `session_logs.safeguarding_acknowledged_by UUID REFERENCES profiles(id)` — added
- Audit event contracts added: `SESSION_LOG_CREATED`, `SESSION_LOG_FINALIZED`, `SESSION_LOG_CORRECTION_SUBMITTED`, `SAFEGUARDING_CONCERN_FLAGGED`, `SAFEGUARDING_CONCERN_ACKNOWLEDGED`

---

## OPEN QUESTIONS

1. Should professionals be able to see their own stale/overdue indicators in the professional portal?
2. Should the correction flow require countersignature for safeguarding-related corrections?
3. Should there be a maximum number of corrections per session log?
4. Should admin dashboard show "stale" and "overdue" as separate visual indicators or one combined indicator?

---

## API ENDPOINTS

| Trin | Metode | Endpoint | Auth | Tabel |
|---|---|---|---|---|
| Opret sessionlog (kladde) | `POST` | `/api/session-logs` | Professional/Admin | `session_logs` |
| Rediger kladde | `PATCH` | `/api/session-logs/:id` | Own (DRAFT) | `session_logs` |
| Finaliser sessionlog | `POST` | `/api/session-logs/:id/finalize` | Own | `session_logs` |
| Opret korrektionsnotat | `POST` | `/api/session-logs/:id/corrections` | Own/Admin | `session_log_corrections`, `session_logs` |
| Hent korrektioner | `GET` | `/api/session-logs/:id/corrections` | Own/Admin | `session_log_corrections` |
| Kvitter for safeguarding | `POST` | `/api/session-logs/:id/safeguarding/acknowledge` | Admin | `session_logs` |
| Hent sessionlogs | `GET` | `/api/session-logs` | Own/Admin | `session_logs` |

**TS-002 reference:** §7.1–7.7 (Session Log Endpoints)

---

**This workflow is implementation-ready. Owned by Delivery Domain. Enables WF-006 (optional session log reference in hour registration) and WF-008 (handover log transfer).**
