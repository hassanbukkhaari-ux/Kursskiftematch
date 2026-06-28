# ADR-006: Human-in-the-Loop Matching (No Automatic Assignment)

**Date:** June 2026 (V4 Architectural Improvement)  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

Cases must be assigned to professionals. Matching algorithm can score candidates.

**Problem:** Should system automatically assign if score is high, or always require admin decision?

---

## DECISION

**Always require human (admin) decision. No automatic assignment.**

MatchRun generates scored candidates → Admin reviews → Admin selects → Assignment audited.

---

## RATIONALE

### High Stakes

Professional assignment affects citizen safety, support quality, professional fit.

### Algorithm Limitations

Scoring can miss important factors (personal compatibility, gut feeling, safeguarding concerns).

### Accountability

Admin must own the decision and document reasoning.

### Legal

Social services require human judgment in placement decisions.

---

## IMPLEMENTATION

```
1. MatchRun triggered by admin
   ↓
2. System scores candidates (MatchCandidate records)
   ↓
3. Admin reviews candidates with scores + explanation
   ↓
4. Admin selects preferred candidate
   ↓
5. CaseAssignment created (selected_by, selected_reason logged)
   ↓
6. Professional notified
```

---

## PHASE 2+

Only reconsider if matching becomes so accurate that automatic assignment merits discussion.

---

## REFERENCES

- ARCHITECTURE_PRINCIPLES.md (Human-in-the-Loop Matching, Explicit Over Implicit)
- DO_NOT_BUILD.md (No Automatic Assignment)
- DOMAIN_MODEL_DATABASE_SPEC.md (MatchRun, MatchCandidate entities)

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
