# Architecture Changelog
## Kurskifte-Match 2.0 Domain Model & Design Decisions

**Date:** June 27, 2026

---

## [Unreleased]

### Architecture: Shift to Domain-Integrated Operations Platform
**Date:** June 27, 2026  
**ADR:** ADR-009  
**Status:** APPROVED

#### Changed

**Architectural Perspective:**
- Platform renamed: "Kurskifte Match" → "Kurskifte-Match" (with hyphen)
- Platform re-characterized from "matching platform" or "professional lifecycle management platform" to "integrated domain-based operations platform"
- Six core business domains explicitly identified and documented

**Six Core Domains:**
1. Professional Domain — Recruitment, profiles, verification, capacity, onboarding, offboarding
2. Municipality Domain — Municipalities, sagsbehandlere, grants, inquiries, cooperation
3. Case Domain — Citizens, cases, complexity, assignments, handovers, closure
4. Delivery Domain — Sessions, documentation, hours, contact logs, progress
5. Governance Domain — Audit, compliance, GDPR, permissions, retention
6. Matching Domain — Match runs, candidate ranking, human approval, assignment history

**Matching Re-contextualized:**
- Matching moved from primary purpose to orchestration layer that connects all six domains
- Matching quality depends on excellence in all other domains, not vice versa
- Platform success measured across all six domains, not primarily on matching efficiency

#### Documentation Updates

**DOMAIN_VISION.md:**
- Executive Summary: Now introduces six domains and integrated operations perspective
- New section: "The Six Domains of Kurshshifte-Match" with detailed domain descriptions
- Mission: Updated to reflect complete operations platform, not just professional lifecycle
- Vision: Now envisions integrated platform across all six domains
- Platform Purpose: Expanded from 8 to 33 capabilities organized by domain
- All sections updated to reflect domain-based architecture

**Created:**
- ADR-009: Shift from Matching-Focused to Domain-Integrated Operations Platform Architecture

**Verified Consistency:**
- MASTER_DIRECTIVE.md: Consistent (13 core entities map naturally to six domains)
- ROADMAP.md: Consistent (MVP phases align to domain buildout)
- DECISION_LOG.md: Consistent (professional and case management decisions reflected in domain structure)
- Architecture Baseline: Consistent (no conflicts with domain perspective)
- ADRs 1-8: Consistent (no reversals or conflicts)

#### Rationale

**Why This Change:**
1. Reflects actual approved architecture from MASTER_DIRECTIVE.md
2. Aligns with MVP scope (includes professional recruitment, verification, case management—not just matching)
3. Necessary for scaling (Kurshshifte can't scale by optimizing matching alone)
4. Clearer communication (domains are easier to understand than "matching platform")
5. Supports future growth (domain-based structure makes adding features clearer)

**No Reversals:**
- No existing architecture decisions changed
- No code rewritten or deleted
- No MVP scope altered
- All 13 core entities remain as defined in MASTER_DIRECTIVE.md
- All approved ADRs (1-8) remain valid

#### Implementation Plan

**Complete:**
- ✅ DOMAIN_VISION.md completely revised with six-domain perspective
- ✅ CHANGELOG.md updated
- ✅ ADR-009 created documenting the shift

**Upcoming:**
- ⏳ Technical Specification organization by domain (when created)
- ⏳ Workflow development (WF-003+) will reference domain architecture
- ⏳ API design will group endpoints by domain
- ⏳ Team structure may organize by domain as team grows

---

## Architecture v1.0 (APPROVED)

**Release Date:** June 27, 2026  
**Commit Hash:** 38fd967a0d46d64823d8cb1c0ea0b08a46fecd3e  
**Git Tag:** `architecture-v1.0`  
**Status:** LOCKED (no changes without new version)

### Contents

This release contains the complete, approved architecture for Kursskifte Match 2.0, combining three iterative design phases:

#### V2 Foundation (Weeks 1-2)

**Core Domain Model:**
- 13 core entities (Municipality, Case, Professional, SessionLog, RegisteredHours, etc.)
- 6 relationship patterns (one-to-many, many-to-one, temporal assignments)
- Complete GDPR data minimization model (initials only, encrypted fields)
- MVP scope definition (12 weeks, 10 phases)

**Key Decisions:**
- Unified Next.js application (vs. separate services)
- Supabase backend (PostgreSQL + Auth + RLS)
- Separated SessionLog (documentation) from RegisteredHours (time tracking)
- CaseGrant model (municipal budget per period)
- Write-once SessionLog design (corrections via separate table)

**Deliverables:**
- `DOMAIN_MODEL_DATABASE_SPEC.md` (base version)
- `ARCHITECTURE_SEPARATION_PLAN.md` (launch vs. Match 2.0)
- Entity definitions, RLS policies, GDPR compliance

---

#### V3 Corrections (Week 3)

**Privacy & Simplification Improvements:**

1. **Renamed Field:** `session_date` → `work_date`
   - Reason: RegisteredHours covers transport, documentation, coordination—not just sessions
   - Impact: More accurate terminology

2. **Redesigned SessionLogCorrection**
   - Removed: `old_value`, `new_value` (privacy leak risk)
   - Added: `correction_note`, `correction_reason` (privacy-safe explanation)
   - Benefit: Audit trail without reproducing sensitive content

3. **Removed Invalid Syntax**
   - Removed pseudo-SQL triggers (invalid syntax)
   - Changed: Describe trigger intent only, write actual SQL in migration phase

4. **Removed DELETE from RLS**
   - Enforced soft deletes everywhere
   - Use: `status` + `archived_at` (never hard DELETE)
   - Affected: 10 sensitive tables

5. **Made file_path Nullable**
   - Reason: PENDING_UPLOAD status needs row before file exists
   - Workflow: Create row → Upload → Populate file_path

6. **Removed IN_APP Messaging (MVP)**
   - ContactMethod: EMAIL, PHONE, MEETING (no IN_APP)
   - ContactType: PHONE_CALL, EMAIL, IN_PERSON, OTHER (no IN_APP_MESSAGE)
   - Reasoning: No messaging platform in MVP

7. **Removed ssn_last_4**
   - Removed partial SSN storage from professional aggregate
   - GDPR principle: Minimal data collection

8. **Removed invoice_id**
   - Removed billing fields from RegisteredHours
   - Billing is separate system (post-MVP)

9. **Added Document Access Audit Events**
   - New: DOCUMENT_UPLOADED, DOCUMENT_VERIFIED, DOCUMENT_REUPLOADED, DOCUMENT_SIGNED_URL_CREATED, DOCUMENT_EXPIRED
   - Benefit: Complete credential vault audit trail

10. **Added Admin Decision Reason to Matching**
    - New fields: selected_by, selected_at, selected_reason (max 500 chars)
    - Reason: Human-in-the-loop matching requires documentation

11. **Added Outside_Grant Review Model**
    - New fields: outside_grant_reason, reviewed_by, reviewed_at, review_note
    - Benefit: Explicit admin approval for budget overages

12. **Unified Soft Delete Strategy**
    - Old: Mixed approaches (active boolean, archived_at, status)
    - New: Consistent pattern (status for workflow, archived_at for retention)
    - Impact: Simpler queries, consistent audit trail

---

#### V4 Architectural Improvements (Week 4)

**Data Integrity, Normalization & Auditability:**

1. **CaseAssignment Entity (Single Source of Truth)**
   - Removed: `cases.professional_id` (FK to professionals)
   - Added: Dedicated `CaseAssignment` table
   - Temporal tracking: `started_at`, `ended_at`, `assignment_status`
   - Audit trail: `assigned_by`, `assignment_reason`
   - Benefit: No inconsistency between professional_id and handovers

2. **Link SessionLog and RegisteredHours**
   - Added: `registered_hours.session_log_id` (optional FK)
   - Semantics: DIRECT_SESSION should reference session, others nullable
   - Benefit: Explicit traceability, missing hour detection

3. **Structured Complexity Factors**
   - Removed: `cases.complexity_reason` (free text)
   - Added: `CaseComplexityFactors` entity (structured boolean fields)
   - Factors: mental_health, family_instability, school, violence, substance_use, criminality, diagnosis, multiple_agencies
   - Calculation: Deterministic rules (not subjective)
   - Benefit: Queryable factors, matching algorithm integration

4. **Authentication Audit Events**
   - New: LOGIN_SUCCESS, LOGIN_FAILED, PASSWORD_CHANGED, PASSWORD_RESET, ACCOUNT_LOCKED, ROLE_CHANGED, SESSION_REVOKED, MFA_ENABLED
   - Separate: Security events distinct from case events
   - Benefit: Complete auth trail, compliance-ready

5. **Document Status Redesign**
   - Removed: EXPIRED as permanent status
   - Added: `is_expired` as calculated field (expiry_date < TODAY)
   - Workflow: PENDING_UPLOAD → UNVERIFIED → VERIFIED → ARCHIVED
   - Benefit: Status = workflow state, expiry = calculated condition

6. **Unified Soft Delete Strategy (enforced)**
   - Standard: `status` (workflow) + `archived_at` (retention)
   - Removed: boolean `active` fields
   - Applied to: All 10 sensitive tables

7. **Version Matching Algorithm**
   - Added: `match_runs.algorithm_version`, `match_candidates.algorithm_version`
   - Pattern: "1.0", "1.1", "2.0" (semantic versioning)
   - Benefit: Historical scores remain explainable

8. **Audit Metadata Contracts**
   - Added: Defined schema per event type (not open JSONB)
   - Validation: Application validates before insert
   - Example: MATCH_ASSIGNED = {selected_professional_id, winning_rank, overall_score, algorithm_version}
   - Benefit: Queryable, validated, reliable audit data

9. **Never Store Derived Values**
   - Don't store: remaining_hours, used_hours, current_assigned_load, workload_status, is_expired
   - Do calculate: At query time (single source of truth)
   - Benefit: No stale data, auto-updates, easy rule changes

10. **Updated Lifecycle Diagrams**
    - CaseAssignment lifecycle (ACTIVE → TRANSITIONED → TERMINATED → ARCHIVED)
    - Document lifecycle (PENDING_UPLOAD → UNVERIFIED → VERIFIED → ARCHIVED)
    - Both show immutable state transitions

---

### Design Principles Locked

1. **Single Source of Truth** — No duplicate state
2. **Auditability First** — Every change logged, immutable records
3. **GDPR by Design** — Minimal data, encrypted, 7-year retention
4. **Operational Integrity** — Soft deletes, explicit workflows, no automatic changes
5. **Calculate, Don't Store** — Derived values always query-time

---

### Documentation Included

```
docs/MASTER_DIRECTIVE.md
  └─ North Star document, forbidden features, success criteria

docs/ARCHITECTURE_SEPARATION_PLAN.md
  └─ Launch website vs. Match 2.0 separation, migration timeline

docs/DOMAIN_MODEL_DATABASE_SPEC.md
  └─ Complete V4 domain model (13 entities, relationships, RLS, GDPR)

docs/TECHNICAL_SPECIFICATION_PENDING.md
  └─ Next phase (API, auth, encryption, validation, testing)
  └─ NOT YET APPROVED

docs/DECISION_LOG.md
  └─ 12 approved decisions, 5 pending, 9 rejected (with rationale)
  └─ Locked constraints, decision impact matrix

docs/DO_NOT_BUILD.md
  └─ 6 forbidden features (municipality portal, citizen portal, messaging, billing, clinical, automatic assignment)
  └─ Hard constraints, scope creep prevention

docs/ROADMAP.md
  └─ 12-week MVP timeline, Phase 2/3 roadmap
  └─ Success metrics, critical path, risk mitigation
```

---

### Approval Status

✅ **V2 Foundation** — Approved (Week 2)  
✅ **V3 Corrections** — Approved (Week 3)  
✅ **V4 Architecture** — Approved (Week 4)  
⏳ **Technical Specification** — Pending (not yet approved)  
❌ **Code** — Not started (awaiting Technical Spec approval)

---

### Commit Details

**Commit Hash:** `38fd967a0d46d64823d8cb1c0ea0b08a46fecd3e`  
**Author:** Kursskifte Architecture <architecture@kursskifte.dk>  
**Date:** June 27, 2026  
**Message:** "docs: save Kursskifte Match 2.0 architecture baseline"

**Files Committed:**
- `.gitignore`
- `docs/ARCHITECTURE_SEPARATION_PLAN.md`
- `docs/DECISION_LOG.md`
- `docs/DOMAIN_MODEL_DATABASE_SPEC.md`
- `docs/DO_NOT_BUILD.md`
- `docs/MASTER_DIRECTIVE.md`
- `docs/ROADMAP.md`
- `docs/TECHNICAL_SPECIFICATION_PENDING.md`

---

## Rules for Future Versions

### Never Overwrite Approved Architecture

✅ **Approved:**
- V1.0 (this release) is locked
- Cannot modify domain model, entities, relationships, RLS, GDPR design
- Cannot add forbidden features without new release + approval

### Future Architectural Changes

**Version Strategy:**
- V2.0 — Next major revision (requires explicit approval)
- V3.0, V4.0, etc. — Future versions follow same approval process

**Creating a New Version:**
1. Create new branch: `architecture/v2.0`
2. Document all changes in CHANGELOG.md
3. Create new git tag: `architecture-v2.0`
4. Require explicit approval before merging

### Record Every Change

**CHANGELOG.md Maintenance:**
- Every new version documented here
- Include: commit hash, changes, rationale, date
- Immutable: Keep all versions in history

### Technical Specification Independence

- Technical Specification has own version (1.0, 1.1, 2.0, etc.)
- Independent from Architecture versions
- API changes don't require Architecture version bump
- Domain changes DO require Architecture version bump

---

## Next Phase: Technical Specification

**Status:** Pending approval  
**Timeline:** Weeks 5-6 (if approved by July 1, 2026)  
**Deliverables:**
- API endpoint design
- Request/response contracts
- Validation rules
- Data encryption strategy
- Testing strategy
- Security requirements

**Critical Rule:** No code until Technical Specification approved.

---

## Historical Reference

### Version Timeline

- **June 27, 2026 — V1.0 (Current)**
  - V2 foundation + V3 corrections + V4 improvements
  - 13 entities, complete domain model
  - Locked, no further changes without new version

- **TBD — V2.0 (Future)**
  - Only created if major architectural revision needed
  - Requires new approval, documented rationale

---

**Document by:** Kursskifte Architecture  
**Locked by:** Hassan  
**Next Review:** When V2.0 considered (unlikely in MVP phase)
