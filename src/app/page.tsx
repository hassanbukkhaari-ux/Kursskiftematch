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

// Job: Orient. One headline, one subtitle, primary action visible immediately.
// Secondary audience (fagpersoner) is a text link — not an equal button — because
// the primary user landing here is a municipality worker.
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
      <div className="flex flex-wrap items-center gap-5">
        <Link
          href="/intake"
          className="h-12 px-6 bg-[#1C3829] text-white font-semibold text-sm rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
        >
          Indsend sag <ArrowRight />
        </Link>
        <Link
          href="/kontaktpersoner"
          className="text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors"
        >
          Er du fagperson? →
        </Link>
      </div>
    </section>
  )
}

// Job: Direct. Two audiences, two paths. No bullet lists — this is navigation,
// not persuasion. Each panel has one action and one secondary link to the sub-page
// for visitors who want depth before committing.
function AudiencePaths() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#1C3829] rounded-2xl p-8 sm:p-10 lg:p-12 flex flex-col justify-between gap-10">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-5">Til kommuner</div>
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug mb-4 max-w-xs">
              Send én sag. Få et fagligt begrundet forslag.
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
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-5">Til fagpersoner</div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1F1C] font-normal leading-snug mb-4 max-w-xs">
              Bliv matchet med relevante forløb.
            </h2>
            <p className="text-sm text-[#6B7569] leading-relaxed max-w-sm">
              Opret profil, angiv kapacitet — Kursskifte matcher dig med sager der passer til dine kompetencer.
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
              Læs mere →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Job: Differentiate. Three specific reasons to choose Kursskifte over the alternative
// (manual database browsing + internal coordination). One sentence each. No cards,
// no icons — just clean typography. Visitors who want more depth follow sub-page links.
const DIFFERENTIATORS = [
  {
    n: '01',
    label: 'Ingen åben database',
    desc: 'Kommunen sender sagen direkte til Kursskifte. Vi finder kandidaterne — ingen manuel gennemgang.',
  },
  {
    n: '02',
    label: 'Fagligt begrundet matching',
    desc: 'Platformen scorer fagpersoner på kompetencer, kapacitet og tilgængelighed. Forslaget er altid begrundet.',
  },
  {
    n: '03',
    label: 'Fuldt administreret',
    desc: 'Takst, dokumentation og løbende opfølgning håndteres af Kursskifte fra opstart til afslutning.',
  },
]

function Differentiators() {
  return (
    <section className="border-y border-[#E0DAD0] bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-5 h-px bg-[#C8993A]" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Det klarer Kursskifte</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-12">
          {DIFFERENTIATORS.map(d => (
            <div key={d.n}>
              <div className="font-serif text-2xl text-[#C8993A] mb-4">{d.n}</div>
              <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{d.label}</h3>
              <p className="text-xs text-[#6B7569] leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Job: Convert. One primary action. One secondary text link for fagpersoner.
// No duplication of anything above.
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
        <Differentiators />
        <CtaStrip />
      </main>
      <PublicFooter />
    </div>
  )
}
