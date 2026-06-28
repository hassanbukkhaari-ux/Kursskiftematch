# WF-011: Document Upload and Verification

**Workflow ID:** WF-011  
**Title:** Document Upload and Verification — Post-Onboarding Credential Maintenance  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Professional Domain

---

## SCOPE NOTE

**This workflow covers post-onboarding credential maintenance only.**

Initial document upload — during professional intake before the professional is activated — is fully owned by **WF-001 (Professional Onboarding)**. WF-011 begins only after a professional has completed onboarding and is in status=ACTIVE or INACTIVE. Do not duplicate WF-001 logic here.

Scenarios covered by this workflow:
- A VERIFIED document is approaching expiry and must be renewed
- Admin identifies a deficiency and requests a re-upload
- A professional proactively uploads an additional credential after activation
- Admin verifies or rejects a post-onboarding upload

---

## PURPOSE

Enable professionals to upload renewed or additional credential documents after initial onboarding, and enable compliance officers to verify, reject, or request re-uploads, maintaining an up-to-date credential vault throughout the professional's engagement.

---

## ACTORS

- **Professional** — Uploads renewed or additional documents
- **Compliance Officer (Admin)** — Verifies, rejects, or requests re-upload of documents
- **Governance Domain** — Logs verification events

---

## TRIGGER

One of:
- An existing document record reaches expiry_date (is_expiring_soon = TRUE at query time)
- Admin identifies a credential gap and sets re_upload_required = TRUE
- Professional proactively uploads a new or additional credential

---

## PRECONDITIONS

- Professional profile exists with status=ACTIVE or INACTIVE
- A professional_documents record exists (admin has pre-created the placeholder), OR professional is initiating a new document type upload

---

## MAIN FLOW

1. **Professional identifies document requiring upload**
   - Professional sees a document listed as PENDING_UPLOAD, UNVERIFIED, or flagged re_upload_required = TRUE in their credential portal
   - Or professional initiates a voluntary upload for a new credential type

2. **Professional uploads document file**
   - Selects document_type (CV, CRIMINAL_RECORD, CHILD_PROTECTION, DRIVING_LICENSE, QUALIFICATION, INSURANCE, OTHER)
   - Uploads file to Supabase Storage
   - System sets:
     - file_path = Storage path
     - file_hash = content hash (integrity check)
     - uploaded_at = NOW()
     - uploaded_by = professional's auth.uid()
   - Status transitions: PENDING_UPLOAD → UNVERIFIED
   - If re_upload_required was TRUE: re_upload_required set to FALSE

3. **Admin reviews uploaded document**
   - Reviews document content and file
   - Checks document type, authenticity, and expiry if applicable
   - Decides: verify or request re-upload

4. **Outcome: Document verified**
   - Admin sets status = VERIFIED
   - Admin sets verified_at = NOW(), verified_by = auth.uid()
   - Admin sets expiry_date if the document expires
   - Admin may add verification_notes
   - Event: `DOCUMENT_VERIFIED` logged

---

## ALTERNATIVE FLOWS

### A1: Admin Rejects Document (Re-upload Required)
- Admin determines document is invalid, illegible, incorrect type, or insufficient
- Admin sets re_upload_required = TRUE
- Admin adds verification_notes explaining what is deficient
- Document status remains UNVERIFIED
- Professional is expected to re-upload (notification emitted per NOTIFICATION EVENTS section below; delivery via WF-014)
- Professional uploads corrected document — creates a NEW professional_documents record (existing record is NOT overwritten)
- Admin verifies the new record and sets the old UNVERIFIED record to ARCHIVED

### A2: Document Approaching Expiry (Renewal Required)
- is_expiring_soon derived at query time: status='VERIFIED' AND expiry_date BETWEEN TODAY AND TODAY + 30 DAYS
- is_expired derived at query time: status='VERIFIED' AND expiry_date < TODAY
- Neither value is stored (ADR-008 — no derived values stored)
- Admin dashboard highlights professionals with expiring/expired documents
- Admin sets re_upload_required = TRUE on the existing record and adds a note
- Professional uploads renewed document → NEW professional_documents record created
- Admin verifies the new record
- Admin archives the old expired record (status → ARCHIVED)
- No automatic status change on professional profile — expiry does not auto-deactivate the professional

### A3: Professional Uploads Without Admin Request
- Professional may proactively upload an additional credential at any time
- Professional creates a new professional_documents record (document_type = relevant type)
- Status begins at UNVERIFIED after upload
- Admin reviews and verifies as per main flow

### A4: Admin Uploads on Behalf of Professional
- In some cases, admin may upload a credential received externally (e.g., PDF emailed by professional)
- Admin creates or updates a professional_documents record
- uploaded_by = admin's auth.uid()
- System behaviour is identical to professional upload; RLS permits admin to upload for any professional

---

## BUSINESS RULES

1. **Post-onboarding scope only** — Initial credential upload during intake is WF-001; this workflow begins after onboarding is complete
2. **No overwrite** — Re-uploads create NEW professional_documents records; existing records are never overwritten
3. **No auto-deactivation** — Document expiry or re_upload_required = TRUE does not automatically change professional.status; this is an admin decision
4. **is_expired and is_expiring_soon are derived values** — Calculated at query time, never stored (ADR-008 compliant)
5. **Only admin can set status=VERIFIED** — Professionals cannot self-verify their own documents
6. **Professionals cannot update a VERIFIED document** — Status changes on VERIFIED records require admin action
7. **Archive, never delete** — Old documents are transitioned to status=ARCHIVED when superseded; hard deletes are prohibited (ADR-007)
8. **file_hash integrity** — System stores a hash of the uploaded file to detect corruption or tampering

---

## AUDIT EVENTS

- `DOCUMENT_VERIFIED` — Admin verifies a professional document (shared with WF-001; same event, same table, different trigger context)

**Metadata:**
```json
{
  "document_id": "uuid",
  "professional_id": "uuid",
  "document_type": "CRIMINAL_RECORD",
  "verified_by": "uuid"
}
```

---

## NOTIFICATION EVENTS

WF-011 emits the following notification events. The workflow records the notification type and recipient — it does not specify delivery channel. Channel assignment is owned by WF-014 (Notification Dispatch, ADR-010).

| Notification Type | Recipient | Trigger |
|---|---|---|
| `DOCUMENT_UPLOADED` | Admin (Compliance Officer) | Professional uploads a document (status → UNVERIFIED) — requires verification action |
| `DOCUMENT_EXPIRING` | Admin | Nightly scheduled check detects a VERIFIED document with expiry_date within 30 days — admin must request re-upload |
| `DOCUMENT_RE_UPLOAD_REQUIRED` | Professional | Admin sets re_upload_required = TRUE — professional must upload a new document |

**Notes:**
- `DOCUMENT_UPLOADED` fires on every upload, including proactive uploads (A3) and admin uploads on behalf of professional (A4)
- `DOCUMENT_EXPIRING` is triggered by a scheduled process (nightly job), not a real-time event. The document record itself does not change; is_expiring_soon is a derived value (ADR-008). The notification is the only signal sent to admin.
- `DOCUMENT_RE_UPLOAD_REQUIRED` fires at the moment admin sets re_upload_required = TRUE, regardless of whether a note has been added. It is the system's mechanism for telling the professional to act.

---

## OUTPUTS

- professional_documents record with status=VERIFIED
- Audit trail of verification events
- Admin dashboard indicators for expiring and expired documents
- Admin dashboard indicators for documents with re_upload_required = TRUE

---

## DATA STRUCTURES

**professional_documents (all fields already present in TS-001 — no schema amendments required):**
- professional_id UUID NOT NULL REFERENCES professionals(id)
- document_type TEXT NOT NULL IN ('CV', 'CRIMINAL_RECORD', 'CHILD_PROTECTION', 'DRIVING_LICENSE', 'QUALIFICATION', 'INSURANCE', 'OTHER')
- status TEXT NOT NULL IN ('PENDING_UPLOAD', 'UNVERIFIED', 'VERIFIED', 'ARCHIVED')
- file_path TEXT (NULL until uploaded)
- file_hash TEXT (NULL until uploaded)
- uploaded_at TIMESTAMPTZ (NULL until uploaded)
- uploaded_by UUID REFERENCES profiles(id) (NULL until uploaded)
- expiry_date DATE (nullable — some documents do not expire)
- verified_at TIMESTAMPTZ (NULL until verified)
- verified_by UUID REFERENCES profiles(id) (NULL until verified)
- verification_notes TEXT (nullable)
- re_upload_required BOOLEAN DEFAULT FALSE
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Derived values (query-time only, never stored):**
- is_expired = (status = 'VERIFIED' AND expiry_date < TODAY)
- is_expiring_soon = (status = 'VERIFIED' AND expiry_date BETWEEN TODAY AND TODAY + 30 DAYS)

---

## TS-001 AMENDMENTS REQUIRED

None. All fields required by this workflow are already defined in TS-001.

---

## WORKFLOW CONNECTIONS

| Reference | Direction | Description |
|-----------|-----------|-------------|
| WF-001 | Upstream | Initial document upload is owned by WF-001; WF-011 begins after onboarding is complete |
| WF-003 | Lateral | Matching requires professional to have valid documents; expiry may affect matching eligibility |
| WF-013 | Downstream | GDPR retention applies to professional_documents; deletion follows professional archival |

---

## OPEN QUESTIONS

1. Should admin receive an automated notification when a document's expiry_date is within 30 days (requires notification infrastructure — see notification requirement)?
2. Should there be a maximum number of unresolved re_upload_required = TRUE documents before a professional is automatically flagged as ineligible for new assignments?
3. Should verification_notes be visible to the professional, or admin-only?
4. Should the professional be able to delete an UNVERIFIED document they uploaded in error?

---

**This workflow is implementation-ready. No TS-001 schema amendments are required. Owned by Professional Domain. Depends on WF-001 for initial onboarding context. Post-onboarding document renewals are subject to GDPR retention via WF-013.**
