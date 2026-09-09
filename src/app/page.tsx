import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Kursskifte | Kvalitetssikrede kontaktpersoner til kommuner',
  description:
    'Kursskifte matcher kommuner med kvalitetssikrede kontaktpersoner til §32 og §85-forløb. Vi varetager sagsvurdering, match og faglig anbefaling — struktureret og dokumenteret. Vi betjener kommuner i Nordjylland.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Kursskifte | Kvalitetssikrede kontaktpersoner til kommuner',
    description:
      'Kursskifte matcher kommuner med kvalitetssikrede kontaktpersoner til §32 og §85-forløb. Vi betjener kommuner i Nordjylland — Aalborg, Hjørring, Brønderslev og Frederikshavn.',
    url: '/',
  },
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function CheckBadge() {
  return (
    <div className="w-6 h-6 rounded-md bg-[#EEF4F0] flex items-center justify-center shrink-0">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative min-h-[620px] sm:min-h-[680px] lg:min-h-[740px] flex items-center overflow-hidden">
      <Image
        src="/images/hero-home.jpg.jpg"
        alt="To unge mennesker i samtale ved en sø i solnedgang"
        fill
        className="object-cover object-[60%_center]"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F2218]/80 via-[#1C3829]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F2218]/30 via-transparent to-transparent" />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32 w-full">
        <div className="max-w-xl">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kursskifte</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] leading-[1.08] text-white font-normal max-w-2xl mb-5 tracking-tight">
            Kvalitetssikrede kontaktpersoner til kommunernes borgere
          </h1>
          <p className="text-[17px] text-white/75 leading-relaxed max-w-lg mb-8">
            Vi leverer mentor-, støtte- og kontaktpersonforløb til kommuner og jobcentre i Nordjylland. Én henvendelse — Kursskifte varetager match, opstart og opfølgning.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/kontakt"
              className="h-12 px-6 bg-[#C8993A] text-white font-semibold text-sm rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
            >
              Kontakt os <ArrowRight />
            </Link>
            <Link
              href="/kontaktpersoner"
              className="h-12 px-6 border border-white/30 text-white font-semibold text-sm rounded-xl hover:bg-white/10 hover:border-white/50 transition-colors inline-flex items-center gap-2"
            >
              Bliv kontaktperson
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 2: Direct ────────────────────────────────────────────
// Two equal-weight panels — each audience gets its own path with a
// primary action and a secondary link to the sub-page for those who
// want depth before committing. No bullet lists; this is navigation.
function AudiencePaths() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#1C3829] rounded-2xl p-8 sm:p-10 lg:p-12 flex flex-col justify-between gap-10">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-5">Til kommuner</div>
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug mb-4 max-w-xs">
              Én henvendelse.<br />Et fagligt begrundet forslag.
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              Kursskifte varetager match, verifikation og faglig anbefaling til §32 og §85-forløb — sikkert og dokumenteret. Vi betjener kommuner i Nordjylland.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/kontakt"
              className="h-10 px-5 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
            >
              Tag kontakt <ArrowRight />
            </Link>
            <Link href="/kommuner" className="text-sm text-white/50 hover:text-white/80 transition-colors">
              Se hele processen →
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-8 sm:p-10 lg:p-12 flex flex-col justify-between gap-10">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-5">Til kontaktpersoner</div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1F1C] font-normal leading-snug mb-4 max-w-xs">
              Bliv tilknyttet forløb der svarer til dine kompetencer.
            </h2>
            <p className="text-sm text-[#6B7569] leading-relaxed max-w-sm">
              Opret profil, angiv kapacitet — vi kobler dig med sager der svarer til din faglige baggrund og erfaring.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/kontaktpersoner"
              className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
            >
              Bliv kontaktperson <ArrowRight />
            </Link>
            <Link href="/kontaktpersoner" className="text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">
              Læs om processen →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 3: Reduce friction ───────────────────────────────────
// Municipalities need to know what happens after "Indsend sag" before
// they commit. 5-step summary answers that question without the full
// detail that lives on /kommuner. No CTA here — purely informational.
const STEPS = [
  { n: '01', title: 'I kontakter os', body: 'Send en e-mail til info@kursskifte.dk eller ring på 71 42 03 76 — ingen åben database at gennemse.' },
  { n: '02', title: 'Kursskifte vurderer', body: 'Vi gennemgår kompleksitet, aldersgruppe og kompetencebehov.' },
  { n: '03', title: 'Kursskifte udvælger', body: 'Egnede fagpersoner identificeres og vurderes på kompetencer, kapacitet og tilgængelighed.' },
  { n: '04', title: 'I modtager forslag', body: 'Et dokumenteret forslag med anbefalet kontaktperson og faglig begrundelse.' },
  { n: '05', title: 'Opstart og opfølgning', body: 'Kursskifte koordinerer opstart og er ansvarlig samarbejdspartner under hele forløbet.' },
]

function ProcessSection() {
  return (
    <section className="bg-white border-y border-[#E0DAD0]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Processen</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1F1C] font-normal">
              Fra sag til kontaktperson
            </h2>
          </div>
          <Link
            href="/kommuner"
            className="text-sm font-semibold text-[#1C3829] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Se hele processen <ArrowRight />
          </Link>
        </div>

        <div className="space-y-4">
          {/* Række 1: trin 1–3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.slice(0, 3).map(step => (
              <div key={step.n} className="bg-[#F6F3EE] rounded-2xl p-6 flex flex-col gap-3">
                <div className="font-serif text-3xl text-[#C8993A] leading-none">{step.n}</div>
                <h3 className="font-semibold text-base text-[#1A1F1C] leading-snug">{step.title}</h3>
                <p className="text-sm text-[#3A3F3C] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
          {/* Række 2: trin 4–5 + CTA-kort */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.slice(3).map(step => (
              <div key={step.n} className="bg-[#F6F3EE] rounded-2xl p-6 flex flex-col gap-3">
                <div className="font-serif text-3xl text-[#C8993A] leading-none">{step.n}</div>
                <h3 className="font-semibold text-base text-[#1A1F1C] leading-snug">{step.title}</h3>
                <p className="text-sm text-[#3A3F3C] leading-relaxed">{step.body}</p>
              </div>
            ))}
            {/* CTA-kort fylder det ledige hjørne */}
            <div className="bg-[#1C3829] rounded-2xl p-6 flex flex-col justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">Klar til at starte?</p>
                <p className="text-white font-serif text-lg leading-snug">Én e-mail er alt der skal til.</p>
              </div>
              <div className="flex flex-col gap-2">
                <a href="mailto:info@kursskifte.dk" className="text-sm text-white/70 hover:text-white transition-colors">info@kursskifte.dk</a>
                <a href="tel:+4571420376" className="text-sm text-white/70 hover:text-white transition-colors">71 42 03 76</a>
                <Link href="/kontakt" className="mt-2 h-9 px-4 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-1.5 self-start">
                  Kontakt os <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section 4: Build credibility ─────────────────────────────────
// 4 factual trust signals placed after the process, before the final
// ask. Relevant to both audiences: municipalities need supplier trust,
// professionals need platform trust. No CTA — this section earns it.
const TRUST_ITEMS = [
  {
    label: 'Verificerede fagpersoner',
    desc: 'Straffeattest, børneattest, CV og uddannelsesdokumentation kontrolleres individuelt inden aktivering.',
  },
  {
    label: 'Dokumenteret forløb',
    desc: 'Sessionslogs, timeregistrering og forløbsoversigt samlet i platformen.',
  },
  {
    label: 'GDPR-compliant',
    desc: 'Persondata behandles sikkert i overensstemmelse med dansk og europæisk lovgivning.',
  },
  {
    label: 'Ansvarlig samarbejdspartner',
    desc: 'Kursskifte er fast koordinator under hele forløbet — ikke blot en formidler.',
  },
]

function TrustSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-5 h-px bg-[#C8993A]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kvalitet og sikkerhed</span>
      </div>
      <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1F1C] font-normal mb-10">Vores forpligtelse</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TRUST_ITEMS.map(item => (
          <div key={item.label} className="bg-white border border-[#E0DAD0] rounded-xl p-5">
            <CheckBadge />
            <h3 className="font-semibold text-sm text-[#1A1F1C] mt-3 mb-1.5">{item.label}</h3>
            <p className="text-xs text-[#6B7569] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Section 5: Convert ───────────────────────────────────────────
// Single primary action after full context is established. Professional
// path acknowledged at low visual weight — municipality is the CTA.
function CtaStrip() {
  return (
    <section className="bg-[#1C3829]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-2">
              Klar til at tage kontakt?
            </h2>
            <p className="text-sm text-white/55 mb-2">Send en e-mail — vi vender typisk tilbage inden for én arbejdsdag.</p>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:info@kursskifte.dk" className="text-sm text-white/70 hover:text-white transition-colors">info@kursskifte.dk</a>
              <a href="tel:+4571420376" className="text-sm text-white/70 hover:text-white transition-colors">71 42 03 76</a>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 shrink-0">
            <Link
              href="/kontakt"
              className="h-11 px-6 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
            >
              Kontakt os <ArrowRight />
            </Link>
            <Link href="/kontaktpersoner" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Er du fagperson? Bliv kontaktperson →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kursskifte ApS',
    url: 'https://kursskifte.dk',
    description:
      'Kursskifte forbinder kommuner med kvalitetssikrede kontaktpersoner til §32 og §85-forløb — socialpædagogisk støtte, bostøtte og relationsbaseret indsats til borgere i mistrivsel i Nordjylland.',
    email: 'info@kursskifte.dk',
    areaServed: [
      { '@type': 'City', name: 'Aalborg' },
      { '@type': 'City', name: 'Hjørring' },
      { '@type': 'City', name: 'Brønderslev' },
      { '@type': 'City', name: 'Frederikshavn' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'kommuner@kursskifte.dk',
      contactType: 'customer service',
      availableLanguage: 'Danish',
    },
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <PublicNav />
      <main>
        <Hero />
        <AudiencePaths />
        <ProcessSection />
        <TrustSection />
        <CtaStrip />
      </main>
      <PublicFooter />
    </div>
  )
}
