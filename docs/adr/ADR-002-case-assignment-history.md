# ADR-002: CaseAssignment Entity for Temporal Professional Assignment Tracking

**Date:** June 2026 (V4 Architectural Improvement)  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

Cases must be assigned to professionals. Over time, assignments change (professional unavailable, better fit found, etc.).

**Problem:** How to track current assignment AND historical assignments without data inconsistency?

**Options Considered:**

1. **cases.professional_id + case_handovers (V3 approach)**
   - Store current professional as FK in cases table
   - Store history in separate case_handovers table
   - Problem: Two sources of truth (cases.professional_id + handovers)
   - Risk: Can become inconsistent (professional_id null/stale while handover history exists)

2. **CaseAssignment entity (Selected)**
   - Dedicated table tracking all assignments
   - Current professional derived from active assignment
   - Single source of truth
   - Temporal tracking (when each assignment started/ended)

3. **Event Sourcing**
   - Store only "assignment events" (ASSIGNED, HANDOVERED, TERMINATED)
   - Reconstruct current state from events
   - Overkill for MVP
   - Adds complexity

---

## DECISION

**Create CaseAssignment entity (V4 Improvement).**

Remove cases.professional_id FK. All assignment state managed via CaseAssignment table.

```
CaseAssignment:
├─ id: UUID (Primary Key)
├─ case_id: UUID (FK)
├─ professional_id: UUID (FK to professionals, nullable until assigned)
├─ assignment_status: ACTIVE | TRANSITIONED | TERMINATED | ARCHIVED
├─ started_at: Timestamp (when this assignment began)
├─ ended_at: Timestamp | NULL (when assignment ended)
├─ assigned_by: UUID (FK to profiles, admin who made assignment)
├─ assignment_reason: String (why assigned)
└─ created_at: Timestamp (immutable)

Current professional derived as:
  SELECT professional_id FROM case_assignments
  WHERE case_id = ? AND ended_at IS NULL
  LIMIT 1
```

---

## RATIONALE

### Single Source of Truth

**Before (V3 - Inconsistent):**
```
cases.professional_id = prof-123  (mutable, current state)
case_handovers:                    (immutable history)
  {outgoing: prof-123, incoming: prof-456, created: yesterday}

Problem: If cases.professional_id is NULL but handover says prof-456 active,
which is the truth?
```

**After (V4 - Consistent):**
```
case_assignments:
  {case_id, professional_id: prof-123, assignment_status: ACTIVE, ended_at: NULL}
  {case_id, professional_id: prof-456, assignment_status: TRANSITIONED, ended_at: yesterday}

Single source: Active assignment is the one with ended_at IS NULL.
History is immutable audit trail.
```

### Temporal Tracking

**Enables queries like:**
- "When was professional X assigned to case Y?"
- "How long was professional X on this case?"
- "What was the assignment history for case Y?"
- "Who assigned this professional?" (audit trail)

### Audit Trail

**Each assignment transition creates new CaseAssignment record:**
```
1. CREATE CaseAssignment(prof-123, ACTIVE, started_at=now)
   ↓ (professional unavailable)
2. UPDATE CaseAssignment(prof-123, TRANSITIONED, ended_at=now)
3. CREATE CaseAssignment(prof-456, ACTIVE, started_at=now)

Immutable record: Can answer "who was assigned when and why"
```

---

## CONSEQUENCES

### Positive Consequences

✅ **No data inconsistency** (single source of truth)  
✅ **Rich history** (can answer temporal questions)  
✅ **Audit trail** (who made assignment, when, why)  
✅ **Supports complex workflows** (transitions, terminations, archives)  
✅ **Immutable history** (assignment changes never overwritten)

### Negative Consequences

❌ **One more join to get current professional**
```
SELECT c.*, ca.professional_id
FROM cases c
JOIN case_assignments ca ON ca.case_id = c.id AND ca.ended_at IS NULL
```

❌ **Slightly more complex queries** (need to think about active assignment)

### Mitigation

**Join is simple and fast** (if indexed):
```sql
CREATE INDEX idx_case_assignments_case_ended_at 
  ON case_assignments(case_id, ended_at);
```

---

## IMPACT ON OTHER ENTITIES

**CaseHandover changes:**
- No longer stores incoming/outgoing as separate fields
- Now references CaseAssignment directly in consequences
- Simpler: "CaseHandover initiated, CaseAssignment status changed"

**Queries change:**
- `cases.professional_id` → `current CaseAssignment for case`
- But this is transparent to application (can be a view)

---

## IMPLEMENTATION

**Migration from V3 to V4:**
1. Create CaseAssignment table
2. Migrate existing cases.professional_id to CaseAssignment(ACTIVE)
3. Drop cases.professional_id FK
4. Update all queries

---

## RELATED DECISIONS

- **Handover Workflow:** CaseHandover transitions CaseAssignments
- **RLS:** CaseAssignment RLS determines if professional can access case
- **Audit:** CaseAssignment creation/transition logged

---

## REFERENCES

- ARCHITECTURE_PRINCIPLES.md (Single Source of Truth)
- DOMAIN_MODEL_DATABASE_SPEC.md (CaseAssignment entity)
- DECISION_LOG.md (Decision #5: CaseAssignment Entity)

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
