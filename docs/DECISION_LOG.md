# Architecture Acceptance Criteria
## Quality Gates for Match 2.0 Design

**Date:** June 27, 2026  
**Status:** APPROVED  
**Version:** 1.0

---

## PURPOSE

These criteria define what "good architecture" looks like for Kursskifte Match 2.0.

Use these as a checklist when:
- Reviewing new architecture changes (ADRs)
- Validating Technical Specification against architecture
- Reviewing code for architecture compliance
- Assessing whether design meets approved architecture

---

## 13 ACCEPTANCE CRITERIA

### 1. All Tables Have RLS Strategy

**Definition:** Every table with sensitive data must have Row-Level Security policies defined.

**Checklist:**
- ✅ Table has explicit RLS policy for each role (admin, professional)
- ✅ RLS policies are documented in architecture docs
- ✅ Public/unauthenticated access explicitly blocked
- ✅ Foreign keys check role via profiles table, not JWT alone
- ✅ All SELECT, INSERT, UPDATE, DELETE operations have policy
- ✅ RLS tested in test suite

**Examples:**
- ✅ cases table: Admin sees all, professional sees own cases only
- ❌ cases table: No RLS policy (everyone sees everything)

**Criteria Owner:** Security/Database Architect

---

### 2. All Sensitive Access Has Audit Event

**Definition:** Every access to sensitive data (reading or modifying) is logged.

**Checklist:**
- ✅ Sensitive table mutations trigger audit events
- ✅ Sensitive data access (if exposed via API) is logged
- ✅ Document signing (signed URL creation) logged
- ✅ Contact info disclosure logged
- ✅ Session log transfer logged
- ✅ Professional assignment logged

**Examples:**
- ✅ Accessing professional documents via signed URL triggers DOCUMENT_SIGNED_URL_CREATED
- ❌ Admin loads all cases without audit event

**Note:** Not every SELECT needs logging (too noisy), but unusual/sensitive access does.

**Criteria Owner:** Compliance/Audit

---

### 3. No PII in Audit Metadata

**Definition:** Audit events contain no personally identifiable information or sensitive details.

**Checklist:**
- ✅ Audit metadata contains only: IDs, statuses, decision reasons (not content)
- ✅ No citizen notes in audit metadata
- ✅ No safeguarding details in audit metadata
- ✅ No passwords/credentials in audit metadata
- ✅ No contact phone/email in audit metadata (unless disclosure event itself)
- ✅ No diagnoses in audit metadata

**Examples:**
- ✅ SESSION_LOG_CREATED metadata: {session_log_id, safeguarding_flagged: true}
- ❌ SESSION_LOG_CREATED metadata: {observations: "child has depression and anger issues"}

**Criteria Owner:** Privacy/Security

---

### 4. All State Transitions Documented

**Definition:** Every enum value (status) has a clear workflow showing what states can transition to what.

**Checklist:**
- ✅ CaseStatus transitions documented (OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED)
- ✅ ProfessionalStatus transitions documented (REGISTERED → ACTIVE → INACTIVE → ARCHIVED)
- ✅ AssignmentStatus transitions documented (ACTIVE → TRANSITIONED → TERMINATED → ARCHIVED)
- ✅ DocumentStatus transitions documented (PENDING_UPLOAD → UNVERIFIED → VERIFIED → ARCHIVED)
- ✅ RegisteredHoursStatus transitions documented (PENDING → APPROVED/REJECTED/OUTSIDE_GRANT)
- ✅ Each transition has explicit action (what triggers it, who does it, why)
- ✅ No unexpected transitions allowed

**Examples:**
- ✅ CaseStatus: OPEN → MATCHED only via admin matching decision
- ❌ CaseStatus: Can transition from COMPLETED back to ACTIVE (not allowed)

**Criteria Owner:** Domain Architect

---

### 5. All Enums Documented

**Definition:** Every enum in the domain has clear documentation of its values and meaning.

**Checklist:**
- ✅ Each enum has enum values listed (e.g., CaseStatus = OPEN | MATCHED | ACTIVE | ...)
- ✅ Each value has a one-line definition
- ✅ Workflow for status enums is documented (state diagram)
- ✅ Constraints for enum values are clear (when can a value be set)
- ✅ Forbidden combinations are documented

**Examples:**
- ✅ ComplexityLevel enum with definitions: LOW = single issue, MEDIUM = multiple concerns, etc.
- ❌ ComplexityLevel enum with no definitions (ambiguous)

**Criteria Owner:** Domain Architect

---

### 6. All Foreign Keys Documented

**Definition:** Every FK relationship has clear documentation of cardinality, semantics, and cascading behavior.

**Checklist:**
- ✅ Each FK has documented cardinality (1:1, 1:N, N:1, M:M)
- ✅ Semantics clear (what does this FK mean in business terms?)
- ✅ Nullability documented (can FK be NULL? When?)
- ✅ Cascading behavior documented (DELETE CASCADE vs. SET NULL vs. RESTRICT)
- ✅ Bidirectional relationships are clear (if bidirectional)
- ✅ No circular dependencies (unless explicitly allowed)

**Examples:**
- ✅ case.professional_id → CaseAssignment (eliminated, now history table)
- ✅ CaseAssignment.professional_id (1:N) → Professional, cardinality clear
- ❌ Undocumented FK with unclear semantics

**Criteria Owner:** Database Architect

---

### 7. No Derived Values Stored

**Definition:** No columns exist that are purely calculated from other columns.

**Checklist:**
- ✅ No `remaining_hours` column (calculated at query time)
- ✅ No `used_hours` column (calculated at query time)
- ✅ No `current_assigned_load` column (calculated at query time)
- ✅ No `workload_status` column (calculated at query time)
- ✅ No `is_expired` column (calculated from expiry_date < TODAY)
- ✅ Views may exist for calculated values (read-only, clearly marked)
- ✅ Application layer doesn't cache derived values (or caches with clear TTL)

**Examples:**
- ✅ Query: `SELECT granted_hours - SUM(approved_hours) as remaining`
- ❌ Column: `case_grants.remaining_hours` (stored, gets stale)

**Criteria Owner:** Database Architect

---

### 8. No Hard Deletes in MVP

**Definition:** No records are permanently deleted; only archived/soft-deleted.

**Checklist:**
- ✅ No DELETE operations in RLS policies (MVP phase)
- ✅ All entities use `status` + `archived_at` for deletion
- ✅ Hard delete only via scheduled cleanup job (after retention period)
- ✅ Audit logs immutable (never deleted)
- ✅ Can restore data from status=ARCHIVED

**Examples:**
- ✅ Soft delete: `UPDATE cases SET status='ARCHIVED', archived_at=NOW()`
- ❌ Hard delete: `DELETE FROM cases WHERE id = ?`

**Criteria Owner:** Data Protection Officer

---

### 9. Retention Rules Documented

**Definition:** Every entity has clear data retention rules.

**Checklist:**
- ✅ Cases: 7 years from archived
- ✅ Professionals: Until archived + 1 year
- ✅ SessionLogs: 7 years from case archived
- ✅ RegisteredHours: 7 years from case archived
- ✅ Documents: With professional + 1 year
- ✅ AuditEvents: 7 years (archive after 2 years to cold storage)
- ✅ Inquiries: 2 years
- ✅ All retention rules have business justification documented

**Examples:**
- ✅ Case retention: 7 years = statute of limitations for social services
- ✅ Audit retention: 7 years = standard compliance requirement

**Criteria Owner:** Compliance Officer / Data Protection Officer

---

### 10. Forbidden Features Checked

**Definition:** The implementation respects the forbidden feature list.

**Checklist:**
- ✅ No municipality portal login in MVP (contact info only)
- ✅ No citizen portal
- ✅ No in-app messaging platform (email/phone only)
- ✅ No billing/ERP integration
- ✅ No clinical journal system
- ✅ No automatic professional assignment (human-in-the-loop)
- ✅ Code has no markers/placeholders for forbidden features
- ✅ PR review explicitly checks DO_NOT_BUILD.md

**Criteria Owner:** Product Manager / Architecture

---

### 11. GDPR Data Minimisation Documented

**Definition:** Architecture demonstrates GDPR-compliant data minimization.

**Checklist:**
- ✅ Citizen data: initials only (no full name, no CPR)
- ✅ Professional data: contact + qualifications (no SSN, no full history)
- ✅ Sagsbehandler: contact info only (no credentials, no login)
- ✅ Sensitive fields encrypted: notes, safeguarding details, contact info
- ✅ No undocumented PII storage
- ✅ Right-to-be-forgotten implemented (7-year retention, then delete)
- ✅ No "because we might need it later" data
- ✅ Data collection justification documented

**Examples:**
- ✅ Citizen initials (2 chars) sufficient for identification within kommune
- ❌ Full citizen name (unnecessary, increases risk)

**Criteria Owner:** Data Protection Officer

---

### 12. Professional/Case/Municipality Access Boundaries Clear

**Definition:** Access control is explicit; no ambiguous who-can-see-what.

**Checklist:**
- ✅ Professional: Own cases only (cannot see other professionals' cases)
- ✅ Professional: Own documents only
- ✅ Professional: Own hours only
- ✅ Professional: Own session logs only
- ✅ Professional: Other cases only via explicit handover + transfer approval
- ✅ Admin: All cases, all professionals, all documents
- ✅ Municipality: Contact info only (no login, no platform access)
- ✅ Citizen: No access (no portal)
- ✅ Public: Homepage, recruitment, contact form only
- ✅ Boundary conditions documented and tested

**Examples:**
- ✅ Professional can see case only if assigned (RLS enforced)
- ❌ Professional can search all cases by citizen name (inappropriate access)

**Criteria Owner:** Security Architect

---

### 13. Human Decision Points Documented

**Definition:** Every place where a human (usually admin) makes a critical decision is explicit and audited.

**Checklist:**
- ✅ Professional assignment: Admin reviews candidates, selects one, logged
- ✅ Handover initiation: Admin decides when to handover
- ✅ Session log transfer: Admin approves sharing of previous logs
- ✅ Contact disclosure: Admin approves sharing sagsbehandler info
- ✅ Outside_grant review: Admin approves/rejects hours
- ✅ Document verification: Admin verifies document authenticity
- ✅ Each decision logged with reason
- ✅ No automatic workflows that impact professional/citizen

**Examples:**
- ✅ MatchRun shows candidates, admin selects, selection_reason logged
- ❌ System auto-assigns if score > threshold (no human decision)

**Criteria Owner:** Product Manager / UX Designer

---

## USING ACCEPTANCE CRITERIA

### During Architecture Review

**Before approving new architecture decision:**

1. Check all 13 criteria
2. Mark which are satisfied ✅
3. For unsatisfied criteria, determine: Is it in scope? Does it need to be?
4. Approve only if all applicable criteria are met

### During Technical Specification Review

**Before approving API design:**

1. Verify RLS strategy defined (Criterion 1)
2. Verify audit events planned (Criterion 2)
3. Verify PII not in audit metadata (Criterion 3)
4. Verify state transitions handled correctly (Criterion 4)
5. Verify access boundaries enforced (Criterion 12)

### During Code Review

**PR checklist:**

- ✅ Matches approved architecture?
- ✅ Respects all 13 acceptance criteria?
- ✅ No forbidden features?
- ✅ No hard deletes?
- ✅ No derived values stored?
- ✅ All audit events logged?
- ✅ RLS policies enforced?
- ✅ Human decision points preserved?

---

## ACCEPTANCE CRITERIA EXCEPTIONS

**If a criterion cannot be met:**

1. **Document the exception** (why it cannot be met)
2. **Get Hassan approval** (explicit exception grant)
3. **Create ADR** (Architecture Decision Record) explaining tradeoff
4. **Plan remediation** (when/how criterion will be met)
5. **Review regularly** (ensure exception doesn't become permanent)

**Example Exception:**
```
Exception: Criterion 1 (RLS strategy)
Table: future_municipalities (for Phase 2, not MVP)
Reason: Table doesn't exist yet; not part of MVP
Remediation: RLS will be designed in v2.0 architecture
ADR: ADR-009-phase-2-municipalities
```

---

## REFERENCE

- **Architecture Principles:** ARCHITECTURE_PRINCIPLES.md
- **Change Policy:** ARCHITECTURE_CHANGE_POLICY.md
- **Decision Log:** DECISION_LOG.md
- **ADRs:** /docs/adr/

---

**Document by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED CRITERIA  
**Version:** 1.0
