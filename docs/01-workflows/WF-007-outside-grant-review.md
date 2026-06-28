# WF-007: Outside Grant Review

**Workflow ID:** WF-007  
**Title:** Review and Approve Hours Exceeding Municipal Grant  
**Status:** APPROVED for MVP  
**Version:** 1.0  
**Owner:** Governance Domain

---

## PURPOSE

When professional's hours exceed the municipal grant budget for a case, explicitly review and approve (or reject) the overage, ensuring municipalities know about budget overruns.

---

## ACTORS

- **Case Coordinator (Admin)** — Reviews overage, approves or rejects
- **Operations Manager** — May escalate for final approval on large amounts

---

## TRIGGER

Automatic: When hours submitted (WF-006) would exceed grant remaining.

Manual: Admin may flag historical hours if grant amended or error found.

---

## PRECONDITIONS

- Hours status=OUTSIDE_GRANT (flagged in WF-006)
- Grant allocation exists for case
- Professional claimed hours > remaining grant

---

## MAIN FLOW

1. **System detects overage (automated)**
   - Hours auto-flagged with status=OUTSIDE_GRANT
   - Alert sent to admin: "X hours exceed grant for case Y"
   - Event: `HOURS_OUTSIDE_GRANT_FLAGGED` logged

2. **Admin reviews overage in queue**
   - Views: Case details, grant remaining, professional, hours claimed
   - Checks: Is this expected? Was extra work necessary?
   - Can view session logs if linked
   - Can contact professional for clarification

3. **Admin decides**

   **Option A: Approve overage**
   - Professional worked beyond grant (common in crisis cases)
   - Work was necessary and documented
   - Admin approves: status=APPROVED (even though outside_grant)
   - Hours now count toward payroll
   - Municipality sees overage in reporting
   - Event: `HOURS_APPROVED_OUTSIDE_GRANT` logged
   - Note: Grant reconciliation happens separately (municipality pays or disputes)

   **Option B: Reject overage**
   - Hours were not actually worked or not billable
   - Professional error or miscalculation
   - Admin rejects: status=REJECTED
   - Hours do not count
   - Professional must resubmit corrected amount
   - Event: `HOURS_REJECTED_OUTSIDE_GRANT` logged

   **Option C: Escalate**
   - Large overage (e.g., grant was 24 hours, claiming 40)
   - Admin adds note and escalates to Operations Manager
   - Operations Manager reviews and approves/rejects
   - Status remains PENDING until final decision
   - Event: `HOURS_ESCALATED` logged

4. **Final decision recorded**
   - Hours status updated
   - Audit note recorded with reason
   - Professional notified if rejected

5. **Grant accounting updated**
   - If approved: grant remaining = reduced (now negative or consumed)
   - If rejected: grant remaining = unchanged
   - Municipality invoice reflects actual hours paid

---

## ALTERNATIVE FLOWS

### A1: Grant Amendment
- Coordinator realizes grant amount was wrong
- Amends CaseGrant to new amount
- Existing hours re-evaluated
- Any that are now within new grant moved back to APPROVED (status change)
- Event: `GRANT_AMENDED` logged

### A2: Multiple Overages
- Professional submits multiple hour entries, collectively exceeding grant
- Each flagged separately OR grouped for review
- Admin reviews collectively and approves/rejects in batch

---

## BUSINESS RULES

1. **Never auto-approve overages** — All require explicit review
2. **Overages are documented** — Audit trail shows why hours exceeded grant
3. **Professionals not penalized** — Can claim hours beyond grant (system tracks, doesn't reject automatically)
4. **Grant is soft ceiling** — Can exceed, but must be reviewed
5. **No grant override mechanism** — Cannot manually adjust grant without audit
6. **Outside grant approval doesn't modify grant** — Grant remains unchanged, hours approved anyway
7. **Rejection of overage doesn't affect approved hours** — Only new hours rejected

---

## AUDIT EVENTS

- `HOURS_OUTSIDE_GRANT_FLAGGED` — Overage detected
- `HOURS_APPROVED_OUTSIDE_GRANT` — Overage approved
- `HOURS_REJECTED_OUTSIDE_GRANT` — Overage rejected
- `HOURS_ESCALATED` — Escalated for higher-level review
- `GRANT_AMENDED` — Grant amount corrected

---

## NOTIFICATION EVENTS

WF-007 does not emit outbound notification events in MVP.

Outside-grant overages appear in the admin dashboard approval queue. No separate outbound notification is generated for `HOURS_OUTSIDE_GRANT_FLAGGED` in MVP — admin reviews via the queue, not via email.

**Future notification (via WF-014, Phase 2):**

| Notification Type | Recipient | Trigger |
|---|---|---|
| `HOURS_OUTSIDE_GRANT_FLAGGED` | Admin (system email) | Hours auto-flagged as exceeding municipal grant — requires outside-grant review |

The workflow does not specify delivery channel. Channel assignment is owned by WF-014.

---

## OUTPUTS

- RegisteredHours status updated (APPROVED or REJECTED)
- Audit trail with reason
- Grant usage calculation reflects actual hours
- Invoice/payroll includes/excludes overage hours

---

## GRANT TRACKING AFTER OVERAGE APPROVAL

Example:
```
Grant: 24 hours/month
Approved before overage: 18 hours
Submitted (overage): 10 hours
Total: 28 hours (4 hours over)

After approval of overage:
remaining_hours = 24 - 28 = -4 hours (shows deficit)
All 28 hours billed to municipality
Municipality sees: "24 granted, 28 used, 4 over (approved)"
```

---

## OPEN QUESTIONS

1. Should there be a threshold for automatic escalation? (e.g., > 10% overage)
2. Who is "Operations Manager"? Same as Case Coordinator or different person?
3. Should municipality be notified when overage approved?
4. Can professional appeal a rejection?
5. Should there be a monthly cap on total overage?

---

**This workflow is implementation-ready. Related to WF-006 (Registered Hours).**
