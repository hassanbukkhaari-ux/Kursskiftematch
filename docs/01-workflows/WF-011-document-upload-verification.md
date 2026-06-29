# WF-011: Document Upload and Verification

**Workflow ID:** WF-011  
**Title:** Professional Document Upload and Admin Verification  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Professional Domain

---

## PURPOSE

Manage the lifecycle of professional credential documents (CV, criminal record, certifications, insurance). Documents progress through upload, admin review, and verification before a professional can be activated. Re-upload is supported when documents expire or fail verification.

---

## ACTORS

- **Professional** — Uploads credential documents
- **Admin (Compliance Officer)** — Reviews and verifies uploaded documents

---

## TRIGGER

1. **Initial upload:** Professional onboarding (WF-001) requires documents before admin can activate account
2. **Re-upload:** Document expires (`expiry_date < TODAY`) or admin marks `re_upload_required = TRUE`
3. **New document type:** Admin requests additional credential

---

## PRECONDITIONS

- Professional profile exists (`professionals` row with linked `profiles` row)
- Professional status is `REGISTERED` (initial) or `ACTIVE` (re-upload / new document type)

---

## MAIN FLOW

### Step 1 — Professional Uploads Document

Professional calls `POST /api/professionals/:id/documents` with:

| Field | Required | Notes |
|---|---|---|
| `document_type` | Yes | `CV`, `CRIMINAL_RECORD`, `CHILD_PROTECTION`, `DRIVING_LICENSE`, `QUALIFICATION`, `INSURANCE`, `OTHER` |
| `file_path` | Yes | Supabase Storage path |
| `file_hash` | Yes | SHA-256 hash for integrity check |
| `expiry_date` | Conditional | Required for CRIMINAL_RECORD, CHILD_PROTECTION, DRIVING_LICENSE, INSURANCE |

System sets:
- `status = 'UNVERIFIED'`
- `uploaded_at = NOW()`
- `uploaded_by = auth.uid()`

If prior document exists for same type: admin marks old one `ARCHIVED` (not overwritten).

Audit event: `DOCUMENT_UPLOADED` — `{ "resource_type": "professional_documents", "resource_id": "<id>" }`

### Step 2 — Admin Reviews Document

Admin calls `GET /api/professionals/:id/documents` to view all documents for a professional.

Admin opens each document to review:
- Correct document type
- Document legible and unaltered (compare file_hash)
- Not expired (`expiry_date` is in the future, or document type has no expiry)
- Matches professional identity

### Step 3 — Admin Verifies or Rejects Document

Admin calls `PATCH /api/professionals/:id/documents/:docId`:

**On approval:**
```json
{
  "status": "VERIFIED",
  "verification_notes": "string | null"
}
```
System sets: `verified_at = NOW()`, `verified_by = auth.uid()`  
Audit event: `DOCUMENT_VERIFIED` — `{ "resource_type": "professional_documents", "resource_id": "<id>" }`

**On rejection (requires re-upload):**
```json
{
  "status": "UNVERIFIED",
  "re_upload_required": true,
  "verification_notes": "Document illegible — please re-upload"
}
```
Audit event: `DOCUMENT_REJECTED` — `{ "resource_type": "professional_documents", "resource_id": "<id>" }`

### Step 4 — Professional Activation (Post-Verification)

Once all required documents are `VERIFIED`:
- Admin may activate professional (status `REGISTERED → ACTIVE`) via WF-001 step 5
- This step is outside WF-011 scope; WF-011 only manages document lifecycle

---

## ALTERNATIVE FLOWS

### A1: Document Expiry (Re-upload Required)

Triggered when `expiry_date < TODAY` for a VERIFIED document:

1. Admin or system identifies expired document
2. Admin sets `re_upload_required = TRUE` via PATCH
3. Professional is notified (via `notification_log` — `DOCUMENT_EXPIRING`)
4. Professional uploads new document (Step 1)
5. Admin re-verifies (Steps 2–3)
6. Old document marked `ARCHIVED`

### A2: Document Archived

When professional is archived or document superseded:
- Admin sets `status = 'ARCHIVED'` via PATCH
- `archived_at` is NOT a column in `professional_documents` — archival is via status field only
- No data deleted (ADR-007)

### A3: Criminal Record Pending Upload at Onboarding

At initial onboarding:
- Professional row is created with `status = 'REGISTERED'` (WF-001 step 1)
- Admin creates `professional_documents` rows with `status = 'PENDING_UPLOAD'` for required types
- Professional uploads documents to fill PENDING_UPLOAD slots (Step 1 above sets `UNVERIFIED`)
- Workflow proceeds to Steps 2–3

---

## DOCUMENT LIFECYCLE

```
PENDING_UPLOAD → UNVERIFIED → VERIFIED
                      ↑
              (re_upload_required=TRUE)
                    ARCHIVED
```

| Status | Meaning |
|---|---|
| `PENDING_UPLOAD` | Slot created; document not yet submitted |
| `UNVERIFIED` | Document uploaded; awaiting admin review |
| `VERIFIED` | Admin reviewed and confirmed |
| `ARCHIVED` | Superseded, expired, or professional archived |

---

## BUSINESS RULES

1. **Admin-only verification** — Professionals can upload but cannot set their own documents to `VERIFIED`. RLS enforces admin-only for status transitions that include `VERIFIED`.
2. **File hash integrity** — `file_hash` must be checked at upload and at verification to detect tampering.
3. **Expiry tracking** — Documents with `expiry_date` must be monitored. System should flag `expiry_date < TODAY + 30 days` as expiring soon.
4. **No deletion** — Documents are never hard-deleted. Archival via `status = 'ARCHIVED'` (ADR-007).
5. **CRIMINAL_RECORD required** — Professional cannot be activated (status → ACTIVE) without a VERIFIED CRIMINAL_RECORD. This is enforced at the WF-001 step 5 level.
6. **CHILD_PROTECTION required for child cases** — Cases involving minors require the professional to have a VERIFIED CHILD_PROTECTION document.
7. **Multiple documents per type** — A professional may have multiple rows for the same `document_type` (e.g., current + archived versions). No UNIQUE constraint on (professional_id, document_type).

---

## TS-001 TABLE

`professional_documents` — Professional Domain

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `professional_id` | UUID NOT NULL FK → professionals | |
| `document_type` | TEXT NOT NULL | CHECK: CV, CRIMINAL_RECORD, CHILD_PROTECTION, DRIVING_LICENSE, QUALIFICATION, INSURANCE, OTHER |
| `status` | TEXT NOT NULL DEFAULT 'PENDING_UPLOAD' | CHECK: PENDING_UPLOAD, UNVERIFIED, VERIFIED, ARCHIVED |
| `file_path` | TEXT | Supabase Storage path |
| `file_hash` | TEXT | SHA-256 |
| `uploaded_at` | TIMESTAMPTZ | Set at upload |
| `uploaded_by` | UUID FK → profiles | |
| `expiry_date` | DATE | Required for time-limited credentials |
| `verified_at` | TIMESTAMPTZ | Set by admin on verification |
| `verified_by` | UUID FK → profiles | |
| `verification_notes` | TEXT | Admin review notes |
| `re_upload_required` | BOOLEAN DEFAULT FALSE | |
| `created_at` | TIMESTAMPTZ NOT NULL | Auto |

**RLS:**
- SELECT: Professional sees own; admin sees all
- INSERT: Professional (own) or admin
- UPDATE: Admin only (status transitions; re_upload_required flag)
- DELETE: Never

---

## AUDIT EVENTS

| Event | Trigger |
|---|---|
| `DOCUMENT_UPLOADED` | Professional submits document |
| `DOCUMENT_VERIFIED` | Admin approves document |
| `DOCUMENT_REJECTED` | Admin marks re_upload_required=TRUE |

---

## OUTPUTS

- `professional_documents` row in `VERIFIED` status
- Audit events for each transition

---

## RELATED WORKFLOWS

- **WF-001 (Professional Onboarding)** — Document verification is a required gate before professional activation
- **WF-013 (GDPR Retention)** — Professional documents are deleted 7 years after professional is archived
