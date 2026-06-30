# ADR-010: Notification Architecture (Synchronous Side-Effect Pattern, Email-First MVP)

**Date:** June 29, 2026  
**Status:** APPROVED  
**Deciders:** Hassan (Founder & Operator)  
**Type:** Architectural Decision Record

---

## CONTEXT

Workflow state transitions (professional application received, case created, safeguarding flagged, hours submitted, document re-upload required, case closed) require that relevant parties be notified. The notification system must be:

1. **Reliable** — Notifications must not be lost if dispatch fails
2. **Auditable** — Every notification attempt must be recorded with outcome
3. **Simple for MVP** — Over-engineering a notification bus before volume exists wastes time
4. **Extensible** — Must not require architectural surgery to add channels (SMS, Slack, Teams) in Phase 2

**Options considered:**

| Option | Description | Trade-off |
|---|---|---|
| A. Fire-and-forget (no log) | Dispatch email inline; no persistence | Fast, zero reliability, unauditable |
| B. Async queue (e.g., BullMQ, Inngest) | Queue jobs; worker dispatches async | Reliable but adds infrastructure dependency for MVP |
| C. Synchronous side-effect + `notification_log` | Write to `notification_log` synchronously with state transition; dispatch inline; log outcome | Reliable enough for MVP volume; auditable; zero additional infrastructure |

---

## DECISION

**Use Option C: Synchronous side-effect dispatch with `notification_log` persistence.**

Every workflow state transition that triggers a notification MUST:

1. Write a row to `notification_log` with `status = 'PENDING'` as part of the same database transaction as the triggering state change.
2. Attempt email dispatch immediately after the transaction commits.
3. Update `notification_log.status` to `'SENT'` (with `sent_at = NOW()`) on success, or `'FAILED'` (with `failed_at = NOW()`, `failure_reason`, `attempt_count += 1`) on failure.
4. Surface FAILED notifications to admins via `GET /api/notification-log?status=FAILED`.
5. Allow admin-triggered retry via `POST /api/notification-log/:id/retry` (max 3 attempts total).

---

## RATIONALE

### Why not async queue (Option B) for MVP?

- Adds infrastructure: queue server (Redis/Postgres), worker process, dead-letter queue, monitoring
- Complexity exceeds MVP volume (< 100 notifications/day at launch)
- Synchronous dispatch with `notification_log` provides adequate reliability: if dispatch fails, admin can retry manually
- Async queue can be adopted in Phase 2 when volume and reliability requirements change

### Why not fire-and-forget (Option A)?

- No audit trail → GDPR compliance gap (cannot prove notifications were sent)
- Admin cannot investigate or retry failed notifications
- Rejected immediately: reliability and auditability are non-negotiable

### Why `notification_log` in the same transaction?

- If the state transition commits but the `notification_log` INSERT fails (or vice versa), notifications would be silently lost or duplicated
- Writing both in the same transaction ensures atomic consistency: a committed state transition always has a corresponding notification record
- If email dispatch fails after the transaction, the PENDING record persists and can be retried

---

## IMPLEMENTATION

### Table: `notification_log`

Full schema defined in TS-001 §1.3 (Governance Domain). Key fields:

| Field | Type | Notes |
|---|---|---|
| `notification_type` | TEXT | See MVP types below |
| `related_entity_type` | TEXT | Table name of triggering entity (e.g., 'cases') |
| `related_entity_id` | UUID | Row ID of triggering entity |
| `recipient_profile_id` | UUID \| NULL | Set for in-system recipients |
| `recipient_email` | TEXT \| NULL | Set for system admin or external email recipients |
| `delivery_channel` | TEXT | `EMAIL` for MVP; `IN_APP`, `SMS`, `SLACK`, `TEAMS`, `PUSH` reserved |
| `status` | TEXT | `PENDING` → `SENT` or `FAILED` |
| `attempt_count` | INTEGER | Max 3; CHECK constraint enforced |
| `failure_reason` | TEXT | Last error message on failure |

**CHECK constraint:** `recipient_profile_id IS NOT NULL OR recipient_email IS NOT NULL` — at least one recipient is always required.

### MVP Notification Types

| `notification_type` | Triggering workflow | `related_entity_type` | Recipient |
|---|---|---|---|
| `INQUIRY_RECEIVED` | WF-002: inquiry submitted | `inbound_inquiries` | `SYSTEM_ADMIN_EMAIL` env var |
| `PROFESSIONAL_APPLICATION_RECEIVED` | WF-001: application submitted | `inbound_inquiries` | `SYSTEM_ADMIN_EMAIL` env var |
| `CASE_CREATED` | WF-002: case created from inquiry | `cases` | `SYSTEM_ADMIN_EMAIL` env var |
| `SAFEGUARDING_FLAGGED` | WF-005: session log flagged | `session_logs` | `SYSTEM_ADMIN_EMAIL` env var |
| `HOURS_SUBMITTED` | WF-006: hours submitted by professional | `registered_hours` | `SYSTEM_ADMIN_EMAIL` env var |
| `DOCUMENT_ACTION_REQUIRED` | WF-011: admin sets re_upload_required | `professional_documents` | professional (`recipient_profile_id`) |
| `CASE_CLOSED` | WF-012: case status → COMPLETED | `cases` | professional (`recipient_profile_id`) |

### Delivery Channel

**MVP:** EMAIL only, via `RESEND_API_KEY` (or equivalent transactional email provider configured in environment).

**Phase 2:** Additional channels (Slack, Teams, SMS, push) can be added by:
1. Adding rows to `notification_log` with the appropriate `delivery_channel` value
2. Adding a dispatcher for that channel in the application layer
3. No schema changes required (CHECK constraint already includes all Phase 2 channels)

### Retry Policy

| Attempt | When |
|---|---|
| 1 | Synchronous, immediately after state transition |
| 2 | Admin-triggered via `POST /api/notification-log/:id/retry` |
| 3 | Admin-triggered (final attempt) |
| > 3 | Blocked — `attempt_count >= 3` returns 422 |

After 3 failures, admin must investigate the root cause (invalid email address, email provider outage, misconfigured `SYSTEM_ADMIN_EMAIL`) before any further action.

### Application Code Pattern

```typescript
// Within a workflow state transition handler:
await db.transaction(async (tx) => {
  // 1. Apply state transition
  await tx.cases.update(caseId, { status: 'ACTIVE' });

  // 2. Write notification record (PENDING) atomically
  const notificationId = await tx.notificationLog.insert({
    notification_type: 'CASE_CREATED',
    related_entity_type: 'cases',
    related_entity_id: caseId,
    recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
    delivery_channel: 'EMAIL',
    status: 'PENDING',
    attempt_count: 0,
  });

  return notificationId;
});

// 3. Dispatch after transaction commits (failure does not roll back state change)
try {
  await emailService.send({ to: process.env.SYSTEM_ADMIN_EMAIL, ... });
  await db.notificationLog.update(notificationId, {
    status: 'SENT',
    sent_at: new Date(),
    attempt_count: 1,
  });
} catch (err) {
  await db.notificationLog.update(notificationId, {
    status: 'FAILED',
    failed_at: new Date(),
    failure_reason: err.message,
    attempt_count: 1,
  });
}
```

### Environment Variables Required

```
SYSTEM_ADMIN_EMAIL=<admin email for system notifications>
RESEND_API_KEY=<transactional email provider key>
```

---

## CONSEQUENCES

### What This Enables

- Full auditability of notification delivery (who was notified, when, and whether it succeeded)
- Admin visibility into notification failures via `GET /api/notification-log?status=FAILED`
- Manual retry for transient failures (network, provider outage)
- Zero additional infrastructure for MVP (no queue server, no worker process)
- Clean path to async queue in Phase 2 (replace inline dispatch with queue enqueue; keep `notification_log` as-is)

### What This Does Not Provide

- **Guaranteed delivery:** If the email provider is down and all 3 retries fail, the notification is lost. Acceptable for MVP; requires async queue for SLA-bound delivery.
- **Real-time notifications:** No in-app push notifications in MVP. `IN_APP` channel reserved for Phase 2.
- **Notification preferences:** All notifications use system defaults. Per-user preferences (opt-out, channel) are a Phase 2 feature.
- **Template management:** Email templates are hardcoded in the application for MVP. A template management system (e.g., CMS-backed) is a Phase 2 concern.

---

## RELATED DECISIONS

- **ADR-004 (Privacy-Safe Audit Events):** `notification_log` is separate from `audit_events`. `audit_events` records what happened in the system. `notification_log` records what communications were sent. They share the same "no sensitive data" principle: `notification_log.related_entity_id` is a UUID reference; no personal data in the log itself.
- **ADR-007 (No Hard Deletes):** `notification_log` rows are never hard-deleted during the retention period. Rows for expired cases/professionals follow the parent entity's retention cycle via `deletion_schedules`.
- **ADR-009 (Domain-Integrated Operations):** Notifications are a cross-domain concern dispatched by the Governance domain. All six business domains write to `notification_log` as a side effect of state transitions.

---

**Approved by:** Hassan (Founder & Operator)  
**Documented by:** Claude (Architecture Documentation)  
**Date:** June 29, 2026  
**Version:** 1.0
