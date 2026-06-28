# Decision Log
## Kursskifte Match 2.0 Architecture Decisions

**Date:** June 27, 2026  
**Status:** APPROVED DECISIONS FROZEN  
**Version:** 1.0

---

## DECISION RECORD FORMAT

```
[DATE] Decision #[N]: [Title]
Status: APPROVED | PENDING | REJECTED
Rationale: Why this choice
Trade-offs: What we give up
Depends on: Prerequisites
Blocking: What depends on this
References: V2/V3/V4 sections
```

---

## APPROVED DECISIONS

### [June 2026] Decision #1: Unified Next.js Application

**Title:** Single unified Next.js application vs. separate backend/admin/portal services

**Status:** ✅ APPROVED (V2)

**Rationale:**
- Simpler deployment pipeline (one Vercel project)
- Easier authentication (one JWT model)
- Better code reuse (shared components, shared utils)
- Easier to maintain (single codebase)
- Faster initial development (no IPC, no API contract negotiation)

**Trade-offs:**
- Cannot scale services independently
- Must deploy all together (not microservices)
- Decision: Split only if data models fundamentally diverge (unlikely)

**Implementation:**
```
/(public)/    Public website
/admin/       Admin portal (role: admin)
/pro/         Professional portal (role: professional)
/api/         API routes (shared auth, RLS)
```

**References:** Master Directive, Architecture Separation Plan

---

### [June 2026] Decision #2: Supabase Backend

**Title:** Supabase (PostgreSQL + Auth + RLS) vs. custom backend

**Status:** ✅ APPROVED (V2)

**Rationale:**
- Zero backend infrastructure to manage
- PostgreSQL RLS enforces security at database level
- Built-in auth (Supabase Auth)
- GDPR-friendly (EU data centers available)
- No custom authentication code to maintain

**Trade-offs:**
- Less flexibility (must use Supabase stack)
- Cannot self-host (Supabase dependency)
- Vendor lock-in (but acceptable for MVP)

**Implementation:**
- Supabase project for each environment (dev, staging, prod)
- Custom RLS policies per table
- Audit triggers for event logging

**References:** Master Directive, Domain Model (V4)

---

### [June 2026] Decision #3: No Municipality Portal in MVP

**Title:** Sagsbehandler access to platform

**Status:** ✅ APPROVED (Master Directive)

**Rationale:**
- Municipalities provide cases + budgets, not platform users
- Sagsbehandler contact info stored, but no login required
- Reduces scope (no SSO integration, no municipal user management)
- Reduces data exposure (sagsbehandler credentials never stored)
- Professional can access contact info via disclosure audit trail

**Trade-offs:**
- Cannot self-serve case status lookup (post-MVP: Phase 2)
- Must contact Kursskifte admin for case info
- Reports prepared by admin, shared externally

**Deferred to Phase 2:**
- Municipality portal (read-only, low-trust design)

**References:** Master Directive (Section: WHAT WE ARE NOT BUILDING)

---

### [June 2026] Decision #4: Separate SessionLog from RegisteredHours

**Title:** Work documentation vs. administrative time tracking

**Status:** ✅ APPROVED (V2)

**Rationale:**
- SessionLog = what happened (clinical, permanent)
- RegisteredHours = time tracked (administrative, changeable for payroll)
- Different workflows (documentation vs. approval)
- Different retention (7 years vs. payroll retention)
- Hours can be rejected without affecting documentation

**Trade-offs:**
- Must maintain two tables instead of one
- Must link them explicitly (session_log_id FK in RegisteredHours)

**Implementation:**
- SessionLog: write-once (FINAL status immutable)
- RegisteredHours: mutable (admin can update, approve/reject)
- SessionLogCorrection: separate table for documentation corrections

**References:** Domain Model (V4), V2 Corrections

---

### [June 2026] Decision #5: CaseAssignment Entity (V4)

**Title:** Replace cases.professional_id + case_handovers with dedicated assignment table

**Status:** ✅ APPROVED (V4)

**Rationale:**
- Single source of truth (not split between cases.professional_id and case_handovers)
- Temporal tracking (when assignment started/ended)
- Audit trail (who made assignment, why)
- Supports complex workflows (ACTIVE → TRANSITIONED → ACTIVE)
- Immutable history (CaseAssignment records never updated)

**Trade-offs:**
- One more join to get current professional
- Slightly more complex queries
- Worth it for data integrity

**Current professional derived as:**
```
SELECT professional_id FROM case_assignments
WHERE case_id = ? AND ended_at IS NULL LIMIT 1
```

**References:** Architecture (V4), Section 1

---

### [June 2026] Decision #6: Structured Complexity Factors (V4)

**Title:** Complexity calculation from factors instead of subjective text

**Status:** ✅ APPROVED (V4)

**Rationale:**
- Deterministic rules (not subjective)
- Queryable factors (reporting, matching)
- Consistency (everyone uses same factors)
- Rules engine approach (complexity calculated, not stored)
- Matching algorithm can query deterministically

**Trade-offs:**
- Less flexible initially (fixed factors)
- Requires periodic rule review
- Cannot capture unique nuances initially (future: notes field)

**Factors:**
- mental_health, family_instability, school, violence, substance_use, criminality, diagnosis, multiple_agencies

**Calculated rules:**
```
CRITICAL if: violence=TRUE OR (substance_use AND multiple_agencies)
HIGH if: (mental_health OR diagnosis) AND family_instability
MEDIUM if: 2+ factors present
LOW if: 0-1 factors
```

**References:** Architecture (V4), Section 3

---

### [June 2026] Decision #7: Privacy-Safe Audit Events (V3/V4)

**Title:** Audit metadata contracts instead of full value dumps

**Status:** ✅ APPROVED (V3, enforced in V4)

**Rationale:**
- No sensitive data in audit log (safer if breached)
- Queryable audit data (schema validation)
- Prevents accidental PII exposure
- Audit events explain what changed, not the sensitive details

**Trade-offs:**
- Cannot reconstruct exact old values from audit log
- Must rely on SessionLogCorrection for corrections
- Requires discipline in event design

**Example:**
❌ DON'T: audit metadata contains citizen notes or safeguarding details
✅ DO: audit metadata contains fact that notes were updated

**References:** Privacy-Safe Corrections (V3), Audit Contracts (V4)

---

### [June 2026] Decision #8: No Derived Values Stored (V4)

**Title:** Calculate at query time instead of storing derived columns

**Status:** ✅ APPROVED (V4)

**Rationale:**
- Single source of truth (no data inconsistency)
- Automatic updates (no manual refresh)
- Easy to change business rules
- Storage efficiency

**Never store:**
- remaining_hours = granted_hours - SUM(approved)
- used_hours = SUM(approved hours)
- current_assigned_load = SUM(weekly_hours for active cases)
- workload_status = calculated from load vs. capacity
- is_expired = expiry_date < TODAY

**Trade-off:** Slightly slower queries (acceptable, can optimize with views if needed)

**References:** Architecture (V4), Section 9

---

### [June 2026] Decision #9: Unified Soft Delete Strategy (V4)

**Title:** Standardize soft delete across all entities

**Status:** ✅ APPROVED (V4)

**Rationale:**
- Consistent pattern (easier to query, maintain)
- Less cognitive load for developers
- Easier to implement retention policies
- Status can support future states (SUSPENDED, etc.)

**Strategy:**
- status field for workflow (ACTIVE, DRAFT, PENDING, etc.)
- archived_at for "soft deleted" marker
- data_retention_expires_at for "can hard delete"
- Never use boolean active fields

**Trade-off:** Requires standardization discipline

**References:** Architecture (V4), Section 6

---

### [June 2026] Decision #10: Algorithm Versioning in Matching (V4)

**Title:** Store algorithm_version in match results for historical explainability

**Status:** ✅ APPROVED (V4)

**Rationale:**
- Historical scores remain explainable if algorithm changes
- Can run A/B testing (v1.0 vs v2.0 performance)
- Supports gradual rollout (some users v1.1, others v2.0)
- Audit trail shows which version made decision

**Trade-off:** Requires version management discipline

**Implementation:**
- match_runs.algorithm_version (e.g., "1.0")
- When algorithm changes: v1.0 → v1.1 (minor) or v1.0 → v2.0 (major)
- Code: conditional logic by version flag

**References:** Architecture (V4), Section 7

---

### [June 2026] Decision #11: Audit Metadata Contracts (V4)

**Title:** Define schema per audit event type

**Status:** ✅ APPROVED (V4)

**Rationale:**
- Queryable, consistent audit data
- Application validates before insert
- Prevents silent data loss
- Historical queries reliable

**Implementation:**
- Per-event-type metadata schema documented
- Application validates against contract
- Rejects mismatched metadata

**Trade-off:** More upfront work

**References:** Architecture (V4), Section 8, Technical Specification (pending)

---

### [June 2026] Decision #12: No Hard Deletes in MVP

**Title:** Soft delete only (status/archived_at, no DELETE in RLS)

**Status:** ✅ APPROVED (V3/V4)

**Rationale:**
- Data preservation (can restore if needed)
- Audit trail completeness (no gaps)
- GDPR compliance (can show what was deleted and when)
- Operational safety (no accidental data loss)

**Trade-off:** Storage cost, slower queries (minor)

**Hard delete allowed:** Only via scheduled cleanup job after retention period (7 years)

**References:** V3 Corrections, Architecture (V4), Section 6

---

## PENDING DECISIONS

### Technical Specification Phase

**Decision: REST vs GraphQL for API**
- Status: PENDING
- Blocks: Technical Specification
- Impact: Every API endpoint design
- Timeline: Week 1 of Technical Specification phase

**Decision: JWT custom claims or database role checks**
- Status: PENDING
- Blocks: Authentication implementation
- Impact: Auth performance, token payload
- Timeline: Week 2 of Technical Specification phase

**Decision: Which fields encrypted & how**
- Status: PENDING
- Blocks: All data handling code
- Impact: Searchability, performance
- Timeline: Week 2 of Technical Specification phase

**Decision: MFA required or optional**
- Status: PENDING
- Blocks: Authentication flow
- Impact: User experience, security posture
- Timeline: Week 1 of Technical Specification phase

**Decision: Caching strategy (Redis, app-level, etc.)**
- Status: PENDING
- Blocks: Performance optimization
- Impact: Scalability, complexity
- Timeline: Week 3 of Technical Specification phase

---

## REJECTED DECISIONS (For Reference)

### Rejected: Municipality Portal in MVP
- Status: ❌ REJECTED
- Reason: Out of scope, sagsbehandler has no platform access
- Deferred: Phase 2

### Rejected: Citizen Portal
- Status: ❌ REJECTED
- Reason: Citizens do not access platform; support is professional-delivered
- Deferred: Never (out of business model)

### Rejected: In-App Messaging
- Status: ❌ REJECTED
- Reason: No messaging platform in MVP; contact via email/phone only
- Deferred: Phase 3 (if ever needed)

### Rejected: Billing/ERP Integration
- Status: ❌ REJECTED
- Reason: No invoice generation in MVP; payroll is separate system
- Deferred: Phase 2+ (if ever needed)

### Rejected: Automatic Assignment
- Status: ❌ REJECTED
- Reason: Human-in-the-loop required; admin confirms final decision
- Deferred: Phase 2+ (if matching improves enough to auto-assign)

### Rejected: Free-Text Complexity Reason
- Status: ❌ REJECTED (V4)
- Reason: Replaced with structured CaseComplexityFactors
- Replacement: Structured boolean fields + deterministic rules

### Rejected: Storing EXPIRED as status
- Status: ❌ REJECTED (V4)
- Reason: is_expired is calculated condition, not workflow state
- Replacement: VERIFIED status, is_expired calculated at query time

### Rejected: Storing derived values (remaining_hours, workload_status, etc.)
- Status: ❌ REJECTED (V4)
- Reason: Single source of truth, automatic updates preferred
- Replacement: Query-time calculation with views if needed

---

## DECISION IMPACT MATRIX

| Decision | Domain | API | Auth | Database | Frontend |
|----------|--------|-----|------|----------|----------|
| Unified Next.js | — | ✅ | ✅ | — | ✅ |
| Supabase | — | ✅ | ✅ | ✅ | — |
| No Municipality Portal | ✅ | ✅ | ✅ | ✅ | ✅ |
| SessionLog + RegisteredHours | ✅ | ✅ | — | ✅ | ✅ |
| CaseAssignment Entity | ✅ | ✅ | — | ✅ | ✅ |
| Structured Complexity | ✅ | ✅ | — | ✅ | ✅ |
| Privacy-Safe Audit | ✅ | ✅ | — | ✅ | — |
| No Derived Storage | ✅ | ✅ | — | ✅ | ✅ |
| Unified Soft Delete | ✅ | ✅ | — | ✅ | ✅ |
| Algorithm Versioning | ✅ | ✅ | — | ✅ | ✅ |
| Audit Contracts | ✅ | ✅ | — | ✅ | — |
| No Hard Deletes | ✅ | ✅ | — | ✅ | ✅ |

---

## LOCKED DECISIONS (Cannot Change)

**These decisions are locked and cannot be revisited without explicit escalation:**

1. ✅ **Unified Next.js application** (vs. separate services)
2. ✅ **Supabase backend** (vs. custom backend)
3. ✅ **No municipality portal MVP** (vs. open access)
4. ✅ **No citizen portal** (vs. citizen-facing)
5. ✅ **CaseAssignment entity** (vs. cases.professional_id + handovers)
6. ✅ **Structured complexity factors** (vs. free text)
7. ✅ **Privacy-safe audit events** (vs. full value dumps)
8. ✅ **No derived storage** (vs. caching columns)
9. ✅ **Unified soft delete** (vs. mixed strategies)

---

## NEXT PHASE

**Technical Specification phase will add:**
- REST vs GraphQL decision
- JWT vs DB role check decision
- Encryption strategy decision
- MFA decision
- Caching strategy decision

---

**Document by:** Kursskifte ApS — Architecture Leadership  
**Status:** DECISION LOG LOCKED (until Technical Specification review)  
**Reference:** Master Directive, Domain Model (V4)
