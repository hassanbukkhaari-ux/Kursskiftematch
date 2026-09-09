import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Til kommuner | Kontaktperson §32 og §85 — Kursskifte',
  description:
    'Kursskifte leverer mentor-, støtte- og kontaktpersonforløb til kommuner og jobcentre i Nordjylland. §32 barnets lov og §85 serviceloven. Tydelig proces, dokumentation og fast samarbejdspartner.',
  alternates: { canonical: '/kommuner' },
  openGraph: {
    title: 'Til kommuner | Kontaktperson §32 og §85 — Kursskifte',
    description:
      'Kursskifte hjælper kommuner i Nordjylland med kvalitetssikrede kontaktpersoner og mentorer til §32 og §85-forløb. Vi betjener Aalborg, Hjørring, Brønderslev og Frederikshavn.',
    url: '/kommuner',
  },
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function CheckGreen() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// Workflow steps — matches the business plan exactly
const STEPS = [
  {
    n: '01',
    title: 'Indledende dialog',
    body: 'Send en e-mail til info@kursskifte.dk eller ring på 71 42 03 76. Vi afklarer behov, formål, målgruppe, timeantal og forventninger — direkte til os.',
  },
  {
    n: '02',
    title: 'Vi vurderer behovet',
    body: 'Kursskifte gennemgår henvendelsen og vurderer kompleksitetsniveauet, aldersgruppe og kompetencebehov. Vi stiller opklarende spørgsmål hvis nødvendigt.',
  },
  {
    n: '03',
    title: 'Matching og kvalitetssikring',
    body: 'Vi scorer egnede kontaktpersoner og mentorer på kompetencer, kapacitet, tilgængelighed og erfaring med målgruppen. Dokumenter og attester er verificerede.',
  },
  {
    n: '04',
    title: 'I modtager et forslag',
    body: 'Et fagligt begrundet forslag med anbefalet kontaktperson sendes til jer — med profil, begrundelse og estimeret opstart.',
  },
  {
    n: '05',
    title: 'Opstart og aftaler',
    body: 'I godkender forslaget. Vi afholder opstartsmøde med borger, bestiller og kontaktperson. Mål, kontaktform og fokusområder fastlægges.',
  },
  {
    n: '06',
    title: 'Løbende opfølgning',
    body: 'Kursskifte er fast koordinator under hele forløbet. Statusnotater, fremmøde og progression dokumenteres og deles med jer efter aftale.',
  },
]

// Services in social sector language
const YDELSER = [
  {
    title: 'Mentorforløb',
    desc: 'Individuelle forløb med fokus på motivation, struktur, fremmøde og progression mod uddannelse eller beskæftigelse.',
    para: '§32 barnets lov / §85 SEL / beskæftigelsesrettet mentor',
  },
  {
    title: 'Socialpædagogisk støtte',
    desc: 'Relationsbaseret støtte til borgere med sociale, psykiske eller adfærdsmæssige udfordringer i hverdagen.',
    para: '§85 serviceloven / §32 barnets lov',
  },
  {
    title: 'Struktur- og motivationsstøtte',
    desc: 'Hjælp til at skabe rutiner, overholde aftaler og opbygge stabilitet — særligt til borgere med lav motivation eller ustabilt fremmøde.',
    para: '§85 SEL / beskæftigelsesrettet',
  },
  {
    title: 'Mødeledsagelse og koordinering',
    desc: 'Støtte til møder med kommune, jobcenter, uddannelsesinstitution eller praktiksted. Brobygning til relevante aktører.',
    para: 'Tværfaglig koordinering',
  },
  {
    title: 'Støtte til hverdagsmestring',
    desc: 'Praktisk støtte til fremmøde, aftaler, daglig struktur og selvstændighed — for borgere der har brug for tæt opfølgning.',
    para: '§85 SEL',
  },
  {
    title: 'Overgangsforløb',
    desc: 'Intensiv støtte i overgangen til uddannelse, beskæftigelse, praktik, egen bolig eller ny kommunal indsats.',
    para: 'Unge 15–25 år / voksne',
  },
]

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Kontaktpersonforløb og mentorforløb til kommuner',
  provider: { '@type': 'Organization', name: 'Kursskifte ApS', url: 'https://kursskifte.dk' },
  description:
    'Kursskifte leverer mentor-, støtte- og kontaktpersonforløb til kommuner og jobcentre i Nordjylland — §32 barnets lov, §85 serviceloven og beskæftigelsesrettede mentorordninger.',
  areaServed: [
    { '@type': 'City', name: 'Aalborg' },
    { '@type': 'City', name: 'Hjørring' },
    { '@type': 'City', name: 'Brønderslev' },
    { '@type': 'City', name: 'Frederikshavn' },
  ],
  serviceType: 'Socialpædagogisk kontaktpersonforløb og mentorforløb',
}

export default function KommunerPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <PublicNav />
      <main>

        {/* Hero */}
        <section className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center overflow-hidden bg-gradient-to-br from-[#0F2218] via-[#1C3829] to-[#2D5840]">

          {/* Tekst */}
          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28 w-full">
            <div className="max-w-xl">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-5 h-px bg-[#C8993A]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Til kommuner og jobcentre</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] text-white font-normal mb-5 leading-[1.08] tracking-tight">
                Én henvendelse.<br />Et fagligt begrundet forslag.
              </h1>
              <p className="text-[17px] text-white/75 leading-relaxed mb-8 max-w-lg">
                Kursskifte leverer mentor-, støtte- og kontaktpersonforløb til kommuner og jobcentre i Nordjylland. Visitation og bevilling foretages af kommunen — vi leverer den konkrete indsats.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:info@kursskifte.dk"
                  className="h-12 px-6 bg-[#C8993A] text-white font-semibold text-sm rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
                >
                  Kontakt os <ArrowRight />
                </a>
                <Link
                  href="/kontakt"
                  className="h-12 px-6 border border-white/30 text-white font-semibold text-sm rounded-xl hover:bg-white/10 hover:border-white/50 transition-colors inline-flex items-center gap-2"
                >
                  Se kontaktoplysninger
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Core message */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'I kontakter — vi finder',
                  body: 'I behøver ikke gennemse en database af fagpersoner. Send os behovet, og vi finder de rette kandidater ud fra kompetencer, kapacitet og erfaring.',
                },
                {
                  title: 'Vi klarer koordineringen',
                  body: 'Opstart, aftaler, statusnotater og løbende opfølgning håndteres af Kursskifte. Kommunen modtager et klart forslag og kan koncentrere sig om borgeren.',
                },
                {
                  title: 'Faglig kvalitetssikring',
                  body: 'Alle kontaktpersoner og mentorer er dokumenteret og verificeret — straffeattest, børneattest, CV og uddannelse kontrolleres inden aktivering.',
                },
              ].map(c => (
                <div key={c.title} className="bg-[#F6F3EE] rounded-2xl p-6">
                  <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{c.title}</h3>
                  <p className="text-xs text-[#6B7569] leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Sådan arbejder vi</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal">
              Fra henvendelse til opstart
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STEPS.map(step => (
              <div key={step.n} className="bg-white border border-[#E0DAD0] rounded-2xl p-6">
                <div className="font-serif text-2xl text-[#C8993A] mb-3">{step.n}</div>
                <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{step.title}</h3>
                <p className="text-xs text-[#6B7569] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ydelser */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="mb-10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-5 h-px bg-[#C8993A]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Ydelser</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal mb-3">
                Hvad vi kan levere
              </h2>
              <p className="text-sm text-[#6B7569] max-w-lg">
                Alle indsatser tilpasses individuelt og leveres efter konkret aftale med kommunen eller jobcentret. Visitation og myndighedsafgørelse foretages altid af bestiller.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {YDELSER.map(y => (
                <div key={y.title} className="bg-[#F6F3EE] border border-[#E0DAD0] rounded-2xl p-6">
                  <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{y.title}</h3>
                  <p className="text-xs text-[#6B7569] leading-relaxed mb-3">{y.desc}</p>
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#C8993A] bg-[#FBF3E1] px-2 py-1 rounded-md">{y.para}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typiske forløb */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Typiske forløb</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal mb-3">
              Hvem hjælper vi?
            </h2>
            <p className="text-sm text-[#6B7569] max-w-lg">
              Eksempler på borgerprofiler vi typisk arbejder med. Har din sag et lignende udgangspunkt, er du velkommen til at kontakte os.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                para: '§32 barnets lov',
                title: 'Ung med skolevægring og social isolation',
                body: 'Teenager der er faldet ud af skolen, har svært ved at fastholde relationer og har brug for en stabil voksen med udgangspunkt i hverdagen. Kontaktpersonen mødes 2–4 gange ugentlig.',
              },
              {
                para: '§85 serviceloven',
                title: 'Voksen med psykiske udfordringer og behov for daglig struktur',
                body: 'Borger med angst eller depression der har svært ved at overholde aftaler, passe bolig og klare hverdagens krav. Støtten er praktisk og relationsbaseret — ikke behandling.',
              },
              {
                para: '§32 barnets lov / beskæftigelsesrettet',
                title: 'Ung i overgang til uddannelse eller praktik',
                body: 'Ung voksen (17–25 år) der har brug for en mentor til at navigere overgangen fra anbringelse, støttet botilbud eller grundskole til uddannelse, praktik eller job.',
              },
              {
                para: '§85 SEL / beskæftigelsesrettet',
                title: 'Borger med ADHD og ustabilt fremmøde',
                body: 'Voksen med opmærksomhedsvanskeligheder der gentagne gange mister fodfæstet på uddannelse eller arbejdsmarkedet. Mentor hjælper med struktur, motivation og opfølgning.',
              },
              {
                para: '§32 barnets lov / §85 serviceloven',
                title: 'Tosproget borger eller borger med anden etnisk baggrund',
                body: 'Borger hvor tillid, kommunikation og kulturel forståelse er afgørende for forløbet. Vi matcher på sprogkompetencer og kulturel indsigt — ikke kun faglig profil.',
              },
              {
                para: '§32 barnets lov / §85 serviceloven',
                title: 'Kriminalitetstruet ung eller person der ønsker exit fra bandemiljø',
                body: 'Ung eller voksen der befinder sig i eller tæt på et kriminelt miljø og har brug for en stabil, troværdig relation uden for det. Kontaktpersonen fungerer som alternativ tilknytning i en sårbar overgangsperiode — koordineret tæt med kommunen og SSP.',
              },
            ].map(c => (
              <div key={c.title} className="bg-white border border-[#E0DAD0] rounded-2xl p-6 flex flex-col gap-3">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#C8993A] bg-[#FBF3E1] px-2 py-1 rounded-md self-start">{c.para}</span>
                <h3 className="font-semibold text-sm text-[#1A1F1C] leading-snug">{c.title}</h3>
                <p className="text-xs text-[#6B7569] leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9B9590] mt-6">Alle profiler er generiske og anonymiserede — de illustrerer typiske behovsbilleder, ikke konkrete sager.</p>
        </section>

        {/* Afgrænsning */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-px bg-[#C8993A]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvad vi håndterer</span>
                </div>
                <h2 className="font-serif text-3xl text-[#1A1F1C] font-normal mb-4">Vores rolle i samarbejdet</h2>
                <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
                  Kursskifte leverer den konkrete støtte- og mentorindsats. Visitation, bevilling og myndighedsafgørelse foretages altid af kommunen eller det relevante jobcenter.
                </p>
                <div className="bg-[#EEF4F0] border border-[#C8DDD1] rounded-xl p-4 mb-6">
                  <p className="text-xs text-[#1C3829] font-semibold mb-1">Databehandleraftale (DPA)</p>
                  <p className="text-xs text-[#3A4F40] leading-relaxed">
                    Kursskifte behandler personoplysninger som databehandler på vegne af kommunen. En standard databehandleraftale er klar og kan rekvireres ved første henvendelse.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    'Matching og faglig anbefaling',
                    'Opstartsmøde og målbeskrivelse',
                    'Løbende dokumentation og statusnotater',
                    'Koordinering med relevante aktører',
                    'Fast opfølgning under hele forløbet',
                    'Håndtering af bekymringer og forværring',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckGreen />
                      <span className="text-sm text-[#1A1F1C]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-6">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#92660A] mb-4">Kursskifte er ikke</div>
                <div className="space-y-3">
                  {[
                    'Behandlingstilbud eller psykiatrisk tilbud',
                    'Botilbud eller døgntilbud',
                    'Døgnberedskab eller akut krisetjeneste',
                    'Myndighedsinstans — vi visiterer ikke',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span className="text-sm text-[#92660A]">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#B45309] mt-5 leading-relaxed">
                  Ved behov for behandling, akut psykiatrisk hjælp eller myndighedsafgørelse henviser vi til relevante offentlige instanser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="bg-[#1C3829] rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-2">Klar til at tage kontakt?</h2>
              <p className="text-sm text-white/65">Send en e-mail — vi vender hurtigt tilbage.</p>
            </div>
            <div className="flex flex-col gap-3 items-start shrink-0">
              <a
                href="mailto:info@kursskifte.dk"
                className="h-11 px-6 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
              >
                Send e-mail <ArrowRight />
              </a>
              <div className="flex flex-col gap-1.5">
                <a href="mailto:info@kursskifte.dk" className="text-xs text-white/60 hover:text-white/90 transition-colors">info@kursskifte.dk</a>
                <a href="tel:+4571420376" className="text-xs text-white/60 hover:text-white/90 transition-colors">71 42 03 76</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
