# WF-009: Contact Disclosure

**Workflow ID:** WF-009  
**Title:** Disclose Sagsbehandler Contact Information to Professional  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Delivery Domain

---

## PURPOSE

Enable Case Coordinator to explicitly disclose municipality case worker (sagsbehandler) contact information to an assigned professional, with audit trail and optional control over communication method.

---

## ACTORS

- **Case Coordinator (Admin)** — Initiates disclosure
- **Professional** — Receiving contact information
- **Governance Domain** — Logs disclosure event

---

## TRIGGER

Admin initiates when professional needs to contact sagsbehandler:
- To coordinate case updates
- To request grant extension
- To escalate safeguarding concern
- To provide progress update

---

## PRECONDITIONS

- Professional assigned to case (CaseAssignment exists)
- Case has municipality and sagsbehandler contact on file
- Admin decides professional should have contact (discretionary)

---

## MAIN FLOW

1. **Admin initiates disclosure**
   - Views case and professional
   - Clicks "Disclose Sagsbehandler Contact"
   - System shows sagsbehandler name, email, phone (from Municipality record)

2. **Admin specifies disclosure method**
   - EMAIL: Send contact via email to professional
   - PHONE: Provide phone number (professional calls)
   - MEETING: Schedule direct conversation
   - No IN_APP option in MVP (contact via platform forbidden)

3. **Admin confirms and provides reason**
   - Reason: Why is professional getting contact?
   - Examples:
     - "Coordinate case update"
     - "Request grant extension"
     - "Escalate safeguarding concern"
     - "Provide progress report"

4. **System creates ContactDisclosure record**
   - Captures:
     - case_id, disclosed_to_professional_id
     - disclosed_by (admin), disclosed_at
     - contact_method (EMAIL/PHONE/MEETING)
     - sagsbehandler contact details (snapshot at time of disclosure)
     - reason
   - Event: `CONTACT_DISCLOSED` logged

5. **Contact information delivered**
   - If EMAIL method: System sends email to professional with sagsbehandler contact
   - If PHONE/MEETING: Admin provides contact, records disclosure
   - Professional now has contact info (via email receipt or conversation)

6. **Audit trail created**
   - ContactDisclosure is immutable (insert-only)
   - Records: who disclosed, when, to whom, contact info snapshot, reason, method
   - Professional cannot see other disclosures (privacy)
   - Admin can see all disclosures (audit oversight)

---

## ALTERNATIVE FLOWS

### A1: Admin Provides Contact In-Person
- Admin phones or meets professional
- Provides sagsbehandler contact verbally
- Admin records in system: method=MEETING
- ContactDisclosure created with recorded time/reason

### A2: Contact Already Known
- Professional indicates they already have sagsbehandler contact
- System still creates ContactDisclosure (for audit purposes)
- Records: contact_method = 'MEETING', reason = "Professional already had contact — no new disclosure needed"
- Note: `VERBAL_EXISTING` is not a valid contact_method value. Use `MEETING` to record that a verbal/in-person confirmation occurred; capture the "already known" context in the reason field.

### A3: Sagsbehandler Contact Changes
- Municipality updates sagsbehandler details
- Old ContactDisclosures remain (immutable)
- New ContactDisclosures use new contact
- Admin may need to re-disclose with updated info

---

## BUSINESS RULES

1. **Contact disclosure is explicit admin decision** — Automatic disclosure forbidden
2. **Disclosure is immutable** — Once recorded, cannot be changed or deleted
3. **Snapshots capture contact at time of disclosure** — If sagsbehandler changes later, old disclosure shows old contact
4. **Professional can contact sagsbehandler freely once disclosed** — No restrictions
5. **Disclosure is audited** — Every contact sharing logged with reason
6. **Sagsbehandler not notified of disclosure** — Coordination happens externally
7. **No platform messaging** — Contact via email, phone, or in-person only

---

## AUDIT EVENTS

- `CONTACT_DISCLOSED` — Contact information shared
- `CONTACT_DISCLOSURE_REASON_LOGGED` — Reason documented
- `SAGSBEHANDLER_CONTACT_CHANGED` — Sagsbehandler details updated (affects future disclosures)

---

## OUTPUTS

- ContactDisclosure record (immutable)
- Audit trail of who disclosed what contact to whom and why
- Professional receives contact information (via email or conversation)

---

## DATA STRUCTURES

**ContactDisclosure:**
- id (UUID)
- case_id (FK)
- disclosed_to_professional_id (FK)
- disclosed_by (admin user_id)
- disclosed_at (timestamp)
- contact_method (EMAIL | PHONE | MEETING)
- sagsbehandler_name, email, phone (snapshot of contact at disclosure time)
- reason (text, max 300 chars)
- created_at (immutable)

---

## EXAMPLE SCENARIOS

### Scenario 1: Routine Coordination
**Case:** Teenager transitioning back to school after exclusion
**Professional:** Educational psychologist, assigned 6 weeks
**Trigger:** Professional wants to coordinate with sagsbehandler on timeline

**Process:**
1. Professional emails case coordinator: "Need contact for school coordination"
2. Admin initiates ContactDisclosure
3. Method: EMAIL
4. Reason: "Coordinate school transition timeline with case worker"
5. Admin confirms
6. System sends email to professional with sagsbehandler contact
7. ContactDisclosure logged: "Disclosed to [professional] on [date] via email for school coordination"
8. Professional can now email sagsbehandler directly

### Scenario 2: Escalation
**Case:** Family with safeguarding concern
**Professional:** Social worker, newly assigned
**Trigger:** Professional identifies new risk during first session

**Process:**
1. Professional flags concern in system
2. Admin reviews and decides to disclose contact for urgent escalation
3. Method: PHONE (immediate)
4. Reason: "Escalate safeguarding concern identified in first session"
5. Admin calls professional, provides sagsbehandler phone
6. ContactDisclosure logged: "Disclosed to [professional] on [date] via phone for safeguarding escalation"
7. Professional can immediately reach sagsbehandler
8. Audit trail shows urgency and reason

---

## OPEN QUESTIONS

1. Should professional be notified that disclosure happened? (e.g., email confirmation)
2. Should there be restrictions on re-disclosing to same professional? (e.g., max once per week)
3. Can professional request contact, or only admin decision?
4. Should sagsbehandler be able to request disclosure in reverse (they want professional contact)?
5. Is there a "do not disclose" flag for sensitive cases?

---

**This workflow is implementation-ready. ContactDisclosure entity defined in DOMAIN_MODEL_DATABASE_SPEC.md**
