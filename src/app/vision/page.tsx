import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Vores vision | Kursskifte',
  description:
    'Kursskiftes vision er ikke kun at stoppe mistrivsel og kriminalitet blandt børn og unge — men at bygge en vej til beskæftigelse og et voksenliv, hvor de bidrager til samfundet på lige fod med alle andre.',
  alternates: { canonical: '/vision' },
  openGraph: {
    title: 'Vores vision | Kursskifte',
    description:
      'Vejen fra mistrivsel til beskæftigelse — Kursskiftes langsigtede vision for de børn og unge vi hjælper.',
    url: '/vision',
  },
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

const BRIDGE_STEPS = [
  {
    step: '01',
    title: 'Tidlig, stabil relation',
    body: 'En kontaktperson der bliver ved — ikke en midlertidig indsats, men en tryg relation over tid.',
  },
  {
    step: '02',
    title: 'Stabilitet i hverdagen',
    body: 'Struktur, tillid og en voksen der ser barnet eller den unge — grundlaget for at kunne rette blikket fremad.',
  },
  {
    step: '03',
    title: 'Uddannelse og oplæring',
    body: 'Når trivslen er på plads, bliver skole, praktik eller uddannelse en reel mulighed — ikke en kamp.',
  },
  {
    step: '04',
    title: 'Beskæftigelse og bidrag',
    body: 'Målet er et voksenliv i job — hvor den unge bidrager til samfundet på lige fod med alle andre.',
  },
]

export default function VisionPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Vores vision</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-2xl mb-6 leading-tight tracking-tight">
            Det er ikke nok at stoppe mistrivslen
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-2xl">
            For os handler kontaktpersonforløb ikke kun om at få børn og unge ud af mistrivsel eller væk fra kriminalitet her og nu. Vores vision er større: at de børn og unge vi hjælper, som voksne kommer i beskæftigelse og bidrager til samfundet på lige fod med alle andre. Ikke som en undtagelse — men som det naturlige udfald af den rigtige støtte i tide.
          </p>
        </section>

        {/* SDG anchor */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
              <div className="w-20 h-20 rounded-2xl bg-[#1C3829] flex items-center justify-center flex-shrink-0">
                <span className="font-serif text-2xl font-semibold text-[#C8993A]">08</span>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">FN's Verdensmål 8</div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1F1C] font-normal mb-3">
                  Anstændige jobs og økonomisk vækst
                </h2>
                <p className="text-sm text-[#6B7569] leading-relaxed max-w-2xl">
                  Vores vision er forankret i FN's Verdensmål 8, som blandt andet handler om at fremme fuld og produktiv beskæftigelse for alle. Vi ser hvert kontaktpersonforløb som et lille, konkret bidrag til det mål — én relation, én stabil hverdag og ét skridt tættere på uddannelse eller job ad gangen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="mb-10 max-w-2xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvorfor det betyder noget</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal mb-4">
              Fra mistrivsel til uddannelse er ikke et automatisk spring
            </h2>
            <p className="text-sm text-[#6B7569] leading-relaxed">
              Børn og unge der vokser op i mistrivsel eller udsatte positioner, ender statistisk oftere i gruppen af unge uden uddannelse eller beskæftigelse — ofte kaldet NEET-gruppen. Det er ikke fordi de ikke vil — det er fordi de ikke kan, før der er en form for stabilitet i deres liv, som mange af dem aldrig har haft mulighed for at opbygge. Det er dér, en stabil kontaktperson gør en reel forskel.
            </p>
          </div>
        </section>

        {/* The bridge */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Sådan bygger vi broen</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal mb-10 max-w-2xl">
              Fra relation til beskæftigelse
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BRIDGE_STEPS.map(s => (
                <div key={s.step} className="bg-[#F6F3EE] rounded-2xl p-6">
                  <div className="font-serif text-2xl text-[#C8993A] mb-3">{s.step}</div>
                  <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{s.title}</h3>
                  <p className="text-xs text-[#6B7569] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#EDE9E1] border-t border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-1">Vil du vide mere om vores metode?</h2>
                <p className="text-sm text-[#6B7569]">Se hvordan vi arbejder med kommuner og kontaktpersoner i praksis.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/om-kursskifte" className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2">
                  Om Kursskifte <ArrowRight />
                </Link>
                <Link href="/kontakt" className="h-10 px-5 border border-[#1C3829] text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#EEF4F0] transition-colors inline-flex items-center gap-2">
                  Kontakt os <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
