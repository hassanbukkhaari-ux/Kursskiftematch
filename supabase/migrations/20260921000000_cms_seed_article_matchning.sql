-- SEO-artikel: Sådan matcher vi kontaktperson til sag
-- Tilføjet til /indsigt (vidensbase) — ingen ændringer på landingssider.

INSERT INTO public.cms_articles
  (slug, title, excerpt, content, category, tags, is_published, published_at, reading_time_minutes, meta_title, meta_description)
VALUES
(
  'sadan-matcher-vi-kontaktperson-til-sag',
  'Sådan matcher vi kontaktperson til sag — kompetencer, kapacitet og kompleksitet',
  'Hvordan finder Kursskifte den rette kontaktperson til en konkret sag? Vi gennemgår vores matchningsproces — fra kompleksitetsvurdering til kompetencematch — og hvorfor det aldrig sker automatisk.',
  E'"Vi finder den rette kontaktperson" lyder enkelt, men dækker over en struktureret proces. Her gennemgår vi, hvad der reelt sker, fra en sag oprettes, til I modtager et fagligt begrundet forslag.\n\n## Først: hvor kompleks er sagen?\n\nInden vi leder efter en kandidat, vurderer vi sagens kompleksitet. Det sker ud fra en række forhold i sagen — blandt andet den unges eller borgerens psykiske trivsel, familiens stabilitet, skolegang, og om flere instanser allerede er involveret. Ud fra det placeres sagen på et niveau: **Lav, Mellem, Høj eller Kritisk**. Jo højere niveau, jo mere erfaring og specialisering skal den tilknyttede kontaktperson have — en sag med flere samtidige risikofaktorer matches aldrig med en nyuddannet fagperson alene.\n\n## Fire ting, vi matcher på\n\nNår kompleksiteten er kendt, vurderer vi hver mulig kontaktperson på fire ligeligt vægtede forhold:\n\n- **Faglige kvalifikationer** — uddannelse, specialisering og dokumenteret erfaring med den konkrete målgruppe\n- **Tilgængelighed** — har fagpersonen reelt tid til sagen inden for den ønskede tidsramme\n- **Kapacitet** — hvor mange sager har fagpersonen i forvejen, og er der plads til én mere uden at gå på kompromis med kvaliteten\n- **Kompleksitetsmatch** — matcher fagpersonens erfaringsniveau sagens kompleksitet\n\nKun fagpersoner med gyldig og verificeret straffeattest (og børneattest, hvor sagen involverer et barn) indgår overhovedet i vurderingen — se vores artikel om [dokumentverifikation](/indsigt/socialtilsyn-hvorfor-kursskifte-ikke-er-godkendt) for detaljerne.\n\n## Mennesket træffer beslutningen — ikke algoritmen\n\nVurderingen af kandidater er et beslutningsstøtteværktøj, ikke en automatisk tildeling. De bedst egnede kandidater gennemgås altid af en medarbejder hos Kursskifte, der kender sagen og fagpersonerne, før nogen indstilles. Vi vælger aldrig en kontaktperson uden en konkret, begrundet vurdering — og kan vurderingen ikke stå alene, tages der altid en dialog internt, før noget indstilles til jer.\n\nKontaktpersoner ser i øvrigt ikke selve vurderingen af sig selv i andre sager — det er et internt redskab for Kursskifte, ikke noget fagpersoner konkurrerer synligt om.\n\n## Hvad det betyder for jer som kommune\n\nI modtager ikke bare et navn — I modtager et fagligt begrundet forslag med en forklaring på, hvorfor netop den kontaktperson passer til netop den sag. Det gør det muligt for jer at vurdere anbefalingen, ikke bare acceptere den. Visitation og den endelige bevilling er og bliver jeres beslutning.\n\n## Kursskiftes rolle\n\nMatchning er kernen i det, Kursskifte gør — men det er ét skridt i et længere forløb, der fortsætter med opstart, løbende dokumentation og opfølgning. Har du spørgsmål til, hvordan en konkret sag ville blive matchet, er du velkommen til at kontakte os på kontakt@kursskifte.dk eller 31 31 95 94.',
  'matchning',
  ARRAY['matchning', 'kompleksitet', 'kvalitetssikring', 'kontaktperson', 'kompetencer'],
  TRUE,
  NOW(),
  5,
  'Sådan matcher vi kontaktperson til sag | Kursskifte',
  'Hvordan finder Kursskifte den rette kontaktperson til en sag? Vi forklarer kompleksitetsvurdering, kompetencematch og hvorfor et menneske altid træffer beslutningen.'
)
ON CONFLICT (slug) DO NOTHING;
