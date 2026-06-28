# WF-015: Public Intake Reception

**Workflow ID:** WF-015  
**Title:** Public Intake Reception — Website Form Submission to Staged Inbound Inquiry  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Governance Domain

---

## PURPOSE

Own the boundary between the public website (kursskifte.dk) and Kursskifte Match. Receive external form submissions, validate and stage them as `inbound_inquiries` records, notify admin, and make them available for admin review. WF-015 does not create canonical internal records. It creates only staged records for admin review.

---

## ACTORS

- **Public Submitter** — Municipality sagsbehandler, professional applicant, or partner submitting via kursskifte.dk form (no platform account, no login)
- **Kursskifte Match System** — Validates submission, creates staged record, triggers notification
- **Admin (Case Coordinator / Recruiter)** — Reviews staged record and converts it via WF-002 (municipality inquiry) or WF-001 (professional application)
- **WF-014 (Notification Dispatch)** — Delivers `INQUIRY_RECEIVED` notification to admin

---

## DESIGN PRINCIPLE

WF-015 is the single entry point for all external form submissions. No public form may write directly to `cases`, `professionals`, `municipalities`, `professional_documents`, or any other core operational table. All external data enters as a staged `inbound_inquiries` record and remains there until an authenticated admin converts it.

This is not a municipality portal. Public submitters have no platform account, no read access, and no ability to view, edit, or track their submission after it is sent. The submission is one-way and write-only.

---

## TRIGGER

A public submitter completes and submits a form on kursskifte.dk. Form types active in MVP:
- **Municipality inquiry form** — sagsbehandler submitting a citizen support request
- **Professional application form** — applicant submitting interest in becoming a fagperson

Partner/organization lead forms are deferred to Phase 2.

---

## PRECONDITIONS

- `POST /api/public/intake/inquiry` or `POST /api/public/intake/professional-application` receives a valid HTTP request
- CAPTCHA token is present in the request body
- Request origin is kursskifte.dk (CORS enforced)
- Rate limit has not been exceeded for the submitter's IP

---

## MAIN FLOW

1. **Public submitter completes form on kursskifte.dk**
   - Form fields collected: submitter_name, submitter_email, submitter_phone (optional), organization_name, message
   - Cloudflare Turnstile CAPTCHA widget embedded in form (no cookies, GDPR-safe)
   - Honeypot field included (hidden, not visible to human users)

2. **System receives submission at public API route**
   - Route: `POST /api/public/intake/inquiry` or `POST /api/public/intake/professional-application`
   - Route is unauthenticated — no JWT required
   - CORS policy: allows only `kursskifte.dk` origin

3. **System validates CAPTCHA**
   - Cloudflare Turnstile token validated server-side against Cloudflare API
   - If invalid: return 400, write nothing to database
   - If honeypot field is filled: silently accept (return 201) but set `status = 'SPAM'` and `captcha_verified = false`

4. **System validates request body**
   - Schema validation (zod or equivalent) enforced server-side
   - Required fields checked; invalid or missing fields return 400
   - Text length limits enforced (e.g., message max 2000 chars)
   - No file uploads accepted at this endpoint (text fields only in MVP)

5. **System checks rate limit**
   - Max 5 submissions per IP address per hour
   - Checked at API middleware layer before handler executes
   - If exceeded: return 429, write nothing to database
   - IP is hashed before any storage (raw IP never persisted)

6. **System creates `inbound_inquiries` record**
   - `submission_type` set per endpoint: `MUNICIPALITY_INQUIRY` or `PROFESSIONAL_APPLICATION`
   - `status = 'PENDING'`
   - `form_data` (JSONB) stores the complete validated payload (immutable after creation)
   - `captcha_verified = true`
   - `source_url` set to the referring kursskifte.dk page URL
   - `ip_hash` set to hashed submitter IP (for rate-limit audit; not for tracking)
   - `submitted_at = NOW()`

7. **System creates `notification_log` record**
   - `notification_type = 'INQUIRY_RECEIVED'`
   - `recipient_email = SYSTEM_ADMIN_EMAIL` (from environment variable)
   - `related_entity_type = 'inbound_inquiry'`
   - `related_entity_id = inbound_inquiries.id`
   - No PII in the notification — body contains submission ID and admin review URL only (ADR-004)

8. **WF-014 dispatches `INQUIRY_RECEIVED` notification**
   - Admin receives email: "New inquiry received — review in admin portal [link]"
   - WF-014 updates `notification_log.status` to SENT or FAILED per standard dispatch

9. **System returns 201 to submitter**
   - Response: `{ "id": "..." }` — submission ID only
   - No submission data is echoed back (minimize exposure)
   - Public submitter receives no further communication in MVP (no confirmation email)

10. **Workflow complete — record is PENDING, awaiting admin review**
    - Admin opens admin portal and sees the staged inquiry in the review queue
    - Admin converts, rejects, or marks as reviewed via admin UI
    - Conversion triggers WF-002 (municipality inquiry → case) or WF-001 (professional application → professional profile)

---

## ALTERNATIVE FLOWS

### A1: CAPTCHA Validation Fails
- System returns 400 — "Submission could not be verified"
- No record created in `inbound_inquiries`
- No notification emitted

### A2: Rate Limit Exceeded
- System returns 429 — "Too many submissions"
- No record created
- No notification emitted

### A3: Body Validation Fails
- System returns 400 with field-level errors
- No record created
- No notification emitted

### A4: Honeypot Field Filled (Bot Detected)
- System returns 201 (silent acceptance — do not signal to bots that they were detected)
- Record created with `status = 'SPAM'`, `captcha_verified = false`
- No notification emitted (admin not alerted for SPAM records)
- Admin can view SPAM records in the admin portal filter

### A5: Admin Rejects Submission
- Admin reviews staged record, determines it is invalid (wrong scope, duplicate, incomplete)
- Admin sets `status = 'REJECTED'`, records `rejection_reason`
- Event: `INQUIRY_REJECTED` logged
- Record retained per retention policy (see RETENTION section below)

### A6: Admin Converts Submission
- Admin reviews staged record and initiates conversion
- For `MUNICIPALITY_INQUIRY`: admin opens WF-002 with the staged data pre-filled
- For `PROFESSIONAL_APPLICATION`: admin opens WF-001 (recruiter creates professional profile from staged data)
- On conversion: `status = 'CONVERTED'`, `converted_to_type` and `converted_to_id` set
- Event: `INQUIRY_CONVERTED` logged
- The staged record is retained (immutable audit of where the case/professional originated)

---

## SECURITY CONTROLS

| Control | Implementation |
|---|---|
| **CAPTCHA** | Cloudflare Turnstile — server-side token validation; no cookies; GDPR-safe |
| **Honeypot** | Hidden form field; if filled, submission flagged SPAM silently |
| **Rate limiting** | Max 5 submissions per IP per hour at Next.js middleware |
| **Input validation** | zod schema validation server-side; reject on any invalid input |
| **CORS** | `Access-Control-Allow-Origin: https://kursskifte.dk` only |
| **No credentials in browser** | Supabase service_role key never exposed to client; all writes via server-side API route |
| **Text-only** | No file uploads at public intake endpoints; documents collected post-conversion via authenticated session |
| **IP hashing** | Submitter IP hashed (SHA-256 + salt) before storage; raw IP never persisted |
| **No response echo** | API returns only submission ID; submitted content is not echoed back |
| **Admin-only read** | `inbound_inquiries` table: RLS allows read only for `admin` role; public submitter has no read access |

---

## BUSINESS RULES

1. **No direct writes to core tables** — Public forms never write to `cases`, `professionals`, `municipalities`, `professional_documents`, or any core operational table
2. **Single intake boundary** — All external submissions enter through `inbound_inquiries`; no exceptions
3. **Admin conversion is mandatory** — Staged records become canonical records only after explicit admin action; no automatic conversion
4. **Public submitters have no platform access** — No login, no read access, no tracking of their submission after submission
5. **WF-015 is not a municipality portal** — Consistent with ADR-005; sagsbehandler submits a form and has no further system interaction
6. **SPAM records are not notified** — Admin is not alerted for honeypot-flagged submissions; SPAM records are visible in the admin portal on demand
7. **CAPTCHA is server-side validated** — Client-side CAPTCHA completion alone is not sufficient; token must be verified against Cloudflare API in the server-side handler
8. **No PII in notification body** — `INQUIRY_RECEIVED` notification contains only submission ID and link; no name, email, or message content (ADR-004)
9. **form_data is immutable** — The JSONB payload stored at submission time is never modified; admin sees original submission
10. **Duplicate submissions** — Not auto-detected in MVP; admin reviews and rejects manually if duplicate identified

---

## AUDIT EVENTS

| Event | Trigger |
|---|---|
| `INQUIRY_RECEIVED` | Submission successfully staged as `inbound_inquiries` record with `status = PENDING` |
| `INQUIRY_CONVERTED` | Admin converts staged record to canonical object (case, professional, etc.) |
| `INQUIRY_REJECTED` | Admin rejects staged record with a recorded reason |

No audit event is emitted for SPAM records (honeypot-detected). No audit event is emitted for rejected requests (CAPTCHA failure, rate limit, validation failure) — these are operational failures, not business events.

---

## NOTIFICATION EVENTS

| Notification Type | Source | Recipient | Channel | Trigger |
|---|---|---|---|---|
| `INQUIRY_RECEIVED` | WF-015 | Admin (system email) | EMAIL | Public form submission successfully staged — admin review required |

**Recipient:** `recipient_email = SYSTEM_ADMIN_EMAIL` (environment variable)  
**Body:** Contains submission ID and direct link to admin review screen. No PII. No form content. (ADR-004)  
**Not emitted for:** SPAM records, failed submissions (CAPTCHA failure, rate limit, validation error)

---

## DATA STRUCTURES

**inbound_inquiries (full schema in TS-001):**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `submission_type` | TEXT | `MUNICIPALITY_INQUIRY`, `PROFESSIONAL_APPLICATION`, `PARTNER_LEAD` (Phase 2) |
| `status` | TEXT | `PENDING`, `REVIEWED`, `CONVERTED`, `REJECTED`, `SPAM` |
| `submitted_at` | TIMESTAMPTZ | Time of submission |
| `submitter_name` | TEXT | From form |
| `submitter_email` | TEXT | From form |
| `submitter_phone` | TEXT | Optional, from form |
| `organization_name` | TEXT | Municipality name or company name (free text — not FK to municipalities) |
| `message` | TEXT | Form freetext body |
| `form_data` | JSONB | Complete validated payload (immutable) |
| `source_url` | TEXT | Referring kursskifte.dk page URL |
| `ip_hash` | TEXT | SHA-256 hashed submitter IP |
| `captcha_verified` | BOOLEAN | Whether CAPTCHA was server-side validated |
| `reviewed_by` | UUID REFERENCES profiles(id) | Admin who reviewed (NULL until reviewed) |
| `reviewed_at` | TIMESTAMPTZ | NULL until reviewed |
| `rejection_reason` | TEXT | Set on REJECTED |
| `converted_to_type` | TEXT | e.g., `'case'`, `'professional'` — set on CONVERTED |
| `converted_to_id` | UUID | FK to the created canonical record — set on CONVERTED |
| `created_at` | TIMESTAMPTZ | Same as submitted_at for normal flow |

---

## RETENTION

| Status | Retention Policy |
|---|---|
| `SPAM` | 90 days from `created_at`, then eligible for deletion via WF-013 |
| `REJECTED` | 90 days from `reviewed_at`, then eligible for deletion via WF-013 |
| `PENDING` / `REVIEWED` | 90 days from `created_at` if never converted, then eligible for deletion |
| `CONVERTED` | Retained for the same period as the canonical object created from it (7 years from case/professional archival). The staged record is the audit trail of the intake source. |

`inbound_inquiries` records are subject to WF-013 retention scheduling. Shorter retention for non-converted records (90 days) is appropriate because SPAM and REJECTED records are operational noise, not case history.

---

## PUBLIC API ENDPOINTS

| Endpoint | Auth | Rate Limit | Form Type |
|---|---|---|---|
| `POST /api/public/intake/inquiry` | None | 5/IP/hour | Municipality inquiry |
| `POST /api/public/intake/professional-application` | None | 5/IP/hour | Professional application |

**Admin review endpoints (authenticated, admin role):**

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/inbound-inquiries` | GET | List staged submissions with status filter |
| `/api/admin/inbound-inquiries/[id]` | GET | View single submission |
| `/api/admin/inbound-inquiries/[id]/convert` | POST | Convert to canonical record (triggers WF-001 or WF-002) |
| `/api/admin/inbound-inquiries/[id]/reject` | POST | Reject with reason |

---

## ENVIRONMENT VARIABLES

| Variable | Purpose |
|---|---|
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Server-side CAPTCHA validation against Cloudflare API |
| `SYSTEM_ADMIN_EMAIL` | Recipient for `INQUIRY_RECEIVED` notification (shared with WF-014) |
| `INTAKE_RATE_LIMIT_WINDOW_SECONDS` | Rate limit window (default: 3600) |
| `INTAKE_RATE_LIMIT_MAX_SUBMISSIONS` | Max submissions per IP per window (default: 5) |

---

## GDPR NOTES

- `submitter_email` and `submitter_name` are personal data. These fields are subject to the 90-day retention policy for non-converted records (WF-013).
- For CONVERTED records: if the inquiry converts to a professional profile, the professional's data is managed by the professional's own profile lifecycle. The `inbound_inquiries` record retains the original submission as intake audit evidence.
- Raw IP addresses are never stored. `ip_hash` contains a one-way hash and cannot be reversed to identify an individual.
- Public submitters have no platform account; their data exists only in `inbound_inquiries` and is subject to this workflow's retention policy.
- `form_data` JSONB may contain personal data. It is subject to the same retention as the parent `inbound_inquiries` record.

---

## WORKFLOW CONNECTIONS

| Reference | Direction | Description |
|---|---|---|
| WF-001 | Downstream | Admin converts `PROFESSIONAL_APPLICATION` staged record into WF-001 professional profile creation |
| WF-002 | Downstream | Admin converts `MUNICIPALITY_INQUIRY` staged record; WF-002 begins from the staged data |
| WF-013 | Downstream | GDPR retention applies to `inbound_inquiries` records (90-day for non-converted, 7-year for CONVERTED) |
| WF-014 | Downstream | Dispatches `INQUIRY_RECEIVED` notification on successful staging |

---

## OPEN QUESTIONS

1. Should public submitters receive an email confirmation ("we received your inquiry")? In MVP they do not — admin capacity is small and managing expectations manually is feasible at low volume. Deferred to Phase 2.
2. Should the admin portal show "similar submissions" to help detect duplicates? (e.g., same email within 7 days) — Phase 2.
3. Should `PARTNER_LEAD` be included in MVP or deferred to Phase 2? Current decision: Phase 2.
4. What is the Cloudflare Turnstile site key management process? Stored as env var; needs to be provisioned before deployment.
5. Should SPAM records generate an admin alert after N SPAM submissions from the same IP in a short window? Phase 2 abuse monitoring.

---

**This workflow is implementation-ready. Owned by Governance Domain. Upstream of WF-001 and WF-002 for all public website submissions. Security boundary between kursskifte.dk and Kursskifte Match core tables. Consistent with ADR-005 (no sagsbehandler portal access — WF-015 is write-only intake, not portal access).**
