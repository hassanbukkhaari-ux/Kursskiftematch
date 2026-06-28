# ADR-007: No Hard Deletes in MVP

**Date:** June 2026 (V3 Correction)  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

Data must be managed over its lifetime. When should records be deleted?

**Options:**
1. Hard delete (DELETE FROM) immediately
2. Soft delete (status='ARCHIVED') with scheduled hard delete later

---

## DECISION

**Soft delete only in MVP. No hard DELETE in RLS policies.**

Use `status` + `archived_at` for lifecycle. Hard delete only after retention period (7 years).

---

## RATIONALE

### Audit Trail Completeness

Soft delete preserves audit history. Can show "what was deleted and when".

### Data Recovery

Can restore data if deleted accidentally.

### Compliance

GDPR requires being able to show what data was handled.

### Operational Safety

Prevents accidental data loss from typos/bugs.

---

## IMPLEMENTATION

```
UPDATE cases SET status='ARCHIVED', archived_at=NOW()
WHERE id = ?;

-- Later (after retention period):
DELETE FROM cases WHERE archived_at < NOW() - INTERVAL '7 years';
```

---

## PHASE 2+

If storage becomes issue, implement cold storage for archived data.

---

## REFERENCES

- ARCHITECTURE_PRINCIPLES.md (No Hard Deletes in MVP)
- ARCHITECTURE_ACCEPTANCE_CRITERIA.md (Criterion 8)
- DOMAIN_MODEL_DATABASE_SPEC.md (Soft Delete Strategy)

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
