import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Foredrag til skoler | Kursskifte',
  description:
    'Kursskifte tilbyder gratis foredrag til folkeskoler og gymnasier om at skifte kurs — om at søge hjælp, finde retningen og hvad sociale støtteordninger kan gøre for unge i mistrivsel.',
  alternates: { canonical: '/foredrag' },
  openGraph: {
    title: 'Foredrag til skoler | Kursskifte',
    description:
      'Gratis foredrag til folkeskoler og gymnasier om trivsel, hjælp og at skifte kurs. Book via info@kursskifte.dk.',
    url: '/foredrag',
  },
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

const FORMATS = [
  {
    target: 'Folkeskole',
    grade: '8.–10. klasse',
    duration: '45 min',
    focus: 'Det er okay at have det svært — og hvad du kan gøre ved det',
    points: [
      'Hvad er en kontaktperson og hvornår kan man få hjælp',
      'Rigtige historier om unge der skiftede kurs',
      'Hvad gør man hvis man ikke ved hvem man skal snakke med',
    ],
  },
  {
    target: 'Gymnasium',
    grade: 'Alle årgange',
    duration: '45–60 min',
    focus: 'Presset om at have styr på fremtiden — og hvad det koster ikke at søge hjælp',
    points: [
      'Systemet bag: hvad kommunen kan tilbyde',
      'Karrierevej som kontaktperson eller fagperson',
      'Hvordan man genkender mistrivsel hos sig selv og andre',
    ],
  },
]

const STEPS = [
  { n: '01', title: 'Send en mail', body: 'Skriv til info@kursskifte.dk med skolens navn og ønskede tidspunkt. Vi vender tilbage inden for 2 arbejdsdage.' },
  { n: '02', title: 'Vi tilpasser', body: 'Foredraget tilpasses jeres klassetrin og aktuelle fokus — trivselsindsats, karrieredag eller klassens time.' },
  { n: '03', title: 'Vi møder op', body: 'Kursskifte varetager alt. I skal ikke forberede noget. Foredraget er gratis.' },
]

export default function ForedragPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Foredrag</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-2xl mb-5 leading-tight tracking-tight">
            Det er okay at skifte kurs
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl mb-8">
            Kursskifte tilbyder gratis foredrag til folkeskoler og gymnasier — om trivsel, om at søge hjælp og om hvad det vil sige at skifte retning. Foredraget passer ind i trivselsuger, karrieredage og klassens time.
          </p>
          <Link
            href="/kontakt"
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors"
          >
            Book et foredrag <ArrowRight />
          </Link>
        </section>

        {/* Formats */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">To formater</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FORMATS.map(f => (
                <div key={f.target} className="bg-[#F6F3EE] border border-[#E0DAD0] rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-serif text-2xl text-[#1A1F1C]">{f.target}</span>
                    <span className="text-xs text-[#6B7569] border border-[#E0DAD0] rounded-full px-2.5 py-0.5">{f.grade}</span>
                    <span className="text-xs text-[#6B7569] border border-[#E0DAD0] rounded-full px-2.5 py-0.5">{f.duration}</span>
                  </div>
                  <p className="text-sm font-medium text-[#1C3829] mb-4 leading-snug">{f.focus}</p>
                  <ul className="space-y-2">
                    {f.points.map(p => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-[#6B7569]">
                        <div className="w-1 h-1 rounded-full bg-[#C8993A] mt-2 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compass quote */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Budskabet</span>
            </div>
            <blockquote className="font-serif text-2xl sm:text-3xl text-[#1A1F1C] font-normal leading-snug mb-6">
              "Alle mister retningen engang imellem. Det handler ikke om at vide svaret — det handler om at turde spørge om hjælp."
            </blockquote>
            <p className="text-sm text-[#6B7569] leading-relaxed">
              Foredraget er ikke en salgstale. Det er en samtale med unge om noget de allerede kender — presset, usikkerheden og spørgsmålet om hvad der sker hvis man ikke har styr på fremtiden. Kursskifte nævnes kort til sidst som en del af det system der findes til at hjælpe.
            </p>
          </div>
        </section>

        {/* How to book */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Sådan booker I</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {STEPS.map(s => (
                <div key={s.n} className="flex flex-col gap-3">
                  <span className="font-serif text-3xl text-[#E0DAD0]">{s.n}</span>
                  <h3 className="font-serif text-lg text-[#1A1F1C] font-normal">{s.title}</h3>
                  <p className="text-sm text-[#6B7569] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1C3829]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-serif text-2xl text-white font-normal mb-1">Book et gratis foredrag</h2>
                <p className="text-sm text-white/60">Vi tilpasser, møder op og tager os af det hele. Ingen forberedelse kræves af skolen.</p>
              </div>
              <Link
                href="mailto:info@kursskifte.dk?subject=Foredrag til vores skole"
                className="h-10 px-5 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#b8872e] transition-colors inline-flex items-center gap-2 flex-shrink-0"
              >
                Skriv til os <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  )
}
