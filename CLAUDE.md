# Kursskifte — Product & Legal Governance

## Authentication (non-negotiable)
- Use `getUser()` as the official Supabase authentication method everywhere.
- Keep middleware and authentication enabled. No bypasses.
- No hardcoded users or roles.
- Roles: `admin` and `professional` (displayed as "Kontaktperson").

## Terminology
- "Caseworker" / "Sagsbehandler" refers exclusively to the **municipality's external contact person** — never to internal Kursskifte staff or roles.
- External municipality contact fields (`sagsbehandler_name`, `sagsbehandler_email`, `sagsbehandler_phone`) are correct because they reference the external municipal contact.
- Do not create a municipality/sagsbehandler login.

## GDPR — Data separation
- **Public intake / token pages**: NO citizen personal data. Citizen identified by initials + age only.
- **Authenticated portal only**: Full names of citizens, contact details, case history.
- Professional names/contact info are never shared with the municipality. Municipality receives only initials or role references.
- This principle must be enforced in all UI screens, API responses, and exports.

## Legal references
- Children's support cases (ages 0–17): **barnets lov §32** (replaces serviceloven §52 since 1 January 2024).
- Adult support: **serviceloven §85** — unchanged.
- Do not use §52 in any new code, copy, or prototype. All historical §52 references must be migrated to §32 i barnets lov.
- Professionals have a personal duty to report safeguarding concerns directly to the municipality (barnets lov §133) — the platform must not intercept or delay this obligation. A safeguarding flag in the system is supplementary; it does not replace the professional's direct reporting duty.

## Document verification
- **Straffeattest**: indhentes og verificeres af Kursskifte, fornyes hvert år.
- **Børneattest**: rekvireres af Kursskifte fra Rigspolitiet med fagpersonens samtykke. Fagpersonen kan ikke selv fremskaffe sin børneattest — UI must never say "upload børneattest".
- Do not describe these as requirements the professional must obtain themselves.

## Case numbering
Format: `KS-YYMMDD-[3-digit sequence]` — e.g. `KS-260707-241`.
- KS = Kursskifte (not the municipality).
- Never use the old format `KS-YYYY-MM-DD-[INITIALS]` or municipality-prefixed formats.

## Urgency system
Three levels — always in this exact form:
- ⚪ Normal
- 🟡 Hurtig
- 🔴 Akut (24 timer)

Akut cases auto-sort to the top of all admin lists with a red background (`#FEF2F2`) and red badge.
Urgency ("Hastighed") is a separate field from "Ønsket opstart" — never merge them.

## No-match state
When no candidate is found, always say:
> **"Kursskifte arbejder aktivt på sagen"**

Never say "ingen kandidater" or "ingen match". Show as amber "Aktiv søgning" badge. Municipality is notified when a candidate is found.

## Overdragelse (handover)
Badge text: **"🟡 Overdragelse i gang — Kursskifte overtager koordineringen"**
Handover requires: named replacement professional + overlap meeting as a mandatory step (bound to CaseHandover record).

## Municipality visibility
The municipality is an active actor in every case — from intake through closure. Status reports must reach the municipality through the token-based proposal/message channel. The municipality must be listed as an actor in all handover workflows.

## Database changes
Safe migrations only. Never destroy existing data. Use `TODO(migration)` comments for fields not yet persisted.

## Build requirements
Run `npm run build` and typecheck before committing. No broken builds.

## What is NOT in scope (MVP)
- Municipality portal / login
- Analytics dashboard (do not start yet)
- Geography matching (future enhancement)
- Automatic external notification for safeguarding flags (requires legal review)
