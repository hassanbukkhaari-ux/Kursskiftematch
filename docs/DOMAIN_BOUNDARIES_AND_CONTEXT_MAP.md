# Architecture Audit V1: Kurskifte-Match Pre-Technical Specification Review

**Date:** June 27, 2026  
**Auditor:** Chief Software Architect  
**Purpose:** Comprehensive review of all architecture documentation before Technical Specification design  
**Scope:** All documents in /docs  
**Status:** AUDIT COMPLETE

---

## EXECUTIVE SUMMARY

The Kurskifte-Match architecture is **well-structured in domains** but has **critical gaps in workflow coverage, permission model detail, and lifecycle completeness** that will become expensive to fix once implementation starts.

**Key Finding:** The Business Capability Map references 13 workflows (WF-001 through WF-013), but only **1 workflow is documented** (WF-002). This represents a critical gap that blocks Technical Specification design.

**Readiness:** **NOT READY** for Technical Specification without corrections.

---

## FINDING SUMMARIES BY CATEGORY

### Critical Issues (Blocks Implementation)
- Missing 12 of 13 documented workflows
- Permission model not explicitly defined
- No access control rules specified
- Contact lifecycle undefined
- Permission scope ambiguities

### High Issues (Expensive to fix after implementation)
- Reporting requirements undefined
- Professional suspension workflow missing
- Municipality lifecycle management incomplete
- Missing events in domain event maps
- No explicit mutation tracking strategy

### Medium Issues (Important but recoverable)
- Inconsistent permission terminology
- Missing data access assumptions documentation
- No explicit RLS (Row-Level Security) policy map
- Limited error handling specifications
- Missing edge case documentation

### Low Issues (Nice to have)
- Some terminology inconsistencies
- Document cross-referencing could be better
- No explicit performance assumptions

---

## DETAILED FINDINGS

## 1. MISSING WORKFLOW DEFINITIONS

**Severity:** CRITICAL

**Description:**
The Business Capability Map (BUSINESS_CAPABILITY_MAP.md) explicitly references and categorizes 13 workflows:
- WF-001: Professional Onboarding
- WF-002: Municipality Inquiry to Case Creation ✅ DOCUMENTED
- WF-003: Match Run and Assignment
- WF-004: Case Activation
- WF-005: Session Documentation
- WF-006: Registered Hours
- WF-007: Outside Grant Review
- WF-008: Professional Handover
- WF-009: Contact Disclosure
- WF-010: Contact Log
- WF-011: Document Upload and Verification
- WF-012: Case Closure and Archival
- WF-013: GDPR Retention and Deletion

However, **only WF-002 is actually documented**. The remaining 12 workflows exist as references in the capability map but have no detailed workflow definitions.

**Why It Matters:**
Workflows are the bridge between architecture and technical specification. Without them:
- API endpoints cannot be designed from workflows
- Business rules cannot be extracted
- Error handling cannot be specified
- Validation rules cannot be identified
- Test cases cannot be generated
- UX flows cannot be designed

This represents roughly **80% of the platform's functionality** without documented steps, actors, preconditions, or business rules.

**Affected Documents:**
- BUSINESS_CAPABILITY_MAP.md (lists all 13 workflows)
- 01-workflows/README.md (defines workflow structure but only 1 is written)
- 01-workflows/WF-002-municipality-inquiry-to-case-creation.md (only workflow written)

**Recommendation:**
**BLOCK Technical Specification until all 13 workflows are documented.** This is the single largest gap. Each workflow must include:
- Metadata (status, priority, version)
- Purpose statement
- Actors and their roles
- Trigger conditions
- Preconditions
- Main flow (step-by-step)
- Alternative flows (error cases, edge cases)
- Business rules
- Data validation
- Audit events logged
- GDPR considerations

**Estimated Effort:** 60-80 hours to write 12 workflows at the depth of WF-002

**Blocks Implementation:** YES - Cannot design Technical Specification without workflows

---

## 2. PERMISSION MODEL NOT EXPLICITLY DEFINED

**Severity:** CRITICAL

**Description:**
The architecture documents reference permissions, roles, and access control in multiple places but do not provide a coherent, explicit permission model. Instead, scattered references appear:

- DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md mentions "Admin" and "Professional" platform roles
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md mentions "business roles" vs "system roles"
- MASTER_DIRECTIVE.md assumes "admin decision" for assignments
- WF-002 references "Case Coordinator" but doesn't specify system role/permissions
- No explicit matrix of: Role → Entities → Operations (Create/Read/Update/Delete)

**Specific Gaps:**
1. No explicit list of system roles (assumed: Admin, Professional; others?)
2. No permission matrix (Role × Entity × Operation)
3. No data access boundaries (who can see what data?)
4. No explicit RLS (Row-Level Security) policy map
5. No permission inheritance or delegation rules
6. No permission scope for "Professional" viewing other professionals' profiles
7. No permission for "Admin" to view sensitive citizen notes
8. No permission for "Case Coordinator" vs "Recruiter" vs "Compliance Officer"
9. No explicit permission checks at API level

**Example Ambiguities:**
- Can a Professional view another Professional's capacity? (Document says NO implicitly, but not stated)
- Can a Case Coordinator access all cases or only assigned ones?
- Can an Admin create/edit/delete Municipalities?
- Can an Admin view archived cases?
- Which Admin actions require additional approval?

**Why It Matters:**
Permissions are a **security-critical architectural decision**. Without explicit definition:
- Developers will guess and implement inconsistently
- Security vulnerabilities can be introduced
- GDPR data access must be justified per access
- Audit trail will be incomplete
- Difficult to verify compliance
- Expensive to retrofit after implementation

**Affected Documents:**
- DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (mentions permissions vaguely)
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (distinguishes roles but not permissions)
- MASTER_DIRECTIVE.md (assumes admin decisions but not explicit)
- BUSINESS_CAPABILITY_MAP.md (mentions "Primary Role" for each capability but no permission rules)
- No dedicated document exists

**Recommendation:**
**CREATE a new document: PERMISSION_MODEL.md** that explicitly defines:

1. **System Roles** (list and description)
   ```
   - Admin (Kurskifte staff, full access)
   - Professional (Social service provider, limited access)
   - [Any others?]
   ```

2. **Permission Matrix** (Role × Resource × Action)
   ```
   | Role | Resource | Create | Read | Update | Delete |
   |------|----------|--------|------|--------|--------|
   | Admin | Case | Yes | Own | Own | Archive |
   | Professional | Case | No | Assigned | No | No |
   | Admin | Professional | Yes | All | Own | Archive |
   | Professional | Professional | No | Self | Self | No |
   ```

3. **Data Access Rules**
   - Who can see citizen initials? (Answer: Assigned professional + case coordinator)
   - Who can see contact logs? (Answer: Assigned professional + case coordinator)
   - Who can see hours submitted? (Answer: Admin + assigned professional)

4. **Sensitive Field Access** (per GDPR)
   - citizen_notes (encrypted): Admin, Case Coordinator, Assigned Professional
   - session_log content: Admin, Case Coordinator, Assigned Professional
   - professional phone/email: Defined contacts only

5. **Permission Enforcement** (where, how, when)
   - Backend enforcement (RLS + API checks)
   - Error responses for denied access

**Blocks Implementation:** YES - Cannot implement authentication/authorization without explicit model

---

## 3. INCOMPLETE PROFESSIONAL LIFECYCLE

**Severity:** HIGH

**Description:**
The Professional Domain describes recruitment → onboarding → work → offboarding, but is missing explicit workflow for **professional suspension** and detailed **offboarding/archival** process.

**Specific Gaps:**

1. **Professional Suspension Workflow Missing**
   - BUSINESS_CAPABILITY_MAP.md describes "Suspend Professional" capability
   - No workflow exists for when/how suspension happens
   - No rules for: Can suspended professional's cases be reassigned?
   - No rules for: Are suspended professionals archived or restored?
   - Capability marked "Phase 2" but suspension is business-critical

2. **Professional Offboarding/Archival Workflow Missing**
   - DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md lists "Offboarding Checklist" as Professional owns
   - But no workflow documents offboarding steps
   - Unclear: When professional leaves, what happens to active cases?
   - Unclear: What's the difference between SUSPENDED vs ARCHIVED?
   - Unclear: Can an ARCHIVED professional be reactivated?
   - MASTER_DIRECTIVE says "no hard deletes" but what about cascading effects?

3. **Professional Reactivation Process Missing**
   - No workflow for reactivating INACTIVE or SUSPENDED professionals
   - Unclear if documents need re-verification after leave
   - No rules for capacity adjustment upon return

4. **Document Expiry Handling Unclear**
   - DOMAIN_BOUNDARIES_AND_CONTEXT_MAP mentions "DOCUMENT_EXPIRY_WARNING" event
   - But no workflow for what happens when document expires
   - Does professional automatically become unavailable? (Implied but not explicit)
   - Can they still work on existing cases? (Not stated)

5. **Missing: Professional Performance and Skill Tracking Lifecycle**
   - DOMAIN_BOUNDARIES_AND_CONTEXT_MAP mentions "Professional skill assessments and ratings"
   - But no workflow for skill assessment, update, or rating process
   - No events for skill-related changes
   - Unclear how skills affect matching (MATCHING_DOMAIN should use them but no event link)

**Why It Matters:**
Professional lifecycle is core to the business. Without explicit workflows:
- Incomplete case handovers when professional leaves
- Cases left dangling without assignment
- Archived professionals can be re-added causing data/audit confusion
- Suspension/reactivation creates inconsistent state
- Skill data not connected to matching recommendations
- GDPR deletion might leave orphaned case records

**Affected Documents:**
- BUSINESS_CAPABILITY_MAP.md (defines capabilities but no workflows)
- DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (defines events but workflows missing)
- MASTER_DIRECTIVE.md (mentions soft deletes but not applied to professional offboarding)
- Missing: All workflows affecting professional lifecycle

**Recommendation:**
**CREATE workflows:**
- **WF-001** Professional Onboarding (currently missing, only referenced)
- **Enhanced Section** in WF-008 Professional Handover: what happens when professional leaves mid-case
- **New WF:** Professional Suspension (when, how, what happens to cases)
- **New WF:** Professional Reactivation
- **New WF:** Professional Offboarding/Archival (checklist, case handover, document handling)
- **New WF:** Professional Skill Assessment (assessment, update, matching feedback)

**Blocks Implementation:** YES - Cannot implement professional lifecycle without explicit workflows

---

## 4. MISSING CONTACT LIFECYCLE AND DISCLOSURE WORKFLOW

**Severity:** HIGH

**Description:**
BUSINESS_CAPABILITY_MAP.md references "Contact Disclosure" workflow (WF-009) and the Professional Domain owns "contact information disclosure audit trail" entity. However:

1. **No explicit workflow for when/how contact is disclosed**
   - When does Professional get Sagsbehandler's phone/email?
   - When does Sagsbehandler get Professional's phone/email?
   - Can contact be withheld? (For privacy/safety reasons)
   - Is disclosure automatic or explicit action?
   - GDPR: Is disclosure consent recorded?

2. **ContactDisclosure entity mentioned but not detailed**
   - DOMAIN_MODEL_DATABASE_SPEC.md lists it but no schema defined
   - What data goes in the audit trail?
   - Is this write-once (immutable)?
   - Who can see disclosure history?

3. **No workflow for contact update/change**
   - If professional phone changes, who notifies who?
   - If Sagsbehandler contact changes, does case need update?
   - How are stale contacts purged?

4. **No workflow for contact safety**
   - WF-009 "Contact Disclosure" is listed but not written
   - Unclear if there's a "hide contact" capability for safety concerns
   - DOMAIN_BOUNDARIES_AND_CONTEXT_MAP hints at disclosure but no detail

**Why It Matters:**
Contact disclosure is privacy-critical and GDPR-relevant. Mistakes can expose professional or citizen information unsafely. Without explicit workflow:
- Contact disclosure might be inconsistent
- Safety concerns not honored
- GDPR disclosure audit trail incomplete
- Contact changes cause missed communications

**Affected Documents:**
- BUSINESS_CAPABILITY_MAP.md (references WF-009 Contact Disclosure)
- DOMAIN_MODEL_DATABASE_SPEC.md (ContactDisclosure entity, no schema)
- No dedicated workflow document

**Recommendation:**
**CREATE workflow WF-009: Contact Disclosure** documenting:
- Trigger: When contact is disclosed to the other party
- Preconditions: Professional assigned to case, Sagsbehandler identified
- Main flow: Contact shared, audit logged
- GDPR: Disclosure consent, opt-out options
- Error cases: Safety flags that prevent disclosure
- Alternative: Manual vs automatic disclosure

**Blocks Implementation:** PARTIALLY - Can stub out contact disclosure, but GDPR implications need clarity

---

## 5. REPORTING REQUIREMENTS UNDEFINED

**Severity:** HIGH

**Description:**
Multiple documents assume reporting is needed, but nowhere is there an explicit list of "what reports must the system generate?"

**Assumptions About Reporting:**
- DOMAIN_VISION.md mentions "improve continuously by measuring outcomes"
- MASTER_DIRECTIVE.md defers "outcome tracking dashboards" to Phase 3
- DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md mentions "Governance Domain outputs: reports for compliance"
- WF-002 mentions "Audit trail export" implicitly
- BUSINESS_CAPABILITY_MAP.md lists "Generate Compliance Export" as a capability

**But No Document Specifies:**
1. What reports must be generated? (List missing)
2. What data must be visible per report?
3. Who generates reports? (Admin? Self-service?)
4. What's the reporting cadence? (Daily? On-demand? Monthly?)
5. What compliance reports are legally required?
6. What operational reports does Kurskifte staff need?
7. What reports do municipalities request?
8. Data retention: How long must report data be kept?

**Example Gaps:**
- No requirement for "Professional Hours Report" (but implied by grant tracking)
- No requirement for "Case Status Report" (but implied by case management)
- No requirement for "Grant Budget Report" (but core business need)
- No requirement for "Professional Capacity Report" (but matching depends on it)
- No requirement for "Audit Trail Export" (mentioned but not specified)
- No requirement for "GDPR Compliance Report" (critical for data subject rights)

**Why It Matters:**
Reporting often shapes data modeling. Without explicit requirements:
- Data needed for reporting might not be captured
- Reporting might be bolted on as an afterthought
- Wrong aggregations might be stored
- Performance problems can emerge late
- Compliance reporting might be incomplete
- Users might lack visibility into key operations

**Affected Documents:**
- MASTER_DIRECTIVE.md (defers outcome dashboards)
- BUSINESS_CAPABILITY_MAP.md (lists "Generate Compliance Export" without detail)
- No dedicated reporting requirements document

**Recommendation:**
**CREATE document: REPORTING_REQUIREMENTS.md** specifying:

1. **Operational Reports** (for Kurskifte staff)
   - Professional Hours Report (hours registered, approved, pending)
   - Case Status Report (open, active, completed, archived)
   - Grant Budget Report (allocated, used, remaining per case)
   - Professional Capacity Report (current load, availability, alerts)
   - Match Quality Report (assignments made, success rate, feedback)

2. **Compliance Reports** (for legal/audit)
   - Audit Trail Export (events, actors, timestamps)
   - GDPR Data Subject Report (all data about a specific person)
   - Retention Compliance Report (archived records, scheduled deletions)
   - Permission Access Report (who accessed what data when)

3. **Stakeholder Reports** (if needed)
   - Municipality: Case progress summary (future Phase 2)
   - Professional: Hours/payment summary (future)

4. **Data Requirements** for each report
5. **Cadence and Access** for each report
6. **Retention** policy for report data

**Blocks Implementation:** NO - Can be deferred to Phase 2 if flagged clearly

---

## 6. CONTACT LOG LIFECYCLE INCOMPLETE

**Severity:** MEDIUM

**Description:**
BUSINESS_CAPABILITY_MAP.md defines "Record Contact Log" and "Record Follow-Up Need" as capabilities. However:

1. **Contact Log Schema Not Defined**
   - DOMAIN_MODEL_DATABASE_SPEC.md mentions ContactLog entity
   - No schema specified (who contacted whom, method, outcome, etc.)
   - Unclear if contact log is linked to session log or independent

2. **Follow-Up Need Not Modeled**
   - BUSINESS_CAPABILITY_MAP lists "Record Follow-Up Need" as capability
   - But no entity or schema exists for tracking follow-ups
   - Unclear: Who acts on follow-ups? (Professional, Case Coordinator?)
   - Unclear: What happens when follow-up is completed?
   - No event linked to follow-up completion

3. **Contact Log Purpose Ambiguous**
   - Is it professional → sagsbehandler communication?
   - Or does it include professional → citizen contact?
   - Or does it include internal coordination calls?

**Why It Matters:**
Contact logs are audit trail and coordination records. Without clear structure:
- Inconsistent logging
- Follow-ups can be forgotten
- Unclear responsibility for action
- GDPR: Unclear what contact data is stored

**Affected Documents:**
- BUSINESS_CAPABILITY_MAP.md (defines capabilities)
- DOMAIN_MODEL_DATABASE_SPEC.md (mentions ContactLog, no schema)

**Recommendation:**
**ADD to DOMAIN_MODEL_DATABASE_SPEC.md:**

```
ContactLog entity:
├─ id: UUID
├─ case_id: UUID
├─ from_professional: Boolean (true=professional initiates)
├─ contact_method: PHONE | EMAIL | MEETING | OTHER
├─ contact_date: Timestamp
├─ summary: String (max 500)
├─ outcome: String (optional)
├─ created_at

FollowUpNeed entity:
├─ id: UUID
├─ case_id: UUID
├─ type: MEDICAL | FAMILY | SERVICE | OTHER
├─ priority: LOW | MEDIUM | HIGH
├─ due_date: Date
├─ description: String
├─ status: OPEN | IN_PROGRESS | COMPLETED
├─ assigned_to: UUID (Professional or Coordinator)
├─ completed_at: Timestamp (nullable)
├─ created_at, updated_at
```

**Blocks Implementation:** NO - Can be designed in Technical Specification with clarity

---

## 7. DOMAIN EVENT COVERAGE GAPS

**Severity:** MEDIUM

**Description:**
DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md lists events published and consumed by each domain. However, several capability areas lack corresponding events:

**Missing Events:**
1. **Professional Domain:**
   - PROFESSIONAL_SKILL_ASSESSED (mentioned in capability but no event)
   - PROFESSIONAL_REACTIVATED (reactivation capability not represented)
   - PROFESSIONAL_SUSPENDED (suspension capability but no event)

2. **Matching Domain:**
   - MATCH_ALGORITHM_VERSION_UPDATED (capability exists, no event)
   - MATCHING_POOL_PREPARED (implied but not explicit)

3. **Delivery Domain:**
   - FOLLOW_UP_CREATED (capability exists, no event)
   - FOLLOW_UP_COMPLETED (implied, no event)

4. **Case Domain:**
   - CASE_REOPENED (if case can be reopened after completion, no event)
   - HANDOVER_REQUESTED (WF-008 implies request phase, no event)

**Why It Matters:**
Events are the asynchronous communication between domains. Missing events mean:
- Domain coupling might be tighter than intended
- Audit trail incomplete
- Real-time notifications cannot be implemented
- Event-driven features (like "notify professional of assignment") might be missed

**Affected Documents:**
- DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (event tables per domain)

**Recommendation:**
**AUDIT all events** in DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md against BUSINESS_CAPABILITY_MAP.md. For each capability that changes state, ensure an event exists. Add missing events:
- PROFESSIONAL_SKILL_ASSESSED
- PROFESSIONAL_SUSPENDED
- PROFESSIONAL_REACTIVATED
- FOLLOW_UP_CREATED
- FOLLOW_UP_COMPLETED
- HANDOVER_REQUESTED
- MATCH_ALGORITHM_UPDATED
- And others identified during audit

**Blocks Implementation:** NO - Events can be added before Technical Specification

---

## 8. MATCHING DOMAIN SCOPE AMBIGUITY

**Severity:** MEDIUM

**Description:**
The architecture describes Matching as "decision support" (not automatic assignment), but several aspects are unclear:

**Ambiguities:**
1. **MatchRun Lifecycle Unclear**
   - BUSINESS_CAPABILITY_MAP describes "Trigger Match Run" and "Score Candidates"
   - But what if Case Coordinator rejects all candidates?
   - Can they re-run matching? (Implied yes, no workflow)
   - Are previous match runs retained? (For audit? Yes, but not explicit)
   - How long is a match run "valid"? (No expiry logic mentioned)

2. **Matching Algorithm Versioning**
   - BUSINESS_CAPABILITY_MAP describes "Version Matching Algorithm"
   - But no rules for: Can different cases use different algorithm versions?
   - What if a newer version exists mid-run? (Use new or complete with old?)
   - How are algorithm changes tested/validated before use?

3. **Matching Without Candidate Pool**
   - What if no candidates meet criteria? (No workflow for this)
   - What if all candidates are at capacity? (No workflow)
   - Manual override: Can Case Coordinator assign without matching? (Implied no, not explicit)

4. **Matching Events**
   - DOMAIN_BOUNDARIES_AND_CONTEXT_MAP lists matching events
   - But no mention of "MATCHING_FAILED" or "NO_CANDIDATES" event
   - Unclear what happens when matching can't find suitable candidates

**Why It Matters:**
Matching is core to the platform but underspecified. Edge cases will cause production issues:
- Users won't know what to do if matching finds no candidates
- Algorithm versioning could cause inconsistent scoring
- Case Coordinator might not know they can re-run matching

**Affected Documents:**
- BUSINESS_CAPABILITY_MAP.md (describes capabilities but no edge cases)
- DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (describes events but incomplete)

**Recommendation:**
**ENHANCE WF-003: Match Run and Assignment** to include:
- Precondition: Professional pool has candidates available
- Alternative flow: No candidates meet criteria → what happens?
- Alternative flow: All candidates at capacity → what happens?
- Business rule: Can Case Coordinator override matching and assign any approved professional?
- Business rule: Can matching be re-run? How many times?
- Business rule: Does older match run get archived or replaced?

**Blocks Implementation:** NO - Can be clarified in workflow documentation

---

## 9. GDPR DELETION WORKFLOW INCOMPLETE

**Severity:** MEDIUM

**Description:**
BUSINESS_CAPABILITY_MAP lists "Execute GDPR Deletion" as a governance capability, but the workflow is missing and implications are unclear:

**Gaps:**
1. **WF-013 (GDPR Retention and Deletion) Not Documented**
   - Listed in capability map
   - No workflow steps, preconditions, or business rules
   - Unclear: What exactly gets deleted vs archived?
   - Unclear: Can user request deletion before retention period? (Right to erasure)

2. **Retention vs Deletion Semantics Unclear**
   - MASTER_DIRECTIVE says "7-year retention, then delete"
   - But what if user requests deletion before 7 years? (GDPR right to erasure)
   - How does "right to erasure" conflict with "audit trail immutability"?
   - Can historical audit events be deleted? (Probably not, but not stated)

3. **Data Subject Right to Access Workflow Missing**
   - User can request their data (GDPR right)
   - Unclear: Does "Generate Compliance Export" handle this? (Implied yes, not explicit)
   - No workflow for how data subject makes the request

4. **Deletion Cascade Unclear**
   - If case is deleted, what happens to sessions, hours, assignments?
   - If professional is deleted, what happens to their assignments, sessions, hours?
   - If municipality is deleted, what happens to their cases?
   - Partial: MASTER_DIRECTIVE says "soft delete" but not the cascade

**Why It Matters:**
GDPR is legally binding. Mistakes cause:
- Legal liability for non-compliance
- Data not properly deleted on request
- Audit trail lost if deleted incorrectly
- User data improperly exposed during export
- Orphaned records create confusion

**Affected Documents:**
- BUSINESS_CAPABILITY_MAP.md (lists capability, no workflow)
- MASTER_DIRECTIVE.md (mentions 7-year retention, incomplete)
- Missing: WF-013 GDPR Retention and Deletion

**Recommendation:**
**CREATE WF-013: GDPR Retention and Deletion** documenting:
- Trigger 1: 7-year retention period elapsed
- Trigger 2: User requests data deletion (right to erasure)
- Trigger 3: User requests data export (right to access)
- Preconditions: Data is archived
- Main flow: Scheduled deletion at 7 years
- Alternative: Urgent deletion on user request (what's the process?)
- GDPR compliance: Right to erasure, right to access, right to data portability
- Audit: Deletion itself is immutable event (record that deletion happened)

Also clarify in MASTER_DIRECTIVE:
- What data is soft-deleted vs hard-deleted?
- What audit events are NEVER deleted?
- What's the process for user-initiated right to erasure?

**Blocks Implementation:** PARTIALLY - Retention by time can work, but GDPR rights handling incomplete

---

## 10. MISSING MUNICIPALITY LIFECYCLE COMPLETENESS

**Severity:** MEDIUM

**Description:**
Municipality Domain describes basic CRUD for municipalities but is missing lifecycle completeness:

**Gaps:**
1. **Municipality Deactivation/Archival Workflow Missing**
   - Capability: "Maintain Municipality Reference Data"
   - But no workflow for what happens when municipality ends cooperation
   - What happens to active cases? (Handover required? Auto-close?)
   - Can a municipality be reactivated?

2. **Multiple Sagsbehandler Management Unclear**
   - WF-002 assumes one sagsbehandler per case
   - But municipalities have multiple departments
   - Can one case have multiple sagsbehandlers?
   - What if sagsbehandler contact changes mid-case?
   - No workflow for sagsbehandler changes

3. **Municipality Contact Updates**
   - How is municipality contacted when professional changes?
   - Is notification automatic or manual?
   - No workflow for municipality communication

**Why It Matters:**
Municipalities are long-term partners, not just reference data. Without lifecycle:
- No clear process when municipality relationship ends
- Active cases can be orphaned
- Sagsbehandler changes cause communication gaps

**Affected Documents:**
- BUSINESS_CAPABILITY_MAP.md (lists capability "Maintain Municipality Reference Data" but incomplete)

**Recommendation:**
**ENHANCE Municipality capabilities:**
- Define sagsbehandler change process (new workflow?)
- Define municipality deactivation process (do cases transfer, close, or stay active?)
- Define what happens to active cases when municipality ends cooperation

**Blocks Implementation:** NO - Can be added before Technical Specification

---

## 11. PROFESSIONAL DOCUMENT VERIFICATION GAPS

**Severity:** MEDIUM

**Description:**
WF-011 (Document Upload and Verification) is listed but not documented. Document verification has gaps:

**Gaps:**
1. **No Workflow for Document Re-Upload on Rejection**
   - Capability says "Verify Professional Documents"
   - If rejected, what's the feedback process?
   - Can professional immediately re-upload or mandatory wait?
   - How many rejections before escalation?

2. **Document Expiry Handling Incomplete**
   - DOMAIN_BOUNDARIES_AND_CONTEXT_MAP mentions "DOCUMENT_EXPIRY_WARNING" event 30 days before
   - But no workflow for: What happens if professional doesn't renew?
   - Does professional automatically become INACTIVE?
   - Can they still work on existing cases with expired documents?
   - Is there a grace period?

3. **Document Types Incomplete**
   - DOMAIN_MODEL_DATABASE_SPEC lists: CV, CRIMINAL_RECORD, CHILD_PROTECTION, DRIVING_LICENSE, QUALIFICATION, INSURANCE, OTHER
   - But no clear mapping of which document types are REQUIRED vs OPTIONAL
   - Unclear: Does CHILD_PROTECTION check expire? (Varies by jurisdiction)

**Why It Matters:**
Document verification is compliance-critical. Mistakes cause:
- Unverified professionals assigned to cases
- Expired credentials not caught
- Inconsistent verification standards

**Affected Documents:**
- BUSINESS_CAPABILITY_MAP.md (lists WF-011, no workflow)
- DOMAIN_MODEL_DATABASE_SPEC.md (document entity schema)

**Recommendation:**
**CREATE WF-011: Document Upload and Verification** documenting:
- Required vs optional documents
- Verification checklist per document type
- Rejection feedback and re-upload process
- Expiry alerts and grace period
- Auto-deactivation process for expired documents

**Blocks Implementation:** NO - Can be clarified in workflow

---

## 12. SESSION LOG AND HOURS LINKING UNCLEAR

**Severity:** MEDIUM

**Description:**
One of the key decisions in V3 was to separate SessionLog (work documentation) from RegisteredHours (time tracking). But the linking mechanism is unclear:

**Ambiguities:**
1. **FK Relationship Optional?**
   - DOMAIN_MODEL_DATABASE_SPEC says "SessionLog ↔ RegisteredHours (optional FK link)"
   - What does "optional" mean? Professional can log hours without session? Or vice versa?
   - When would they be unlinked?

2. **Hours Registered Without Session?**
   - Professional can register hours for: admin time, documentation, coordination
   - These don't have associated sessions (correct understanding)
   - But is this explicitly ruled out from being hours-without-session? (Not clear)

3. **Session Without Hours?**
   - Can professional log a session without registering any hours?
   - Example: Quick check-in with no billable hours
   - Unclear if this is valid

4. **Multiple Hours Against One Session?**
   - Can one session have multiple hours entries? (E.g., session + documentation hours)
   - Or is it one-to-many? (One session, multiple hour registrations)
   - Schema doesn't clarify

**Why It Matters:**
SessionLog and RegisteredHours linking affects:
- Grant tracking accuracy
- Invoice generation (future)
- Professional payment calculations
- Audit trail (was professional paid for work they did?)

**Affected Documents:**
- MASTER_DIRECTIVE.md (mentions separation but not linking rules)
- DOMAIN_MODEL_DATABASE_SPEC.md (mentions optional FK, unclear)

**Recommendation:**
**CLARIFY in DOMAIN_MODEL_DATABASE_SPEC or new section:**
- SessionLog can exist without RegisteredHours (e.g., session but no billable hours)
- RegisteredHours can exist without SessionLog (e.g., admin work, documentation)
- One SessionLog can have multiple RegisteredHours entries? Or one-to-one mapping with optional link?
- Add example scenarios clarifying valid combinations

**Blocks Implementation:** NO - Can be clarified before Technical Specification

---

## 13. NO EXPLICIT MUTATION TRACKING STRATEGY

**Severity:** MEDIUM

**Description:**
The architecture emphasizes "immutable audit trail" and "write-once sessions" but doesn't define how mutations are tracked for mutable entities. Questions:

1. **Case Entity Mutations**
   - Case can change: status, complexity, grant
   - Are mutations logged in audit trail? (Implied yes, not explicit)
   - What triggers an audit event? (Any change? Or only certain fields?)
   - Which Case fields can be mutated? (Schema doesn't mark read-only vs mutable)

2. **Professional Mutations**
   - Professional can change: capacity, availability, qualifications
   - Are mutations logged? (Implied yes, not explicit)
   - What fields are immutable? (Name? Email?)

3. **Correction vs Mutation**
   - SessionLogCorrection is a special "correction" pattern
   - But Case, Professional, etc. don't have this pattern
   - Are they directly mutable or corrected separately?

4. **Audit Event Specificity**
   - DOMAIN_BOUNDARIES_AND_CONTEXT_MAP lists events
   - But unclear: Do mutations emit specific events? Or generic "CASE_UPDATED" event?
   - Can developers recover the exact change? (What field changed, old value, new value?)

**Why It Matters:**
Audit trail quality depends on mutation tracking. Without explicit strategy:
- Mutations might not be logged
- Audit trail might be incomplete
- Difficult to debug "why did this change"
- Hard to recover data changes

**Affected Documents:**
- MASTER_DIRECTIVE.md (mentions immutable audit but not mutation strategy)
- DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (lists events but not all mutations)

**Recommendation:**
**CLARIFY in MASTER_DIRECTIVE or new section:**
1. Which entities have immutable fields? (List per entity)
2. Which entities have mutable fields? (List per entity)
3. When are mutations logged as audit events?
4. What information is captured in mutation events? (Field, old value, new value)
5. Are there entities with "correction" pattern like SessionLogCorrection? (Probably Case, Professional, but not specified)

Example:
```
Entity: Case
Immutable: id, municipality_id, citizen_initials, citizen_age_range
Mutable: status, complexity_level, grant, weekly_hours, notes
Audit: Every mutation emits CASE_UPDATED event with field, old, new
Correction: If data needs to be changed retroactively, use same pattern as SessionLogCorrection
```

**Blocks Implementation:** NO - Can be specified in Technical Specification

---

## 14. INCONSISTENT TERMINOLOGY: SAGSBEHANDLER VS CASE COORDINATOR

**Severity:** LOW

**Description:**
Documents use three terms somewhat interchangeably:
- **Sagsbehandler** (Danish term for case worker at municipality)
- **Case Coordinator** (English business role at Kurskifte)
- Sometimes referenced as "Admin" in technical context

**Where Used:**
- WF-002 uses "Case Coordinator" for Kurskifte staff
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL uses "Sagsbehandler" for municipality worker
- DOMAIN_BOUNDARIES_AND_CONTEXT_MAP uses both in different contexts
- BUSINESS_CAPABILITY_MAP uses "Case Coordinator" as primary human role

**Ambiguity:**
Sometimes unclear if document means Kurskifte's Case Coordinator or Municipality's Sagsbehandler when saying "coordinator reviews" something.

**Why It Matters:**
Minor, but can cause confusion during implementation if terminology isn't consistent.

**Affected Documents:**
- All domain documents use both terms

**Recommendation:**
**STANDARDIZE terminology:**
Use clear naming:
- **Sagsbehandler** = Municipality case worker (external)
- **Case Coordinator** = Kurskifte staff managing the case (internal)
- **Admin** = System role with full access (internal)
- **Professional** = Social service provider (external)

Audit all documents and ensure consistent usage.

**Blocks Implementation:** NO - Low priority, can be fixed before Technical Specification

---

## 15. CASE ASSESSMENT AND COMPLEXITY FACTOR RULES VAGUE

**Severity:** MEDIUM

**Description:**
WF-002 describes complexity assessment but complexity determination rules in DOMAIN_MODEL_DATABASE_SPEC and WF-002 differ slightly:

**In WF-002:**
```
- CRITICAL: Safety concerns present, OR substance use combined with multiple agencies
- HIGH: Mental health or diagnosed condition combined with family instability
- MEDIUM: Multiple complexity factors present (2 or more)
- LOW: Single or no complexity factors
```

**In DOMAIN_MODEL_DATABASE_SPEC:**
```
CaseComplexityFactors:
├─ mental_health: Boolean
├─ family_instability: Boolean
├─ school: Boolean
├─ violence: Boolean
├─ substance_use: Boolean
├─ criminality: Boolean
├─ diagnosis: String | NULL
├─ multiple_agencies: Boolean
├─ notes: String | NULL
```

**Gaps:**
1. **How is complexity CALCULATED from factors?**
   - Is it business logic? (Needs to be in code)
   - Are thresholds explicit? (How many factors = HIGH?)
   - Can notes alone make complexity CRITICAL? (Unclear)

2. **Mismatch in Factor Names**
   - WF-002 mentions "School engagement issues" but schema has "school" Boolean
   - WF-002 mentions "History of criminality" but schema has "criminality" Boolean
   - Are these the same? Or different?

3. **Diagnosis Field**
   - Schema allows diagnosis field
   - But rules don't mention diagnosis explicitly
   - Does diagnosis alone increase complexity? (Implied yes, not stated)

4. **Override Possibility**
   - Can case coordinator override complexity calculation?
   - Implied no, but not explicit

**Why It Matters:**
Complexity determines which professionals can be assigned. If rules are vague:
- Complexity might be assessed inconsistently
- Professionals might be assigned to cases beyond their capacity
- Matching scores will be unreliable

**Affected Documents:**
- WF-002 (complexity determination rules)
- DOMAIN_MODEL_DATABASE_SPEC.md (CaseComplexityFactors schema)
- BUSINESS_CAPABILITY_MAP.md (Assess Case Complexity capability)

**Recommendation:**
**EXPLICIT COMPLEXITY CALCULATION RULES:**
Create or enhance WF-002 with exact rules:
```
Complexity is calculated as follows:
1. Start with factor count: mental_health + family_instability + school + violence + substance_use + criminality + multiple_agencies
2. If diagnosis is present AND matches dangerous condition (list), add 1
3. If violence OR (substance_use AND multiple_agencies), set to CRITICAL
4. Else if mental_health AND family_instability, set to HIGH
5. Else if factor_count >= 2, set to MEDIUM
6. Else set to LOW

No override possible without Case Review (future phase)
```

Also clarify field mappings:
- violence = "history of violence OR safety concerns"
- school = "school engagement issues OR school involvement"
- criminality = "history of criminality"

**Blocks Implementation:** NO - Can be specified in Technical Specification

---

## 16. NO EXPLICIT ERROR HANDLING SPECIFICATION

**Severity:** LOW

**Description:**
Documents describe happy paths but lack explicit error handling:

**Examples:**
- What if municipality doesn't exist when case is created? (Create new? Error? Ask for confirmation?)
- What if sagsbehandler contact can't be reached? (Retry? Mark as uncommunicated?)
- What if professional document upload fails? (Immediate retry? Notify user?)
- What if grant allocation is ambiguous? (Wait for clarification? Assume minimum?)

**Why It Matters:**
Error handling becomes architectural decision during implementation. Without upfront thinking:
- Inconsistent error responses
- Poor user experience on failures
- Difficult edge case handling

**Affected Documents:**
- All workflows (implicitly assume happy path)

**Recommendation:**
**ENHANCE each workflow** with "Alternative Flows" section documenting error cases:
- What happens if precondition isn't met?
- What happens if data validation fails?
- What happens if external system is unavailable?
- What happens if user lacks permission?

**Blocks Implementation:** NO - Can be specified in workflows

---

## 17. MISSING EXPLICIT PERFORMANCE ASSUMPTIONS

**Severity:** LOW

**Description:**
No document specifies:
- Expected number of cases per month
- Expected number of professionals
- Expected number of concurrent users
- Expected response time requirements
- Expected data volume over 5 years

**Why It Matters:**
Without performance assumptions, architecture might be wrong:
- Might over-engineer for small scale
- Might under-engineer for large scale
- Caching strategy might be wrong
- Database indexing might miss hot spots

**Recommendation:**
**CREATE document: PERFORMANCE_REQUIREMENTS.md** with:
- Expected growth projections
- Expected user concurrency
- Expected response times
- Expected data volume

Can defer to Phase 2, but flag now.

**Blocks Implementation:** NO - MVP can work without performance targets

---

## 18. ROADMAP ALIGNMENT GAPS

**Severity:** LOW

**Description:**
ROADMAP.md describes phases but some workflows are marked "Phase 2" in BUSINESS_CAPABILITY_MAP while ROADMAP says they're MVP:

**Example:**
- WF-001 Professional Onboarding: Marked "MVP" in BUSINESS_CAPABILITY_MAP but no workflow exists
- Professional Suspension: Marked "Phase 2" but listed as capability

**Minor inconsistency but should be clarified.**

**Recommendation:**
**AUDIT ROADMAP.md against BUSINESS_CAPABILITY_MAP.md** for phase consistency. Ensure "MVP" capabilities all have workflows.

**Blocks Implementation:** NO - Low priority

---

## SUMMARY: CONTRADICTIONS AND DUPLICATE CONCEPTS

**Contradictions Found:**
1. **Minimal contradictions** — Most documents are consistent
2. **Main tension:** SessionLog write-once vs Case mutable — Resolved with correction pattern
3. **Phase assignment inconsistency:** Some capabilities marked Phase 2 but needed for MVP

**Duplicate Concepts Found:**
1. **None identified** — Each domain owns its concepts clearly
2. **Close call:** CaseAssignment vs professional_id separation — Correctly handled

**Missing Concepts:**
1. **Professional skill tracking** — Listed but not tied to matching
2. **Performance metrics** — Not defined anywhere
3. **Reporting export format** — Not specified

---

## ARCHITECTURE READINESS SCORE

### Scoring Methodology
Each category scored 0-100:
- **Domain Model:** Entity completeness, relationships, clarity
- **Workflow Coverage:** Documented workflows, clarity, completeness
- **Permission Model:** Explicit roles, access rules, enforcement points
- **Event Coverage:** All domain events identified, clear event contracts
- **Lifecycle Completeness:** Professional, municipality, case, contact full lifecycle
- **GDPR Compliance:** Data handling, deletion, audit trail, consent
- **Technical Readiness:** Database schema, API contract clarity, implementation guidance

### Detailed Scores

| Category | Score | Comments |
|----------|-------|----------|
| **Domain Model** | 85/100 | Strong domain separation. 13 core entities clear. Minor gaps: follow-ups not fully modeled. Contact log schema missing. |
| **Workflow Coverage** | 25/100 | CRITICAL GAP: 1 of 13 workflows documented (8%). WF-002 is thorough; others not started. This is the primary blocker. |
| **Permission Model** | 35/100 | Major gap: No explicit permission matrix. Roles mentioned but not defined. No RLS policy map. No data access rules. |
| **Event Coverage** | 75/100 | Most events identified. Missing events for suspension, reactivation, follow-up completion. |
| **Lifecycle Completeness** | 65/100 | Case lifecycle clear. Professional lifecycle incomplete (suspension, reactivation, archival). Municipality lifecycle minimal. Contact lifecycle unclear. |
| **GDPR Compliance** | 70/100 | Retention policy clear (7 years). Deletion workflow missing. Right to erasure process undefined. Right to access workflow missing. Data minimization good (initials only). |
| **Technical Readiness** | 60/100 | Database schema mostly complete. Missing: contact log schema, follow-up schema, explicit mutation tracking. API contracts not started. |

### **Overall Architecture Readiness Score: 63/100**

**Interpretation:**
- **0-40:** Not Ready (major gaps block implementation)
- **41-60:** Partially Ready (important gaps need closure)
- **61-80:** Ready for Technical Specification (minor gaps acceptable)
- **81-100:** Ready for Implementation

**This architecture scores 63/100, which is BORDERLINE.** It has strong domain foundations but critical gaps in workflow documentation and permission model that will become expensive to fix during implementation.

---

## DOCUMENTATION COMPLETENESS SCORE: 75/100

**Strengths:**
- ✅ Excellent domain vision
- ✅ Clear domain boundaries
- ✅ Comprehensive capability map
- ✅ Good data model foundation
- ✅ Strong ADR documentation

**Weaknesses:**
- ❌ Missing 12 of 13 workflows (80% incomplete)
- ❌ No permission model document
- ❌ No reporting requirements
- ❌ No explicit error handling
- ❌ Gaps in entity schemas

---

## DOMAIN MODEL SCORE: 80/100

**Strengths:**
- ✅ 13 core entities well-defined
- ✅ Entity relationships clear
- ✅ Immutability patterns established
- ✅ Soft delete strategy defined

**Weaknesses:**
- ❌ ContactLog schema incomplete
- ❌ FollowUpNeed entity not modeled
- ❌ Mutation tracking strategy undefined
- ❌ Some optional FK links unclear

---

## WORKFLOW SCORE: 25/100 (CRITICAL)

**Strengths:**
- ✅ WF-002 is thorough and well-written
- ✅ Workflow template standard established
- ✅ 13 workflows planned and listed

**Weaknesses:**
- ❌ Only 1 of 13 workflows written (92% incomplete)
- ❌ 12 workflows referenced but not documented
- ❌ No workflows for: onboarding, handover, session docs, hours, grant review, contact disclosure, document verification, case closure, GDPR deletion, case activation, contact logs
- ❌ This is the primary blocker for Technical Specification

---

## TECHNICAL READINESS SCORE: 60/100

**Strengths:**
- ✅ Technology stack chosen (Next.js + Supabase)
- ✅ Database schema mostly complete
- ✅ Architectural decisions documented (ADRs)
- ✅ Soft delete strategy defined

**Weaknesses:**
- ❌ API contract not defined
- ❌ RLS policy map missing
- ❌ Permission model not specified
- ❌ Some entity schemas incomplete
- ❌ No explicit error handling
- ❌ Performance assumptions missing

---

## OVERALL RECOMMENDATION

### **Recommendation: NEEDS CORRECTIONS BEFORE TECHNICAL SPECIFICATION**

**Rationale:**

The architecture has **strong domain foundations** but **critical gaps in workflow coverage and permission model** that will cause expensive rework if left until implementation.

**Blocking Issues:**
1. **Missing 12 of 13 workflows** — Cannot design Technical Specification without these
2. **Permission model undefined** — Cannot implement authentication/authorization without this
3. **Professional lifecycle incomplete** — Suspension, reactivation, offboarding workflows missing

**Timeline to Readiness:**

| Task | Effort | Timeline |
|------|--------|----------|
| Write 12 missing workflows | 60-80 hours | 2-3 weeks (1 person) |
| Create permission model document | 20-30 hours | 1 week |
| Complete professional lifecycle | 10-15 hours | 3-5 days |
| Clarify entity schemas | 5-10 hours | 2-3 days |
| Define GDPR deletion workflow | 10-15 hours | 3-5 days |
| **TOTAL** | **105-150 hours** | **4-5 weeks** |

**Critical Path:**
1. Write all 12 missing workflows (blocks everything else)
2. Create permission model document (blocks API design)
3. Complete professional lifecycle (blocks workflow completeness)
4. Then proceed to Technical Specification

**Cost of Delay:**
- If skipped now: **200-300 hours** of rework during implementation
- Better to invest **150 hours** now than **250+ hours** later

---

## WHAT'S GOOD AND SHOULD NOT CHANGE

✅ **Domain separation** — Well thought out, don't change  
✅ **Entity model** — Strong foundation, keep it  
✅ **Immutability strategy** — Good, keep it  
✅ **Event-driven architecture** — Good, complete it  
✅ **GDPR philosophy** — Good, need to detail it  
✅ **Soft delete approach** — Good, apply consistently  

---

## RECOMMENDED NEXT STEPS

### Phase 1: Correct Critical Gaps (2-3 weeks)

1. **Write WF-001 through WF-013** workflows using WF-002 as template
2. **Create PERMISSION_MODEL.md** with roles, matrix, access rules
3. **Complete professional lifecycle** workflows (suspension, offboarding)
4. **Create WF-013** (GDPR Retention and Deletion)

### Phase 2: Close High-Priority Gaps (1-2 weeks)

5. **Create REPORTING_REQUIREMENTS.md**
6. **Define contact lifecycle** and disclosure workflow
7. **Complete entity schemas** for ContactLog, FollowUpNeed
8. **Document mutation tracking strategy**

### Phase 3: Polish and Validate (1 week)

9. Review all workflows for consistency
10. Validate permission model against all capabilities
11. Audit event coverage
12. Final review by all stakeholders

### Then: Technical Specification (Next phase, not ready yet)

---

## CONCLUSION

**The architecture is fundamentally sound but operationally incomplete.** The domain separation, entity model, and governance approach are strong. However, the missing workflows and permission model represent **critical gaps** that will cause expensive rework if not addressed before Technical Specification.

**Invest the time now to complete workflows and permissions. This will enable a smooth Technical Specification phase and avoid costly refactoring during implementation.**

**Estimated cost of correction: 150 hours, 4-5 weeks**  
**Estimated cost of delay: 250+ hours, multiple weeks of implementation rework**

---

**Audit Completed By:** Chief Software Architect  
**Date:** June 27, 2026  
**Recommendation:** Fix critical gaps, then proceed to Technical Specification  
**Next Review:** After workflows are documented
