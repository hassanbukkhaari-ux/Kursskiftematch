# Business Capability Map

**Kurskifte-Match: Capabilities Organized by Domain**

**Date:** June 27, 2026  
**Status:** DRAFT (Supporting Technical Specification)  
**Purpose:** Map all business capabilities that Kurskifte-Match must support, organized by the approved six-domain model  

---

## CAPABILITY DESIGN RULES

Before reading the capabilities, understand these rules:

1. **Capabilities describe business abilities, not UI screens**
   - ✅ Capability: "Create Session Log"
   - ❌ Not: "Show session entry form"

2. **Capabilities are not API endpoints**
   - One capability may require multiple endpoints
   - One endpoint may implement part of one capability

3. **Capabilities are not database tables**
   - One capability may read/write multiple tables
   - One table may support multiple capabilities

4. **Workflows use many capabilities**
   - WF-002 (Case Creation) uses: Create Case, Create Case Grant, Mark Case Ready for Matching
   - Not a 1:1 relationship

5. **Capabilities may appear in many workflows**
   - "Register Hours" appears in: WF-006 (Hours), WF-007 (Outside Grant), WF-012 (Closure)

6. **Exactly one owning domain per capability**
   - Clear ownership prevents confusion
   - Supporting domains may provide input/constraints

7. **Supporting domains provide data or constraints**
   - Professional Domain doesn't own assignment; Case Domain does
   - But Professional Domain provides capacity constraints

8. **Capabilities must respect domain boundaries**
   - ✅ Correct: Case Domain creates assignment; Professional Domain confirms capacity
   - ❌ Wrong: Professional Domain directly assigns to case

9. **Capabilities must not bypass audit**
   - Every sensitive action logged as AuditEvent
   - No silent changes; all decisions recorded

10. **Capabilities must not store derived values as source of truth**
    - ✅ Calculate remaining_hours at query time
    - ❌ Don't store and update after each approval

---

## DOMAIN 1: PROFESSIONAL DOMAIN CAPABILITIES

The Professional Domain manages the complete professional lifecycle from recruitment through offboarding.

### Capability 1.1: Recruit Professional

**Purpose:** Initiate recruitment process for new professionals

**Owning Domain:** Professional Domain  
**Supporting Domains:** Governance Domain (audit)  
**Primary Human Role:** Recruiter (Kurskifte staff)  
**Platform Role Required:** Admin  

**Inputs:**
- Job posting
- Recruitment channel
- Target profile criteria

**Outputs:**
- Professional application record created
- Application status: RECEIVED
- Recruiter notified of new application

**Events Emitted:**
- RECRUITMENT_STARTED
- RECRUITER_NOTIFIED

**Events Consumed:**
- None (starting point)

**Related Workflows:**
- WF-001 Professional Onboarding

**MVP Status:** MVP

**Business Rules:**
- Each recruitment campaign tracked separately
- Source of candidate recorded (LinkedIn, referral, job board, etc.)
- Recruiter assigned to manage application pipeline
- Target profile criteria recorded for future matching insights

**What This Capability Must NOT Do:**
- ❌ Create Professional profile (happens after approval)
- ❌ Grant platform access before verification
- ❌ Assign to cases during recruitment
- ❌ Approve credentials before verification
- ❌ Automatically transition to next stage

---

### Capability 1.2: Receive Professional Application

**Purpose:** Record application from candidate with resume, qualifications, references

**Owning Domain:** Professional Domain  
**Supporting Domains:** Governance Domain (audit)  
**Primary Human Role:** Professional (applicant)  
**Platform Role Required:** None (external form initially; Admin to record)  

**Inputs:**
- Application form submission
- Resume/CV document
- References
- Availability information
- Previous experience

**Outputs:**
- Application stored in system
- Application status: SUBMITTED
- Recruiter/Hiring Manager notified

**Events Emitted:**
- APPLICATION_RECEIVED
- APPLICATION_DOCUMENTS_ATTACHED

**Events Consumed:**
- RECRUITMENT_STARTED (context)

**Related Workflows:**
- WF-001 Professional Onboarding

**MVP Status:** MVP (via external form initially; self-service portal Phase 2+)

**Business Rules:**
- Application unique per recruitment campaign
- All documents stored with upload timestamp
- Application completeness tracked (CV required, references optional)
- Auto-reminder if application incomplete after 3 days

**What This Capability Must NOT Do:**
- ❌ Verify credentials (happens in separate capability)
- ❌ Make hiring decision
- ❌ Create professional profile
- ❌ Grant platform access
- ❌ Assess qualifications (that's verification)

---

### Capability 1.3: Create Professional Profile

**Purpose:** Create professional profile record after hiring decision approved

**Owning Domain:** Professional Domain  
**Supporting Domains:** Governance Domain (audit, permissions)  
**Primary Human Role:** Case Coordinator (Admin, hiring authority)  
**Platform Role Required:** Admin  

**Inputs:**
- Approved application
- Professional personal information
- Emergency contact
- Banking information (for payroll)
- Preferred working hours/preferences

**Outputs:**
- Professional profile created
- Professional profile status: PENDING_VERIFICATION
- Professional assigned system role (Professional)
- Professional invited to platform

**Events Emitted:**
- PROFESSIONAL_CREATED
- PROFESSIONAL_INVITED_TO_PLATFORM

**Events Consumed:**
- APPLICATION_RECEIVED

**Related Workflows:**
- WF-001 Professional Onboarding

**MVP Status:** MVP

**Business Rules:**
- Professional email assigned (unique in system)
- Temporary password generated for first login
- Professional account created in Auth system
- Profile marked as PENDING_VERIFICATION (cannot be assigned until verified)
- Professional availability defaults to INACTIVE (must be explicitly activated)

**What This Capability Must NOT Do:**
- ❌ Approve professional for assignment (happens after verification)
- ❌ Verify credentials (separate capability)
- ❌ Assign to cases immediately
- ❌ Activate availability (separate capability)
- ❌ Delete previous application records

---

### Capability 1.4: Upload Professional Documents

**Purpose:** Professional uploads credentials, certifications, background checks, CVs for verification

**Owning Domain:** Professional Domain  
**Supporting Domains:** Governance Domain (encryption, audit)  
**Primary Human Role:** Professional  
**Platform Role Required:** Professional (can upload own documents)  

**Inputs:**
- Document file (PDF, image, etc.)
- Document type (CV, Background Check, Certification, etc.)
- Expiry date (if applicable)
- Issuing organization

**Outputs:**
- Document stored securely
- Document status: PENDING_VERIFICATION
- Governance Domain notified for verification queue

**Events Emitted:**
- DOCUMENT_UPLOADED
- VERIFICATION_QUEUED

**Events Consumed:**
- PROFESSIONAL_CREATED (context; professional now can upload)

**Related Workflows:**
- WF-011 Document Upload and Verification

**MVP Status:** MVP

**Business Rules:**
- Maximum file size: 10MB per document
- Allowed formats: PDF, PNG, JPG, JPEG
- Each document upload creates new record (no overwrite; audit trail preserved)
- Expiry date mandatory for time-limited credentials (certs, background checks)
- Document tagged with upload date for audit trail

**What This Capability Must NOT Do:**
- ❌ Verify documents (separate capability)
- ❌ Activate professional (happens after verification)
- ❌ Delete documents (soft delete only after verification)
- ❌ Approve professional based on upload alone
- ❌ Auto-check document validity

---

### Capability 1.5: Verify Professional Documents

**Purpose:** Admin reviews uploaded documents and marks as verified or requests revisions

**Owning Domain:** Professional Domain  
**Supporting Domains:** Governance Domain (audit, compliance)  
**Primary Human Role:** Compliance Officer (Kurskifte staff)  
**Platform Role Required:** Admin  

**Inputs:**
- Uploaded document
- Verification checklist (specific to document type)
- Standards/requirements for verification

**Outputs:**
- Document marked as VERIFIED or REJECTED
- Verification date recorded
- Expiry date tracked (alerts before expiry)
- Professional notified of result

**Events Emitted:**
- DOCUMENT_VERIFIED
- DOCUMENT_REJECTED
- DOCUMENT_EXPIRY_WARNING (scheduled event)

**Events Consumed:**
- DOCUMENT_UPLOADED

**Related Workflows:**
- WF-011 Document Upload and Verification

**MVP Status:** MVP

**Business Rules:**
- Verification status tracked: PENDING → VERIFIED or REJECTED
- Rejection reason recorded (so professional knows what to fix)
- Verified documents expire: auto-alert 30 days before expiry
- Expired credentials automatically flag professional as NEEDS_RENEWAL
- All verifications audited with verifier name and timestamp

**What This Capability Must NOT Do:**
- ❌ Force professional to re-upload (just flag and notify)
- ❌ Auto-approve professional (approval is separate capability)
- ❌ Delete rejected documents (keep for audit trail)
- ❌ Skip professional notification
- ❌ Modify document content

---

### Capability 1.6: Approve Professional

**Purpose:** Formal approval that professional is verified and ready for assignment

**Owning Domain:** Professional Domain  
**Supporting Domains:** Governance Domain (audit); Matching Domain (now eligible)  
**Primary Human Role:** Case Coordinator or Hiring Manager  
**Platform Role Required:** Admin  

**Inputs:**
- Professional with all documents verified
- Final approval decision
- Approval authorization/signature

**Outputs:**
- Professional marked as APPROVED
- Professional status changes to "Ready for Assignment"
- Governance Domain notified
- Matching Domain can now include in candidate pool
- Professional receives confirmation notification

**Events Emitted:**
- PROFESSIONAL_APPROVED
- PROFESSIONAL_ELIGIBLE_FOR_MATCHING

**Events Consumed:**
- DOCUMENT_VERIFIED (all required documents must be verified first)

**Related Workflows:**
- WF-001 Professional Onboarding

**MVP Status:** MVP

**Business Rules:**
- Requires all required documents to be VERIFIED
- Approval recorded with date and approver identity
- Professional can now be selected for matching
- Professional availability defaults to ACTIVE (ready for assignment)
- Approval irreversible (can only suspend or archive later)

**What This Capability Must NOT Do:**
- ❌ Approve if documents not verified
- ❌ Auto-assign to cases immediately
- ❌ Override document requirements
- ❌ Change professional data
- ❌ Skip audit trail

---

### Capability 1.7: Update Professional Availability

**Purpose:** Professional or Admin updates professional's availability status (active, on-leave, unavailable)

**Owning Domain:** Professional Domain  
**Supporting Domains:** Case Domain (may affect active cases), Matching Domain (affects eligibility)  
**Primary Human Role:** Professional or Case Coordinator  
**Platform Role Required:** Professional (own availability) or Admin (any professional)  

**Inputs:**
- Availability status: ACTIVE | ON_LEAVE | UNAVAILABLE | INACTIVE
- Reason for change (optional)
- Expected return date (if on leave)

**Outputs:**
- Professional availability updated
- Case Domain notified (if affects active cases)
- Matching Domain updated (availability affects scoring)
- Professional and Case Coordinator notified

**Events Emitted:**
- AVAILABILITY_CHANGED
- LEAVE_STARTED / LEAVE_ENDED
- PROFESSIONAL_INACTIVE / PROFESSIONAL_REACTIVATED

**Events Consumed:**
- PROFESSIONAL_APPROVED (context)
- ASSIGNMENT_STARTED (context; may affect availability during case)
- CASE_ARCHIVED (context; may restore availability)

**Related Workflows:**
- WF-001 Professional Onboarding (activation after approval)
- WF-008 Professional Handover (availability changes during handover)

**MVP Status:** MVP

**Business Rules:**
- ACTIVE professionals available for new assignments
- ON_LEAVE professionals not available for new assignments; existing cases continue
- UNAVAILABLE professionals not available; may need handover of active cases
- INACTIVE professionals not available; complete handover required
- Availability changes logged with timestamp and reason
- Return date tracked for ON_LEAVE status

**What This Capability Must NOT Do:**
- ❌ Auto-unassign from cases (requires handover)
- ❌ Change professional capacity (separate capability)
- ❌ Suspend professional (separate suspension capability)
- ❌ Delete professional (archive only)
- ❌ Override ongoing case assignments

---

### Capability 1.8: Update Professional Capacity

**Purpose:** Admin updates professional's capacity limits (hours/week, concurrent cases, complexity ceiling)

**Owning Domain:** Professional Domain  
**Supporting Domains:** Matching Domain (affects scoring), Case Domain (affects assignment eligibility)  
**Primary Human Role:** Case Coordinator or Operations Manager  
**Platform Role Required:** Admin  

**Inputs:**
- New hours per week limit
- New max concurrent cases limit
- New max complexity level (LOW, MEDIUM, HIGH, CRITICAL)
- Reason for change

**Outputs:**
- Capacity limits updated
- Change logged with effective date
- Matching Domain updated
- Case Domain notified (may affect active cases)

**Events Emitted:**
- CAPACITY_UPDATED
- CAPACITY_LIMIT_EXCEEDED (if new limits violate current assignments)

**Events Consumed:**
- PROFESSIONAL_APPROVED (context)
- HOURS_REGISTERED (capacity monitoring)

**Related Workflows:**
- WF-006 Registered Hours (monitors capacity vs. actual hours)
- WF-003 Match Run and Assignment (capacity affects matching)

**MVP Status:** MVP

**Business Rules:**
- Capacity changes effective immediately
- If new limits violated by active assignments, flag for Case Coordinator review
- Capacity tracked: hours/week, concurrent cases, max complexity
- Capacity adjustments history preserved
- Matching uses current capacity for scoring

**What This Capability Must NOT Do:**
- ❌ Auto-unassign cases if capacity exceeded (manual review required)
- ❌ Suspend professional (separate capability)
- ❌ Change availability (separate capability)
- ❌ Delete capacity history
- ❌ Allow negative or zero capacity values

---

### Capability 1.9: Suspend Professional

**Purpose:** Temporarily suspend professional from platform (e.g., pending investigation, performance issues)

**Owning Domain:** Professional Domain  
**Supporting Domains:** Case Domain (affects active cases), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator or Operations Manager  
**Platform Role Required:** Admin  

**Inputs:**
- Reason for suspension
- Duration (temporary vs. pending review)
- Expected resolution date (if applicable)

**Outputs:**
- Professional marked as SUSPENDED
- Platform access restricted
- Case Coordinator notified (active cases need review)
- Professional notified of suspension and reason

**Events Emitted:**
- PROFESSIONAL_SUSPENDED
- CASE_COORDINATOR_NOTIFIED

**Events Consumed:**
- PROFESSIONAL_APPROVED (context)
- HOURS_REGISTERED / SESSION_LOGGED (may trigger suspension)

**Related Workflows:**
- WF-008 Professional Handover (may be needed if cases active)

**MVP Status:** Phase 2 (MVP handles offboarding; Phase 2 adds suspension)

**Business Rules:**
- Suspension is reversible (unlike archive)
- Active cases flagged for handover planning
- No new assignments possible while suspended
- Existing case sessions cannot be submitted while suspended
- Suspension reason recorded for audit trail
- Suspension date and expected resolution tracked

**What This Capability Must NOT Do:**
- ❌ Auto-unassign from cases (manual review required)
- ❌ Permanently delete professional (suspension is temporary)
- ❌ Delete previous records
- ❌ Hide suspension from audit trail
- ❌ Prevent data access (suspended professional's data still retrievable)

---

### Capability 1.10: Archive Professional

**Purpose:** Permanently archive professional record when professional leaves Kurskifte

**Owning Domain:** Professional Domain  
**Supporting Domains:** Case Domain (all cases must be closed or handed over), Governance Domain (audit, retention)  
**Primary Human Role:** Case Coordinator or Operations Manager  
**Platform Role Required:** Admin  

**Inputs:**
- Professional record (must be SUSPENDED or INACTIVE)
- Reason for archival (resignation, termination, etc.)
- Effective date

**Outputs:**
- Professional marked as ARCHIVED
- Professional.archived_at timestamp set
- Soft delete applied (not hard delete)
- All case handovers must be completed before archival
- Professional's data preserved for audit trail

**Events Emitted:**
- PROFESSIONAL_ARCHIVED
- OFFBOARDING_COMPLETED

**Events Consumed:**
- PROFESSIONAL_SUSPENDED or PROFESSIONAL_INACTIVE (prerequisites)
- CASE_HANDOVER_COMPLETED (all cases must be handed over)

**Related Workflows:**
- WF-001 Professional Onboarding (end of lifecycle)
- WF-008 Professional Handover (handover must be complete)

**MVP Status:** MVP

**Business Rules:**
- All active cases must be handed over before archival
- Archived professional cannot be reactivated
- Archived professional data retained per GDPR (7 years)
- Soft delete: set archived_at, don't hard delete
- Professional's sessions/hours remain accessible for audit trail
- Archive reason recorded

**What This Capability Must NOT Do:**
- ❌ Hard delete professional record
- ❌ Archive if active cases remain
- ❌ Delete previous records
- ❌ Remove from audit trail
- ❌ Lose data (soft delete preserves all)

---

## DOMAIN 2: MUNICIPALITY DOMAIN CAPABILITIES

The Municipality Domain manages relationships and data with municipal partners.

### Capability 2.1: Register Municipality

**Purpose:** Register new municipality as Kurskifte partner

**Owning Domain:** Municipality Domain  
**Supporting Domains:** Governance Domain (audit)  
**Primary Human Role:** Account Manager (Kurskifte staff)  
**Platform Role Required:** Admin  

**Inputs:**
- Municipality name and official identifier
- Municipality contact information
- Main contact person
- Address and phone
- Cooperation agreement terms

**Outputs:**
- Municipality record created
- Municipality status: ACTIVE
- Account Manager assigned
- Cooperation agreement logged

**Events Emitted:**
- MUNICIPALITY_REGISTERED
- COOPERATION_AGREEMENT_RECORDED

**Events Consumed:**
- None (starting point)

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation (context; municipality must exist)

**MVP Status:** MVP

**Business Rules:**
- Each municipality has unique identifier
- Contact information required
- Cooperation agreement recorded with effective date
- Account Manager assigned for relationship management
- Can add multiple sagsbehandler contacts per municipality

**What This Capability Must NOT Do:**
- ❌ Access citizen data
- ❌ Create cases directly
- ❌ Set grant amounts (grants set per case)
- ❌ Delete municipality records (only archive)
- ❌ Assume sagsbehandler contacts

---

### Capability 2.2: Record Sagsbehandler Contact

**Purpose:** Register sagsbehandler (case worker) contact information for municipality

**Owning Domain:** Municipality Domain  
**Supporting Domains:** Governance Domain (audit)  
**Primary Human Role:** Account Manager or Administrative Assistant  
**Platform Role Required:** Admin  

**Inputs:**
- Sagsbehandler name
- Email address
- Phone number
- Department/unit
- Municipality reference
- Preferred contact method
- Response time expectations

**Outputs:**
- Sagsbehandler contact record created
- Sagsbehandler linked to municipality
- Contact information updated in system
- Sagsbehandler notified (optional)

**Events Emitted:**
- SAGSBEHANDLER_REGISTERED
- SAGSBEHANDLER_CONTACT_UPDATED

**Events Consumed:**
- MUNICIPALITY_REGISTERED (context)

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation (uses sagsbehandler info)

**MVP Status:** MVP

**Business Rules:**
- Email and phone both optional (at least one required)
- Multiple sagsbehandler contacts per municipality supported
- Preferred contact method recorded (email, phone, both)
- Response time expectations recorded (e.g., "within 24 hours")
- Contact information can be updated without creating new record
- Sagsbehandler specific to one municipality

**What This Capability Must NOT Do:**
- ❌ Create sagsbehandler platform login (MVP: no municipality portal)
- ❌ Store sensitive personal data beyond contact info
- ❌ Assume sagsbehandler works for other municipalities
- ❌ Delete sagsbehandler records (archive only)
- ❌ Verify contact information automatically

---

### Capability 2.3: Receive Municipality Inquiry

**Purpose:** Log incoming inquiry from municipality for citizen support

**Owning Domain:** Municipality Domain  
**Supporting Domains:** Case Domain (will create case), Governance Domain (audit)  
**Primary Human Role:** Sagsbehandler (from municipality) or Kurskifte staff intake person  
**Platform Role Required:** None initially (external channel); Admin to record  

**Inputs:**
- Municipality identity
- Sagsbehandler contact
- Citizen information (limited: initials, age range, brief need description)
- Preferred support type
- Timeline (urgency)
- Requested availability
- Grant budget for this case

**Outputs:**
- Inquiry record created
- Inquiry status: RECEIVED
- Case Coordinator assigned
- Inquiry acknowledgment sent to sagsbehandler

**Events Emitted:**
- INQUIRY_RECEIVED
- CASE_COORDINATOR_ASSIGNED

**Events Consumed:**
- None (starting point)

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation (next step)

**MVP Status:** MVP (via email/phone intake; self-service portal Phase 2+)

**Business Rules:**
- Inquiry logged with timestamp
- Sagsbehandler contact verified (matches registered contact)
- Citizen data minimal (initials + age range, no CPR/full name)
- Grant budget estimated and logged
- Case Coordinator assigned immediately
- Inquiry acknowledgment sent within 2 hours

**What This Capability Must NOT Do:**
- ❌ Create case immediately (assessment happens next)
- ❌ Assign professional (matching comes later)
- ❌ Store sensitive citizen data
- ❌ Make complexity assessment (separate capability)
- ❌ Commit to timeline without assessment

---

### Capability 2.4: Record Grant Information

**Purpose:** Log municipal grant allocation for a case

**Owning Domain:** Municipality Domain  
**Supporting Domains:** Case Domain (creates CaseGrant record), Governance Domain (audit)  
**Primary Human Role:** Account Manager or Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Municipality identity
- Case identity
- Grant amount (hours or currency)
- Grant period (start date, end date)
- Grant conditions (if any)
- Renewal terms

**Outputs:**
- Grant information recorded
- Case Domain notified (creates CaseGrant)
- Grant tracking initialized
- Municipality and Case Coordinator notified

**Events Emitted:**
- GRANT_ALLOCATED
- GRANT_RECORDED

**Events Consumed:**
- INQUIRY_RECEIVED (context)
- CASE_CREATED (triggered by)

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation
- WF-007 Outside Grant Review (monitors grant vs. hours)

**MVP Status:** MVP

**Business Rules:**
- Grant amount required (hours or currency)
- Grant period defined (start/end dates)
- Grant may be partial (multiple grants per case possible)
- Grant conditions recorded (e.g., "max 5 hours per week")
- Grant changes tracked (audit trail)
- Case Domain owns CaseGrant entity; Municipality provides allocation info

**What This Capability Must NOT Do:**
- ❌ Approve hours (separate capability)
- ❌ Allocate grant without municipal authority
- ❌ Override grant limits
- ❌ Create case directly (Municipality Domain only records grant)
- ❌ Delete grant records (soft delete/archive only)

---

### Capability 2.5: Maintain Municipality Reference Data

**Purpose:** Keep municipality and sagsbehandler contact information current

**Owning Domain:** Municipality Domain  
**Supporting Domains:** Case Domain (uses reference data), Governance Domain (audit)  
**Primary Human Role:** Account Manager or Administrative Assistant  
**Platform Role Required:** Admin  

**Inputs:**
- Municipality updates (address, contact, personnel changes)
- Sagsbehandler updates (new staff, role changes, departures)
- Cooperation agreement updates (terms, renewal)

**Outputs:**
- Reference data updated
- Change history preserved
- Stakeholders notified (if significant)

**Events Emitted:**
- MUNICIPALITY_UPDATED
- SAGSBEHANDLER_UPDATED
- COOPERATION_AGREEMENT_UPDATED

**Events Consumed:**
- Any prior municipality/sagsbehandler events (context)

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation (uses current reference data)

**MVP Status:** MVP

**Business Rules:**
- All updates timestamped
- Change history preserved (audit trail)
- Previous contact info retained for active cases
- New sagsbehandler assignments don't affect prior inquiries
- Bulk updates possible for departmental changes

**What This Capability Must NOT Do:**
- ❌ Hard delete reference data
- ❌ Change active case assignments retroactively
- ❌ Delete contact history
- ❌ Verify information accuracy (just record updates)
- ❌ Assume single contact point per municipality

---

## DOMAIN 3: CASE DOMAIN CAPABILITIES

The Case Domain manages the complete lifecycle of support cases.

### Capability 3.1: Create Case

**Purpose:** Create formal case record for citizen support

**Owning Domain:** Case Domain  
**Supporting Domains:** Municipality Domain (supplies inquiry info), Professional Domain (eligibility), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Inquiry information from Municipality Domain
- Citizen data (initials, age range, brief description)
- Support need summary
- Preferred support type
- Grant information from Municipality Domain

**Outputs:**
- Case created
- Case status: OPEN
- Case ID assigned
- Citizen record created (minimal data)
- CaseGrant created from grant allocation
- Case Coordinator notified
- Municipality notified of case creation

**Events Emitted:**
- CASE_CREATED
- CASE_OPENED

**Events Consumed:**
- INQUIRY_RECEIVED

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation

**MVP Status:** MVP

**Business Rules:**
- Case ID unique and immutable
- Citizen data minimal (initials + age range + age range for privacy)
- Support need recorded (not prescriptive)
- Case status workflow: OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED
- Grant information from Municipality Domain recorded in CaseGrant
- Complexity assessment required before matching (separate capability)
- Case ownership: Case Domain (primary), references Municipality and Professional Domains

**What This Capability Must NOT Do:**
- ❌ Assess case complexity (separate capability)
- ❌ Assign professional (separate capability)
- ❌ Store full citizen name or sensitive info
- ❌ Create case without inquiry context
- ❌ Assume sagsbehandler contact (reference from inquiry)

---

### Capability 3.2: Assess Case Complexity

**Purpose:** Evaluate case complexity using structured factors

**Owning Domain:** Case Domain  
**Supporting Domains:** Professional Domain (capacity constraints), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Case information
- Structured complexity factors (questionnaire-based)
- Supporting notes (optional)
- Citizen history/context (if available)

**Outputs:**
- CaseComplexityFactors record created
- Complexity level calculated: LOW | MEDIUM | HIGH | CRITICAL
- Assessment recorded with timestamp
- Professional Domain consulted for matching implications

**Events Emitted:**
- COMPLEXITY_ASSESSED
- COMPLEXITY_LEVEL_DETERMINED

**Events Consumed:**
- CASE_CREATED

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation (final step before matching)
- WF-003 Match Run and Assignment (uses complexity for scoring)

**MVP Status:** MVP

**Business Rules:**
- Complexity calculated from structured factors (not free-text judgment)
- Factors include: citizen autonomy, crisis history, support need type, network strength
- Complexity deterministic (same factors = same complexity)
- Complexity reassessable if case circumstances change significantly
- Complexity NOT changed to override professional assignments
- Professional capacity ceiling must accommodate case complexity

**What This Capability Must NOT Do:**
- ❌ Use free-text descriptions (use structured factors)
- ❌ Override professional capacity limits
- ❌ Auto-assign based on complexity
- ❌ Prevent LOW complexity cases from matching (all valid)
- ❌ Change complexity based on professional availability

---

### Capability 3.3: Create Case Grant

**Purpose:** Record grant allocation as formal CaseGrant entity

**Owning Domain:** Case Domain  
**Supporting Domains:** Municipality Domain (provides allocation), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Case identity
- Grant amount (from Municipality Domain)
- Grant period (dates)
- Grant conditions
- Budget tracking requirements

**Outputs:**
- CaseGrant record created
- Grant tracking initialized
- Remaining hours calculated
- Grant visibility enabled for tracking

**Events Emitted:**
- CASE_GRANT_CREATED
- GRANT_TRACKING_INITIATED

**Events Consumed:**
- CASE_CREATED (preceded by)
- GRANT_ALLOCATED from Municipality Domain (input source)

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation
- WF-006 Registered Hours (monitors hours against grant)
- WF-007 Outside Grant Review (if hours exceed)

**MVP Status:** MVP

**Business Rules:**
- CaseGrant must be created before professional assignment
- Grant amount required
- Grant period defined (start/end dates)
- Multiple grants possible (sequential periods or multiple municipalities)
- Remaining hours calculated: granted_hours - approved_hours
- Grant tracking mandatory for all cases

**What This Capability Must NOT Do:**
- ❌ Create grant without municipal allocation
- ❌ Approve hours (that's Governance/Case approval)
- ❌ Override grant limits
- ❌ Hard delete grant records
- ❌ Change granted amount after approval

---

### Capability 3.4: Mark Case Ready For Matching

**Purpose:** Signal that case is fully assessed and ready for professional matching

**Owning Domain:** Case Domain  
**Supporting Domains:** Matching Domain (receives signal), Professional Domain (provides candidates), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Case with complexity assessed
- Case with grant allocated
- Case coordinator confirmation

**Outputs:**
- Case status: remains OPEN (but flagged as ready)
- Matching Domain notified
- Matching Domain can now prepare match pool
- Case Coordinator ready to review matches

**Events Emitted:**
- CASE_READY_FOR_MATCHING
- MATCHING_POOL_PREPARED (from Matching Domain)

**Events Consumed:**
- COMPLEXITY_ASSESSED (prerequisite)
- CASE_GRANT_CREATED (prerequisite)

**Related Workflows:**
- WF-002 Municipality Inquiry to Case Creation (final step)
- WF-003 Match Run and Assignment (next step)

**MVP Status:** MVP

**Business Rules:**
- Complexity must be assessed before marking ready
- Grant must be allocated before marking ready
- Case ready flag enables matching to begin
- Case Coordinator must explicitly mark as ready (not automatic)
- Matching pool can be prepared in parallel with other case preparation

**What This Capability Must NOT Do:**
- ❌ Auto-start matching (Case Coordinator initiates MatchRun)
- ❌ Assign professional
- ❌ Bypass complexity assessment or grant allocation
- ❌ Prevent re-assessment if circumstances change
- ❌ Commit to timeline

---

### Capability 3.5: Record Case Assignment

**Purpose:** Record formal assignment of professional to case

**Owning Domain:** Case Domain  
**Supporting Domains:** Professional Domain (confirms capacity), Matching Domain (recommended), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Case identity
- Professional identity (matched via Matching Domain recommendation)
- Assignment decision (human approval)
- Assignment effective date
- Expected duration

**Outputs:**
- CaseAssignment record created
- Case status: MATCHED
- Professional availability updated
- Professional and sagsbehandler notified
- Case ready for work to begin (ACTIVE next)

**Events Emitted:**
- CASE_ASSIGNED
- ASSIGNMENT_STARTED (when case transitions to ACTIVE)

**Events Consumed:**
- CASE_READY_FOR_MATCHING
- CANDIDATES_RECOMMENDED (from Matching Domain)

**Related Workflows:**
- WF-003 Match Run and Assignment

**MVP Status:** MVP

**Business Rules:**
- CaseAssignment temporal entity (replaced, not updated)
- Assignment always based on Matching Domain recommendation + human decision
- Professional capacity must support assignment (checked before recording)
- Previous professional assignments preserved (soft history)
- Assignment effective date recorded
- Expected duration estimate recorded for planning

**What This Capability Must NOT Do:**
- ❌ Auto-assign (human decision required)
- ❌ Bypass Matching Domain recommendation
- ❌ Ignore professional capacity constraints
- ❌ Hard delete previous assignments
- ❌ Assign unavailable or suspended professionals

---

### Capability 3.6: Change Case Assignment

**Purpose:** Transition assignment from one professional to another (without full handover process)

**Owning Domain:** Case Domain  
**Supporting Domains:** Professional Domain (capacity), Matching Domain (new recommendation), Delivery Domain (session continuity), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Case with active assignment
- New professional identity
- Reason for change
- Transition plan
- Decision authority

**Outputs:**
- Previous assignment ended
- New CaseAssignment created
- Delivery Domain notified (session continuity)
- Old professional and new professional notified
- Case status remains ACTIVE (briefly HANDOVER during transition)

**Events Emitted:**
- ASSIGNMENT_CHANGED
- PROFESSIONAL_CHANGED
- HANDOVER_REQUIRED (triggers WF-008)

**Events Consumed:**
- CASE_ASSIGNED (prerequisite)
- CASE_ACTIVE (context)

**Related Workflows:**
- WF-008 Professional Handover (full process)
- WF-003 Match Run and Assignment (may re-match if needed)

**MVP Status:** MVP (simple change if voluntary; Phase 2: complex handover scenarios)

**Business Rules:**
- Previous professional's CaseAssignment ended with timestamp
- New professional's CaseAssignment created with timestamp
- Reason for change recorded
- Can occur due to: professional departure, performance, citizen request, professional request
- May trigger full WF-008 Handover if complex
- Session continuity maintained (Delivery Domain involved)

**What This Capability Must NOT Do:**
- ❌ Hard delete previous assignment
- ❌ Assign without new professional selected
- ❌ Skip notification to previous professional
- ❌ Lose context of old professional's work
- ❌ Automate (always requires Case Coordinator decision)

---

### Capability 3.7: Initiate Handover

**Purpose:** Formally initiate professional change with structured handover process

**Owning Domain:** Case Domain  
**Supporting Domains:** Professional Domain (availability), Delivery Domain (session continuity), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Case with assignment
- Reason for handover (departure, performance, citizen request, etc.)
- Handover timeline
- Handover notes

**Outputs:**
- CaseHandover record created
- Case status: HANDOVER (temporary state)
- Old and new professional notified
- Delivery Domain notified (prepare session transfer)
- Handover tracking initiated

**Events Emitted:**
- HANDOVER_INITIATED
- PROFESSIONAL_DEPARTURE_PLANNED
- REPLACEMENT_SOUGHT (if new professional not yet identified)

**Events Consumed:**
- CASE_ASSIGNED or CASE_ACTIVE

**Related Workflows:**
- WF-008 Professional Handover
- WF-009 Contact Disclosure (may include sagsbehandler notification)

**MVP Status:** MVP

**Business Rules:**
- Handover explicit process (not automatic)
- Handover timeline tracked (expected completion date)
- Reason recorded (departure, performance, request, etc.)
- New professional may or may not be identified upfront
- Old professional's sessions remain accessible
- Handover status: INITIATED → IN_PROGRESS → COMPLETED
- No sessions accepted from old professional after handover initiated

**What This Capability Must NOT Do:**
- ❌ Automatically unassign old professional
- ❌ Skip notification
- ❌ Delete old professional's session records
- ❌ Prevent new professional from reading old sessions
- ❌ Override citizen's preference

---

### Capability 3.8: Close Case

**Purpose:** Formally close case when support work completed

**Owning Domain:** Case Domain  
**Supporting Domains:** Delivery Domain (finalize sessions), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Case with assignment and work completed
- Closure reason (goal achieved, no longer needed, professional departure, etc.)
- Final summary notes
- Outcome assessment (optional)
- Professional deassignment confirmation

**Outputs:**
- Case status: COMPLETED
- Professional unassigned
- Final session logs and hours finalized
- Closure date recorded
- Municipality notified
- Case eligible for archival

**Events Emitted:**
- CASE_COMPLETED
- CASE_CLOSED
- PROFESSIONAL_UNASSIGNED

**Events Consumed:**
- CASE_ACTIVE (prerequisite; work must be ongoing before closing)

**Related Workflows:**
- WF-012 Case Closure and Archival

**MVP Status:** MVP

**Business Rules:**
- All pending hours must be approved before closure
- Closure reason recorded
- Closure notes recorded
- Professional unassigned (availability restored)
- Case remains COMPLETED for review period before archival
- Closure irreversible (can only archive or archive)

**What This Capability Must NOT Do:**
- ❌ Hard delete sessions/hours
- ❌ Hide case from municipality
- ❌ Auto-archive immediately after closure
- ❌ Delete professional assignment records
- ❌ Prevent outcome assessment

---

### Capability 3.9: Archive Case

**Purpose:** Archive completed case for long-term retention

**Owning Domain:** Case Domain  
**Supporting Domains:** Governance Domain (retention policy), Delivery Domain (preserves data), Professional Domain (preserves professional context)  
**Primary Human Role:** Governance Administrator or Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Closed case
- Archival confirmation
- Retention start date

**Outputs:**
- Case status: ARCHIVED
- Case.archived_at timestamp set
- Soft delete applied (data preserved)
- Governance Domain notified (retention countdown begins)
- Data retained per GDPR (7 years)
- Case eligible for scheduled deletion after retention period

**Events Emitted:**
- CASE_ARCHIVED
- RETENTION_COUNTDOWN_STARTED

**Events Consumed:**
- CASE_COMPLETED (prerequisite)

**Related Workflows:**
- WF-012 Case Closure and Archival

**MVP Status:** MVP

**Business Rules:**
- Cases must be COMPLETED before archival
- Archival soft delete (set archived_at, preserve all data)
- Data retained per GDPR retention policy (7 years)
- After retention period, eligible for deletion
- Audit trail preserved (can investigate historical cases)
- Professional's work history preserved

**What This Capability Must NOT Do:**
- ❌ Hard delete case
- ❌ Delete sessions/hours before retention period
- ❌ Hide archived cases from audit trail
- ❌ Archive incomplete cases
- ❌ Lose citizen or professional context

---

## DOMAIN 4: DELIVERY DOMAIN CAPABILITIES

The Delivery Domain documents and tracks actual support work.

### Capability 4.1: Create Session Log Draft

**Purpose:** Professional begins documenting support session (work in progress)

**Owning Domain:** Delivery Domain  
**Supporting Domains:** Case Domain (verifies professional assigned), Governance Domain (audit)  
**Primary Human Role:** Professional  
**Platform Role Required:** Professional  

**Inputs:**
- Case assignment (professional assigned to case)
- Session date and time
- Activities performed
- Citizen engagement level
- Notes and observations

**Outputs:**
- SessionLog record created (draft state)
- Status: DRAFT
- Professional can continue editing

**Events Emitted:**
- SESSION_LOG_STARTED

**Events Consumed:**
- ASSIGNMENT_STARTED (prerequisite; professional must be assigned)

**Related Workflows:**
- WF-005 Session Documentation

**MVP Status:** MVP

**Business Rules:**
- Only assigned professional can create for assigned case
- Multiple sessions per day supported
- Session date must be current or past (not future)
- Session can be created day-of or up to X days after (configurable)
- Session in DRAFT state (not yet submitted)

**What This Capability Must NOT Do:**
- ❌ Finalize session immediately (separate capability)
- ❌ Calculate hours (separate capability)
- ❌ Approve session (separate capability)
- ❌ Allow access to unassigned cases
- ❌ Create future-dated sessions

---

### Capability 4.2: Finalize Session Log

**Purpose:** Professional marks session log complete and submits for verification

**Owning Domain:** Delivery Domain  
**Supporting Domains:** Case Domain (records impact), Governance Domain (audit)  
**Primary Human Role:** Professional  
**Platform Role Required:** Professional  

**Inputs:**
- SessionLog in DRAFT state
- Final notes and activities
- Session completion confirmation
- Professional signature/confirmation

**Outputs:**
- SessionLog status: SUBMITTED
- Case Domain notified (may update case progress)
- Case Coordinator can now review
- Session eligible for hour registration

**Events Emitted:**
- SESSION_LOG_FINALIZED
- SESSION_LOG_SUBMITTED

**Events Consumed:**
- SESSION_LOG_STARTED

**Related Workflows:**
- WF-005 Session Documentation

**MVP Status:** MVP

**Business Rules:**
- Session must be DRAFT before finalizing
- Finalization creates permanent record (write-once)
- Professional cannot edit after finalization
- Case Domain notified of session completion
- Session ready for hour registration

**What This Capability Must NOT Do:**
- ❌ Allow editing after finalization (corrections via separate capability)
- ❌ Calculate hours
- ❌ Approve session
- ❌ Require Case Coordinator approval before submission
- ❌ Prevent professional from submitting incomplete sessions (they choose readiness)

---

### Capability 4.3: Correct Session Log

**Purpose:** Professional or Case Coordinator corrects finalized session log

**Owning Domain:** Delivery Domain  
**Supporting Domains:** Governance Domain (audit, explains changes)  
**Primary Human Role:** Professional or Case Coordinator  
**Platform Role Required:** Professional or Admin  

**Inputs:**
- Finalized SessionLog
- Change type (typo, missing info, wrong date, etc.)
- Explanation of correction
- Corrected information

**Outputs:**
- SessionLogCorrection record created
- Original SessionLog unchanged (write-once preserved)
- Correction logged with explanation
- Correction audited

**Events Emitted:**
- SESSION_LOG_CORRECTED
- CORRECTION_EXPLAINED

**Events Consumed:**
- SESSION_LOG_FINALIZED (prerequisite)

**Related Workflows:**
- WF-005 Session Documentation

**MVP Status:** MVP

**Business Rules:**
- Original SessionLog never updated (write-once preserved)
- SessionLogCorrection separate record explaining change
- Correction explanation mandatory (no silent changes)
- Both professional and Case Coordinator can request corrections
- Correction audited (who, when, why)

**What This Capability Must NOT Do:**
- ❌ Update original SessionLog in-place
- ❌ Hide correction from audit trail
- ❌ Allow bulk corrections without explanation
- ❌ Delete previous versions
- ❌ Skip explanation

---

### Capability 4.4: Register Hours

**Purpose:** Professional records hours worked (for payroll and grant tracking)

**Owning Domain:** Delivery Domain  
**Supporting Domains:** Case Domain (grant impact), Governance Domain (audit)  
**Primary Human Role:** Professional  
**Platform Role Required:** Professional  

**Inputs:**
- Case assignment
- Hours worked (decimal format)
- Work type (session, documentation, coordination, etc.)
- Session links (if applicable)
- Description

**Outputs:**
- RegisteredHours record created
- Status: PENDING_APPROVAL
- Case Domain notified (impacts grant tracking)
- Hours eligible for approval workflow

**Events Emitted:**
- HOURS_REGISTERED
- HOURS_SUBMITTED_FOR_APPROVAL

**Events Consumed:**
- ASSIGNMENT_STARTED (context)
- SESSION_LOG_FINALIZED (may link to)

**Related Workflows:**
- WF-006 Registered Hours

**MVP Status:** MVP

**Business Rules:**
- Hours submitted by professional
- Initially status: PENDING_APPROVAL
- Professional can submit multiple times per case
- Hours tracked: date, amount, description, work type
- Hours may exceed or fall short of sessions (e.g., documentation time)
- Professional capacity limits relevant (Case Domain checks)

**What This Capability Must NOT Do:**
- ❌ Approve hours (that's Case/Governance)
- ❌ Calculate automatically from sessions (professional submits)
- ❌ Prevent submission (professional decides when)
- ❌ Enforce capacity limits (Case Domain checks)
- ❌ Update case.remaining_hours (calculated, not stored)

---

### Capability 4.5: Submit Hours

**Purpose:** Professional finalizes and submits hours for approval

**Owning Domain:** Delivery Domain  
**Supporting Domains:** Case Domain (grant impact), Governance Domain (audit)  
**Primary Human Role:** Professional  
**Platform Role Required:** Professional  

**Inputs:**
- RegisteredHours in DRAFT or PENDING state
- Final submission confirmation
- Professional attestation (hours are accurate)

**Outputs:**
- Hours status: SUBMITTED_FOR_APPROVAL
- Case Coordinator queue updated
- Hours eligible for approval decision

**Events Emitted:**
- HOURS_SUBMITTED
- APPROVAL_QUEUE_UPDATED

**Events Consumed:**
- HOURS_REGISTERED

**Related Workflows:**
- WF-006 Registered Hours

**MVP Status:** MVP

**Business Rules:**
- Professional confirms accuracy before submission
- Submission creates snapshot (professional can register more later)
- Status: PENDING_APPROVAL → SUBMITTED_FOR_APPROVAL
- Case Coordinator reviews in approval workflow

**What This Capability Must NOT Do:**
- ❌ Approve hours
- ❌ Reject hours (that's approval workflow)
- ❌ Calculate or adjust hours
- ❌ Prevent resubmission if rejected
- ❌ Hide from Case Coordinator

---

### Capability 4.6: Record Contact Log

**Purpose:** Professional logs communication with sagsbehandler or municipality

**Owning Domain:** Delivery Domain  
**Supporting Domains:** Case Domain (context), Municipality Domain (receives copy), Governance Domain (audit)  
**Primary Human Role:** Professional  
**Platform Role Required:** Professional  

**Inputs:**
- Case assignment
- Contact date/time
- Contact method (phone, email, meeting, etc.)
- Sagsbehandler contacted
- Conversation summary
- Outcomes/decisions

**Outputs:**
- ContactLog record created
- Status: RECORDED
- Municipality may receive notification (optional)
- Contact history available for review

**Events Emitted:**
- CONTACT_LOGGED
- SAGSBEHANDLER_NOTIFIED (optional)

**Events Consumed:**
- ASSIGNMENT_STARTED (context)

**Related Workflows:**
- WF-009 Contact Disclosure (may include contact log review)
- WF-010 Contact Log

**MVP Status:** MVP

**Business Rules:**
- Contact date recorded (when communication occurred)
- Contact method recorded (phone, email, meeting, etc.)
- Sagsbehandler identified
- Conversation summary recorded (not complete transcript)
- Outcomes/decisions recorded
- Contact logged by professional (professional perspective)

**What This Capability Must NOT Do:**
- ❌ Require sagsbehandler approval
- ❌ Store confidential personal information in notes
- ❌ Skip audit trail
- ❌ Prevent professional from logging important communications
- ❌ Share sensitive details without consent

---

### Capability 4.7: Record Follow-Up Need

**Purpose:** Professional identifies and logs need for follow-up (medical, family, services, etc.)

**Owning Domain:** Delivery Domain  
**Supporting Domains:** Case Domain (context), Governance Domain (audit)  
**Primary Human Role:** Professional  
**Platform Role Required:** Professional  

**Inputs:**
- Case assignment
- Follow-up type (medical referral, family contact, service coordination, etc.)
- Priority level (LOW, MEDIUM, HIGH)
- Due date
- Description
- Recommended action

**Outputs:**
- FollowUpNeed record created
- Status: OPEN
- Case Coordinator notified
- Follow-up tracked until closure

**Events Emitted:**
- FOLLOW_UP_NEEDED
- CASE_COORDINATOR_NOTIFIED

**Events Consumed:**
- SESSION_LOG_FINALIZED or CONTACT_LOGGED

**Related Workflows:**
- WF-005 Session Documentation
- WF-010 Contact Log

**MVP Status:** Phase 2 (MVP: sessions/contacts only; Phase 2: formal follow-up tracking)

**Business Rules:**
- Professional identifies follow-up need during or after session
- Priority and due date set
- Description records what's needed
- Recommended action recorded (for Case Coordinator)
- Case Coordinator responsible for action
- Follow-up tracked to closure

**What This Capability Must NOT Do:**
- ❌ Automatically assign action to professional
- ❌ Bypass Case Coordinator (notification required)
- ❌ Store medically sensitive information without encryption
- ❌ Assume professional will follow up (escalates to coordinator)
- ❌ Hide from audit trail

---

## DOMAIN 5: GOVERNANCE DOMAIN CAPABILITIES

The Governance Domain ensures compliance, audits all actions, and manages data protection.

### Capability 5.1: Record Audit Event

**Purpose:** Log every significant action or decision for compliance and auditability

**Owning Domain:** Governance Domain  
**Supporting Domains:** All domains (publish events)  
**Primary Human Role:** System (automatic)  
**Platform Role Required:** System  

**Inputs:**
- Event type (defined metadata contract)
- Event source (which domain, which capability)
- Actor (who performed action)
- Timestamp
- Sensitive data (encrypted if included)
- Explanation (why action taken)

**Outputs:**
- AuditEvent record created
- Event immutable (never updated)
- Event queryable for compliance reporting
- Event retained per GDPR policy

**Events Emitted:**
- AUDIT_EVENT_RECORDED

**Events Consumed:**
- ALL SIGNIFICANT EVENTS from all domains

**Related Workflows:**
- (All workflows implicitly audit)

**MVP Status:** MVP

**Business Rules:**
- Every sensitive action generates audit event
- Metadata contract per event type (schema-validated)
- Sensitive data encrypted if included
- No free-text dumps (structured data only)
- Immutable: never updated or deleted
- 7-year retention per GDPR
- Actor identity always recorded
- Timestamp always recorded

**What This Capability Must NOT Do:**
- ❌ Store unencrypted sensitive data
- ❌ Delete audit events
- ❌ Update audit events (immutable)
- ❌ Skip logging for expedience
- ❌ Use free-text descriptions (structured data)

---

### Capability 5.2: Enforce Access Boundary

**Purpose:** Check permissions and prevent unauthorized actions

**Owning Domain:** Governance Domain  
**Supporting Domains:** All domains (request permission checks)  
**Primary Human Role:** System (automatic)  
**Platform Role Required:** System  

**Inputs:**
- User identity
- Requested action
- Resource (case, professional, session, etc.)
- Context (user's role, resource ownership)

**Outputs:**
- Permission granted or denied
- Denied action logged as audit event
- User notified if denied

**Events Emitted:**
- PERMISSION_CHECKED
- PERMISSION_DENIED (if applicable)

**Events Consumed:**
- Implicit: every API request

**Related Workflows:**
- (All workflows implicitly check permissions)

**MVP Status:** MVP

**Business Rules:**
- Professional role: can access own cases only
- Admin role: can access all resources
- Permission denied logged as audit event
- Denied access prevents action and logs security event
- Checks in backend (not frontend only)

**What This Capability Must NOT Do:**
- ❌ Allow frontend-only checks (always verify in backend)
- ❌ Skip checks for "quick" operations
- ❌ Hide denial from user (always notify)
- ❌ Skip audit logging of denials
- ❌ Create privileges beyond Professional or Admin

---

### Capability 5.3: Review Outside Grant Hours

**Purpose:** Review hours that exceed municipal grant and determine if approval is appropriate

**Owning Domain:** Governance Domain (with Case Domain)  
**Supporting Domains:** Case Domain (owns hours approval), Delivery Domain (submitted hours), Municipality Domain (grant source)  
**Primary Human Role:** Case Coordinator or Operations Manager  
**Platform Role Required:** Admin  

**Inputs:**
- RegisteredHours exceeding grant
- Amount over grant
- Reason for overage
- Professional explanation (if provided)
- Grant details and history

**Outputs:**
- Outside grant review recorded
- Decision: APPROVED or REJECTED
- Municipality notified (if approved)
- Hours flagged for special tracking

**Events Emitted:**
- OUTSIDE_GRANT_REVIEWED
- OVERAGE_APPROVED or OVERAGE_REJECTED

**Events Consumed:**
- HOURS_REGISTERED (hours exceed grant)

**Related Workflows:**
- WF-007 Outside Grant Review

**MVP Status:** MVP

**Business Rules:**
- Automatic flag when hours registered exceed grant
- Manual review required before approval
- Reason for overage documented
- Municipality notification mandatory (transparency)
- Approved overage tracked separately (budget impact)
- Rejected overage returned to professional for correction

**What This Capability Must NOT Do:**
- ❌ Auto-approve or reject
- ❌ Hide overage from Municipality Domain
- ❌ Allow unlimited overage
- ❌ Adjust grant automatically
- ❌ Skip audit trail

---

### Capability 5.4: Approve Hours

**Purpose:** Formally approve submitted hours for payroll and grant accounting

**Owning Domain:** Governance Domain (with Case Domain approval authority)  
**Supporting Domains:** Delivery Domain (source), Case Domain (grant impact)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- RegisteredHours in SUBMITTED state
- Verification (professional's work confirmed)
- Grant remaining confirmation (hours don't exceed or overage approved)
- Approval authority

**Outputs:**
- Hours status: APPROVED
- Professional eligible for payment
- Grant remaining recalculated
- Payroll system notified

**Events Emitted:**
- HOURS_APPROVED
- PAYMENT_QUEUED
- GRANT_REMAINING_UPDATED

**Events Consumed:**
- HOURS_SUBMITTED

**Related Workflows:**
- WF-006 Registered Hours
- WF-007 Outside Grant Review (if overage)

**MVP Status:** MVP

**Business Rules:**
- Professional submits → Case Coordinator reviews → approves
- Approval confirms hours align with session documentation
- Approval confirms grant remaining
- Approved hours eligible for payment
- Approval recorded with approver identity and timestamp
- Cannot be reversed once approved (can only reject, not reverse)

**What This Capability Must NOT Do:**
- ❌ Auto-approve (always manual)
- ❌ Skip grant verification
- ❌ Approve beyond grant without separate outside-grant review
- ❌ Prevent payment processing
- ❌ Skip audit trail

---

### Capability 5.5: Reject Hours

**Purpose:** Reject submitted hours if not appropriate for approval

**Owning Domain:** Governance Domain (with Case Domain)  
**Supporting Domains:** Delivery Domain (submitted), Professional Domain (context)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- RegisteredHours in SUBMITTED state
- Reason for rejection
- Feedback for professional (what to fix)

**Outputs:**
- Hours status: REJECTED
- Hours returned to professional
- Professional can resubmit after correction
- Rejection reason recorded

**Events Emitted:**
- HOURS_REJECTED
- PROFESSIONAL_NOTIFIED

**Events Consumed:**
- HOURS_SUBMITTED

**Related Workflows:**
- WF-006 Registered Hours

**MVP Status:** MVP

**Business Rules:**
- Case Coordinator rejects with reason
- Reason provided to professional (e.g., "session not confirmed", "hours exceed capacity")
- Professional can resubmit after correction
- Rejection logged (audit trail)
- Rejection does not prevent future submissions

**What This Capability Must NOT Do:**
- ❌ Accept rejection without reason
- ❌ Hide reason from professional
- ❌ Prevent resubmission
- ❌ Punish professional for submission
- ❌ Delete rejected hours

---

### Capability 5.6: Manage Data Retention

**Purpose:** Define and enforce data retention policies per GDPR

**Owning Domain:** Governance Domain  
**Supporting Domains:** All domains (comply with retention)  
**Primary Human Role:** Compliance Officer  
**Platform Role Required:** Admin  

**Inputs:**
- Entity type (case, professional, session, etc.)
- Retention period (years)
- Retention triggers (archive date, deletion date, etc.)
- Compliance requirements

**Outputs:**
- Retention policy defined
- Retention schedule created
- Retention enforced automatically
- Deletion executed per schedule

**Events Emitted:**
- RETENTION_POLICY_DEFINED
- RETENTION_SCHEDULED
- DELETION_EXECUTED

**Events Consumed:**
- CASE_ARCHIVED (triggers retention countdown)
- PROFESSIONAL_ARCHIVED (triggers retention countdown)

**Related Workflows:**
- WF-013 GDPR Retention and Deletion

**MVP Status:** MVP

**Business Rules:**
- Cases archived → 7-year retention → scheduled deletion
- Professionals archived → 7-year retention → scheduled deletion
- Session logs archived → 7-year retention → scheduled deletion
- Retention policy mandatory
- Deletion scheduled (not immediate)
- Deletion audited (record that deletion occurred)

**What This Capability Must NOT Do:**
- ❌ Delete immediately upon archival
- ❌ Skip retention period
- ❌ Delete without audit trail
- ❌ Delete without scheduled process
- ❌ Forget about data after archival

---

### Capability 5.7: Execute GDPR Deletion

**Purpose:** Execute scheduled deletion of archived data per GDPR retention policy

**Owning Domain:** Governance Domain  
**Supporting Domains:** All domains (comply with deletion)  
**Primary Human Role:** System (scheduled) or Compliance Officer (manual)  
**Platform Role Required:** System or Admin  

**Inputs:**
- Archived entity (case, professional, session, etc.)
- Retention period elapsed confirmation
- Deletion schedule verification
- Compliance confirmation

**Outputs:**
- Data deleted (hard delete)
- Deletion logged (audit event: data deleted, not how it was deleted)
- Backup deleted per policy
- GDPR obligation satisfied

**Events Emitted:**
- DATA_DELETED
- RETENTION_COMPLETED

**Events Consumed:**
- RETENTION_SCHEDULED (prerequisite)

**Related Workflows:**
- WF-013 GDPR Retention and Deletion

**MVP Status:** MVP

**Business Rules:**
- Deletion only after retention period elapsed
- Deletion scheduled (not on-demand)
- Deletion audited (record that deletion occurred)
- Backup copies deleted per retention policy
- Soft-deleted records hard-deleted after retention
- Deletion irreversible (no recovery possible)

**What This Capability Must NOT Do:**
- ❌ Delete before retention period
- ❌ Delete on-demand without schedule
- ❌ Delete without audit trail
- ❌ Keep backups beyond retention
- ❌ Skip confirmation

---

### Capability 5.8: Generate Compliance Export

**Purpose:** Generate reports and exports for compliance, audit, and legal review

**Owning Domain:** Governance Domain  
**Supporting Domains:** All domains (provide audit data)  
**Primary Human Role:** Compliance Officer or Legal Team  
**Platform Role Required:** Admin  

**Inputs:**
- Report type (audit trail, GDPR compliance, data inventory, etc.)
- Date range
- Filters (cases, professionals, events, etc.)
- Output format (CSV, PDF, JSON)

**Outputs:**
- Compliance report generated
- Export provided (encrypted if sensitive)
- Report audited (generation logged)
- Report retained per legal requirement

**Events Emitted:**
- COMPLIANCE_REPORT_GENERATED
- EXPORT_PROVIDED

**Events Consumed:**
- AUDIT_EVENT_RECORDED (primary source of data)

**Related Workflows:**
- (On-demand compliance requests)

**MVP Status:** MVP

**Business Rules:**
- Audit trail export includes all AuditEvents for date range
- GDPR compliance export includes retention/deletion status
- Data inventory export includes all data categories
- Report sensitive (encrypted in transit)
- Report generation audited
- Report retention per legal requirements

**What This Capability Must NOT Do:**
- ❌ Export without audit logging
- ❌ Export sensitive data unencrypted
- ❌ Hide sensitive information from legal team
- ❌ Delete export reports before legal retention period
- ❌ Provide reports without proper authorization

---

## DOMAIN 6: MATCHING DOMAIN CAPABILITIES

The Matching Domain supports systematic matching of professionals to cases.

### Capability 6.1: Trigger Match Run

**Purpose:** Admin initiates matching process for a case

**Owning Domain:** Matching Domain  
**Supporting Domains:** Case Domain (provides case), Professional Domain (provides candidates), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- Case identity
- Case complexity and requirements
- Professional pool (eligibility criteria)
- Matching algorithm version
- Scoring weights (if customizable)

**Outputs:**
- MatchRun created
- Status: INITIATED
- Matching algorithm queued
- Candidate pool identified

**Events Emitted:**
- MATCH_RUN_TRIGGERED
- MATCHING_INITIATED

**Events Consumed:**
- CASE_READY_FOR_MATCHING

**Related Workflows:**
- WF-003 Match Run and Assignment

**MVP Status:** MVP

**Business Rules:**
- Case must be OPEN and marked ready for matching
- Case complexity must be assessed
- Professional pool filtered for eligibility (approved, available, capacity)
- Matching never automatic (Case Coordinator initiates)
- Algorithm version recorded (explainability)
- MatchRun tracked from initiation to decision

**What This Capability Must NOT Do:**
- ❌ Auto-match (human decision required)
- ❌ Match unavailable professionals
- ❌ Ignore capacity constraints
- ❌ Skip algorithm versioning
- ❌ Prevent Case Coordinator from initiating

---

### Capability 6.2: Score Match Candidates

**Purpose:** Algorithm scores professionals for case suitability

**Owning Domain:** Matching Domain  
**Supporting Domains:** Professional Domain (candidate data), Case Domain (case requirements)  
**Primary Human Role:** System (algorithmic)  
**Platform Role Required:** System  

**Inputs:**
- MatchRun context
- Case characteristics (complexity, support type, required skills)
- Professional profiles (qualifications, experience, capacity)
- Matching algorithm (versioned)
- Scoring weights and criteria

**Outputs:**
- MatchCandidate records created
- Each candidate scored (0.0 to 1.0)
- Score components detailed (qualifications, availability, experience, etc.)
- Candidates ranked

**Events Emitted:**
- CANDIDATES_SCORED
- RANKING_CREATED

**Events Consumed:**
- MATCH_RUN_TRIGGERED

**Related Workflows:**
- WF-003 Match Run and Assignment

**MVP Status:** MVP

**Business Rules:**
- Algorithm deterministic (same inputs = same scores)
- Algorithm versioned (v1.0, v1.1, v2.0, etc.)
- Score components transparent (not black-box)
- Scores reflect explainable factors (qualifications, experience, fit, availability, capacity)
- All eligible professionals scored (even if low score)

**What This Capability Must NOT Do:**
- ❌ Use black-box scoring (must be explainable)
- ❌ Change algorithm mid-run
- ❌ Exclude candidates without reason
- ❌ Bias scoring based on professional identity
- ❌ Hide score components

---

### Capability 6.3: Explain Match Score

**Purpose:** Provide human-readable explanation for each candidate's score

**Owning Domain:** Matching Domain  
**Supporting Domains:** Professional Domain (provides data for explanation)  
**Primary Human Role:** System (automatic) and Case Coordinator (reads)  
**Platform Role Required:** System  

**Inputs:**
- MatchCandidate score
- Score components (from Capability 6.2)
- Professional profile (for context)
- Case requirements (for context)

**Outputs:**
- MatchExplanation text generated
- Explanation records why professional scored as they did
- Explanation human-readable (not technical)
- Explanation supports human decision-making

**Events Emitted:**
- MATCH_EXPLANATION_GENERATED

**Events Consumed:**
- CANDIDATES_SCORED

**Related Workflows:**
- WF-003 Match Run and Assignment

**MVP Status:** MVP

**Business Rules:**
- Explanation must be human-readable
- Explanation references specific factors (qualifications, experience, fit)
- Explanation not justification (not persuasive)
- Explanation transparent (Case Coordinator can verify facts)
- Explanation generated for all candidates (even low scores)

**What This Capability Must NOT Do:**
- ❌ Generate persuasive or biased explanations
- ❌ Hide factors that lowered scores
- ❌ Skip explanations for low-scoring candidates
- ❌ Use technical jargon (understandable by non-technical staff)
- ❌ Claim certainty beyond what algorithm provides

---

### Capability 6.4: Recommend Candidates

**Purpose:** Provide ranked list of recommended candidates to Case Coordinator

**Owning Domain:** Matching Domain  
**Supporting Domains:** Case Domain (case context), Professional Domain (professional data)  
**Primary Human Role:** Case Coordinator (reviewer)  
**Platform Role Required:** Admin  

**Inputs:**
- MatchRun results
- Scored and ranked candidates
- Explanations
- Alternative candidates (lower ranked)

**Outputs:**
- MatchRecommendation provided
- Top candidates presented (usually top 3)
- Alternatives available (if Case Coordinator wants)
- Recommendation ready for human decision

**Events Emitted:**
- CANDIDATES_RECOMMENDED
- RECOMMENDATION_PROVIDED

**Events Consumed:**
- CANDIDATES_SCORED
- MATCH_EXPLANATION_GENERATED

**Related Workflows:**
- WF-003 Match Run and Assignment

**MVP Status:** MVP

**Business Rules:**
- Recommendation is NOT a decision (human decides)
- Top candidates presented with explanation
- Lower-ranked candidates available if needed
- Recommendation respects professional capacity and availability
- Recommendation based on most recent algorithm version

**What This Capability Must NOT Do:**
- ❌ Present only top candidate (alternatives must be available)
- ❌ Make final decision
- ❌ Force top candidate if Case Coordinator disagrees
- ❌ Hide lower-ranked candidates
- ❌ Recommend unavailable professionals

---

### Capability 6.5: Record Human Match Decision

**Purpose:** Record Case Coordinator's final decision and assignment of professional

**Owning Domain:** Matching Domain (records decision; Case Domain records assignment)  
**Supporting Domains:** Case Domain (creates assignment), Professional Domain (confirms), Governance Domain (audit)  
**Primary Human Role:** Case Coordinator  
**Platform Role Required:** Admin  

**Inputs:**
- MatchRun context
- Recommended candidates
- Case Coordinator's decision (which professional selected)
- Reason for selection (if overriding recommendation)
- Decision authority/signature

**Outputs:**
- Human decision recorded
- Decision logged with Case Coordinator identity
- Selection reason recorded (if different from recommendation)
- Case Domain triggered to create assignment

**Events Emitted:**
- HUMAN_DECISION_RECORDED
- MATCH_DECISION_MADE
- ASSIGNMENT_REQUESTED (to Case Domain)

**Events Consumed:**
- CANDIDATES_RECOMMENDED

**Related Workflows:**
- WF-003 Match Run and Assignment

**MVP Status:** MVP

**Business Rules:**
- Decision must be by human (never automatic)
- If Case Coordinator selects different professional than recommended, reason recorded
- Decision audited with who decided and when
- Decision irreversible once assignment recorded
- Alternative candidates preserved in MatchRun for reference

**What This Capability Must NOT Do:**
- ❌ Auto-select top candidate
- ❌ Force top candidate on Case Coordinator
- ❌ Skip reason if overriding recommendation
- ❌ Hide decision from audit trail
- ❌ Prevent Case Coordinator from selecting differently

---

### Capability 6.6: Version Matching Algorithm

**Purpose:** Track and version matching algorithm for explainability and improvement

**Owning Domain:** Matching Domain  
**Supporting Domains:** Governance Domain (audit)  
**Primary Human Role:** Product Manager or Data Scientist  
**Platform Role Required:** Admin  

**Inputs:**
- Algorithm version (v1.0, v1.1, v2.0, etc.)
- Algorithm changes/improvements
- Scoring weights and criteria
- Effective date
- Rationale for version

**Outputs:**
- Algorithm version recorded
- Version tagged in system
- Previous versions preserved
- New MatchRuns use new version

**Events Emitted:**
- ALGORITHM_VERSION_UPDATED
- NEW_ALGORITHM_ACTIVE

**Events Consumed:**
- (Periodic, not event-driven)

**Related Workflows:**
- (Governance and improvement)

**MVP Status:** MVP (v1.0 for launch; v1.1+ in Phase 2+)

**Business Rules:**
- Each algorithm version immutable (cannot change v1.0 after release)
- Version tagged with date and rationale
- MatchRuns record which algorithm version used
- Explainability preserved across versions
- Previous versions available for comparison/analysis

**What This Capability Must NOT Do:**
- ❌ Change algorithm without versioning
- ❌ Lose traceability of which version was used for which matching
- ❌ Update previous versions
- ❌ Hide rationale for version changes
- ❌ Implement algorithm changes without testing

---

## CAPABILITY DEPENDENCY MAP

These capabilities depend on other capabilities completing first:

### Professional Domain Dependencies

- **Receive Professional Application** ← starting point (no dependencies)
- **Create Professional Profile** ← Receive Professional Application
- **Upload Professional Documents** ← Create Professional Profile
- **Verify Professional Documents** ← Upload Professional Documents
- **Approve Professional** ← Verify Professional Documents (all required docs verified)
- **Update Professional Availability** ← Approve Professional
- **Update Professional Capacity** ← Approve Professional
- **Suspend Professional** ← Approve Professional (professional must be active)
- **Archive Professional** ← Suspend Professional (professional must be inactive/suspended)

### Municipality Domain Dependencies

- **Register Municipality** ← starting point (no dependencies)
- **Record Sagsbehandler Contact** ← Register Municipality
- **Receive Municipality Inquiry** ← Record Sagsbehandler Contact (sagsbehandler must exist)
- **Record Grant Information** ← Receive Municipality Inquiry
- **Maintain Municipality Reference Data** ← Register Municipality (continuous)

### Case Domain Dependencies

- **Create Case** ← Receive Municipality Inquiry (inquir context)
- **Assess Case Complexity** ← Create Case
- **Create Case Grant** ← Assess Case Complexity AND Record Grant Information
- **Mark Case Ready For Matching** ← Assess Case Complexity AND Create Case Grant
- **Record Case Assignment** ← Mark Case Ready For Matching AND Candidates Recommended
- **Change Case Assignment** ← Record Case Assignment (case must have assignment)
- **Initiate Handover** ← Change Case Assignment OR professional departure
- **Close Case** ← (case work completed; all hours approved)
- **Archive Case** ← Close Case

### Delivery Domain Dependencies

- **Create Session Log Draft** ← Record Case Assignment (professional must be assigned)
- **Finalize Session Log** ← Create Session Log Draft
- **Correct Session Log** ← Finalize Session Log (session must be finalized first)
- **Register Hours** ← Finalize Session Log (session must exist, though hours optional)
- **Submit Hours** ← Register Hours
- **Record Contact Log** ← Record Case Assignment (professional assigned to case)
- **Record Follow-Up Need** ← Finalize Session Log OR Record Contact Log

### Governance Domain Dependencies

- **Record Audit Event** ← (all capabilities publish events)
- **Enforce Access Boundary** ← (all capabilities request permission checks)
- **Review Outside Grant Hours** ← Submit Hours (hours exceed grant)
- **Approve Hours** ← Submit Hours AND (no overage OR Review Outside Grant Hours approved)
- **Reject Hours** ← Submit Hours
- **Manage Data Retention** ← Archive Case OR Archive Professional
- **Execute GDPR Deletion** ← Manage Data Retention (retention period elapsed)
- **Generate Compliance Export** ← Record Audit Event (audit events exist)

### Matching Domain Dependencies

- **Trigger Match Run** ← Mark Case Ready For Matching
- **Score Match Candidates** ← Trigger Match Run
- **Explain Match Score** ← Score Match Candidates
- **Recommend Candidates** ← Explain Match Score
- **Record Human Match Decision** ← Recommend Candidates
- **Version Matching Algorithm** ← (periodic, not event-dependent)

---

## CAPABILITY-TO-WORKFLOW MAP

Each capability appears in one or more workflows:

### WF-001: Professional Onboarding
- Recruit Professional
- Receive Professional Application
- Create Professional Profile
- Upload Professional Documents (multiple documents)
- Verify Professional Documents
- Approve Professional
- Update Professional Availability (activation)

### WF-002: Municipality Inquiry to Case Creation
- Register Municipality (if new)
- Record Sagsbehandler Contact (if new)
- Receive Municipality Inquiry
- Record Grant Information
- Create Case
- Assess Case Complexity
- Create Case Grant
- Mark Case Ready For Matching

### WF-003: Match Run and Assignment
- Trigger Match Run
- Score Match Candidates
- Explain Match Score
- Recommend Candidates
- Record Human Match Decision
- Record Case Assignment
- Enforce Access Boundary (professional now has access)

### WF-004: Case Activation
- Record Case Assignment (prerequisite)
- Update Professional Availability (assignment begins)
- Governance: Audit Event logged (case activated)

### WF-005: Session Documentation
- Create Session Log Draft
- Finalize Session Log
- Correct Session Log (if needed)
- Record Audit Event (implicit)

### WF-006: Registered Hours
- Register Hours
- Submit Hours
- Approve Hours (or Reject Hours)
- Update Case Grant tracking (remaining hours)

### WF-007: Outside Grant Review
- Submit Hours (exceeds grant)
- Review Outside Grant Hours
- Approve Hours (with overage approved)

### WF-008: Professional Handover
- Change Case Assignment (or Initiate Handover)
- Update Professional Availability (old professional)
- Update Professional Availability (new professional)
- Record Contact Log (may notify sagsbehandler)

### WF-009: Contact Disclosure
- Record Contact Log
- Enforce Access Boundary (sagsbehandler contact shared)
- Governance: Audit Event logged (contact disclosed)

### WF-010: Contact Log
- Record Contact Log
- Record Follow-Up Need (if applicable)

### WF-011: Document Upload and Verification
- Upload Professional Documents
- Verify Professional Documents

### WF-012: Case Closure and Archival
- Close Case
- Archive Case
- Manage Data Retention (retention period begins)

### WF-013: GDPR Retention and Deletion
- Manage Data Retention
- Execute GDPR Deletion
- Generate Compliance Export (for verification)

---

## CAPABILITY DESIGN RULES (Summary)

Remember:

1. **Capabilities describe business abilities** — Not UI, not endpoints, not tables
2. **Capabilities are atomic** — One owning domain, clear inputs/outputs
3. **Capabilities respect boundaries** — No cross-domain violations
4. **Capabilities are auditable** — All significant actions logged
5. **Capabilities derive nothing** — All values calculated at query time
6. **Workflows use many capabilities** — Not 1:1 relationship
7. **Dependencies flow** — Earlier capabilities enable later ones
8. **No domain does it alone** — Supporting domains provide constraints/data

---

## VALIDATION CHECKLIST

When designing Technical Specification, validate:

- [ ] Each capability has exactly one owning domain
- [ ] Inputs and outputs are clear and non-ambiguous
- [ ] Dependencies documented and honored
- [ ] Capabilities don't duplicate (no redundant capabilities)
- [ ] Supporting domains clearly identified for each
- [ ] Events published/consumed align with workflow needs
- [ ] Audit trail required for sensitive capabilities
- [ ] Derived values not stored (calculated instead)
- [ ] No capability bypasses permissions
- [ ] No capability violates domain boundaries

---

## NEXT STEP

This Business Capability Map is complete and ready for Technical Specification design.

Technical Specification should:
1. Create one API endpoint or set of endpoints per capability
2. Define database schema changes per capability
3. Map permissions per capability (who can execute)
4. Define validation rules per capability
5. Map test cases per capability
6. Reference this Business Capability Map throughout

**Status:** READY FOR TECHNICAL SPECIFICATION

---

**Document Version:** 1.0  
**Date:** June 27, 2026  
**Author:** Claude (Architecture Documentation)  
**Approval Status:** PENDING HASSAN REVIEW
