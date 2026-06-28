# DO NOT BUILD
## Kursskifte Match 2.0 — Forbidden Features & Constraints

**Date:** June 27, 2026  
**Status:** CONSTRAINTS LOCKED  
**Version:** 1.0

---

## ⚠️ CRITICAL RULE

**If a feature is listed below, DO NOT BUILD IT IN MVP.**

This is not a wish list. This is a list of things explicitly forbidden until Phase 2 or later.

Any code committed for these features will be rejected.

---

## FORBIDDEN IN MVP

### 1. ❌ Municipality Portal

**What is forbidden:**
- Sagsbehandler login to platform
- Sagsbehandler access to cases
- Sagsbehandler access to professional info
- Sagsbehandler ability to edit anything
- Sagsbehandler read-only dashboard

**Why forbidden:**
- Out of MVP scope
- Municipalities are budget providers, not platform users
- Sagsbehandler contact info stored (admin-managed)
- Reduces scope (no SSO, no municipal user management)
- Reduces data exposure (no credentials stored)

**Why it works without:**
- Professional can access contact info via ContactDisclosure (admin-approved)
- Kursskifte admin manages cases on behalf of municipality
- Reports prepared by admin, shared externally
- Sagsbehandler reached via phone/email directly

**Deferred to:**
- Phase 2 (optional, low-priority)
- Read-only, minimal access if implemented

**Code markers if written anyway:**
```
# FORBIDDEN: IF YOU SEE THIS, REJECT
# /pro/municipality/[municipalityId]/dashboard
# /api/municipality/cases
# These are not approved for MVP
```

---

### 2. ❌ Citizen Portal

**What is forbidden:**
- Citizen login to platform
- Citizen access to their case
- Citizen messaging to professional
- Citizen ability to view documents
- Any citizen-facing interface

**Why forbidden:**
- Out of business model
- Kursskifte provides professional-delivered support
- Citizens do not use digital systems for this type of support
- Creates liability (child safety, data protection)
- MVP does not need citizen visibility

**Why it works without:**
- Professional is single point of contact
- Professional delivers support in person, by phone, by meeting
- Documentation is for professional/admin only
- Citizens have no need to log in

**Deferred to:**
- Probably never (out of business model)
- If implemented, requires separate legal/data review

**Code markers if written anyway:**
```
# FORBIDDEN: IF YOU SEE THIS, REJECT
# /citizen/[citizenId]/dashboard
# /api/citizen/cases
# These are NOT approved and violate MVP scope
```

---

### 3. ❌ In-App Messaging Platform

**What is forbidden:**
- Message threads between professional and sagsbehandler
- In-app chat interface
- Message notifications
- Message archive
- Typing indicators, read receipts

**Why forbidden:**
- Out of MVP scope
- Contact happens via email/phone (simpler, already works)
- Adds complexity (encryption, retention, compliance)
- Not core to case management
- Communication audit trail better done via ContactLog (simpler)

**Why it works without:**
- Professional gets contact info via ContactDisclosure
- Reach sagsbehandler by phone (logged in ContactLog)
- Reach via email (logged in ContactLog)
- No real-time communication needed for this use case
- Professional-initiated contact is normal workflow

**Deferred to:**
- Phase 3 (if adoption and user demand justify it)
- Would require separate encryption/audit strategy

**Code markers if written anyway:**
```
# FORBIDDEN: IF YOU SEE THIS, REJECT
# /messages, /chat, /inbox
# ContactLog exists for communication audit, NOT in-app messaging
# Messaging platform is Phase 3 if ever
```

---

### 4. ❌ Billing/ERP Integration

**What is forbidden:**
- Invoice generation
- Invoice sending to municipalities
- Billing dashboard
- ERP connector
- Invoice status tracking
- Payment integration

**Why forbidden:**
- Out of MVP scope
- Billing is separate concern (handled externally)
- Hours tracking is for payroll QA and grant control only
- No invoicing in MVP

**Why it works without:**
- RegisteredHours tracks hours for payroll purposes
- Kursskifte admin can export hours (CSV) for external billing
- Municipality and professional paid through separate channels
- No money changes hands on this platform

**Deferred to:**
- Phase 2+ (if Kursskifte becomes professional billing platform)
- Requires separate ERP system integration

**Code markers if written anyway:**
```
# FORBIDDEN: IF YOU SEE THIS, REJECT
# /admin/billing, /api/invoices, /api/ecommerce
# Billing is NOT part of Match 2.0
# Hours are exported to separate payroll/billing system
```

---

### 5. ❌ Clinical Journal System

**What is forbidden:**
- Storing diagnoses
- Storing psychological assessments
- Storing clinical notes (separate from SessionLog observations)
- Mental health tracking
- Crisis assessment forms
- Medication tracking
- Healthcare system integration (import diagnoses, etc.)

**Why forbidden:**
- Out of MVP scope
- Clinical data belongs in healthcare systems, not case management
- Privacy risk (sensitive health info)
- Compliance complexity (healthcare regulations vary)
- SessionLog observations are sufficient for support documentation

**Why it works without:**
- SessionLog captures observations (mood, behavior, follow-ups)
- Sagsbehandler handles clinical coordination
- Professional refers to healthcare systems (don't duplicate)
- Diagnoses stored only as free text in CaseComplexityFactors.diagnosis (optional note)

**Deferred to:**
- Never (unless legal path to healthcare integration clear)
- Would require separate healthcare-grade audit/compliance

**Code markers if written anyway:**
```
# FORBIDDEN: IF YOU SEE THIS, REJECT
# /admin/diagnoses, /api/clinical, /pro/assessment
# Clinical data is NOT stored in Match 2.0
# Refer to external healthcare systems
```

---

### 6. ❌ Automatic Professional Assignment

**What is forbidden:**
- Auto-assign based on score threshold
- Auto-recommend without admin review
- Automatic transitions between professionals
- Automatic handover without human approval
- Any assignment without explicit admin decision

**Why forbidden:**
- Human judgment required (too much at stake)
- Professional selection is high-consequence decision
- Matching algorithm may not capture all factors
- Admin accountability required
- Safety concerns (safeguarding, fit)

**Why it works without:**
- MatchRun generates scored candidates
- Admin reviews scores + explanation
- Admin can see qualifications, capacity, history
- Admin makes final choice (logged as decision)
- Gives admin full control and visibility

**Deferred to:**
- Phase 2+ (if matching improves enough)
- Would require separate approval process

**Code markers if written anyway:**
```
# FORBIDDEN: IF YOU SEE THIS, REJECT
# if (best_candidate.score > 0.85) { auto_assign() }
# NO AUTOMATIC ASSIGNMENTS
# Admin must explicitly select and confirm
```

---

## CONSTRAINTS (Hard Limits)

### Technical Constraints

**No code before Technical Specification approved:**
- All development blocked until spec is signed off
- No exceptions, no "just get started"
- Any code written before approval will be discarded

**No custom backend:**
- Use Supabase (PostgreSQL + Auth + RLS)
- Do not build custom Node.js/Django/etc. backend
- Do not use other database (Postgres only)

**No separate microservices:**
- Single Next.js application
- Do not split admin/professional/public into separate apps
- Unified deployment only

**No client-side database (localStorage) for production:**
- Demo only (launch site)
- Not for Match 2.0 production use
- Supabase is source of truth

### Data Constraints

**No PII beyond what's specified:**
- Citizen: initials only (NOT full name, NOT CPR)
- Professional: contact + qualifications (NOT SSN, NOT full history)
- Sagsbehandler: contact info only (NOT credentials)
- No undocumented fields

**No unencrypted sensitive fields:**
- SessionLog observations: encrypted
- Safeguarding details: encrypted
- Contact log notes: encrypted
- Citizen notes: encrypted
- HandoverNote: encrypted

**No derived values stored:**
- remaining_hours: calculated
- workload_status: calculated
- used_hours: calculated
- is_expired: calculated
- current_assigned_load: calculated

### Authorization Constraints

**No municipality login in MVP:**
- Sagsbehandler contact info stored, but NO login
- NO role for sagsbehandler
- Admin manages everything on their behalf

**No citizen login:**
- Citizens never authenticate
- Citizens never access platform

**Only two roles in MVP:**
- admin (Kursskifte staff)
- professional (fagperson)
- No sagsbehandler, no citizen, no other roles

**RLS enforced for all sensitive data:**
- Row-level security for cases, documents, sessions
- Not optional, not for future
- Enforced at database level

### Operational Constraints

**All assignments explicit:**
- CaseAssignment table tracks them
- Admin must explicitly create/transition
- No automatic workflows
- All changes audited

**All handovers structured:**
- CaseHandover entity (not just notes)
- Requires approval for session log sharing
- Immutable once completed

**All contact disclosures audited:**
- ContactDisclosure table tracks every exposure
- Admin-initiated only
- Professional does not request contact info

**All hours reviewed (outside grant):**
- OUTSIDE_GRANT must be explicitly reviewed
- Admin approves/rejects per entry
- Immutable once reviewed

---

## SCOPE CREEP PREVENTION

### Questions to Ask

**If asked to add feature X:**

1. Is it in Master Directive's MVP scope?
   - If NO → It's Phase 2+ or forbidden
   - If YES → Check 2-5 below

2. Is it explicitly listed in /docs/ROADMAP.md Phase 1?
   - If NO → It's out of scope for MVP
   - If YES → Proceed to 3

3. Does it require Technical Specification approval?
   - If YES → Must wait for spec phase
   - If NO → May proceed if MVP-related

4. Is it one of the forbidden features?
   - If YES → DO NOT BUILD
   - If NO → May be acceptable

5. Is it essential for MVP to launch?
   - If NO → Defer to Phase 2
   - If YES → Discuss with Hassan

### Decision Tree

```
Feature request
  ↓
In Master Directive MVP scope?
  ├─ NO → "This is Phase 2+ or explicitly forbidden. See /docs/DO_NOT_BUILD.md"
  └─ YES ↓
In Phase 1 roadmap?
  ├─ NO → "This is Phase 2+. See /docs/ROADMAP.md"
  └─ YES ↓
Requires Technical Spec decision?
  ├─ YES → "Wait for Technical Specification approval (Week 1)"
  └─ NO ↓
Is it one of the forbidden features?
  ├─ YES → "FORBIDDEN. See /docs/DO_NOT_BUILD.md"
  └─ NO ↓
Proceed (or discuss with Hassan for edge cases)
```

---

## WHAT TO DO INSTEAD

### Municipality wants portal access?
**Instead:** Admin can prepare reports, email to sagsbehandler.  
**When:** Phase 2 if adoption justifies it.

### Professional wants messaging?
**Instead:** Reach sagsbehandler via email/phone, logged in ContactLog.  
**When:** Phase 3 if user demand justifies it.

### Need to track diagnoses?
**Instead:** CaseComplexityFactors has optional diagnosis note field (free text, minimal).  
**When:** Refer to external healthcare systems.

### Want automatic assignments?
**Instead:** Admin reviews matched candidates and confirms choice.  
**When:** Phase 2+ if matching improves enough.

### Need billing?
**Instead:** Export RegisteredHours as CSV, import to separate billing system.  
**When:** Phase 2+ if Kursskifte becomes billing platform.

---

## ENFORCEMENT

### Code Review

**Any PR attempting these will be rejected:**
- Municipality portal routes
- Citizen login/portal
- In-app messaging
- Billing code
- Clinical tracking
- Automatic assignments
- Client-side database (localStorage) for production data

**Code patterns to reject:**
```
REJECT:
/municipality/*, /citizen/*, /messages/*, /api/invoices/*
localStorage.setItem() for production data
auto_assign(), auto_match() without human confirmation
```

### Escalation

**If you believe something is necessary:**
1. File issue in GitHub (with justification)
2. Reference this document
3. Wait for Hassan approval
4. Only then build (if approved)

---

## PHASE 2 GATE

**Before Phase 2 starts:**
1. Review this document
2. Remove "FORBIDDEN" markers
3. Move features to Phase 2 spec
4. Update decision log
5. Hassan re-approves

**Nothing in this document becomes allowed without explicit approval.**

---

## APPENDIX: Why These Constraints?

### Why no municipality portal?
- Scope: Only Kursskifte needs visibility into all cases
- Safety: Reduces points of access/compromise
- Privacy: Less data exposed to external parties
- Budget: Admin manages everything
- Phase 2: If sagsbehandler demand clear, can add read-only portal

### Why no citizen portal?
- Business model: Professional-delivered, not digital-first
- Safety: Children/vulnerable adults, safeguarding concerns
- Privacy: Minimizes exposure of sensitive case info
- Liability: Opens data protection questions
- Probably never: Not part of Kursskifte's service model

### Why no in-app messaging?
- Scope: Email/phone contact sufficient
- Complexity: Adds encryption, retention, audit requirements
- Audit: ContactLog already tracks all communications
- Phase 3: Only if adoption/demand justifies
- Simpler: Email is proven, async-friendly, audited

### Why no billing?
- Scope: Hours tracked for payroll QA, not invoicing
- Separation: Billing is separate system
- Compliance: Payment processing out of scope
- Admin export: Can generate hours CSV for external system
- Phase 2+: If Kursskifte becomes billing provider

### Why no clinical journal?
- Scope: Case management, not healthcare
- Privacy: Healthcare data is sensitive (separate systems)
- Compliance: HIPAA/healthcare regulations differ
- Expertise: Kursskifte is social services, not healthcare
- Refer: SessionLog sufficient, healthcare systems handle clinical

### Why no automatic assignment?
- Stakes: Professional selection is high-consequence
- Judgment: Matching algorithm can't capture all factors
- Safety: Human review required (safeguarding)
- Accountability: Admin must own decision
- Phase 2+: Only if matching improves confidence

---

## SIGN-OFF

**This document is approved and locked.**

Any deviation requires explicit written approval from Hassan.

---

**Document by:** Kursskifte ApS — Product Constraints  
**Approved by:** Hassan  
**Status:** CONSTRAINTS LOCKED  
**Enforcement:** Code review, PR rejection on violation  
**Next Review:** Phase 2 gate (end of MVP, Sept 30, 2026)
