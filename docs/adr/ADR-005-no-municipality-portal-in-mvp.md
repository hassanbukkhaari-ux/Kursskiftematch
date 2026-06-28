# ADR-005: No Municipality Portal in MVP

**Date:** June 2026 (Master Directive)  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

Municipalities fund cases. Should they have platform access to view/manage their cases?

**Options:**
1. Municipality portal (Phase 2, deferred)
2. No portal, Kursskifte admin manages on behalf of kommune

---

## DECISION

**No municipality portal in MVP. Sagsbehandler has no login or platform access.**

Municipality contact info stored and admin-managed only.

---

## RATIONALE

### Reduces Scope

No user management, no SSO, no municipality-specific RLS policies.

### Reduces Risk

Less data exposed to external parties.

### Simplifies Operations

Kursskifte admin controls all case creation/updates.

### Clarifies Ownership

Kursskifte is responsible for data accuracy.

---

## HOW MUNICIPALITIES GET UPDATES

- Kursskifte admin prepares reports/exports
- Shared with sagsbehandler via email
- Professional delivers updates in person/by phone

---

## PHASE 2

Read-only municipality portal (optional, depends on adoption demand).

---

## REFERENCES

- MASTER_DIRECTIVE.md (What We Are Not Building)
- DO_NOT_BUILD.md (Forbidden Features)
- ROADMAP.md (Phase 2 features)

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
