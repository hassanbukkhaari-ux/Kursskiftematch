# ADR-003: Separate SessionLog from RegisteredHours

**Date:** June 2026 (V2 Foundation)  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

Professionals do work with citizens. Work includes:
- Documentation (what happened, observations, follow-ups)
- Time tracking (how many hours, what type of work)

**Problem:** Should these be one table or two?

---

## DECISION

**Two separate tables: SessionLog (documentation) and RegisteredHours (time tracking).**

**SessionLog (Work Documentation):**
- What happened during session
- Professional observations
- Follow-up needs
- Safeguarding concerns
- Write-once design
- Immutable

**RegisteredHours (Administrative Time Tracking):**
- Hours worked (0.25 to 8.0)
- Work type (DIRECT_SESSION, TRANSPORT, DOCUMENTATION, COORDINATION, etc.)
- Date worked
- Status (PENDING, APPROVED, REJECTED, OUTSIDE_GRANT)
- Used for payroll QA and grant control
- Mutable (admin can approve/reject)

---

## RATIONALE

### Different Workflows

**SessionLog:**
- Professional writes after session
- Cannot edit (corrections via separate table)
- For compliance/clinical documentation
- Permanent record

**RegisteredHours:**
- Professional submits/admin reviews
- Can be rejected (doesn't count toward grant)
- For financial/administrative purposes
- Changeable (admin approves/rejects)

### Different Retention

**SessionLog:** 7 years (statutory requirement for social services)  
**RegisteredHours:** May be shorter (depends on payroll/tax requirements)

### Different Semantics

**SessionLog:** Clinical documentation (what happened)  
**RegisteredHours:** Administrative tracking (how much time)

Hours can exist without session (transport, documentation, coordination).  
Session can exist without hours (pro-bono work, volunteer).

---

## CONSEQUENCES

### Positive Consequences

✅ **Clear separation of concerns**  
✅ **Different workflows** (documentation vs. approval)  
✅ **Different retention policies**  
✅ **Professional accountability** (documented work)  
✅ **Payroll clarity** (hours tracked separately)  
✅ **Hours rejection doesn't affect documentation** (session still exists)

### Negative Consequences

❌ **Two tables instead of one** (slightly more code)  
❌ **Link between them is implicit** (session_log_id FK in RegisteredHours)  
❌ **Requires application logic** (to correlate them)

---

## LINKING

**Optional FK in RegisteredHours:**
```
registered_hours.session_log_id: UUID | NULL

DIRECT_SESSION → should reference session_log
DOCUMENTATION → can reference the session it documents
TRANSPORT → NULL (unrelated to specific session)
COORDINATION → NULL (meeting, not case session)
```

---

## RELATED DECISIONS

- **SessionLogCorrection:** How to update documentation
- **Audit Events:** Both tables audited separately
- **RLS:** Both tables protected by RLS

---

## REFERENCES

- ARCHITECTURE_PRINCIPLES.md (Single Source of Truth, Domain-First Design)
- DOMAIN_MODEL_DATABASE_SPEC.md (SessionLog and RegisteredHours entities)
- DECISION_LOG.md (Decision #4)

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
