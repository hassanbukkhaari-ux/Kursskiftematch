# Domain Vision: Kurshshifte-Match

**Document Level:** Foundational Vision  
**Audience:** Founders, Product Owners, Municipal Stakeholders, Employees, Architects, Developers  
**Status:** DRAFT  
**Version:** 1.0  
**Last Updated:** June 27, 2026

---

## EXECUTIVE SUMMARY

Kurshshifte-Match is the digital operations platform that supports Kurshshifte ApS' complete delivery of relationship-based support services to Danish municipalities.

The platform integrates six core business domains:

1. **Professional Domain** — Recruitment, applications, profiles, verification, capacity, availability, onboarding, offboarding
2. **Municipality Domain** — Municipalities, sagsbehandlere, cooperation, grants, inquiries
3. **Case Domain** — Citizens, cases, complexity assessment, assignments, handovers, closure
4. **Delivery Domain** — Sessions, documentation, hours, contact logs, follow-up
5. **Governance Domain** — Audit trails, compliance, GDPR, documents, permissions, retention
6. **Matching Domain** — Match runs, candidate ranking, human approval, assignment history

Matching is one capability within a larger ecosystem. The platform exists to operationalize all aspects of Kurshshifte ApS' business—from recruiting professionals to closing cases and archiving records.

The platform enables Kurshshifte ApS to:
- **Scale reliably** by automating coordination, not judgment
- **Operate transparently** with complete audit trails and immutable records
- **Protect all parties** (municipalities, professionals, citizens) through clear boundaries and systematic processes
- **Improve continuously** by measuring outcomes and operational efficiency
- **Maintain quality** through verification, capacity management, and systematic oversight

Kurshshifte-Match is Kurshshifte ApS' operational backbone.

---

## PROBLEM STATEMENT

### The Current Situation

Danish municipalities are responsible for arranging social support for vulnerable citizens. Many citizens benefit from structured, consistent support relationships with trained professionals—mentors, support contact persons, family coordinators, engagement workers, and others.

Kurshshifte ApS recruits, onboards, manages, and coordinates these professionals on behalf of municipalities. The company is growing and wants to serve more municipalities. To scale reliably, the company must improve its processes for recruiting, managing, and coordinating professionals.

### Problem 1: Professional Recruitment and Onboarding is Manual and Slow

Currently:
- Recruitment happens through external channels (LinkedIn, Jobindex, word-of-mouth)
- No systematic professional database or profile system
- Credentials and documents are scattered across emails or paper
- Onboarding is inconsistent; no checklist to ensure all professionals are properly verified
- No clear way to track professional availability or capacity

**Impact:** Kurshshifte cannot easily find qualified professionals, cannot verify they meet quality standards, and cannot match them to cases effectively.

### Problem 2: Professional Capacity and Workload are Not Tracked

Currently:
- No systematic way to know which professionals are available
- No visibility into how many hours each professional is working
- Risk of overloading professionals (burnout, quality decline)
- No way to prevent scheduling conflicts or exceeding professional capacity
- Professionals work based on informal requests, not structured assignments

**Impact:** Professionals become overloaded. Support quality suffers. Professionals leave. Cases fail.

### Problem 3: Slow Matching (Original Problem, Still Valid)

When a municipality contacts Kurshshifte requesting support for a citizen, valuable time passes with:

- Inquiry information scattered across emails
- Sagsbehandler (case worker) waiting for status updates
- Kurshshifte staff searching manually through professional information
- Back-and-forth communication clarifying what the municipality actually needs
- Professional profiles scattered across documents or in someone's head
- No clear picture of which professionals are actually available

**Impact:** The moment when a citizen is ready and motivated for support often closes before a professional arrives.

### Problem 4: Poor Matching (Original Problem, Still Valid)

Even when professionals are assigned, the match is sometimes wrong because:

- Limited information about professional qualifications and experience
- No systematic way to evaluate whether a professional has worked with similar cases
- Professional availability and preferences documented inconsistently
- Matching based partly on gut feeling, partly on who answers their phone first
- No way to identify which professional combinations work best for which types of cases

**Impact:** Mismatches lead to failed placements, damaged trust, and wasted resources.

### Problem 5: Invisible Documentation (Original Problem, Still Valid)

Once a professional begins work, critical information becomes invisible:

- Session notes scattered across separate documents or in notebooks
- Hours worked recorded informally or missing entirely
- Grant budgets not tracked clearly against actual spending
- Quality of work undocumented or difficult to verify
- Municipality unable to confirm that contracted work is actually happening
- Handover to a new professional loses information
- No audit trail if disputes arise

**Impact:** Municipalities can't verify what they're paying for. Professionals aren't recognized for their work. Improvement is impossible because data doesn't exist.

### Problem 6: Professional Changes Cause Loss of Context (Original Problem, Still Valid)

Because data is scattered and processes are manual, every change creates friction:

- Professional becomes unavailable (illness, family situation, departure)
- Finding replacement requires starting from scratch
- New professional inherits incomplete knowledge
- Citizen loses continuity of support during transition
- Case information must be re-gathered and re-entered
- Quality drops precisely when the relationship is most fragile

**Impact:** High turnover, frustrated professionals, citizens forced to restart relationships.

### For Kurshshifte

Kurshshifte wants to grow and serve more municipalities, but cannot do so with manual processes:

- Professional recruitment and management is manual and doesn't scale
- Matching is slow and error-prone because data is scattered
- Each municipality needs custom status reports and documentation
- Professional data is scattered across emails, notes, spreadsheets
- Hours and budgets tracked informally, causing billing disputes
- Quality difficult to verify or improve
- Scaling to more municipalities means hiring more admin staff (not sustainable)
- Risk of compliance failure (GDPR, audit trails, data protection)
- Cannot reliably ensure professionals are qualified and current

### For Municipalities

Municipalities need confidence that:

- Support professionals are properly recruited and qualified
- Support is actually happening
- Professionals are available and not overloaded
- Hours and budgets are tracked accurately
- Documentation is complete if questions arise
- They can transition professionals without losing information

### For Professionals

Professionals need:

- Clear information about available cases and what's expected
- Ability to document their work without administrative burden
- Visibility of hours worked and compensation
- Professional development based on documented outcomes
- Security that their work is recognized and auditable
- Confidence that their capacity limits are respected

---

## THE SIX DOMAINS OF KURSHSHIFTE-MATCH

Kurshshifte-Match is organized around six integrated business domains, each supporting critical operational functions:

### Domain 1: Professional Domain

**Purpose:** Manage the complete professional lifecycle from recruitment through offboarding.

**Capabilities:**
- Professional recruitment and applications
- Professional profile creation and management
- Credential and qualification verification
- Document storage and expiry tracking
- Capacity planning and workload management
- Availability scheduling and tracking
- Professional onboarding and offboarding
- Skill development and quality assessment

**Key Entities:** Professionals, Applications, Profiles, Documents, Capacity Limits, Availability

**Why It Matters:** Kurshshifte cannot scale without systematic professional management. Manual recruitment and verification is inefficient and error-prone.

---

### Domain 2: Municipality Domain

**Purpose:** Manage relationships and coordination with municipal partners.

**Capabilities:**
- Municipality information and reference data
- Sagsbehandler (case worker) contact management
- Municipal grant allocation and budgets
- Inquiry reception and logging
- Case request intake and assessment
- Municipal communication and updates
- Cooperation tracking

**Key Entities:** Municipalities, Sagsbehandlere, Grants, Inquiries, Communication Log

**Why It Matters:** Municipalities are Kurshshifte's customers. Clear, organized municipal data ensures efficient cooperation.

---

### Domain 3: Case Domain

**Purpose:** Manage citizen support cases from creation through closure.

**Capabilities:**
- Citizen registration (with privacy protection)
- Case creation and tracking
- Complexity assessment and calculation
- Case status workflow management
- Professional assignment and tracking
- Case handover coordination
- Case completion and closure
- Case archival

**Key Entities:** Citizens, Cases, Complexity Factors, Assignments, Handovers, Case Status

**Why It Matters:** Cases are the central record of support. Clear case management ensures municipalities and professionals understand what's happening.

---

### Domain 4: Delivery Domain

**Purpose:** Document and track the actual support work delivered to citizens.

**Capabilities:**
- Session documentation (what happened during support)
- Session log creation and correction
- Hour registration and tracking
- Contact logs (professional-sagsbehandler communication)
- Progress tracking and follow-up
- Documentation verification and approval
- Quality assessment of work

**Key Entities:** Sessions, Session Logs, Registered Hours, Contact Logs, Progress Records

**Why It Matters:** Without documented delivery, support is invisible. Transparent documentation proves work happened and enables quality improvement.

---

### Domain 5: Governance Domain

**Purpose:** Ensure compliance, auditability, and data protection across all operations.

**Capabilities:**
- Audit event logging and tracking
- Compliance monitoring and reporting
- GDPR compliance (data minimization, retention, deletion)
- Document management and verification
- Permission management and access control
- Data retention and archival workflows
- Right-to-be-forgotten implementation
- Immutable record keeping

**Key Entities:** Audit Events, Compliance Records, GDPR Workflows, Permissions, Retention Policies

**Why It Matters:** Governance is non-negotiable. Audit trails prove we did what we said we did. Data protection builds trust.

---

### Domain 6: Matching Domain

**Purpose:** Support the matching of suitable professionals with appropriate cases.

**Capabilities:**
- Match run creation (admin-triggered, never automatic)
- Candidate scoring and ranking
- Match explanation and transparency
- Human approval of matches
- Assignment history and tracking
- Match alternatives and decision logging
- Algorithm versioning for explainability

**Key Entities:** Match Runs, Match Candidates, Scores, Explanations, Assignments

**Why It Matters:** Matching is critical, but it's ONE part of the platform. Humans always decide. The best match starts with good data from all other domains.

---

## HOW THE DOMAINS WORK TOGETHER

The six domains are integrated around the central concept of a **Case**:

1. **Professional Domain** provides candidates (professionals with verified credentials and capacity)
2. **Municipality Domain** identifies need (case requests, grants, sagsbehandler contact)
3. **Case Domain** organizes work (case creation, assignment, status, complexity)
4. **Matching Domain** connects them (professional ↔ case)
5. **Delivery Domain** documents work (sessions, hours, progress)
6. **Governance Domain** ensures integrity (audit, compliance, data protection)

No domain operates in isolation. All six work together to operationalize Kurshshifte ApS' business.

---

## MISSION

**Kurshshifte-Match exists to operationalize Kurshshifte ApS' complete delivery of relationship-based support services—from recruiting professionals through closing cases—enabling the company to scale reliably while maintaining quality, transparency, and systematic oversight.**

Kurshshifte-Match is the operational backbone that integrates:

- Professional recruitment, verification, and capacity management
- Municipal relationships, grants, and case requests
- Case creation, assignment, complexity assessment, and closure
- Support work documentation, hour tracking, and verification
- Audit trails, compliance monitoring, and data protection
- Matching of professionals to cases with human approval

By integrating these six domains, Kurshshifte-Match enables Kurshshifte ApS to operate transparently, audit all decisions, protect vulnerable populations, scale without chaos, and continuously improve.

---

## MISSION

**Kurshshifte-Match exists to remove delays and reduce friction in the process of matching professionals with citizens who need support.**

The platform provides a single, reliable place where Kurshshifte staff can:

- Receive and assess case requests from municipalities
- Systematically search and select suitable professionals
- Coordinate and activate support assignments
- Document support work with minimal burden on professionals
- Track hours, budgets, and grant compliance
- Manage professional changes without losing information
- Maintain complete, auditable records

By doing this well, we enable more citizens to receive suitable support more quickly, and help Kurshshifte scale to serve more municipalities without compromising quality.

---

## VISION

### In 5–10 Years

Kurshshifte-Match will be the industry standard for relationship-based support organizations managing their complete operations—from recruiting and managing professionals through closing cases and measuring outcomes.

**What this means:**

- Kurshshifte operates entirely through a digital platform that integrates all six domains systematically
- Professional recruitment, verification, and capacity management are automated and transparent
- Case requests flow from municipalities automatically, assessed quickly, and matched to pre-verified professionals
- Documentation happens in real-time as work happens, not as administrative burden
- Every municipality and professional sees complete transparency: what's happening, why, who's responsible
- Kurshshifte scales to serve 50, 100, or more municipalities without proportional cost increase because the platform handles coordination and data
- Outcome measurement is automatic—we know what works, which professionals succeed with which citizen types, which municipal approaches succeed
- Other support organizations adopt the same platform approach, improving the entire ecosystem

**The experience:**

- **For municipalities:** Professional service coordination that respects their autonomy, ensures quality, provides transparency, and eliminates manual back-and-forth
- **For professionals:** Clear assignments from pre-screened organizations, easy documentation, professional recognition, and data-driven quality improvement
- **For Kurshshifte:** Scalable, auditable, data-driven operations that continuously improve through measurement and systematization

---

## CUSTOMERS, USERS, AND BENEFICIARIES

These are not the same, and the distinction matters:

### Customer

**Who pays for the service?**

**Answer:** Municipalities (Kommune)

- Municipalities commission Kurshshifte to arrange support for their citizens
- Municipalities allocate budgets for these services
- Municipalities sign contracts defining scope and quality standards
- Municipalities pay invoices for hours of support delivered

**Implication:** Municipal needs drive platform priorities. If municipalities don't see value, the business doesn't work.

### Users

**Who actually uses the platform?**

**Answer:** Kurshshifte staff and professionals

- **Kurshshifte Case Coordinators** create cases, manage matching, approve hours, track budgets
- **Professionals** record sessions, register hours, upload credentials

**Implication:** The platform must be designed for these users' actual workflow, not for what we assume they want.

**Note:** Municipalities do NOT use the platform directly in MVP. They receive status information through Kurshshifte staff (email, meetings, reports). This boundary is intentional and important.

### Beneficiaries

**Who benefits from the service?**

**Answer:** Citizens receiving support

- Citizens identified by municipalities as needing support
- Citizens matched with professionals and receiving consistent, documented support
- Citizens whose cases are managed with care and auditable quality

**Implication:** Everything we build must ultimately serve the citizen, even though citizens don't use the platform directly.

---

## PLATFORM PURPOSE

### What Kurshshifte-Match Is

Kurshshifte-Match is the digital operations platform that supports Kurshshifte ApS' complete business—the integrated management of all aspects of relationship-based support service delivery.

Organized around six core domains, the platform:

**Professional Domain:**
1. Recruits and registers professionals
2. Manages professional profiles, credentials, and documentation
3. Verifies qualifications and tracks document expiry
4. Manages professional capacity and workload
5. Tracks availability and onboarding
6. Supports professional development and offboarding

**Municipality Domain:**
7. Maintains municipality reference data
8. Manages sagsbehandler contact information
9. Tracks municipal grants and budgets
10. Receives and logs case requests
11. Coordinates municipal communication

**Case Domain:**
12. Creates and manages support cases
13. Assesses case complexity systematically
14. Tracks professional assignments
15. Manages case handovers and status changes
16. Supports case closure and archival

**Matching Domain:**
17. Supports matching professionals to cases
18. Ranks candidates with transparent scoring
19. Requires human approval for all assignments
20. Tracks assignment history and alternatives
21. Preserves algorithm explainability

**Delivery Domain:**
22. Documents support sessions
23. Tracks hours worked and registered
24. Maintains communication logs
25. Verifies work quality and completion
26. Tracks progress against case goals

**Governance Domain:**
27. Logs all important actions and decisions
28. Maintains immutable audit trails
29. Ensures GDPR compliance (minimization, retention, deletion)
30. Manages access permissions
31. Supports data protection and privacy
32. Manages document verification
33. Enables compliance reporting

### What Kurshshifte-Match Is NOT

It is explicitly **not**:

- **A public job marketplace** — Recruitment is for Kurshshifte's professionals only, not a general employment platform
- **A municipal case management system** — Municipalities have their own case systems; Kurshshifte-Match only holds coordination data
- **An ERP or accounting system** — Financial records and payroll are separate systems
- **A payroll system** — Professional compensation is handled separately
- **A messaging or chat platform** — Communication happens via email and phone outside the platform
- **A clinical journal or medical system** — Health data is not stored here
- **An autonomous decision maker** — Humans always make decisions; the platform records them
- **A monitoring or surveillance tool** — Not designed to monitor behavior outside work
- **A citizen portal** — Citizens don't use this platform; they work with sagsbehandlere and professionals
- **A substitute for professional judgment** — The platform supports decisions but never replaces them

---

## GUIDING PRINCIPLES

These principles guide all decisions about the platform, from feature design to data architecture:

### 1. Human Decisions Always Prevail

The platform supports decisions; it never makes them.

Case Coordinators always decide whether to create a case, which professional to select, whether to approve hours, and whether to change professionals. The system provides information but never constrains or overrides human judgment.

**Implication:** No algorithmic automatic approval, no forced matching, no black-box decisions.

---

### 2. Documentation Before Automation

If we have not documented a process, we do not automate it.

Before building a workflow, we write down exactly what happens, who decides what, and what information is needed. Only then do we implement it in the system.

**Implication:** Workflows are documented business processes before they become code. DOCUMENTATION_GOVERNANCE.md prevents ad-hoc automation.

---

### 3. GDPR by Design

Privacy is not an afterthought; it is a design requirement.

Minimum necessary information only. Citizens identified by initials, not names. No CPR numbers stored. No contact information transferred without explicit decision. Data deleted per legal requirements. Consent documented.

**Implication:** Every data field must have a business justification. If we don't need it, we don't collect it.

---

### 4. Single Source of Truth

One version of the truth for each piece of information.

A case exists in one place. A professional profile exists in one place. Hours worked are registered once. If information lives in multiple places, they must be synchronized automatically or the system is not trustworthy.

**Implication:** Integration and data consistency are non-negotiable requirements.

---

### 5. Every Important Action is Auditable

Audit events record what happened, who decided, and when.

If someone asks "why was this professional matched to this case?" or "how many hours were registered last month?" the answer is in the audit trail. No guessing. No searching. No "I think someone emailed that decision."

**Implication:** Audit events are part of the core workflow, not added later.

---

### 6. Minimize Sensitive Data

The less sensitive information we hold, the less can be compromised.

Municipalities keep their own assessments. Professionals keep their own credentials. We keep only the coordination information needed to do our job.

**Implication:** Data minimization is a security strategy.

---

### 7. Business Language Before Technical Language

We speak the language of the domain (municipalities, professionals, support) not the language of technology.

Case Coordinator (not Admin). Session Log (not note). Grant (not budget). Professional Matching (not assignment). Audit Event (not transaction). This is enforced in UBIQUITOUS_LANGUAGE.md.

**Implication:** Business teams and developers use the same vocabulary. Misunderstandings drop.

---

### 8. Support Professional Judgment, Never Replace It

The system is a tool for professionals, not a constraint on them.

A professional can write their own session notes because they know their work. A Case Coordinator can select a professional based on judgment because they know the case. The system makes information available; professionals make decisions.

**Implication:** We never force professionals into processes that feel unnatural. We observe how they work and design around it.

---

### 9. Scalability Without Structural Assumptions

The platform works the same whether Kurshshifte has 2 employees or 200.

Role names describe functions (Case Coordinator) not organizational units. Permissions are role-based not person-based. Data is decentralized by case, not by office. Same workflows work for any organization size.

**Implication:** Kurshshifte's growth does not require platform changes to accommodate new titles or departments.

---

### 10. Transparency Over Convenience

If a process is automated but opaque, we choose transparency.

We tell the municipality what happened and why. We show the professional why they weren't selected. We document decisions even if it requires more work. The goal is trust, not convenience.

**Implication:** Whenever transparency and ease-of-use conflict, transparency wins.

---

### 11. Quality Measured, Not Assumed

We do not guess whether the platform improves quality; we measure it.

What does a successful match look like? How long does it take? Are professionals retained? Are municipalities satisfied? Do citizens stay in support? We know because we track it.

**Implication:** Success metrics are built in, not added later.

---

### 12. Data Belongs to the Party That Needs It

Municipalities own their citizens' municipal data. Professionals own their work records. Kurshshifte owns coordination data.

We do not try to be the permanent archive for everyone. We hold what we need and make it clear who owns what.

**Implication:** Clear data ownership prevents disputes about data rights.

---

### 13. Integration, Not Replacement

The platform integrates with municipal systems (in future phases), not replaces them.

Municipalities keep their own case management systems. We eventually integrate with them for inquiry flow. We never pretend to be the municipality's system.

**Implication:** Our system is one piece of a larger ecosystem, not the center of it.

---

### 14. Auditability Enables Quality

Because every important action is auditable, we can review and improve.

We can analyze which professionals work best with which case types. We can identify where the process slows down. We can spot problems before they become failures. Data drives improvement.

**Implication:** Audit trails are not just for compliance; they're for continuous improvement.

---

### 15. Professional Autonomy Within Boundaries

Professionals have autonomy in how they work, within clear boundaries.

They choose how to document, how to engage the citizen, how to use their time. They cannot see other professionals' data, cannot access cases they're not assigned to, cannot approve their own hours. Boundaries are clear; autonomy is real.

**Implication:** Professionals are trusted professionals, not monitored workers.

---

## SUCCESS METRICS

These are business outcomes that indicate whether Kurshshifte-Match is succeeding:

### Timeliness

- **Time from municipality inquiry to case creation:** Target ≤ 3 days (currently weeks)
- **Time from case creation to first professional contact:** Target ≤ 5 days (currently weeks)
- **Time from inquiry to active support:** Target ≤ 1 week (currently 2–4 weeks)

**Why:** Speed matters because citizens' motivation windows are real.

### Match Quality

- **Successful match rate (professional accepts and completes assignment):** Target ≥ 85%
- **Professional retention rate:** Target ≥ 90% (same professional stays with case until completion)
- **Match failure rate (assignment terminated early):** Target ≤ 10%

**Why:** Good matches don't fail. If matches are failing, we're not doing well.

### Documentation Completeness

- **Cases with complete audit trail:** Target 100%
- **Session logs completed (for active assignments):** Target ≥ 95%
- **Hours registered within 1 week of session:** Target ≥ 90%
- **Professional credentials verified before assignment:** Target 100%

**Why:** Incomplete documentation is invisible work, which is underpaid and undervalued.

### Municipality Satisfaction

- **Municipality satisfaction with case coordination:** Target ≥ 4.0/5.0 (measured via survey)
- **Municipalities receiving transparent hour/budget information:** Target 100%
- **Municipalities reporting improved confidence in support tracking:** Target ≥ 80%

**Why:** If municipalities don't see value, the model doesn't work.

### Professional Satisfaction

- **Professionals satisfied with case assignment clarity:** Target ≥ 4.0/5.0
- **Professionals reporting that documentation is manageable:** Target ≥ 4.0/5.0
- **Professionals able to view and verify own hours registered:** Target 100%

**Why:** If professionals don't want to work with us, quality suffers.

### Grant Utilization

- **Grant utilization accuracy (hours registered match grant allocated):** Target ± 5%
- **Cases completed within grant budget:** Target ≥ 95%
- **Grant adjustment rate (changes to allocated budget):** Target ≤ 5% of cases

**Why:** Accurate grant tracking builds municipal trust.

### Operational Efficiency

- **Cases managed per Case Coordinator:** Target growth (currently unknown, measured to establish baseline)
- **Administrative time per case:** Target reduction of 40% from pre-platform baseline
- **Manual data re-entry:** Target 0 (systems integrated)

**Why:** Efficiency means Kurshshifte can scale without proportional cost.

### Compliance and Risk

- **Cases with documented consent/authorization:** Target 100%
- **Data deletion per GDPR timeline:** Target 100% (data deleted when retention period expires)
- **Audit trail integrity:** Target 100% (no audit logs deleted or modified)
- **Security incidents (unauthorized access, data breach):** Target 0

**Why:** Compliance failures destroy trust and create legal risk.

---

## SCOPE BOUNDARIES

### Included (In MVP or Early Phases)

**Core coordination:**
- Case intake from municipality
- Case information gathering and assessment
- Professional profile management
- Professional selection and assignment
- Session documentation and hour registration
- Grant tracking and approval
- Professional credential verification
- Audit event logging
- Case completion and closure

**Reporting:**
- Case status reports for municipalities (external, not in platform)
- Hour and budget summaries (external, not in platform)
- Professional performance summaries (internal only)

### Excluded (Not in MVP, May Come Later)

**Municipality integration:**
- Direct municipality login to the platform (Phase 2+)
- API for municipalities to submit inquiries programmatically (Phase 2+)
- Real-time synchronization with municipal case systems (Phase 2+)

**Communication:**
- Messaging between Kurshshifte, professionals, and municipalities (Phase 3+)
- Scheduling and calendar integration (Phase 3+)
- Notification system (Phase 2+)

**Professional development:**
- Training modules or courses
- Competency tracking
- Certification management

**Financial:**
- Invoicing and billing
- Payroll processing
- ERP integration

**Citizen involvement:**
- Citizen portal or login
- Citizen feedback or rating
- Citizen communication tools

**Clinical or diagnostic:**
- Medical history storage
- Diagnosis or assessment tools
- Treatment plan management
- Mental health screening

**Monitoring or surveillance:**
- GPS tracking or location monitoring
- Activity monitoring of professionals
- Video or audio recording
- Sentiment analysis of communications

### Future (Potential Expansion, Not MVP)

- Integration with municipal inquiry systems (when municipalities request standardized API)
- Professional messaging and scheduling (when operational need emerges)
- Predictive analytics (when we have sufficient data and clear use case)
- Citizen feedback collection (Phase 3+, with privacy safeguards)
- Mobile apps for professionals or municipalities (when desktop platform is stable and mobile use case is clear)
- Multi-language support (if Kurshshifte expands beyond Danish municipalities)

---

## RELATIONSHIP TO OTHER DOCUMENTS

### The Document Hierarchy

Kurshshifte-Match documentation follows a clear hierarchy:

```
DOMAIN_VISION.md (This document)
    ↓
    Answers: Why does the platform exist?
    Audience: Everyone
    
    ↓
    
DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md
    ↓
    Answers: Who are the actors? What are their responsibilities?
    Audience: Architects, Product Owners, Developers
    
    ↓
    
UBIQUITOUS_LANGUAGE.md
    ↓
    Answers: What do our terms mean exactly?
    Audience: Everyone (reference document)
    
    ↓
    
DOCUMENTATION_GOVERNANCE.md
    ↓
    Answers: How do we maintain consistency?
    Audience: Documentation writers and reviewers
    
    ↓
    
Architecture Baseline & ADRs
    ↓
    Answers: What are the technical constraints and choices?
    Audience: Architects, Developers
    
    ↓
    
Workflows (WF-001 through WF-013)
    ↓
    Answers: How does the work actually flow through the system?
    Audience: Architects, Developers, QA
    
    ↓
    
Technical Specification
    ↓
    Answers: What code do we need to write?
    Audience: Developers
    
    ↓
    
Code & Implementation
    ↓
    Answers: How is it actually built?
    Audience: Developers
```

### How This Document Relates to Each

**DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md:**
- This Vision explains WHY we have those actors and boundaries
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL explains WHO they are and WHAT they do
- This Vision says "We respect municipal autonomy and privacy" → DOMAIN_ACTORS explains how (Municipalities don't access the platform directly)

**UBIQUITOUS_LANGUAGE.md:**
- This Vision uses the terms defined in UBIQUITOUS_LANGUAGE
- This Vision explains why we use those terms (Business language before technical language)
- UBIQUITOUS_LANGUAGE enforces the vocabulary; this Vision explains the philosophy

**DOCUMENTATION_GOVERNANCE.md:**
- This Vision is the WHY; DOCUMENTATION_GOVERNANCE ensures we stay consistent
- DOCUMENTATION_GOVERNANCE ensures all documents use terms from this Vision
- This Vision establishes the principle "Single Source of Truth" → DOCUMENTATION_GOVERNANCE enforces it

**Architecture:**
- Architecture decisions should support this Vision
- If an architecture choice conflicts with these principles, we revisit it
- Principle: "Human Decisions Always Prevail" → Architecture must not constrain human choice
- Principle: "Every Important Action is Auditable" → Architecture must include audit logging

**Workflows:**
- Workflows implement this Vision in practice
- Each workflow WF-001 through WF-013 should support at least one guiding principle
- If a workflow conflicts with the Vision, we redesign the workflow, not the Vision

**Technical Specification:**
- Technical choices should support the Vision
- Data minimization principle → Specification must not store unnecessary fields
- GDPR by design → Specification must include privacy-preserving technical choices
- Auditability → Specification must include audit log tables and queries

**Code:**
- Code should implement the Technical Specification faithfully
- Code should not add features or data fields not in the specification
- Code should enforce the boundaries described in this Vision (e.g., citizens cannot access the platform)

---

## FOR THE READER

### A New Developer's First Question

**"Why does this platform exist?"**

**Answer:** To reduce delays and friction in matching citizens with support professionals, so that Kurshshifte can serve municipalities reliably and at scale, and so that citizens receive suitable support more quickly.

### A New Product Owner's First Question

**"What are we optimizing for?"**

**Answer:** Speed of matching (weeks to days), match quality (successful first placements), documentation completeness (invisible work becomes visible), and municipal trust (transparent coordination).

### A Municipal Decision-Maker's First Question

**"Why should we adopt this?"**

**Answer:** Because we will give you clear, real-time visibility into whether contracted support is actually happening, who's providing it, and whether the hours match your budget. Because delays will drop. Because if a professional changes, you won't lose information.

### An Architect's First Question

**"What are the constraints?"**

**Answer:** Municipalities do not access the platform (they are customers, not users). Citizens do not access the platform. The platform does not make decisions (humans do). All important actions must be auditable. Sensitive data must be minimized. The system must work at any organization size.

---

## CONCLUSION

Kurshshifte-Match exists because **professional judgment matters, documentation matters, and time matters.**

When a citizen is ready for support, delays are invisible damage. When a professional is assigned without proper information, mismatches are common. When work is done but undocumented, it might as well never happen.

This platform is our commitment to making the coordination efficient, the matching thoughtful, and the documentation complete.

The goal is not to automate professional judgment or replace municipal expertise. The goal is to remove friction so that good work can happen faster and be recognized more clearly.

---

**For more details, see:**
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md (who are we serving?)
- UBIQUITOUS_LANGUAGE.md (what do our terms mean?)
- Architecture documents (how is it built?)
- Workflows WF-001 through WF-013 (what actually happens?)

**Next steps:** A new reader should then review DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md to understand the ecosystem in which this platform operates.
