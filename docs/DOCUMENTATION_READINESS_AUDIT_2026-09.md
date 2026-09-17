# Documentation Readiness Audit — September 2026

**Date:** September 17, 2026
**Auditor:** Documentation readiness review (Claude)
**Purpose:** Check whether `/docs` still describes reality now that the MVP has actually been built, ahead of the Phase 2 gate that `ROADMAP.md` schedules for September 30, 2026
**Scope:** All documents in `/docs`, checked against the current `src/`, `supabase/migrations/`, and `CLAUDE.md`
**Method:** Static review only — grep/read against the actual codebase and git history (~138 merged PRs since the June 27 freeze), no live Supabase access

---

## EXECUTIVE SUMMARY

`docs/ARCHITECTURE_AUDIT_V1.md` (June 27, 2026) scored the architecture 63/100 and blocked Technical Specification on two critical gaps: 12 missing workflows and no permission model. Both are now closed — implementation has clearly moved far past what that audit saw.

But the planning documents themselves are frozen. Every one of `MVP_DEFINITION.md`, `DO_NOT_BUILD.md`, `ROADMAP.md`, `FEATURE_INVENTORY.md`, `DECISION_LOG.md`, and `CHANGELOG.md` carries a last-touched date of June 27–29, 2026 — before a single feature in the current `src/` tree existed. None of them have been updated to reflect what actually shipped. That's expected for documents explicitly marked "LOCKED," but it means they can no longer be trusted as a description of the live system, only as a historical contract.

**One live compliance bug was found and fixed during this audit** (see §2) — an outdated legal-basis reference in the public-facing demo pages that directly contradicted `CLAUDE.md`'s legal-reference rule.

**Overall assessment:** The *code* is in materially better shape than the *docs* describe. Nothing found here blocks the Sept 30 Phase 2 gate, but the gate's own checklist (in `ROADMAP.md`) — remove forbidden markers, update decision log, Hassan re-approves — has not been started in the documents themselves.

---

## 1. GAPS FROM THE JUNE AUDIT THAT ARE NOW CLOSED

Confirmed directly against the repository, not assumed:

| Gap (per `ARCHITECTURE_AUDIT_V1.md`) | June 27 status | Current status |
|---|---|---|
| 12 of 13 workflows undocumented | WF-002 only | All of WF-001 through WF-013 exist in `docs/01-workflows/` |
| No `PERMISSION_MODEL.md` | Missing | `docs/PERMISSION_MODEL.md` exists (roles, RLS rules) |
| `ContactLog` schema incomplete | "INCOMPLETE" (`MVP_DEFINITION.md` §8) | `supabase/migrations/20260629000015_create_contact_logs.sql` |
| `MatchRun` schema incomplete | "INCOMPLETE" | `supabase/migrations/20260629000017_create_match_runs.sql` |
| `MatchCandidate` schema incomplete | "INCOMPLETE" | `supabase/migrations/20260629000018_create_match_candidates.sql` |
| `AuditEvents` schema incomplete | "INCOMPLETE" | `supabase/migrations/20260629000019_create_audit_events.sql` |

`ARCHITECTURE_AUDIT_V1.md` already carries a "SUPERSEDED" banner pointing at TS-001/TS-002 — that banner is accurate and doesn't need a change.

---

## 2. COMPLIANCE BUG FOUND AND FIXED

**Files:** `docs/walkthrough.html:2926`, `docs/platform.html:2764`
**Severity:** High — live, user-facing, legally incorrect

A FAQ answer under "Hvilken lovgivning regulerer brug af kontaktpersoner?" read:

> "Kontaktpersoner tildeles primært under Servicelovens §§ 52 og 76, men kan også anvendes under §§ 11, 85 og 99 afhængigt af borgerens alder og problemstilling."

This directly contradicts `CLAUDE.md`'s non-negotiable rule: *"Do not use §52 in any new code, copy, or prototype. All historical §52 references must be migrated to §32 i barnets lov."* Serviceloven §52 was replaced by barnets lov §32 for children's cases (ages 0–17) on January 1, 2024.

The bug was also **internally inconsistent with the rest of the same file** — six other places in `walkthrough.html`/`platform.html` correctly cite "§32 i barnets lov" for the exact same demo case (Kasper Larsen, 14 years old). Only this one stray FAQ paragraph had the old reference.

**Fixed in this session** to:
> "Kontaktpersoner tildeles under §32 i barnets lov til børn og unge (0-17 år) og under servicelovens §85 til voksne (18+)."

Verified `src/` (the live application) has **zero** `§52` references — the bug was confined to the static marketing/demo HTML, not the product itself.

`docs/ux-qa-report.md` (a historical record of an earlier QA pass) also references `§52` for the same 14-year-old demo citizen in its change-log prose. Left untouched — it's a record of what was true in a prior state, not live copy, and rewriting historical records isn't in scope here — but flagged in case anyone reuses that document's demo data as a template going forward.

---

## 3. FROZEN DOCS vs. ACTUAL IMPLEMENTATION — MATERIAL DRIFT

These are informational, not blocking — the code is simply ahead of documents that were explicitly locked before implementation began. Listed because `DOCUMENTATION_GOVERNANCE.md` calls for exactly this kind of quarterly compliance check, and it's now ~12 weeks since the freeze.

### 3.1 Notifications: contract says "not built," product ships it
`MVP_DEFINITION.md` §12 states: *"Does NOT send email/SMS/in-app in MVP (Phase 2)... Admin can manually notify."* In reality, `src/lib/notifications/service.ts` and `src/lib/professionals/invite-email.ts` send real email via Resend (`new Resend(process.env.RESEND_API_KEY)`) for invites, onboarding reminders, and case notifications — confirmed shipped across many merged PRs (e.g. "Notificér admin når en kontaktperson melder ferie eller pause"). This is a good thing operationally, but `MVP_DEFINITION.md` is titled *"Implementation Contract"* and says *"Everything NOT in this document MUST NOT be built"* — as written, the document is simply wrong about what shipped.

### 3.2 Terminology: "Case Coordinator" vs. reality
`DOCUMENTATION_GOVERNANCE.md` and `UBIQUITOUS_LANGUAGE.md` mandate **"Case Coordinator"** as the required business-role name for Kursskifte staff, explicitly forbidding "Administrator" or "Admin" as a business-role name. Grep of `src/` for "Case Coordinator" returns zero matches — the shipped product only ever uses **"admin"** (system role) and, per `CLAUDE.md`, displays the professional's role as **"Kontaktperson"** to end users. "Kontaktperson" itself does not appear anywhere in `UBIQUITOUS_LANGUAGE.md`'s term table. The foundational documents and the live product have simply diverged on naming; `CLAUDE.md` (governing the actual codebase today) has silently superseded the older docs on this point.

### 3.3 `PERMISSION_MODEL.md`'s five business roles don't exist as distinct personas
The document lists Recruiter, Hiring Manager, Compliance Officer, Case Coordinator, and Operations Manager as separate business roles, all mapping to one `admin` system role. That mapping is architecturally still correct, but none of these distinctions exist anywhere in the actual UI or code — there is exactly one undifferentiated `admin` persona. Not a defect, just worth knowing before anyone uses that document to plan role-specific UI.

### 3.4 `CHANGELOG.md` and `DECISION_LOG.md` stopped at the freeze
Both files' last entries are dated June 27–28, 2026. Since then, ~138 PRs shipped real architectural decisions that `DOCUMENTATION_GOVERNANCE.md` designates these documents as the source of truth for — e.g., annual driving-license renewal gating activation, admin-only permanent deletion for data cleanup, admin override-accept/resend for municipality proposals (bypassing the token flow with an audited manual path), and adopting Sentry for error monitoring. None of these decisions are recorded where the project's own governance says they should be.

### 3.5 The Phase 2 gate is 13 days out and its own checklist hasn't started
`ROADMAP.md` sets "Next Review: Phase 2 gate (end of MVP, Sept 30, 2026)" and `DO_NOT_BUILD.md` defines that gate's steps: *"Review this document, remove FORBIDDEN markers, move features to Phase 2 spec, update decision log, Hassan re-approves."* As of this audit, none of those steps have been performed in the documents — `DO_NOT_BUILD.md` still reads "Status: CONSTRAINTS LOCKED, Version 1.0" with no update.

---

## 4. `DO_NOT_BUILD.md` COMPLIANCE CHECK — PASS

Checked each forbidden-feature category against the actual routes and code:

| Forbidden feature | Check | Result |
|---|---|---|
| Municipality portal / sagsbehandler login | Searched `src/app` for municipality routes | Only `src/app/municipality/proposals/[token]/` exists — token-authenticated, no login, exactly the exception `CLAUDE.md` explicitly sanctions ("municipality visibility... through the token-based proposal/message channel") |
| Citizen portal | Searched for citizen-facing directories/routes | None found |
| In-app messaging | Searched for `messages`/`chat`/`inbox` routes | None found (notifications inbox for admin/professional is not citizen/municipality messaging) |
| Billing/ERP/invoicing | Searched for billing/invoice directories | None found; hours export is CSV-only, matching the documented "export for external billing" escape hatch |
| Automatic professional assignment | Searched for `auto_assign`/`autoAssign` | None found — all assignment code paths require an explicit admin action |

No violations. This part of governance has held throughout implementation.

---

## 5. RECOMMENDATIONS

Ordered by effort vs. value; none of these block anything currently in flight.

1. **Low effort, do first:** Add one `CHANGELOG.md`/`DECISION_LOG.md` entry summarizing "implementation phase, June–Sept 2026" at a high level (not 138 individual entries) so the record isn't silently missing three months, per `DOCUMENTATION_GOVERNANCE.md`'s own quarterly-review expectation.
2. **Low effort:** Add a short note to `MVP_DEFINITION.md` §12 and `UBIQUITOUS_LANGUAGE.md` acknowledging that notifications/email did ship and that "Kontaktperson" is the live term for the professional's displayed role — without reopening the locked contract itself. A dated addendum, not a rewrite, keeps the document's history intact per governance rule 5 (conflict resolution favors updating the stale side once the correct term is confirmed).
3. **When convenient, not urgent:** Run the actual Phase 2 gate that `ROADMAP.md`/`DO_NOT_BUILD.md` already describe — this is a Hassan-approval step per the documents' own sign-off rules, not something to do unilaterally.
4. **No action needed:** `ARCHITECTURE_AUDIT_V1.md`'s SUPERSEDED banner, the 13 workflow docs, and `PERMISSION_MODEL.md` are all in good shape and don't need touching.

No changes were made to any locked contract document (`MVP_DEFINITION.md`, `DO_NOT_BUILD.md`, `ROADMAP.md`, `DECISION_LOG.md`, `CHANGELOG.md`, `FEATURE_INVENTORY.md`) — per `DOCUMENTATION_GOVERNANCE.md`, changes to these require Hassan's explicit approval. Only the demo-page legal-reference bug (§2), which is live user-facing copy rather than a locked planning contract, was corrected directly.

---

**Audit completed by:** Claude (documentation readiness review)
**Date:** September 17, 2026
**Recommendation:** No blockers found for the Sept 30 Phase 2 gate. Proceed with the gate's own checklist when Hassan is ready to run it.
