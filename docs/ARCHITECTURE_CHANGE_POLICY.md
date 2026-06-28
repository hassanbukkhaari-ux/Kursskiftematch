# Architecture Change Policy
## What Requires a New Architecture Version

**Date:** June 27, 2026  
**Status:** APPROVED  
**Version:** 1.0

---

## PURPOSE

This policy defines when architecture changes require a new version (v1.0 → v2.0 → v3.0...) vs. when they can proceed without versioning.

**Core Rule:** Changes to the domain model, security model, or core principles require a new architecture version and explicit approval.

---

## CHANGES REQUIRING NEW ARCHITECTURE VERSION

### Major Domain Changes

**New Core Domain Entity**
- Example: Adding `CaseOutcome` table to track support results
- Why: New entity changes domain model, affects relationships, requires RLS
- Process: ADR + approval + new version tag

**Changed Relationship Between Entities**
- Example: Changing CaseAssignment from 1:N to M:M
- Why: Relationships are core to domain, affect queries and RLS
- Process: ADR + redesign + approval + new version

**New Core Value Type**
- Example: Adding new CaseStatus enum value that changes workflow
- Why: Status is central to understanding case lifecycle
- Process: ADR + approval + new version
- Note: Minor additions to existing enums may not require version bump (see "Not Requiring")

**Changed Entity Field Semantics**
- Example: Changing `weekly_hours` from absolute to relative
- Why: Changes interpretation of data, breaks existing logic
- Process: ADR + migration plan + approval + new version

---

### Security & Access Control Changes

**Changed RLS/Security Principle**
- Example: Allowing professionals to see all cases (removing role-based RLS)
- Why: Fundamental security boundary change, affects all data access
- Process: ADR + security review + approval + new version

**New User Role**
- Example: Adding `sagsbehandler` role with platform access
- Why: Changes who can access what, fundamental security model
- Process: ADR + RLS design + approval + new version

**Changed Least Privilege Model**
- Example: Allowing professionals to edit other professionals' documents
- Why: Access control is fundamental
- Process: ADR + RLS redesign + approval + new version

**New Portal**
- Example: Adding Municipality Portal in MVP (or any new access point)
- Why: New users mean new RLS, new access boundaries
- Process: ADR + full RLS design + approval + new version

---

### Audit & Compliance Changes

**Changed Audit Model**
- Example: Removing audit events, changing immutability rules
- Why: Audit is foundational for compliance and accountability
- Process: ADR + compliance review + approval + new version

**Changed Data Retention/GDPR Model**
- Example: Changing 7-year retention to 30 days
- Why: GDPR compliance, affects legal obligations
- Process: ADR + legal review + approval + new version

**Changed Right-to-Be-Forgotten Implementation**
- Example: Switching from scheduled delete to admin-manual delete
- Why: GDPR implementation, affects data protection obligations
- Process: ADR + compliance review + approval + new version

---

### Matching & Decision-Making Changes

**Changed Matching Decision Model**
- Example: Switching from human-in-the-loop to automatic assignment
- Why: Fundamental change to how professionals are assigned
- Process: ADR + safety review + approval + new version
- Note: Algorithm version changes (v1.0 → v1.1) do NOT require architecture version

**Changed Assignment Workflow**
- Example: Allowing automatic handover without admin approval
- Why: Explicit vs. implicit is core principle
- Process: ADR + approval + new version

---

### Feature Scope Changes

**Changes to Forbidden-Feature List**
- Example: Moving municipality portal from Phase 2 to MVP
- Why: Forbidden list defines scope boundaries
- Process: ADR + scope review + approval + new version

**New Forbidden Feature**
- Example: Adding "no citizen messaging" to forbidden list
- Why: Changes what we explicitly don't build
- Process: ADR + scope discussion + approval + new version

---

### Data Minimization Changes

**Changes to PII/Data Minimization Model**
- Example: Storing full citizen names instead of initials
- Why: Privacy by design is core principle
- Process: ADR + privacy review + approval + new version

**Changes to Encrypted Fields**
- Example: Removing encryption from safeguarding_detail
- Why: Privacy by design is core principle
- Process: ADR + security review + approval + new version

---

## CHANGES NOT REQUIRING NEW ARCHITECTURE VERSION

### UI/UX Changes

**New UI Component**
- Example: Adding a new form validation pattern
- Why: UI doesn't affect domain model or data
- Process: Direct implementation (no ADR needed)

**Changed Button Copy**
- Example: "Save Case" → "Create Case"
- Why: Text changes don't affect architecture
- Process: Direct implementation

**New Dashboard Widget**
- Example: Adding professional workload heatmap
- Why: UI-only, no domain changes
- Process: Direct implementation

---

### Database Optimizations (Non-Breaking)

**New Index**
- Example: Adding index on `cases.created_at`
- Why: Performance optimization, doesn't change domain
- Process: Direct implementation (no ADR needed)

**Query Optimization**
- Example: Adding database view for workload calculation
- Why: Still calculating same values, just more efficiently
- Process: Direct implementation

**Refactoring Non-Domain Logic**
- Example: Extracting validation logic into reusable function
- Why: Code quality, not domain change
- Process: Direct implementation

---

### API Extensions (Consistent with Architecture)

**New API Endpoint (Consistent)**
- Example: Adding GET /api/professionals/:id/documents
- Why: Follows existing patterns, doesn't change domain
- Process: Direct implementation (if validates against ADRs)

**New Query Parameter**
- Example: Adding filter to GET /api/cases?status=ACTIVE
- Why: Convenience feature, doesn't change domain
- Process: Direct implementation

**New Response Field (Non-Breaking)**
- Example: Adding `is_expired` to document response
- Why: Calculated field, doesn't change storage
- Process: Direct implementation (if it's actually derived, not stored)

---

### Bug Fixes

**Data Corruption Fix**
- Example: Fixing orphaned session logs
- Why: Corrects data, doesn't change architecture
- Process: Direct implementation

**RLS Policy Bug Fix**
- Example: Fixing professional seeing someone else's cases (security bug)
- Why: Fixing violation of existing policy, not changing policy
- Process: Direct implementation (with urgency)

---

### Non-Domain Refactoring

**Code Structure Changes**
- Example: Moving utility functions to separate module
- Why: Code organization, doesn't affect domain
- Process: Direct implementation

**Dependency Updates**
- Example: Upgrading Supabase client library
- Why: Dependencies don't change architecture
- Process: Direct implementation

**Documentation Updates**
- Example: Improving CHANGELOG wording
- Why: Documentation clarity, not architecture
- Process: Direct implementation

---

### Algorithm Changes (Without Changing Model)

**Matching Algorithm Improvement**
- Example: Changing scoring weights in v1.0 → v1.1
- Why: Still using MatchRun and MatchCandidate, just better scoring
- Process: Algorithm version bump (independent from architecture version)
- Note: Algorithm v1.1 can be used with Architecture v1.0

**Workload Status Calculation Change**
- Example: Changing threshold from 75% to 80%
- Why: Still calculating same value, just different threshold
- Process: Direct implementation

---

## DECISION TREE

```
Change proposed
  ↓
Does it affect domain model (entities, relationships)?
  ├─ YES → Requires Architecture Version Bump
  └─ NO ↓
  
Does it affect security/RLS/access boundaries?
  ├─ YES → Requires Architecture Version Bump
  └─ NO ↓
  
Does it affect audit model or GDPR compliance?
  ├─ YES → Requires Architecture Version Bump
  └─ NO ↓
  
Does it change matching/assignment workflow fundamentally?
  ├─ YES → Requires Architecture Version Bump
  └─ NO ↓
  
Does it change forbidden features or scope?
  ├─ YES → Requires Architecture Version Bump
  └─ NO ↓
  
Does it add PII or reduce privacy protection?
  ├─ YES → Requires Architecture Version Bump
  └─ NO ↓
  
Is it a UI/UX change, bug fix, or optimization?
  ├─ YES → No Architecture Version Needed
  └─ NO ↓
  
Is it consistent with existing architecture?
  ├─ YES → No Architecture Version Needed (may need ADR for context)
  └─ NO → Requires Architecture Version Bump (unclear, discuss)
```

---

## PROCESS FOR NEW ARCHITECTURE VERSION

**When architecture version bump required:**

1. **Create ADR**
   - File: `/docs/adr/ADR-NNN-title.md`
   - Include: Context, Decision, Alternatives, Consequences
   - Reference affected architecture components

2. **Review & Discuss**
   - Share with team
   - Get Hassan approval
   - Discuss implications

3. **Update Documentation**
   - Update affected architecture docs
   - Update CHANGELOG.md with new version entry
   - Update DECISION_LOG.md if new decision

4. **Create Git Tag**
   - Tag: `architecture-v2.0` (or next version)
   - Annotated tag with description
   - Include commit hash

5. **Commit Changes**
   - Commit ADR
   - Commit documentation updates
   - Commit tag

---

## PROCESS FOR NON-VERSION CHANGES

**For changes not requiring architecture version:**

1. **Check Against Principles**
   - Does it violate ARCHITECTURE_PRINCIPLES.md?
   - If YES, escalate to ADR/version bump
   - If NO, proceed

2. **Check Against Acceptance Criteria**
   - Does it maintain all acceptance criteria?
   - If NO, escalate
   - If YES, proceed

3. **Implement & Test**
   - Direct implementation
   - Test thoroughly
   - Document in PR/commit message

4. **Commit**
   - Reference which architecture/ADR it's implementing
   - No new tag needed

---

## SPECIAL CASES

### Algorithm Changes
- **Within same model:** No version bump (algorithm-v1.1)
- **Changing scoring fundamentally:** May need architecture version bump (if affects MatchRun structure)

### Minor Enum Additions
- **Adding new status to existing enum:** Usually no version bump
- **Removing status from enum:** May need version bump (data compatibility)
- **Changing meaning of existing status:** Needs version bump

### Backward Compatibility
- **Breaking change:** Architecture version bump
- **Non-breaking addition:** May not need bump (review)
- **Deprecation:** May not need immediate bump (plan for future)

---

## DECISION EXAMPLES

**Should this be a new architecture version?**

| Change | Version Bump? | Rationale |
|--------|---------------|-----------|
| Add new CaseOutcome table | YES | New domain entity |
| Add status filter to API | NO | UI convenience |
| Change citizen data from initials to full name | YES | Privacy/PII change |
| Fix RLS bug in professional access | NO | Bug fix |
| Add municipality portal | YES | New user role, new portal |
| Add API endpoint for getting workload status | NO | UI convenience |
| Change 7-year retention to 30 days | YES | GDPR compliance change |
| Improve matching algorithm scoring weights | NO | Algorithm-v1.1 bump |
| Switch from human-in-the-loop to auto-assign | YES | Fundamental workflow change |
| Add new document type to credential vault | NO | Enum extension |

---

## REFERENCE

- **Architecture Principles:** ARCHITECTURE_PRINCIPLES.md
- **Acceptance Criteria:** ARCHITECTURE_ACCEPTANCE_CRITERIA.md
- **ADR Template:** /docs/adr/ (see ADR-001 for example)
- **Decision Log:** DECISION_LOG.md
- **Changelog:** CHANGELOG.md

---

**Document by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED POLICY  
**Version:** 1.0
