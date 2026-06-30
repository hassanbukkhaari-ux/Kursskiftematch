# Kursskiftematch — TODO

Levende statusdokument. Opdateres løbende efterhånden som features bygges. Ingen idé fra workshops må gå tabt — uafklarede idéer parkeres i **💡 Produktidéer** eller **Version 2.0 Backlog** i stedet for at blive droppet.

---

## ✅ Færdigt

**Auth & roller**
- Supabase Auth med `getUser()` overalt (ingen `getSession()`), ingen bypass, ingen hardkodede brugere/roller
- To roller: `admin` og `professional` (vist som "Kontaktperson" i UI)
- Middleware kræver login på alle ikke-offentlige ruter; admin-layout og dashboard-layout tjekker rolle server-side
- Login, forgot-password, reset-password flows

**Admin**
- `/admin` oversigt
- `/admin/municipalities` — liste over kommuner
- `/admin/professionals` — liste, filtrering, drawer med detaljer, dokumentstatus, **og nu: kontaktpersonprofil (køn, uddannelse, certifikater, daglig beskæftigelse, erfaring med drenge/piger, geografi) — visning og redigering**
- `/admin/inquiries` — henvendelser fra kommuner
- `/admin/cases` — sagsliste med filtrering, opret ny sag (nu med køn, problemområder, mål, ønsker til kontaktperson)
- `/admin/cases/[id]` — sagsdetalje (nu med køn, noter, problemområder/mål/ønsker som tags)
- `/admin/matching`, `/admin/matching/new`, `/admin/matching/[runId]` — matching-kørsler og kandidatvisning

**Professionel (dashboard)**
- `/dashboard` — overblik
- `/dashboard/cases` og `/dashboard/cases/[id]` — egne sager (nu med køn, noter, problemområder/mål/ønsker som tags)
- `/dashboard/session-logs` — sessionslog liste + oprettelse
- `/dashboard/hours` — timeregistrering

**Datamodel — Fase 1 (kommunal intake + kontaktpersonprofil)**
- `cases.citizen_gender` (MALE/FEMALE/OTHER, nullable)
- `professionals`: `gender`, `education`, `certificates[]`, `daily_occupation`, `experience_with_genders[]` (BOYS/GIRLS), `geography[]`
- Skalerbare opslagstabeller: `problem_areas`, `goals_lookup`, `special_wishes_lookup` (kode + dansk label + sort_order + active — nye valgmuligheder kan tilføjes uden migration)
- Kobletabeller: `case_problem_areas`, `case_goals`, `case_special_wishes`
- View `v_case_tags` til hurtig aggregering af tags pr. sag
- RLS på alle nye tabeller (læsning for alle autentificerede, skrivning kun admin/egen profil)
- Migration er additiv — ingen eksisterende data berørt

---

## 🚧 I gang

*(intet aktivt i gang lige nu — Fase 1 er afsluttet og afventer commit/rapport)*

---

## 📅 Næste fase

**Prioritet 1 — Fuldfør eksisterende flows**
- Sessionslog: Kladde → Endelig (finalisering, låsning af felter)
- Matching: automatisk statusopdatering på sag ved matching (OPEN → MATCHED → ACTIVE)
- Admin: godkend/afvis timeregistreringer (`registered_hours`)
- Root-redirect (`/`) til korrekt destination afhængig af rolle/login-status
- Sag-fra-henvendelse: fuld konvertering fra `inbound_inquiries` til `cases` end-to-end

**Prioritet 2 — MVP 100%**
- Gennemgå alle sider for halvfærdige tilstande (tomme states, fejlhåndtering, loading states)
- Dokumentupload/verificering for fagpersoner (`professional_documents`) — UI mangler

**Prioritet 4 — Intelligent matching-algoritme**
- Forbrug `v_case_tags` + professionals' nye felter (køn, erfaring, geografi, certifikater) som matching-kriterier
- Scoring-model for kandidat-til-sag (kompleksitet, kapacitet, geografi, præferencer)

**Prioritet 6 — Analytics & automatisering**
- Dashboards for kommunal belastning, kapacitetsudnyttelse, gennemsnitlig sagstid
- Automatiske notifikationer (afventer `notification-log` integration)

---

## 💡 Produktidéer

*(Idéer fra workshops der endnu ikke er planlagt til en bestemt fase — intet slettes herfra, kun flyttes til "Næste fase" når det prioriteres)*

- Selvbetjent profilside for fagpersoner (i dag redigeres ny profildata kun via admin-drawer)
- Eksport af sagsdata til CSV/PDF for kommuner
- Påmindelser ved udløb af certifikater/dokumenter
- Historik/log over ændringer på en sag (audit trail i UI, ikke kun i databasen)

---

## Version 2.0 Backlog

**Prioritet 3 — Udvidet datamodel** *(Fase 1 dækker grundstenene; dette er videre udbygning)*
- Flere kommunale intake-felter efter behov fra rigtige sagsbehandlere
- Versionering af kontaktpersonprofiler (historik over ændringer i kompetencer/kapacitet)

**Prioritet 5 — Kommunalt portal**
- Selvbetjeningsportal til kommuner (uden login-rolle indtil videre — kun planlægning)
- Mulighed for kommuner at indsende henvendelser direkte uden mellemled
- Status-tracking for kommuner på egne sager (read-only adgang, ny rolle påkrævet — afventer beslutning)

**Øvrigt**
- Multi-tenant/hvidmærkning hvis Kursskiftematch skal bruges af flere organisationer
- Avanceret rapportering/BI-integration
