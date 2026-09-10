import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Foredrag til skoler og SSP | Kursskifte',
  description:
    'Kursskifte holder foredrag til folkeskoler, gymnasier og SSP-samarbejder om unge i kriminalitetstruede miljøer — om at stå ved et vendepunkt og skifte kurs mens det er muligt. Ærlige historier. Gratis.',
  alternates: { canonical: '/foredrag' },
  openGraph: {
    title: 'Foredrag til skoler og SSP | Kursskifte',
    description:
      'Gratis foredrag til skoler og SSP om unge ved et vendepunkt — kriminalitet, fællesskab og hvad det kræver at skifte kurs. Book via info@kursskifte.dk.',
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

const AUDIENCES = [
  {
    who: 'Skoler',
    sub: 'Folkeskole & gymnasium',
    description: 'Et foredrag der ikke moraliserer — men som viser virkelige situationer unge kender igen. Hvornår begynder det at gå galt, og hvad skal der til for at vende den.',
    fit: 'Trivselsuger, klassens time, SSP-dage',
  },
  {
    who: 'SSP',
    sub: 'Skole · Socialforvaltning · Politi',
    description: 'Kursskifte arbejder med unge der allerede er i udkanten. Vi kan bidrage i SSP-samarbejdet med et ærligt perspektiv fra fagpersoner der kender miljøerne.',
    fit: 'Temadage, forældrearrangementer, netværksmøder',
  },
  {
    who: 'Kommuner',
    sub: 'Forebyggelsesindsatser',
    description: 'Et supplement til eksisterende forebyggelsesindsatser. Vi taler om hvad tidlig hjælp faktisk gør — og hvad det koster ikke at handle mens det stadig er muligt.',
    fit: 'Ungdomskriminalitetsnævn, UU-vejledning, §52-møder',
  },
]

const WHAT_WE_TALK_ABOUT = [
  {
    heading: 'Det forkerte fællesskab',
    body: 'Mange unge ender ikke i kriminalitet fordi de vil — men fordi det er det fællesskab der er tilgængeligt. Vi taler om hvordan det sker, og hvad der kan trække i en anden retning.',
  },
  {
    heading: 'Vendepunktet',
    body: 'Der er altid et øjeblik hvor det kan gå begge veje. Vi bruger rigtige historier — anonymiserede — om unge der stod der, og hvad der fik dem til at skifte kurs.',
  },
  {
    heading: 'Hvad systemet kan',
    body: 'Kontaktpersoner, støtte, rådgivning — det eksisterer. Men mange unge ved det ikke, eller tror det ikke er for dem. Vi fortæller hvad det rent faktisk er, uden at gøre det til en salgstale.',
  },
  {
    heading: 'Det er ikke for sent',
    body: 'Foredraget slutter ikke med en liste over konsekvenser. Det slutter med muligheder — og med at skifte retning er muligt, uanset hvad der er sket.',
  },
]

const STEPS = [
  { n: '01', title: 'Skriv til os', body: 'Send en mail til info@kursskifte.dk med skolens eller organisationens navn og et ønsket tidspunkt. Vi vender tilbage inden for 2 arbejdsdage.' },
  { n: '02', title: 'Vi tilpasser', body: 'Foredraget tilpasses jeres målgruppe — om det er 8. klasse, gymnasieelever eller et SSP-møde med fagpersoner. Fokus og tone tilpasses.' },
  { n: '03', title: 'Vi møder op', body: 'Kursskifte klarer alt. Ingen forberedelse kræves. Foredraget er gratis.' },
]

export default function ForedragPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-14 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Foredrag</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-2xl mb-5 leading-tight tracking-tight">
            Skifte kurs mens det er muligt
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl mb-3">
            Kursskifte holder foredrag til skoler, gymnasier og SSP-samarbejder om unge i kriminalitetstruede miljøer — om vendepunktet, om det forkerte fællesskab, og om hvad det faktisk kræver at gå en anden vej.
          </p>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl mb-8">
            Ingen moralisering. Rigtige historier. Gratis.
          </p>
          <Link
            href="mailto:info@kursskifte.dk?subject=Foredrag til vores skole/SSP"
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors"
          >
            Book et foredrag <ArrowRight />
          </Link>
        </section>

        {/* Who it's for */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvem er det til</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AUDIENCES.map(a => (
                <div key={a.who} className="bg-[#F6F3EE] border border-[#E0DAD0] rounded-2xl p-7 flex flex-col gap-4">
                  <div>
                    <span className="font-serif text-2xl text-[#1A1F1C] block mb-0.5">{a.who}</span>
                    <span className="text-xs text-[#C8993A] font-medium uppercase tracking-wider">{a.sub}</span>
                  </div>
                  <p className="text-sm text-[#6B7569] leading-relaxed flex-1">{a.description}</p>
                  <div className="border-t border-[#E0DAD0] pt-3">
                    <span className="text-xs text-[#6B7569]">Passer til: <span className="text-[#1A1F1C]">{a.fit}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What we talk about */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvad vi taler om</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            {WHAT_WE_TALK_ABOUT.map(item => (
              <div key={item.heading}>
                <h3 className="font-serif text-xl text-[#1A1F1C] font-normal mb-3">{item.heading}</h3>
                <p className="text-sm text-[#6B7569] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote */}
        <section className="bg-[#1C3829]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <div className="max-w-2xl">
              <blockquote className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug mb-6">
                "De fleste unge ved godt at det er den forkerte vej. De mangler bare en der tror på at de kan gå en anden."
              </blockquote>
              <p className="text-sm text-white/60 leading-relaxed">
                Foredraget er ikke en advarsel mod konsekvenser. Det er en samtale om hvad der faktisk trækker unge i den forkerte retning — og hvad der kan trækkes i den rigtige. Vi bruger rigtige historier fra det arbejde Kursskifte gør med kommuner og kontaktpersoner i Nordjylland.
              </p>
            </div>
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
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-1">Book et gratis foredrag</h2>
              <p className="text-sm text-[#6B7569]">Til jeres skole, SSP-netværk eller kommunale forebyggelsesindsats. Vi tilpasser og møder op.</p>
            </div>
            <Link
              href="mailto:info@kursskifte.dk?subject=Foredrag til vores skole/SSP"
              className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2 flex-shrink-0"
            >
              Skriv til os <ArrowRight />
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  )
}
