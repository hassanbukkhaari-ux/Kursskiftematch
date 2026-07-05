-- CMS Article seeds part 1

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- VEJLEDNING 1
(
  'hvad-er-et-kontaktpersonforlob',
  'Hvad er et kontaktpersonforløb? En guide til kommuner og socialrådgivere',
  'Et kontaktpersonforløb er en relationsbaseret social indsats, hvor en uddannet fagperson tilknyttes en borger i mistrivsel. Denne guide forklarer, hvem det er til, hvad det kræver, og hvordan kommunen iværksætter det.',
  E'Et kontaktpersonforløb er en social indsats, hvor en uddannet fagperson tilknyttes en borger i mistrivsel med henblik på at skabe en stabil, støttende relation over tid. Forløbet er ikke behandling — det er relationsbaseret støtte, der hjælper borgeren med at navigere hverdagen, opbygge sociale kompetencer og styrke tilknytningen til uddannelse, arbejde og netværk.\n\n## Hvem er et kontaktpersonforløb til?\n\nKontaktpersonforløb anvendes til borgere i udsatte positioner — typisk unge og voksne, der befinder sig i en kritisk fase af deres liv. Det kan være unge med social isolation, borgere med psykiske vanskeligheder, voksne med misbrug eller borgere med behov for bostøtte og strukturering af hverdagen.\n\nIndsatsen er reguleret primært under Servicelovens **§52** (for børn og unge under 18 år) og **§85** (for voksne med nedsat psykisk eller fysisk funktionsevne). Begge paragraffer giver kommunen mulighed for at iværksætte kontaktpersonforløb som en del af en helhedsorienteret socialfaglig indsats.\n\n## Hvad er kontaktpersonens rolle?\n\nKontaktpersonen fungerer som en fast, troværdig voksen i borgerens liv. Rollens kerneopgave er at:\n\n- Etablere en stabil relation baseret på tillid og konsistens\n- Støtte borgeren i daglige aktiviteter og strukturering af hverdagen\n- Fungere som bro til offentlige institutioner, uddannelse og arbejdsmarked\n- Dokumentere og rapportere til kommunen om forløbets udvikling\n\nKontaktpersonen er ikke en behandler, men en faglig støtteperson med socialfaglig baggrund — typisk socialrådgiver, pædagog eller lignende.\n\n## Hvad adskiller et kontaktpersonforløb fra andre indsatser?\n\nKontaktpersonforløb er kendetegnet ved den **langvarige, personlige relation** som det primære virkemiddel. I modsætning til kortere vejledningsforløb eller gruppebaserede indsatser er kontaktpersonforløb kendetegnet ved kontinuitet og individuel tilpasning.\n\nForskning peger på, at den stabile relation i sig selv er den mest virkningsfulde faktor i arbejdet med socialt udsatte borgere — uanset hvilke specifikke metoder der benyttes.\n\n## Sådan starter I et kontaktpersonforløb\n\nProcessen starter med, at kommunen vurderer borgerens behov og iværksætter en socialfaglig udredning. Herefter kan kommunen søge en ekstern kontaktperson via Kursskifte, som matcher borgeren med en kvalitetssikret fagperson på baggrund af kompetencer, erfaring og tilgængelighed.\n\nKursskifte varetager dokumentation, takst og koordination — kommunen modtager et fagligt begrundet forslag og godkender opstarten.',
  'vejledning',
  ARRAY['kontaktpersonforløb', '§52', '§85', 'socialfaglig indsats', 'guide'],
  TRUE,
  NOW(),
  5,
  'Hvad er et kontaktpersonforløb? Guide til kommuner — Kursskifte',
  'Gennemgang af kontaktpersonforløbet: hvad det er, hvem det er til, og hvordan kommunen iværksætter §52- og §85-forløb. Faglig guide fra Kursskifte.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- VEJLEDNING 2
(
  'forskel-paa-paragraf-52-og-85',
  'Forskellen på §52 og §85 — hvornår bruges hvad?',
  'Servicelovens §52 og §85 er de to primære hjemler for kontaktpersonforløb. Selvom begge paragraffer handler om støtte via kontaktperson, er der afgørende forskelle i målgruppe, formål og betingelser.',
  E'Servicelovens §52 og §85 er de to primære hjemler for kontaktpersonforløb i Danmark. Selvom de begge giver kommunen mulighed for at iværksætte støtte via en kontaktperson, er der afgørende forskelle i målgruppe, formål og betingelser.\n\n## Servicelovens §52 — indsatser for børn og unge\n\n§52 giver kommunen mulighed for at iværksætte en række støttende foranstaltninger for børn og unge under 18 år, når det vurderes nødvendigt af hensyn til barnets behov og udvikling.\n\nKontaktperson er én af de foranstaltninger, der kan bevilges under §52, stk. 3, nr. 6: **"udpegning af en fast kontaktperson for barnet eller den unge"**. Indsatsen iværksættes typisk i sager, hvor den unge mangler stabile voksne relationer, har problemer i skolen eller befinder sig i risiko for yderligere social deroute.\n\n§52-forløb forudsætter som udgangspunkt forældrenes samtykke, medmindre kommunen træffer afgørelse om anbringelse.\n\n## Servicelovens §85 — støtte til voksne\n\n§85 giver kommunen mulighed for at bevilge **socialpædagogisk bistand og bostøtte** til voksne med nedsat psykisk eller fysisk funktionsevne. Kontaktpersonforløb under §85 bruges typisk til borgere med:\n\n- Psykiske lidelser (fx skizofreni, personlighedsforstyrrelser, angst, depression)\n- Erhvervet hjerneskade\n- Misbrug i kombination med andre sociale problemer\n- Svag social kapital og behov for strukturering af hverdagen\n\n§85-indsatsen er kendetegnet ved, at **borgeren selv ansøger** om støtten, og at indsatsen skaleres til borgerens aktuelle behov og mål.\n\n## Hvilken paragraf skal kommunen vælge?\n\nValget afhænger primært af borgerens alder:\n\n- **Under 18 år:** §52 er udgangspunktet. Vurderingen foretages af børn- og ungeafdelingen.\n- **18 år og over:** §85 er primær hjemmel. Vurderingen foretages af socialafdelingen.\n\nI overgangen fra ung til voksen (typisk 18–25 år) kan der forekomme overlap, og det er vigtigt at sikre kontinuitet i støtten — særligt for unge med komplekse sociale problemstillinger.\n\n## Hvad betyder det for matchningen?\n\nKursskifte modtager sager under begge paragraffer og sikrer, at fagpersonens kompetencer matcher det specifikke behov:\n\n- §52-forløb kræver typisk erfaring med børn og unge, familiedynamikker og skoleproblematikker\n- §85-forløb kræver typisk kendskab til psykiatri, misbrug, bostøtte og voksenlivet\n\nVores matchningsproces tager eksplicit højde for alder, paragraf og kompleksitetsniveau.',
  'vejledning',
  ARRAY['§52', '§85', 'serviceloven', 'kontaktpersonforløb', 'lovgivning'],
  TRUE,
  NOW(),
  5,
  'Forskellen på §52 og §85 — hvornår bruges hvad? — Kursskifte',
  'Oversigt over §52 og §85 i Serviceloven: målgrupper, betingelser og hvornår kommunen bruger hvilken paragraf til kontaktpersonforløb.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- VEJLEDNING 3
(
  'stoettekontaktpersonordningen',
  'Støttekontaktpersonordningen (SKP) — formål, målgruppe og lovgrundlag',
  'Støttekontaktpersonordningen (SKP) er en lavtærskel-indsats til voksne med svære psykiske lidelser. Her gennemgår vi formål, målgruppe og forskellen på SKP og §85.',
  E'Støttekontaktpersonordningen — ofte forkortet SKP — er en støtteform til voksne med psykiske lidelser, der ønsker hjælp til at skabe og fastholde tilknytning til samfundet. Ordningen er hjemlet i **Servicelovens §99** og adskiller sig fra §85-indsatsen ved sit fokus på social inklusion og frivillighed.\n\n## Hvem er SKP til?\n\nMålgruppen for støttekontaktpersonordningen er voksne med svære psykiske lidelser, der enten:\n\n- Er hjemløse eller bor i utrygge boforhold\n- Har begrænset eller ingen kontakt til det sociale system\n- Har svært ved at søge og fastholde hjælp fra det offentlige\n- Ønsker et frivilligt, ikke-tvangsbaseret tilbud om støtte\n\nSKP-indsatsen er karakteriseret ved, at borgeren mødes, hvor borgeren er — fysisk og socialt. Det er en opsøgende, lavtærskel-indsats.\n\n## Hvad er forskellen på SKP og §85?\n\nDe to indsatser overlapper, men har forskellig indgang og karakter:\n\n**SKP (§99):** Opsøgende og frivillig. Kræver ikke formel myndighedsafgørelse. Henvender sig til borgere, der ikke er klar til et formelt forløb. Fokus på social inklusion og at skabe kontakt til systemet.\n\n**§85:** Borgeren ansøger formelt om støtte. Kræver kommunal myndighedsafgørelse. Fokus på socialpædagogisk bistand til at opretholde selvstændig tilværelse.\n\n## Hvornår skal kommunen vælge SKP frem for §85?\n\nSKP er oplagt, når borgeren **ikke er klar** til at indgå i et formelt §85-forløb, men stadig har behov for støtte. Ordningen fungerer som en blød indgang til det sociale system — og kan på sigt omstilles til en §85-indsats, når borgeren er klar.\n\nSKP kan kombineres med andre indsatser og er ikke et enten/eller-valg.\n\n## Kursskifte og SKP-forløb\n\nKursskifte kan bistå kommuner med fagpersoner til SKP-forløb. Vores fagpersoner er erfarne i opsøgende arbejde og lavtærskel-indsatser, matchet på kendskab til psykiatri, hjemløshed og social marginalisering.',
  'vejledning',
  ARRAY['støttekontaktperson', 'SKP', '§99', '§85', 'psykiatri', 'hjemløshed'],
  TRUE,
  NOW(),
  4,
  'Støttekontaktpersonordningen (SKP) — formål og lovgrundlag — Kursskifte',
  'Gennemgang af støttekontaktpersonordningen (SKP): formål, målgruppe, lovhjemmel i §99 og forskellen på SKP og §85-indsatsen.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- FAGLIG VIDEN 1
(
  'hvad-goer-en-god-kontaktperson',
  'Hvad gør en god kontaktperson? De fem vigtigste kompetencer',
  'En god kontaktperson er ikke blot en fagperson med de rette papirer — det er en person med de menneskelige og faglige kompetencer, der muliggør en stabil, tillidsfuld relation til en borger i sårbar position.',
  E'En god kontaktperson er ikke blot en fagperson med de rette kvalifikationer på papiret — det er en person med de menneskelige kompetencer, der gør det muligt at opbygge og fastholde en tillidsfuld relation til en borger i sårbar position. Her er de fem vigtigste kompetencer.\n\n## 1. Evne til at skabe og fastholde relationer\n\nDen vigtigste kompetence er relationel kapacitet. En god kontaktperson kan møde borgeren, hvor borgeren er — uden at dømme, men med tydelig interesse og konstans. For mange borgere med udsatte baggrunde er erfaring med ustabile relationer en grundpræmis. Kontaktpersonen skal demonstrere pålidelighed over tid.\n\nDette kræver: tålmodighed, empati, konsistens og evne til at tolerere ambivalens og modstand.\n\n## 2. Socialfaglig baggrund og viden\n\nEn god kontaktperson forstår de mekanismer, der fastholder borgeren i udsathed. Det kræver viden om psykiatriske diagnoser, misbrug, familiedynamikker og det sociale systems lovgivning og muligheder.\n\nSocialrådgivere, pædagoger og lignende faggrupper har typisk denne baggrund, men det er den **personlige praksis og erfaring** der afgør kvaliteten.\n\n## 3. Struktureret og dokumentationsorienteret tilgang\n\nEn professionel kontaktperson arbejder ikke blot intuitivt — de dokumenterer, registrerer og evaluerer. God dokumentation beskytter borgeren, skaber overblik for kommunen og muliggør faglig opfølgning og kursændring.\n\nMangelfuld dokumentation er en af de hyppigste årsager til problemer i kontaktpersonforløb.\n\n## 4. Fleksibilitet og tilgængelighed\n\nBorgere i mistrivsel har ikke problemer inden for normal arbejdstid. En god kontaktperson kan møde borgeren fleksibelt — om morgenen, om aftenen, i borgerens hjem eller på gaden. Dette kræver reel kapacitet, ikke blot formel tilgængelighed.\n\n## 5. Faglig selvrefleksion og samarbejde\n\nEn god kontaktperson kender sine egne grænser og ved, hvornår de skal søge supervision eller samarbejde med andre fagpersoner. Burnout er en reel risiko i dette arbejde, og professionel selvomsorg er ikke et luksusvalg — det er en forudsætning for en stabil indsats over tid.\n\n## Hvad Kursskifte kigger efter\n\nKursskifte verificerer ikke blot dokumenter og certifikater — vi vurderer kompetenceprofilen i sin helhed og sikrer, at fagpersonen matcher det specifikke forløbs krav. Ingen borger eller sag er ens.',
  'faglig-viden',
  ARRAY['kontaktperson kompetencer', 'god kontaktperson', 'socialfaglig indsats', 'kvalitet'],
  TRUE,
  NOW(),
  5,
  'Hvad gør en god kontaktperson? De 5 vigtigste kompetencer — Kursskifte',
  'Gennemgang af de fem vigtigste kompetencer hos en god kontaktperson: relationsevne, faglig viden, dokumentation, fleksibilitet og selvrefleksion.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- FAGLIG VIDEN 2
(
  'relation-foer-metode',
  'Relation før metode — relationsbaseret arbejde i socialfaglig praksis',
  'Forskning peger konsekvent på, at relationen er den mest virkningsfulde faktor i socialt arbejde — ikke metoden. Her forklarer vi hvad det betyder i praksis og hvilke konsekvenser det har for matchning.',
  E'I socialt arbejde diskuterer man ofte metoder: kognitiv adfærdsterapi, motivationssamtaler, systemisk tilgang, low arousal. Metoderne er vigtige og evidensbaserede. Men forskning peger konsekvent på, at **relationen** er den mest virkningsfulde faktor — og at metoden er sekundær.\n\n## Hvad betyder "relation før metode"?\n\n"Relation før metode" er ikke et argument mod faglig viden eller evidensbaseret praksis. Det er en påmindelse om, at ingen metode virker, hvis den ikke er forankret i en tillidsfuld relation.\n\nEn borger, der ikke stoler på sin kontaktperson, vil ikke åbne sig. En ung, der oplever kontaktpersonen som endnu en skiftende voksen i et system, der svigter, vil ikke profitere af metoderne — ligegyldigt hvor evidensbaserede de er.\n\n## Forskning bakker op\n\nPsykoterapiforskning — herunder det store Common Factors-forskningsprogram — viser, at op til 40% af terapeutiske resultater kan tilskrives **alliancen** (relationen) mellem klient og behandler. Metoden alene forklarer en langt mindre del af resultatet.\n\nSelvom kontaktpersonforløb ikke er terapi, gælder det samme princip: den bærende relation er det vigtigste virkemiddel.\n\n## Relationen tager tid at bygge\n\nDen tidligste fase af et kontaktpersonforløb er ikke den periode, hvor "der sker noget". Det er den periode, hvor kontaktpersonen demonstrerer konstans:\n\n- Møder op til den aftalte tid\n- Holder hvad de lover\n- Tolererer afvisning uden at trække sig\n- Er til stede uden dagsorden\n\nFørst når borgeren har erfaret denne konstans over tid, åbner relationen sig — og først da kan metoder og mål reelt arbejdes med.\n\n## Konsekvenser for matchning\n\nFordi relationen er så afgørende, er **matchet** kritisk. En fagperson med de rette kompetencer på papiret, men som ikke matcher borgeren menneskeligt, vil ikke opnå de ønskede resultater.\n\nKursskifte tager matchet alvorligt: vi kigger ikke kun på kvalifikationer og kapacitet — vi vurderer hele kompetenceprofilen i sammenhæng med det specifikke forløbs karakter og borgerens behov.\n\n## For kommunen\n\nRelationen tager tid. Kontaktpersonforløb, der afbrydes alt for tidligt på grund af kortsigtede besparelser, ødelægger ikke blot det aktuelle forløb — de bekræfter borgerens erfaring med, at voksne ikke er til at stole på. Det gør det næste forløb sværere.\n\nInvestér i stabile forløb med klare rammer og tilstrækkelig tidshorisont.',
  'faglig-viden',
  ARRAY['relationsbaseret arbejde', 'socialfaglig metode', 'kontaktpersonforløb', 'alliance'],
  TRUE,
  NOW(),
  5,
  'Relation før metode — relationsbaseret arbejde i socialt arbejde — Kursskifte',
  'Forskning viser, at relationen er den mest virkningsfulde faktor i socialt arbejde. Her forklarer vi hvad det betyder i praksis og for valg af kontaktperson.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- FAGLIG VIDEN 3
(
  'hvornaar-virker-et-kontaktpersonforlob',
  'Hvornår virker et kontaktpersonforløb?',
  'Et kontaktpersonforløb er ikke et universelt svar på alle sociale problemer. Det virker bedst under bestemte betingelser — og det er kommunens og fagpersonens ansvar at sikre, at disse betingelser er til stede.',
  E'Et kontaktpersonforløb er ikke et universelt svar på alle sociale problemer. Det virker bedst under bestemte betingelser — og det er kommunens og fagpersonens ansvar at sikre, at disse betingelser er til stede.\n\n## Betingelse 1: Det rette match\n\nDen vigtigste enkeltfaktor for et vellykket forløb er, at kontaktpersonen og borgeren matcher hinanden. Et godt match indebærer faglig kompetence, der svarer til borgerens behov, tilstrækkelig kapacitet og en menneskelig kompatibilitet, der muliggør relation.\n\nEt dårligt match skaber ikke blot et ineffektivt forløb — det kan aktivt skade borgeren ved at bekræfte negative forventninger til hjælpesystemet.\n\n## Betingelse 2: Tilstrækkelig tid og stabilitet\n\nKontaktpersonforløb kræver tid. Den indledende fase — opbygning af tillid — tager typisk 2–4 måneder. Forløb der afbrydes i denne fase har i bedste fald ingen effekt.\n\nKommunen bør planlægge forløb med realistisk tidshorisont:\n- **Korte forløb (3–6 mdr.):** egnet til borgere med specifik, afgrænset problemstilling\n- **Mellemlange forløb (6–18 mdr.):** det mest almindelige format\n- **Længerevarende forløb (18+ mdr.):** nødvendigt ved komplekse problemstillinger\n\n## Betingelse 3: Klare mål og rammer\n\nEt kontaktpersonforløb uden klare mål risikerer at blive en uformaliseret støtteperson uden retning. Gode forløb er kendetegnet ved tydelige mål defineret i samarbejde med borgeren, regelmæssig opfølgning og klare rammer for kontaktpersonens rolle.\n\n## Betingelse 4: Borgerens motivation\n\nKontaktpersonforløb virker bedst, når borgeren ønsker hjælpen. Forløb der iværksættes uden borgerens ejerskab kræver en særlig indsats i opstartsfasen for at skabe motivation og tillid.\n\n## Betingelse 5: God dokumentation og opfølgning\n\nVelfungerende forløb er ikke overladt til sig selv. Kursskifte tilbyder løbende opfølgning, og al dokumentation håndteres i platformen — så kommunen bevarer overblikket.\n\n## Hvornår virker det ikke?\n\nKontaktpersonforløb virker typisk ikke, når borgerens problemstilling kræver behandling frem for relationsbaseret støtte, matchet er forkert, forløbet er for kortvarigt, eller kontaktpersonen mangler kapacitet og supervision.',
  'faglig-viden',
  ARRAY['kontaktpersonforløb effekt', 'hvornår virker det', 'socialfaglig indsats', 'match'],
  TRUE,
  NOW(),
  5,
  'Hvornår virker et kontaktpersonforløb? — Kursskifte',
  'Gennemgang af betingelserne for et vellykket kontaktpersonforløb: det rette match, tilstrækkelig tid, klare mål og god dokumentation.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- FAGLIG VIDEN 4
(
  'bostoette-til-voksne',
  'Bostøtte til voksne med psykiske udfordringer — en faglig introduktion',
  'Bostøtte under §85 er en socialpædagogisk indsats, der hjælper voksne med nedsat funktionsevne til at mestre hverdagen i eget hjem. Her er en introduktion til formål, målgruppe og praksis.',
  E'Bostøtte er en socialpædagogisk indsats, der hjælper borgere med nedsat funktionsevne til at mestre hverdagen i eget hjem. Indsatsen er hjemlet i **Servicelovens §85** og er en af de mest udbredte sociale indsatser i kommunerne.\n\n## Hvad er bostøtte?\n\nBostøtte er ikke praktisk hjemmehjælp — det er **pædagogisk støtte** til at lære at klare sig selv. Bostøtten hjælper borgeren med at:\n\n- Strukturere hverdagen (madlavning, rengøring, økonomi, tidsplaner)\n- Fastholde boligen og undgå hjemløshed\n- Opbygge og vedligeholde sociale netværk\n- Navigere kontakt med offentlige myndigheder og institutioner\n- Arbejde med personlige mål som uddannelse eller beskæftigelse\n\n## Hvem har ret til bostøtte?\n\n§85 er en kan-bestemmelse: kommunen *kan* bevilge bostøtte til borgere med **nedsat psykisk eller fysisk funktionsevne**, der har behov for hjælp til at opretholde en selvstændig tilværelse. Kommunen foretager en individuel vurdering.\n\nTypiske målgrupper:\n\n- Borgere med skizofreni eller andre psykotiske lidelser\n- Borgere med borderline, ADHD eller autismespektrumsforstyrrelser\n- Borgere med dobbeltdiagnose (psykisk lidelse + misbrug)\n- Borgere der udskrives fra psykiatri og har brug for stabilisering\n\n## Bostøtte som brobygger\n\nBostøtteforløb fungerer bedst som et led i en bredere indsats, der koordineres med psykiatrisk behandling, misbrugsbehandling og beskæftigelsesindsats. En god bostøtteperson er ikke en isoleret aktør — de samarbejder med borgerens øvrige støttepersoner og hjælper med at skabe sammenhæng.\n\n## Kursskiftes bostøttefagpersoner\n\nKursskifte matcher kommuner med bostøttefagpersoner, der har dokumenteret erfaring med §85-indsatser, kendskab til psykiatri og misbrug, og praktisk erfaring med opsøgende og relationsbaseret arbejde. Alle fagpersoner verificeres inden aktivering.',
  'faglig-viden',
  ARRAY['bostøtte', '§85', 'socialpædagogisk støtte', 'psykiatri', 'voksne'],
  TRUE,
  NOW(),
  5,
  'Bostøtte til voksne med psykiske udfordringer — §85 — Kursskifte',
  'Introduktion til bostøtte under Servicelovens §85: formål, målgrupper, hvem der har ret til det og Kursskiftes tilgang til bostøttefagpersoner.'
)
ON CONFLICT (slug) DO NOTHING;
