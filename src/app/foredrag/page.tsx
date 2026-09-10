import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Mit kursskifte | Foredrag af Kursskifte',
  description:
    'Kursskifte holder foredrag til skoler og SSP om eget kursskifte — og om unge vi har set stå ved det samme valg. Ærligt. Personligt. Kontakt os for pris og tilgængelighed.',
  alternates: { canonical: '/foredrag' },
  openGraph: {
    title: 'Mit kursskifte | Foredrag af Kursskifte',
    description:
      'Et personligt foredrag om vendepunktet — af én der selv nåede at skifte kurs. Til skoler, gymnasier og SSP.',
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

const THEMES = [
  {
    heading: 'Vi nåede det',
    body: 'Vi taler ærligt om hvad vi har set og levet — det øjeblik hvor det kunne gå begge veje. Ikke fordi det var nemt, men fordi det er det der rammer.',
  },
  {
    heading: 'Andre nåede det ikke',
    body: 'Vi har set det på tæt hold. Folk vi kendte. Vi taler om dem med respekt — og om hvad der var anderledes for dem der nåede det.',
  },
  {
    heading: 'Det forkerte fællesskab',
    body: 'Man ender der ikke fordi man er dum. Man ender der fordi det er det fællesskab der er tilgængeligt. Det er vigtigt at sige højt.',
  },
  {
    heading: 'Inden det er for sent',
    body: 'Det er det sværeste at sige til én der tror der er tid. Foredraget slutter ikke med konsekvenser. Det slutter med muligheder.',
  },
]

export default function ForedragPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-14 sm:pt-24">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Foredrag</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-3">
              <h1 className="font-serif text-5xl sm:text-6xl text-[#1A1F1C] font-normal mb-6 leading-none tracking-tight">
                Mit kursskifte.
              </h1>
              <p className="text-[18px] text-[#6B7569] leading-relaxed mb-4 max-w-lg">
                Det er ikke et firmanavn vi fandt på. Det er noget vi har levet. Og noget vi har set andre leve — og set andre ikke nå.
              </p>
              <p className="text-[18px] text-[#6B7569] leading-relaxed mb-10 max-w-lg">
                Vi holder foredrag til skoler, gymnasier og SSP om vendepunktet. Ærligt. Fra eget liv.
              </p>
              <Link
                href="mailto:info@kursskifte.dk?subject=Foredrag – kontakt fra skole/SSP"
                className="inline-flex items-center gap-2 h-11 px-6 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors"
              >
                Book et foredrag <ArrowRight />
              </Link>
            </div>

            {/* Speaker identity */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-[#E0DAD0] rounded-2xl p-7">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#1C3829] flex items-center justify-center flex-shrink-0">
                    <span className="font-serif text-xl text-[#F6F3EE]">H</span>
                  </div>
                  <div>
                    <div className="font-serif text-lg text-[#1A1F1C] leading-tight">Hassan Bukkhaari</div>
                    <div className="text-xs text-[#C8993A] font-medium uppercase tracking-wide mt-0.5">Grundlægger · Kursskifte</div>
                  </div>
                </div>
                <p className="text-sm text-[#6B7569] leading-relaxed">
                  Kursskifte kom til som en forlængelse af det vi selv oplevede — og det vi har set i andres liv. Vi holder foredrag til folkeskoler, gymnasier, SSP og kommunale forebyggelsesindsatser.
                </p>
                <div className="mt-5 pt-5 border-t border-[#E0DAD0]">
                  <a href="mailto:info@kursskifte.dk?subject=Foredrag – kontakt fra skole/SSP" className="text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">
                    Skriv til os for pris og tilgængelighed →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pull quote */}
        <section className="bg-[#1C3829]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <blockquote className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug max-w-2xl">
              "Vi er ikke her for at skræmme nogen. Vi er her fordi vi har stået der selv — og ved at det gør en forskel at høre det fra nogen der har."
            </blockquote>
            <p className="text-sm text-white/40 mt-5">— Grundlægger, Kursskifte</p>
          </div>
        </section>

        {/* Themes */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvad foredraget handler om</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
            {THEMES.map(t => (
              <div key={t.heading}>
                <h3 className="font-serif text-xl text-[#1A1F1C] font-normal mb-3">{t.heading}</h3>
                <p className="text-sm text-[#6B7569] leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Book */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div className="max-w-lg">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-px bg-[#C8993A]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Book</span>
                </div>
                <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-3">
                  Skriv til os
                </h2>
                <p className="text-sm text-[#6B7569] leading-relaxed">
                  Send en mail til{' '}
                  <a href="mailto:info@kursskifte.dk" className="text-[#1C3829] underline underline-offset-2">info@kursskifte.dk</a>{' '}
                  med skolens eller organisationens navn og et ønsket tidspunkt. Vi tilpasser foredraget til jeres målgruppe og vender tilbage med pris og tilgængelighed.
                </p>
              </div>
              <Link
                href="mailto:info@kursskifte.dk?subject=Foredrag – kontakt fra skole/SSP"
                className="h-11 px-6 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2 flex-shrink-0"
              >
                Skriv til os <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* Subtle Kursskifte context */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
          <p className="text-xs text-[#9DA89B] leading-relaxed max-w-xl">
            Kursskifte ApS arbejder med kommuner i Nordjylland om kontaktpersonordninger til unge og voksne i mistrivsel.{' '}
            <Link href="/om-kursskifte" className="underline underline-offset-2 hover:text-[#6B7569] transition-colors">Læs mere</Link>.
          </p>
        </section>

      </main>
      <PublicFooter />
    </div>
  )
}
