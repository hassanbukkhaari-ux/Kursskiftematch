# Domain Model & Database Specification (V4)
## Kursskifte Match 2.0 — Approved Architecture

**Date:** June 27, 2026  
**Status:** APPROVED ARCHITECTURE DIRECTION  
**Version:** 4.0 (Combines V2 + V3 + V4)

---

## PREAMBLE

This document contains the **complete, approved domain model** for Match 2.0.

It combines:
- **V2:** Core entities, relationships, MVP scope
- **V3:** Corrections (terminology, privacy-safe design, removals)
- **V4:** Architecture improvements (CaseAssignment, structured complexity, audit contracts)

### Key Approvals
- ✅ **V2 Approved:** Separated work documentation (SessionLog) from time tracking (RegisteredHours)
- ✅ **V3 Approved:** Privacy-safe corrections, unified soft delete strategy
- ✅ **V4 Approved:** CaseAssignment entity, structured complexity factors, audit metadata contracts

### Status
READY FOR TECHNICAL SPECIFICATION PHASE (not yet approved)

---

## CORE ENTITIES (13)

### Case Management (5 entities)

**Municipality**
```
├─ id: UUID (Primary Key)
├─ name: String (unique, e.g., "Aalborg Kommune")
├─ status: ACTIVE | INACTIVE (not boolean active)
├─ sagsbehandler_name, email, phone, title
├─ secondary_contact (optional)
└─ created_at, updated_at
```

**Case**
```
├─ id: UUID
├─ municipality_id: UUID (FK)
├─ status: OPEN | MATCHED | ACTIVE | COMPLETED | ARCHIVED
├─ citizen_initials: String (2 chars, immutable)
├─ citizen_age_range: 0-5 | 6-12 | 13-18 | 18+
├─ citizen_notes: String (encrypted, correctable)
├─ weekly_hours: Decimal (e.g., 4.5)
├─ complexity_level: LOW | MEDIUM | HIGH | CRITICAL (calculated)
├─ created_at, updated_at, archived_at, data_retention_expires_at
└─ NOTE: NO cases.professional_id (use CaseAssignment instead)
```

**CaseAssignment** (NEW in V4)
```
├─ id: UUID
├─ case_id: UUID (FK)
├─ professional_id: UUID (FK to professionals)
├─ assignment_status: ACTIVE | TRANSITIONED | TERMINATED | ARCHIVED
├─ started_at: Timestamp
├─ ended_at: Timestamp | NULL
├─ assigned_by: UUID (FK to profiles, admin)
├─ assignment_reason: String (max 300 chars)
└─ created_at
```
**Rules:**
- Current professional = CaseAssignment WHERE ended_at IS NULL
- Only one ACTIVE per case at a time
- Single source of truth (replaces cases.professional_id + case_handovers)

**CaseGrant**
```
├─ id: UUID
├─ case_id: UUID (FK)
├─ municipality_id: UUID (FK, denormalized)
├─ granted_hours: Decimal (e.g., 24.0)
├─ period_start, period_end: Date
├─ status: PENDING | ACTIVE | ARCHIVED | REVOKED
├─ created_by: UUID (FK to profiles)
├─ created_at, archived_at
└─ NOTE: NO remaining_hours field (calculated: granted_hours - SUM(approved))
```

**CaseComplexityFactors** (NEW in V4)
```
├─ id: UUID
├─ case_id: UUID (FK, UNIQUE)
├─ mental_health: Boolean
├─ family_instability: Boolean
├─ school: Boolean
├─ violence: Boolean
├─ substance_use: Boolean
├─ criminality: Boolean
├─ diagnosis: String | NULL
├─ multiple_agencies: Boolean
├─ notes: String | NULL (max 500 chars)
├─ created_at, updated_at
└─ NOTE: complexity_level in cases table is calculated from these factors
```

---

### Professional Management (2 entities)

**Professional**
```
├─ id: UUID (FK to profiles, 1:1)
├─ profession: TEACHER | PEDAGOGUE | NURSE | PSYCHOLOGIST | SOCIAL_WORKER | COUNSELOR | OTHER
├─ experience_years: Int
├─ target_age_groups: String[] (array)
├─ max_complexity_level: LOW | MEDIUM | HIGH | CRITICAL
├─ qualifications: String (max 1000 chars)
├─ capacity_hours_week: Decimal (e.g., 8.0)
├─ max_concurrent_cases: Int (default: 3)
├─ availability_days: String[] (array)
├─ status: REGISTERED | ACTIVE | INACTIVE | ARCHIVED
├─ created_at, updated_at
└─ NOTE: NO ssn_last_4 (removed in V3), NO current_assigned_load (calculated)
```

**ProfessionalDocument**
```
├─ id: UUID
├─ professional_id: UUID (FK)
├─ document_type: CV | CRIMINAL_RECORD | CHILD_PROTECTION | DRIVING_LICENSE | QUALIFICATION | INSURANCE | OTHER
├─ status: PENDING_UPLOAD | UNVERIFIED | VERIFIED | ARCHIVED (NOT EXPIRED)
├─ file_path: String | NULL (nullable until upload, see V3)
├─ file_hash: String | NULL (SHA-256, nullable)
├─ uploaded_at: Timestamp | NULL, uploaded_by: UUID | NULL
├─ expiry_date: Date | NULL
├─ verified_at: Timestamp | NULL, verified_by: UUID | NULL
├─ verification_notes: String | NULL
├─ re_upload_required: Boolean
├─ created_at
└─ NOTE: is_expired = CALCULATED (status='VERIFIED' AND expiry_date < TODAY)
```

---

### Work Tracking (3 entities)

**SessionLog**
```
├─ id: UUID
├─ case_id: UUID (FK)
├─ professional_id: UUID (FK)
├─ session_date: Date
├─ status: DRAFT | FINAL | CORRECTED | ARCHIVED
├─ created_at (immutable), created_by: UUID (professional who documented)
├─ observations: String (encrypted, max 3000 chars)
├─ citizen_mood_tone: String (encrypted)
├─ follow_up_needed: Boolean, follow_up_reason: String | NULL
├─ safeguarding_concern_flag: Boolean, safeguarding_detail: String (encrypted if flagged)
├─ participant_names: String[] (encrypted array)
├─ location: String (encrypted)
└─ data_retention_expires_at: Timestamp
```
**Rules:**
- Write-once design (cannot update FINAL logs)
- Corrections via SessionLogCorrection (separate table)

**RegisteredHours**
```
├─ id: UUID
├─ case_id: UUID (FK)
├─ professional_id: UUID (FK)
├─ work_date: Date (renamed from session_date in V3)
├─ work_type: DIRECT_SESSION | TRANSPORT | DOCUMENTATION | COORDINATION | CRISIS_RESPONSE | TRAINING | OTHER
├─ hours: Decimal (0.25 to 8.0)
├─ session_log_id: UUID | NULL (FK, NEW in V4, optional link to SessionLog)
├─ status: PENDING | SUBMITTED | APPROVED | REJECTED | OUTSIDE_GRANT
├─ grant_period_id: UUID (FK to case_grants)
├─ description: String | NULL
├─ outside_grant_reason: String | NULL (if OUTSIDE_GRANT)
├─ reviewed_by: UUID | NULL (admin who reviewed OUTSIDE_GRANT)
├─ reviewed_at: Timestamp | NULL
├─ review_note: String | NULL
├─ created_by: UUID (FK to professionals), created_at
├─ updated_by: UUID | NULL (FK to profiles, if admin edited), updated_at
└─ NOTE: NO invoice_id (removed in V3)
```
**Semantics of session_log_id:**
- DIRECT_SESSION → SHOULD reference session_log
- DOCUMENTATION → CAN reference the session it documents
- TRANSPORT, COORDINATION, TRAINING, OTHER → NULL (not session-specific)

**SessionLogCorrection** (V3 redesign)
```
├─ id: UUID
├─ session_log_id: UUID (FK)
├─ correction_note: String (max 500 chars, explain correction without sensitive content)
├─ correction_reason: TYPO | WRONG_TIME | CLARIFICATION | OMISSION | OTHER
├─ created_by: UUID (FK to profiles)
├─ created_at
└─ NOTE: NO old_value, new_value (removed in V3 for privacy)
```
**Rules:**
- Original SessionLog never edited
- Correction explains what changed without reproducing sensitive data
- Immutable (no update/delete)

---

### Professional Changes (3 entities)

**CaseHandover**
```
├─ id: UUID
├─ case_id: UUID (FK)
├─ outgoing_professional_id: UUID (FK)
├─ incoming_professional_id: UUID | NULL (FK, NULL if terminating)
├─ reason: PROFESSIONAL_UNAVAILABLE | WORKLOAD_EXCEEDED | REQUEST_PROFESSIONAL | REQUEST_CASE | BETTER_MATCH | SAFEGUARDING_CONCERN | OTHER
├─ status: INITIATED | IN_PROGRESS | COMPLETED
├─ handover_note: String (encrypted)
├─ session_logs_transferred: Boolean
├─ transferred_session_logs: UUID[] (array of session_log IDs)
├─ created_by: UUID (FK to profiles)
├─ created_at, completed_at
└─ Lifecycle: Creates/updates CaseAssignments
```

**SessionLogTransfer**
```
├─ id: UUID
├─ session_log_id: UUID (FK)
├─ from_professional_id: UUID (FK)
├─ to_professional_id: UUID (FK)
├─ approved_by: UUID (FK to profiles, admin)
├─ reason: String (max 500 chars)
├─ transfer_note: String | NULL
├─ created_at, visibility_granted_at
└─ Rules: Immutable, requires admin approval, audit trail
```

**ContactDisclosure**
```
├─ id: UUID
├─ case_id: UUID (FK)
├─ disclosed_to_professional_id: UUID (FK)
├─ disclosed_by: UUID (FK to profiles, admin)
├─ disclosed_at: Timestamp
├─ contact_method: EMAIL | PHONE | MEETING (no IN_APP in MVP, removed in V3)
├─ sagsbehandler_name, email, phone: String (snapshot at disclosure time)
└─ reason: String (max 300 chars, why disclosed)
```

---

### Communication (1 entity)

**ContactLog**
```
├─ id: UUID
├─ case_id: UUID (FK)
├─ professional_id: UUID (FK)
├─ contact_type: PHONE_CALL | EMAIL | IN_PERSON | OTHER (no IN_APP in MVP)
├─ logged_at: Timestamp
├─ logged_by: UUID (FK to profiles)
├─ note: String (encrypted)
├─ outcome: String (encrypted, max 500 chars)
├─ follow_up_required: Boolean
└─ Rules: Append-only (no delete), separate from SessionLog
```

---

### Matching (2 entities)

**MatchRun**
```
├─ id: UUID
├─ case_id: UUID (FK)
├─ triggered_by: UUID (FK to profiles, admin)
├─ triggered_at: Timestamp
├─ status: INITIATED | SCORED | ASSIGNED | OVERRIDDEN | CANCELLED
├─ algorithm_version: String (e.g., "1.0", NEW in V4)
├─ final_assignment_id: UUID | NULL (FK to professionals)
├─ assigned_at: Timestamp | NULL
├─ selected_by: UUID | NULL (FK to profiles, admin, NEW in V4)
├─ selected_at: Timestamp | NULL (NEW in V4)
├─ selected_reason: String (max 500 chars, NEW in V4)
├─ matching_criteria: JSONB
└─ notes: String
```
**Rules:**
- Never automatic (admin-triggered, decision support)
- Scores immutable for historical explainability

**MatchCandidate**
```
├─ id: UUID
├─ match_run_id: UUID (FK)
├─ professional_id: UUID (FK)
├─ rank: Int (1, 2, 3...)
├─ overall_score: Decimal (0-100)
├─ qualifications_score, availability_score, capacity_score, complexity_fit_score: Decimal
├─ algorithm_version: String (inherited from match_run, NEW in V4)
├─ scoring_explanation: String (max 500 chars, why this score)
└─ Rules: Scored deterministically, explanation required
```

---

### Compliance (1 entity)

**AuditEvents**
```
├─ id: UUID
├─ event_type: String (enum, documented per event)
├─ actor_id: UUID (FK to profiles)
├─ resource_type: String (table name)
├─ resource_id: UUID (which record)
├─ metadata: JSONB (schema-validated per event type, NEW in V4)
├─ created_at
└─ Rules: Immutable (insert only), no update/delete
```

**Audit Event Types (V4):**
```
Case: CASE_CREATED, CASE_UPDATED, CASE_ARCHIVED, CASE_ASSIGNED, ASSIGNMENT_CHANGED, ASSIGNMENT_ENDED
Professionals: PROFESSIONAL_REGISTERED, PROFESSIONAL_VERIFIED, PROFESSIONAL_STATUS_CHANGED
Hours: HOURS_REGISTERED, HOURS_APPROVED, HOURS_REJECTED, HOURS_OUTSIDE_GRANT_REVIEWED
SessionLogs: SESSION_LOG_CREATED, SESSION_LOG_CORRECTED
Documents: DOCUMENT_UPLOADED, DOCUMENT_VERIFIED, DOCUMENT_REUPLOADED, DOCUMENT_SIGNED_URL_CREATED, DOCUMENT_EXPIRED
Handovers: HANDOVER_INITIATED, HANDOVER_COMPLETED
Transfers: SESSION_LOG_TRANSFERRED
Contacts: CONTACT_DISCLOSED, CONTACT_LOGGED
Matching: MATCH_RUN_TRIGGERED, MATCH_ASSIGNED
Grants: GRANT_CREATED, GRANT_REVOKED
Auth: LOGIN_SUCCESS, LOGIN_FAILED, PASSWORD_CHANGED, PASSWORD_RESET, ACCOUNT_LOCKED, ROLE_CHANGED
```

**Metadata Contracts (NEW in V4):**
Each event type has defined metadata schema (documented in TECHNICAL_SPECIFICATION_PENDING.md)

---

## RELATIONSHIPS

```
Municipality (1) ←→ (N) Case
Case (1) ←→ (N) CaseAssignment (temporal, current derived as active assignment)
Case (1) ←→ (N) CaseGrant (one per period)
Case (1) ←→ (1) CaseComplexityFactors
Case (1) ←→ (N) SessionLog
Case (1) ←→ (N) RegisteredHours
Case (1) ←→ (N) CaseHandover
Case (1) ←→ (N) SessionLogTransfer
Case (1) ←→ (N) ContactDisclosure
Case (1) ←→ (N) ContactLog
Case (1) ←→ (N) MatchRun

CaseAssignment (N) ←→ (1) Professional
RegisteredHours (N) ←→ (0..1) SessionLog (optional FK, NEW in V4)

Professional (1) ←→ (N) ProfessionalDocument
Professional (1) ←→ (1) Profile (user)

MatchRun (1) ←→ (N) MatchCandidate
```

---

## KEY DESIGN DECISIONS (V4)

### 1. CaseAssignment (Single Source of Truth)
**Removed:** cases.professional_id  
**Added:** CaseAssignment entity with temporal tracking  
**Benefit:** No inconsistency between professional_id and handovers

### 2. Structured Complexity Factors
**Removed:** cases.complexity_reason (free text)  
**Added:** CaseComplexityFactors (structured boolean fields)  
**Benefit:** Deterministic calculation, queryable factors, matching integration

### 3. No Derived Values Stored
**Calculated at query time (never stored as columns):**
- remaining_hours = granted_hours - SUM(approved hours)
- used_hours = SUM(approved hours)
- current_assigned_load = SUM(weekly_hours for active cases)
- workload_status = calculated from load vs. capacity
- is_expired = expiry_date < TODAY

### 4. Privacy-Safe Corrections (V3)
**Removed:** SessionLogCorrection.old_value, new_value  
**Added:** correction_note (explain change without reproducing sensitive data)  
**Benefit:** Audit trail without privacy leak

### 5. Audit Metadata Contracts (V4)
**Added:** Defined schema per event type  
**Benefit:** Queryable, validated, reliable audit data

### 6. Algorithm Versioning (V4)
**Added:** match_runs.algorithm_version, match_candidates.algorithm_version  
**Benefit:** Historical scores remain explainable even if algorithm changes

### 7. Unified Soft Delete
**Standard:** status field for workflow, archived_at for retention  
**Removed:** boolean active fields (municipalities.active → status)

### 8. Session + Hours Linking (V4)
**Added:** registered_hours.session_log_id (optional FK)  
**Benefit:** Explicit traceability, missing hour detection

---

## RLS PRINCIPLES

### Role-Based Access Control
```
ADMIN: All data (READ/WRITE/INSERT)
PROFESSIONAL: Own cases, documents, hours, session logs only
PUBLIC: No data access
```

### Key Rules
- Role checked via profiles.role (not JWT alone)
- No DELETE policies (soft delete only)
- Immutable records enforced via RLS (SELECT only)
- Contact info only visible via ContactDisclosure
- Session log transfers visible after approval

---

## GDPR & RETENTION

**Data Collected:**
- Citizen: initials only (2 chars), age range, encrypted notes
- Professional: contact info, qualifications, capacity limits
- Work: encrypted session observations, hours worked
- Audit: event type + metadata (no sensitive content)

**Data NOT Collected:**
- Full citizen names, CPR/SSN, addresses
- Sagsbehandler credentials (no platform access)
- Psychological details (refer to external systems)

**Retention:**
- Cases: 7 years from archived
- Professionals: Until archived + 1 year
- AuditEvents: 7 years (archive after 2 years to cold storage)
- Right-to-be-forgotten: Delete after retention period via scheduled job

---

## MVP SCOPE (NOT CHANGING)

See Master Directive for complete MVP.

Key point: **No municipality portal, no citizen portal, no messaging, no billing, no automatic assignment.**

---

## NEXT PHASE

**Technical Specification** (not yet approved)

Will define:
- API endpoints (RESTful or GraphQL, TBD)
- Request/response shapes
- Validation rules
- Encryption (which fields, how)
- Error codes
- Testing strategy

---

**Document by:** Kursskifte ApS — Architecture  
**Approved by:** Hassan  
**Status:** APPROVED DOMAIN MODEL (V4)  
**Reference:** Master Directive, Architecture Separation Plan, Decision Log
