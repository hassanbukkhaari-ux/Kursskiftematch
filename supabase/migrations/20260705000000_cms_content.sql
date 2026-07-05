-- Migration: CMS content tables for public knowledge base and municipality landing pages
-- Tables: cms_categories, cms_municipalities, cms_articles

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cms_categories (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INT  NOT NULL DEFAULT 0
);

ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_categories_public_read" ON public.cms_categories
  FOR SELECT USING (TRUE);
CREATE POLICY "cms_categories_admin_write" ON public.cms_categories
  FOR ALL USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- ─── MUNICIPALITY LANDING PAGES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cms_municipalities (
  slug                  TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  county                TEXT NOT NULL DEFAULT 'Nordjylland',
  population_approx     INT,
  hero_title            TEXT NOT NULL,
  hero_intro            TEXT NOT NULL,
  local_context         TEXT NOT NULL,
  services_description  TEXT NOT NULL,
  meta_title            TEXT NOT NULL,
  meta_description      TEXT NOT NULL,
  sort_order            INT  NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cms_municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_municipalities_public_read" ON public.cms_municipalities
  FOR SELECT USING (TRUE);
CREATE POLICY "cms_municipalities_admin_write" ON public.cms_municipalities
  FOR ALL USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- ─── ARTICLES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cms_articles (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT        UNIQUE NOT NULL,
  title                 TEXT        NOT NULL,
  excerpt               TEXT        NOT NULL,
  content               TEXT        NOT NULL,
  category              TEXT        NOT NULL REFERENCES public.cms_categories(slug) ON UPDATE CASCADE,
  tags                  TEXT[]      NOT NULL DEFAULT '{}',
  is_published          BOOLEAN     NOT NULL DEFAULT FALSE,
  published_at          TIMESTAMPTZ,
  reading_time_minutes  INT         NOT NULL DEFAULT 5,
  meta_title            TEXT,
  meta_description      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_articles_category    ON public.cms_articles(category);
CREATE INDEX IF NOT EXISTS idx_cms_articles_published   ON public.cms_articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_articles_tags        ON public.cms_articles USING GIN(tags);

ALTER TABLE public.cms_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cms_articles_public_read" ON public.cms_articles
  FOR SELECT USING (is_published = TRUE);
CREATE POLICY "cms_articles_admin_all" ON public.cms_articles
  FOR ALL USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- ─── SEED: CATEGORIES ─────────────────────────────────────────────────────────

INSERT INTO public.cms_categories (slug, name, description, sort_order) VALUES
  ('vejledning',    'Vejledning',     'Praktiske guider til kommuner og socialrådgivere',               1),
  ('faglig-viden',  'Faglig viden',   'Dybdegående artikler om socialfaglig praksis og metode',         2),
  ('matchning',     'Matchning',      'Artikler om matching, kvalitetssikring og valg af kontaktperson', 3),
  ('dokumentation', 'Dokumentation',  'Om journaldokumentation, GDPR og rapportering',                  4),
  ('lovgivning',    'Lovgivning',     'Gennemgang af serviceloven og relevante paragraffer',             5)
ON CONFLICT (slug) DO NOTHING;

-- ─── SEED: MUNICIPALITY LANDING PAGES ────────────────────────────────────────

INSERT INTO public.cms_municipalities
  (slug, name, county, population_approx, hero_title, hero_intro, local_context, services_description, meta_title, meta_description, sort_order)
VALUES
(
  'aalborg',
  'Aalborg',
  'Nordjylland',
  215000,
  'Kontaktpersonforløb og socialpædagogisk støtte i Aalborg Kommune',
  'Kursskifte hjælper Aalborg Kommune med at finde kvalitetssikrede kontaktpersoner til §52- og §85-forløb. Vi matcher borgere med fagpersoner, der har dokumenteret erfaring og den rette kapacitet — og vi varetager matchning, dokumentation og koordination.',
  'Aalborg er Nordjyllands største by og en af Danmarks mest dynamiske kommuner med ca. 215.000 indbyggere. Den urbane sociale kompleksitet — herunder hjemløshed, psykiske lidelser og unge i mistrivsel — stiller høje krav til de socialfaglige indsatser. Aalborg Kommune har en stor og aktiv socialforvaltning, men oplever som mange storbyer et pres på kapaciteten til specialiserede forløb. Unge med social isolation, borgere med dobbeltdiagnose og voksne med behov for bostøtte er centrale målgrupper for de sociale indsatser i Aalborg.',
  'Kursskifte leverer kontaktpersonforløb under §52 og §85 til Aalborg Kommune. Vores fagpersoner er matchet på kompetencer, der er relevante for Aalborgs borgerprofil — herunder erfaring med psykiatri, misbrug, hjemløshed og unge i risiko. Vi verificerer straffeattest, børneattest og uddannelse, inden en fagperson tilknyttes et forløb. Kommunen modtager et fagligt begrundet forslag med anbefalet kontaktperson, kompetencebegrundelse og estimeret opstart.',
  'Kontaktpersonforløb Aalborg | §52 og §85 — Kursskifte',
  'Kursskifte hjælper Aalborg Kommune med kvalitetssikrede kontaktpersoner til §52- og §85-forløb. Faglig anbefaling, verifikation og koordination. Vi betjener Nordjylland.',
  1
),
(
  'hjoerring',
  'Hjørring',
  'Nordjylland',
  65000,
  'Kontaktpersonforløb og §85-støtte i Hjørring Kommune',
  'Kursskifte hjælper Hjørring Kommune med at finde og koordinere kvalitetssikrede kontaktpersoner til sociale forløb. Vi betjener borgere i Hjørring by og kommunens øvrige lokalsamfund.',
  'Hjørring er Nordjyllands næststørste by med ca. 65.000 indbyggere i kommunen. Kommunen rummer både Hjørring by og en række lokalsamfund i det nordlige Jylland, der tilsammen skaber en socialt mangfoldig borgerprofil. Familieindsatser, unge i risiko og voksne med psykiske udfordringer er centrale sociale opgaver. Hjørring Kommune arbejder aktivt med forebyggende indsatser, og behovet for kvalificerede kontaktpersoner — der kan møde borgeren tidligt og opbygge en stabil relation — er markant.',
  'Kursskifte leverer kontaktpersonforløb under §52 og §85 til Hjørring Kommune. Vores fagpersoner har erfaring med målgrupper i både by og landkommunale kontekster — herunder unge med social isolation, familier i udsatte positioner og voksne med bostøttebehov. Vi varetager matchning, dokumentation og løbende koordination.',
  'Kontaktpersonforløb Hjørring | §52 og §85 — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Hjørring Kommune. Faglig matchning og dokumenteret koordination. Nordjylland.',
  2
),
(
  'frederikshavn',
  'Frederikshavn',
  'Nordjylland',
  60000,
  'Kontaktpersonforløb i Frederikshavn Kommune — §52 og §85',
  'Kursskifte matcher borgere i Frederikshavn med kvalitetssikrede kontaktpersoner til sociale forløb under Servicelovens §52 og §85.',
  'Frederikshavn er en havneby i det nordøstlige Nordjylland med ca. 60.000 indbyggere. Kommunen har en markant identitet som industri- og søfartsby med en borgerprofil, der afspejler dette. Sociale udfordringer knyttet til unge uden uddannelse eller beskæftigelse, misbrug og psykiske lidelser er centrale indsatsområder. Frederikshavn Kommune har et aktivt socialt beredskab, men er afhængig af specialiserede fagpersoner til komplekse forløb.',
  'Kursskifte leverer §52- og §85-forløb til Frederikshavn Kommune. Vi matcher borgere med fagpersoner, der har erfaring med de specifikke problemstillinger, der er centrale i Frederikshavn — herunder unge i risiko, misbrug og relationsbaseret bostøtte. Al dokumentation og koordination varetages af Kursskifte.',
  'Kontaktpersonforløb Frederikshavn | §52 og §85 — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Frederikshavn Kommune. Faglig anbefaling og fuld koordination. Nordjylland.',
  3
),
(
  'broenderslev',
  'Brønderslev',
  'Nordjylland',
  35000,
  'Kontaktpersonforløb i Brønderslev Kommune — §52 og §85',
  'Kursskifte hjælper Brønderslev Kommune med at finde kvalitetssikrede kontaktpersoner. Vi leverer §52- og §85-forløb med faglig anbefaling og fuld koordination.',
  'Brønderslev Kommune er en mellemstor nordjysk kommune med ca. 35.000 indbyggere. Kommunen har et aktivt socialfagligt miljø og et stærkt lokalt fællesskab. De primære sociale indsatsområder inkluderer unge i mistrivsel, familier med komplekse problemstillinger og voksne med behov for bostøtte. Den sociale indsats i Brønderslev er kendetegnet ved et tæt samspil mellem det offentlige, frivillige organisationer og private tilbud.',
  'Kursskifte leverer kontaktpersonforløb og socialpædagogisk støtte til Brønderslev Kommunes borgere. Vi varetager matchning, kvalitetssikring og koordination. Kommunen modtager et fagligt begrundet forslag og kan koncentrere sig om borgeren frem for administrationen.',
  'Kontaktpersonforløb Brønderslev | §52 og §85 — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Brønderslev Kommune. Faglig matchning og koordination i Nordjylland.',
  4
),
(
  'rebild',
  'Rebild',
  'Nordjylland',
  29000,
  'Kontaktpersonforløb i Rebild Kommune — §52 og §85',
  'Kursskifte hjælper Rebild Kommune med at finde og koordinere kontaktpersoner til sociale indsatser. Vi dækker alle lokalsamfund i Rebild Kommune.',
  'Rebild Kommune er en naturskøn nordjysk kommune med ca. 29.000 indbyggere spredt over et geografisk stort areal. Den geografiske spredning er en central udfordring i den sociale indsats — afstande til borgerne kan være store, og den rette fagperson skal have kapacitet og fleksibilitet til at dække kommunens geografi. Rebild Bakker og de omkringliggende lokalsamfund rummer borgere med sociale udfordringer, der kræver en opsøgende og relationsorienteret tilgang.',
  'Kursskifte leverer §52- og §85-forløb til Rebild Kommune. Vi tager geografisk spredning seriøst i matchningen og sikrer, at fagpersonen har reel kapacitet og mobilitet til at betjene borgere i de lokale samfund. Dokumentation og koordination varetages af Kursskifte.',
  'Kontaktpersonforløb Rebild | §52 og §85 — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Rebild Kommune. Faglig matchning og koordination med fokus på kommunens geografi. Nordjylland.',
  5
),
(
  'jammerbugt',
  'Jammerbugt',
  'Nordjylland',
  38000,
  'Kontaktpersonforløb i Jammerbugt Kommune — §52 og §85',
  'Kursskifte matcher borgere i Jammerbugt Kommune med kvalitetssikrede kontaktpersoner til sociale forløb under §52 og §85.',
  'Jammerbugt Kommune er en kystnær nordjysk kommune med ca. 38.000 indbyggere. Kommunen er kendetegnet ved en kombination af turistrettede kystsamfund og landlige indlandssamfund. Unge med social isolation, familier i sårbare positioner og voksne med psykiske udfordringer er centrale målgrupper for de sociale indsatser. Den geografiske spredning og kommunens landlige karakter stiller særlige krav til fagpersonernes mobilitet og kendskab til lokalmiljøet.',
  'Kursskifte leverer kontaktpersonforløb til borgere i Jammerbugt Kommune med fagpersoner, der kender det nordjyske lokalsamfund og har erfaring med kommunens borgerprofil. Vi verificerer kompetencer og kapacitet inden aktivering og varetager løbende koordination.',
  'Kontaktpersonforløb Jammerbugt | §52 og §85 — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Jammerbugt Kommune. Faglig matchning i Nordjylland.',
  6
),
(
  'mariagerfjord',
  'Mariagerfjord',
  'Nordjylland',
  41000,
  'Kontaktpersonforløb i Mariagerfjord Kommune — §52 og §85',
  'Kursskifte hjælper Mariagerfjord Kommune med kvalitetssikrede kontaktpersoner til socialfaglige indsatser under §52 og §85.',
  'Mariagerfjord Kommune er en nordjysk kommune med ca. 41.000 indbyggere, der geografisk spænder fra kysten ved Mariager Fjord til det midtjyske. Kommunen har en industribaggrund med byer som Hobro og Hadsund. De sociale indsatser her kræver forståelse for en kommune med både urban og rural borgerprofil — og fagpersoner med fleksibilitet til at dække kommunens geografi.',
  'Kursskifte leverer §52- og §85-forløb til Mariagerfjord Kommunes borgere. Vi matcher på kompetencer, der er relevante for den specifikke sag og borgerprofil i kommunen. Dokumentation, takst og koordination varetages af Kursskifte, så kommunen kan fokusere på borgeren.',
  'Kontaktpersonforløb Mariagerfjord | §52 og §85 — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Mariagerfjord Kommune. Faglig matchning og koordination i Nordjylland.',
  7
),
(
  'vesthimmerland',
  'Vesthimmerland',
  'Nordjylland',
  37000,
  'Kontaktpersonforløb i Vesthimmerland Kommune — §52 og §85',
  'Kursskifte hjælper Vesthimmerland Kommune med at finde og koordinere kvalitetssikrede kontaktpersoner til sociale indsatser.',
  'Vesthimmerland Kommune er en landkommune i Nordjylland med ca. 37.000 indbyggere fordelt på et geografisk stort areal med byer som Aars, Farsø og Løgstør. Den landlige karakter stiller krav til fagpersoners mobilitet og kendskab til lokal geografi. Landdistrikterne har i stigende grad sociale udfordringer knyttet til isolation og begrænsede lokale tilbud — og behovet for opsøgende, mobile fagpersoner er centralt.',
  'Kursskifte leverer kontaktpersonforløb til Vesthimmerland Kommunes borgere med særlig opmærksomhed på fagpersonens mobilitet og evne til at betjene borgere i kommunens landdistrikter. Vi verificerer kompetencer og kapacitet inden aktivering.',
  'Kontaktpersonforløb Vesthimmerland | §52 og §85 — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Vesthimmerland Kommune. Faglig matchning med fokus på landdistrikterne. Nordjylland.',
  8
),
(
  'morso',
  'Morsø',
  'Nordjylland',
  21000,
  'Kontaktpersonforløb i Morsø Kommune — §52 og §85',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til sociale forløb i Morsø Kommune. Vi håndterer matchning, koordination og dokumentation.',
  'Morsø Kommune er en ø-kommune i Limfjorden med ca. 21.000 indbyggere. Den geografiske isolation som ø-kommune skaber unikke udfordringer i den sociale indsats — transport til og fra Mors kræver bropassage, og mange borgere oplever en social isolation, der forstærkes af den geografiske. Kommunen har et relativt højt antal sociale sager sammenlignet med andre nordjyske kommuner, og behovet for stabile, kendte fagpersoner er stort.',
  'Kursskifte leverer §52- og §85-forløb til borgere på Mors. Vi tager ø-kommunens geografiske særstilling alvorligt i matchningen og sikrer, at fagpersoner har den nødvendige mobilitet og kendskab til lokalsamfundet. Dokumentation og koordination varetages i platformen.',
  'Kontaktpersonforløb Morsø | §52 og §85 — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Morsø Kommune. Faglig matchning med fokus på ø-kommunens geografiske særstilling. Nordjylland.',
  9
),
(
  'thisted',
  'Thisted',
  'Nordjylland',
  45000,
  'Kontaktpersonforløb i Thisted Kommune — §52, §85 og bostøtte',
  'Kursskifte hjælper Thisted Kommune med at finde og koordinere kvalitetssikrede kontaktpersoner til sociale forløb under §52 og §85.',
  'Thisted Kommune er den vestligste nordjyske kommune med ca. 45.000 indbyggere i Thy-regionen. Kommunen er kendetegnet ved fiskeri, vindenergi og et rigt naturlandskab. Den sociale profil er præget af et relativt sparsomt serviceudbud i landdistrikterne, og mange borgere kan have svært ved at tilgå sociale tilbud. Thisted har et aktivt socialt foreningsliv, men det offentlige socialvæsen dækker et meget stort geografisk areal, og mobile, fleksible fagpersoner er afgørende.',
  'Kursskifte leverer kontaktpersonforløb og bostøtte under §52 og §85 til Thisted Kommunes borgere. Vores fagpersoner har erfaring med den nordjyske geografi og evnen til at møde borgere, hvor de er. Vi verificerer kompetencer og kapacitet inden aktivering.',
  'Kontaktpersonforløb Thisted | §52, §85 og bostøtte — Kursskifte',
  'Kursskifte leverer kvalitetssikrede kontaktpersoner til §52- og §85-forløb i Thisted Kommune. Faglig matchning med fokus på Thy-regionens geografi. Nordjylland.',
  10
)
ON CONFLICT (slug) DO NOTHING;
