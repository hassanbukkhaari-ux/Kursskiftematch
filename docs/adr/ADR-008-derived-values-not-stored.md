# ADR-008: Derived Values Are Never Persisted

**Date:** June 2026 (V4 Architectural Improvement)  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

System needs to calculate values like "remaining hours", "workload status", "is document expired".

**Problem:** Store these as columns or calculate at query time?

---

## DECISION

**Never store derived values. Calculate at query time.**

```
remaining_hours = granted_hours - SUM(approved_hours)  → Calculated
workload_status = Green/Amber/Red                      → Calculated
is_expired = expiry_date < TODAY                       → Calculated
used_hours = SUM(approved_hours)                       → Calculated
```

---

## RATIONALE

### Single Source of Truth

Calculating from base data ensures consistency. No stale derived columns.

### Automatic Updates

When base data changes, derived values automatically correct.

### Easy Business Rule Changes

Want to change workload threshold from 75% to 80%? Update query, not migration.

### Storage Efficiency

No redundant data storage.

---

## PERFORMANCE

**Concern:** Calculating at query time is slower.

**Mitigation:**
- Database indexes on base columns
- Views for commonly calculated values (read-only, clearly marked)
- Caching in application layer with TTL if needed
- Phase 2: Evaluate if performance becomes issue

---

## EXAMPLES

❌ DON'T:
```sql
CREATE TABLE case_grants (
  granted_hours DECIMAL,
  remaining_hours DECIMAL,  -- Derived, gets stale!
  used_hours DECIMAL        -- Derived, gets stale!
);
```

✅ DO:
```sql
SELECT
  cg.granted_hours,
  (SELECT SUM(hours) FROM registered_hours WHERE grant_id = cg.id) as used_hours,
  cg.granted_hours - COALESCE(SUM(rh.hours), 0) as remaining_hours
FROM case_grants cg
LEFT JOIN registered_hours rh ON rh.grant_id = cg.id
GROUP BY cg.id;
```

---

## REFERENCES

- ARCHITECTURE_PRINCIPLES.md (Derived Values Are Never Persisted)
- ARCHITECTURE_ACCEPTANCE_CRITERIA.md (Criterion 7)
- DECISION_LOG.md (Decision #9)

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
