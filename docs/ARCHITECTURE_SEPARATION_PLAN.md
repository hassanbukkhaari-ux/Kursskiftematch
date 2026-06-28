# Domain Boundaries and Context Map

**Kurskifte-Match: Six Integrated Domains**

**Date:** June 27, 2026  
**Status:** DRAFT (Supporting Technical Specification)  
**Purpose:** Define clear domain boundaries to prevent overlap, ensure consistency, and guide Technical Specification design  

---

## QUICK REFERENCE: DOMAIN OWNERSHIP MATRIX

| Concept | Owned By | Consulted By | Informed By |
|---------|----------|--------------|-------------|
| Professional Profile | Professional | Matching, Case | Governance |
| Professional Credentials | Professional | Delivery, Case | Governance |
| Professional Capacity | Professional | Matching, Case | Delivery |
| Municipality Data | Municipality | Case, Matching | Governance |
| Grant Allocation | Municipality | Case, Delivery | Governance |
| Case Lifecycle | Case | Matching, Delivery | Governance |
| Case Assignment | Case | Delivery, Matching | Governance |
| Support Session | Delivery | Case | Governance |
| Registered Hours | Delivery | Case, Governance | Matching (indirect) |
| Hour Approval | Governance | Case, Delivery | Matching (indirect) |
| Matching Logic | Matching | Case | Governance |
| Match Decision | Case (with Matching input) | Professional, Municipality, Delivery | Governance |
| Audit Events | Governance | (All Domains) | (All Domains) |
| Data Retention | Governance | (All Domains) | (All Domains) |

---

## DOMAIN 1: PROFESSIONAL DOMAIN

### Purpose
Manage the complete lifecycle of support professionals from recruitment through offboarding, ensuring Kurskifte ApS has a pool of verified, available, capable professionals ready to support cases.

### Responsibilities
1. Recruit and onboard new professionals
2. Maintain current professional profiles and contact information
3. Verify and track professional credentials (certifications, background checks, qualifications)
4. Track professional capacity (hours available, concurrent case limits, complexity ceiling)
5. Track professional availability (scheduled, on-leave, unavailable)
6. Manage professional skill development and performance tracking
7. Offboard professionals who leave Kurskifte ApS

### Owns
- **Professional** entity and all attributes (name, contact, qualifications, experience)
- **ProfessionalDocument** entity (credentials, certifications, background checks)
- **ProfessionalCapacity** (hours/week limit, max concurrent cases, max complexity level)
- **ProfessionalAvailability** (calendar, status: active/leave/unavailable)
- **ProfessionalOnboarding** checklist and status
- **ProfessionalOffboarding** checklist and status
- Professional skill assessments and ratings
- Professional application and interview process
- Professional contact information (phone, email, address)
- Professional verification status and document expiry

### Does NOT Own
- ❌ Case assignments (owned by Case Domain)
- ❌ Hours worked (owned by Delivery Domain)
- ❌ Session documentation (owned by Delivery Domain)
- ❌ Match recommendations (owned by Matching Domain)
- ❌ Audit events (owned by Governance Domain)
- ❌ Professional's access permissions (owned by Governance Domain)
- ❌ Whether professional is currently assigned to a case (owned by Case Domain)

### Main Entities/Concepts

**MVP (Implemented in DOMAIN_MODEL_DATABASE_SPEC):**
- **Professional** — The core entity (status, capacity, availability)
- **ProfessionalDocument** — Credentials, certifications, background checks

**Phase 2+ (Not in MVP):**
- **ProfessionalSkill** — Competencies and expertise areas (reserved for future)
- **ProfessionalRating** — Performance assessments (reserved for future)
- **ApplicationForm** — Recruitment intake (manual process in MVP)
- **OnboardingChecklist** — Tasks to complete before becoming active (manual checklist)
- **OffboardingChecklist** — Tasks to complete when leaving (manual checklist)

### Human Roles Involved
- **Recruiter** (from Kurskifte staff) — Recruits professionals
- **Professional** (external) — Provides professional services (can access platform to view cases, document sessions, register hours)
- **Hiring Manager** (Kurskifte staff) — Reviews applications, makes hiring decisions
- **Compliance Officer** (Kurskifte staff) — Verifies documents, checks credentials

### Platform Roles Involved
- **Admin** (Kurskifte staff) — Full access to Professional Domain
- **Professional** (system role) — Professionals access their own profile (read), their assigned cases (read/write sessions/hours), their available cases (read)

### Inputs from Other Domains
- **Case Domain:** "Professional assigned to case" → Professional updates availability
- **Matching Domain:** "Professional recommended for case" → Professional Domain logs as potential match (informational)
- **Governance Domain:** "Credential expires in 30 days" → Professional Domain alerts professional to renew

### Outputs to Other Domains
- **Case Domain:** "Professional available for assignment"
- **Matching Domain:** "Professional profile with current credentials and capacity" (used for scoring)
- **Delivery Domain:** "Professional assigned to case"
- **Governance Domain:** "Professional verified and approved" (audit event)

### Events Published
| Event | Meaning | Sensitive? |
|-------|---------|-----------|
| **PROFESSIONAL_RECRUITED** | New professional application received | No |
| **PROFESSIONAL_VERIFIED** | Professional credentials verified; ready for assignment | No |
| **PROFESSIONAL_APPROVED** | Professional approved and activated (can now be assigned to cases) | No |
| **PROFESSIONAL_CAPACITY_UPDATED** | Professional capacity changed (hours/week, concurrent limits) | No |
| **PROFESSIONAL_AVAILABILITY_CHANGED** | Professional availability status changed | No |
| **DOCUMENT_UPLOADED** | Professional uploaded a credential document | No |
| **DOCUMENT_VERIFIED** | Credential document verified and approved by Kurskifte | No |
| **DOCUMENT_EXPIRY_WARNING** | Credential document expiring soon | No |
| **PROFESSIONAL_INACTIVE** | Professional marked inactive (leave, sabbatical) | No |
| **PROFESSIONAL_OFFBOARDING_INITIATED** | Professional leaving Kurskifte ApS | No |
| **PROFESSIONAL_ARCHIVED** | Professional record archived (no longer available) | No |

### Events Consumed
| Event | From | Action | Sensitive? |
|-------|------|--------|-----------|
| **CASE_ASSIGNMENT_STARTED** | Case Domain | Update professional availability (case now assigned) | No |
| **CASE_ASSIGNMENT_ENDED** | Case Domain | Update professional availability (case now unassigned) | No |
| **HANDOVER_INITIATED** | Case Domain | Notify professional of incoming handover | No |
| **MATCH_ASSIGNED** | Matching Domain | Confirm match was accepted; update availability | No |

### Boundary Rules

**Rule 1:** Professional Domain may not decide whether a professional is assigned to a case.
- ✅ Correct: Professional has capacity → made available to Matching/Case Domain
- ❌ Wrong: Professional Domain auto-assigns professional to best available case

**Rule 2:** Professional Domain may not approve or reject session logs or hours.
- ✅ Correct: Professional submits hours → Case/Governance Domain approves
- ❌ Wrong: Professional Domain reviews and approves hours

**Rule 3:** Professional Domain may not delete a professional's record; only archive.
- ✅ Correct: Set professional.archived_at and soft-delete
- ❌ Wrong: Hard delete professional record

**Rule 4:** Professional Domain must immediately notify Governance Domain of document expiry or credential status change.
- ✅ Correct: Document expires → audit event logged → professional notified
- ❌ Wrong: Professional Domain silently marks professional as inactive

**Rule 5:** Professional Domain may not make match recommendations.
- ✅ Correct: Professional profile available to Matching Domain for scoring
- ❌ Wrong: Professional Domain recommends professional for specific case

### Common Mistakes to Avoid

**Mistake 1: Storing Derived Capacity**
- ❌ Wrong: Store `hours_remaining_this_week` in Professional entity
- ✅ Correct: Calculate `hours_remaining_this_week` at query-time from RegisteredHours

**Mistake 2: Professional Domain Controls Case Assignment**
- ❌ Wrong: Professional updates own assignment via platform
- ✅ Correct: Case Domain records assignment; Professional Domain just tracks availability

**Mistake 3: Storing Hours in Professional Domain**
- ❌ Wrong: Create professional.hours_worked field and update after sessions
- ✅ Correct: Delivery Domain owns RegisteredHours; never stored in Professional

**Mistake 4: Professional Domain Reviews Own Documents**
- ❌ Wrong: Professional marks own credentials as verified
- ✅ Correct: Admin user (Governance-assisted) verifies documents

**Mistake 5: Storing Assignment History in Professional Domain**
- ❌ Wrong: Create professional.past_cases array
- ✅ Correct: Case Domain and Delivery Domain track assignment history

---

## DOMAIN 2: MUNICIPALITY DOMAIN

### Purpose
Maintain relationships and data with municipal partners, manage grant allocations, intake case requests from municipalities, and coordinate communication with municipal case workers (sagsbehandlere).

### Responsibilities
1. Maintain current municipality reference data
2. Maintain sagsbehandler (case worker) contact information
3. Track municipal grant budgets and allocations per case
4. Receive and log case requests from municipalities
5. Coordinate communication with sagsbehandlere
6. Manage municipal agreements and cooperation terms
7. Track municipality communication and status updates

### Owns
- **Municipality** entity (kommune data: name, contact, address, contact person)
- **Sagsbehandler** entity (case worker: name, email, phone, municipality)
- **MunicipalGrant** (grant pool allocated by municipality for multiple cases or specific cases)
- **CaseRequest** / **Inquiry** (incoming request from municipality for citizen support)
- **MunicipalCommunication** log (emails, calls, status updates to/from sagsbehandler)
- Municipality agreements and terms
- Sagsbehandler contact preferences and response times

### Does NOT Own
- ❌ Citizens (owned by Case Domain)
- ❌ Cases (owned by Case Domain)
- ❌ Grant amounts per case (owned by Case Domain, informed by Municipality Domain)
- ❌ Case assignments (owned by Case Domain)
- ❌ Session documentation (owned by Delivery Domain)
- ❌ Professional assignment decisions (owned by Matching/Case Domain)
- ❌ Audit events (owned by Governance Domain)
- ❌ Municipality access to platform (MVP: municipalities do NOT log into platform)

### Main Entities/Concepts
- **Municipality** — The municipal government (kommune)
- **Sagsbehandler** — Case worker at municipality
- **MunicipalGrant** — Budget allocated by municipality
- **CaseRequest** / **Inquiry** — Incoming request for support
- **MunicipalCommunication** — Communication history
- **CooperationAgreement** — Terms and conditions with municipality

### Human Roles Involved
- **Sagsbehandler** (from municipality) — Requests support, receives updates
- **Municipal Contact** (from municipality) — Manages relationship with Kurskifte
- **Account Manager** (Kurskifte staff) — Manages municipality relationship
- **Operations Manager** (Kurskifte staff) — Coordinates with municipalities

### Platform Roles Involved
- **Admin** (Kurskifte staff) — Full access to Municipality Domain
- ❌ **Municipality** (system role) — NOT ALLOWED in MVP (municipalities do not log into platform)

### Inputs from Other Domains
- **Case Domain:** "Case created for municipality X" → Municipality Domain logs activity
- **Delivery Domain:** "Sessions documented for case X" → Municipality Domain may send status update to sagsbehandler
- **Governance Domain:** "X hours outside grant approved" → Municipality Domain may communicate approval to sagsbehandler

### Outputs to Other Domains
- **Case Domain:** "Case request received from municipality X with grant allocation Y"
- **Matching Domain:** "Municipality preferences and communication history" (contextual info only)
- **Governance Domain:** "Municipality communication event" (audit trail)

### Events Published
| Event | Meaning | Sensitive? |
|-------|---------|-----------|
| **MUNICIPALITY_CREATED** | New municipality added to Kurskifte | No |
| **SAGSBEHANDLER_CREATED** | New sagsbehandler added for municipality | No |
| **CASE_REQUEST_RECEIVED** | Municipality submitted case request (inquiry) | No |
| **GRANT_ALLOCATED** | Municipality allocated grant for case(s) | No |
| **SAGSBEHANDLER_UPDATED** | Sagsbehandler contact info updated | No |
| **MUNICIPALITY_COMMUNICATION_LOGGED** | Communication with sagsbehandler recorded | No |
| **STATUS_UPDATE_SENT** | Kurskifte sent status update to municipality | No |

### Events Consumed
| Event | From | Action | Sensitive? |
|-------|------|--------|-----------|
| **CASE_CREATED** | Case Domain | Log that case created for this municipality | No |
| **CASE_ASSIGNED** | Case Domain | May send notification to sagsbehandler | No |
| **CASE_COMPLETED** | Case Domain | Send completion summary to sagsbehandler | No |
| **OUTSIDE_GRANT_REVIEWED** | Case Domain / Governance | Notify sagsbehandler of budget overage review | No |

### Boundary Rules

**Rule 1:** Municipality Domain may NOT access cases or citizens directly.
- ✅ Correct: Sagsbehandler calls Kurskifte staff; staff checks case status in platform
- ❌ Wrong: Sagsbehandler logs into platform to see case details

**Rule 2:** Municipality Domain may NOT allocate grants to specific cases unilaterally.
- ✅ Correct: Municipality notifies Kurskifte of budget → Case Domain creates CaseGrant
- ❌ Wrong: Municipality Domain directly creates CaseGrant entry

**Rule 3:** Municipality Domain may NOT make decisions about professional assignments.
- ✅ Correct: Municipality provides citizen info → Matching recommends → Kurskifte decides
- ❌ Wrong: Municipality specifies which professional must be assigned

**Rule 4:** Municipality Domain may NOT store citizen data (privacy).
- ✅ Correct: Municipality provides citizen need → Case Domain stores only initials/age
- ❌ Wrong: Municipality Domain stores full names, CPR numbers, addresses

**Rule 5:** Municipality Domain may NOT bypass audit trail for communication.
- ✅ Correct: All sagsbehandler communication logged in audit trail
- ❌ Wrong: Private emails or off-platform conversations without logging

### Common Mistakes to Avoid

**Mistake 1: Storing Sensitive Citizen Data**
- ❌ Wrong: Municipality Domain stores citizen's CPR, full name, address
- ✅ Correct: Municipality provides citizen info → Case Domain stores initials + age range only

**Mistake 2: Municipality Direct Case Assignment**
- ❌ Wrong: Sagsbehandler selects professional directly in platform
- ✅ Correct: Sagsbehandler describes citizen need → Kurskifte matches via Matching Domain

**Mistake 3: Storing Grant Per Professional**
- ❌ Wrong: Municipality Domain allocates grant per professional
- ✅ Correct: Case Domain owns grant per case; professional is separate

**Mistake 4: Storing Case Data in Municipality Domain**
- ❌ Wrong: Municipality Domain maintains case.citizen_name, case.status
- ✅ Correct: Case Domain owns case data; Municipality Domain owns municipality reference only

**Mistake 5: Silent Communication**
- ❌ Wrong: Sagsbehandler calls, staff doesn't log the call
- ✅ Correct: All sagsbehandler communication logged in audit trail

---

## DOMAIN 3: CASE DOMAIN

### Purpose
Manage the complete lifecycle of support cases from creation through closure, including citizen assessment, case status, professional assignment tracking, handovers, and case completion/archival.

### Responsibilities
1. Create and track support cases for citizens
2. Assess case complexity using structured factors
3. Track professional assignments to cases (via CaseAssignment entity)
4. Manage case status workflow (OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED)
5. Coordinate professional handovers when professionals change
6. Track case completion and closure
7. Archive completed cases for retention
8. Manage grant allocation and remaining hours per case

### Owns
- **Case** entity (the central coordination record)
- **Citizen** entity (minimal data: initials, age range, encrypted notes)
- **CaseComplexityFactors** (structured assessment factors)
- **CaseAssignment** (temporal tracking of which professional is assigned when)
- **CaseGrant** (budget allocated to this case from municipality)
- **CaseStatus** (workflow state: OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED)
- **CaseHandover** (structured process when professional changes)
- Case notes and history
- Remaining hours calculation (granted - approved hours)
- Case complexity calculation (from structured factors)

### Does NOT Own
- ❌ Professional data (owned by Professional Domain)
- ❌ Session documentation (owned by Delivery Domain)
- ❌ Registered hours details (owned by Delivery Domain)
- ❌ Match recommendations (owned by Matching Domain)
- ❌ Municipality data (owned by Municipality Domain)
- ❌ Audit events (owned by Governance Domain)
- ❌ Professional availability (owned by Professional Domain)
- ❌ Matching algorithms (owned by Matching Domain)

### Main Entities/Concepts
- **Case** — The central coordination record for citizen support
- **Citizen** — Subject of support (minimal data for privacy)
- **CaseComplexityFactors** — Structured assessment (not free-text)
- **CaseAssignment** — Temporal tracking of assignments (replaces cases.professional_id)
- **CaseGrant** — Budget for this case
- **CaseHandover** — Process when professional changes
- **CaseStatus** — Workflow state

### Human Roles Involved
- **Case Coordinator** (Kurskifte staff, business role) — Creates cases, manages lifecycle, approves handovers
- **Admin** (system role) — Same person as Case Coordinator
- **Professional** — Works with assigned case
- **Sagsbehandler** — Requested support for citizen (not platform user in MVP)

### Platform Roles Involved
- **Admin** (Kurskifte staff) — Full case management access

### Inputs from Other Domains
- **Municipality Domain:** "Case request with citizen info, grant amount, sagsbehandler contact"
- **Matching Domain:** "Recommended professional with match explanation"
- **Professional Domain:** "Professional availability and capacity data"
- **Delivery Domain:** "Session logged, hours registered" → Updates case status/progress
- **Governance Domain:** "Budget outside grant reviewed and approved" → Case records decision

### Outputs to Other Domains
- **Professional Domain:** "Professional assigned to case" → Professional updates availability
- **Matching Domain:** "Case ready for matching" + "Case details for scoring"
- **Delivery Domain:** "Case status changed" → May affect what sessions are valid
- **Governance Domain:** "Case created", "Case status changed", "Case archived"

### Events Published
| Event | Meaning | Sensitive? |
|-------|---------|-----------|
| **CASE_CREATED** | New support case created for citizen | Yes (encrypted notes) |
| **CASE_READY_FOR_MATCHING** | Case ready for professional matching | No |
| **MATCH_RUN_TRIGGERED** | Admin initiated matching for this case | No |
| **MATCH_ASSIGNED** | Professional assigned to case | No |
| **ASSIGNMENT_STARTED** | Professional began work on case | No |
| **CASE_COMPLEXITY_ASSESSED** | Case complexity level determined | No |
| **HANDOVER_INITIATED** | Professional change initiated | No |
| **HANDOVER_COMPLETED** | New professional took over case | No |
| **CASE_COMPLETED** | Support finished; case ready for closure | No |
| **CASE_ARCHIVED** | Case archived for retention | Yes (encrypted data preserved) |
| **GRANT_OVERAGE_FLAGGED** | Hours registered exceed grant amount | No |

### Events Consumed
| Event | From | Action | Sensitive? |
|-------|------|--------|-----------|
| **PROFESSIONAL_APPROVED** | Professional Domain | Professional now available for assignment | No |
| **SESSION_LOG_CREATED** | Delivery Domain | Update case progress; may auto-transition status | No |
| **HOURS_REGISTERED** | Delivery Domain | Check remaining grant hours | No |
| **HOURS_APPROVED** | Governance Domain | Update case grant tracking | No |
| **DOCUMENT_VERIFIED** | Professional Domain | Assigned professional credential verified | No |

### Boundary Rules

**Rule 1:** Case Domain records assignments; Matching Domain recommends.
- ✅ Correct: Matching recommends → Case records via CaseAssignment → Governance logs
- ❌ Wrong: Matching Domain directly creates CaseAssignment record

**Rule 2:** Case Domain owns case status; no other domain changes it.
- ✅ Correct: Case Domain manages OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED
- ❌ Wrong: Delivery Domain auto-transitions case to COMPLETED when hours reached

**Rule 3:** Case Domain calculates complexity; no other domain overrides.
- ✅ Correct: Case complexity calculated from CaseComplexityFactors
- ❌ Wrong: Matching Domain adjusts complexity based on professional skills

**Rule 4:** Case Domain does not store professional attributes.
- ✅ Correct: Case references professional_id via CaseAssignment; details in Professional Domain
- ❌ Wrong: Case stores professional.name, professional.skills (caches data)

**Rule 5:** Case Domain tracks grant remaining; Delivery and Governance input data.
- ✅ Correct: Delivery registers hours → Governance approves → Case calculates remaining
- ❌ Wrong: Case Domain directly approves hours (Governance does that)

### Common Mistakes to Avoid

**Mistake 1: Storing Professional Data in Case**
- ❌ Wrong: cases.professional_name, cases.professional_skills
- ✅ Correct: CaseAssignment.professional_id → fetch from Professional Domain

**Mistake 2: Auto-Transitioning Case Status**
- ❌ Wrong: Case auto-transitions to COMPLETED when RegisteredHours reaches grant amount
- ✅ Correct: Case stays ACTIVE until Case Coordinator explicitly closes it

**Mistake 3: Storing Derived Remaining Hours**
- ❌ Wrong: Store cases.remaining_hours and update after each hour approval
- ✅ Correct: Calculate remaining_hours = case.grant.total_hours - sum(approved hours) at query time

**Mistake 4: Hard-Delete Case Records**
- ❌ Wrong: Remove case from database
- ✅ Correct: Set case.status = ARCHIVED and case.archived_at = now()

**Mistake 5: Storing Sagsbehandler Contact in Case**
- ❌ Wrong: cases.sagsbehandler_email, cases.sagsbehandler_phone
- ✅ Correct: Reference municipality → fetch sagsbehandler from Municipality Domain

---

## DOMAIN 4: DELIVERY DOMAIN

### Purpose
Document the actual support work delivered, track hours worked, maintain communication logs, and enable quality assessment of support delivery.

### Responsibilities
1. Create session logs (what happened during support)
2. Track hours registered by professionals
3. Maintain correction log for session changes
4. Track communication between professionals and sagsbehandlere
5. Record progress notes
6. Submit hours for approval to Governance/Case
7. Enable quality assessment based on documentation

### Owns
- **SessionLog** entity (write-once documentation of support session)
- **SessionLogCorrection** entity (corrections to session logs with audit trail)
- **RegisteredHours** entity (hours worked, submitted for approval)
- **ContactLog** entity (communication between professional and sagsbehandler)
- **ProgressNote** entity (case progress tracking)
- Session date, duration, activities
- Contact history with sagsbehandler
- Quality indicators from sessions

### Does NOT Own
- ❌ Whether hours are approved (owned by Governance Domain)
- ❌ Whether session is valid (owned by Case Domain - case status determines if sessions allowed)
- ❌ Case status (owned by Case Domain)
- ❌ Professional capacity (owned by Professional Domain)
- ❌ Grant allocation (owned by Case Domain)
- ❌ Approval decisions (owned by Governance Domain)
- ❌ Audit events (owned by Governance Domain)

### Main Entities/Concepts
- **SessionLog** — Write-once documentation
- **SessionLogCorrection** — Explain changes without reproducing sensitive data
- **RegisteredHours** — Hours tracked for payroll/grant
- **ContactLog** — Professional-sagsbehandler communication
- **ProgressNote** — Progress toward case goals

### Human Roles Involved
- **Professional** (support provider) — Writes session logs and registers hours
- **Case Coordinator** (Kurskifte staff) — Verifies sessions and approves hours
- **Admin** (Kurskifte staff) — Administers session/hours data

### Platform Roles Involved
- **Professional** (system role) — Can write to own cases' sessions/hours
- **Admin** (system role) — Full access to Delivery Domain

### Inputs from Other Domains
- **Case Domain:** "Case assigned to professional" → Professional can now document sessions for this case
- **Case Domain:** "Case status changed to ARCHIVED" → No new sessions allowed
- **Governance Domain:** "Sensitive action audit event" → May require special logging
- **Professional Domain:** "Professional marked inactive" → Cannot document new sessions

### Outputs to Other Domains
- **Case Domain:** "Session logged", "Hours registered" → Case may update status/progress
- **Governance Domain:** "Session created", "Hours submitted", "Correction made" → All audited
- **Municipality Domain:** May publish "Status update" to sagsbehandler with session summaries (non-sensitive)

### Events Published
| Event | Meaning | Sensitive? |
|-------|---------|-----------|
| **SESSION_LOG_CREATED** | Professional documented a support session | Yes (contains notes) |
| **SESSION_LOG_CORRECTED** | Professional corrected a previous session log | Yes (explains change) |
| **HOURS_REGISTERED** | Professional registered hours for work | No |
| **CONTACT_LOG_CREATED** | Professional logged communication with sagsbehandler | No |
| **PROGRESS_NOTE_CREATED** | Professional recorded case progress | Yes (may contain sensitive info) |
| **HOURS_SUBMITTED_FOR_APPROVAL** | Hours ready for review | No |

### Events Consumed
| Event | From | Action | Sensitive? |
|-------|------|--------|-----------|
| **CASE_ASSIGNED** | Case Domain | Professional can now create sessions for this case | No |
| **CASE_ARCHIVED** | Case Domain | No new sessions allowed; finalize any pending hours | No |
| **HOURS_APPROVED** | Governance Domain | Hour approval recorded; professional notified | No |
| **HOURS_REJECTED** | Governance Domain | Hour rejection recorded; professional must revise | No |

### Boundary Rules

**Rule 1:** Delivery Domain records hours; only Governance Domain approves them.
- ✅ Correct: Professional submits hours → Governance approves → Case records impact
- ❌ Wrong: Delivery Domain automatically approves hours based on submitted amount

**Rule 2:** Delivery Domain cannot approve its own sessions.
- ✅ Correct: Professional writes session → Case Coordinator verifies
- ❌ Wrong: Professional writes session and marks as "verified"

**Rule 3:** Delivery Domain may not write sessions for unauthorized cases.
- ✅ Correct: Professional can only write sessions for assigned cases
- ❌ Wrong: Professional writes sessions for arbitrary cases

**Rule 4:** SessionLog is write-once; corrections are separate records.
- ✅ Correct: Typo in session → Create SessionLogCorrection with explanation
- ❌ Wrong: Update session.notes directly to fix typo

**Rule 5:** Delivery Domain may not store professional's approved hours total.
- ✅ Correct: Calculate approved_hours from RegisteredHours where status = APPROVED
- ❌ Wrong: Store professional.approved_hours_this_week and update after approvals

### Common Mistakes to Avoid

**Mistake 1: Auto-Approving Hours**
- ❌ Wrong: Delivery Domain auto-approves hours after X days
- ✅ Correct: Governance Domain explicitly approves hours after review

**Mistake 2: Hard-Deleting Sessions**
- ❌ Wrong: Remove session from database because it's wrong
- ✅ Correct: Create SessionLogCorrection with explanation; keep original

**Mistake 3: Storing Sagsbehandler Response in Session**
- ❌ Wrong: session.sagsbehandler_feedback = "Looks good, thanks"
- ✅ Correct: ContactLog.message = "Sagsbehandler confirmed receipt"

**Mistake 4: Writing Sessions for Non-Assigned Cases**
- ❌ Wrong: Professional writes session for case they're not assigned to
- ✅ Correct: Verify professional assigned via CaseAssignment; reject if not

**Mistake 5: Storing Remaining Budget in Delivery**
- ❌ Wrong: Create session and auto-calculate remaining_grant_hours
- ✅ Correct: Case Domain calculates remaining hours from Delivery's RegisteredHours

---

## DOMAIN 5: GOVERNANCE DOMAIN

### Purpose
Ensure compliance, maintain immutable audit trails, enforce GDPR obligations, manage access permissions, and monitor all domain interactions for integrity and legal compliance.

### Responsibilities
1. Log all significant actions and decisions (audit events)
2. Ensure no domain bypasses audit trail
3. Implement GDPR compliance (data minimization, retention, right-to-be-forgotten)
4. Manage access permissions for all users
5. Monitor data flows between domains
6. Enforce data retention policies
7. Generate compliance reports
8. Respond to data subject access requests

### Owns
- **AuditEvents** entity (immutable log of all significant actions)
- **Permission** entity (who can do what, scoped by role and domain)
- **DataRetention** policy (how long data is kept, when deleted)
- **GDPRWorkflow** entity (right-to-be-forgotten requests and progress)
- **ComplianceReport** entity (audit summaries for legal/internal review)
- All encrypted fields and encryption strategy
- Audit metadata contracts (what data must be logged for each event type)
- Data subject access request handling

### Does NOT Own
- ❌ Business decisions (all domains make their own)
- ❌ Domain data (each domain owns its own)
- ❌ Matching recommendations (owned by Matching Domain)
- ❌ Hour approvals (actually Case Domain approves with Governance oversight; see below)
- ❌ Professional capacity (owned by Professional Domain)
- ❌ Case status (owned by Case Domain)

### Main Entities/Concepts
- **AuditEvent** — Immutable record of action
- **Permission** — RBAC rule
- **DataRetention** — Retention and deletion rules
- **GDPRWorkflow** — Right-to-be-forgotten progress
- **ComplianceReport** — Audit summary
- Encrypted field keys and strategy

### Human Roles Involved
- **Compliance Officer** (Kurskifte staff) — Manages GDPR, audits, compliance
- **System Administrator** — Manages permissions
- **Legal Team** — Reviews compliance reports, handles DSAM requests
- **Any role** — Is audited; must comply with permissions

### Platform Roles Involved
- **Admin** (Kurskifte staff) — Full access; all actions logged
- **Professional** — Limited access; only own cases; all actions logged

### Inputs from Other Domains
- **All Domains:** All significant events → Governance logs as AuditEvent
- **All Domains:** Sensitive data updates → Governance enforces encryption
- **Professional Domain:** Document expiry → Governance flags for retention review
- **Case Domain:** Case archived → Governance schedules deletion per retention policy

### Outputs to Other Domains
- **All Domains:** "You don't have permission for that action" (rejection)
- **All Domains:** "Audit event logged; action recorded"
- **Municipality Domain:** "GDPR request received" → May require communication to sagsbehandler
- **Case Domain:** "Sensitive data retention schedule" → Marks cases for deletion after retention period

### Events Published
| Event | Meaning | Sensitive? |
|-------|---------|-----------|
| **AUDIT_EVENT_LOGGED** | Significant action recorded | Yes (contains sensitive data) |
| **PERMISSION_GRANTED** | User granted access | No |
| **PERMISSION_REVOKED** | User access removed | No |
| **GDPR_REQUEST_RECEIVED** | Data subject access or deletion request | Yes (may contain personal info) |
| **RETENTION_POLICY_EXECUTED** | Data deleted per retention policy | Yes (sensitive data deleted) |
| **COMPLIANCE_REPORT_GENERATED** | Audit summary created | Yes (contains event summaries) |
| **ENCRYPTION_KEY_ROTATED** | Encryption keys updated | No |

### Events Consumed
| Event | From | Action | Sensitive? |
|-------|------|--------|-----------|
| **SIGNIFICANT_ACTION** | Any Domain | Log as AuditEvent with metadata contract | Yes |
| **SENSITIVE_DATA_CREATED** | Any Domain | Encrypt sensitive field; log encryption | Yes |
| **SENSITIVE_DATA_UPDATED** | Any Domain | Verify encryption; log change without reproducing data | Yes |
| **CASE_ARCHIVED** | Case Domain | Schedule case for deletion per retention policy | Yes |
| **PROFESSIONAL_OFFBOARDED** | Professional Domain | Schedule professional data for deletion | Yes |

### Boundary Rules

**Rule 1:** Governance Domain observes but does not make business decisions.
- ✅ Correct: Delivery Domain wants to approve hours → Governance logs it; Case Domain actually approves
- ❌ Wrong: Governance Domain rejects an hour submission (that's Case Domain's job)

**Rule 2:** No domain may bypass audit events for sensitive actions.
- ✅ Correct: All professional assignments logged → AuditEvent created
- ❌ Wrong: Case Domain auto-assigns professional without creating AuditEvent

**Rule 3:** Governance Domain owns permissions; other domains respect them.
- ✅ Correct: Professional tries to access case → Permission check → denied/allowed
- ❌ Wrong: Case Domain allows professional to write any session despite permission rules

**Rule 4:** All sensitive data must be encrypted per Governance policy.
- ✅ Correct: Session.notes contains sensitive info → encrypted by Delivery Domain; Governance defines policy
- ❌ Wrong: Case.notes stored unencrypted

**Rule 5:** Governance Domain enforces retention policies; other domains comply.
- ✅ Correct: Case.archived_at set → 7 years later → Governance schedules deletion → Domain deletes
- ❌ Wrong: Case Domain deletes archived case immediately without retention check

### Common Mistakes to Avoid

**Mistake 1: Governance Domain Makes Business Decisions**
- ❌ Wrong: Governance Domain rejects a match recommendation because it disagrees
- ✅ Correct: Governance logs the match recommendation; Case Domain approves or rejects

**Mistake 2: Storing Audit Events Without Metadata Contract**
- ❌ Wrong: AuditEvent.data = JSON dumped raw sensitive data
- ✅ Correct: AuditEvent stores only what's necessary per event-type metadata contract

**Mistake 3: Deleting Audit Events**
- ❌ Wrong: Remove old audit events to clean up database
- ✅ Correct: Audit events immutable; archive or compress but never delete

**Mistake 4: Permission Checks Only at UI**
- ❌ Wrong: Frontend hides button; backend doesn't verify permission
- ✅ Correct: All API endpoints verify permission in backend

**Mistake 5: Storing Plaintext Sensitive Data**
- ❌ Wrong: session.notes stored plaintext in database
- ✅ Correct: session.notes encrypted; key managed per Governance policy

---

## DOMAIN 6: MATCHING DOMAIN

### Purpose
Support the matching of suitable professionals with appropriate support cases through transparent, explainable candidate ranking while maintaining that humans always make the final decision.

### Responsibilities
1. Execute match runs when Case Domain requests
2. Score candidates based on criteria (qualifications, capacity, availability, past experience)
3. Rank candidates with explanations for each score
4. Provide match recommendations to Case Domain
5. Preserve algorithm explainability through versioning
6. Track match alternatives (why professional X was chosen over Y)
7. Support A/B testing of matching algorithms (Phase 2+)

### Owns
- **MatchRun** entity (an instance of matching for a specific case)
- **MatchCandidate** entity (professional scored for this case)
- **MatchScore** entity (individual scoring factors)
- **MatchExplanation** (why professional scored as they did)
- **Algorithm** definition and versioning
- Scoring criteria and weights
- Candidate ranking logic

### Does NOT Own
- ❌ Professional data (owned by Professional Domain)
- ❌ Case data (owned by Case Domain)
- ❌ Final decision to assign (owned by Case Domain with human approval)
- ❌ Assignment recording (owned by Case Domain)
- ❌ Professional capacity or availability (owned by Professional Domain)
- ❌ Audit events (owned by Governance Domain)
- ❌ Matching execution (Case Domain decides when to trigger matching)

### Main Entities/Concepts
- **MatchRun** — An instance of matching for a case
- **MatchCandidate** — A professional scored for this case
- **MatchScore** — Component scores (qualifications: 0.8, availability: 0.9, etc.)
- **MatchExplanation** — Text explaining each score
- **MatchRanking** — Ordered list of candidates
- **MatchAlgorithm** — The scoring algorithm (versioned)

### Human Roles Involved
- **Case Coordinator** (Kurskifte staff) — Triggers matching and makes final decision
- **Data Scientist** / **Product Manager** (Phase 2+) — Develops and improves matching algorithm

### Platform Roles Involved
- **Admin** (Kurskifte staff) — Triggers match runs, reviews recommendations, makes assignments

### Inputs from Other Domains
- **Case Domain:** "Case ready for matching" + case data (complexity, requirements)
- **Professional Domain:** "List of professionals with profiles and current capacity/availability"
- **Delivery Domain:** "Professional past case history and effectiveness ratings" (Phase 2+)
- **Governance Domain:** "Professional credential verification status" (only verified professionals scored)

### Outputs to Other Domains
- **Case Domain:** "Match recommendation with ranked candidates and explanations"
- **Governance Domain:** "MatchRun created", "Recommendation made"

### Events Published
| Event | Meaning | Sensitive? |
|-------|---------|-----------|
| **MATCH_RUN_TRIGGERED** | Matching algorithm started for a case | No |
| **CANDIDATES_SCORED** | Professionals scored and ranked | No |
| **MATCH_RECOMMENDED** | Top candidate recommended for assignment | No |
| **MATCH_ALTERNATIVES_RECORDED** | Why professional X chosen over Y explained | No |

### Events Consumed
| Event | From | Action | Sensitive? |
|-------|------|--------|-----------|
| **CASE_READY_FOR_MATCHING** | Case Domain | Begin matching process | No |
| **PROFESSIONAL_APPROVED** | Professional Domain | Add to candidate pool | No |
| **PROFESSIONAL_CAPACITY_CHANGED** | Professional Domain | Rerun matching if already in progress | No |

### Boundary Rules

**Rule 1:** Matching may recommend; Case Domain decides.
- ✅ Correct: Matching recommends professional A → Case Coordinator reviews → Case Coordinator decides to assign
- ❌ Wrong: Matching Domain auto-assigns professional A without human review

**Rule 2:** Matching may not override professional capacity limits.
- ✅ Correct: Matching excludes professionals at capacity limits from scoring
- ❌ Wrong: Matching recommends overloaded professional despite capacity being exceeded

**Rule 3:** Matching may not access case citizen data (privacy).
- ✅ Correct: Matching accesses case.complexity_level, case.required_skills
- ❌ Wrong: Matching accesses case.citizen_notes (could be sensitive)

**Rule 4:** Matching uses Professional Domain's verified status.
- ✅ Correct: Matching only scores professionals where professional.verified = true and documents current
- ❌ Wrong: Matching scores professionals with expired credentials

**Rule 5:** Matching must preserve explainability of all recommendations.
- ✅ Correct: Each MatchCandidate record explains every scoring factor
- ❌ Wrong: MatchRun.recommendation = "Professional A" with no explanation

### Common Mistakes to Avoid

**Mistake 1: Matching Makes Final Decision**
- ❌ Wrong: MatchRun automatically creates CaseAssignment
- ✅ Correct: Matching recommends; Case Coordinator manually approves and creates CaseAssignment

**Mistake 2: Matching Ignores Professional Capacity**
- ❌ Wrong: Matching recommends overloaded professional who exceeds concurrent case limit
- ✅ Correct: Matching filters out professionals at capacity before scoring

**Mistake 3: Matching Uses Unverified Professionals**
- ❌ Wrong: Matching scores professional with expired credentials
- ✅ Correct: Matching only scores professionals where all credentials current and verified

**Mistake 4: Matching Lacks Explainability**
- ❌ Wrong: ML model recommends professional; no explanation available
- ✅ Correct: Each score has clear factors and explanation (e.g., "Qualifications: 0.9 - similar case types")

**Mistake 5: Matching Has Side Effects**
- ❌ Wrong: Matching run updates professional.assigned_cases or case.status
- ✅ Correct: Matching only reads data and produces recommendations; Case Domain handles side effects

---

## CROSS-DOMAIN RULES

These rules prevent boundary violations and ensure domains coordinate correctly:

### Universal Rules (Apply to All Domains)

**Rule 1: No Derived Values as Source of Truth**
- ✅ Correct: Calculate remaining_hours = grant.total - sum(approved_hours) at query time
- ❌ Wrong: Store case.remaining_hours and update after each approval

**Rule 2: No Sensitive Data Dumps in Audit**
- ✅ Correct: AuditEvent.explanation = "Professional capacity exceeded"
- ❌ Wrong: AuditEvent.details = JSON with session notes, citizen name, sagsbehandler email

**Rule 3: No Domain Bypasses Audit Trail for Sensitive Actions**
- ✅ Correct: Professional assignment → AuditEvent logged
- ❌ Wrong: Case auto-assigns professional without AuditEvent

**Rule 4: No Hard Deletes; Only Archive**
- ✅ Correct: Set entity.archived_at = now(); keep record immutable
- ❌ Wrong: DELETE FROM table WHERE id = X

**Rule 5: Permissions Enforced in Backend**
- ✅ Correct: API endpoint verifies permission before allowing action
- ❌ Wrong: UI hides button but backend allows action anyway

### Domain-Specific Cross-Domain Rules

**Professional ↔ Matching**
- Professional Domain provides verified, available professionals to Matching Domain
- Matching Domain uses only Professional Domain's data for scoring
- Matching may not bypass Professional Domain's capacity/availability restrictions

**Professional ↔ Case**
- Professional Domain tracks capacity; Case Domain records assignments
- Case Domain references professional_id; does not cache professional attributes
- Professional Domain updates availability when Case Domain creates assignment

**Case ↔ Delivery**
- Case Domain determines which professionals can write sessions (via CaseAssignment)
- Delivery Domain submits hours; Case Domain calculates impact on remaining grant
- Delivery Domain may not write sessions for unassigned professionals

**Case ↔ Matching**
- Case Domain requests matching and makes final assignment decision
- Matching Domain provides recommendation based on current Professional Domain data
- Matching may not override Case Domain's decision

**Delivery ↔ Governance**
- Delivery Domain creates sessions/hours; Governance Domain logs and audits
- Governance Domain does NOT approve hours (Case Domain does)
- Delivery Domain may not store derived values like approved_hours_total

**Municipality ↔ Case**
- Municipality Domain provides grant allocation; Case Domain owns CaseGrant record
- Case Domain references Municipality; does not cache municipality attributes
- Municipality Domain does not access case details (no municipality portal in MVP)

**All ↔ Governance**
- All domains publish events to Governance Domain (audit trail)
- Governance Domain enforces permissions but does not make business decisions
- Governance Domain defines encryption and retention policy; all domains comply

---

## DOMAIN EVENT MAP

These events orchestrate cross-domain interactions. Each event has clear ownership and consumption rules.

### Event: PROFESSIONAL_APPROVED
- **Published by:** Professional Domain (admin verifies credentials)
- **Consumed by:** Case Domain, Matching Domain (now available for assignment)
- **Meaning:** Professional verified and ready to be assigned to cases
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - Only verified professionals can be matched
  - Professional's availability automatically becomes "active"
  - Can now score in match runs

### Event: DOCUMENT_VERIFIED
- **Published by:** Professional Domain (admin verifies credential)
- **Consumed by:** Case Domain, Matching Domain, Delivery Domain (audit)
- **Meaning:** Professional credential (CV, background check, certification) verified
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - Professional domain updates ProfessionalDocument.verified_at
  - Matching Domain can now use this credential in scoring
  - Expiry date now monitored

### Event: MUNICIPALITY_CREATED
- **Published by:** Municipality Domain
- **Consumed by:** Case Domain, Matching Domain (context only)
- **Meaning:** New municipality added to Kurskifte partnership
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - Cases can now be created for this municipality
  - Sagsbehandler contact information registered
  - Grant allocation can begin

### Event: CASE_CREATED
- **Published by:** Case Domain
- **Consumed by:** Matching Domain (ready for matching), Governance Domain (audit), Municipality Domain (logged)
- **Meaning:** New support case created for citizen
- **Sensitive Data?** Yes (encrypted notes preserved in event)
- **Audit:** Yes
- **Business Rules:**
  - Citizen minimal data stored (initials, age range only)
  - Case initially status = OPEN
  - Complexity assessed from structured factors
  - Grant allocated from municipality

### Event: CASE_READY_FOR_MATCHING
- **Published by:** Case Domain (when complexity assessed, citizen data complete)
- **Consumed by:** Matching Domain (begin matching process)
- **Meaning:** Case is ready to be matched with a professional
- **Sensitive Data?** No (only case requirements, not citizen details)
- **Audit:** Yes
- **Business Rules:**
  - Case status may change to MATCHED after human decision
  - Matching can now score professionals

### Event: MATCH_RUN_TRIGGERED
- **Published by:** Case Domain (admin initiates matching)
- **Consumed by:** Matching Domain (execute algorithm), Governance Domain (audit)
- **Meaning:** Admin requested matching for a case
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - Matching scores available professionals
  - Results returned to Case Coordinator for review
  - Matching does NOT auto-assign

### Event: MATCH_ASSIGNED
- **Published by:** Case Domain (Case Coordinator approved match)
- **Consumed by:** Professional Domain (update availability), Delivery Domain (sessions now allowed), Governance Domain (audit)
- **Meaning:** Professional assigned to case (after human approval)
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - CaseAssignment record created in Case Domain
  - Professional availability updated
  - Case status = MATCHED
  - Professional can now create sessions for this case

### Event: ASSIGNMENT_STARTED
- **Published by:** Case Domain (case status = ACTIVE)
- **Consumed by:** Delivery Domain (sessions enabled), Municipality Domain (may notify sagsbehandler)
- **Meaning:** Professional began work on case
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - First session log can now be created
  - Grant hours tracking begins
  - Case is officially active

### Event: SESSION_LOG_CREATED
- **Published by:** Delivery Domain (professional documented support)
- **Consumed by:** Case Domain (update progress), Governance Domain (audit)
- **Meaning:** Support session documented
- **Sensitive Data?** Yes (session notes may contain sensitive info)
- **Audit:** Yes
- **Business Rules:**
  - Write-once record (corrections via SessionLogCorrection)
  - Only assigned professional can create for assigned case
  - Case status remains unchanged

### Event: HOURS_REGISTERED
- **Published by:** Delivery Domain (professional submitted hours)
- **Consumed by:** Case Domain (impacts grant tracking), Governance Domain (audit)
- **Meaning:** Hours recorded for grant and payroll tracking
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - Initially status = PENDING
  - Case Domain checks grant remaining
  - Governance Domain approves

### Event: HOURS_APPROVED
- **Published by:** Case Domain (Case Coordinator approved hours) *with Governance oversight*
- **Consumed by:** Municipality Domain (may notify sagsbehandler of budget), Governance Domain (audit)
- **Meaning:** Hours approved for payroll and grant tracking
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - Status = APPROVED
  - Case recalculates remaining grant
  - Professional paid based on approved hours

### Event: OUTSIDE_GRANT_REVIEWED
- **Published by:** Case Domain (hours exceed grant; Governance reviewed)
- **Consumed by:** Municipality Domain (may notify sagsbehandler), Governance Domain (audit)
- **Meaning:** Hours registered exceed municipal grant; reviewed and approved/rejected
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - Case flagged when approved hours > grant total
  - Explicit approval required (not automatic)
  - Municipality informed of overage

### Event: HANDOVER_INITIATED
- **Published by:** Case Domain (Case Coordinator initiated professional change)
- **Consumed by:** Professional Domain (old professional: remove assignment; new professional: prepare), Delivery Domain (prepare for new professional), Municipality Domain (notify sagsbehandler)
- **Meaning:** Professional changing on case
- **Sensitive Data?** No
- **Audit:** Yes
- **Business Rules:**
  - CaseHandover record created
  - Old professional's sessions remain but new sessions by them rejected
  - New professional can read old sessions (if they choose)
  - Case status may briefly be HANDOVER

### Event: CASE_ARCHIVED
- **Published by:** Case Domain (case completed; moved to ARCHIVED status)
- **Consumed by:** Governance Domain (schedule for retention), Municipality Domain (notify sagsbehandler)
- **Meaning:** Support case concluded and archived
- **Sensitive Data?** Yes (case may contain sensitive notes; preserved encrypted)
- **Audit:** Yes
- **Business Rules:**
  - No new sessions/hours allowed
  - Professional unassigned
  - Data retained per GDPR retention policy
  - Eligible for deletion after 7 years

---

## BOUNDARY CONFLICT EXAMPLES

These are common mistakes and their corrected versions. Use these examples to avoid pitfalls during Technical Specification and implementation.

### Conflict 1: Professional Domain Controls Case Assignment

**❌ WRONG:**
```
Professional Domain Creates Assignment:
1. Professional logs into platform
2. Professional sees available cases
3. Professional clicks "Accept this case"
4. Professional Domain creates entry in professional_cases table
5. Case status auto-updates to MATCHED
```

**✅ CORRECT:**
```
Case Domain Controls Assignment:
1. Case Coordinator reviews case and available professionals
2. Matching Domain recommends top candidates
3. Case Coordinator manually selects professional
4. Case Domain creates CaseAssignment record
5. Professional Domain updates professional.availability
6. Governance Domain logs assignment decision
7. Case status updates to MATCHED
```

**Why:** Professional Domain owns professional data, not case-professional relationships. Assignments are business decisions requiring human oversight (Matching Domain recommends; Case Domain decides).

---

### Conflict 2: Delivery Domain Approves Its Own Hours

**❌ WRONG:**
```
Delivery Approves Hours:
1. Professional registers 10 hours for week
2. Delivery Domain checks: "Are these hours reasonable?"
3. Delivery Domain sets status = APPROVED
4. Case Domain calculates remaining grant
5. Professional paid
```

**✅ CORRECT:**
```
Case Domain Approves Hours (with Governance oversight):
1. Professional registers 10 hours
2. Delivery Domain stores status = PENDING
3. Case Coordinator reviews registered hours
4. Case Coordinator checks: "Are these within grant?"
5. If yes: Case Domain sets status = APPROVED
6. If no: Governance Domain reviews outside_grant scenario
7. Case Coordinator makes final decision
8. Governance Domain audits the decision
```

**Why:** Delivery Domain records facts (what happened); Case Domain interprets business rules (is this appropriate?); Governance Domain audits. No domain approves its own data.

---

### Conflict 3: Matching Auto-Assigns Professional

**❌ WRONG:**
```
Matching Auto-Assigns:
1. Case ready for matching
2. Matching scores professionals
3. Top professional has highest score 0.95
4. Matching Domain creates CaseAssignment
5. Professional automatically assigned
```

**✅ CORRECT:**
```
Matching Recommends; Case Decides:
1. Case ready for matching
2. Case Coordinator triggers MatchRun
3. Matching Domain scores professionals
4. Matching returns: {professional_a: 0.95, professional_b: 0.92, professional_c: 0.88}
5. With explanations for each score
6. Case Coordinator reviews and decides
7. Case Coordinator assigns professional_a
8. Case Domain creates CaseAssignment
9. Governance Domain logs the decision
```

**Why:** Matching is decision support, not decision maker. Humans always approve. Matching explains why; Case Coordinator decides.

---

### Conflict 4: Case Domain Stores Professional Attributes

**❌ WRONG:**
```
Case Domain Duplicates Professional Data:
cases table:
  - id
  - professional_id
  - professional_name (cache)
  - professional_qualifications (cache)
  - professional_phone (cache)
  - professional_verified_at (cache)
```

**✅ CORRECT:**
```
Case Domain References Professional Domain:
cases table:
  - id

case_assignments table:
  - id
  - case_id
  - professional_id → references professional table
  - assigned_at
  - ended_at

Query: Get professional assigned to case:
SELECT p.* FROM professionals p
  JOIN case_assignments ca ON p.id = ca.professional_id
  WHERE ca.case_id = ? AND ca.ended_at IS NULL
```

**Why:** Single source of truth. Professional attributes live in Professional Domain. Case Domain references, doesn't cache.

---

### Conflict 5: Professional Domain Stores Case Assignment Status

**❌ WRONG:**
```
Professional Domain Duplicates Assignment Data:
professionals table:
  - id
  - name
  - assigned_cases: ["case_123", "case_456"]
  - current_case_id: "case_123"
  - last_assignment_date
```

**✅ CORRECT:**
```
Case Domain Owns Assignment; Professional Domain Tracks Availability:
professionals table:
  - id
  - name
  - availability_status: "active" | "leave" | "unavailable"
  - capacity_hours_per_week: 10
  - max_concurrent_cases: 3

case_assignments table:
  - professional_id (FK to professionals)
  - case_id (FK to cases)
  - assigned_at
  - ended_at
```

**Why:** Case Domain tracks which professional is assigned to which case (via CaseAssignment). Professional Domain tracks only whether professional is available and has capacity.

---

### Conflict 6: Municipality Domain Stores Case Data

**❌ WRONG:**
```
Municipality Domain Replicates Cases:
municipalities table:
  - id
  - name
  - cases: [{id: 1, citizen_name: "...", status: "active", ...}]
  - grants: [{case_id: 1, budget: 100}]
```

**✅ CORRECT:**
```
Municipality Domain Owns Reference Data; Case Domain Owns Cases:
municipalities table:
  - id
  - name

sagsbehandler table:
  - id
  - municipality_id (FK)
  - name
  - email
  - phone

cases table:
  - id
  - municipality_id (FK)
  - citizen_initials (encrypted)
  - citizen_age_range
  - status

case_grants table:
  - case_id (FK)
  - municipality_id (FK)
  - budget_hours
```

**Why:** Municipality Domain owns municipality and sagsbehandler reference data only. Case Domain owns cases. Grant is the connection.

---

### Conflict 7: Governance Domain Makes Business Decisions

**❌ WRONG:**
```
Governance Makes Match Decision:
1. Match recommended: professional_a (score 0.95)
2. Governance Domain reviews qualifications
3. Governance rejects match because of missing credential
4. Case cannot proceed
```

**✅ CORRECT:**
```
Governance Observes; Professional Domain Determines Eligibility:
1. Professional Domain: credential missing → professional.verified = false
2. Matching Domain: only scores verified professionals → professional_a not in pool
3. Next best professional: professional_b (score 0.92)
4. Case Coordinator reviews and assigns professional_b
5. Governance Domain logs the decision
```

**Why:** Governance audits compliance, not business decisions. Professional Domain determines eligibility; Governance enforces that only eligible professionals are used.

---

### Conflict 8: Storing Derived Remaining Hours

**❌ WRONG:**
```
Case Domain Stores Remaining Hours:
cases table:
  - id
  - grant_total_hours: 100
  - hours_registered: 45
  - remaining_hours: 55 (derived, stored)

After hours approved:
UPDATE cases SET remaining_hours = 55 - 10 = 45 WHERE id = 1
```

**✅ CORRECT:**
```
Calculate Remaining Hours at Query Time:
cases table:
  - id
  - grant_total_hours: 100

registered_hours table:
  - case_id (FK)
  - hours: 10
  - status: "approved"

Query:
SELECT
  c.grant_total_hours,
  SUM(h.hours) as hours_approved,
  c.grant_total_hours - SUM(h.hours) as remaining_hours
FROM cases c
LEFT JOIN registered_hours h ON c.id = h.case_id AND h.status = 'approved'
WHERE c.id = 1
```

**Why:** Single source of truth. Remaining = total - approved. Store totals; calculate derivatives at query time.

---

### Conflict 9: Municipality Portal in MVP

**❌ WRONG:**
```
Municipality Portal Exists:
1. Sagsbehandler logs into Kurskifte-Match
2. Sagsbehandler views their cases
3. Sagsbehandler sees session notes, hours, progress
4. Sagsbehandler requests professional change
5. Sagsbehandler approves hours
```

**✅ CORRECT:**
```
Municipality No Platform Access (MVP):
1. Sagsbehandler calls or emails Kurskifte staff
2. Kurskifte staff checks platform for case status
3. Kurskifte staff tells sagsbehandler: "Sessions on track, hours tracking fine"
4. If sagsbehandler requests professional change, Kurskifte staff processes it
5. Municipality only receives: status updates via email/phone

Future Phase 2: Municipality Read-Only Portal
- Sagsbehandler logs in
- Sees own cases (read-only)
- Sees session summaries (non-sensitive)
- Sees hour tracking and grant remaining
- Still cannot edit or approve anything
```

**Why:** MVP focus is on internal operations. Municipality portal adds complexity and security risk. Phase 2 can add read-only portal once core system stable.

---

### Conflict 10: Professional Writes Sessions for Any Case

**❌ WRONG:**
```
Professional Can Access Any Case:
1. Professional logs into Kurskifte-Match
2. Professional sees all cases
3. Professional writes session for case they're not assigned to
4. Session stored as valid
```

**✅ CORRECT:**
```
Professional Only Accesses Assigned Cases:
1. Professional logs in
2. Platform shows only cases where professional has CaseAssignment
3. Professional can write sessions only for assigned cases
4. Backend verifies: is professional assigned to this case?
5. If yes: session accepted
6. If no: session rejected; audit event logged
```

**Why:** Data protection and safety. Professional may only work with their own cases.

---

## RELATIONSHIP TO EXISTING DOCUMENTS

This document builds on and references:

### DOMAIN_VISION.md
- Source: The six-domain model architecture defined in DOMAIN_VISION.md
- Reference: This document provides detailed boundaries for each domain introduced in DOMAIN_VISION.md

### DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md
- Source: Actor definitions and responsibility boundaries
- Reference: Human roles and system roles mapped to domains

### UBIQUITOUS_LANGUAGE.md
- Source: Domain terminology
- Reference: All entities and concepts defined in this document use UBIQUITOUS_LANGUAGE.md terminology

### ADR-009: Domain-Integrated Operations Architecture
- Source: Decision to reorganize around six domains
- Reference: This document operationalizes that decision

### DOMAIN_MODEL_DATABASE_SPEC.md
- Source: 13 core entities and relationships
- Reference: Entities distributed across six domains as described here

### MASTER_DIRECTIVE.md
- Source: MVP scope and approved architecture
- Reference: MVP functions organized into domains; no contradictions

---

## VALIDATION CHECKLIST

Use this checklist during Technical Specification and code review to validate domain boundaries:

### Design Validation

- [ ] Each domain has clear, non-overlapping ownership
- [ ] Inputs and outputs between domains are explicitly listed
- [ ] Events are published and consumed by appropriate domains
- [ ] No domain stores data that "belongs" to another domain
- [ ] No derived values stored (all calculated at query time)
- [ ] No hard deletes (all soft deletes with archived_at)
- [ ] All sensitive data marked and encrypted per Governance Domain
- [ ] All cross-domain actions published as audit events

### Implementation Validation

- [ ] Entity tables organized by domain (schema documentation shows which table belongs to which domain)
- [ ] API endpoints grouped by domain (/api/professional, /api/case, /api/delivery, etc.)
- [ ] Permissions enforced by domain (Professional role can only access professional resources)
- [ ] Events published to audit system for every domain action
- [ ] No business logic spans domain boundaries without event coordination
- [ ] Derived values calculated at query time, not stored
- [ ] No domain bypasses permission system
- [ ] All sensitive operations logged with audit trail

### Testing Validation

- [ ] Test: Professional Domain cannot directly assign cases
- [ ] Test: Delivery Domain cannot approve its own hours
- [ ] Test: Matching cannot auto-assign professionals
- [ ] Test: Case Domain cannot store professional attributes
- [ ] Test: Professional cannot write sessions for unassigned cases
- [ ] Test: All audit events logged for sensitive actions
- [ ] Test: Derived values correct at query time (not stale in storage)
- [ ] Test: Archived records not deleted (soft delete verified)

---

## NEXT STEP

This document is complete and ready for Technical Specification design.

Technical Specification should:
1. Organize by the six domains
2. Reference boundary rules from this document
3. Include permission rules per domain
4. Include event contracts per domain
5. Map database entities to domains
6. Map API endpoints to domains
7. Validate all conflicts examples are addressed

**Status:** READY FOR TECHNICAL SPECIFICATION

---

**Document Version:** 1.0  
**Date:** June 27, 2026  
**Author:** Claude (Architecture Documentation)  
**Approval Status:** PENDING HASSAN REVIEW  
