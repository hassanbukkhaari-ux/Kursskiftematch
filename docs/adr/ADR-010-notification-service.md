# ADR-010: Notification Service

**Date:** June 2026  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

Workflows WF-001 through WF-013 define business events. Several of those events require outbound communication — notifying admins of new applications, flagging safeguarding concerns, alerting professionals that a document re-upload is needed.

**Problem:** How should notifications be architected without coupling workflows to delivery channels, without creating PII exposure in operational logs, and without building an over-engineered system before MVP user volume is understood?

---

## DECISION

### 1. Naming

The component is the **Notification Service**. The delivery workflow is **WF-014 (Notification Dispatch)**. All internal documentation uses "Notification Service" exclusively.

### 2. Governing Principle: Event-Driven, Channel-Agnostic

Workflows emit business events only. A workflow that detects a safeguarding concern emits `SAFEGUARDING_FLAGGED` — it has no awareness of email, SMS, Teams, Slack, or any other channel. Channel selection, delivery execution, and status tracking are owned entirely by WF-014 (Notification Dispatch).

This boundary is permanent:
- No workflow after WF-014 may reference a delivery channel
- No workflow before WF-014 may reference a recipient email address or delivery mechanism
- Channel configuration lives in environment variables, not in workflow logic

### 3. Company Email as System Recipient

The company email is not a user account. It is a system recipient address configured through environment variables (`SYSTEM_ADMIN_EMAIL`). It represents an operational inbox monitored by admin staff — used for role-based notifications where the target is "any responsible admin" rather than a named individual.

All human users — admins and professionals — must always have their own individual login, profile, email address, permissions, and notification preferences. The company email is never assigned to a `profiles` record.

### 4. Recipient Model

`notification_log` uses two alternative recipient fields:

- **`recipient_profile_id`** — for notifications targeting a named user (professional receiving `DOCUMENT_ACTION_REQUIRED`). WF-014 resolves the delivery address from `profiles.email` at dispatch time. Personal email addresses are never stored in `notification_log`.
- **`recipient_email`** — for system recipients only (e.g., `SYSTEM_ADMIN_EMAIL`). Used when the notification targets a role inbox rather than a named profile.

At least one must be set (enforced by CHECK constraint). Exactly one is populated per record. User-targeted notifications use `recipient_profile_id`; system/company notifications use `recipient_email`.

This minimizes PII exposure in `notification_log`: personal email addresses are resolved at dispatch time, not stored at record creation.

### 5. Four-Step Notification Lifecycle

```
[Business Event Emitted by Workflow]
         ↓
[notification_log record created — status: PENDING]
         ↓
[WF-014 Edge Function invoked — dispatches to channel]
         ↓
[status updated: SENT or FAILED — attempt_count incremented]
```

Step 1 is synchronous with or immediately following the workflow transaction. Steps 2–4 are asynchronous. A workflow is complete once step 1 succeeds, regardless of delivery outcome.

### 6. MVP Event Set (5 Events Only)

The following 5 notification types are active in MVP. All others are deferred to Phase 2.

| Notification Type | Source Workflow | Recipient | Trigger |
|---|---|---|---|
| `PROFESSIONAL_APPLICATION_RECEIVED` | WF-001 | Admin (system email) | Professional profile created (status=REGISTERED) — requires review |
| `CASE_CREATED` | WF-002 | Admin (system email) | New municipality case created — requires assignment |
| `SAFEGUARDING_FLAGGED` | WF-005 | Admin (system email) | Session log finalized with safeguarding_concern_flag=TRUE |
| `HOURS_SUBMITTED` | WF-006 | Admin (system email) | Professional submits hours for approval |
| `DOCUMENT_ACTION_REQUIRED` | WF-011 | Admin (system email) or Professional | Document awaiting verification; expiring within 30 days; re-upload requested |

`DOCUMENT_ACTION_REQUIRED` is a single notification type covering three triggers. When the target is re-upload (admin requests professional action), `recipient_profile_id` is used. When the target is admin review (upload pending, expiry warning), `recipient_email = SYSTEM_ADMIN_EMAIL`.

All other events — `CASE_ASSIGNMENT_TERMINATED`, `HOURS_OUTSIDE_GRANT_FLAGGED`, `DATA_DELETION_SCHEDULED`, `CASE_ASSIGNED`, `HOURS_APPROVED`, `HOURS_REJECTED`, and the full list from MVP_DEFINITION.md Section 12 — are deferred to Phase 2.

### 7. `attempt_count` — Included in MVP

`attempt_count INTEGER NOT NULL DEFAULT 0` is included in the `notification_log` schema.

**Rationale:** Without `attempt_count`, the dispatch function has no durable record of how many delivery attempts have been made. The only available state would be `status` (PENDING/SENT/FAILED) and `failed_at`. Distinguishing "never attempted" from "failed three times" requires parsing timestamps or maintaining state outside the table — violating the single-source-of-truth principle.

With `attempt_count`, retry logic is a simple query:

```sql
WHERE status = 'FAILED' AND attempt_count < 3
```

The schema cost is one integer column with a default. The migration cost if deferred is adding a NOT NULL column with a default — low risk, but interrupts momentum when retry logic is first needed. The column belongs in MVP.

**MVP retry policy:** Maximum 3 attempts. No automated retry scheduling — manual re-queue by admin or system restart triggers retry. Exponential backoff scheduling is Phase 2.

### 8. MVP Delivery Mechanism

- **Provider:** Resend (recommended — best DX for Next.js/Vercel monolith, transactional email, EU-compliant)
- **Execution:** Supabase Edge Function, invoked on `notification_log` INSERT via Postgres trigger or direct call from API route after the workflow transaction commits
- **MVP channel:** EMAIL only
- **System sender address:** `SYSTEM_FROM_EMAIL` environment variable
- **Admin system recipient:** `SYSTEM_ADMIN_EMAIL` environment variable
- **Professional recipient:** `profiles.email` resolved at dispatch time from `recipient_profile_id`

### 9. `notification_log` Table

Owned by Governance Domain. Third table alongside `audit_events` and `deletion_schedules`.

```sql
CREATE TABLE notification_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type     TEXT NOT NULL,
  related_entity_type   TEXT NOT NULL,
  related_entity_id     UUID NOT NULL,
  recipient_profile_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email       TEXT,
    CONSTRAINT recipient_required CHECK (
      recipient_profile_id IS NOT NULL OR recipient_email IS NOT NULL
    ),
  delivery_channel      TEXT NOT NULL DEFAULT 'EMAIL',
    CONSTRAINT valid_channel CHECK (
      delivery_channel IN ('EMAIL', 'IN_APP', 'SMS', 'PUSH', 'TEAMS', 'SLACK')
    ),
  status                TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (
      status IN ('PENDING', 'SENT', 'FAILED')
    ),
  attempt_count         INTEGER NOT NULL DEFAULT 0,
  failure_reason        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at               TIMESTAMPTZ,
  failed_at             TIMESTAMPTZ
);
```

The table is append-one-insert-per-notification. WF-014 updates `status`, `sent_at`, `failed_at`, and `attempt_count` on the existing record — it does not insert new records per retry attempt.

### 10. Phase 2 Scope (Not MVP)

- SMS delivery
- In-app notifications
- Push notifications
- Slack or Teams integration
- Subscriber-level notification preferences
- Automated retry scheduling with exponential backoff
- `CASE_ASSIGNMENT_TERMINATED`, `HOURS_APPROVED`, `HOURS_REJECTED`, and all remaining notification types listed in MVP_DEFINITION.md Section 12

---

## RATIONALE

**Why event-driven:** Prevents notification delivery details from polluting business logic. Workflows remain clean and testable. Channel changes require only WF-014 changes, not workflow changes.

**Why company email via env var:** Avoids creating a system user account that would appear in profiles, audit logs, and RLS checks. A monitored inbox is operationally equivalent for MVP and introduces no identity management burden.

**Why 5 events only:** Notification noise trains users to ignore all notifications. Five high-value operational events create strong signal. Volume grows with user maturity, not with implementation enthusiasm.

**Why `attempt_count`:** Negligible schema cost; prevents a migration in the middle of delivery implementation. See decision text above.

**Why Resend:** First-class TypeScript SDK, transactional email focused, Vercel integration, EU data residency, better DX than SendGrid or Postmark for single-developer monolith.

---

## CONSEQUENCES

### Positive
- Workflows remain channel-agnostic — no coupling to delivery infrastructure
- Personal email addresses are not stored in `notification_log` (resolved at dispatch time)
- `attempt_count` enables reliable retry without external state
- `delivery_channel` constraint is future-proofed without needing a migration for Phase 2 channels
- MVP delivery is contained to a single Edge Function and one table

### Negative
- WF-014 is a new operational component that must be monitored and maintained
- Edge Function failure means notifications may not deliver (mitigated by retry logic)
- Resend dependency — provider lock-in at MVP tier

---

## REFERENCES

- ADR-004: Privacy-Safe Audit Events (no PII in metadata — `failure_reason` must not contain PII)
- ADR-007: No Hard Deletes (`notification_log` records are permanent)
- ADR-008: No Derived Values (`delivery_channel` and `status` are recorded state, not derived)
- WF-014: Notification Dispatch (delivery lifecycle)
- MVP_DEFINITION.md Section 12: Narrowed to 5 MVP notification events

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
