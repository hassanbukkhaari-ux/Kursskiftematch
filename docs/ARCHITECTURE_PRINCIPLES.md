# Architecture Principles
## Kursskifte Match 2.0 — Guiding Values

**Date:** June 27, 2026  
**Status:** APPROVED  
**Version:** 1.0

---

## PURPOSE

These principles guide all architectural decisions in Kursskifte Match 2.0.

Any design choice should be evaluated against these principles. If a choice violates a principle, it requires explicit approval and documentation as a new Architecture Decision Record (ADR).

---

## 11 CORE PRINCIPLES

### 1. Single Source of Truth

**Definition:** Every important fact is stored in exactly one place.

**Application:**
- No duplicate state (cases.professional_id + case_handovers → CaseAssignment only)
- No redundant derived columns (remaining_hours calculated, not stored)
- One database, one auth model, one source of truth

**Rationale:**
- Eliminates data inconsistency
- Simplifies updates (change one place)
- Prevents stale data

**Examples:**
- ❌ DON'T: Store both `cases.professional_id` and maintain separate handover history
- ✅ DO: Use CaseAssignment for current and historical assignments

---

### 2. Privacy by Design

**Definition:** Minimize data collection; encrypt sensitive content; respect user rights.

**Application:**
- Collect only necessary data (citizen initials, not full names)
- Encrypt sensitive fields (notes, safeguarding details, contact info)
- Implement right-to-be-forgotten (7-year retention, then delete)
- No SSN/CPR storage unless legally required
- No undocumented PII

**Rationale:**
- GDPR compliance
- Reduces breach impact
- Operational hygiene

**Examples:**
- ❌ DON'T: Store full citizen name, CPR, sagsbehandler credentials
- ✅ DO: Citizen initials (2 chars), age range, encrypted notes

---

### 3. Least Privilege

**Definition:** Users see only what they need; access controlled at database level.

**Application:**
- Admin sees all data
- Professional sees only own cases/documents
- Sagsbehandler sees nothing (contact info only, no login)
- Citizen sees nothing (no portal)
- RLS enforced at database level (not app logic)

**Rationale:**
- Limits breach impact
- Reduces accidental data exposure
- Complies with GDPR access restrictions

**Examples:**
- ❌ DON'T: Load all case data, filter in application
- ✅ DO: RLS policy at database level, app never sees restricted rows

---

### 4. No Hard Deletes in MVP

**Definition:** Data is never removed; only archived or soft-deleted.

**Application:**
- Use `status` field for workflow (ACTIVE → ARCHIVED)
- Use `archived_at` timestamp for retention tracking
- Hard delete only after retention period (7 years) via scheduled cleanup
- No DELETE in RLS policies

**Rationale:**
- Preserves audit trail
- Enables data recovery if needed
- Supports compliance investigations
- GDPR-friendly (can show what was deleted and when)

**Examples:**
- ❌ DON'T: DELETE FROM cases WHERE id = ?
- ✅ DO: UPDATE cases SET status='ARCHIVED', archived_at=NOW()

---

### 5. Derived Values Are Never Persisted

**Definition:** Values that can be calculated from base data are never stored as columns.

**Application:**
- `remaining_hours` = granted_hours - SUM(approved) → calculated at query time
- `workload_status` = calculated from capacity and assigned load
- `is_expired` = calculated from expiry_date < TODAY
- `used_hours` = SUM(approved hours)
- `current_assigned_load` = SUM(weekly_hours for active cases)

**Rationale:**
- Single source of truth (no stale data)
- Automatic updates (no manual refresh)
- Easy business rule changes
- Storage efficiency

**Examples:**
- ❌ DON'T: Store `case_grants.remaining_hours` column
- ✅ DO: Calculate at query time: granted_hours - SUM(approved)

---

### 6. Human-in-the-Loop Matching

**Definition:** Professional assignment always requires explicit admin decision.

**Application:**
- System generates scored candidates (MatchRun, MatchCandidate)
- Algorithm provides explanation for each score
- Admin reviews candidates and their scores
- Admin makes final decision (logged as selected_reason)
- No automatic assignment, no threshold-based auto-accept
- All assignments audited

**Rationale:**
- Too much at stake (professional-citizen fit, safeguarding)
- Algorithm may miss important factors
- Admin accountability required
- Maintains human judgment in critical decisions

**Examples:**
- ❌ DON'T: `if (best_candidate.score > 0.9) { auto_assign() }`
- ✅ DO: Present candidates to admin, admin selects and confirms

---

### 7. Auditability by Default

**Definition:** Every significant action is logged with actor, timestamp, and reason.

**Application:**
- All mutations logged to AuditEvents
- Privacy-safe metadata (no sensitive data in logs)
- Metadata schema-validated per event type
- Immutable records (no update/delete audit logs)
- Events cover both operational and security actions

**Rationale:**
- Compliance (GDPR, operational audit)
- Forensic investigation (what happened, who did it, why)
- Accountability (no silent changes)
- Pattern detection (suspicious activity)

**Examples:**
- ❌ DON'T: Update case without logging event
- ✅ DO: Log CASE_UPDATED event with actor, timestamp, changes

---

### 8. Explicit Over Implicit

**Definition:** Workflows are explicit; nothing happens automatically without human approval.

**Application:**
- Handovers are explicit CaseHandover records (not automatic)
- Contact disclosure is explicit ContactDisclosure (not pre-loaded)
- Session log transfer requires approval (not automatic)
- Outside_grant hours require explicit review (not auto-approved)
- All state transitions documented and intentional

**Rationale:**
- Safety (no surprises, no side effects)
- Traceability (clear when and why changes happen)
- User control (professionals have agency)

**Examples:**
- ❌ DON'T: Auto-transition case status when hours match budget
- ✅ DO: Explicit admin action to transition case status

---

### 9. Domain-First Design

**Definition:** Architecture follows the domain (case management) not technology trends.

**Application:**
- Domain entities drive schema (Case, Professional, CaseAssignment)
- Relationships model real-world processes (handovers, assignments)
- Status enums reflect actual workflows
- No premature optimization (no NoSQL, no GraphQL unless domain needs it)
- Technology serves domain, not vice versa

**Rationale:**
- Stable architecture (domain changes slower than tech)
- Easier onboarding (domain experts understand model)
- Better long-term maintainability

**Examples:**
- ❌ DON'T: "Let's use microservices because it's trendy"
- ✅ DO: "Unified app serves domain needs; microservices only if needed"

---

### 10. Controlled Access to Sensitive Context

**Definition:** Access to sensitive information (sagsbehandler contact, safeguarding details, diagnoses) is tracked and audited.

**Application:**
- Contact info disclosed only via ContactDisclosure (audit trail)
- Session logs shared only via SessionLogTransfer (approval required)
- Access to documents tracked via DOCUMENT_SIGNED_URL_CREATED events
- No pre-loading of sensitive context
- All access logged

**Rationale:**
- Reduces exposure (no unnecessary sharing)
- Compliance (can show who accessed what)
- Accountability (professional knows they're being audited)

**Examples:**
- ❌ DON'T: Load sagsbehandler contact info for all professionals
- ✅ DO: Disclosure only when admin approves, logged, audited

---

### 11. No Feature Creep Without Approval

**Definition:** Scope boundaries are clear; new features require explicit approval.

**Application:**
- Forbidden features documented in DO_NOT_BUILD.md
- MVP scope locked in ROADMAP.md
- Phase 2+ features explicitly deferred
- Any new feature requires Architecture Decision Record
- No scope changes without Hassan approval

**Rationale:**
- Predictable timeline (no surprise scope)
- Clear priorities (MVP first, Phase 2 later)
- Resource planning (can estimate work)
- Quality (don't rush, do it right)

**Examples:**
- ❌ DON'T: "Let's add municipality portal in MVP"
- ✅ DO: "Municipality portal is Phase 2 if adoption justifies"

---

## EVALUATING DECISIONS AGAINST PRINCIPLES

**Decision Process:**

1. Does this change respect all 11 principles?
   - If YES → Proceed
   - If NO → Requires ADR + approval

2. Does this change involve domain/entity/relationship changes?
   - If YES → Requires new Architecture version
   - If NO → May proceed with ADR

3. Is this feature in the forbidden list?
   - If YES → Cannot proceed in MVP
   - If NO → Proceed if approved

---

## PRINCIPLE CONFLICTS

**If principles conflict, resolution order:**

1. **Privacy by Design** (never compromise)
2. **Single Source of Truth** (foundational)
3. **Least Privilege** (security-critical)
4. **Auditability by Default** (compliance-critical)
5. **No Hard Deletes in MVP** (data protection)
6. Others (discuss with Hassan)

---

## APPLYING PRINCIPLES TO CODE REVIEW

**Code reviewers should check:**
- ❌ Hard DELETE statement → Violates Principle 4
- ❌ Storing derived column → Violates Principle 5
- ❌ Automatic case transition → Violates Principle 8
- ❌ Unlogged mutation → Violates Principle 7
- ❌ Unrestricted data access → Violates Principle 3
- ❌ Full name storage → Violates Principle 2
- ❌ New portal without approval → Violates Principle 11

---

## REFERENCE

- **Architecture v1.0:** See CHANGELOG.md
- **Design Decisions:** See DECISION_LOG.md
- **Change Policy:** See ARCHITECTURE_CHANGE_POLICY.md
- **Acceptance Criteria:** See ARCHITECTURE_ACCEPTANCE_CRITERIA.md
- **ADRs:** See /docs/adr/

---

**Document by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED PRINCIPLES  
**Version:** 1.0
