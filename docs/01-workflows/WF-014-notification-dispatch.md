# WF-014: Notification Dispatch

**Workflow ID:** WF-014  
**Title:** Notification Dispatch — Delivery Lifecycle for Outbound Notifications  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Governance Domain

---

## PURPOSE

Own the delivery of all outbound notifications emitted by business workflows. WF-014 is the single point where notification type, recipient, and delivery channel are resolved and executed. No other workflow may reference delivery channels, provider credentials, or recipient email addresses.

---

## ACTORS

- **Notification Service (WF-014 Edge Function)** — Dispatches pending notification records, updates delivery status
- **Governance Domain** — Owns `notification_log` table and delivery audit trail
- **Source Workflows (WF-001, WF-002, WF-005, WF-006, WF-011)** — Emit notification events by creating `notification_log` records with status=PENDING

---

## DESIGN PRINCIPLE

WF-014 is channel-agnostic by design. Source workflows emit a `notification_type` with a `related_entity_id`. WF-014 owns all knowledge of:
- Which channel to use per notification type
- Which recipient address to resolve
- How to format the message
- Whether and how to retry on failure

No workflow before WF-014 may reference a delivery channel, provider, or email address.

---

## TRIGGER

A record is inserted into `notification_log` with `status = 'PENDING'`. This triggers the WF-014 Edge Function via one of:
- Postgres trigger on `notification_log` INSERT (preferred)
- Direct Edge Function call from the API route after the workflow transaction commits

---

## PRECONDITIONS

- `notification_log` record exists with `status = 'PENDING'`
- At least one of `recipient_profile_id` or `recipient_email` is set
- `SYSTEM_FROM_EMAIL` and `SYSTEM_ADMIN_EMAIL` environment variables are configured
- Resend API key is available in Edge Function environment

---

## MAIN FLOW

1. **WF-014 Edge Function receives trigger**
   - Input: `notification_log.id`
   - Reads the full record from `notification_log`

2. **Resolve recipient address**
   - If `recipient_profile_id` IS NOT NULL: query `profiles.email` to get delivery address
   - If `recipient_email` IS NOT NULL: use that address directly (system inbox recipient)

3. **Resolve delivery channel**
   - MVP: All notifications use `delivery_channel = 'EMAIL'`
   - Phase 2: Channel selection logic added here based on notification_type and recipient preferences

4. **Format message**
   - Notification type determines email subject and body template
   - Message body references the `related_entity_type` and `related_entity_id` to produce actionable content
   - No sensitive data is fetched into the notification body — body contains IDs and action URLs only

5. **Dispatch via Resend**
   - From: `SYSTEM_FROM_EMAIL`
   - To: resolved recipient address
   - Subject and body: per notification type template

6. **Update `notification_log` record**
   - On success: `status = 'SENT'`, `sent_at = NOW()`, `attempt_count = attempt_count + 1`
   - On failure: `status = 'FAILED'`, `failed_at = NOW()`, `attempt_count = attempt_count + 1`, `failure_reason = provider error message (no PII)`

7. **Workflow complete**

---

## RETRY FLOW

On each Edge Function invocation where delivery fails:
- `attempt_count` incremented
- `status` set to `FAILED`
- `failure_reason` records provider error code

Retry eligibility query:
```sql
SELECT * FROM notification_log
WHERE status = 'FAILED'
  AND attempt_count < 3
ORDER BY created_at ASC;
```

Maximum 3 attempts in MVP. After 3 failures, the record remains `status = 'FAILED'` and is not retried automatically. Manual re-queue or admin intervention required.

Retry scheduling (exponential backoff, automated queue) is Phase 2.

---

## MVP NOTIFICATION TYPE REGISTRY

| Notification Type | Source Workflow | Recipient | Channel | Subject Template |
|---|---|---|---|---|
| `PROFESSIONAL_APPLICATION_RECEIVED` | WF-001 | System admin email | EMAIL | New professional application received |
| `CASE_CREATED` | WF-002 | System admin email | EMAIL | New municipality case submitted |
| `SAFEGUARDING_FLAGGED` | WF-005 | System admin email | EMAIL | Safeguarding concern flagged — immediate action required |
| `HOURS_SUBMITTED` | WF-006 | System admin email | EMAIL | Hours submitted for approval |
| `DOCUMENT_ACTION_REQUIRED` | WF-011 | See recipient rules below | EMAIL | Document action required |

**`DOCUMENT_ACTION_REQUIRED` recipient rules:**
- Upload pending verification (trigger: DOCUMENT_UPLOADED): Admin system email
- Approaching expiry (trigger: DOCUMENT_EXPIRING): Admin system email
- Re-upload required (trigger: DOCUMENT_RE_UPLOAD_REQUIRED): Professional (`recipient_profile_id`)

All notification types not listed above are deferred to Phase 2 and do not produce `notification_log` records in MVP.

---

## BUSINESS RULES

1. **WF-014 owns all delivery knowledge** — Source workflows create `notification_log` records only; they do not reference channels, providers, or addresses
2. **Recipient email is never stored for user-targeted notifications** — Resolved at dispatch time from `profiles.email`
3. **System recipients use `recipient_email`** — Set to the value of `SYSTEM_ADMIN_EMAIL` at record creation time; not re-derived at dispatch
4. **No sensitive data in notification body** — Email bodies reference IDs and action URLs; no citizen data, session content, or professional PII included
5. **Maximum 3 retry attempts** — Records with `attempt_count >= 3` and `status = 'FAILED'` require manual intervention
6. **Failure reason must not contain PII** — Provider error codes and technical identifiers only (ADR-004)
7. **`notification_log` records are permanent** — No hard deletes (ADR-007); records persist for operational audit trail
8. **MVP channel is EMAIL only** — `delivery_channel = 'EMAIL'` for all MVP notifications; `valid_channel` constraint supports Phase 2 channels without migration

---

## NOTIFICATION EVENTS

WF-014 does not emit further notification events. It updates `notification_log.status` as its output. The `notification_log` table itself is the authoritative delivery audit trail for the Notification Service.

---

## AUDIT EVENTS

WF-014 does not write to `audit_events`. The `notification_log` table serves as the delivery audit trail. `audit_events` records the business event that triggered the notification (written by the source workflow, not by WF-014).

**Separation:**
- `audit_events`: business events (what happened in the domain) — written by source workflow
- `notification_log`: delivery events (what was dispatched and whether it arrived) — written by WF-014

---

## DATA STRUCTURES

**notification_log (full schema in TS-001):**
- `id` UUID
- `notification_type` TEXT — from the registry above
- `related_entity_type` TEXT — e.g., 'professional', 'case', 'session_log', 'registered_hours', 'professional_document'
- `related_entity_id` UUID — the primary key of the related entity
- `recipient_profile_id` UUID REFERENCES profiles(id) — for user-targeted notifications
- `recipient_email` TEXT — for system recipients only
- `delivery_channel` TEXT DEFAULT 'EMAIL'
- `status` TEXT DEFAULT 'PENDING' — transitions to SENT or FAILED
- `attempt_count` INTEGER DEFAULT 0 — incremented on each dispatch attempt
- `failure_reason` TEXT — provider error, no PII
- `created_at` TIMESTAMPTZ
- `sent_at` TIMESTAMPTZ — set on SENT
- `failed_at` TIMESTAMPTZ — set on FAILED

---

## ENVIRONMENT VARIABLES

| Variable | Purpose |
|---|---|
| `SYSTEM_FROM_EMAIL` | Sender address for all outbound emails (e.g., noreply@kursskifte.dk) |
| `SYSTEM_ADMIN_EMAIL` | System recipient for admin-targeted notifications (e.g., admin@kursskifte.dk) |
| `RESEND_API_KEY` | Resend API key (Edge Function only, never exposed to client) |

---

## GDPR NOTES

- `notification_log` records are subject to GDPR retention policy (WF-013)
- Records are retained as operational audit evidence — they are not personal data records themselves
- `recipient_profile_id` is set to NULL (ON DELETE SET NULL) if the referenced profile is deleted — the notification record is preserved for audit, but the personal link is severed
- Personal email addresses are never stored in `notification_log` — no personal data is duplicated into this table beyond the minimum (profile ID reference)
- `failure_reason` must not contain PII per ADR-004

---

## TS-001 AMENDMENTS REQUIRED

All fields required by this workflow are defined in TS-001 (notification_log schema added in the Notification Service amendment, June 2026). No further schema amendments are required.

---

## WORKFLOW CONNECTIONS

| Reference | Direction | Description |
|-----------|-----------|-------------|
| WF-001 | Upstream | Emits `PROFESSIONAL_APPLICATION_RECEIVED` notification |
| WF-002 | Upstream | Emits `CASE_CREATED` notification |
| WF-005 | Upstream | Emits `SAFEGUARDING_FLAGGED` notification |
| WF-006 | Upstream | Emits `HOURS_SUBMITTED` notification |
| WF-011 | Upstream | Emits `DOCUMENT_ACTION_REQUIRED` notification (three triggers) |
| WF-013 | Downstream | GDPR retention applies to notification_log records |

---

## OPEN QUESTIONS

1. Should the Edge Function be invoked via Postgres trigger (real-time) or via a cron-based queue polling `notification_log WHERE status = 'PENDING'`? (Postgres trigger preferred for MVP; cron polling is Phase 2 fallback)
2. Should admins be able to manually re-trigger a failed notification from the admin portal?
3. Should `notification_log` be visible in the admin portal for operational monitoring?
4. Should email templates be stored in the codebase or in Resend's template system?
5. Should undeliverable emails (bounces) update `notification_log.status` to FAILED retroactively?

---

**This workflow is implementation-ready. Owned by Governance Domain. Depends on WF-001, WF-002, WF-005, WF-006, and WF-011 as upstream notification sources. Delivery provider: Resend. Architecture defined in ADR-010.**
