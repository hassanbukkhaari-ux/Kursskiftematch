# MVP Definition: Kurskifte-Match

**Document Type:** Implementation Contract  
**Audience:** Architects, Product Owners, Technical Specification Authors, Developers  
**Date:** June 27, 2026  
**Status:** DRAFT (awaiting stakeholder approval)  
**Purpose:** Define what constitutes a complete, shippable MVP before any other platform work proceeds

---

## 1. PURPOSE

This document answers one question only:

**"What must exist before we can call Kurskifte-Match MVP complete?"**

This is the implementation contract. Everything in this document MUST be built. Everything NOT in this document MUST NOT be built (or is explicitly deferred to Phase 2+).

Traceability: Every requirement traces back to existing architecture documentation. If a requirement cannot be traced, it is listed as a GAP.

---

## 2. MVP GOAL

Kurskifte-Match MVP enables Kurskifte ApS to:
1. **Manage professional lifecycle** — Recruit, onboard, verify, manage, offboard professionals
2. **Manage case lifecycle** — Create cases from municipality inquiries, assess complexity, assign professionals
3. **Track work and hours** — Professionals document sessions, register hours, supervisors approve
4. **Enforce grant control** — Track municipal budget vs hours spent per case
5. **Maintain audit trail** — Log all significant actions for compliance and operational visibility
6. **Enable matching** — Score and recommend professionals for cases (human-decision final)

**MVP is NOT:**
- A complete outcome tracking system (defer to Phase 2+)
- A municipality portal (defer to Phase 2+)
- A citizen portal (not building)
- A messaging platform (not building)
- An ERP/billing system (not building)
- Automatic assignment system (human decides all assignments)

**Source:** MASTER_DIRECTIVE.md (Section "WHAT WE ARE BUILDING" and "WHAT WE ARE NOT BUILDING (MVP)")

---

## 3. EXPLICITLY OUT OF SCOPE FOR MVP

The following are explicitly listed as deferred or not building, per existing documentation:

### Phase 2+ Features (Deferred from MVP)
- **Municipality Portal** — Read-only access for sagsbehandler (Phase 2)
- **Outcome Tracking Dashboards** — Performance metrics, quality reporting (Phase 3)
- **Mobile App** — iOS/Android applications (Phase 3)
- **Advanced Matching Optimization** — ML-based candidate scoring (Phase 2)
- **Messaging Platform** — In-app chat or notifications (not building)
- **Billing/ERP Integration** — Invoice generation, payroll export (not building)
- **Clinical Journal System** — Diagnosis tracking, medical records (not building)
- **Citizen Portal** — Direct citizen access (not building)
- **Automatic Assignment** — Professionals must be assigned by admin decision (MVP requires human approval always)

**Source:** MASTER_DIRECTIVE.md (Section "WHAT WE ARE NOT BUILDING")

---

## 4. SUPPORTED ACTORS

MVP supports these actors only:

### Internal Actors (Kurskifte ApS Staff)
1. **Admin/Case Coordinator** — Manages cases, coordinates matching, approves hours
2. **Recruiter** — Recruits professionals, manages applications
3. **Compliance Officer** — Verifies documents, monitors audit trail
4. **Professional** — Logs sessions, registers hours, views assigned cases
   - *Note:* Professional is both internal (staff member) and external role

### External Actors (NOT accessing platform in MVP)
- **Sagsbehandler (Municipality Case Worker)** — External contact via phone/email only, NO platform access
- **Citizen** — No platform access, support is professional-delivered

**Source:** DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (Section "ACTOR DEFINITIONS")

### Explicitly NOT Included
- Municipality users (no platform access in MVP)
- Citizens (no platform access)
- External service providers (background checks, etc.)

**Source:** MASTER_DIRECTIVE.md ("Municipality Portal — Sagsbehandler has no platform access")

---

## 5. SUPPORTED DOMAINS (Six-Domain Model)

MVP is organized around six integrated domains. All must be operational in MVP:

### Domain 1: Professional Domain
**Owns:** Professional recruitment, onboarding, verification, capacity, availability, offboarding
**Must Support In MVP:** YES (core to platform)
**Source:** DOMAIN_VISION.md (Section "EXECUTIVE SUMMARY")

### Domain 2: Municipality Domain
**Owns:** Municipality reference data, sagsbehandler contacts, grant allocation
**Must Support In MVP:** YES (reference data needed for case creation)
**Limitation:** No sagsbehandler portal access. Municipality contact is admin-maintained only.
**Source:** DOMAIN_VISION.md, MASTER_DIRECTIVE.md

### Domain 3: Case Domain
**Owns:** Case lifecycle, complexity assessment, assignments, handovers, closure
**Must Support In MVP:** YES (core to platform)
**Source:** DOMAIN_VISION.md

### Domain 4: Delivery Domain
**Owns:** Session documentation, hour registration, contact logs, follow-up tracking
**Must Support In MVP:** YES (required to track work)
**Limitation:** Basic follow-up tracking only (Phase 2: full follow-up management system)
**Source:** DOMAIN_VISION.md

### Domain 5: Governance Domain
**Owns:** Audit trail, GDPR compliance, permissions, data retention, hour approval
**Must Support In MVP:** YES (required for legal compliance)
**Source:** DOMAIN_VISION.md

### Domain 6: Matching Domain
**Owns:** Matching logic, candidate scoring, recommendations
**Must Support In MVP:** YES (core business need)
**Limitation:** Recommendation only, human approves all assignments (no auto-assignment)
**Source:** DOMAIN_VISION.md

---

## 6. REQUIRED BUSINESS CAPABILITIES (from BUSINESS_CAPABILITY_MAP)

MVP must implement the following capabilities. Organized by domain.

**Source:** BUSINESS_CAPABILITY_MAP.md (each capability cross-referenced)

### Professional Domain (10 capabilities required)
| # | Capability | MVP Status | Rationale |
|---|-----------|-----------|-----------|
| 1.1 | Recruit Professional | REQUIRED | Core recruitment |
| 1.2 | Receive Professional Application | REQUIRED | Core recruitment |
| 1.3 | Create Professional Profile | REQUIRED | Onboarding requirement |
| 1.4 | Upload Professional Documents | REQUIRED | Verification requirement |
| 1.5 | Verify Professional Documents | REQUIRED | Compliance requirement |
| 1.6 | Approve Professional | REQUIRED | Activation requirement |
| 1.7 | Update Professional Availability | REQUIRED | Capacity management |
| 1.8 | Update Professional Capacity | REQUIRED | Matching input |
| 1.9 | Suspend Professional | DEFERRED (Phase 2) | Listed in capability map as Phase 2 |
| 1.10 | Archive Professional | REQUIRED | Offboarding requirement |

**GAP IDENTIFIED:** Capability 1.9 (Suspend Professional) is listed in BUSINESS_CAPABILITY_MAP but marked Phase 2 in DOMAIN_BOUNDARIES_AND_CONTEXT_MAP. Clarification needed: Is suspension in MVP or Phase 2?
**Decision Required Before Technical Specification.**

### Municipality Domain (5 capabilities required)
| # | Capability | MVP Status | Rationale |
|---|-----------|-----------|-----------|
| 2.1 | Register Municipality | REQUIRED | Case creation prerequisite |
| 2.2 | Record Sagsbehandler Contact | REQUIRED | Communication requirement |
| 2.3 | Receive Municipality Inquiry | REQUIRED | Case creation trigger |
| 2.4 | Record Grant Information | REQUIRED | Budget tracking requirement |
| 2.5 | Maintain Municipality Reference Data | REQUIRED | Data integrity |

### Case Domain (9 capabilities required)
| # | Capability | MVP Status | Rationale |
|---|-----------|-----------|-----------|
| 3.1 | Create Case | REQUIRED | Core business process |
| 3.2 | Assess Case Complexity | REQUIRED | Matching input |
| 3.3 | Create Case Grant | REQUIRED | Budget tracking |
| 3.4 | Mark Case Ready For Matching | REQUIRED | Workflow gate |
| 3.5 | Record Case Assignment | REQUIRED | Core assignment |
| 3.6 | Change Case Assignment | DEFERRED (Phase 2) | Complex handover process |
| 3.7 | Initiate Handover | REQUIRED | Professional change process |
| 3.8 | Close Case | REQUIRED | Case lifecycle completion |
| 3.9 | Archive Case | REQUIRED | Data management |

**GAP IDENTIFIED:** Capability 3.6 (Change Case Assignment) — Not clear if this is MVP or Phase 2. WF-008 (Handover) not documented. Recommend implementing as part of handover workflow.

### Delivery Domain (7 capabilities required)
| # | Capability | MVP Status | Rationale |
|---|-----------|-----------|-----------|
| 4.1 | Create Session Log Draft | REQUIRED | Work documentation |
| 4.2 | Finalize Session Log | REQUIRED | Work documentation submission |
| 4.3 | Correct Session Log | REQUIRED | Write-once correction model |
| 4.4 | Register Hours | REQUIRED | Payroll and budget tracking |
| 4.5 | Submit Hours | REQUIRED | Hours approval workflow |
| 4.6 | Record Contact Log | REQUIRED | Coordination tracking |
| 4.7 | Record Follow-Up Need | DEFERRED (Phase 2) | Listed as Phase 2 in capability map |

### Governance Domain (8 capabilities required)
| # | Capability | MVP Status | Rationale |
|---|-----------|-----------|-----------|
| 5.1 | Record Audit Event | REQUIRED | Legal compliance |
| 5.2 | Enforce Access Boundary | REQUIRED | Security requirement |
| 5.3 | Review Outside Grant Hours | REQUIRED | Budget control |
| 5.4 | Approve Hours | REQUIRED | Payroll control |
| 5.5 | Reject Hours | REQUIRED | Quality control |
| 5.6 | Manage Data Retention | REQUIRED | GDPR compliance |
| 5.7 | Execute GDPR Deletion | REQUIRED | GDPR legal requirement |
| 5.8 | Generate Compliance Export | REQUIRED | Audit trail export |

### Matching Domain (6 capabilities required)
| # | Capability | MVP Status | Rationale |
|---|-----------|-----------|-----------|
| 6.1 | Trigger Match Run | REQUIRED | Matching workflow start |
| 6.2 | Score Match Candidates | REQUIRED | Candidate ranking |
| 6.3 | Explain Match Score | REQUIRED | Transparency requirement |
| 6.4 | Recommend Candidates | REQUIRED | Decision support |
| 6.5 | Record Human Match Decision | REQUIRED | Assignment approval |
| 6.6 | Version Matching Algorithm | REQUIRED | Algorithm tracking |

**Summary:**
- **Total Capabilities:** 41 defined in BUSINESS_CAPABILITY_MAP
- **MVP Required:** 38-40 (depending on Phase 2 clarifications)
- **Deferred to Phase 2:** 1-3 (Suspend Professional, Change Case Assignment, Record Follow-Up Need)
- **Gaps Identified:** 3 (need clarification on phase assignment)

---

## 7. REQUIRED WORKFLOWS (13 Workflows Total)

All 13 workflows referenced in BUSINESS_CAPABILITY_MAP must be documented and implemented for MVP.

**Current Status:** Only WF-002 documented. WF-001, WF-003-013 not yet written.

**GAP:** This is the primary blocker for Technical Specification. All 13 workflows must be documented before Technical Specification can proceed.

### Workflow List (from BUSINESS_CAPABILITY_MAP)

| # | Workflow | Title | MVP Status | Doc Status | Source |
|---|----------|-------|-----------|-----------|--------|
| WF-001 | Professional Onboarding | Recruit, verify, onboard professional | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-002 | Municipality Inquiry to Case Creation | Convert inquiry to case with assessment | REQUIRED | DOCUMENTED | docs/01-workflows/WF-002-* |
| WF-003 | Match Run and Assignment | Score candidates, recommend, assign | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-004 | Case Activation | Transition case to ACTIVE status | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-005 | Session Documentation | Professional logs support session | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-006 | Registered Hours | Professional submits hours for approval | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-007 | Outside Grant Review | Review hours exceeding municipal grant | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-008 | Professional Handover | Transfer case to new professional | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-009 | Contact Disclosure | Disclose professional/sagsbehandler contact | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-010 | Contact Log | Record communication between parties | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-011 | Document Upload and Verification | Professional uploads, admin verifies credentials | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-012 | Case Closure and Archival | Close completed case, archive for retention | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |
| WF-013 | GDPR Retention and Deletion | Schedule deletion after retention period | REQUIRED | NOT DOCUMENTED | BUSINESS_CAPABILITY_MAP |

**Critical Requirement:** All 13 workflows must follow the workflow template defined in docs/01-workflows/README.md

**Each workflow must include:**
- Metadata (status, priority, version, owner)
- Purpose statement
- Actors involved
- Trigger conditions
- Preconditions
- Main flow (step-by-step)
- Alternative flows (error cases)
- Business rules
- Data validation rules
- Audit events logged
- GDPR considerations

**Gap Resolution:** Workflows are PREREQUISITE for Technical Specification. Cannot design APIs without workflows.

---

## 8. REQUIRED DOMAIN ENTITIES

All 13 core entities from MASTER_DIRECTIVE must be implemented in MVP.

**Source:** MASTER_DIRECTIVE.md (Section "APPROVED ARCHITECTURE (V4)")
**Detailed Schema:** DOMAIN_MODEL_DATABASE_SPEC.md

### Entity List

| # | Entity | Domain | MVP | Schema Status | Notes |
|---|--------|--------|-----|----------------|-------|
| 1 | Municipality | Municipality | REQUIRED | Complete | Reference data |
| 2 | Case | Case | REQUIRED | Complete | Central entity |
| 3 | CaseAssignment | Case | REQUIRED | Complete | Temporal professional assignment |
| 4 | CaseGrant | Case | REQUIRED | Complete | Municipal budget per case |
| 5 | CaseComplexityFactors | Case | REQUIRED | Complete | Structured assessment |
| 6 | Professional | Professional | REQUIRED | Complete | Social service provider |
| 7 | ProfessionalDocument | Professional | REQUIRED | Complete | Credential vault |
| 8 | SessionLog | Delivery | REQUIRED | Complete | Work documentation (write-once) |
| 9 | RegisteredHours | Delivery | REQUIRED | Complete | Time tracking for payroll |
| 10 | SessionLogCorrection | Delivery | REQUIRED | Complete | Correction model (write-once) |
| 11 | CaseHandover | Case | REQUIRED | Complete | Structured handover process |
| 12 | SessionLogTransfer | Delivery | REQUIRED | Complete | Audit trail for session sharing |
| 13 | ContactDisclosure | Delivery | REQUIRED | Complete | Audit trail for contact sharing |
| 14 | ContactLog | Delivery | REQUIRED | INCOMPLETE | Professional-sagsbehandler communication |
| 15 | MatchRun | Matching | REQUIRED | INCOMPLETE | Match scoring run |
| 16 | MatchCandidate | Matching | REQUIRED | INCOMPLETE | Scored candidate with explanation |
| 17 | AuditEvents | Governance | REQUIRED | INCOMPLETE | Immutable event log |

**Gap Status:**
- **Complete Schemas:** Municipality, Case, CaseAssignment, CaseGrant, CaseComplexityFactors, Professional, ProfessionalDocument, SessionLog, RegisteredHours, SessionLogCorrection, CaseHandover, SessionLogTransfer, ContactDisclosure
- **Incomplete Schemas:** ContactLog, MatchRun, MatchCandidate, AuditEvents

**Action Required:** Complete schema definitions for ContactLog, MatchRun, MatchCandidate, AuditEvents before Technical Specification.

**Additional Entities Needed (Currently Not Modeled):**
- **FollowUpNeed** (mentioned in capability map but not modeled) — DEFERRED to Phase 2
- **ProfessionalSkill** (mentioned in domain but not modeled) — DEFERRED to Phase 2
- **ProfessionalRating** (mentioned in domain but not modeled) — DEFERRED to Phase 2

---

## 9. REQUIRED PERMISSIONS (High-Level Only)

MVP must enforce role-based access control. This section defines high-level permission requirements. Detailed RBAC matrix is deferred to Permission Model document.

**Source:** DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (scattered references)

### Required System Roles

1. **Admin** — Kurskifte staff with full platform access
   - Can: Manage all entities, approve hours, assign professionals, view audit trail
   - Cannot: Auto-assign (must choose explicitly)

2. **Professional** — Social service provider
   - Can: View assigned cases, log sessions, register hours, view own profile
   - Cannot: View other professionals' data, approve hours, assign themselves

3. **[Other roles?]** — NOT YET DEFINED

**Gap Identified:** Permission Model not explicitly defined. The following questions remain unanswered:
- Can Professional view other Professionals' profiles? (No, implied)
- Can Admin view all citizen notes? (Implied yes, but not explicit)
- What role is needed to verify documents? (Compliance Officer role not defined)
- Which Admin can approve which hours? (Unclear if all admins or designated approvers)
- Can Admin delegate hour approval to Professional? (Implied no, not stated)

### Required Access Control Rules (High-Level)

**Professional Access:**
- Can access: Own cases (assigned), own profile, own documents
- Cannot access: Other professionals' data, other cases, audit trail
- **Source:** Implied by DOMAIN_BOUNDARIES_AND_CONTEXT_MAP (Professional role definition)

**Admin Access:**
- Can access: All cases, all professionals, all hours, audit trail
- Cannot: Auto-assign (must choose explicitly)
- **Source:** MASTER_DIRECTIVE.md ("Automatic Assignment — All professional assignments require admin decision")

**Sensitive Data Access Rules (GDPR):**
- citizen_notes: Admin, Case Coordinator, Assigned Professional only
- session_log content: Admin, Case Coordinator, Assigned Professional only
- professional contact (phone/email): Defined recipients only (not public)
- audit trail: Admin only

**Gap:** Detailed permission matrix must be created in PERMISSION_MODEL.md before Technical Specification.

---

## 10. REQUIRED SCREENS/PAGES

MVP must support the following user interfaces. Based on workflows and capabilities.

**Note:** This section lists required screens implied by workflows. Actual UI design is deferred to design phase, but these screens must exist.

### Professional Domain Screens
- Professional Application Form (external or admin-entered)
- Professional Profile View/Edit
- Professional Document Upload
- Professional Document Verification Status
- Professional Availability/Capacity Settings
- Professional List (admin only)
- Professional Onboarding Checklist
- Professional Offboarding Checklist

**Source:** WF-001 (Professional Onboarding) — NOT YET DOCUMENTED, inferred from capability

### Municipality Domain Screens
- Municipality Reference Data Form (admin only)
- Sagsbehandler Contact Management (admin only)
- Municipality Inquiry Reception Form (admin only)
- Grant Allocation Form (admin only)

**Source:** WF-002 (Municipality Inquiry to Case Creation) — DOCUMENTED

### Case Domain Screens
- Case Creation Form (from municipality inquiry)
- Case Complexity Assessment Form
- Case Status Dashboard
- Case Assignment List/Selection
- Case Details View
- Case Handover Process
- Case Closure Form
- Case Archive View

**Source:** WF-002, WF-004, WF-008, WF-012 — NOT YET DOCUMENTED (except WF-002)

### Delivery Domain Screens
- Session Log Entry Form (draft)
- Session Log Finalization/Review
- Session Log Correction Form
- Hours Registration Form
- Hours Approval/Rejection (admin)
- Contact Log Entry
- Follow-Up Needs Tracker (Phase 2 — NOT MVP)

**Source:** WF-005, WF-006, WF-007, WF-010 — NOT YET DOCUMENTED

### Matching Domain Screens
- Match Run Trigger/Status
- Candidate Scoring Results
- Match Score Explanation
- Candidate Recommendation List
- Match Decision Recording (admin)

**Source:** WF-003 (Match Run and Assignment) — NOT YET DOCUMENTED

### Governance Domain Screens
- Audit Trail Viewer (admin only)
- Hours Approval Queue
- Outside Grant Review Form
- Compliance Export Generator

**Source:** WF-007, WF-013, capability descriptions

### Professional Portal Screens
- My Cases (assigned cases only)
- Session Log Dashboard
- Hours Tracking
- My Profile View
- My Documents View

**Source:** Professional capability descriptions

**Gap:** No wireframes or design mocks exist. Design should proceed in parallel with workflow documentation.

---

## 11. REQUIRED REPORTS

MVP must support the following reports. Based on Governance Domain and existing documentation.

**Source:** GOVERNANCE_CAPABILITY_MAP section "Generate Compliance Export"

### Operational Reports (Internal Use)
1. **Audit Trail Export** — Complete list of audit events (filterable by date, actor, type)
   - **Purpose:** Operational visibility, investigation
   - **Audience:** Admin, Operations Manager
   - **Traceability:** BUSINESS_CAPABILITY_MAP (Capability 5.8)

2. **Hours Pending Approval** — Professional hours awaiting admin decision
   - **Purpose:** Workflow management
   - **Audience:** Case Coordinator, Admin
   - **Traceability:** Implied by WF-006 (Registered Hours)

3. **Grant Budget Status** — Grant allocated vs hours approved per case
   - **Purpose:** Budget control
   - **Audience:** Operations Manager, Case Coordinator
   - **Traceability:** Implied by WF-007 (Outside Grant Review)

4. **Professional Capacity Report** — Current assignments per professional
   - **Purpose:** Capacity planning
   - **Audience:** Operations Manager
   - **Traceability:** Implied by matching and assignment workflows

### Compliance Reports (Legal/Audit)
5. **GDPR Data Subject Export** — All data about a specific individual
   - **Purpose:** Right to access, data portability
   - **Audience:** Admin (on behalf of data subject)
   - **Traceability:** BUSINESS_CAPABILITY_MAP (Capability 5.8)

6. **Retention Compliance Report** — Archived records and scheduled deletions
   - **Purpose:** Legal compliance verification
   - **Audience:** Legal, Compliance Officer
   - **Traceability:** BUSINESS_CAPABILITY_MAP (Capability 5.6, 5.7)

7. **Permission Access Log** — Who accessed what data when
   - **Purpose:** Security audit
   - **Audience:** Security Officer, Admin
   - **Traceability:** Implied by audit trail requirement

**Gap:** No detailed reporting requirements document exists. 

**Action Required Before Technical Specification:**
- Clarify data fields for each report
- Specify report filtering/sorting options
- Specify export formats (CSV, PDF, JSON)
- Specify access control for each report
- Specify retention policy for report data

---

## 12. REQUIRED NOTIFICATIONS

MVP delivers outbound email for a targeted set of high-value operational events. The Notification Service is defined in ADR-010. Delivery is owned by WF-014 (Notification Dispatch).

**Architecture:** Event-driven, channel-agnostic. Workflows emit business events only; WF-014 owns delivery. MVP channel is email only (via Resend). In-app, SMS, push, and Slack notifications are Phase 2.

**Recipient model:**
- Admin system recipient: configured via `SYSTEM_ADMIN_EMAIL` environment variable (role inbox, not a user account)
- Professional recipient: resolved from `profiles.email` at dispatch time; personal email is never stored in `notification_log`

### MVP Notification Events (5 events — active in MVP)

| Notification Type | Source | Recipient | Trigger |
|---|---|---|---|
| `PROFESSIONAL_APPLICATION_RECEIVED` | WF-001 | Admin (system email) | Professional profile created (status=REGISTERED) — requires review and credential verification |
| `CASE_CREATED` | WF-002 | Admin (system email) | New municipality case submitted — requires assignment |
| `SAFEGUARDING_FLAGGED` | WF-005 | Admin (system email) | Session log finalized with safeguarding_concern_flag=TRUE — requires immediate acknowledgement |
| `HOURS_SUBMITTED` | WF-006 | Admin (system email) | Professional submits hours for approval |
| `DOCUMENT_ACTION_REQUIRED` | WF-011 | Admin (system email) or Professional | Document uploaded and pending verification; approaching expiry (30 days); re-upload required by admin |

**`DOCUMENT_ACTION_REQUIRED` recipient resolution:**
- Upload pending verification → Admin (system email)
- Approaching expiry → Admin (system email)
- Re-upload required → Professional (`recipient_profile_id`)

### Deferred Notification Events (Phase 2)

The following events are tracked via `audit_events` in MVP but do not generate outbound notifications until Phase 2:

`PROFESSIONAL_APPROVED`, `CASE_ASSIGNMENT_TERMINATED`, `HOURS_APPROVED`, `HOURS_REJECTED`, `HOURS_OUTSIDE_GRANT_FLAGGED`, `HANDOVER_INITIATED`, `CASE_ASSIGNED`, `CANDIDATES_RECOMMENDED`, `CASE_CLOSED`, `DATA_DELETION_SCHEDULED`, and all other events listed in the architecture event catalogue.

### Delivery Infrastructure

- `notification_log` table: Governance Domain, 3rd table (after `audit_events` and `deletion_schedules`)
- WF-014 Edge Function: dispatches pending records, updates status + attempt_count
- Max retry attempts: 3 (manual re-queue after exhaustion)
- `failure_reason` field: stores provider error codes (no PII per ADR-004)

**Source:** ADR-010 (Notification Service), WF-014 (Notification Dispatch), WF-001/WF-002/WF-005/WF-006/WF-011

---

## 13. REQUIRED AUDIT EVENTS

All significant actions must emit audit events. MVP must track the following audit events.

**Source:** DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (Events Published per Domain) + BUSINESS_CAPABILITY_MAP.md (Capability 5.1 Record Audit Event)

### Event Categories

**Professional Domain Events (13 events)**
- PROFESSIONAL_RECRUITED
- PROFESSIONAL_VERIFIED (document)
- PROFESSIONAL_APPROVED
- PROFESSIONAL_CAPACITY_UPDATED
- PROFESSIONAL_AVAILABILITY_CHANGED
- DOCUMENT_UPLOADED
- DOCUMENT_VERIFIED
- DOCUMENT_EXPIRY_WARNING
- PROFESSIONAL_INACTIVE
- PROFESSIONAL_OFFBOARDING_INITIATED
- PROFESSIONAL_ARCHIVED
- PROFESSIONAL_SKILL_ASSESSED (Gap: not yet mapped to event)
- PROFESSIONAL_REACTIVATED (Gap: not yet mapped to event)

**Municipality Domain Events (4 events)**
- MUNICIPALITY_CREATED
- SAGSBEHANDLER_REGISTERED
- SAGSBEHANDLER_UPDATED
- COOPERATION_AGREEMENT_RECORDED

**Case Domain Events (11 events)**
- CASE_CREATED
- CASE_READY_FOR_MATCHING
- COMPLEXITY_ASSESSED
- CASE_GRANT_CREATED
- CASE_ASSIGNED
- ASSIGNMENT_CHANGED
- HANDOVER_INITIATED
- CASE_COMPLETED
- CASE_CLOSED
- CASE_ARCHIVED
- CASE_REOPENED (Gap: unclear if case can be reopened)

**Delivery Domain Events (8 events)**
- SESSION_LOG_STARTED
- SESSION_LOG_FINALIZED
- SESSION_LOG_CORRECTED
- HOURS_REGISTERED
- HOURS_SUBMITTED
- CONTACT_LOGGED
- FOLLOW_UP_NEEDED (Gap: marked Phase 2 but listed in events)
- FOLLOW_UP_COMPLETED (Gap: marked Phase 2)

**Governance Domain Events (3 events)**
- HOURS_APPROVED
- HOURS_REJECTED
- OUTSIDE_GRANT_REVIEWED

**Matching Domain Events (6 events)**
- MATCH_RUN_TRIGGERED
- CANDIDATES_SCORED
- MATCH_EXPLANATION_GENERATED
- CANDIDATES_RECOMMENDED
- HUMAN_DECISION_RECORDED
- ALGORITHM_VERSION_UPDATED

**System Events (4 events)**
- DATA_RETENTION_SCHEDULED
- DATA_DELETED
- PERMISSION_DENIED
- ACCESS_GRANTED

**Audit Event Schema:**
- Event ID (UUID)
- Event Type (from above list)
- Actor (user ID)
- Timestamp
- Resource Type (Case, Professional, etc.)
- Resource ID
- Change Details (metadata contract, no sensitive data)
- Status (success, failure, pending)

**Source:** DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (Events per domain)

**Gap:** Detailed event schemas not defined. Metadata contracts not specified. What sensitive vs non-sensitive fields are — not clear.

---

## 14. REQUIRED GDPR FEATURES

MVP must implement GDPR compliance features as specified in architecture.

**Source:** MASTER_DIRECTIVE.md (Section "GDPR by Design") + BUSINESS_CAPABILITY_MAP (Governance Domain Capabilities)

### Data Minimization (REQUIRED)
- ✅ Citizen data minimal: Initials only (NOT full name)
- ✅ Citizen data minimal: Age range only (NOT full date of birth)
- ✅ No CPR/SSN storage
- ✅ Citizen notes encrypted
- ✅ Contact info encrypted

**Source:** DOMAIN_MODEL_DATABASE_SPEC.md (Case entity: citizen_initials, citizen_age_range)

### Right to Access (REQUIRED)
- ✅ Data subject can request export of all data about them
- ✅ Export in portable format (CSV/JSON)
- ✅ Admin generates export on request

**Implementation:** Capability 5.8 "Generate Compliance Export"
**Status:** NOT YET DETAILED — what triggers data subject request? How is request logged? How is data consent verified?

**Gap:** No workflow for "Data Subject Right to Access Request" — must be created before Technical Specification.

### Right to Erasure (REQUIRED)
- ✅ Data subject can request deletion
- ✅ System deletes data within 30 days (configurable)
- ✅ Deletion is scheduled, not immediate

**Implementation:** Capability 5.7 "Execute GDPR Deletion" + WF-013 (GDPR Retention and Deletion) — NOT YET DOCUMENTED
**Conflict:** Write-once audit trail vs right to erasure — How to delete data while maintaining audit trail?

**Gap:** Right to erasure workflow not documented. How does deletion conflict with audit immutability? Must clarify before Technical Specification.

### Data Retention (REQUIRED)
- ✅ Default retention: 7 years after case closure/professional archive
- ✅ Retention timer starts when record archived
- ✅ Deletion happens automatically after retention period
- ✅ Deletion itself is immutable event (audit trail of deletion)

**Implementation:** Capability 5.6 "Manage Data Retention"
**Source:** MASTER_DIRECTIVE.md ("Right-to-be-forgotten implemented (7-year retention, then delete)")

### Privacy-Safe Audit Events (REQUIRED)
- ✅ Audit events must NOT contain sensitive citizen/professional data
- ✅ Only metadata and IDs stored (not actual content)
- ✅ Corrections explain change without reproducing sensitive content

**Example:**
- ✅ CORRECT: `{ event: 'SESSION_LOG_CORRECTED', case_id: 'xyz', session_id: 'abc', reason: 'typo in time field' }`
- ❌ WRONG: `{ event: 'SESSION_LOG_CORRECTED', case_id: 'xyz', old_notes: 'Citizen had conflict with...', new_notes: 'Citizen resolved conflict...' }`

**Source:** ADR-004 "Privacy-Safe Audit Events"

### Data Handling Rules (REQUIRED)
- ✅ Soft deletes only (no hard DELETE from database)
- ✅ Archived records retain all data (for audit trail, GDPR recovery)
- ✅ No automatic deletion before retention period
- ✅ Deletion requires explicit schedule + execution

**Source:** MASTER_DIRECTIVE.md (Section "GDPR by Design")

### Encrypted Fields (REQUIRED)
- ✅ citizen_notes: encrypted
- ✅ Professional contact (in stored form): encrypted
- ✅ Sensitive session log content: potentially encrypted (TBD)

**Gap:** No encryption specification — which fields, which algorithm, key management?

---

## 15. REQUIRED MATCHING FEATURES

Matching must be implemented per BUSINESS_CAPABILITY_MAP (Matching Domain, 6 capabilities).

**Source:** BUSINESS_CAPABILITY_MAP.md (Matching Domain capabilities) + DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (Matching Domain detail)

### Capability 6.1: Trigger Match Run (REQUIRED)
- Admin can initiate matching for a case
- Precondition: Case must be OPEN and marked ready for matching
- System identifies eligible professionals (approved, available, capacity permits)

**Implementation Gap:** WF-003 not documented — matching logic, error cases not defined

### Capability 6.2: Score Match Candidates (REQUIRED)
- Algorithm scores professionals for suitability
- Scoring is deterministic (same inputs = same scores)
- Scoring algorithm is versioned (v1.0, v1.1, etc.)

**Scoring Factors (Implied from DOMAIN_BOUNDARIES_AND_CONTEXT_MAP):**
- Professional qualifications match case needs
- Professional experience relevant to case complexity
- Professional capacity available
- Professional availability suitable
- Professional not already overloaded

**Implementation Gap:** Scoring algorithm not specified. What factors? What weights? How do they combine into score 0.0-1.0?

**Source:** Implied by matching capabilities and domain descriptions

### Capability 6.3: Explain Match Score (REQUIRED)
- For each scored professional, system generates human-readable explanation
- Explanation is NOT persuasive, just factual
- Explanation supports Case Coordinator decision (doesn't force it)

**Implementation Gap:** Explanation format not defined. Template not provided.

### Capability 6.4: Recommend Candidates (REQUIRED)
- Top 3 candidates presented to Case Coordinator
- Lower-ranked candidates available if needed
- Recommendation is NOT a decision (admin chooses)

**Requirement:** Must not auto-assign top candidate. Case Coordinator can choose differently.

**Source:** MASTER_DIRECTIVE.md ("Automatic Assignment — All professional assignments require admin decision")

### Capability 6.5: Record Human Match Decision (REQUIRED)
- Case Coordinator selects professional from recommendation list (or manually picks different professional)
- Decision is recorded with reason (if overriding recommendation)
- Assignment is created by Case Domain (not Matching Domain)

**Constraint:** Cannot assign without human decision.

**Source:** MASTER_DIRECTIVE.md, BUSINESS_CAPABILITY_MAP.md

### Capability 6.6: Version Matching Algorithm (REQUIRED)
- Algorithm versions tracked (v1.0, v1.1, v2.0, etc.)
- MatchRun records which version was used
- Previous versions immutable (cannot change v1.0 after release)
- Rationale for version updates documented

**Implementation Gap:** Algorithm versioning rules not specified.

### Matching Domain Events (REQUIRED)
- MATCH_RUN_TRIGGERED
- CANDIDATES_SCORED
- MATCH_EXPLANATION_GENERATED
- CANDIDATES_RECOMMENDED
- HUMAN_DECISION_RECORDED
- ALGORITHM_VERSION_UPDATED

**Source:** DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md (Matching Domain events)

### Matching Constraints for MVP
- ❌ NO automatic assignment
- ❌ NO auto-selecting top candidate
- ❌ NO algorithm as black-box (must be explainable)
- ❌ NO bypassing human decision

---

## 16. REQUIRED RECRUITMENT FEATURES

Professional recruitment must support the complete recruitment and onboarding lifecycle.

**Source:** BUSINESS_CAPABILITY_MAP.md (Professional Domain, Capability 1.1-1.6) + WF-001 (NOT YET DOCUMENTED)

### Capability 1.1: Recruit Professional (REQUIRED)
- System tracks recruitment campaign
- Recruitment source recorded (LinkedIn, referral, job board, etc.)
- Recruiter assigned to application pipeline

**Implementation Gap:** WF-001 not documented — recruitment process not defined

### Capability 1.2: Receive Professional Application (REQUIRED)
- Professional submits application form (external or admin-entered)
- Application includes: resume/CV, references, availability, experience
- Application received confirmation sent

**Implementation Gap:** External form vs internal intake? Not defined.

### Capability 1.3: Create Professional Profile (REQUIRED)
- After hiring decision, professional profile created in system
- Professional assigned system login
- Professional marked as PENDING_VERIFICATION (cannot be assigned yet)

### Capability 1.4: Upload Professional Documents (REQUIRED)
- Professional uploads credentials (CV, background checks, certifications)
- Document status: PENDING_UPLOAD → UNVERIFIED → VERIFIED
- Professional can re-upload if rejected

**Implementation:** WF-011 (Document Upload and Verification) — NOT YET DOCUMENTED

### Capability 1.5: Verify Professional Documents (REQUIRED)
- Compliance Officer reviews uploaded documents
- Documents verified against requirements per type
- Rejection feedback provided (so professional knows what to fix)
- Document expiry tracked (alerts before expiry)

**Constraint:** Expired documents auto-flag professional as needing renewal
**Implementation Gap:** Document verification rules not defined. Which doc types required? Which optional?

### Capability 1.6: Approve Professional (REQUIRED)
- After all documents verified, admin approves professional
- Professional marked as APPROVED
- Professional now eligible for matching

**Constraint:** Professional cannot be assigned until APPROVED

### Professional Statuses in MVP
- REGISTERED (profile created, verification pending)
- ACTIVE (approved and available)
- INACTIVE (on leave or sabbatical)
- ARCHIVED (no longer with Kurskifte)

**Gap:** SUSPENDED status mentioned in capability but marked Phase 2. Clarification needed.

### Recruitment Domain Events (REQUIRED)
- PROFESSIONAL_RECRUITED
- APPLICATION_RECEIVED
- PROFESSIONAL_CREATED
- DOCUMENT_UPLOADED
- DOCUMENT_VERIFIED
- DOCUMENT_REJECTED
- DOCUMENT_EXPIRY_WARNING
- PROFESSIONAL_APPROVED
- PROFESSIONAL_INACTIVE
- PROFESSIONAL_OFFBOARDING_INITIATED
- PROFESSIONAL_ARCHIVED

---

## 17. REQUIRED MUNICIPALITY FEATURES

Municipality management must support the relationship with municipalities and grant allocation.

**Source:** BUSINESS_CAPABILITY_MAP.md (Municipality Domain, Capabilities 2.1-2.5)

### Capability 2.1: Register Municipality (REQUIRED)
- Admin creates municipality record
- Information: name, status (ACTIVE/INACTIVE), contact info, cooperation agreement
- Municipality unique identifier assigned

### Capability 2.2: Record Sagsbehandler Contact (REQUIRED)
- Admin records sagsbehandler (case worker) contact information
- Information: name, email, phone, department, response time expectations
- Multiple sagsbehandler contacts per municipality supported
- Sagsbehandler contact updated independently from municipality record

**Important:** Sagsbehandler is a CONTACT RECORD ONLY. Sagsbehandler does NOT have platform login in MVP.

### Capability 2.3: Receive Municipality Inquiry (REQUIRED)
- Municipality submits inquiry requesting support for citizen
- Inquiry contains: citizen info, support need, grant budget, timeline
- Case Coordinator assigned immediately

**Implementation:** WF-002 (Municipality Inquiry to Case Creation) — DOCUMENTED
**Method:** Email, phone, or future form submission (not API in MVP)

### Capability 2.4: Record Grant Information (REQUIRED)
- Admin records municipal grant allocation for case
- Information: grant amount (hours or currency), period, conditions
- Multiple grants per case supported (sequential or multiple municipalities)

### Capability 2.5: Maintain Municipality Reference Data (REQUIRED)
- Admin updates municipality information (address, contact, personnel)
- Admin updates sagsbehandler contacts (new staff, departures)
- Change history preserved

**MVP Constraint:** Municipality has NO access to platform itself. All contact is via phone/email.

---

## 18. REQUIRED PROFESSIONAL FEATURES

Professional features enable professionals to document work and manage their profile.

**Source:** BUSINESS_CAPABILITY_MAP.md (Professional capabilities 1.7-1.8) + Delivery Domain capabilities (4.1-4.6)

### Professional Capabilities

**Capability 1.7: Update Professional Availability (REQUIRED)**
- Professional marks self as ACTIVE, ON_LEAVE, UNAVAILABLE
- Return date tracked if on leave
- Availability changes trigger matching updates

**Capability 1.8: Update Professional Capacity (REQUIRED)**
- Admin updates professional capacity (hours/week, concurrent cases, complexity ceiling)
- Changes effective immediately
- Professional notified of changes

**Capability 4.1: Create Session Log Draft (REQUIRED)**
- Professional begins documenting support session
- Session in DRAFT state (can be edited)
- Multiple sessions per day supported

**Capability 4.2: Finalize Session Log (REQUIRED)**
- Professional marks session complete and submits
- Session status: DRAFT → SUBMITTED
- Session write-once (cannot edit after finalization)
- Correction must use correction model

**Capability 4.3: Correct Session Log (REQUIRED)**
- Professional or admin corrects finalized session
- Correction model used (explains change, doesn't hide original)
- Original session immutable

**Capability 4.4: Register Hours (REQUIRED)**
- Professional submits hours worked (for payroll and grant control)
- Hours linked to session (optional)
- Hours for admin work, documentation also supported

**Capability 4.5: Submit Hours (REQUIRED)**
- Professional finalizes hours and submits for approval
- Hours status: PENDING → SUBMITTED
- Admin reviews and approves/rejects

**Capability 4.6: Record Contact Log (REQUIRED)**
- Professional logs communication with sagsbehandler
- Information: date, method (phone/email/meeting), summary, outcome

### Professional Portal Features (Required)
- View assigned cases
- Log sessions for each case
- Register hours for each case
- View submission status (pending/approved/rejected)
- View own profile
- View own documents and expiry status
- Update availability status

---

## 19. ACCEPTANCE CRITERIA FOR MVP COMPLETE

MVP is complete and ready to ship when:

### Architecture & Domain
- [ ] All 6 domains implemented and operational
- [ ] All 13 core entities exist with correct schemas
- [ ] Domain boundaries enforced (no cross-domain violations)
- [ ] All domain events implemented and working

### Workflows
- [ ] All 13 workflows documented (WF-001 through WF-013)
- [ ] All workflows implemented and tested
- [ ] Workflow gates enforced (e.g., case must be ready before matching)
- [ ] Alternative flows and error cases handled

### Capabilities
- [ ] All 38+ required capabilities implemented
- [ ] Each capability produces required audit events
- [ ] No data inconsistency when capability execution fails

### Permissions & Security
- [ ] Role-based access control enforced (Admin, Professional at minimum)
- [ ] Sensitive data access restricted (citizen notes, contact info, audit trail)
- [ ] Session-based authentication working
- [ ] Unauthorized access returns 403 (not 500)

### Data & Compliance
- [ ] Audit trail working (all events recorded)
- [ ] Soft delete implemented (no hard deletes)
- [ ] Encrypted fields protected (citizen_notes, contacts)
- [ ] GDPR data retention policy scheduled
- [ ] GDPR deletion scheduled for 7-year archived records
- [ ] Data subject export (right to access) available

### User Interface
- [ ] All required screens/pages implemented
- [ ] Professional portal functional (case view, session logging, hour submission)
- [ ] Admin portal functional (case management, matching, approvals, reporting)
- [ ] Workflow states visible to users
- [ ] Error messages clear and actionable

### Integrations
- [ ] External form submission (municipality inquiry) working (if implemented)
- [ ] Manual email/phone integration functional (admin can copy contact details)

### Testing
- [ ] Unit tests pass (domain logic)
- [ ] Integration tests pass (workflows end-to-end)
- [ ] Manual testing of all workflows complete
- [ ] All audit events verified
- [ ] Permission enforcement tested

### Documentation
- [ ] Architecture documentation updated with as-built changes
- [ ] API contract documented (if exposed)
- [ ] Database schema documented
- [ ] Deployment guide written
- [ ] Runbook written (how to operate the system)

### Performance
- [ ] System responds in <2 seconds for typical queries
- [ ] No N+1 query problems
- [ ] Reports can be generated without timeout

### Data
- [ ] Sample data loaded (at least one complete workflow)
- [ ] Audit trail visible with real data
- [ ] GDPR export works on sample data

---

## 20. DEFINITION OF DONE (MVP Release Criteria)

A feature is "done" when:

### Code
- [ ] Code written
- [ ] Code reviewed and approved
- [ ] Automated tests pass
- [ ] No security issues identified in code review
- [ ] No hardcoded secrets or sensitive data

### Testing
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed
- [ ] Edge cases tested (empty data, missing fields, etc.)
- [ ] Error cases tested

### Audit Trail
- [ ] Audit event emitted for feature (if applicable)
- [ ] Audit event schema matches contract
- [ ] Audit event visible in compliance export

### Permissions
- [ ] Feature respects permission model
- [ ] Unauthorized users get 403 (not 500)
- [ ] Sensitive data not exposed

### Data Handling
- [ ] No sensitive data logged
- [ ] Soft delete used (if deletion needed)
- [ ] Write-once pattern used (if immutability needed)
- [ ] Derived values calculated, not stored

### Documentation
- [ ] Feature documented in architecture (if required)
- [ ] API documented (request/response format)
- [ ] Error codes documented
- [ ] Database changes documented

### Accessibility
- [ ] Screen readers work (if UI screen)
- [ ] Keyboard navigation works (if UI screen)
- [ ] Color contrast meets WCAG AA (if UI screen)

### Compliance
- [ ] GDPR implications considered
- [ ] Data retention rules applied
- [ ] Encryption used for sensitive fields (if applicable)

### Performance
- [ ] Response time <2 seconds (typical case)
- [ ] Query is indexed (if database query)
- [ ] No N+1 problems

---

## TRACEABILITY SUMMARY

Every requirement in this MVP Definition traces back to existing documentation:

| Section | Traced To | Count |
|---------|-----------|-------|
| Supported Actors | DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md | 4 actors |
| Supported Domains | DOMAIN_VISION.md | 6 domains |
| Capabilities | BUSINESS_CAPABILITY_MAP.md | 38+ capabilities |
| Workflows | BUSINESS_CAPABILITY_MAP.md | 13 workflows |
| Entities | MASTER_DIRECTIVE.md, DOMAIN_MODEL_DATABASE_SPEC.md | 17 entities |
| Permissions | DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md | Partial (gap identified) |
| Audit Events | DOMAIN_BOUNDARIES_AND_CONTEXT_MAP.md | 45+ events |
| GDPR Features | MASTER_DIRECTIVE.md | 6 features |
| Matching Features | BUSINESS_CAPABILITY_MAP.md | 6 capabilities |
| Recruitment Features | BUSINESS_CAPABILITY_MAP.md | 6 capabilities |
| Municipality Features | BUSINESS_CAPABILITY_MAP.md | 5 capabilities |
| Professional Features | BUSINESS_CAPABILITY_MAP.md | 8 capabilities |

**Total Requirements:** 100+ derived from existing documentation
**Total Gaps Identified:** 15+ (listed explicitly in each section)

---

## IMPLEMENTATION DEPENDENCIES

These items must be completed BEFORE Technical Specification can proceed:

### Critical (Blocking)
1. Write WF-001, WF-003-013 workflows (12 workflows, 60-80 hours)
2. Create Permission Model document (20-30 hours)
3. Complete entity schemas (ContactLog, MatchRun, MatchCandidate, AuditEvents) (10-15 hours)

### High-Priority
4. Document professional lifecycle (suspension, reactivation, archival) (10-15 hours)
5. Create GDPR deletion workflow (WF-013) (10-15 hours)
6. Create notification requirements document (10-15 hours)

### Medium-Priority
7. Define contact disclosure workflow (10-15 hours)
8. Define reporting requirements (10-15 hours)
9. Clarify professional suspension phase assignment (1-2 hours)

**Total Estimated Effort:** 145-200 hours (4-6 weeks with 1 person)

---

## NEXT STEPS

### Immediate (This Week)
1. Stakeholder approval of MVP Definition (this document)
2. Identify gaps requiring decision
3. Assign ownership for blocking items

### Short-Term (Next 2-3 Weeks)
1. Write 12 missing workflows
2. Create Permission Model document
3. Complete entity schemas

### Before Technical Specification
1. Resolve all 15 identified gaps
2. Validate workflows with stakeholders
3. Final walkthrough of MVP scope

### Then
Technical Specification can be designed with confidence.

---

**Document Status:** DRAFT (awaiting stakeholder approval)  
**Next Review:** After architecture audit presentation  
**Approval Required By:** [Product Owner, Architect, Technical Lead]

---

**This MVP Definition is the implementation contract. Everything in this document MUST be built. Everything NOT in this document MUST NOT be built (or is explicitly deferred).**
