# Domain, Actors, and Responsibility Model

**Document Purpose:** Establish clarity on what Kurshshifte is, what Kurshshifte-Match is, who the actors are, and how responsibilities are separated.

**Scope:** Foundation for all workflows WF-001 through WF-013.

**Status:** DRAFT  
**Version:** 1.1  
**Last Updated:** June 27, 2026

---

## KEY PRINCIPLE: Business Role vs System Role

This document distinguishes between:
- **Business Role** = What a person does in the organization (e.g., "Case Coordinator")
- **System Role** = What permissions they have in the platform (e.g., "Admin")

Example: Three people might all be "Case Coordinators" with the "Admin" system role, but with different areas of focus (Intake, Matching, Operations). The documentation uses the business role name to remain scalable and organization-independent.

---

## 1. PURPOSE

This document prevents confusion between the Kurshshifte company, the Kurshshifte-Match platform, and the various external and internal actors. It establishes:

- Who is responsible for what
- Which roles use the platform in MVP
- Which roles do not use the platform
- Platform boundaries (what the system does and does not do)
- Responsibility boundaries (who owns what decisions)
- Data access boundaries (who can see what information)

**This document is foundational.** All workflows WF-001 through WF-013 must be consistent with these definitions.

---

## 2. WHAT KURSHSHIFTE DOES

### The Business in One Paragraph

Kurshshifte ApS is a Danish service provider that helps municipalities arrange social and educational support for vulnerable young people and adults. When a municipality identifies a citizen who needs structured support—mentorship, engagement assistance, family coordination, or similar—the municipality contacts Kurshshifte. Kurshshifte evaluates the request, assesses complexity and support needs, identifies a suitable professional from its network, arranges the match, and then manages the support relationship including documentation, hours, and quality oversight. The municipality funds the support through grants allocated per case. Kurshshifte's platform, Kurshshifte-Match, helps organize cases, manage professional profiles, document support work, track hours and budgets, and coordinate handovers.

---

## 3. ACTOR DEFINITIONS

### Actor 1: Kurshshifte ApS

**What it is:** A Danish registered company providing social support coordination services.

**In simpler terms:** The company that organizes the matching and coordination of support.

**Owned by:** Hassan (founder/operator)

**Employees include:** Various staff members who may serve as Case Coordinators, Match Coordinators, Operations Coordinators, managers, quality officers, etc.

**Responsibility:** 
- Receive case requests from municipalities
- Assess cases for complexity and support requirements
- Search and select suitable professionals
- Arrange matches between professionals and citizens
- Manage the platform
- Document all work
- Track hours and grant usage
- Ensure quality of support
- Handle professional changes and handovers

**Legal standing:** Kurshshifte ApS is responsible to municipalities for the quality and completion of support services.

**Relationship:** Contractual agreements with municipalities defining scope, quality standards, and payment.

---

### Actor 2: Kurshshifte-Match

**What it is:** A digital platform (software system) that Kurshshifte ApS uses to organize its work.

**In simpler terms:** A tool that helps Kurshshifte keep track of cases, professionals, hours, documents, and matching.

**Built with:** Next.js, Supabase, modern web technology stack.

**Does:** 
- Stores case information
- Stores professional profiles and credentials
- Tracks session documentation and hours
- Tracks grant budgets and usage
- Logs audit events
- Supports matching workflow
- Generates reports for compliance

**Does NOT:**
- Make independent social decisions
- Replace Kurshshifte's responsibility
- Diagnose citizen needs
- Approve hours on its own (admin must approve)
- Create cases without human decision
- Match professionals automatically
- Own responsibility for quality

**Relationship:** Tool used BY Kurshshifte to perform its work. Not a party to municipality contracts.

---

### Actor 3: Kommune / Municipality

**What it is:** A Danish municipality government responsible for social services to its citizens.

**Examples:** Aalborg Kommune, Aarhus Kommune, Copenhagen Municipality, etc.

**Role in this system:** Commissioning party requesting support for specific citizens.

**Responsibilities:**
- Identify citizens needing support
- Contact Kurshshifte with request and case information
- Provide grant budget for support
- Confirm contact person (sagsbehandler) for ongoing communication
- Approve the final case and support plan

**Does NOT:**
- Log into Kurshshifte-Match (no MVP access)
- Create cases themselves
- Search for or select professionals
- Manage professional matching
- Track hours or documentation directly
- Manage the platform
- See other cases or municipalities' data

**Relationship:** Contractual customer of Kurshshifte ApS.

---

### Actor 4: Sagsbehandler / Socialrådgiver

**What it is:** A social services case worker or social counselor employed by the municipality.

**In simpler terms:** The person at the municipality who asks Kurshshifte for help with a specific citizen.

**Specific role:** 
- Assesses the citizen's needs
- Determines that Kurshshifte's services are appropriate
- Contacts Kurshshifte with case request
- Provides information about the citizen and support needs
- Provides grant budget information
- Remains available as contact person during support

**Does:**
- Contact Kurshshifte (phone, email, or future API)
- Provide case information
- Answer questions about the citizen or support needs
- Confirm grant budget
- Provide own contact information
- Receive updates from Kurshshifte on case status
- Coordinate with the matched professional if needed

**Does NOT:**
- Use Kurshshifte-Match platform (no login in MVP)
- Create cases
- View other cases
- Manage professionals
- Track hours or sessions
- Make matching decisions
- Approve or reject support work
- See information about other citizens

**Is NOT:**
- The support worker (see Professional definition)
- The matched professional
- A Kurshshifte-Match user
- An employee of Kurshshifte

**Relationship:** External contact person from commissioning municipality.

---

### Actor 5: Citizen / Borger

**What it is:** The young person or adult who will receive support from the matched professional.

**In simpler terms:** The subject of the case. The person who needs help.

**Knows:** 
- Their own situation and needs
- The sagsbehandler at their municipality
- Eventually, the matched professional

**Does NOT:**
- Use Kurshshifte-Match platform (no login in MVP)
- Create own case
- Search for professionals
- Log hours or sessions
- See case documentation
- See budget information
- Approve or manage the support

**Data about citizen:**
- Stored with minimum necessary information only
- Age range (not exact birth date)
- Initials (not full name)
- Situation notes (encrypted)
- NOT CPR number, NOT home address, NOT personal contact info
- Only Kurshshifte staff and assigned professional see case details

**Representation:** Represented by sagsbehandler at municipality throughout process.

**Relationship:** Recipient of support services arranged by Kurshshifte.

---

### Actor 6: Professional / Fagperson / Støttekontaktperson / Mentor

**What it is:** A trained, educated, experienced, or approved person who provides direct support to a citizen.

**Alternative titles:** Support contact person, mentor, pedagogue, counselor, coach, etc.

**Qualifications:** Determined by Kurshshifte (training, education, background checks, experience, etc.)

**Has:** 
- A profile in Kurshshifte-Match
- Approved credentials/documents
- History of completed cases
- Session logs and hour records

**Does:**
- Meet with or support the assigned citizen
- Write session logs (what was discussed, what was done)
- Register hours worked
- Upload credentials/documents for verification
- Provide updates on case progress to Kurshshifte
- Communicate with sagsbehandler if needed for coordination

**Does NOT:**
- Create cases
- Search for or choose own cases
- Decide grant amounts
- Approve own hours (Kurshshifte staff approves)
- Access other professionals' data
- Access other cases
- Make matching decisions
- See municipal budget information
- Decide complexity assessments
- Replace sagsbehandler's role

**Platform access in MVP:**
- Can view own profile
- Can view assigned case details
- Can write session logs for assigned case
- Can register hours for assigned case
- Can upload documents for verification
- Cannot see other professionals' data
- Cannot see unassigned cases
- Cannot approve own work

**Relationship:** Independent contractor or partner with Kurshshifte, providing services as assigned.

---

### Actor 7: Case Coordinator

**Business Role:** Case Coordinator

**System Role:** Admin (in RBAC/platform terms)

**Alternative Business Titles:** Intake Coordinator, Match Coordinator, Operations Coordinator, Case Manager, Case Specialist, Case Worker

(Title varies by organization and focus area. The business role name remains "Case Coordinator" in documentation for consistency.)

**What it is:** A staff member working for Kurshshifte ApS who manages cases and matching using the platform.

**Works for:** Kurshshifte ApS

**Business Responsibilities:**
- Receive inquiries from municipalities
- Gather and verify case information
- Assess citizen support needs and case complexity
- Allocate grant budgets
- Find suitable professionals
- Match professionals to cases
- Monitor case progress
- Approve professional hours
- Handle professional changes and handovers
- Document all decisions and actions
- Ensure quality of service
- Maintain compliance and audit trail

**System Access (Admin role in MVP):**
- Can create cases
- Can manage municipalities and contact info
- Can assess complexity
- Can allocate grants
- Can trigger matching
- Can select professionals
- Can verify documents
- Can approve/reject hours
- Can manage handovers
- Can view all cases, all professionals, all documentation
- Can generate reports
- Can manage platform users

**Does:**
- Operate Kurshshifte-Match platform
- Make administrative decisions
- Communicate with municipalities
- Coordinate with professionals
- Track cases from creation through completion

**Does NOT:**
- Provide direct support to citizens
- Make social assessment decisions independently (follows municipality guidance)
- Approve own work
- Access municipality internal systems
- Make final decisions without following Kurshshifte policy

**Relationship:** Employee of Kurshshifte ApS.

**Important:** Multiple people can hold the "Case Coordinator" business role and share the "Admin" system role. This design is organization-independent and scalable to any company size. Kurshshifte may have one Case Coordinator handling everything, or ten Case Coordinators each specializing in intake, matching, or operations.

---

## 4. ACTOR RESPONSIBILITY MATRIX

| Actor | Receives Request | Creates Case | Assesses Need | Selects Professional | Arranges Match | Documents Work | Tracks Hours | Approves Hours | Manages Handover | Owns Responsibility |
|---|---|---|---|---|---|---|---|---|---|---|
| **Municipality** | ✓ | - | ✓ | - | - | - | - | - | - | Case identification |
| **Sagsbehandler** | ✓ | - | ✓ | - | - | - | - | - | - | Initial case info |
| **Kurshshifte ApS** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Overall service delivery |
| **Kurshshifte-Match** | - | - | - | - | - | ✓ | ✓ | - | - | Documentation system |
| **Professional** | - | - | - | - | - | ✓ | ✓ | - | - | Direct support work |
| **Citizen** | - | - | - | - | - | - | - | - | - | Receiving support |
| **Case Coordinator** | - | ✓ | - | ✓ | ✓ | ✓ | - | ✓ | ✓ | Case operations |

---

## 5. WHAT EACH ACTOR CAN DO

### Municipality
- Request support for a citizen
- Provide case information and grant budget
- Designate contact person (sagsbehandler)
- Confirm case is appropriate for Kurshshifte
- Communicate case updates to Kurshshifte

### Sagsbehandler
- Contact Kurshshifte about a citizen needing support
- Provide details about citizen situation and needs
- Answer questions about the case
- Remain available as contact person
- Coordinate with matched professional if needed
- Receive updates on case status

### Kurshshifte ApS
- Receive case requests from municipalities
- Create cases in the system
- Assess complexity and support requirements
- Allocate grant budgets
- Search professional database for suitable matches
- Present professional options
- Select and match professional to case
- Monitor support progress
- Approve/reject hours and documentation
- Handle professional changes
- Manage case to completion
- Generate reports for municipalities and audits

### Kurshshifte-Match (Platform)
- Store case information securely
- Store professional profiles and credentials
- Record session documentation and hours
- Track grant budgets and usage
- Generate audit trails
- Support matching workflow
- Provide reports and analytics

### Professional
- Accept or decline case assignments
- Meet with assigned citizen for support sessions
- Write session logs documenting support provided
- Register hours worked on case
- Upload credentials or training certificates
- Update professional profile
- Provide updates to Kurshshifte or sagsbehandler as needed

### Citizen
- Participate in support sessions with matched professional
- Share information needed for support planning
- Benefit from arranged support services

### Case Coordinator
- Receive case requests from municipalities
- Create cases in system
- Assess complexity and allocate grants
- Search and select suitable professionals
- Match professionals to cases
- Monitor case progress
- Approve professional hours and documentation
- Handle professional changes
- Ensure quality and compliance

---

## 6. WHAT EACH ACTOR CANNOT DO

### Municipality
- ✗ Log into Kurshshifte-Match
- ✗ Search for professionals
- ✗ View other municipalities' cases
- ✗ See professional details
- ✗ Make matching decisions
- ✗ Approve professional hours
- ✗ Access the platform directly

### Sagsbehandler
- ✗ Log into Kurshshifte-Match
- ✗ Create cases (only request them)
- ✗ Search for or select professionals
- ✗ View other cases
- ✗ Track hours directly
- ✗ Approve work
- ✗ Manage the platform

### Professional
- ✗ Create cases
- ✗ View other professionals' data
- ✗ Access other cases (only assigned case)
- ✗ Approve own hours
- ✗ See municipal budget details
- ✗ Search for cases
- ✗ Choose own assignments
- ✗ Manage the platform

### Kurshshifte-Match (Platform)
- ✗ Make social decisions independently
- ✗ Replace Kurshshifte staff responsibility
- ✗ Approve hours on its own
- ✗ Match professionals automatically
- ✗ Create cases without human decision
- ✗ Override Kurshshifte policy
- ✗ Own responsibility for service quality

### Citizen
- ✗ Log into platform
- ✗ Create own case
- ✗ Search for professionals
- ✗ View documentation
- ✗ Access case information
- ✗ See budget details

### Case Coordinator
- ✗ Provide direct support to citizens
- ✗ Make social assessment independently of municipality
- ✗ Approve own work
- ✗ Access municipality internal systems
- ✗ Override Kurshshifte policy

---

## 7. PLATFORM BOUNDARIES

### What the Platform Supports
- Case creation and management
- Professional profile management
- Session documentation
- Hour tracking and registration
- Grant budget tracking
- Document verification workflows
- Audit event logging
- Handover coordination
- Contact disclosure workflows
- Basic reporting

### What the Platform Does NOT Do
- Social assessment (humans decide complexity)
- Professional matching algorithm (humans select)
- Automatic approval of hours (Case Coordinator must review)
- Replace professional judgment
- Make contract decisions
- Guarantee service quality
- Replace Kurshshifte's responsibility
- Diagnose citizen needs
- Create cases autonomously

### What is Out of Scope for MVP
- Citizen portal (blocked feature)
- Municipality portal (Phase 2 feature)
- Messaging system (Phase 3 feature)
- Billing/ERP (separate system)
- Professional credentialing system (separate process)
- Automatic citizen alerts
- Integration with municipal systems

---

## 8. CONTRACT AND RESPONSIBILITY BOUNDARIES

### Kurshshifte's Responsibility to Municipality
Kurshshifte ApS contracts with municipalities to:
- Receive case requests
- Assess support needs accurately
- Find suitable professionals
- Match professionals to cases
- Ensure professionals are qualified
- Document all support provided
- Track hours and budgets
- Handle professional changes when needed
- Maintain quality standards
- Provide audit trail

### What Kurshshifte Does NOT Guarantee
- Perfect matches (human judgment involved)
- Unlimited supply of professionals
- Same professional forever (turnover happens)
- Specific outcomes for citizen (professional provides support, outcomes depend on citizen engagement)
- Compliance with all municipal processes (Kurshshifte has its own)

### What the Platform Does NOT Guarantee
- Data security beyond system design (municipality contracts with Kurshshifte for this)
- Automatic compliance logging (Case Coordinator must trigger audit events)
- Fraud prevention (Kurshshifte responsible for verification)
- Real-time synchronization with municipal systems (out of scope)

---

## 9. MVP ACCESS MODEL

### Who Uses the Platform in MVP

**Case Coordinator** ✓
- Full platform access (Admin role)
- Creates cases
- Manages matching
- Approves hours
- Verifies documents

**Professional** ✓
- Limited access
- Views own case
- Writes sessions
- Registers hours
- Uploads documents

### Who Does NOT Use the Platform in MVP

**Municipality** ✗
- No login
- No platform access
- Communicates via phone/email
- Cannot see inside platform

**Sagsbehandler** ✗
- No login
- No platform access
- Communicates via phone/email
- Remains external contact

**Citizen** ✗
- No login
- No platform access
- Identified by initials only in system
- Not involved in platform

---

## 10. DATA OWNERSHIP AND ACCESS BOUNDARIES

### Municipality Data
- **Owned by:** Municipality (not Kurshshifte)
- **Stored in:** Kurshshifte-Match only as needed for case coordination
- **Who can see:** Only assigned Case Coordinator for that case
- **Deleted:** After retention period per GDPR
- **Citizen data (name, address, SSN):** NOT stored, NOT needed, NOT transferred

### Professional Data
- **Owned by:** Kurshshifte (relationships, credentials, contracts)
- **Stored in:** Kurshshifte-Match (profile, credentials, hours, session records)
- **Who can see:** Own profile + assigned cases only
- **Not visible:** Other professionals' data, other professionals' cases, other professionals' hours

### Case Data
- **Owned by:** Kurshshifte (case coordination responsibility)
- **Stored in:** Kurshshifte-Match
- **Who can see:** Assigned Case Coordinator, assigned professional (for own case only)
- **Not visible:** Municipality sees case status updates only (outside platform), professionals see only own case

### Session and Hour Data
- **Created by:** Professional
- **Reviewed by:** Case Coordinator
- **Approved by:** Case Coordinator
- **Owned by:** Kurshshifte (for municipality invoice/verification)

### Audit Data
- **Generated by:** System (automatically for key events)
- **Triggered by:** Case Coordinator (for decisions)
- **Purpose:** Prove what happened, who decided, when it happened
- **Retained:** 7 years (social services compliance)

---

## 11. COMMON CONFUSIONS TO AVOID

### Confusion 1: "The matched professional is a caseworker"
**Wrong:** Professional is sometimes called case worker, case manager, etc.
**Right:** Professional provides direct support (mentoring, engagement, coordination). Sagsbehandler is the caseworker (at municipality).
**Why it matters:** Different roles, different responsibilities, different data access.

### Confusion 2: "The municipality logs into the platform"
**Wrong:** Assuming municipality accesses Kurshshifte-Match in MVP.
**Right:** Municipality communicates via phone/email only in MVP. No platform access.
**Why it matters:** Scope of platform, data security, API design, feature prioritization.

### Confusion 3: "The platform makes the match"
**Wrong:** Assuming algorithm or system automatically selects professional.
**Right:** Case Coordinator searches database and selects best match.
**Why it matters:** Human responsibility, no algorithmic bias, quality control.

### Confusion 4: "Sagsbehandler is the matched professional"
**Wrong:** Assuming same person plays both roles.
**Right:** Sagsbehandler at municipality requests help; matched professional in Kurshshifte's network provides it. Different people, different relationships.
**Why it matters:** Clear lines of responsibility, separate data access, different platform roles.

### Confusion 5: "Citizens see their case in the platform"
**Wrong:** Assuming citizens have platform access or visibility.
**Right:** Citizens identified by initials only, no citizen portal in MVP.
**Why it matters:** Privacy, GDPR compliance, minimal data collection.

### Confusion 6: "Professionals can see other professionals' cases"
**Wrong:** Assuming professionals see all case information.
**Right:** Professionals see only their own assigned case.
**Why it matters:** Data security, privacy, professional confidentiality.

### Confusion 7: "Kurshshifte-Match is responsible for quality"
**Wrong:** Assuming platform bears responsibility for service quality.
**Right:** Kurshshifte ApS (the company) is responsible. Platform is a tool.
**Why it matters:** Legal responsibility, contract accountability, quality assurance lies with company, not system.

### Confusion 8: "Administrator is the only role"
**Wrong:** Using "Administrator" as the business role name.
**Right:** "Case Coordinator" is the business role. "Admin" is the system role. Multiple Case Coordinators can share the Admin system role.
**Why it matters:** Organization-independence, scalability, clarity about what each role does.

---

## 12. IMPACT ON WORKFLOWS WF-001 THROUGH WF-013

### Key Principles for All Workflows

**1. Use Business Roles, Not System Roles**
- Use: "Case Coordinator"
- Avoid: "Administrator"
- Why: Organization-independent, scalable

**2. Name Human Roles, Not Departments**
- Use: "Case Coordinator"
- Avoid: "Case Management Team"
- Why: Organization-independent

**3. Separate Workflow Stages from Role Changes**
- Use: "WF-002 → WF-003 transition"
- Avoid: "Handoff from Case Management to Matching"
- Why: Same person might do both stages

**4. Be Clear About Platform vs. People**
- Use: "Case Coordinator creates case"
- Avoid: "System creates case" or "Platform decides"
- Why: Humans make decisions, platform records them

**5. Remember What Each Actor Does**
- Workflows should reflect what each human role actually does
- Should not assume organizational structure
- Should work for small and large organizations
- Should work for different staffing models

### Workflow Scope Rules

**WF-001 through WF-013 Scope: Internal to Kurshshifte**
- Focus on work done by Case Coordinators and professionals
- Document how Kurshshifte uses the platform
- Document decisions Kurshshifte makes

**Out of Scope in WF-001 through WF-013:**
- How municipality internal processes work
- How citizen's municipality case is managed
- How municipality allocates budget internally
- How municipality reports to oversight bodies
- Citizen's rights and protections (handled by municipality)
- Professional employment contracts (handled separately)

**External Touch Points (Document but don't own):**
- Municipality inquiry submission
- Sagsbehandler contact and communication
- Professional acceptance/decline of assignments
- Updates to municipality on case status

---

## 13. CHANGES REQUIRED IN WF-002 CAUSED BY THIS CLARIFICATION

### Change 1: Use Case Coordinator Role

**Was:** "Kurshshifte Administrator"  
**Now:** "Case Coordinator" (with note that alternative titles may apply)

**Applied to:**
- Section 5 (Main Flow): Change "Kurshshifte gathers..." to "Case Coordinator gathers..."
- Section 22 (Handoffs): Handoff is "Municipality Sagsbehandler → Case Coordinator"
- All decision gates: "Decision Owner: Case Coordinator"
- Responsibility Ownership Verification: Assign all steps to "Case Coordinator"

### Change 2: One Handoff, One Transition

**Handoff (Role-to-Role):**
- Municipality Sagsbehandler → Case Coordinator

**Transition (Workflow Stage):**
- WF-002 → WF-003 (case moves to matching queue)

(Note: The same Case Coordinator might initiate the WF-003 transition, or a different person. Organization decides.)

### Change 3: Update Actors Section

**Add:** Explicit distinction between business role and system role:
```
Case Coordinator
  Business Role: Case Coordinator
  System Role: Admin (in RBAC terms)
  Alternative titles: Intake Coordinator, Match Coordinator, Operations Coordinator
  (Title varies by organization; the business role name remains "Case Coordinator" in documentation)
```

### Change 4: Clarify Platform Responsibility

**Add note in relevant sections:**
```
Kurshshifte-Match (the platform) does not make independent decisions.
Case Coordinator reviews and approves all important actions.
```

---

## CONCLUSION

**This domain model establishes the foundation for all workflows.**

Key principles:
1. **Kurshshifte ApS is responsible** — The company owns service delivery
2. **Kurshshifte-Match is a tool** — The platform supports Kurshshifte's work
3. **Business roles vs System roles** — "Case Coordinator" (business) ≠ "Admin" (system)
4. **Humans make decisions** — Platform records, doesn't decide
5. **Roles are clear** — Seven distinct actors with defined boundaries
6. **Organization-independent** — Works for any company structure
7. **Privacy-protected** — Citizens and municipalities data minimized
8. **MVP-focused** — Platform scope is clear and achievable

**All workflows WF-001 through WF-013 must be consistent with these definitions.**

---

**Next Steps:**
1. Create UBIQUITOUS_LANGUAGE.md (single source of truth for terms)
2. Create DOCUMENTATION_GOVERNANCE.md (rule for all documents)
3. Correct WF-002 per this clarification
4. Apply these principles to WF-001, WF-003 through WF-013
