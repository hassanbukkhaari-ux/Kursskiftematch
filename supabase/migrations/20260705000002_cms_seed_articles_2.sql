-- CMS Article seeds part 2

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- MATCHNING 1
(
  'sadan-finder-i-den-rigtige-kontaktperson',
  'Sådan finder I den rigtige kontaktperson til jeres borger',
  'At finde den rigtige kontaktperson er en af kommunens vigtigste beslutninger. Et forkert match kan i bedste fald forsinke fremskridt — i værste fald forstærke borgerens mistillid til hjælpesystemet.',
  E'At finde den rigtige kontaktperson til en specifik borger er en af kommunens vigtigste beslutninger i forbindelse med iværksættelse af en social indsats. Et forkert match kan i bedste fald forsinke fremskridt — i værste fald forstærke borgerens mistillid til hjælpesystemet.\n\n## Hvad definerer "det rette match"?\n\nEt godt match hviler på tre søjler:\n\n**Faglig kompetence:** Fagpersonen skal have dokumenteret erfaring med borgerens specifikke problemstilling. En kontaktperson med erfaring inden for misbrug er ikke nødvendigvis det rette valg til en ung med social isolation — og omvendt.\n\n**Kapacitet:** Fagpersonen skal have reel kapacitet til at håndtere forløbet ansvarligt. Det indebærer tilstrækkeligt antal ledige timer, lavt antal aktive sager og fleksibel tilgængelighed der matcher borgerens behov.\n\n**Menneskelig kompatibilitet:** Borgerens personlighed, kommunikationsstil og baggrund bør indgå i matchovervejelsen. Ikke alle relationer fungerer — og det er ingen faglig svaghed at anerkende dette.\n\n## Kommunens udfordring\n\nMange kommuner bruger en åben database-model, hvor socialrådgivere selv gennemsøger og kontakter potentielle fagpersoner. Denne model er tidskrævende, og socialrådgivere mangler typisk det fulde overblik over fagpersonernes aktuelle kapacitet og kompetenceprofil.\n\nResultatet er ofte, at de samme navne vælges igen og igen — ikke fordi de er de bedste til den specifikke sag, men fordi de er kendte.\n\n## Kursskiftes tilgang\n\nKursskifte håndterer matchet som en specialiseret opgave. Kommunen indsender sagen med en beskrivelse af borgeren og behovet. Kursskifte vurderer kompleksitetsniveauet, filtrerer på kapacitet og tilgængelighed, scorer kandidaterne systematisk og fremsender et fagligt begrundet forslag.\n\n## Gode spørgsmål at stille inden forløbet\n\n- Hvad er forløbets primære formål og succeskriterier?\n- Hvilken aldersgruppe og problemstilling kræver forløbet?\n- Er borgeren motiveret, eller kræves opsøgende indsats i opstartsfasen?\n- Hvad er forventet varighed og intensitet (timer pr. uge)?\n- Er der specifikke krav til fagpersonens baggrund?\n\nJo bedre I er i stand til at beskrive behovet, jo bedre forslag kan Kursskifte levere.',
  'matchning',
  ARRAY['finde kontaktperson', 'ekstern kontaktperson', 'match', 'socialfaglig matchning'],
  TRUE,
  NOW(),
  5,
  'Sådan finder I den rigtige kontaktperson — guide til kommuner — Kursskifte',
  'Guide til at finde den rigtige kontaktperson: hvad definerer et godt match, kommunens udfordringer og Kursskiftes systematiske matchningsproces.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- MATCHNING 2
(
  'hvad-koster-et-daarligt-match',
  'Hvad koster et dårligt match — og hvordan undgår man det?',
  'Et dårligt match i et kontaktpersonforløb er ikke blot en faglig fejl — det er en investering, der ikke giver afkast, og en belastning for borgeren. Her ser vi på de reelle omkostninger og hvad der forårsager dem.',
  E'Et dårligt match i et kontaktpersonforløb er ikke blot en faglig fejl — det er en investering, der ikke giver afkast, og en belastning for borgeren, der risikerer at gøre næste indsats sværere. Alligevel undervurderes konsekvenserne af dårlige match systematisk.\n\n## De direkte omkostninger\n\nEt kontaktpersonforløb koster typisk **150–300 kr. i timen** for fagpersonens ydelse plus kommunens administrative tid. Et typisk forløb på 6 måneder med 5 timer ugentligt koster i størrelsesordenen **35.000–75.000 kr.** i fagpersonydelse alene.\n\nHvis forløbet afbrydes efter 3 måneder på grund af et dårligt match, er op til halvdelen af investeringen spildt — og et nyt forløb skal opstarte med ny matchning, ny introduktionsperiode og ny opbygning af borgerens tillid.\n\n## De indirekte omkostninger\n\nDe direkte omkostninger er kun toppen af isbjerget.\n\n**Borgerens mistillid stiger.** Mange borgere har en lang historik med voksne og fagpersoner, der skuffer eller forsvinder. Endnu et brudt forløb bekræfter dette mønster.\n\n**Problemstillingen kan forværres.** I den periode et dårligt match forløber, modtager borgeren ikke den rette støtte. Problemstillingen kan i mellemtiden eskalere til et højere kompleksitetsniveau.\n\n**Socialrådgiverens tid bruges.** Opstart, koordinering og afslutning af forløb tager kommunal administrativ tid. Et dårligt match genererer ekstra kommunikation og administrativt opfølgningsarbejde.\n\n## Hvad forårsager dårlige match?\n\nDe hyppigste årsager:\n\n1. **Manglende kapacitetsvurdering** — fagpersonen accepterer en sag, men har ikke reel kapacitet\n2. **Overfladisk kompetencematching** — fagpersonen har generel erfaring, men ikke med den specifikke problemstilling\n3. **Manglende menneskelig vurdering** — personlighed og kommunikationsstil matcher ikke borgeren\n4. **Utilstrækkelig dokumentation** — kompetencerne er ikke tilstrækkeligt dokumenterede til at vurdere egnethed\n\n## Hvad Kursskifte gør\n\nKursskiftes matchningsproces er designet til at minimere risikoen for dårlige match. Vi verificerer kapacitet i realtid, vurderer kompetenceprofilen ud over uddannelsesbaggrund, scorer kandidaterne systematisk og foreslår kun fagpersoner, vi fagligt kan stå inde for.\n\nEt dårligt match er dyrt. Et godt match er en investering.',
  'matchning',
  ARRAY['dårligt match', 'kontaktperson omkostninger', 'kvalitetssikring', 'socialfaglig matchning'],
  TRUE,
  NOW(),
  5,
  'Hvad koster et dårligt match i et kontaktpersonforløb? — Kursskifte',
  'Analyse af konsekvenserne ved et dårligt match: direkte og indirekte omkostninger, hyppige årsager og hvad Kursskifte gør for at minimere risikoen.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- MATCHNING 3
(
  'kvalitetssikring-af-kontaktpersoner',
  'Kvalitetssikring af kontaktpersoner — hvad skal kommunen kræve?',
  'Kommunen har pligt til at sikre, at borgerne modtager indsatser af høj faglig kvalitet. Hvad bør kommunen konkret kræve af en ekstern kontaktperson — ved opstart og under forløbet?',
  E'Kommunen har pligt til at sikre, at borgerne modtager indsatser af høj faglig kvalitet. Når kommunen anvender en ekstern kontaktperson, er det kommunens ansvar at sikre, at fagpersonen er kvalificeret og dokumenteret. Men hvad bør kommunen konkret kræve?\n\n## Grundlæggende dokumentationskrav\n\nSom minimum bør kommunen kræve at se:\n\n**Straffeattest.** Alle fagpersoner, der arbejder med sårbare borgere, bør fremvise en ren straffeattest. For fagpersoner der arbejder med børn og unge er **børneattest** ligeledes obligatorisk.\n\n**CV med relevant erfaring.** Fagpersonens erhvervserfaring bør afspejle kompetencer, der er relevante for den pågældende borger. Generel social erfaring er ikke nok — der bør være dokumenteret erfaring med den specifikke målgruppe.\n\n**Uddannelsesbeviser.** Fagpersonens formelle uddannelse bør verificeres. For specialiserede forløb bør der kræves dokumentation for relevant efteruddannelse.\n\n## Løbende kvalitetssikring\n\nKvalitetssikring er ikke kun en opgave ved opstart. Under forløbet bør kommunen sikre:\n\n- Regelmæssig statusrapportering fra fagpersonen\n- Dokumentation af sessionerne i overensstemmelse med kommunens journalstandarder\n- Opfølgningsmøder med kommunen, borgeren og fagpersonen\n\n## Hvad kommunen ofte overser\n\nEn veludviklet kompetenceprofil på papiret er ikke en garanti for et godt forløb. Kommunen bør også vurdere:\n\n- **Aktuel kapacitet:** Kan fagpersonen tage endnu en sag på nuværende tidspunkt?\n- **Kontinuitet:** Kan fagpersonen forpligte sig til forløbets fulde varighed?\n- **Supervision:** Har fagpersonen adgang til faglig supervision under forløbet?\n\n## Kursskiftes kvalitetsstandarder\n\nKursskifte gennemfører en grundig kvalitetssikring af alle fagpersoner inden aktivering: straffeattest og børneattest verificeres, CV og uddannelsesbeviser kontrolleres manuelt, og kapacitet registreres og opdateres løbende. Kommunen modtager ikke blot en liste — de modtager et fagligt begrundet forslag fra en platform, der har stået inde for kvaliteten.',
  'matchning',
  ARRAY['kvalitetssikring', 'kontaktperson krav', 'straffeattest', 'dokumentation', 'kommunal tilsyn'],
  TRUE,
  NOW(),
  5,
  'Kvalitetssikring af kontaktpersoner — hvad skal kommunen kræve? — Kursskifte',
  'Guide til kommunens kvalitetssikring af eksterne kontaktpersoner: dokumentationskrav, løbende tilsyn og hvad Kursskifte verificerer inden aktivering.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- DOKUMENTATION 1
(
  'dokumentation-af-kontaktpersonforlob',
  'Dokumentation af kontaktpersonforløb — hvad skal stå i journalen?',
  'Korrekt dokumentation er ikke blot en administrativ opgave — det er en faglig og juridisk forpligtelse. God dokumentation beskytter borgeren, kontaktpersonen og kommunen og giver grundlag for faglig opfølgning.',
  E'Korrekt dokumentation af kontaktpersonforløb er ikke blot en administrativ opgave — det er en faglig og juridisk forpligtelse. God dokumentation beskytter borgeren, kontaktpersonen og kommunen og giver grundlag for faglig opfølgning og kursændring.\n\n## Hvad skal dokumenteres?\n\nSom minimum bør et kontaktpersonforløb dokumentere:\n\n**Sessionslogs:** Dato, tidspunkt, varighed og indhold af hver session. Hvad arbejdede man på? Hvilke mål blev adresseret? Hvad var borgerens tilstand?\n\n**Hændelser og observationer:** Relevante hændelser i borgerens liv, der er af betydning for forløbet. Fx kriser, fremskridt, tilbagefald, ændringer i netværk eller boligsituation.\n\n**Kontakt med tredjeparter:** Møder og korrespondance med kommunen, psykiatri, skole, beskæftigelse eller andre.\n\n**Timeregistrering:** Præcis registrering af anvendte timer, der dokumenterer ydelsen over for kommunen.\n\n## GDPR-overvejelser\n\nKontaktpersonforløb involverer følsomme personoplysninger. Kommunen er dataansvarlig og har pligt til at sikre, at oplysningerne behandles fortroligt, adgang til data er begrænset til relevante parter, og data slettes i overensstemmelse med kommunens opbevaringspolitik.\n\nFagpersoner, der dokumenterer digitalt, bør anvende systemer, der opfylder GDPR-kravene.\n\n## Hvad sker der ved manglende dokumentation?\n\nMangelfuld dokumentation kan have alvorlige konsekvenser:\n\n- **Fagligt:** Det er umuligt at vurdere, om forløbet udvikler sig i den rette retning\n- **Juridisk:** Kommunen kan ikke opfylde sin tilsynspligt\n- **Praktisk:** Overlevering til ny fagperson besværliggøres ved forløbsafbrydelse\n\n## Kursskiftes dokumentationsplatform\n\nAlle forløb i Kursskifte dokumenteres i platformen. Kontaktpersonen registrerer sessioner og timer digitalt. Kommunen har adgang til relevant dokumentation og kan følge forløbet løbende — uden at det kræver ekstra administration.',
  'dokumentation',
  ARRAY['dokumentation', 'journaldokumentation', 'GDPR', 'timeregistrering', 'kommunal tilsyn'],
  TRUE,
  NOW(),
  5,
  'Dokumentation af kontaktpersonforløb — hvad skal stå i journalen? — Kursskifte',
  'Guide til dokumentation af kontaktpersonforløb: hvad der skal journalføres, GDPR-krav og konsekvenserne af mangelfuld dokumentation.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- DOKUMENTATION 2
(
  'hurtig-opstart-af-kontaktpersonforlob',
  'Hurtig opstart af kontaktpersonforløb — hvad kræver det?',
  'Borgere i krise venter ikke. Mange kommuner oplever, at processen med at finde og godkende en ekstern kontaktperson tager uger. Hvad kræver en hurtig, forsvarlig opstart?',
  E'Borgere i krise venter ikke. Kommuner oplever hyppigt pres for at iværksætte sociale indsatser hurtigt — men mange oplever, at processen med at finde og godkende en ekstern kontaktperson tager uger eller måneder. Det behøver ikke at være tilfældet.\n\n## Hvad forsinker opstart?\n\nDe mest almindelige årsager til langsom opstart:\n\n**Søgeprocessen:** Mange kommuner bruger uforholdsmæssig lang tid på at søge i åbne databaser og kontakte fagpersoner manuelt.\n\n**Kapacitetsmangel:** Den fagperson, der ønskes, har ikke faktisk kapacitet. Processen begynder forfra.\n\n**Dokumentationsgab:** Fagpersonens dokumentation er ufuldstændig og skal indhentes.\n\n**Godkendelsesled:** Kommunens interne godkendelsesproces for nye leverandører kan tage lang tid.\n\n## Hvad kræver en hurtig opstart?\n\nEn hurtig opstart kræver, at tre ting er på plads:\n\n1. **Fagpersonen er verificeret og klar** — kvalitetssikringen er gennemført inden forløbet opstarter, ikke undervejs\n2. **Fagpersonen har faktisk kapacitet** — ikke blot "tilgængelig på papiret", men reel kapacitet til at prioritere det nye forløb\n3. **Praktiske rammer er aftalt** — takst, omfang, mødeformat og dokumentationskrav er afklaret inden første session\n\n## Kursskiftes responstid\n\nKursskifte tilstræber at levere et fagligt begrundet forslag til kommunen inden for **1–3 arbejdsdage** fra modtagelse af sagen. I akutte tilfælde kan vi ved særlig aftale fremskynde processen.\n\nDet er muligt, fordi vores fagpersonbase er pre-verificeret og kapacitetsopdateret. Vi kender fagpersonernes aktuelle belastning og tilgængelighed.\n\n## Hvad kommunen kan gøre\n\nFor at understøtte en hurtig opstart:\n\n- Beskriv sagen præcist: alder, problemstilling, kompleksitetsniveau, geografisk placering\n- Angiv eventuelle specifikke krav (køn, sprogkompetencer, erfaring)\n- Aftal internt hvem der godkender forslaget og med hvilken svartid\n\nJo klarere sagens beskrivelse er, jo hurtigere kan Kursskifte levere et præcist forslag.',
  'dokumentation',
  ARRAY['hurtig opstart', 'akut kontaktperson', 'responstid', 'opstart forløb'],
  TRUE,
  NOW(),
  4,
  'Hurtig opstart af kontaktpersonforløb — hvad kræver det? — Kursskifte',
  'Guide til hurtig opstart af kontaktpersonforløb: hvad der forsinker processen, hvad der kræves for at fremskynde den og Kursskiftes responstid.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- LOVGIVNING 1
(
  'serviceloven-paragraf-52-og-85',
  'Servicelovens §52 og §85 — en introduktion til kontaktpersonordninger',
  'Serviceloven er den primære lovgivning for sociale indsatser i Danmark. For kontaktpersonforløb er §52 og §85 de centrale bestemmelser. Her er en faglig introduktion til begge.',
  E'Serviceloven er den primære lovgivning for sociale indsatser i Danmark. For kontaktpersonforløb er **§52** og **§85** de to centrale bestemmelser, som kommunen anvender som hjemmel for at iværksætte og finansiere forløbet.\n\n## Servicelovens §52 — foranstaltninger for børn og unge\n\n§52 giver kommunalbestyrelsen mulighed for at iværksætte hjælpeforanstaltninger for børn og unge, "når det må anses for at være af væsentlig betydning af hensyn til et barns eller en ungs særlige behov for støtte".\n\nForanstaltningerne under §52, stk. 3 omfatter bl.a. nr. 6: **"udpegning af en fast kontaktperson for barnet eller den unge"**. Kontaktperson under §52 bruges typisk, når den unge har behov for en stabil, fast voksen relation — men ikke er i en situation, der kræver anbringelse.\n\n§52-foranstaltninger kræver som udgangspunkt en børnefaglig undersøgelse (§50) og forældrenes samtykke.\n\n## Servicelovens §85 — støtte til voksne med nedsat funktionsevne\n\n§85 giver kommunen mulighed for at yde hjælp, omsorg eller støtte til voksne med **nedsat psykisk eller fysisk funktionsevne**. Indsatsen er fleksibel og kan tilpasses den enkelte borgers behov.\n\n§85 kan bevilges til personlig hjælp og støtte, hjælp til kommunikation og socialpædagogisk bistand til at klare dagligdagen og fastholde boligen.\n\n§85 kræver borgerens ansøgning og en kommunal vurdering af borgerens behov og funktionsevnenedsættelse.\n\n## Lovgivningens rammer for private leverandører\n\nKommunen kan anvende private leverandører — som Kursskifte — til at levere indsatser under begge paragraffer. Private leverandører er underlagt samme kvalitetskrav som kommunale tilbud.\n\nKursskifte leverer indsatser til kommuner i Nordjylland og bistår med den administrative koordination, dokumentation og opfølgning, der er forbundet med forløbet.\n\n## Hvad kommunen skal vide\n\nLovgivningen giver kommunen relativt vide rammer for, hvad der kan bevilges og til hvem. Den afgørende faktor er den individuelle behovsvurdering — og den skal have et fagligt fundament. Kursskifte bistår kommunens socialrådgivere med faglig information om matchning og kvalitetssikring inden for lovgivningens rammer.',
  'lovgivning',
  ARRAY['serviceloven', '§52', '§85', 'lovgivning', 'kontaktpersonordning'],
  TRUE,
  NOW(),
  5,
  'Servicelovens §52 og §85 — introduktion til kontaktpersonordninger — Kursskifte',
  'Introduktion til Servicelovens §52 og §85 som hjemmel for kontaktpersonforløb: formål, betingelser og rammer for private leverandører.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- LOVGIVNING 2
(
  'ekstern-vs-kommunal-kontaktperson',
  'Ekstern kontaktperson vs. kommunal kontaktperson — fordele og ulemper',
  'Kommuner kan vælge mellem en intern og en ekstern kontaktperson. Begge modeller har fordele og ulemper. Her er en oversigt, der hjælper kommunen med at træffe det rette valg.',
  E'Kommuner kan vælge mellem to overordnede modeller for levering af kontaktpersonforløb: den kommunale model, hvor fagpersonen er ansat i kommunen, og den eksterne model, hvor en privat leverandør stiller fagpersonen til rådighed. Begge modeller har fordele og ulemper.\n\n## Den kommunale kontaktperson\n\nI den kommunale model er kontaktpersonen ansat direkte i kommunen — typisk i socialforvaltningen, et familiecenter eller et ungehus.\n\n**Fordele:**\n- Tæt integration med kommunens øvrige indsatser og systemer\n- Lettere koordination med socialrådgiver og anden kommunal indsats\n- Direkte adgang til kommunale ressourcer og netværk\n\n**Ulemper:**\n- Begrænset kapacitet ved spidsbelastning\n- Svært at matche specialiserede kompetencer til specifikke borgere\n- Kommunale medarbejdere er ikke altid tilgængelige uden for normal arbejdstid\n- Rekrutteringsprocesser er langsomme\n\n## Den eksterne kontaktperson\n\nI den eksterne model er kontaktpersonen en selvstændig fagperson eller ansat hos en privat leverandør.\n\n**Fordele:**\n- Adgang til specialiserede kompetencer kommunen ikke selv råder over\n- Fleksibel kapacitet — kan skaleres op og ned afhængigt af behovet\n- Fagpersoner med specialer inden for fx misbrug, psykiatri eller specifikke aldersgrupper\n- Hurtigere opstart ved kendte leverandører\n\n**Ulemper:**\n- Kræver kommunal godkendelse og administrativ opsætning\n- Kræver aktiv koordination og tilsyn fra kommunens side\n\n## Hvornår bruges hvilken model?\n\nDen kommunale model egner sig til standardforløb inden for kommunens kernekompetencer og borgere med behov for tæt kommunal koordination.\n\nDen eksterne model egner sig til specialiserede forløb, kapacitetsproblemer i kommunen, akutte behov eller borgere, der vil profitere af en vis afstand til det kommunale system.\n\nMange kommuner bruger i praksis begge modeller side om side.\n\n## Kursskiftes rolle\n\nKursskifte er en ekstern leverandør, der matcher kommuner med kvalitetssikrede kontaktpersoner til §52- og §85-forløb. Vi håndterer matchning, dokumentation og koordination som en integreret service — ikke blot et vikarbureau.',
  'lovgivning',
  ARRAY['ekstern kontaktperson', 'kommunal kontaktperson', 'privat leverandør', 'valg af kontaktperson'],
  TRUE,
  NOW(),
  5,
  'Ekstern vs. kommunal kontaktperson — fordele og ulemper — Kursskifte',
  'Oversigt over fordele og ulemper ved ekstern versus kommunal kontaktperson. Hjælper kommunen med at vælge den rette model til det specifikke forløb.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
-- LOVGIVNING 3
(
  'mentor-vs-kontaktperson',
  'Mentor til udsat ung — forskellen på kontaktperson og mentor',
  'Termerne "kontaktperson" og "mentor" bruges sommetider om hinanden, men de dækker over væsentligt forskellige indsatser. Her er en klar oversigt over forskellene og hvornår man vælger hvad.',
  E'Termerne "kontaktperson" og "mentor" bruges sommetider om hinanden, men de dækker over forskelligartede indsatser med forskellige formål, lovhjemler og faglige profiler. Klarhed om forskellen hjælper kommunen med at vælge den rette indsats.\n\n## Hvad er en kontaktperson?\n\nEn kontaktperson er en uddannet fagperson, typisk tilknyttet via kommunen eller en godkendt leverandør, der iværksætter en **socialfaglig indsats** baseret på en kommunal behovsvurdering. Indsatsen er hjemlet i Serviceloven (typisk §52 eller §85) og finansieres af kommunen.\n\nKontaktpersonens rolle er at skabe en stabil, tillidsfuld relation, der understøtter borgerens sociale og personlige udvikling over tid. Indsatsen er professionel og dokumenteret.\n\n## Hvad er en mentor?\n\nEn mentor er typisk en frivillig eller lønnet person med relevant livserfaring eller faglig baggrund, der tilbyder **personlig guidning og rådgivning** til en ung i en konkret situation. Mentorordninger er ofte organiseret af NGO''er, uddannelsesinstitutioner eller private organisationer.\n\nMentorordninger er ikke hjemlet i Serviceloven og finansieres ikke som sociale indsatser.\n\n## Nøgleforskelle\n\n**Kontaktperson:** Lovhjemmel i §52/§85. Kommunalt finansieret. Kræver uddannelse. Obligatorisk dokumentation. Formål er socialfaglig indsats. Typisk 6–24 måneder.\n\n**Mentor:** Ingen specifik lovhjemmel. Typisk fondsstøtte eller frivillig. Varierende uddannelseskrav. Formål er personlig guidning og netværk. Varierende varighed.\n\n## Hvornår er hvad det rigtige valg?\n\n**Kontaktperson:** Når borgeren har behov for professionel socialfaglig indsats, er i en sårbar situation, der kræver faglig vurdering og dokumentation, eller når kommunen har en myndighedsforpligtelse.\n\n**Mentor:** Når en ung, der generelt klarer sig, har behov for personlig inspiration, netværk eller rollemodel — men ikke nødvendigvis professionel socialfaglig indsats.\n\nI mange tilfælde kan de to indsatser supplere hinanden: kontaktpersonen er den professionelle fagperson, og mentoren er en rollemodel fra uddannelse eller erhverv.\n\n## Kursskiftes specialisering\n\nKursskifte arbejder udelukkende med professionelle kontaktpersonforløb hjemlet i Serviceloven. Vi er eksperter i matchning og koordination af socialfaglige indsatser.',
  'lovgivning',
  ARRAY['mentor', 'kontaktperson', 'støtteperson', 'mentor vs kontaktperson', 'udsat ung'],
  TRUE,
  NOW(),
  5,
  'Mentor vs. kontaktperson — hvad er forskellen? — Kursskifte',
  'Klar oversigt over forskellen på mentor og kontaktperson: lovhjemmel, formål, uddannelseskrav og hvornår kommunen vælger hvad.'
)
ON CONFLICT (slug) DO NOTHING;
