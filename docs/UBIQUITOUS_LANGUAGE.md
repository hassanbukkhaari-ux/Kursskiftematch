# Ubiquitous Language

**Document Purpose:** Define all core domain concepts exactly once. This is the single source of truth for terminology across all workflows, architecture documents, technical specifications, and eventually code.

**Inspiration:** Domain-Driven Design principle of establishing shared language across business and technical teams.

**Status:** DRAFT  
**Version:** 1.0  
**Last Updated:** June 27, 2026

---

## HOW TO USE THIS DOCUMENT

This document defines terms that appear in DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md, workflows (WF-001 through WF-013), architecture documents, and technical specifications.

**For each term you will find:**
1. **Definition** — What the term means in Kurshshifte's domain
2. **Is NOT** — Common misconceptions to avoid
3. **Used by** — Which actors/roles use this term
4. **Used in** — Which documents/workflows reference this term

**Golden Rule:** If you encounter a term not defined here, add it before using it in any document.

---

## CORE DOMAIN TERMS

### Municipality (Kommune)

**Definition:** A Danish municipality government organization responsible for social services to citizens within its geographic area. Examples: Aalborg Kommune, Aarhus Kommune, Copenhagen Municipality.

**Is NOT:**
- A person or individual role
- Part of Kurshshifte ApS
- A platform user (in MVP)
- Able to access Kurshshifte-Match directly

**Used by:** Sagsbehandler (as contact point), Kurshshifte (receives requests from municipality)

**Used in:** 
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (Actor definition)
- All workflows WF-001 through WF-013 (external party)
- Technical specifications (contract partner)

**Related:** Sagsbehandler, Grant

---

### Citizen (Borger)

**Definition:** A young person or adult who is identified by a municipality as needing social support and who becomes the subject of a Case managed by Kurshshifte.

**Is NOT:**
- A platform user (in MVP)
- Able to log into Kurshshifte-Match
- Identified by full name or CPR number in the system
- Responsible for case management

**Used by:** Sagsbehandler (on behalf of citizen), Case Coordinator (manages support for citizen), Professional (provides support to citizen)

**Used in:**
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (Actor definition)
- All workflows (subject of case)
- Technical specifications (data minimization rules)

**Data in system:** Age range, initials only, situation notes (encrypted)

**Related:** Case, Support, Assignment

---

### Case

**Definition:** A formal record of a citizen requesting or receiving support from Kurshshifte. A case contains citizen information, support needs, complexity assessment, grant allocation, and history of matched professionals and sessions.

**Is NOT:**
- A municipality's internal case (stored in municipality systems)
- A shared database record (owned by Kurshshifte)
- Open-ended (has defined start and end)
- Visible to municipality in platform (only status updates provided externally)

**Lifecycle:**
1. Inquiry received (from municipality)
2. Case created (by Case Coordinator)
3. Professional matched
4. Case active (sessions and hours recorded)
5. Case completed (handover or closure)
6. Case archived (data retained per GDPR)

**Used by:** Case Coordinator (creates and manages), Professional (works on case), Sagsbehandler (initiates)

**Used in:**
- All workflows WF-001 through WF-013
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (responsibility boundaries)
- Technical specifications (case schema, access control)

**Related:** Citizen, Assignment, Session, Grant, Complexity

---

### Sagsbehandler (Case Worker / Socialrådgiver)

**Definition:** A social services case worker or social counselor employed by a municipality. The sagsbehandler initiates contact with Kurshshifte, provides case information, and serves as the municipality's contact point for ongoing case communication.

**Is NOT:**
- A Kurshshifte-Match platform user
- The matched professional
- An employee of Kurshshifte
- The support provider (role belongs to Professional)

**Used by:** Municipality (employee role), Case Coordinator (communication partner)

**Used in:**
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (Actor definition)
- All workflows (initiates case, provides information)
- Technical specifications (external contact information)

**Related:** Case, Municipality, Professional

---

### Professional (Fagperson, Støttekontaktperson, Mentor)

**Definition:** A trained, educated, experienced, or otherwise approved person who provides direct support to a citizen. Professional qualifications are determined by Kurshshifte. Professionals have profiles in Kurshshifte-Match and are candidates for case matching.

**Is NOT:**
- A caseworker (that's sagsbehandler)
- A Kurshshifte employee (typically independent contractor or partner)
- Able to create cases
- Able to see other professionals' work
- Able to approve own hours

**Titles:** Mentor, pedagogue, counselor, coach, support contact person, etc. (Title varies; the concept "Professional" is consistent.)

**Platform access:** Can view own profile, own assigned case, write session logs for own case, register own hours, upload credentials.

**Used by:** Case Coordinator (selects and matches), Citizen (receives support from), Sagsbehandler (coordinates with)

**Used in:**
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (Actor definition)
- All workflows WF-003 onwards (matched to cases)
- Technical specifications (professional profile schema, session logging)

**Related:** Match, Assignment, Session, Credentials

---

### Case Coordinator

**Definition:** A staff member working for Kurshshifte ApS who manages cases and case coordination using the platform. The Case Coordinator creates cases, assesses complexity, allocates grants, selects professionals, monitors progress, and approves hours.

**Business Roles (titles that fulfill the Case Coordinator function):**
- Intake Coordinator
- Match Coordinator
- Operations Coordinator
- Case Manager
- Case Specialist

**System Role:** Admin (in RBAC/platform terms)

**Is NOT:**
- A single person (organization may have multiple Case Coordinators)
- A system role in the RBAC sense (Admin is the system role)
- A professional providing direct support

**Platform access:** Full administrative access in MVP. Can create cases, manage all data, approve hours, generate reports.

**Used by:** Kurshshifte ApS (role filled by staff members), Professional (works with Case Coordinator), Sagsbehandler (communicates with Case Coordinator)

**Used in:**
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (Actor definition, business role vs system role)
- All workflows WF-001 through WF-013 (primary actor)
- Technical specifications (Admin role permissions)

**Related:** Case, Match, Assignment

---

### Match / Professional Matching

**Definition:** The process of identifying and assigning a suitable Professional to a Case. Matching is initiated by Case Coordinator, who searches the professional database, evaluates candidates, and selects the best fit based on professional qualifications, availability, and case complexity.

**Is NOT:**
- Automatic or algorithmic (human decision)
- Guaranteed to be perfect (judgment-based)
- One-to-one permanently (professional can change)

**Outcomes:**
- Match successful (professional accepts assignment)
- Match declined (professional declines, new candidate selected)
- Match failed (no suitable candidate available)

**Used by:** Case Coordinator (makes match decision), Professional (accepts or declines match)

**Used in:**
- WF-003: Professional Matching & Assignment
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (responsibility boundaries)
- Technical specifications (matching workflow, candidate evaluation)

**Related:** Professional, Assignment, Case, Match Candidate

---

### Match Candidate

**Definition:** A Professional who is evaluated by Case Coordinator as potentially suitable for a specific Case, before a final Match decision is made.

**Is NOT:**
- A matched professional (candidate becomes matched only after decision)
- Automatically notified (Case Coordinator controls notification)

**Used by:** Case Coordinator (evaluates candidates)

**Used in:**
- WF-003: Professional Matching & Assignment
- Technical specifications (candidate selection workflow)

**Related:** Professional, Match

---

### Assignment

**Definition:** The formal pairing of a Professional with a Case, created after Match decision is confirmed. An Assignment has a start date and (eventually) an end date, and generates Session records and Registered Hours.

**Is NOT:**
- A match (match is the selection process; assignment is the result)
- Permanent (can be ended, changed, or handed over)
- Visible to municipality in platform (status only)

**Lifecycle:**
1. Created (after professional accepts match)
2. Active (sessions and hours recorded)
3. Changed (professional changed, handover to new professional)
4. Ended (support completed or terminated)

**Used by:** Case Coordinator (creates and manages), Professional (works under assignment)

**Used in:**
- WF-004: Case Activation
- WF-008: Professional Change & Handover
- All subsequent workflows
- Technical specifications (assignment schema)

**Related:** Match, Professional, Case, Session

---

### Session

**Definition:** A meeting, interaction, or period of support provided by a Professional to a Citizen under an Assignment. Each Session is documented with a Session Log and generates Registered Hours.

**Is NOT:**
- Administrative (it's direct support work)
- Guaranteed length (varies by need)
- Visible to municipality (case status only)

**Generated by:** Professional (during support work)

**Used by:** Professional (creates sessions), Case Coordinator (reviews/approves)

**Used in:**
- WF-005: Session Documentation & Hour Registration
- All workflows involving ongoing support
- Technical specifications (session schema, logging)

**Related:** Assignment, Session Log, Registered Hours

---

### Session Log

**Definition:** A detailed written record created by Professional documenting a Session. The log describes what was discussed, what was done, outcomes, and citizen/professional observations. Session Logs are submitted for Case Coordinator review and approval.

**Is NOT:**
- Automatically approved (requires Case Coordinator review)
- Visible to citizen or municipality (confidential)
- A billing record (billing comes from Registered Hours)

**Content expectations:** Participant(s), date/time, duration, activities, observations, next steps

**Used by:** Professional (writes), Case Coordinator (reviews/approves)

**Used in:**
- WF-005: Session Documentation & Hour Registration
- Technical specifications (session log schema)

**Related:** Session, Registered Hours

---

### Registered Hours

**Definition:** A formal record of hours worked by a Professional on a Case, submitted and tracked in Kurshshifte-Match. Hours are submitted by Professional, reviewed by Case Coordinator, and must stay within the allocated Grant.

**Is NOT:**
- Automatically approved (requires Case Coordinator review)
- Visible to professional other than own hours
- Flexible beyond grant allocation

**Approval:** Case Coordinator must approve hours before they count toward grant.

**Used by:** Professional (submits), Case Coordinator (approves), Grant tracking (constrains total)

**Used in:**
- WF-006: Grant Tracking & Hour Management
- WF-007: Grant Review & Adjustment
- Technical specifications (hour tracking, grant constraints)

**Related:** Grant, Session, Session Log

---

### Grant

**Definition:** The budget allocated by a Municipality for support services on a specific Case. The Grant specifies total budget amount and the period it covers. Kurshshifte tracks Registered Hours against the Grant to ensure spending stays within budget.

**Is NOT:**
- Flexible (cannot be exceeded without municipality approval)
- Visible to Professional (Professional only sees remaining balance)
- Fixed forever (can be adjusted if municipality approves)

**Information stored:**
- Total budget amount
- Start date
- End date
- Allocated per case (not per professional)

**Used by:** Case Coordinator (allocates and monitors), Municipality (provides funding)

**Used in:**
- WF-005: Session Documentation & Hour Registration
- WF-006: Grant Tracking & Hour Management
- WF-007: Grant Review & Adjustment
- Technical specifications (grant tracking, financial constraints)

**Related:** Case, Registered Hours

---

### Complexity (Kompleksitet)

**Definition:** An assessment of the difficulty, risk, and support intensity required for a Case. Complexity is determined by Case Coordinator based on citizen situation, support needs, and environmental factors. Complexity levels inform matching, grant allocation, and monitoring intensity.

**Levels:**
- LOW — Minimal complexity factors, straightforward support
- MEDIUM — 2+ complexity factors, moderate support needs
- HIGH — Mental health or diagnosis combined with family instability
- CRITICAL — Safety concerns OR (substance use AND multiple agencies involved)

**Is NOT:**
- Subjective (determined by defined rules)
- Permanent (can be reassessed)
- Known before Case Coordinator assessment

**Factors considered:**
- Safeguarding concerns
- Mental health needs
- Substance use issues
- Family instability
- Multiple agency involvement
- Previous failed interventions

**Used by:** Case Coordinator (assesses and documents), Professional (influences matching decisions)

**Used in:**
- WF-002: Municipality Inquiry to Case Creation (complexity assessment)
- All matching and monitoring workflows
- Technical specifications (complexity rules, reassessment)

**Related:** Case, Grant allocation

---

### Credentials

**Definition:** Documentation that verifies a Professional's qualifications, education, training, or background clearances required for supporting citizens. Credentials are uploaded to the platform and verified by Case Coordinator or quality officer.

**Types:** Education certificates, training completion, background checks, references, licenses, etc.

**Is NOT:**
- Automatic verification (human review required)
- Stored in same location as case data (separate security)
- Visible to citizen or municipality

**Lifecycle:**
1. Professional uploads credential
2. Case Coordinator reviews
3. Verified or rejected
4. Credential valid or expired

**Used by:** Professional (uploads), Case Coordinator (verifies)

**Used in:**
- WF-011: Document Verification & Professional Approval
- Professional profile management
- Technical specifications (credential schema, verification workflow)

**Related:** Professional, Assignment

---

### Contact Disclosure

**Definition:** The deliberate act of providing a Professional's contact information to a Citizen or vice versa, enabling direct communication. In MVP, Contact Disclosure is controlled by Case Coordinator and documented for audit purposes.

**Is NOT:**
- Automatic (Case Coordinator must approve)
- Reversible without decision (privacy protection)
- Done without audit trail

**When it happens:** Typically at case activation when professional and citizen can begin coordinating

**Used by:** Case Coordinator (controls), Professional (receives citizen contact), Citizen (receives professional contact via sagsbehandler)

**Used in:**
- WF-009: Contact Disclosure & Communication Setup
- Technical specifications (disclosure workflow, audit events)

**Related:** Assignment, Audit Event

---

### Handover

**Definition:** The formal transfer of support from one Professional to another, or from a Professional to a different provider/organization. Handover involves documenting progress, transferring knowledge, and formally ending one Assignment while beginning another.

**Is NOT:**
- Abrupt (includes transition period)
- Without documentation (must be logged)
- Professional's choice alone (Case Coordinator decides)

**Reasons for handover:**
- Professional unavailable/departed
- Better match found
- Changed needs requiring different professional
- Mutual agreement to change

**Used by:** Case Coordinator (initiates and manages), Professional (participates)

**Used in:**
- WF-008: Professional Change & Handover
- Case archival workflows
- Technical specifications (handover workflow, state transitions)

**Related:** Assignment, Professional

---

### Audit Event

**Definition:** A formal record of a significant action, decision, or state change within a Case or Assignment, created automatically by the system or triggered by Case Coordinator. Audit Events prove what happened, who decided, and when it happened.

**Purpose:** Compliance, transparency, dispute resolution, quality assurance

**Types:**
- CASE_CREATED
- CASE_ELIGIBILITY_CHECKED
- CASE_READY_FOR_MATCHING
- PROFESSIONAL_MATCHED
- ASSIGNMENT_CREATED
- SESSION_LOGGED
- HOURS_REGISTERED
- HOURS_APPROVED
- CONTACT_DISCLOSED
- HANDOVER_INITIATED
- CASE_COMPLETED

**Is NOT:**
- Automatically generated for every action (only significant events)
- Deletable (immutable record)
- Visible to citizen or external parties

**Retention:** 7 years (social services compliance)

**Used by:** All workflows (generate audit events), Case Coordinator (triggers some events), Compliance/Quality review

**Used in:**
- All workflows WF-001 through WF-013 (audit events section)
- Technical specifications (audit log schema, retention)

**Related:** Case, Assignment, all actions

---

### Workflow

**Definition:** A defined sequence of steps and decision points that accomplish a specific business process. Workflows are numbered WF-001 through WF-013 and together make up the complete Kurshshifte-Match system process.

**Characteristics:**
- Sequential (steps happen in defined order)
- Decision-driven (gates require human judgment)
- Documented (business rules and alternatives documented)
- Auditable (creates audit events)
- Testable (success criteria defined)

**Examples:**
- WF-002: Municipality Inquiry to Case Creation
- WF-003: Professional Matching & Assignment
- WF-005: Session Documentation & Hour Registration

**Is NOT:**
- Technical (workflow is business process, not code)
- Rigid (alternatives and exceptions documented)
- Automatic (humans make decisions at gates)

**Used by:** All actors (follow workflows), Kurshshifte (defines workflows)

**Used in:**
- All workflow documents WF-001 through WF-013
- Architecture documentation
- Technical specifications

**Related:** Capability, Decision Gate, Responsibility

---

### Capability

**Definition:** A business function or service that the organization provides. Capabilities are what the organization *can do*; they may be performed by one or multiple human roles, and may or may not require platform support.

**Examples:**
- Case Reception
- Information Gathering
- Complexity Assessment
- Professional Matching
- Session Documentation
- Hour Approval
- Quality Oversight

**Is NOT:**
- A human role (role performs capability)
- A workflow stage (capability may span multiple stages)
- A system feature (capability may be manual or automated)

**Used by:** All roles (perform capabilities), Kurshshifte (defines capabilities)

**Used in:**
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (capability model)
- Architecture documentation
- Workflow documentation (step outcomes)

**Related:** Role, Workflow, Responsibility

---

### Role

**Definition:** A position or responsibility holder in the Kurshshifte domain. Roles have responsibilities, access levels, and participate in workflows. Roles can be Business Roles (what the person does) or System Roles (what permissions they have).

**Business Roles:**
- Case Coordinator (business function: manages cases)
- Professional (business function: provides support)
- Sagsbehandler (business function: initiates cases)

**System Roles:**
- Admin (platform permissions: full access)
- Professional (platform permissions: limited to own case)

**Is NOT:**
- A person (role is position; person is employee)
- A job title (role is function; title may vary)
- Unchanging (person may fulfill multiple roles)

**Used by:** All governance documents, all workflows

**Used in:**
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (role definitions)
- All workflows (responsibility assignments)
- Technical specifications (RBAC, access control)

**Related:** Capability, Permission, Responsibility

---

### Permission

**Definition:** A specific access right or capability granted to a System Role. Permissions determine what actions a person can perform in Kurshshifte-Match.

**Examples:**
- CreateCase
- AssessComplexity
- SelectProfessional
- ApproveHours
- VerifyCredentials
- ViewAllCases

**Is NOT:**
- A role (permission is specific right; role is collection of permissions)
- Automatic (must be assigned explicitly)
- Equal across roles (different roles have different permissions)

**Used by:** Technical specifications (RBAC design), system administration

**Used in:**
- Technical specifications (access control)
- System design documents

**Related:** Role, System Role

---

### Decision Gate

**Definition:** A checkpoint in a workflow where a human decision-maker (usually Case Coordinator) must review information and make a choice that determines the workflow's path. Decision Gates prevent automatic processing and ensure human judgment.

**Example gates in WF-002:**
- Gate 1: Accept Inquiry (ACCEPT / REQUEST MORE INFO / REJECT)
- Gate 2: Create or Link Municipality (USE EXISTING / CREATE NEW / CANNOT IDENTIFY)
- Gate 3: Complexity Assessment Approved (LOW / MEDIUM / HIGH / CRITICAL)

**Is NOT:**
- Automatic (requires human decision)
- Bypassable (must pass to proceed)
- Without criteria (decision rules documented)

**Used by:** Case Coordinator (decides at gates), Workflow documentation

**Used in:**
- All workflow documents (decision gates section)
- Technical specifications (workflow logic)

**Related:** Workflow, Decision, Responsibility

---

### Responsibility Handoff

**Definition:** A transition point where responsibility for a Case or process moves from one human role to another. Handoffs are explicitly documented to ensure clear ownership and prevent gaps.

**Types:**
- Role-to-Role handoff (e.g., Sagsbehandler → Case Coordinator)
- Workflow Stage Transition (e.g., WF-002 → WF-003)

**Is NOT:**
- Automatic (requires trigger and audit event)
- Loss of information (handoff includes required information transfer)
- Loss of communication (previous role may remain involved)

**Used by:** All workflows (document handoffs), Governance (ensure no gaps)

**Used in:**
- All workflow documents (handoffs section)
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (responsibility boundaries)

**Related:** Role, Workflow, Audit Event

---

### System Role / RBAC

**Definition:** A role in the Kurshshifte-Match platform's access control system (Role-Based Access Control). System Roles determine what permissions a user has within the platform.

**Roles in MVP:**
- Admin (full access, all permissions)
- Professional (limited access, own case and profile only)

**Is NOT:**
- A business role (business role is what person does in organization)
- A job title (multiple people may have same system role)
- Permanent (permissions can change)

**Used by:** Platform administration, technical security

**Used in:**
- Technical specifications (RBAC design)
- User management documentation

**Related:** Role, Permission, Business Role

---

## USAGE EXAMPLES

### Correct usage:

"The **Case Coordinator** (business role) with **Admin** (system role) permissions reviews the **Session Log** and approves the **Registered Hours** within the **Grant** allocation."

### Incorrect usage:

"The **Administrator** reviews the case log."  
Problem: "Administrator" conflates business and system roles; "case log" is ambiguous (Case record? Session log? Audit log?)

### Correct version:

"The **Case Coordinator** reviews the **Session Log**."

---

### Correct usage:

"When a **Professional** accepts the **Match**, an **Assignment** is created, and the **Audit Event** ASSIGNMENT_CREATED is generated."

### Incorrect usage:

"When a professional is matched, the system creates an assignment."  
Problem: Passive voice obscures decision-maker; ambiguous whether automatic or human-decided.

### Correct version:

"When a **Professional** accepts the **Match**, the **Case Coordinator** confirms the decision, creating an **Assignment** and generating the **Audit Event** ASSIGNMENT_CREATED."

---

## ADDITIONS TO THIS DOCUMENT

If you encounter a term not defined here while writing workflows or documentation:

1. **Stop** — Do not use undefined terms
2. **Define** — Add the term to this document
3. **Use** — Now use the defined term consistently
4. **Notify** — Tell the team the term was added

This keeps terminology synchronized across all documentation.

---

## MAINTAINING THIS DOCUMENT

**This document is the single source of truth for terminology.**

When adding a new term:
- Follow the template: Definition, Is NOT, Used by, Used in
- Add to the appropriate section (alphabetical within sections)
- Reference related terms
- Notify team of new term

When changing a definition:
- Update this document first
- Then update all documents that reference the term
- Do not use conflicting definitions in other documents
- Notify team of the change

---

## TERMS BY CATEGORY

### People/Roles
- Citizen
- Professional
- Sagsbehandler
- Case Coordinator
- Role
- Business Role
- System Role

### Processes
- Workflow
- Capability
- Decision Gate
- Responsibility Handoff
- Match / Professional Matching

### Cases & Assignments
- Case
- Assignment
- Complexity
- Credentials

### Support Documentation
- Session
- Session Log
- Registered Hours
- Contact Disclosure

### Governance
- Grant
- Audit Event
- Permission
- Handover

### Administrative
- Municipality
- Match Candidate

---

**Next Steps:** All documents WF-001 through WF-013, technical specifications, and architecture documents must use these exact definitions.
