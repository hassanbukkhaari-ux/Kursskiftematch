import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

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

// ── Section 1: Orient ──────────────────────────────────────────
// Single headline, one-sentence subtitle. Both audiences get proper
// buttons — municipality is primary through button hierarchy (filled
// vs. outlined), not by hiding the professional path.
function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-5 h-px bg-[#C8993A]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kursskifte Match</span>
      </div>
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] leading-[1.08] text-[#1A1F1C] font-normal max-w-2xl mb-5 tracking-tight">
        Kvalitetssikrede kontaktpersoner til kommunernes borgere
      </h1>
      <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-lg mb-8">
        Indsend en sag. Kursskifte vurderer, matcher og sender et fagligt begrundet forslag retur.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/intake"
          className="h-12 px-6 bg-[#1C3829] text-white font-semibold text-sm rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
        >
          Indsend sag <ArrowRight />
        </Link>
        <Link
          href="/kontaktpersoner"
          className="h-12 px-6 border border-[#C8DDD1] text-[#1C3829] font-semibold text-sm rounded-xl hover:bg-[#EEF4F0] hover:border-[#A8CBBB] transition-colors inline-flex items-center gap-2"
        >
          Bliv kontaktperson
        </Link>
      </div>
    </section>
  )
}

// ── Section 2: Direct ──────────────────────────────────────────
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
              Send én sag.<br />Få et fagligt begrundet forslag.
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              Ingen databaser at gennemse. Kursskifte finder, verificerer og foreslår den rette kontaktperson.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/intake"
              className="h-10 px-5 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
            >
              Indsend sag <ArrowRight />
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
              Bliv matchet med forløb der passer til dig.
            </h2>
            <p className="text-sm text-[#6B7569] leading-relaxed max-w-sm">
              Opret profil, angiv kapacitet — Kursskifte matcher dig med sager baseret på dine kompetencer.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
            >
              Opret profil <ArrowRight />
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

// ── Section 3: Reduce friction ─────────────────────────────────────
// Municipalities need to know what happens after 'Indsend sag' before
// they commit. 5-step summary answers that question without the full
// detail that lives on /kommuner. No CTA here — purely informational.
const STEPS = [
  { n: '01', title: 'I indsender sagen', body: 'Sikkert via platformen — ingen åben database at gennemse.' },
  { n: '02', title: 'Kursskifte vurderer', body: 'Vi gennemgår kompleksitet, aldersgruppe og kompetencebehov.' },
  { n: '03', title: 'Platformen matcher', body: 'Kandidater scores på kompetencer, kapacitet og tilgængelighed.' },
  { n: '04', title: 'I modtager forslag', body: 'Et fagligt begrundet forslag med anbefalet kontaktperson.' },
  { n: '05', title: 'Opstart og opfølgning', body: 'Kursskifte koordinerer opstarten og følger løbende op.' },
]

function ProcessSection() {
  return (
    <section className="bg-white border-y border-[#E0DAD0]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {STEPS.map(step => (
            <div key={step.n}>
              <div className="font-serif text-xl text-[#C8993A] mb-3">{step.n}</div>
              <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2 leading-snug">{step.title}</h3>
              <p className="text-xs text-[#6B7569] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section 4: Build credibility ──────────────────────────────────
// 4 factual trust signals placed after the process, before the final
// ask. Relevant to both audiences: municipalities need supplier trust,
// professionals need platform trust. No CTA — this section earns it.
const TRUST_ITEMS = [
  {
    label: 'Verificerede fagpersoner',
    desc: 'Dokumenter, certifikater og attester kontrolleres manuelt inden aktivering.',
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
    label: 'Aktiv opfølgning',
    desc: 'Kursskifte er tilgængelig og følger aktivt op under hele forløbets varighed.',
  },
]

function TrustSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-5 h-px bg-[#C8993A]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kvalitet og sikkerhed</span>
      </div>
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
              Klar til at indsende en sag?
            </h2>
            <p className="text-sm text-white/55">Det tager få minutter. Vi vender tilbage hurtigt.</p>
          </div>
          <div className="flex flex-col items-start gap-3 shrink-0">
            <Link
              href="/intake"
              className="h-11 px-6 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
            >
              Indsend sag <ArrowRight />
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

export default async function Home() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (user) {
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
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
