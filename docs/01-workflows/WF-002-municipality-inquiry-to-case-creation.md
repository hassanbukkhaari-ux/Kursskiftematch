# WF-002: Municipality Inquiry to Case Creation

**Workflow:** Municipality Inquiry to Case Creation  
**Code:** WF-002  
**Status:** DRAFT  
**Priority:** P0 (Critical for MVP)  
**Version:** 1.0  
**Last Updated:** June 27, 2026  
**Owner:** Product Manager (Kurshshifte)

---

## 1. PURPOSE

Transform a municipality's initial contact requesting support for a citizen into a properly documented Case record with complete complexity assessment and grant information, ready for professional assignment.

---

## 2. ACTORS

- **Municipality Sagsbehandler** — Social services case worker at kommune requesting support
- **Kurshshifte** — Organization processing the inquiry and creating the case
- **Municipality** — The kommune itself (reference entity)

---

## 3. TRIGGER

Admin opens a municipality inquiry for review. The inquiry originates from one of two paths:

**Path A — Public website intake (via WF-015):**
- Sagsbehandler submits municipality inquiry form on kursskifte.dk
- WF-015 stages the submission as an `inbound_inquiries` record (`status = PENDING`, `submission_type = MUNICIPALITY_INQUIRY`)
- Admin receives `INQUIRY_RECEIVED` notification and opens the staged record in the admin portal
- Admin initiates conversion — WF-002 begins with the staged data pre-filled

**Path B — Direct admin entry:**
- Sagsbehandler contacts Kursskifte by phone or email
- Admin manually enters the inquiry directly in the admin portal
- WF-002 begins immediately (no `inbound_inquiries` record created for phone/email intake)

Note: "Online contact form submission" is **not** a direct trigger for WF-002. Public website form submissions are owned by WF-015. WF-002 begins only after admin initiates case creation from a staged or manually-entered inquiry.

---

## 4. PRECONDITIONS

- Kursskifte is operational
- Authorized Kursskifte staff available to process inquiries
- Municipality reference data is accessible (or admin creates a new municipality record as part of WF-002 Step 1)
- Complexity assessment factors are defined
- Grant determination process is established
- For Path A: a staged `inbound_inquiries` record exists with `submission_type = MUNICIPALITY_INQUIRY` and `status = PENDING` or `REVIEWED`

---

## 5. MAIN FLOW

### Step 1: Inquiry Reception

**Action:** Municipality submits inquiry for citizen support

The sagsbehandler provides:
- Citizen age range
- Primary and secondary support concerns
- Type of support needed
- Estimated weekly support hours
- Sagsbehandler contact information (name, email, phone)
- Municipality name

**Business Outcome:** Inquiry is documented and recorded

**Audit Event:** Inquiry received and registered

---

### Step 2: Information Gathering & Eligibility Verification

**Action:** Required information is verified

Kurshshifte gathers and verifies:

**Citizen Information:**
- Age range of citizen
- Safeguarding concerns identified
- Notes on citizen situation

**Support Needs:**
- Specific support required
- Estimated weekly hours for support
- Expected support duration (if known)

**Grant Information:**
- Municipality budget allocated for support
- Grant period (start and end dates)

**Background:**
- Previous support received
- Other agencies involved

**Eligibility Verification:**
- Municipality is known or can be identified
- Citizen age is within service scope
- Estimated weekly hours are reasonable
- Grant budget is confirmed
- At least one complexity factor is identifiable

**Business Outcome:** All required information is documented and verified

**Audit Event:** Eligibility check completed

---

### Step 3: Municipality Reference Record

**Action:** Municipality is verified or created

**If municipality exists:**
- Existing municipality record is linked
- Sagsbehandler contact information is verified

**If municipality is new:**
- Municipality record is created with:
  - Municipality name
  - Status (ACTIVE)
  - Sagsbehandler contact information

**Business Outcome:** Municipality is documented and linked to inquiry

**Audit Event:** Municipality verified or created

---

### Step 4: Complexity Assessment

**Action:** Case complexity is assessed from available information

Kurshshifte assesses the following factors from information provided:

- Mental health concerns or diagnoses
- Family instability
- School engagement issues
- Safety concerns or history of violence
- Substance use by citizen
- History of criminality
- Involvement of other agencies (school, child protection services, etc.)

**Complexity Level Determination:**

Complexity is determined by business rules applied to these factors:

- **CRITICAL:** Safety concerns present, OR substance use combined with multiple agencies
- **HIGH:** Mental health or diagnosed condition combined with family instability
- **MEDIUM:** Multiple complexity factors present (2 or more)
- **LOW:** Single or no complexity factors

**Business Outcome:** Complexity level is determined and documented

**Audit Event:** Complexity assessment completed

---

### Step 5: Grant Information Recording

**Action:** Municipality grant budget is documented

Kurshshifte records:
- Total grant hours allocated
- Grant period (start and end dates)
- Confirmation that budget has been approved

**Business Outcome:** Grant budget is documented and confirmed

**Audit Event:** Grant budget documented

---

### Step 6: Case Creation

**Action:** Case record is created

When all required information is complete and verified, a case is created containing:
- Municipality identification
- Citizen age range
- Citizen situation notes
- Estimated weekly hours required
- Assessed complexity level
- Linked grant budget
- Case status: ready for matching

**Business Outcome:** Case is created and ready for professional assignment

**Audit Event:** Case created

---

### Step 7: Confirmation & Next Steps

**Action:** Case creation is confirmed

Municipality is notified that:
- Case has been successfully created
- Complexity assessment is complete
- Grant budget is approved and allocated
- Case is ready for professional matching
- Kurshshifte will proceed with finding a suitable professional

**Business Outcome:** Case is documented and ready for professional assignment workflow

**Audit Event:** Case ready for matching

**End of Workflow:** Case is prepared for WF-003 (Match Run and Assignment)

---

## 6. ALTERNATIVE FLOWS

### Alternative 6a: Clarification Required on Complexity Assessment

**Trigger:** Information provided is unclear or contradictory

**Resolution:**
- Kurshshifte requests clarification from the municipality
- Municipality provides additional information
- Complexity factors are updated
- Complexity level is recalculated
- Workflow resumes at Step 5

---

### Alternative 6b: Grant Amount Negotiation

**Trigger:** Requested grant budget differs from Kurshshifte expectations

**Resolution:**
- Kurshshifte discusses expected hours and budget with municipality
- Municipality and Kurshshifte agree on appropriate grant amount
- Grant information is updated
- Workflow resumes at Step 6

---

### Alternative 6c: Complexity Reassessment

**Trigger:** Initial complexity assessment does not align with available information

**Resolution:**
- Complexity factors are reviewed for accuracy
- Additional clarification is sought if needed
- Complexity level is recalculated
- Workflow resumes at Step 5

---

### Alternative 6d: Citizen Already Registered

**Trigger:** Inquiry relates to a citizen who already has an active case

**Resolution:**
- Kurshshifte identifies the existing case
- Kurshshifte determines whether this is:
  - A duplicate inquiry (merged, no new case created)
  - A request for additional support (new case created with coordination noted)
- If duplicate: inquiry marked as converted to existing case, workflow ends
- If new support: process continues as new case

---

## 7. FAILURE SCENARIOS

### Failure 7a: Municipality Cannot Be Identified

**Trigger:** Provided municipality name cannot be matched to records

**Impact:**
- Case creation cannot proceed
- Support request delayed

**Resolution:**
- Municipality record is created with provided information
- Sagsbehandler contact details are verified and recorded
- Case creation resumes

**Prevention:**
- Comprehensive municipality reference database at launch
- Clear guidance for Kurshshifte staff on identifying municipalities

---

### Failure 7b: Required Contact Information Incomplete

**Trigger:** Sagsbehandler contact details are missing or incomplete

**Impact:**
- Kurshshifte cannot contact municipality for follow-up
- Future communication impossible
- Case creation blocked

**Resolution:**
- Kurshshifte requests missing information
- Municipality provides complete contact details
- Municipality record is updated
- Case creation resumes

**Prevention:**
- Contact information checklist provided to Kurshshifte staff
- Clear requirement that sagsbehandler contact is mandatory

---

### Failure 7c: Conflicting Information on Complexity Factors

**Trigger:** Information provided contains contradictions

**Impact:**
- Complexity assessment uncertain
- Risk of incorrect complexity determination
- Professional assignment may be inappropriate

**Resolution:**
- Kurshshifte seeks clarification from municipality
- Municipality confirms accurate information
- Complexity factors are corrected
- Complexity level is recalculated
- Case creation resumes

**Prevention:**
- Clear definitions of complexity factors provided to municipalities
- Structured information gathering minimizes ambiguity

---

### Failure 7d: Requested Grant Exceeds Available Budget

**Trigger:** Municipality requests more support hours than available budget allows

**Impact:**
- Case cannot be created with requested budget
- Case creation delayed

**Resolution:**
- Kurshshifte discusses available budget with municipality
- Municipality adjusts grant request to fit available budget
- Grant is documented with agreed amount
- Case creation resumes

**Prevention:**
- Municipalities provided with budget information upfront
- Grant amount negotiation is expected in workflow design

---

### Failure 7e: Complexity Assessment Cannot Be Completed

**Trigger:** Provided information does not fit complexity assessment model

**Impact:**
- Complexity level cannot be determined
- Case creation blocked

**Resolution:**
- Kurshshifte seeks additional information from municipality
- Complexity factors are reassessed with new information
- If still unclear, Kurshshifte management reviews and determines appropriate complexity level
- Case creation resumes

**Prevention:**
- Complexity factor definitions are clear and comprehensive
- Kurshshifte staff training on complexity assessment

---

### Failure 7f: Required Information Missing or Incomplete

**Trigger:** Submitted information does not meet requirements

**Impact:**
- Case creation blocked
- Support request delayed

**Resolution:**
- Missing or incomplete information is identified
- Kurshshifte requests complete information from municipality
- Complete information is provided
- Case creation resumes

**Prevention:**
- Clear requirements for all necessary information
- Information checklist provided to municipalities

---

## 8. AUDIT EVENTS

Every significant action in this workflow generates an audit event for accountability and compliance.

| Step | Event | Documentation |
|------|-------|---|
| 1 | Inquiry Received | Inquiry ID, submission method, municipality, sagsbehandler |
| 2 | Eligibility Verified | Inquiry ID, municipality, citizen age range, eligible status |
| 3 | Municipality Recorded | Municipality ID, municipality name, sagsbehandler contact |
| 4 | Complexity Assessed | Case complexity factors identified, complexity level determined |
| 5 | Grant Documented | Grant amount, period, municipality, approval status |
| 6 | Case Created | Case ID, municipality, complexity level, weekly hours, created by |
| 7 | Ready for Matching | Case ID, status confirmed, ready for next workflow |

**Privacy Principle:** Audit events record only administrative facts and decisions, never sensitive citizen information.

---

## NOTIFICATION EVENTS

WF-002 emits the following notification event. The workflow records the notification type and recipient — it does not specify delivery channel. Channel assignment is owned by WF-014 (Notification Dispatch, ADR-010).

| Notification Type | Recipient | Trigger |
|---|---|---|
| `CASE_CREATED` | Admin (system email) | Case record created with status = OPEN — case is queued for professional assignment |

**Notes:**
- `CASE_CREATED` fires at Step 6 when all required information is verified and the case record is successfully created.
- The notification signals to admin that a new case has entered the matching queue. It does not include citizen details, complexity information, or grant amounts in the notification body (ADR-004 — no sensitive operational data in notifications).
- Recipient is the system admin inbox configured via `SYSTEM_ADMIN_EMAIL`. WF-014 owns recipient resolution and delivery.

---

## 9. STATE TRANSITIONS

### Inquiry Status

```
NEW → CONTACTED → CONVERTED (to Case)
                ↓
              ARCHIVED
```

### Case Status

```
OPEN (created, not yet matched)
  ↓
MATCHED (professional assigned)
  ↓
ACTIVE (support begins)
```

### Municipality Status

```
ACTIVE (operational, accepting cases)
  ↓
INACTIVE (no new cases)
  ↓
ARCHIVED (no longer working with Kurshshifte)
```

### Grant Status

```
PENDING (created, awaiting confirmation)
  ↓
ACTIVE (budget allocated)
  ↓
ARCHIVED (historical record)
```

---

## 10. DATA TOUCHED

### Data Created

| Entity | Purpose |
|--------|---------|
| Inquiry | Track original contact and request |
| Municipality | Reference data for case organization |
| Case | Primary case record with citizen and support details |
| CaseComplexityFactors | Documented complexity assessment |
| CaseGrant | Budget allocation record |

### Data Accessed

| Entity | Purpose |
|--------|---------|
| Municipality (existing) | Verify municipality exists and link to inquiry |
| Inquiry (input) | Provide details for processing |

### Data Updated

| Entity | Purpose |
|--------|---------|
| Inquiry | Link to created case record |
| Municipality | Contact information confirmed (if needed) |

### Data Retention

- No permanent deletion during this workflow
- All data retained according to retention policy
- Inquiry data: 2 years (or merged with case retention if converted)
- Case data: 7 years from completion (social services statute of limitations)

---

## 11. BUSINESS RULES

**Core Rules (Non-negotiable):**

1. **Unique Case Per Inquiry**
   - One inquiry results in one case (no duplicates)
   - If citizen has existing case, evaluate alternatives

2. **Consistent Complexity Assessment**
   - Same factors always produce same complexity level
   - Complexity determination is deterministic, not subjective

3. **Minimum Required Information**
   - Citizen age range
   - Citizen situation notes
   - At least one complexity factor identifiable
   - Municipality identified
   - Sagsbehandler contact information
   - Weekly support hours estimate
   - Grant budget amount

4. **Sagsbehandler Always Recorded**
   - Name, email, phone of requesting sagsbehandler documented
   - Used for all future communication
   - Contact information is mandatory

5. **Grant Budget Must Be Positive**
   - Grant hours must be greater than zero
   - Grant period must be valid
   - No zero-hour grants

6. **Weekly Hours Must Be Realistic**
   - Between 0.5 hours per week minimum (half-session)
   - 40 hours per week maximum (full-time)
   - Hours outside this range require documented approval

7. **Case Ready for Matching Only When Complete**
   - All required fields populated
   - Complexity assessment complete
   - Grant allocated
   - Audit trail complete
   - Case status confirms ready for matching

---

## 12. GDPR CONSIDERATIONS

### Data Minimization

Kurshshifte collects only information necessary for case creation and professional matching:

**Information Collected:**
- Citizen age range
- Citizen situation notes
- Support type and weekly hours
- Municipality and sagsbehandler contact information

**Information NOT Collected:**
- Full citizen names
- Citizen identification numbers
- Citizen address
- Citizen contact details
- Full sagsbehandler credentials

### Sensitive Information Protection

Sensitive case information (safeguarding concerns, family details, complexity assessment notes) is restricted from unauthorized access. Only authorized Kurshshifte staff and assigned professionals can access case details.

### Retention Policy

**Inquiry:**
- Retained for 2 years
- If converted to case, retention follows case retention schedule
- If not converted, deleted after 2 years

**Case:**
- Retained for 7 years from case completion
- Justification: Social services statute of limitations
- After retention period, data is deleted

### Right to Access

Citizens may request access to their case information through the municipality sagsbehandler. Provided information includes case overview, citizen age, support details, and support history.

### Right to Erasure

After the 7-year retention period, all case data is deleted. Citizens may request deletion of archived cases by contacting the municipality.

### Lawful Processing

Case creation is lawful because:
- Municipality has statutory duty to arrange support for citizens
- Kurshshifte is contracted service provider
- Both parties have legal obligation to document support services
- No explicit consent required; legal obligation to document is sufficient under Danish social services law

---

## 13. OPEN QUESTIONS

**Decisions Required:**

1. **Grant Structure:** Should cases have multiple grants per period (monthly, quarterly) or single grant per fiscal year?

2. **Complexity Factors:** Are the seven identified factors sufficient? Should others be added (e.g., neurodiversity, trauma history)?

3. **Weekly Hours:** How should estimated hours be handled if sagsbehandler provides a range (e.g., "2-4 hours")? Round, average, or ask for commitment?

4. **Safeguarding Protocol:** Should workflow pause if safeguarding concerns identified? Require safety planning before case creation?

5. **Complexity Appeals:** If calculated complexity level seems inconsistent with case details, who reviews and can override?

6. **Duplicate Detection:** How detailed should duplicate citizen checking be? By initials and age only, or additional factors?

7. **Budget Limits:** Should there be hard limits on grant hours per case? How should exceptions be handled?

---

## 14. ASSUMPTIONS

**Workflow Assumes:**

1. **Municipality Database Pre-populated:** All Danish municipalities in system before launch

2. **Sagsbehandler Provides Accurate Information:** Phone/email conversation captures correct details

3. **Complexity Factors Are Sufficient:** Seven factors capture complexity for all cases

4. **Grant Budget Is Year-Based:** Municipalities allocate budget per fiscal year

5. **Citizen Initials Unique Within Municipality:** Sufficient to identify within kommune context

6. **Sagsbehandler Contact Stable:** Sagsbehandler contact won't change during support period

7. **Weekly Hours Estimate Reasonable:** Initial estimate is close to actual support needed

---

## 15. BUSINESS RULES SUMMARY

### Information Requirements

| Information | Required | Format | Constraint |
|---|---|---|---|
| Citizen age range | Yes | Enum (0-5, 6-12, 13-18, 18+) | Must match service scope |
| Citizen notes | Yes | Free text | Minimum required, no length limit |
| Support type | Yes | Free text | At least one type specified |
| Weekly hours | Yes | Decimal number | 0.5 to 40 hours |
| Grant hours | Yes | Decimal number | Greater than zero |
| Grant period | Yes | Date range | End date ≥ start date |
| Municipality | Yes | Reference to municipality | Must exist or be created |
| Sagsbehandler name | Yes | Free text | Mandatory |
| Sagsbehandler email | Yes | Email format | Mandatory |
| Sagsbehandler phone | Yes | Phone format | Mandatory |

---

## 16. GLOSSARY

| Term | Definition |
|---|---|
| **Sagsbehandler** | Danish social services case worker managing citizen case |
| **Kommune** | Danish municipality |
| **Fagperson** | Professional social services provider (mentor, pedagogue, etc.) |
| **Borger** | Citizen receiving support |
| **Indsatsplan** | Support plan (created in follow-up workflow) |
| **Complexity Factors** | Seven structured criteria assessing case difficulty |
| **Grant** | Municipality budget allocated to specific case |
| **Safeguarding** | Flag indicating child protection or safety concerns |

---

## 17. SUCCESS CRITERIA

The workflow is complete only when ALL of the following conditions are met:

✅ **Municipality Identified or Created**
- Municipality record exists and is linked to case

✅ **Required Case Information Recorded**
- Citizen age range documented
- Citizen situation notes documented
- Support type specified
- Weekly hours estimated
- Sagsbehandler contact information complete

✅ **Grant Information Recorded**
- Grant hours amount documented
- Grant period documented
- Grant status confirmed

✅ **Complexity Assessment Completed**
- All complexity factors evaluated
- Complexity level determined
- Assessment documented

✅ **Case Created**
- Case record exists with all required fields
- Case linked to municipality
- Case linked to complexity factors
- Case linked to grant

✅ **Required Audit Events Generated**
- All workflow steps logged
- Decisions documented
- Audit trail complete

✅ **Case Status Confirmed Ready for Matching**
- Case status = OPEN (case is queued for matching — OPEN is the database status at this point)
- All validation passed
- Case prepared for WF-003

✅ **WF-003 Can Begin**
- Case is queued for matching
- Professional search can commence

---

## 18. WORKFLOW OUTPUTS

After successful completion of WF-002, the following business objects exist:

- **Municipality** — Reference record (existing or newly created)
- **Case** — Primary case record for citizen support
- **Case Complexity Factors** — Documented assessment of case complexity
- **Case Grant** — Budget allocation record
- **Audit Events** — Complete workflow documentation trail

These outputs become inputs for WF-003 (Match Run and Assignment).

---

## 19. WORKFLOW DEPENDENCIES

### Inputs Required

- **Municipality Inquiry** — Request from sagsbehandler for citizen support
- **Authorized Kurshshifte Staff** — Person with authority to create cases
- **Required Case Information** — Details about citizen, support needs, grant budget

### Outputs Delivered

- **Ready-for-Matching Case** — Fully documented case ready for professional assignment

### Subsequent Workflow

- **WF-003: Match Run and Assignment** — Begins immediately after case creation, searches for and assigns suitable professional

### Blocking Dependencies

This workflow must complete before:
- Professional search can begin
- Citizen support can be arranged
- Budget can be allocated

### Data Feeding Subsequent Workflows

- Case ID flows to WF-003 (matching)
- Case ID flows to WF-005 (session documentation)
- Case ID flows to WF-006 (registered hours)
- Case ID flows to WF-007 (grant review)

---

## 20. STAKEHOLDER SUMMARY

### For Product Owner
This workflow establishes the business foundation for case management. It ensures all required information is gathered, complexity properly assessed, and budget allocated before professional assignment begins. Non-negotiable validation rules ensure consistent case quality.

### For Municipality Sagsbehandler
Contact Kurshshifte with citizen support request. Provide information about the citizen's situation, support needs, and available budget. Kurshshifte will create the case, assess complexity, and confirm the case is ready for professional matching within [timeline].

### For Kurshshifte Staff
Follow the seven steps in sequence. Gather all required information, verify eligibility, assess complexity using provided rules, document the grant, and create the case. All actions are logged for compliance. Refer to the business rules table for information requirements.

### For Developers
This workflow defines the business logic for case creation. Required entities: Municipality, Case, CaseComplexityFactors, CaseGrant. Required actions: Create/link these entities, apply complexity rules, generate audit events. No API endpoints, no database schema, no implementation details—purely business process.

---

## 21. DECISION GATES

The workflow includes five critical decision gates where authorized staff review information and determine next steps. Each gate controls whether the workflow can proceed or must loop back for additional information.

### Gate 1: Accept Inquiry

**Decision:** Should the municipality's inquiry be accepted for processing?

**Decision Owner:** Kurshshifte Administrator

**Required Information:**
- Municipality identified (known or can be established)
- Service requested is within Kurshshifte scope
- Contact person available for communication

**Possible Outcomes:**
- **ACCEPT** — Proceed to Step 2 (Information Gathering)
- **REQUEST MORE INFORMATION** — Return to municipality for clarification, then re-evaluate
- **REJECT** — Decline inquiry (outside scope, insufficient information, resource unavailable)

**Next Step:** If accepted, proceed to Step 2

---

### Gate 2: Create or Link Municipality

**Decision:** Is the municipality known to Kurshshifte, or must a new municipality record be created?

**Decision Owner:** Kurshshifte Administrator

**Required Information:**
- Municipality name provided by sagsbehandler
- Municipality database search results
- Reference data for new municipality (if applicable)

**Possible Outcomes:**
- **USE EXISTING MUNICIPALITY** — Link inquiry to known municipality record, proceed
- **CREATE NEW MUNICIPALITY** — Create municipality record with provided details, proceed
- **CANNOT IDENTIFY** — Stop workflow, request clarification from sagsbehandler

**Next Step:** If resolved, proceed to Step 3 (Eligibility Verification)

---

### Gate 3: Complexity Assessment Approved

**Decision:** Has complexity been properly assessed and is the determined complexity level appropriate?

**Decision Owner:** Kurshshifte Administrator

**Required Information:**
- All complexity factors evaluated
- Weekly support hours defined
- Complexity level calculated per business rules

**Possible Outcomes:**
- **LOW** — Complexity = LOW, proceed to grant decision
- **MEDIUM** — Complexity = MEDIUM, proceed to grant decision
- **HIGH** — Complexity = HIGH, proceed to grant decision
- **CRITICAL** — Complexity = CRITICAL, proceed to grant decision with heightened scrutiny
- **NEEDS CLARIFICATION** — Information contradictory or insufficient, return to municipality for additional details

**Next Step:** If approved, proceed to Step 5 (Grant Information Recording)

---

### Gate 4: Grant Accepted

**Decision:** Is the requested grant budget appropriate for the support scope and citizen complexity?

**Decision Owner:** Kurshshifte Administrator

**Required Information:**
- Grant amount (hours) requested
- Weekly support hours required
- Grant period (start and end dates)
- Complexity level (from Gate 3)

**Possible Outcomes:**
- **ACCEPT** — Grant approved as requested, proceed to case creation
- **CLARIFY** — Grant amount unclear or requires negotiation with municipality, return to municipality
- **REJECT** — Grant insufficient or excessive, return to municipality with revised proposal

**Next Step:** If accepted, proceed to Step 6 (Case Creation)

---

### Gate 5: Case Ready For Matching

**Decision:** Has the case been properly documented and is it ready to enter the matching workflow?

**Decision Owner:** Kurshshifte Administrator

**Required Information:**
- All mandatory case information completed
- Complexity assessment documented
- Grant budget confirmed
- Audit trail complete
- Case status is OPEN (case passes all quality checks and is ready for matching)

**Possible Outcomes:**
- **OPEN (ready for matching)** — Case passes all quality checks; status = OPEN in the database, case is queued for matching, proceed to WF-003
- **RETURN TO PREVIOUS STEP** — Information gap identified, case returned to earlier step for correction

**Next Step:** If ready, proceed to WF-003 (Match Run and Assignment)

---

## 22. RESPONSIBILITY HANDOFFS

The workflow involves three critical handoffs where responsibility for the case transitions from one role to another. Each handoff is explicitly documented to ensure clear ownership and prevent gaps in accountability.

### Handoff 1: Municipality Sagsbehandler → Kurshshifte Administrator

**Trigger:** Inquiry received and accepted at Gate 1

**Responsibility Ending:**
- Municipality sagsbehandler's responsibility to submit inquiry ends
- Municipality relinquishes direct control of case creation process
- Municipality no longer needs to gather additional information (unless requested)

**Responsibility Starting:**
- Kurshshifte administrator now owns inquiry processing
- Kurshshifte assumes responsibility for validation and assessment
- Kurshshifte becomes single point of contact for case status

**Information That Must Exist Before Handoff:**
- Municipality identified or identifiable
- Service requested is within scope
- Sagsbehandler contact information (name, email, phone)
- Citizen situation description
- Support type and estimated weekly hours
- Grant budget indication

**Information That Must NEVER Be Transferred:**
- Full citizen identification numbers (CPR, ID)
- Citizen home address
- Citizen phone/email (sagsbehandler is intermediary)
- Confidential case worker notes unrelated to support needs
- Administrative internal municipality communications

**Audit Event Proving Handoff:**
- **CASE_ELIGIBILITY_CHECKED** — Kurshshifte acknowledges receipt and validates inquiry
- Audit entry shows: inquiry_id, municipality_id, eligible=true

**Outcome After Handoff:**
- Municipality waits for case creation confirmation
- Kurshshifte proceeds with information gathering and validation
- Two-way communication channel open between roles

---

### Handoff 2: Kurshshifte Administrator → Kurshshifte Case Management

**Trigger:** Case created (Gate 5 passes, case status = OPEN — case is queued for matching)

**Responsibility Ending:**
- Administrator's responsibility for case creation ends
- Administrator no longer manages inquiry validation decisions
- Administrator's role in complexity assessment and grant approval concludes

**Responsibility Starting:**
- Case Management assumes ownership of case lifecycle
- Case Management becomes responsible for case coordination throughout support
- Case Management monitors case status, grant usage, professional assignment
- Case Management tracks case from OPEN (matching queue) through completion

**Information That Must Exist Before Handoff:**
- Case record created and linked to municipality
- All complexity factors documented and assessed
- Complexity level determined (LOW, MEDIUM, HIGH, CRITICAL)
- Grant budget allocated and confirmed
- All audit events generated for case creation
- Case status is OPEN (case is ready for matching)
- All required documentation complete and validated

**Information That Must NEVER Be Transferred:**
- Administrator's internal validation notes/doubts
- Rejected alternative complexity levels or grant amounts
- Internal communications about municipalities or citizens
- Confidential assessments not part of official case record

**Audit Event Proving Handoff:**
- **CASE_CREATED** — Case record created with all required fields
- **CASE_READY_FOR_MATCHING** — Case passes final quality checks
- Audit entries show: case_id, municipality_id, complexity_level, grant_amount, created_by, ready_for_matching=true

**Outcome After Handoff:**
- Case Management receives queued case
- Administrator available for new inquiries
- Case now enters matching workflow (WF-003)
- Continued communication via case updates, not direct administrator access

---

### Handoff 3: Kurshshifte Case Management → WF-003 Matching Process

**Trigger:** Case status = OPEN (formal queue entry — case is queued for matching)

**Responsibility Ending:**
- Case Management responsibility for case creation and validation ends
- Case Management no longer controls case eligibility decisions
- Case Management's role in determining complexity and grant closes

**Responsibility Starting:**
- Matching Process (WF-003) assumes responsibility for professional search
- Matching Process owns professional candidate evaluation
- Matching Process owns case assignment decisions
- Matching Process becomes responsible for case from professional assignment forward

**Information That Must Exist Before Handoff:**
- Complete case record with all required fields
- Complexity level documented and finalized (not provisional)
- Grant budget confirmed and allocated
- Municipality and sagsbehandler contact information verified
- All audit trail complete for case creation workflow
- No outstanding questions or clarifications needed
- Case status is OPEN (case is queued for matching)

**Information That Must NEVER Be Transferred:**
- Internal assessment discussions about complexity level accuracy
- Alternative professional profiles considered (if any)
- Municipal budget constraints beyond what's documented in grant
- Preliminary or rejected case information
- Administrator's doubts about citizen or municipality

**Audit Event Proving Handoff:**
- **CASE_READY_FOR_MATCHING** — Case formally queued for WF-003
- Audit entry shows: case_id, status=OPEN, timestamp, ready_for_next_workflow=true

**Outcome After Handoff:**
- Matching Process begins professional search
- Case Management maintains case oversight but no longer controls matching decisions
- Clear separation: WF-002 (case creation) complete, WF-003 (professional assignment) begins
- Case data flows from Case Management to Matching Process via documented handoff

---

### Handoff Summary Table

| # | From Role | To Role | Trigger | What Transfers | Audit Event |
|---|-----------|---------|---------|---|---|
| 1 | Municipality Sagsbehandler | Kurshshifte Administrator | Inquiry accepted | Inquiry details, scope, contact | CASE_ELIGIBILITY_CHECKED |
| 2 | Kurshshifte Administrator | Case Management | Case created | Complete case record | CASE_CREATED, CASE_READY_FOR_MATCHING |
| 3 | Case Management | WF-003 Matching | Ready for matching | Ready-to-match case | CASE_READY_FOR_MATCHING |

---

## RESPONSIBILITY OWNERSHIP VERIFICATION

Every step in the workflow must belong to exactly one responsible role. Review of WF-002 main flow:

| Step | Responsible Role | Owned By | Shared? |
|------|---|---|---|
| Step 1: Inquiry Reception | Municipality Sagsbehandler | ✅ Exclusive | No |
| Step 2: Information Gathering | Kurshshifte Administrator | ✅ Exclusive | No |
| Step 3: Municipality Record | Kurshshifte Administrator | ✅ Exclusive | No |
| Step 4: Complexity Assessment | Kurshshifte Administrator | ✅ Exclusive | No |
| Step 5: Grant Information | Kurshshifte Administrator | ✅ Exclusive | No |
| Step 6: Case Creation | Kurshshifte Administrator | ✅ Exclusive | No |
| Step 7: Confirmation | Kurshshifte Administrator | ✅ Exclusive | No |

**All steps have unambiguous, exclusive ownership.**

### Alternative Flows Ownership

| Alternative | Responsible Role | Owned By | Shared? |
|---|---|---|---|
| 6a: Clarification | Kurshshifte Administrator | ✅ Exclusive | No |
| 6b: Grant Negotiation | Kurshshifte Administrator | ✅ Exclusive | No |
| 6c: Complexity Reassessment | Kurshshifte Administrator | ✅ Exclusive | No |
| 6d: Duplicate Detection | Kurshshifte Administrator | ✅ Exclusive | No |

**All alternatives have unambiguous, exclusive ownership.**

### Decision Gates Ownership

| Gate | Decision Owner | Owned By | Shared? |
|---|---|---|---|
| Gate 1: Accept Inquiry | Kurshshifte Administrator | ✅ Exclusive | No |
| Gate 2: Municipality Create/Link | Kurshshifte Administrator | ✅ Exclusive | No |
| Gate 3: Complexity Assessment | Kurshshifte Administrator | ✅ Exclusive | No |
| Gate 4: Grant Accepted | Kurshshifte Administrator | ✅ Exclusive | No |
| Gate 5: Ready for Matching | Kurshshifte Administrator | ✅ Exclusive | No |

**All decision gates have unambiguous, exclusive ownership.**

---

## 23. WORKFLOW KPIs


The following business metrics track the health and efficiency of the case creation workflow. These KPIs help Kurshshifte understand process performance and identify improvement opportunities.

### Volume Metrics

**Inquiries Received**
- Number of inquiries from municipalities per month
- Trend over time
- Growth indicates market demand

**Inquiries Converted to Cases**
- Number of inquiries that result in created cases
- Percentage of inquiries converted
- Identifies bottlenecks or rejection points

**Cases Created**
- Number of cases successfully created per month
- Trend over time
- Indicates service capacity utilization

---

### Quality Metrics

**Inquiries Requiring Clarification**
- Percentage of inquiries requiring additional information from municipality
- Indicates clarity of initial requests
- Lower percentage suggests better communication with municipalities

**Cases Requiring Complexity Reassessment**
- Percentage of cases where complexity was re-evaluated after initial assessment
- Indicates assessment accuracy
- Lower percentage suggests better assessment training

**Grant Negotiations**
- Percentage of cases where grant amount was negotiated
- Indicates accuracy of budget estimates
- Helps refine expectations with municipalities

---

### Complexity Distribution

**Cases by Complexity Level**
- Distribution of cases across LOW, MEDIUM, HIGH, CRITICAL
- Trend over time
- Indicates citizen population characteristics

**Average Complexity Level**
- Mean complexity across all cases
- Trend over time
- Guides resource planning

---

### Support Volume Metrics

**Average Weekly Hours per Case**
- Mean weekly support hours across all cases
- Trend over time
- Indicates citizen support needs

**Weekly Hours by Complexity Level**
- Average weekly hours for each complexity level (LOW, MEDIUM, HIGH, CRITICAL)
- Validates relationship between complexity and support intensity

**Average Grant Size**
- Mean grant hours (total budget) across all cases
- Trend over time
- Indicates municipality budgets

**Grant Size by Complexity Level**
- Average grant hours for each complexity level
- Validates relationship between complexity and budget allocation

---

### Timeline Metrics

**Time from Inquiry to Case Creation**
- Average days from inquiry received to case created
- Trend over time
- Targets: <5 business days
- Indicates workflow efficiency

**Time from Inquiry to Ready for Matching**
- Average days from inquiry received to case ready for WF-003
- Trend over time
- Targets: <7 business days
- Indicates total case creation cycle efficiency

**Clarification Delay**
- Average days cases spend awaiting clarification from municipality
- Trend over time
- Indicates response time of municipalities

---

### Decision Gate Metrics

**Acceptance Rate at Gate 1**
- Percentage of inquiries accepted vs. rejected/paused
- Indicates relevance of inquiries

**Complexity Assessment Pass Rate at Gate 3**
- Percentage requiring no reassessment
- Indicates assessment quality

**Grant Acceptance Rate at Gate 4**
- Percentage of grant requests accepted without negotiation
- Indicates estimate accuracy

**Case Readiness Pass Rate at Gate 5**
- Percentage of cases passing ready-for-matching check on first attempt
- Indicates documentation completeness

---

### Municipality Engagement Metrics

**Municipalities Served**
- Count of unique municipalities submitting inquiries
- Trend over time
- Indicates market penetration

**Repeat Municipality Rate**
- Percentage of inquiries from municipalities that previously submitted inquiries
- Indicates client retention and satisfaction

**Average Cases per Municipality**
- Mean number of cases created per municipality
- Trend over time
- Identifies high-volume municipalities

---

### Performance Targets (Examples)

These targets should be established based on Kurshshifte's business goals:

| Metric | Target | Rationale |
|--------|--------|-----------|
| Inquiries converted | 85%+ | Most inquiries should become cases |
| Clarification required | <15% | Most inquiries should be clear initially |
| Case creation cycle | <5 days | Quick turnaround improves satisfaction |
| Ready-for-matching cycle | <7 days | Timely handoff to matching workflow |
| Acceptance rate (Gate 1) | 80%+ | Most inquiries should be eligible |
| Grant acceptance (Gate 4) | 70%+ | Most grant requests should be reasonable |
| Readiness pass rate (Gate 5) | 95%+ | Documentation quality should be high |

---

## 23. USING THESE KPIs

**Purpose:** These metrics are for business decision-making, not technical monitoring.

**Applications:**

1. **Trend Analysis** — Are inquiry volumes growing? Is case creation becoming faster? Are municipalities satisfied?

2. **Bottleneck Identification** — Where do cases get stuck? Which gates reject most inquiries?

3. **Resource Planning** — How many inquiries can Kurshshifte staff handle? What's the peak capacity?

4. **Client Communication** — What should municipalities expect? What's our typical turnaround?

5. **Product Improvement** — Are complexity assessment rules working? Should we refine them?

6. **Market Understanding** — Which municipalities are most active? What complexity levels are most common?

**Not For:**
- System performance monitoring (response times, uptime)
- Technical capacity planning (servers, databases)
- Implementation details (system load, query performance)
- Infrastructure decisions

---

**Document Status:** DRAFT (awaiting Hassan approval)  
**Refinement Date:** June 27, 2026  
**Additions:** Decision Gates (5 gates documented), Workflow KPIs (business metrics only)
