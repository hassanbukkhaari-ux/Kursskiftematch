# WF-010: Contact Log

**Workflow ID:** WF-010  
**Title:** Contact Log — Record Sagsbehandler Communication  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Delivery Domain

---

## PURPOSE

Enable professionals and admins to record communications with the sagsbehandler (municipality case worker) on a case, creating an immutable, chronological contact history that supports continuity of care and accountability.

---

## ACTORS

- **Professional** — Records contacts they have made with the sagsbehandler
- **Case Coordinator (Admin)** — May also record contacts; sets professional_id to the assigned professional
- **Governance Domain** — Logs contact events

---

## TRIGGER

Professional or admin navigates to "Log Contact" for an ACTIVE case after communicating with the sagsbehandler.

---

## PRECONDITIONS

- Case exists with status=ACTIVE
- CaseAssignment exists with ended_at IS NULL (professional assigned to case)
- Professional status=ACTIVE (if professional is logging)

---

## MAIN FLOW

1. **Actor opens contact log entry form**
   - Selects the relevant case
   - Selects contact_type: PHONE_CALL / EMAIL / IN_PERSON / OTHER
   - Enters logged_at (when the contact occurred — may differ from created_at)
   - Enters note (encrypted): summary of the communication
   - Enters outcome (encrypted, optional): result or next step agreed
   - Sets follow_up_required = TRUE or FALSE (default: FALSE)

2. **System sets ownership fields**
   - professional_id = professional currently assigned to the case (resolved from CaseAssignment WHERE ended_at IS NULL)
   - logged_by = auth.uid() of the actor submitting the form (may be admin or professional)

3. **Contact log record created**
   - Record is immutable after creation (append-only)
   - Event: `CONTACT_LOGGED` logged

4. **Workflow complete**
   - Contact log visible to admin and the assigned professional
   - No case status change occurs
   - No automatic follow-up is created (follow_up_required is a manual indicator)

---

## ALTERNATIVE FLOWS

### A1: Admin Logs Contact on Behalf of Professional
- Admin navigates to the case and opens the contact log form
- Admin selects contact details and submits
- System sets:
  - professional_id = assigned professional (from CaseAssignment WHERE ended_at IS NULL)
  - logged_by = admin's auth.uid()
- This ensures professional_id reflects who made the contact (the professional), while logged_by records who entered it (the admin)
- Record is otherwise identical to a professional-entered log

### A2: Follow-Up Required
- Actor sets follow_up_required = TRUE when the contact identified a required action
- follow_up_required is a manual advisory flag only
- No automatic task is created in MVP
- Admin may see all logs with follow_up_required = TRUE on the dashboard for operational follow-up

### A3: Contact Logged for Wrong Case
- Contact logs are immutable — there is no edit or delete path
- If a log is created with incorrect information, professional or admin must create a new corrected entry and add a note explaining the error in the corrected entry's note field
- The erroneous entry remains in the record (append-only audit trail)

---

## BUSINESS RULES

1. **Append-only** — Contact logs cannot be edited or deleted after creation
2. **professional_id is always the assigned professional** — Never the admin's profile ID; reflects who held the professional relationship
3. **logged_by is always the submitting actor** — Distinguishes who recorded the log from who made the contact
4. **Only ACTIVE cases receive new contact log entries** — System validates case.status = ACTIVE at creation
5. **Contact logs survive case closure** — Existing logs are not deleted when case moves to COMPLETED or ARCHIVED
6. **no IN_APP contact type** — MVP does not have in-app messaging; valid types are PHONE_CALL, EMAIL, IN_PERSON, OTHER
7. **note and outcome encrypted** — Application-level encryption via TweetNaCl.js applied before persistence

---

## AUDIT EVENTS

- `CONTACT_LOGGED` — Actor creates a contact log entry for a case

**Metadata:**
```json
{
  "contact_log_id": "uuid",
  "case_id": "uuid",
  "professional_id": "uuid",
  "logged_by": "uuid",
  "contact_type": "PHONE_CALL"
}
```

---

## NOTIFICATION EVENTS

WF-010 does not emit outbound notification events in MVP.

Contact logs with `follow_up_required = TRUE` surface as a dashboard indicator for admin operational review. No push notification is generated for individual contact log entries — the volume would be too high and the urgency too low to justify outbound delivery in MVP.

**Future notification (via WF-014, pending ADR-010 ratification):**

| Notification Type | Recipient | Trigger |
|---|---|---|
| `CONTACT_FOLLOW_UP_UNRESOLVED` | Admin | Contact log with follow_up_required = TRUE not resolved within N days (scheduled check) |

The workflow does not specify delivery channel. Channel assignment is owned by WF-014.

---

## OUTPUTS

- contact_log record (immutable)
- Audit trail of all logged contacts
- Admin dashboard indicator for entries with follow_up_required = TRUE

---

## DATA STRUCTURES

**contact_logs:**
- case_id UUID NOT NULL REFERENCES cases(id)
- professional_id UUID NOT NULL REFERENCES professionals(id) — assigned professional at time of logging
- contact_type TEXT NOT NULL IN ('PHONE_CALL', 'EMAIL', 'IN_PERSON', 'OTHER')
- logged_at TIMESTAMPTZ NOT NULL — when contact occurred
- logged_by UUID NOT NULL REFERENCES profiles(id) — who entered the record
- note TEXT (encrypted, nullable) — summary of communication
- outcome TEXT (encrypted, nullable) — result or next step
- follow_up_required BOOLEAN DEFAULT FALSE
- created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

---

## TS-001 AMENDMENTS REQUIRED

### Defect: contact_logs INSERT RLS too permissive

**Current policy (defect):**
```sql
CREATE POLICY "contact_logs_insert_policy" ON contact_logs
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'professional')
  );
```

**Problem:** Any authenticated professional can insert a contact log for any case, regardless of assignment. This violates the business rule that only the assigned professional (or an admin) may log contacts.

**Required fix:**
```sql
CREATE POLICY "contact_logs_insert_policy" ON contact_logs
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
    OR EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = contact_logs.case_id
        AND ca.professional_id = auth.uid()
        AND ca.ended_at IS NULL
    )
  );
```

This amendment is a security correction and must be applied to TS-001 before implementation.

---

## WORKFLOW CONNECTIONS

| Reference | Direction | Description |
|-----------|-----------|-------------|
| WF-004 | Upstream | Case must be ACTIVE before contact logs can be created |
| WF-009 | Lateral | WF-009 tracks sagsbehandler contact disclosure (separate from contact log entries) |
| WF-012 | Downstream | Contact logs are preserved on case closure and archival |
| WF-013 | Downstream | GDPR data retention and deletion applies to contact logs via case archival |

---

## OPEN QUESTIONS

1. Should professionals be able to see a dashboard view of their own contact logs with follow_up_required = TRUE?
2. Should there be a maximum age for contact logs (e.g., logged_at cannot be more than 30 days in the past)?
3. Should admin receive a notification when a contact log with follow_up_required = TRUE has not been resolved after N days?

---

**This workflow is implementation-ready pending the TS-001 INSERT RLS correction described above. Owned by Delivery Domain. Contact logs are preserved through case closure (WF-012) and subject to GDPR retention (WF-013).**
