# Kursskifte UX QA Report
Generated: 2026-07-07

Scope: `docs/demo.html` (4-journey interactive demo) and `docs/platform.html` (28-screen platform demo). Prototype-only work — no `/src/` files touched.

---

## Fixes Applied

### Fix 1 — Municipality access flow (no public self-signup)
- **demo.html**: Kommune journey continues to start at a login screen (already-approved user). Login screen now states explicitly: *"Ny kommune? Kontakt Kursskifte for at komme i gang"* — access is created by Kursskifte's team, and the municipality receives an invitation email with a setup link to choose their own password.
- **demo.html (Admin)**: New "Kræver handling" row *"Ny kommune afventer adgang — Hjørring Kommune"* with a **"Godkend kommune-adgang"** action. Approving it triggers the toast *"invitationsmail med opsætningslink er sendt"*.
- **platform.html**: Login screen (`/login`) carries the same "Kontakt Kursskifte for at komme i gang" note; screen description now documents the invite-based flow. In `/admin/inquiries` the municipality inquiry action was changed from "Markér gennemset" to **"Godkend kommune-adgang"** with the sub-note *"Sender invitationsmail med opsætningslink"*. `/admin/notifications` now logs a `MUNICIPALITY_INVITE` email ("Kommune-adgang godkendt — opsætningslink til kommuneportalen").
- No "Tilmeld din kommune" / self-registration UI existed in either file; none was added.

### Fix 2 — Full citizen names everywhere
All initials-only citizen identifiers replaced with full names; initials remain **only** as avatar badge labels:
- KL → **Kasper Larsen** (14 år, §52, Aalborg — the consistent demo citizen)
- RM → **Rasmus Madsen** (22 år, §85, Hjørring — age inconsistency 32 vs 22 fixed)
- TH → **Thomas Hedegaard** (15 år, §52, Aalborg)
- BN → **Birgit Nielsen** (52 år, Brønderslev)
- PL → **Peter Lund** (42 år, Frederikshavn)
- HN → **Hanne Nielsen** (54 år, afsluttet forløb)
- **Emma Jensen** added where extra citizens were needed (former "Borger LN/MT/AB/JS/OD/PW" rows).
- Intake forms now collect *"Borgers fulde navn"* (previously "initialer — aldrig fulde navne"), with a confidentiality hint. Admin case table shows full name in the primary column with the case number beneath; avatars keep the two-letter badge.

### Fix 3 — Case numbers `KS-YYYY-MM-DD-[INITIALS]`
- KS-2026-07-07-KL (Kasper Larsen), KS-2026-07-05-RM (Rasmus Madsen), KS-2026-06-28-TH (Thomas Hedegaard), KS-2026-06-25-BN, KS-2026-06-21-PL, KS-2026-06-15-HN / KS-2026-03-18-HN, KS-2026-06-30-EJ m.fl.
- demo.html generates the number dynamically on submission from the entered full name (`KS-2026-07-07-` + initials).
- The case number now appears in: intake confirmation ("Sag modtaget" — Sagsnr. pill), admin case detail header, matching run header/URL, proposal page, kommunesammenfatning, all message threads (subject line reference), notification log, insights follow-up table, and the document filename `Sessionslog_KS-2026-07-07-KL.pdf`.
- Old formats (`KS-2026-0147`, `KL-2025-0041`, `run-2025-0041`) fully removed. All 2025 dates bumped to 2026 for consistency with the case-number year.

### Fix 4 + 5 — One shared profession list
`KURSSKIFTE_OPTIONS.professions` (7 categories, 30 values + "Anden relevant fagperson" with free text) is now defined **once per file** and rendered in: municipality intake (both files), professional application (demo), and professional profile (platform). Rendered as a scrollable grouped checkbox list (max-height 280px). "Socialpædagog" pre-selected in the intake example. The old divergent lists (4 chips in demo vs. 40+ ad-hoc checkboxes in platform, incl. values like "Socialrådgiver", "Ergoterapeut", "Studerende") were removed.

### Fix 6 — Shared competence areas
`KURSSKIFTE_OPTIONS.competenceAreas` (8 categories, 60 values + "Andet" free text) used in: professional profile, municipality intake ("Kompetencebehov"), and the admin match view (competence tags now use identical vocabulary). Kasper Larsen's intake pre-checks **Skolevægring, Angst, Social usikkerhed**; the proposal/candidate tags were aligned to the same values.

### Fix 7 — Shared target groups
`KURSSKIFTE_OPTIONS.targetGroups` (14 values + "Andet" free text) added to municipality intake ("Målgruppe") and professional profile ("Målgrupper") in both files. Kasper: "Unge 13-17 år".

### Fix 8 — Availability without the 10 t/uge cap
`KURSSKIFTE_OPTIONS.availability` = `hoursPerWeek` (1-3 … 20+ timer/uge, Fleksibel efter opgave) + `practical` (Akut opstart mulig, Aften, Weekend, Helligdage, Kan tage længerevarende forløb, Midlertidigt ikke tilgængelig) + **"Ledig fra dato"** date picker. Replaces the old fixed selects ("5 t/uge · ledig nu", "Kapacitet 12 t/uge"). No upper cap remains.

### Fix 9 — Consistency audit
- The same option lists render everywhere the domain appears (7 shared-list instances in platform.html, 5 in demo.html) via a single `KURSSKIFTE_OPTIONS` constant + renderer per file.
- No screen uses the old narrow lists (verified by grep: no stale profession/competence chips remain).
- Kasper Larsen / KS-2026-07-07-KL verified present in: intake, intake confirmation, kommune overview, proposal, faglig begrundelse, acceptance screen, fagperson match & sagsforløb, admin case table, matching run, kommunesammenfatning, all three message centres, and the notification log.
- Both files smoke-tested in a headless browser: zero JS errors; all option lists render; pre-checks correct.

---

## Shared Option Lists

`KURSSKIFTE_OPTIONS` (defined once at the top of each file's script; rendered via `optChecklist()` in demo.html and `ksRenderOptionLists()` + `[data-ks-options]` placeholders in platform.html):

```
KURSSKIFTE_OPTIONS = {
  professions: {
    "Kontaktperson og støtte":  Kontaktperson, Støttekontaktperson, Bostøtte, Mentor, Støtteperson
    "Social- og pædagogiske":   Socialpædagog, Pædagog, Pædagogmedhjælper, Familiebehandler,
                                Familiekonsulent, Ungekonsulent, SSP-medarbejder,
                                Gadeplansmedarbejder, Opsøgende medarbejder
    "Misbrug og kriminalitet":  Misbrugsbehandler, Rusmiddelkonsulent, Konfliktmægler
    "Skole og uddannelse":      Lærer, Speciallærer, AKT-medarbejder, Skolepædagog, UU-vejleder
    "Beskæftigelse":            Jobkonsulent, Beskæftigelsesmentor
    "Sundhed og psykologi":     Psykiatrisk medarbejder, Social- og sundhedsassistent,
                                Sygeplejerske, Psykolog, Psykoterapeut, Tolk
    "Andet":                    Anden relevant fagperson + fritekst
  },
  competenceAreas: {
    "Psykisk helbred":            Angst, Depression, ADHD, ADD, Autisme, PTSD, OCD,
                                  Spiseforstyrrelse, Selvskade, Selvmordstanker,
                                  Psykisk sårbarhed, Personlighedsforstyrrelse,
                                  Bipolar lidelse, Psykoseproblematikker
    "Socialt og hverdagsliv":     Isolation, Ensomhed, Manglende struktur, Personlig hygiejne,
                                  Rengøring, Indkøb, Madlavning, Økonomi, Aftaler, Transport,
                                  Døgnrytme, Netværk
    "Børn og unge":               Skolevægring, Skolefravær, Familiekonflikter,
                                  Udadreagerende adfærd, Lavt selvværd, Social usikkerhed,
                                  Overgange skole/uddannelse, Forældresamarbejde
    "Kriminalitet og risiko":     Kriminalitetstruet ung, SSP, Exit, Banderelationer,
                                  Konflikthåndtering, Vrede/aggression, Dom eller vilkår
    "Misbrug og afhængighed":     Hash, Alkohol, Kokain, Medicinmisbrug, Gambling,
                                  Digital afhængighed
    "Bolig og praktisk liv":      Hjemløshed, Ustabil bolig, Flytning, Nabokonflikter,
                                  Praktisk støtte
    "Beskæftigelse og uddannelse": Praktik, Job, Uddannelse, Fastholdelse, Motivation,
                                  Struktur omkring hverdagen
    "Andet":                      Andet + fritekst
  },
  targetGroups: [ Spædbørn 0-2 år, Børn 3-12 år, Unge 13-17 år, Unge voksne 18-25 år,
                  Voksne 26-64 år, Seniorer 65+, Familier, Forældre,
                  Kriminalitetstruede unge, Borgere med psykisk sårbarhed,
                  Borgere med misbrug, Borgere med handicap,
                  Borgere i social isolation, Andet + fritekst ],
  availability: {
    hoursPerWeek: [ 1-3, 4-6, 7-10, 11-15, 16-20, 20+ timer/uge, Fleksibel efter opgave ],
    practical:    [ Akut opstart mulig, Aften, Weekend, Helligdage,
                    Kan tage længerevarende forløb, Midlertidigt ikke tilgængelig ]
                  + "Ledig fra dato" (date picker)
  }
}
```

Rendering: scrollable grouped checkbox list, category headers, max visible height ~280 px with scroll, free-text input on "Andet"-items.

---

## Socialrådgiver QA Findings

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 1 | Borger har brug for kvindelig kontaktperson | ✓ Covered | Intake har "Ønske til kontaktpersonens køn" (Intet ønske / Kvinde / Mand), tydeligt markeret *valgfrit — hvis fagligt begrundet*, med tilhørende begrundelsesfelt. Ønsket kan prioriteres som Skal/Ønskeligt (platform). |
| 2 | Borger afviser eksplicit mandlige fagpersoner | ⚠ Partial | Kan udtrykkes ved at vælge "Kvinde foretrækkes" og flytte det til **"Skal opfyldes"** i prioriteringen (platform). Men semantikken "præference" vs. "absolut eksklusion" er ikke eksplicit — der findes ingen "må ikke være mand"-formulering, og demo.html har ingen Skal/Ønskeligt-prioritering. |
| 3 | Akut sag (24–48 timer) | ⚠ Partial | "Akut (24–48 timer)" findes nu i begge intakes, fagpersoner kan markere "Akut opstart mulig", og beskedkategorien "Akut besked" har 2-timers SLA. **Gap:** admin-sagsoversigten og matching-køen fremhæver ikke akutte sager (kun kompleksitets-badges) — ingen AKUT-markering eller sortering. |
| 4 | Flere diagnoser (autisme + angst + selvskade) | ✓ Covered | Autisme, Angst og Selvskade ligger alle under "Psykisk helbred"; listen er multi-select og scrollbar, så mange valg ødelægger ikke layoutet. |
| 5 | Skolevægring + familiekonflikt | ✓ Covered | Begge findes under "Børn og unge" (Skolevægring, Familiekonflikter) og kan vælges samtidig. Kaspers case bruger netop Skolevægring. |
| 6 | Misbrug + kriminalitet + psykisk sårbarhed | ✓ Covered | Tre separate kategorier i samme liste (Misbrug og afhængighed / Kriminalitet og risiko / Psykisk helbred → Psykisk sårbarhed) — alle kan kombineres i én intake. |
| 7 | Månedlig dokumentation | ✓ Covered | Platform-intake: "Ønsket opfølgningshyppighed" (Ugentlig / Hver 14. dag / **Månedlig** / Efter behov) + dokumenttype-checkliste (Kort status, Progressionsrapport m.fl.). demo.html: "Dokumentation fra kontaktpersonen"-select med Månedlig status. |
| 8 | Første forslag afvises | ✓ Covered | Proposal-siden har **"Anmod om anden kandidat"** (platform) hhv. **"Afvis forslag og bed om ny kandidat"** (demo, med bekræftelses-toast). |
| 9 | Kommunen ønsker en anden kandidat | ✓ Covered | Samme flow som #8 — synligt på selve forslagssiden, ikke gemt i beskeder. |
| 10 | Intet match tilgængeligt | ⚠ Partial | demo.html viser "⏳ Afventer match" på sagen, men der findes **ingen dedikeret "intet match"-tilstand**: ingen forventet svartid, ingen forklaring på hvad Kursskifte gør (udvider søgning, rekrutterer), ingen eskalationsmulighed. Kommunen efterlades i et generisk ventestadie. |
| 11 | Tolk / sprogmatch | ✓ Covered | Intake har "Borgeren taler (primære sprog)" med 8 sprog + fritekst (platform) / "Sprogkrav" inkl. "Andet sprog / tolk nødvendig" (demo). "Tolk" findes i professionslisten, "Sprog" er kriterium 05 i Match-standarden, og forslaget viser kandidatens sprog. |
| 12 | Aften-/weekendstøtte | ✓ Covered | Intake: "Kan arbejde aften/weekend" (platform-praktiske krav) / "Særlige tidspunkter"-chips (demo). Fagpersonens tilgængelighed har Aften, Weekend, Helligdage. Kriterierne kan prioriteres Skal/Ønskeligt. |
| 13 | Kontaktperson bliver utilgængelig midt i forløbet | ⚠ Partial | Fagpersonen kan markere "Midlertidigt ikke tilgængelig", og admin-sagsoversigtens beskrivelse nævner en "overdragelseslog" — men der findes **intet synligt overdragelses-/genmatch-flow** (ingen skærm, ingen handling "overdrag sag", ingen kommunikation til kommunen om skiftet). |
| 14 | Status inden accept af forslag | ✓ Covered | Forslagssiden har "Stil spørgsmål til Kursskifte", "Planlæg dialog med Kursskifte" og et frivilligt bemærkningsfelt; den tokenbaserede beskedside (`/proposal/[token]/messages`) er knyttet til sagen med sagsnr. som emne-reference. |

**Socialrådgiver-total: 10 ✓ · 4 ⚠ · 0 ✗**

---

## HR / Koordinator QA Findings

| # | Punkt | Status | Notes |
|---|-------|--------|-------|
| 1 | Kan Kursskifte vurdere en ansøger ud fra profilen? | ⚠ Partial | Fagperson-detaljen viser stamdata, professioner, kompetencer, metoder, målgrupper, kapacitet, geografi og dokumentstatus. **Gap:** intet felt til interviewnoter, referencetjek-resultat eller CV-preview — selvom kvalitetsmodellen (skærm 25) lover interview og minimum to referencer, kan resultatet ikke registreres eller ses i admin-UI'et. |
| 2 | Er profession/kompetence/målgruppe detaljerede nok til screening? | ✓ Covered | Efter fixes: 30 professioner i 7 kategorier, 60 kompetenceområder i 8 kategorier, 14 målgrupper — identiske lister i intake og profil, så screening og matching taler samme sprog. |
| 3 | Sammenligning af flere ansøgere side om side | ⚠ Partial | Match-detaljen sammenligner rangerede **kandidater** (score, begrundelse, badges) side om side pr. sag. Men **ansøger-screening** (henvendelser) er én ad gangen — ingen sammenligningsvisning af nye ansøgere. |
| 4 | Godkend / afvis / anmod-om-mere med klare statusovergange | ⚠ Partial | Godkend/Afvis findes pr. dokument, "Godkend ansøger" i demo, statusbadges (Registreret → Aktiv → Inaktiv) og "Skift status". **Gap:** ingen "Anmod om flere oplysninger"-handling og ingen eksplicit afvisning af en ansøgning med begrundelse. |
| 5 | Manglende/udløbne dokumenter synlige | ✓ Covered | Statusser (Godkendt / Afventer / ⚠ Udløber snart / ✗ Mangler), udløbsdatoer pr. dokument, "Dokument mangler"-stat på admin-dashboardet, "Dokumenter udløber snart" i Insights og "Automatisk reminder 60 dage før udløb". |
| 6 | Timepris og tillæg pr. fagperson | ⚠ Partial | Forslaget viser "Fra 295 kr/t · Aftales med Kursskifte", og fagpersonsiden viser rammen 250–450 kr/t. **Gap:** admin har ingen felter til at administrere sats, tillæg (aften/weekend/kompleksitet) eller historik pr. fagperson. |
| 7 | Kapacitetsoverblik | ✓ Covered | Insights' belægningsgrid (grøn/amber/rød pr. fagperson), kapacitet i fagpersonoversigten, "Aktuel belastning 2/4 aktive sager" på forslaget, og de nye tilgængelighedsfelter (timetal, praktisk tilgængelighed, ledig fra dato). |
| 8 | Kan admin forhindre et svagt match i at blive sendt? | ✓ Covered | Intet forslag sendes automatisk: admin vælger aktivt kandidat i match-detaljen og trykker "Send forslag til kommune"; metoden garanterer "intet forslag uden menneskelig faglig godkendelse". Lavere-scorende kandidater kan fravælges. |
| 9 | Kan én fagperson se en anden fagpersons data? | ✓ Covered (i prototypen) | Strukturelt adskilt: fagperson-navigationen indeholder kun egne sager/logs/profil; beskeder kan kun føres med Kursskiftes team ("kan ikke sendes til … andre kontaktpersoner"); kontaktpersoner omtales kun med initialer over for kommunen. Skal håndhæves med RLS i implementeringen. |
| 10 | Kvalitet over tid (årlig fornyelse, re-screening) | ✓ Covered | Kvalitetsmodellens trin 9–10: intern evaluering, årlig kvalitetssikring, alle attester fornyes hvert år, automatisk reminder 60 dage før udløb, "Seneste QA: jan 2026" i kvalitetsstatus. Mindre gap: ingen samlet admin-arbejdsliste "kommende fornyelser" (kun stats + dokumentrækker). |

**HR/Koordinator-total: 6 ✓ · 4 ⚠ · 0 ✗**

---

## Inconsistencies Found and Fixed

1. **§-paragraf byttet om** i fagpersonens "Mine sager" (platform): Kasper Larsen stod som §85 og Rasmus Madsen som §52 — modsat alle andre skærme. Rettet til KL=§52, RM=§85.
2. **Rasmus Madsens alder**: 22 år på dashboardet, 32 år i "Mine sager" og admin-sagsoversigten. Ensrettet til 22 år.
3. **Kønsønske vs. foreslået kandidat**: intake havde "Mand foretrækkes" (med begrundelse om mandlige fagpersoner), mens forslaget præsenterede en kvindelig kandidat. Rettet til "Kvinde foretrækkes" med matchende begrundelse og prioriterings-tag.
4. **Fire forskellige sagsnummerformater** (`KS-2026-0147`, `KL-2025-0041`, `HJ-2025-0033`, `run-2025-0041`) → ét format `KS-YYYY-MM-DD-INITIALER` overalt.
5. **Hjørring-besked** bad om udvidelse "fra 5 til 7 timer/uge" på en sag med 3 t/uge → rettet til "fra 3 til 5".
6. **To forskellige samtaler om samme sag havde forskellige sagsnumre** (fagpersonens RM-tråd og Hjørrings HJ-tråd) → begge refererer nu KS-2026-07-05-RM.
7. **Divergerende kompetence-vokabular** ("Angstproblematik", "Social isolation", "Unge 13–18", "§52-støtte" som tags vs. andre lister) → ensrettet til de delte listeværdier (Angst, Isolation, Skolevægring, Unge 13-17 år …).
8. **Professionslisterne** var vidt forskellige mellem kommune-intake (40+ ad-hoc), fagperson-profil (kun ét select) og demo (4 chips) → én delt liste.
9. **Årstal**: platform.html brugte 2025 overalt, demo.html 2026 → alt ensrettet til 2026, og KL-sagens nøgledatoer (forslag sendt 8. jul, opstart 13. jul, sessioner 14.–28. jul 2026) bragt i rækkefølge efter sagsåbning 7. jul 2026.
10. **"Borger HN/MT/AB/JS/OD/PW/LN/MJ"-pladsholdere** uden navne → navngivne borgere fra den fælles persongalleri-liste.

---

## Remaining Open Decisions

1. **GDPR / fulde navne på offentligt intake**: Prototypen indsamler nu borgerens fulde navn sammen med følsomme helbreds-/misbrugs-/kriminalitetsoplysninger på en offentlig (token-løs, kun rate-begrænset) formular. Tidligere design var bevidst "initialer — aldrig fulde navne". Kræver DPO-/produktbeslutning: enten autentificeret intake bag kommune-login, eller navnefelt der først udfyldes efter accept.
2. **Hård eksklusion vs. præference** for køn (og andre Skal-kriterier): skal "Skal opfyldes" betyde absolut filter i matchingen, og skal der være en eksplicit "borger afviser [køn]"-formulering?
3. **Intet-match-tilstand**: hvad ser kommunen, når ingen egnet kandidat findes? Behov for holding-skærm med forventet svartid, Kursskiftes næste skridt og eskalationsknap.
4. **Overdragelsesflow**: skærm og statusovergange for kontaktperson-frafald midt i forløb (genmatch, varsling af kommune, overlapsperiode, overdragelseslog-UI).
5. **Akut-markering i admin**: AKUT-badge + prioriteret sortering i sagsoversigt og matching-kø, evt. SLA-nedtælling.
6. **Ansøgningsworkflow**: "Anmod om flere oplysninger"-status, afvisning med begrundelse, felter til interviewnoter og referencetjek-resultat, samt side-om-side-sammenligning af ansøgere.
7. **Honorar-administration**: admin-UI til sats, tillæg og historik pr. fagperson (pt. kun vist som interval udadtil).
8. **Tidslinje-realisme i demodata**: sessionslog-/beskeddatoer for RM- og HN-sagerne ligger delvis før de datoer, deres sagsnumre angiver som åbningsdato. Kosmetisk i en prototype, men bør genereres fra én fælles fixture, når rigtige data indføres.
9. **Sagsnummerformatets skalerbarhed**: `KS-YYYY-MM-DD-INITIALER` kolliderer, hvis to borgere med samme initialer får sag samme dag — afklar suffiks-regel (fx `-2`).
10. **Kommunebrugerstyring**: flere sagsbehandlere pr. kommune, roller og adgang til hinandens sager er ikke vist (kun én bruger pr. kommune i prototypen).
