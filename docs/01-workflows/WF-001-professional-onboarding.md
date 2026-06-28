# WF-001: Professional Onboarding

**Workflow ID:** WF-001  
**Title:** Professional Onboarding — From Application to ACTIVE Status  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Professional Domain

---

## PURPOSE

Convert a professional application into a REGISTERED professional profile, verify credentials, and transition to ACTIVE status ready for case assignment.

---

## ACTORS

- **Recruiter** — Initiates professional recruitment and intake
- **Professional** — Applicant or hired staff member
- **Compliance Officer** — Verifies documents and credentials
- **Hiring Manager** — Makes hiring decision

---

## TRIGGER

Recruiter submits professional application (manual form or admin intake).

---

## PRECONDITIONS

- Professional has provided application information (CV, contact, qualifications)
- Recruiter has reviewed application

---

## MAIN FLOW

1. **Recruiter creates Professional profile**
   - Input: Name, contact, profession, experience, qualifications, capacity details
   - Output: Professional created with status=REGISTERED
   - Event: `PROFESSIONAL_RECRUITED` logged

2. **Professional uploads required documents**
   - Criminal record check
   - Child protection certificate (if relevant)
   - CV/qualifications
   - Additional certificates (optional)
   - Each document status=PENDING_UPLOAD

3. **Compliance Officer verifies documents**
   - Reviews each document
   - Sets status=VERIFIED or UNVERIFIED with feedback
   - Records expiry dates
   - Event: `DOCUMENT_VERIFIED` logged (for each)

4. **All documents VERIFIED?**
   - If NO → Professional re-uploads (loop to step 2)
   - If YES → Proceed to step 5

5. **Hiring Manager reviews and approves professional**
   - Reviews profile, documents, background
   - Sets Professional status=ACTIVE
   - Event: `PROFESSIONAL_APPROVED` logged

6. **Professional Onboarding Complete**
   - Professional now eligible for case assignment
   - Matching domain can now consider for case scores

---

## ALTERNATIVE FLOWS

### A1: Professional Rejected
- Hiring Manager declines professional
- Professional status=ARCHIVED (soft delete)
- Event: `PROFESSIONAL_REJECTED` logged
- No further action

### A2: Document Upload Delayed
- If professional misses deadline or is slow
- Compliance Officer may flag with reminder
- No hard deadline in MVP (manual follow-up)

### A3: Multiple Document Re-uploads
- Professional uploads, gets rejected, re-uploads
- Original document preserved for audit trail
- System shows latest status
- Event: `DOCUMENT_REUPLOADED` logged each time

---

## BUSINESS RULES

1. **REGISTERED professionals cannot be assigned to cases** (must be ACTIVE first)
2. **All required documents must be VERIFIED** before activation
3. **Document verification is not approval** (Compliance Officer verifies documents exist, Hiring Manager approves professional)
4. **No automatic approval** (every step is explicit human decision)
5. **Professional can view own profile and upload documents** (through professional portal)

---

## AUDIT EVENTS

- `PROFESSIONAL_RECRUITED` — Professional profile created
- `DOCUMENT_UPLOADED` — Document file saved
- `DOCUMENT_VERIFIED` — Compliance Officer verified document
- `DOCUMENT_REJECTED` — Document failed verification (re-upload required)
- `PROFESSIONAL_APPROVED` — Professional transitioned to ACTIVE
- `PROFESSIONAL_REJECTED` — Professional application rejected

---

## NOTIFICATION EVENTS

WF-001 emits the following notification event. The workflow records the notification type and recipient — it does not specify delivery channel. Channel assignment is owned by WF-014 (Notification Dispatch, ADR-010).

| Notification Type | Recipient | Trigger |
|---|---|---|
| `PROFESSIONAL_APPLICATION_RECEIVED` | Admin (system email) | Professional profile created with status=REGISTERED — requires Compliance Officer review and document verification |

**Notes:**
- `PROFESSIONAL_APPLICATION_RECEIVED` fires at step 1 when the recruiter creates the professional profile. It signals to the admin team that a new application is in the credential verification queue.
- This is the only MVP notification event for WF-001. Subsequent events (`PROFESSIONAL_APPROVED`, `PROFESSIONAL_REJECTED`) are deferred to Phase 2.

---

## OUTPUTS

- Professional entity with status=ACTIVE (ready for assignment)
- All documents stored with expiry tracking
- Audit trail of onboarding process

---

## OPEN QUESTIONS

1. What is the SLA for Compliance Officer document verification? (2 days? 1 week?)
2. Should professional receive notification when documents approved/rejected?
3. Should recruiter have access to view verification status?
4. Are there profession-specific required documents? (e.g., nurses vs pedagogues)

---

**This workflow is implementation-ready. Data structures defined in DOMAIN_MODEL_DATABASE_SPEC.md**
