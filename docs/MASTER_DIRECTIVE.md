# Kursskifte Match 2.0 — Master Directive
## The North Star Document

**Date:** June 27, 2026  
**Status:** APPROVED ARCHITECTURE DIRECTION  
**Version:** 1.0 (Based on V2+V3+V4 Domain Model)

---

## PURPOSE

This document is the authoritative source for what Kursskifte Match 2.0 is and why it exists.

All development, design, and decision-making flows from this directive.

---

## WHAT WE ARE BUILDING

**Kursskifte Match 2.0** is a case management system for relationsbaseret støtte (relationship-based support) that:

- Centralizes management of cases (sager) linking vulnerable citizens (borgere) with trained professionals (fagpersoner)
- Provides secure work documentation (session logs) separate from administrative time tracking
- Enforces grant control (municipalities provide budgeted hours per case)
- Protects professional workload (capacity limits, complexity awareness)
- Creates immutable audit trails for GDPR compliance and operational accountability
- Operates as **one unified Next.js application** with **Supabase backend**

---

## CORE PHILOSOPHY

### Single Source of Truth
- **CaseAssignment** tracks who is assigned (not cases.professional_id + handovers)
- **SessionLog + RegisteredHours** are linked, not just date-matched
- Derived values are calculated, never stored (remaining_hours, workload_status, is_expired)

### Auditability First
- Every change logged with actor, timestamp, reason
- Privacy-safe audit events (metadata contracts, no sensitive data dumps)
- Immutable records: no direct updates, corrections via separate records

### GDPR by Design
- Minimal data: citizen initials only (not full names)
- No CPR/SSN storage
- Encrypted sensitive fields: notes, safeguarding details, contact info
- Right-to-be-forgotten implemented (7-year retention, then delete)
- No automatic deletion, only explicit archive + scheduled cleanup

### Operational Integrity
- Soft deletes only (status + archived_at, never hard DELETE)
- Structured data (complexity factors, not free text)
- Explicit workflows (handovers, disclosures, approvals—never automatic)
- Workload protection (capacity limits, GREEN/AMBER/RED status)

---

## WHAT WE ARE NOT BUILDING (MVP)

### Forbidden in MVP:
- ❌ **Municipality Portal** — Sagsbehandler has no platform access; they are contact info only
- ❌ **Citizen Portal** — Borgere do not access system; support is professional-delivered
- ❌ **Messaging Platform** — No in-app messaging; contact via disclosed phone/email only
- ❌ **Billing/ERP Integration** — No invoice generation; payroll is separate system
- ❌ **Clinical Journal System** — No diagnosis tracking; refer to external healthcare systems
- ❌ **Automatic Assignment** — All professional assignments require admin decision

### Deferred (Phase 2+):
- Municipality read-only portal (Phase 2)
- Outcome tracking dashboards (Phase 3)
- Mobile app (Phase 3)
- Advanced matching optimization (Phase 2)

---

## GOVERNING PRINCIPLES

### 1. Unified Architecture
One Next.js app. One Supabase database. One authentication model. One deployment.

Route-based isolation (`/(public)`, `/admin`, `/pro`, `/api`) is cleaner than separate apps.

### 2. Data Integrity Over Speed
- CaseAssignment instead of dual professional_id + handovers
- Audit metadata contracts instead of open JSONB
- Structured complexity factors instead of free text
- Never store derived values (remaining_hours, workload_status, is_expired are calculated)

### 3. Explicit Over Implicit
- Handovers are explicit structured processes (not automatic)
- Contact disclosures audited and logged
- Session log transfers require approval
- OUTSIDE_GRANT hours require explicit review

### 4. Immutable Audit Trail
- SessionLog: write-once (corrections via separate table)
- CaseAssignment: never edited (transitions create new records)
- AuditEvents: never delete (immutable by trigger + RLS)
- Corrections: explain what changed without reproducing sensitive content

### 5. Calculate, Don't Store
Remaining grant hours, workload status, current assigned load, document expiry—all calculated at query time.

---

## APPROVED ARCHITECTURE (V4)

### Domain Entities (17 Total: 13 Core + 4 Supporting)

**13 Core Entities** (essential to MVP):
1. Municipality, 2. Case, 3. CaseAssignment, 4. CaseGrant, 5. Professional, 6. ProfessionalDocument, 7. SessionLog, 8. RegisteredHours, 9. MatchRun, 10. MatchCandidate, 11. CaseHandover, 12. ContactLog, 13. AuditEvents

**4 Supporting Entities** (enable core functionality):
14. CaseComplexityFactors, 15. SessionLogCorrection, 16. SessionLogTransfer, 17. ContactDisclosure

```
Case Management:
├─ Municipality (kommune) — reference data, admin-managed [CORE]
├─ Case (sag) — the central entity [CORE]
├─ CaseAssignment — temporal tracking of professional assignments [CORE]
├─ CaseGrant — municipal budget allocation [CORE]
├─ CaseComplexityFactors — structured complexity calculation [SUPPORTING]

Professional Management:
├─ Professional (fagperson) — extends profile [CORE]
├─ ProfessionalDocument — credential vault (CV, certificates, background checks) [CORE]

Work Tracking:
├─ SessionLog — professional documentation (write-once) [CORE]
├─ RegisteredHours — administrative time tracking (for payroll, grant control) [CORE]
├─ SessionLogCorrection — correction model (explain changes, don't store old values) [SUPPORTING]

Professional Changes:
├─ CaseHandover — structured handover process [CORE]
├─ SessionLogTransfer — audit trail for sharing documentation [SUPPORTING]
├─ ContactDisclosure — audit trail for contact info sharing [SUPPORTING]

Communication:
├─ ContactLog — professional-sagsbehandler communication record [CORE]

Matching (Decision Support):
├─ MatchRun — admin-triggered, scored candidates [CORE]
├─ MatchCandidate — scored candidates with explanation [CORE]

Compliance:
└─ AuditEvents — immutable, privacy-safe event log [CORE]
```

### Relationships
- Case (1) → (N) CaseAssignment (temporal)
- CaseAssignment (N) → (1) Professional
- Case (1) → (N) CaseGrant (multiple periods)
- Case (1) → (1) CaseComplexityFactors
- Professional (1) → (N) ProfessionalDocument
- SessionLog ↔ RegisteredHours (optional FK link)

### Key Design Decisions
1. **No cases.professional_id** — Use CaseAssignment for single source of truth
2. **No complexity_reason text** — Use structured CaseComplexityFactors with deterministic rules
3. **No derived columns** — remaining_hours, workload_status, is_expired are calculated at query time
4. **No EXPIRED status** — is_expired calculated from expiry_date < TODAY
5. **Unified soft delete** — status field for workflow, archived_at for retention
6. **Algorithm versioning** — match_runs.algorithm_version preserves explainability
7. **Audit metadata contracts** — schema-validated JSONB per event type
8. **No hard deletes** — status + archived_at, scheduled cleanup after retention period

---

## TECHNOLOGY STACK (APPROVED)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) | SSR, API routes, fast builds, Vercel deploy |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) | Managed, GDPR-friendly, no custom backend code |
| **Database** | PostgreSQL with RLS | Relational integrity, row-level security, audit triggers |
| **Auth** | Supabase Auth (JWT) | Native, no custom implementation, GDPR-ready |
| **Styling** | Tailwind CSS | Consistent with launch site branding |
| **Components** | Shadcn/ui or custom | Accessible, design-system aligned |
| **Testing** | Vitest + Playwright | Unit + E2E coverage |
| **Deployment** | Vercel + Supabase | Atomic deployments, managed services |

---

## MVP SCOPE (12 WEEKS)

### Phase 1: Core Case Management
- Create, read, archive cases (soft delete, no hard delete)
- Citizen data: initials + age range + notes (encrypted)
- Case complexity: structured factors + calculated level
- Case status workflow: OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED

### Phase 2: Professional Pool
- Register professionals
- Upload & verify documents (CV, criminal record, child protection cert)
- Document expiry tracking
- Capacity limits (hours/week, max concurrent cases, complexity ceiling)

### Phase 3: Work Tracking
- SessionLog: write-once professional documentation
- RegisteredHours: time tracking for payroll/grant (with session_log FK)
- Corrections model: explain changes without reproducing sensitive data
- ContactLog: professional-sagsbehandler communication record

### Phase 4: Grant Control
- CaseGrant: municipal budget per period
- Remaining hours: calculated dynamically (granted - approved)
- Outside_grant review: explicit admin approval required
- Flag when hours exceed budget

### Phase 5: Professional Changes
- CaseAssignment: temporal tracking (replace cases.professional_id)
- CaseHandover: structured handover process (not automatic)
- SessionLogTransfer: audit trail for sharing previous docs
- ContactDisclosure: audit trail for contact info sharing

### Phase 6: Matching (Decision Support)
- MatchRun: admin-triggered (never automatic)
- MatchCandidate: scored with explanation
- Algorithm versioning: preserve explainability
- Admin confirms final assignment

### Phase 7: Admin Portal
- Case CRUD (soft delete)
- Professional management
- Document verification
- Grant management
- Audit event review

### Phase 8: Professional Portal
- View assigned cases
- Write session logs
- Register hours
- Upload documents
- View contact disclosures

### Phase 9: Public Website
- Homepage (from launch site)
- Professional recruitment page (Tally temporarily)
- Contact form
- Privacy policy

### Phase 10: Audit & Compliance
- AuditEvents: privacy-safe event logging
- GDPR right-to-be-forgotten: archive + scheduled delete
- Immutable records: no direct updates
- Corrections: separate table, audit trail

---

## NO CODE BEFORE APPROVED TECHNICAL SPECIFICATION

**Critical rule:**

Development cannot begin until:
1. ✅ Domain Model & Database (V4) — APPROVED
2. ⏳ Technical Specification — NOT YET APPROVED
3. ⏳ Supabase Migrations — NOT YET CREATED
4. ⏳ Next.js Scaffold — NOT YET CREATED

Any code written before Technical Specification approval will be discarded.

---

## DECISION LOG REFERENCE

All architectural decisions documented in `/docs/DECISION_LOG.md`.

Key decisions:
- V2: Unified Next.js (vs. separate backend/admin/portal)
- V3: Privacy-safe corrections, no old/new value dumps
- V4: CaseAssignment entity, structured complexity, audit contracts

---

## SUCCESS CRITERIA

MVP is successful when:

1. **Data Integrity** — CaseAssignment is single source of truth, no inconsistency between professional_id and handovers
2. **Auditability** — All changes logged with actor/timestamp/reason, no gaps in audit trail
3. **GDPR Ready** — Minimal data collected, encrypted sensitive fields, 7-year retention, right-to-be-forgotten workflow
4. **Workload Protection** — Professionals cannot be overloaded; GREEN/AMBER/RED status visible and enforced
5. **Grant Control** — Municipalities never surprised by hours exceeding budget; explicit approval required
6. **Operational Safety** — No automatic assignments; all critical workflows explicit (handovers, disclosures, approvals)

---

## NEXT PHASE

**Technical Specification** (not yet approved)

Will cover:
- API endpoint design
- Authentication flow (JWT custom claims)
- Data encryption strategy (which fields, how)
- Validation rules
- Error handling
- Testing strategy

---

**Document by:** Kursskifte ApS — Architecture Leadership  
**Approved by:** Hassan (Founder & Operator)  
**Status:** ARCHITECTURE DIRECTION LOCKED  
**Next Review:** When Technical Specification ready
