# Workflows for Kursskifte Match 2.0
## Business Process Documentation Standard

**Date:** June 27, 2026  
**Status:** APPROVED STANDARD  
**Version:** 1.0

---

## PURPOSE

Workflows document the **business processes** that users follow in Kursskifte Match 2.0.

They bridge the gap between:
- **Architecture** (what data exists, how it's stored)
- **Technical Specification** (what API endpoints do, request/response format)
- **Implementation** (code that makes it happen)

Workflows answer: **"What does the user do, and why?"**

---

## WHY WORKFLOWS MATTER

### For Product
- Clarifies user journeys before code is written
- Identifies missing steps or ambiguities
- Documents business rules that code must enforce
- Enables product review before engineering starts

### For Design
- Shows what screens/interactions are needed
- Identifies error states and alternative paths
- Clarifies data input/output at each step
- Enables UX design before implementation

### For Engineering
- Technical Specification builds directly from workflows
- API endpoints derived from workflow steps
- Validation rules extracted from business rules
- Test cases generated from flows

### For Operations
- Runbooks for support/admin users
- Checklists for case management
- Escalation paths for failures

### For Compliance
- GDPR considerations documented
- Audit events tied to workflow steps
- Data access justified by business need
- Retention rules tied to workflows

---

## WORKFLOW NUMBERING STANDARD

**Format:** `WF-NNN-short-name`

**Example:** `WF-001-professional-onboarding`

**Rules:**
- Sequence: WF-001, WF-002, WF-003... (do not skip numbers)
- Three-digit number (zero-padded)
- Kebab-case name (lowercase, hyphens, no spaces)
- Name is descriptive (what the user does)

---

## REQUIRED STRUCTURE

Every workflow must include these sections:

### 1. METADATA

```yaml
Workflow: WF-NNN Professional Onboarding
Status: DRAFT | APPROVED | DEPRECATED
Priority: P0 (MVP critical) | P1 (MVP important) | P2 (Phase 2)
Version: 1.0
Last Updated: June 27, 2026
Owner: [Role/Person]
```

### 2. PURPOSE

One-line description of what this workflow accomplishes.

**Example:** "Onboard a new professional into Kursskifte system with credentials verification."

### 3. ACTORS

Who participates in this workflow?

```
- Admin: Kursskifte staff managing the system
- Professional: Social service provider (fagperson)
- Document Provider: System that provides background check (external)
```

### 4. TRIGGER

What event starts this workflow?

**Example:** 
- "Admin navigates to 'Add Professional' page"
- "Professional clicks 'Register' link in recruitment email"
- "System receives webhook from background check provider"

### 5. PRECONDITIONS

What must be true before workflow can start?

**Example:**
- Professional email address obtained
- Background check system accessible
- Professional role dropdown not empty

### 6. MAIN FLOW

Step-by-step happy path (most common case).

```
1. [Actor] [Action]
   Data: [What data is entered/changed]
   System: [What system does]
   UI: [What user sees]

Example:
1. [Admin] clicks "Add Professional"
   System: Loads professional registration form
   UI: Form appears with fields (email, phone, profession, qualifications)

2. [Admin] fills form and clicks "Register"
   Data: Email, phone, profession, qualifications entered
   System: Validates email format
   System: Creates Professional record in REGISTERED status
   System: Generates registration email with document upload link
   System: Logs PROFESSIONAL_REGISTERED audit event
   UI: Confirmation message: "Professional registered. Upload link sent to [email]."

3. [Professional] receives email and clicks upload link
   Data: Signed URL valid for 15 minutes
   System: Verifies JWT token in URL
   UI: Document upload form appears

4. [Professional] uploads CV document
   Data: CV file (PDF, max 5MB)
   System: Stores file in Supabase Storage
   System: Creates ProfessionalDocument record (CV, PENDING_UPLOAD status)
   System: Logs DOCUMENT_UPLOADED audit event
   UI: "Document uploaded. Awaiting verification."

5. [Admin] reviews documents
   System: Shows list of pending documents
   UI: Admin sees professional CV, can download/preview

6. [Admin] verifies document
   Data: Admin clicks "Verify" on CV
   System: Updates ProfessionalDocument (VERIFIED status, verified_at, verified_by)
   System: If all required docs verified, updates Professional (ACTIVE status)
   System: Logs DOCUMENT_VERIFIED audit event
   UI: Document marked verified, professional status updated
```

### 7. ALTERNATIVE FLOWS

Non-happy-path scenarios.

```
Alternative 7a: Professional uploads wrong document
  4a. [Professional] uploads Driving License instead of CV
  4a. [Admin] sees wrong document type
  4a. [Admin] clicks "Request Re-upload"
  4a. System: Updates ProfessionalDocument (re_upload_required=true)
  4a. System: Sends email "Please upload CV, not Driving License"
  4a. [Professional] uploads correct document (back to step 4)

Alternative 7b: Professional never uploads documents
  3b. [System] 24 hours pass without document upload
  3b. [System] Sends reminder email
  3b. [Professional] Still doesn't upload after 7 days
  3b. [Admin] Manually sets Professional (INACTIVE status)
  3b. System: Logs PROFESSIONAL_STATUS_CHANGED audit event
```

### 8. FAILURE SCENARIOS

What can go wrong and how is it handled?

```
Failure 8a: Email delivery fails
  Trigger: Professional email bounces
  Symptom: Admin doesn't know, professional doesn't get registration email
  Detection: System retries 3 times, logs warning
  Resolution: Admin receives notification "Email delivery failed for professional X"
  Remediation: Admin manually sends registration link or enters contact info

Failure 8b: File upload corrupted
  Trigger: Upload interrupted (network drop)
  Symptom: File incomplete in Supabase Storage
  Detection: File size smaller than expected, checksum mismatch
  Resolution: System rejects file, asks professional to re-upload
  Remediation: Professional re-uploads

Failure 8c: Background check system unavailable
  Trigger: External background check service is down
  Symptom: Document verification blocked
  Detection: API timeout after 30 seconds
  Resolution: Admin notified, can manually verify or wait for service recovery
  Remediation: Retry after service recovery
```

### 9. AUDIT EVENTS

What events does this workflow generate?

```
- PROFESSIONAL_REGISTERED: {professional_id, email, profession}
- DOCUMENT_UPLOADED: {document_id, document_type, file_hash}
- DOCUMENT_VERIFIED: {document_id, verified_by, expiry_set}
- PROFESSIONAL_STATUS_CHANGED: {professional_id, old_status, new_status, reason}
```

### 10. STATE TRANSITIONS

How does data state change through workflow?

```
Professional:
  ⚪ REGISTERED (initial, awaiting documents)
    ↓ [all required docs verified]
  🟢 ACTIVE (ready for assignment)
    ↓ [temporarily unavailable]
  🟡 INACTIVE
    ↓ [return to active]
  🟢 ACTIVE
    ↓ [permanently leave system]
  🔴 ARCHIVED

Document:
  ⚪ PENDING_UPLOAD (waiting for file)
    ↓ [file uploaded]
  🟡 UNVERIFIED (awaiting admin review)
    ↓ [admin verifies]
  🟢 VERIFIED (approved)
    ↓ [7 years pass]
  🔴 ARCHIVED (soft-deleted)
```

### 11. DATA TOUCHED

What data is created, read, updated, deleted?

```
Created:
  - Professional (register)
  - ProfessionalDocument (upload)

Read:
  - Professional (list, view)
  - ProfessionalDocument (list, view)

Updated:
  - Professional (status changes)
  - ProfessionalDocument (status, expiry, re_upload_required)

Not Deleted:
  - Hard delete never happens (soft delete only via status='ARCHIVED')
```

### 12. BUSINESS RULES

What must always be true?

```
- Only admin can register professionals (not self-service in MVP)
- Professional must have unique email (prevent duplicates)
- CV document required before status = ACTIVE
- Background check document required for certain professions
- Professional cannot be assigned cases until ACTIVE
- Professional cannot be deleted, only archived
- Document expiry must be future date (if set)
- Professional capacity_hours_week must be > 0
```

### 13. GDPR CONSIDERATIONS

What privacy/compliance issues apply?

```
Data Minimization:
  - Collect only: email, phone, profession, qualifications, experience
  - Do NOT collect: SSN, full address, criminal record (document only, not field)

Encryption:
  - Professional contact info not encrypted (necessary for communication)
  - No sensitive personal data in this workflow

Retention:
  - Professional data: Until archived + 1 year
  - Documents: With professional + 1 year
  - Audit events: 7 years

Right to Access:
  - Professional can request copy of own data

Right to Erasure:
  - Professional can be archived (soft delete)
  - Hard delete after retention period

Consent:
  - No explicit consent needed (service requirement)
```

### 14. OPEN QUESTIONS

What is ambiguous or needs clarification?

```
- Should professional be able to update own email? (Currently admin-only)
- How many documents required for each profession? (Currently: CV + criminal record)
- Should documents be signable? (Not in MVP)
- Can professional upload documents themselves, or only via admin upload link?
- What professions are supported? (Enum in architecture, but values TBD)
- Should professional profile be public (recruitment marketing)? (Phase 2 decision)
```

---

## MVP WORKFLOW INDEX

All workflows must be completed and approved before Technical Specification begins.

### FOUNDATIONAL WORKFLOWS

**WF-001: Professional Onboarding**
- Admin registers professional
- Professional uploads credentials
- Documents verified
- Professional activated

**WF-002: Municipality Inquiry to Case Creation**
- Municipality contacts Kursskifte
- Admin creates case from inquiry
- Case assigned complexity level
- Case grant budget allocated

**WF-003: Match Run and Assignment**
- Admin triggers matching algorithm
- System scores candidates
- Admin reviews scored candidates
- Admin selects and assigns professional

### OPERATIONAL WORKFLOWS

**WF-004: Case Activation**
- Professional assigned to case
- Case status transitions MATCHED → ACTIVE
- Professional receives notification
- Case begins

**WF-005: Session Documentation**
- Professional writes session log
- Observations, mood, follow-ups recorded
- Safeguarding flagged if needed
- Session logged as FINAL (immutable)

**WF-006: Registered Hours**
- Professional registers hours worked
- Hours submitted for review
- Hours pending approval
- Admin reviews and approves
- Hours counted toward grant

**WF-007: Outside Grant Review**
- Hours exceed grant budget
- Hours flagged as OUTSIDE_GRANT
- Admin reviews reason
- Admin approves/rejects
- Logged for compliance

### PROFESSIONAL LIFECYCLE WORKFLOWS

**WF-008: Professional Handover**
- Current professional unavailable
- Admin initiates handover
- Previous session logs shared
- New professional assigned
- Case continues without interruption

**WF-009: Contact Disclosure**
- Professional needs sagsbehandler contact info
- Admin approves disclosure
- Sagsbehandler contact info shared
- Disclosure logged (audit trail)

**WF-010: Contact Log**
- Professional contacts sagsbehandler
- Communication logged
- Outcome recorded
- Follow-up tracked

### DATA MANAGEMENT WORKFLOWS

**WF-011: Document Upload and Verification**
- Professional uploads credential document
- Document stored securely
- Admin verifies authenticity
- Document status tracked
- Expiry monitored

**WF-012: Case Closure and Archival**
- Case work complete
- Professional removed from case
- Case status → COMPLETED → ARCHIVED
- Session logs immutable
- Hours finalized

**WF-013: GDPR Retention and Deletion**
- Case archived 7 years ago
- System identifies for hard delete
- Data retention checked
- Hard delete executed
- Audit trail preserved

---

## WORKFLOW APPROVAL PROCESS

### Before Technical Specification Starts

1. **Draft** all 13 MVP workflows (WF-001 through WF-013)
2. **Review** with Hassan for business logic
3. **Refine** based on feedback
4. **Approve** workflows (Hassan sign-off)
5. **Lock** workflows (cannot change without new ADR)
6. **Only then** Technical Specification can begin

### Change Management

**After workflows are approved:**
- Workflow changes require new ADR
- New architecture version may be needed
- Technical Specification must be updated
- Code review must reference workflow

---

## RELATIONSHIP TO ARCHITECTURE

**Architecture defines:** What data exists, how it's stored, access control, audit requirements

**Workflows define:** How users interact with that data, in what sequence, with what business logic

**Technical Specification defines:** How to implement workflows with APIs, authentication, validation

```
Architecture (APPROVED)
    ↓
Workflows (IN PROGRESS)
    ↓
Technical Specification (PENDING)
    ↓
Code Implementation
```

---

## RELATIONSHIP TO USER STORIES

Workflows are **not** user stories (though related).

| Aspect | Workflow | User Story |
|--------|----------|-----------|
| **Scope** | End-to-end business process | Single user action |
| **Detail** | All steps, alternatives, failures | One feature |
| **Audience** | Product, design, engineering, ops | Engineering + design |
| **Timeline** | Written before code | Created during sprint |

**Workflows → User Stories → Tasks**

---

## DOCUMENTATION CONVENTIONS

### Formatting
- Use **bold** for emphasis (important rule, warning)
- Use `code` for field names, system messages, technical terms
- Use bullet lists for options/rules
- Use numbered lists for sequential steps

### Wording
- Active voice: "Admin clicks button" (not "Button is clicked")
- Clear actors: Always state who does what
- Specific actions: "enters email" (not "inputs data")
- System consequences: "System validates and stores" (not just "validated")

### Ambiguity Avoidance
- "MUST" = non-negotiable requirement
- "SHOULD" = best practice, but could be alternative
- "CAN" = optional or future consideration
- "TBD" = open question for approval

---

## FILE STRUCTURE

```
/docs/workflows/
├─ README.md (this file - standard & index)
├─ WF-001-professional-onboarding.md
├─ WF-002-municipality-inquiry-to-case.md
├─ WF-003-match-run-and-assignment.md
├─ WF-004-case-activation.md
├─ WF-005-session-documentation.md
├─ WF-006-registered-hours.md
├─ WF-007-outside-grant-review.md
├─ WF-008-professional-handover.md
├─ WF-009-contact-disclosure.md
├─ WF-010-contact-log.md
├─ WF-011-document-upload-verification.md
├─ WF-012-case-closure-archival.md
└─ WF-013-gdpr-retention-deletion.md
```

---

## CRITICAL RULE

### Technical Specification Cannot Begin Until Workflows Are Approved

**Lock:**
1. ✅ Architecture v1.0 is approved
2. ⏳ All 13 MVP workflows (WF-001 to WF-013) must be drafted
3. ⏳ All 13 MVP workflows must be reviewed and approved by Hassan
4. ❌ NO Technical Specification work starts until workflows are locked
5. ❌ NO code written before Technical Specification approval

---

## REFERENCES

- **Architecture:** `/docs/ARCHITECTURE_PRINCIPLES.md`
- **Decisions:** `/docs/DECISION_LOG.md`
- **Domain Model:** `/docs/DOMAIN_MODEL_DATABASE_SPEC.md`
- **Acceptance Criteria:** `/docs/ARCHITECTURE_ACCEPTANCE_CRITERIA.md`

---

**Document by:** Kursskifte Product & Architecture  
**Approved by:** Hassan  
**Status:** APPROVED STANDARD  
**Version:** 1.0  
**Next Step:** Draft all 13 MVP workflows (WF-001 to WF-013)
