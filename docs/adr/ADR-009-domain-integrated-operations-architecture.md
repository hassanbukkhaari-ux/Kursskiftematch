# ADR-009: Shift from Matching-Focused to Domain-Integrated Operations Platform Architecture

**Date:** June 27, 2026  
**Status:** APPROVED  
**Deciders:** Hassan (Founder & Operator)  
**Context Provided By:** Claude (Architecture Documentation)

---

## PROBLEM STATEMENT

Early architectural documentation characterized Kurshshifte-Match as a "matching platform" or "professional lifecycle management platform." 

This characterization was incomplete and misleading because:

1. **Matching is one capability, not the primary purpose** — Kurshshifte-Match's primary purpose is to operationalize Kurshshifte ApS' complete business
2. **The platform integrates six distinct business domains**, not primarily one (matching)
3. **Matching depends on excellence in all other domains** — Without professional verification, case management, delivery documentation, and governance, matching cannot succeed
4. **Scaling requires systematic domain integration**, not just optimized matching

---

## DECISION

**Reorganize the architectural understanding and documentation of Kurshshifte-Match from a matching-focused perspective to an integrated domain-based operations platform perspective.**

### Key Changes

1. **Platform Description** — Change from "matching platform" to "digital operations platform supporting Kurshshifte ApS' complete delivery of relationship-based support services"

2. **Organize around six explicit domains:**
   - **Professional Domain** — Recruitment, profiles, verification, capacity, onboarding, offboarding
   - **Municipality Domain** — Municipalities, sagsbehandlere, grants, inquiries, cooperation
   - **Case Domain** — Citizens, cases, complexity, assignments, handovers, closure
   - **Delivery Domain** — Sessions, documentation, hours, contact logs, progress
   - **Governance Domain** — Audit, compliance, GDPR, permissions, retention
   - **Matching Domain** — Match runs, candidate ranking, human approval, assignment history

3. **Matching as Orchestration** — Matching is the central orchestration point that connects all six domains, not the primary purpose of the platform

4. **Domain Integration** — All six domains work together around the central Case entity:
   - Professional Domain provides candidates
   - Municipality Domain identifies need
   - Case Domain organizes work
   - Matching Domain connects them
   - Delivery Domain documents work
   - Governance Domain ensures integrity

---

## RATIONALE

### Why This Change Was Necessary

1. **Reflected Actual Architecture** — MASTER_DIRECTIVE.md and ROADMAP.md already describe a platform with 15+ core entities organized into distinct functional areas. The "matching platform" description didn't match the approved MVP scope.

2. **Matches MVP Scope** — The approved MVP includes:
   - Professional management (registration, verification, documents, capacity)
   - Case management (creation, complexity assessment, status tracking)
   - Grant management and budget control
   - Audit and compliance
   - Session documentation
   - Only a small part is matching

3. **Supports Scaling** — Kurshshifte cannot scale to 50+ municipalities by improving matching alone. Scaling requires systematizing ALL six domains.

4. **Clearer Communication** — Domain-based architecture is clearer for architects, developers, and municipal partners than "matching platform."

5. **Future Growth** — A domain-based architecture makes it clear how to add new capabilities (e.g., outcome measurement, mobile apps, advanced analytics) without disrupting the core design.

---

## CONSEQUENCES

### What Changes

**Conceptual:**
- Kurshshifte-Match is the complete operational platform, not a specialist tool
- Matching is one orchestration layer, not the raison d'être
- Success depends on excellence in all six domains, not just matching

**Architectural:**
- Future ADRs and design decisions organized by domain, not by matching-related features
- Technical Specification will have six domain sections, each with entities, APIs, workflows
- Workflow development (WF-003+) will explicitly align to domain boundaries
- Success metrics will measure domain health, not just matching quality

**Communicational:**
- Municipalities and professionals see Kurshshifte-Match as a complete professional support management platform
- Marketing and positioning emphasize operational professionalism, not just matching efficiency
- New team members understand the platform integrates six domains, not focuses on one

### What Doesn't Change

- No existing architecture decisions are reversed
- No code is rewritten or deleted
- No workflows are reconceptualized
- MASTER_DIRECTIVE.md entities and data model remain approved and correct
- ADR-001 through ADR-008 remain valid
- The matching algorithm and decision support remain unchanged

---

## IMPLEMENTATION

### Documentation Updates (Complete)

1. ✅ DOMAIN_VISION.md — Completely revised to introduce six domains and integrated operations perspective
2. ✅ Created explicit Domain section in DOMAIN_VISION.md documenting each domain's purpose and capabilities
3. ✅ Updated Executive Summary, Mission, Vision, and Platform Purpose sections
4. ✅ Updated CHANGELOG.md to document this architectural shift

### Downstream Effects (Pending)

1. ⏳ Technical Specification — Organize by domain when created
2. ⏳ Workflow development — WF-003 through WF-013 will align to domain boundaries
3. ⏳ API design — Group endpoints by domain
4. ⏳ Database schema — Organize tables by domain (already partially true in MASTER_DIRECTIVE.md)
5. ⏳ Team organization — Consider domain-based team assignments

---

## VALIDATION

### Consistency Check (Complete)

✅ Verified that all reviewed documents align with domain-based understanding:
- MASTER_DIRECTIVE.md — Consistent (13 core entities map to six domains)
- ROADMAP.md — Consistent (MVP phases align to domain buildout)
- DECISION_LOG.md — Consistent (professional management decisions documented)
- Architecture Baseline — Consistent (entities organized by domain)
- ADRs 1-8 — Consistent (no conflicts with domain perspective)

✅ No documents describing Kurshshifte-Match as "primarily a matching platform"

✅ All references to "matching" contextualize it as one domain within six

---

## TIMELINE

- **Decision Date:** June 27, 2026
- **Documentation Updates:** Complete
- **Technical Specification Revision:** When Technical Specification is created, organize by domain
- **Workflow Development:** Upcoming WF-003 through WF-013 will reference domain architecture
- **Team Alignment:** Ongoing (as team grows)

---

## RELATED DECISIONS

- **ADR-006:** Human-in-the-Loop Matching — Remains valid; matching is domain within larger system
- **MASTER_DIRECTIVE.md:** 13 core entities — Remains valid; now explicitly organized into six domains
- **Architecture Baseline:** Entity relationships — Remains valid; domain perspective is organizational overlay

---

## OPEN QUESTIONS / FUTURE WORK

1. **Domain Boundaries** — Are the six domains correctly identified? Are any missing?
2. **Cross-Domain Workflows** — How do workflows that span multiple domains (e.g., case creation touches Professional, Municipality, Case, and Matching domains) coordinate?
3. **Domain Team Structure** — Should the development team be organized by domain? When?
4. **Domain APIs** — Should each domain have a clear API surface? How do domains communicate?
5. **Domain-Level Metrics** — Should each domain have its own success metrics distinct from overall platform metrics?

---

## DECISION MADE

**Approved:** The architectural shift from matching-focused to domain-integrated operations platform is approved and documented.

**Basis:** This change accurately reflects the approved MVP architecture in MASTER_DIRECTIVE.md and improves clarity and scalability of the system design.

---

**Approved by:** Hassan (Founder & Operator)  
**Documented by:** Claude (Architecture Documentation)  
**Date:** June 27, 2026  
**Status:** APPROVED FOR IMPLEMENTATION
