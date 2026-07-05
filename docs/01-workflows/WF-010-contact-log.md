# WF-010: Contact Log

**Workflow ID:** WF-010  
**Title:** Professional Communication Log with Sagsbehandler  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Delivery Domain

---

## PURPOSE

Allow the assigned professional to record every communication with the case's sagsbehandler. Contact logs provide a factual, append-only record that supports professional accountability, follow-up tracking, and case progress documentation.

---

## ACTORS

- **Professional** — Logs contact after communication occurs
- **Admin** — Can view all contact logs; can log on behalf of professional

---

## TRIGGER

Professional completes any communication with the sagsbehandler (phone call, email, in-person meeting) and must log it in the system before end of day.

---

## PRECONDITIONS

- Case exists with `status = 'ACTIVE'`
- Professional is currently assigned to the case (`case_assignments.ended_at IS NULL`)
- Professional has contact info (via prior `ContactDisclosure` — see WF-009)

---

## MAIN FLOW

### Step 1 — Professional Logs Contact

Professional calls `POST /api/cases/:id/contact-logs` with:

| Field | Required | Notes |
|---|---|---|
| `professional_id` | Yes | Must equal `auth.uid()` for professionals |
| `contact_type` | Yes | `PHONE_CALL`, `EMAIL`, `IN_PERSON`, `OTHER` |
| `logged_at` | Yes | When the communication occurred (may differ from submission time) |
| `note` | No | Summary of communication — **encrypted at application layer** |
| `outcome` | No | Result of contact — **encrypted at application layer** |
| `follow_up_required` | No | Boolean flag for follow-up tracking (default `FALSE`) |

`logged_by` is set automatically from `auth.uid()`.

### Step 2 — System Validates and Stores

- Validates `contact_type` ∈ `{PHONE_CALL, EMAIL, IN_PERSON, OTHER}`
- Verifies professional is assigned to the case (RLS enforces)
- Encrypts `note` and `outcome` before write
- INSERT into `contact_logs` — **append-only, no updates ever**
- Returns 201 with `id`, `case_id`, `professional_id`, `contact_type`, `logged_at`, `logged_by`, `created_at`

### Step 3 — Audit Event

- Event: `CONTACT_LOGGED`
- Metadata: `{ "resource_type": "contact_logs", "resource_id": "<new_id>" }`
- No sensitive content in audit metadata (ADR-004)

---

## ALTERNATIVE FLOWS

### A1: Admin Logs on Behalf of Professional

Admin can call `POST /api/cases/:id/contact-logs` with any `professional_id`. Useful when:
- Professional logged contact offline and admin is entering it
- Admin is recording their own direct contact with sagsbehandler

`logged_by = auth.uid()` (admin's ID), `professional_id = :professionalId` (target professional).

### A2: Follow-up Required

If `follow_up_required = TRUE`:
- No automated workflow triggered
- Admin or professional uses this flag as a reminder in the contact log list
- Next contact log should document the follow-up outcome

---

## BUSINESS RULES

1. **Append-only** — No UPDATE or DELETE on `contact_logs`. Errors require admin correction (new entry).
2. **No in-app messaging** — `contact_type` reflects external channels only: PHONE_CALL, EMAIL, IN_PERSON, OTHER. IN_APP is forbidden (see DO_NOT_BUILD.md).
3. **Encryption required** — `note` and `outcome` contain sensitive coordination details and must be encrypted at application layer before storage.
4. **Assigned professional only** — RLS prevents logging for cases where the professional is not currently assigned.
5. **logged_at vs created_at** — `logged_at` records when the communication happened; `created_at` records when it was entered in the system. These may differ (e.g., professional enters next-day log).
6. **Contact info prerequisite** — Professional must have sagsbehandler contact info (via WF-009 ContactDisclosure) before communication can occur. This workflow records the outcome; WF-009 gates the access.

---

## TS-001 TABLE

`contact_logs` — Delivery Domain

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `case_id` | UUID NOT NULL FK → cases | |
| `professional_id` | UUID NOT NULL FK → professionals | |
| `contact_type` | TEXT NOT NULL | CHECK: PHONE_CALL, EMAIL, IN_PERSON, OTHER |
| `logged_at` | TIMESTAMPTZ NOT NULL | When communication occurred |
| `logged_by` | UUID NOT NULL FK → profiles | Set from auth.uid() |
| `note` | TEXT | Encrypted |
| `outcome` | TEXT | Encrypted |
| `follow_up_required` | BOOLEAN DEFAULT FALSE | |
| `created_at` | TIMESTAMPTZ NOT NULL | Auto |

**RLS:**
- SELECT: Professional sees own (`professional_id = auth.uid()`); admin sees all
- INSERT: Professional (own) or admin
- UPDATE: Never
- DELETE: Never

---

## AUDIT EVENTS

| Event | Trigger |
|---|---|
| `CONTACT_LOGGED` | Contact log entry created |

---

## OUTPUTS

- New `contact_logs` row (encrypted `note` and `outcome`)
- `CONTACT_LOGGED` audit event

---

## API ENDPOINTS

| Trin | Metode | Endpoint | Auth | Tabel |
|---|---|---|---|---|
| Log kontakt | `POST` | `/api/cases/:id/contact-logs` | Own/Admin | `contact_logs` |
| Hent kontaktlog | `GET` | `/api/cases/:id/contact-logs` | Own/Admin | `contact_logs` |

**TS-002 reference:** §7.11–7.12 (Contact Log Endpoints)

---

## RELATED WORKFLOWS

- **WF-009 (Contact Disclosure)** — Admin must disclose sagsbehandler contact info before professional can make contact
- **WF-005 (Session Documentation)** — Session logs document citizen contact; contact logs document sagsbehandler contact
