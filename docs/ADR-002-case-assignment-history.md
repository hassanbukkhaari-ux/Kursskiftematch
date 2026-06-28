# ADR-004: Privacy-Safe Audit Events (No Sensitive Data in Logs)

**Date:** June 2026 (V3 Correction)  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

Audit events must log all changes for compliance. But audit logs can be breached.

**Problem:** How to log what changed without exposing sensitive data?

---

## DECISION

**Audit metadata contains only what changed (event type, IDs, reason), never the sensitive content.**

```
❌ DON'T:
{
  event_type: "SESSION_LOG_CREATED",
  old_values: { observations: "Child disclosed abuse in family" },
  new_values: { observations: "Child disclosed abuse" }
}

✅ DO:
{
  event_type: "SESSION_LOG_CREATED",
  metadata: {
    session_log_id: "...",
    safeguarding_flagged: true,
    follow_up_required: true
  }
}
```

---

## RATIONALE

### Breach Impact Reduction

If audit table is breached, attacker sees event log, not sensitive content.

### Privacy by Design

Audit system doesn't store the secrets it's trying to audit.

### Compliance

GDPR requires audit trails but doesn't require storing PII in logs.

---

## CONSEQUENCES

### Positive Consequences

✅ **No sensitive data in audit table**  
✅ **Reduced breach impact**  
✅ **Easier to share audit logs** (no PII to redact)  
✅ **Cleaner architecture** (audit = behavior, not content)

### Negative Consequences

❌ **Cannot reconstruct exact old values from audit**  
❌ **Must rely on SessionLogCorrection table** (if need history of changes)  
❌ **Metadata contracts require more design** (what to include?)

---

## IMPLEMENTATION

**Metadata contracts per event type:**
- CASE_CREATED: {case_id, complexity_level, weekly_hours}
- SESSION_LOG_CREATED: {session_log_id, safeguarding_flagged}
- DOCUMENT_VERIFIED: {document_id, document_type, expiry_set}

---

## REFERENCES

- ARCHITECTURE_PRINCIPLES.md (Privacy by Design, Auditability by Default)
- ARCHITECTURE_ACCEPTANCE_CRITERIA.md (Criterion 3: No PII in Audit Metadata)
- DECISION_LOG.md (Decision #7)

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
