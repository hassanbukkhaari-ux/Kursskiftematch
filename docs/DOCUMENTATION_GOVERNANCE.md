# Documentation Governance

**Document Purpose:** Establish governance rules for all documentation across Kurshshifte-Match architecture, workflows, and technical specifications.

**Status:** ACTIVE GOVERNANCE RULE  
**Version:** 1.0  
**Last Updated:** June 27, 2026  
**Authority:** Project Architecture Governance

---

## THE FOUNDATIONAL DOCUMENTS

Two documents form the foundation for ALL other Kurshshifte-Match documentation:

1. **DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md**  
   Defines: Who the actors are, what responsibilities they have, what they can and cannot do, and how the system boundaries work.

2. **UBIQUITOUS_LANGUAGE.md**  
   Defines: Every core domain term, exactly once, with definition, what it is NOT, who uses it, and where it's used.

These two documents are ABOVE the architecture layer. They are the source of truth for the entire project.

---

## THE GOVERNANCE RULE

### Every workflow, ADR, architecture document, and technical specification MUST:

1. **Use terminology exactly as defined** in DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md and UBIQUITOUS_LANGUAGE.md

2. **Treat these documents as the single source of truth** for terminology

3. **Reference these documents explicitly** when terminology might be ambiguous

4. **Request changes to these documents** if new terms are needed (do not create conflicting definitions elsewhere)

5. **Ensure no terminology conflicts** exist between any two documents

### Specific Rules

#### Rule 1: Roles Must Be Named Correctly

**Requirement:**  
- Use: **Case Coordinator** (business role name)
- Never use: "Administrator", "Admin", "Case Management", or other role-like terms
- Distinguish business role from system role explicitly

**Applied to:** All workflows, all architecture documents

**Example - Correct:**
```
Decision Gate 1: Accept Inquiry
Decision Owner: Case Coordinator (system role: Admin)
```

**Example - Incorrect:**
```
Decision Gate 1: Accept Inquiry  
Decision Owner: Administrator
```

**Why:** "Administrator" is ambiguous and suggests a single person role when multiple people might fill it.

---

#### Rule 2: Core Terms Must Match Exactly

**Requirement:**  
Any of these terms must be used exactly as defined in UBIQUITOUS_LANGUAGE.md:

- Municipality
- Citizen
- Case
- Professional
- Match / Professional Matching
- Match Candidate
- Assignment
- Session
- Session Log
- Registered Hours
- Grant
- Contact Disclosure
- Handover
- Audit Event
- Workflow
- Capability
- Role
- Permission
- Credentials
- Complexity
- Sagsbehandler
- Case Coordinator

**Applied to:** All documents, all code eventually

**If you use these terms, you must use them as defined.** Do not create alternate definitions.

**Example - Correct:**
```
The Professional submits a Session Log documenting the session.
The Case Coordinator reviews the Session Log and approves it.
```

**Example - Incorrect:**
```
The professional submits a case note.
The administrator reviews the note.
```

(Problem: "case note" is vague; "administrator" is role-ambiguous)

---

#### Rule 3: New Terms Must Be Added to Ubiquitous Language First

**Requirement:**  
If you need a new term that doesn't exist in UBIQUITOUS_LANGUAGE.md:

1. STOP writing your document
2. ADD the term to UBIQUITOUS_LANGUAGE.md with full definition
3. GET agreement from project lead (Hassan)
4. THEN use the term in your document

**Do NOT:** Create ad-hoc definitions in workflow documents or technical specs.

**Applied to:** All documentation work

---

#### Rule 4: Reference the Foundational Documents

**Requirement:**  
Documents that define responsibilities or use domain terminology MUST reference the foundational documents:

- Workflows: Add note: "Role and term definitions: see DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md and UBIQUITOUS_LANGUAGE.md"
- Architecture documents: Link to foundational docs
- Technical specs: Reference for data model terminology

**Example:**
```markdown
## Terminology

For definitions of roles, terms, and actors, see:
- DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md
- UBIQUITOUS_LANGUAGE.md

This document uses all terminology as defined in those documents.
```

---

#### Rule 5: Conflict Resolution

**If a conflict exists between:**
- A workflow document and the foundational documents
- An architecture document and the foundational documents
- Two workflow documents about terminology

**Then:** The foundational documents are the single source of truth. Update the conflicting document to match.

**Process:**
1. Identify the conflict
2. Check UBIQUITOUS_LANGUAGE.md for the correct term
3. Update the conflicting document
4. Note the change in commit message

---

## DOCUMENT TYPES AND REQUIREMENTS

### Workflow Documents (WF-001 through WF-013)

**Must include:**
- Explicit reference to DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md
- All actors named as defined (business roles, not system roles)
- All terminology used per UBIQUITOUS_LANGUAGE.md
- Section: "Terminology" linking to foundational docs

**Must NOT:**
- Create new role names not in DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md
- Use abbreviated or informal terms (use exact terms)
- Assign responsibility to "systems" or "departments" (assign to roles)

---

### Architecture Decision Records (ADRs)

**Must include:**
- Reference to foundational documents
- Use of defined terminology throughout
- Clear actor responsibilities (per DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md)

**Must NOT:**
- Introduce new terminology without adding to UBIQUITOUS_LANGUAGE.md
- Conflict with defined roles or responsibilities

---

### Technical Specifications

**Must include:**
- Data model terminology matching UBIQUITOUS_LANGUAGE.md
- Role definitions matching DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md
- Permission/access control based on defined System Roles

**Must NOT:**
- Use abbreviated or informal names for data entities
- Create role-like concepts not in DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md
- Conflate system roles with business roles

**Example - Correct:**
```sql
-- Table: Case
-- Terminology: "Case" as defined in UBIQUITOUS_LANGUAGE.md
-- Owner: Kurshshifte (via Case Coordinator role)

CREATE TABLE cases (
  id UUID PRIMARY KEY,
  citizen_identifier VARCHAR(10),  -- initials only, per Citizen def
  status VARCHAR(50),  -- READY_FOR_MATCHING per workflow defs
  complexity_level VARCHAR(20),  -- LOW, MEDIUM, HIGH, CRITICAL per Complexity def
  ...
)
```

---

### Process Documentation

**Must include:**
- Explicit workflow references (WF-001, WF-002, etc.)
- Role names from DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md
- Term definitions from UBIQUITOUS_LANGUAGE.md

---

## EXAMPLES: CORRECT VS INCORRECT

### Example 1: Workflow Document

**INCORRECT:**
```markdown
## Actors
- Municipality
- Kurshshifte Administrator
- Professional

## Main Flow
Step 2: Kurshshifte assesses complexity
Step 3: Administrator approves hours
```

**Problems:**
- "Kurshshifte Administrator" is system role, not business role
- "Kurshshifte" is organization, not a role
- Missing reference to foundational documents

**CORRECT:**
```markdown
## Actors
- Municipality Sagsbehandler
- Case Coordinator (system role: Admin)
- Professional

## Terminology
For actor and term definitions, see DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md 
and UBIQUITOUS_LANGUAGE.md

## Main Flow
Step 2: Case Coordinator assesses Complexity
Step 3: Case Coordinator approves Registered Hours
```

---

### Example 2: Architecture Document

**INCORRECT:**
```markdown
## Roles in the System

The system has two roles:
1. Administrators - manage everything
2. Users - can only view their own data
```

**Problems:**
- "Administrator" is not a defined role
- "Users" is vague
- Doesn't match DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md

**CORRECT:**
```markdown
## Roles in the System

For complete actor and role definitions, see DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md

Platform roles in MVP:
1. Case Coordinator (business role; system role: Admin) - full platform access
2. Professional (business role; system role: Professional) - limited access to own case
```

---

### Example 3: Technical Specification

**INCORRECT:**
```javascript
// Case management module
class CaseManager {
  createCase(municipalityId, citizenInfo) { ... }
  approvHours(caseId, hours) { ... }  // spelled wrong
  getAdminCases() { ... }  // "admin" is ambiguous
}
```

**Problems:**
- "CaseManager" is not a role (Case Coordinator is)
- "admin" is ambiguous
- Doesn't reflect workflow terminology

**CORRECT:**
```javascript
// CaseCoordinator operations module
// Per UBIQUITOUS_LANGUAGE.md: Case Coordinator is the business role with Admin system role
class CaseCoordinatorOperations {
  createCase(municipalityId, citizenInitials, situation) { ... }
  approveRegisteredHours(caseId, hours) { ... }
  getCaseCoordinatorCases(coordinatorId) { ... }
}
```

---

## ENFORCEMENT

### How to Check Compliance

Before finalizing any document:

1. **Scan for undefined terms** - Do all terms exist in UBIQUITOUS_LANGUAGE.md?
2. **Check role naming** - Are roles named per DOMAIN_ACTORS_AND_RESPONSIBILITY_MODEL.md?
3. **Verify references** - Does the document reference the foundational documents?
4. **Look for conflicts** - Do any definitions conflict with foundational documents?
5. **Confirm terminology** - Are all terms used exactly as defined?

### Violation Consequences

If a document violates this governance rule:

1. **Before merge:** Identify violations in review
2. **Request changes:** Author must update to match foundational documents
3. **Resubmit:** Document resubmitted after corrections
4. **After merge:** If violations slip through, fix in follow-up commit

---

## WHEN TO UPDATE THE FOUNDATIONAL DOCUMENTS

The foundational documents should be updated when:

1. **New term needed** - Workflow needs a term not yet defined
2. **Definition clarification** - Current definition is ambiguous
3. **Scope change** - New domain concept requires definition
4. **Error correction** - Term defined incorrectly

The foundational documents should NOT be updated for:

1. **Convenience** - Just to avoid defining a term properly
2. **Shorthand** - Creating abbreviated versions of terms
3. **Tool-specific** - Creating technical aliases (use mapping instead)
4. **Preference** - Personal preference for different terminology

### Process to Update Foundational Documents

1. **Propose change** to project lead (Hassan)
2. **Discuss impact** - How does this affect other documents?
3. **Update document** - Add/change term definition
4. **Update all references** - Find all documents using old definition
5. **Commit together** - Foundational docs + all affected documents in one commit

---

## TIMELINE

**Effective immediately:** All new documents must follow this governance.

**Phase 1 (WF-001 through WF-013):** All workflow documents reviewed for compliance before approval.

**Phase 2 (Technical Specification):** All technical docs reviewed against foundational documents.

**Phase 3 (Code):** Code variable/class names reviewed for alignment with defined terminology.

---

## GOVERNANCE AUTHORITY

**Changes to this governance rule require:** Explicit approval from project lead (Hassan)

**Authority:** This governance rule is binding on all Kurshshifte-Match documentation and eventual code.

**Review cadence:** Quarterly review of compliance; annual review of governance itself.

---

## QUICK REFERENCE: TERMS YOU MUST USE CORRECTLY

| If you're writing about... | Use this term | NOT these |
|---|---|---|
| The social worker at municipality | **Sagsbehandler** | Caseworker, case manager |
| The support provider | **Professional** | Support worker, helper, assistant, mentor (okay as alternative title only) |
| Kurshshifte staff creating cases | **Case Coordinator** | Administrator, admin, case manager |
| System permissions | **Admin** (system role) | Administrator (business role) |
| A citizen receiving support | **Citizen** | Client, user, service user |
| A formal record of citizen support | **Case** | Patient record, case file |
| Matching a professional to a case | **Match** or **Professional Matching** | Assignment (assignment is the result, not the process) |
| The result of matching | **Assignment** | Match (match is the process) |
| A meeting with professional | **Session** | Visit, appointment, meeting |
| Documentation of a session | **Session Log** | Case note, support note |
| Hours worked by professional | **Registered Hours** | Billable hours, work hours |
| Budget for case support | **Grant** | Allocation, budget, funding |
| Verification of professional qualifications | **Credentials** | Qualification, documents |
| Difficulty of case | **Complexity** | Risk level, difficulty |
| Transfer to new professional | **Handover** | Transition, change |
| Record of what happened | **Audit Event** | Log entry, transaction |
| A sequence of steps | **Workflow** | Process, procedure (okay as alternative only) |
| What the organization can do | **Capability** | Function, service, department |

---

## COMMITMENT

By working on Kurshshifte-Match, you commit to:

✓ Using terminology exactly as defined  
✓ Adding new terms to UBIQUITOUS_LANGUAGE.md before using them  
✓ Referencing foundational documents  
✓ Reporting terminology conflicts immediately  
✓ Not creating alternate definitions elsewhere  
✓ Helping maintain consistency across hundreds of pages of documentation  

---

**This governance prevents misunderstandings, ensures consistency, and scales documentation as the project grows.**

**Questions? Discuss with project lead (Hassan) before violating these rules.**
