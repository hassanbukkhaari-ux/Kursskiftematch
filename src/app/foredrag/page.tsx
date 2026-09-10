import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Foredrag | Skifte kurs mens det er muligt',
  description:
    'Hassan Bukkhaari holder foredrag til skoler, gymnasier og SSP om at stå ved et vendepunkt — fra egne erfaringer og fra unge han har set skifte kurs. Ærlige historier. Gratis.',
  alternates: { canonical: '/foredrag' },
  openGraph: {
    title: 'Foredrag | Skifte kurs mens det er muligt',
    description:
      'Personlige foredrag til skoler og SSP om vendepunktet — af den der selv nåede at skifte kurs. Book via info@kursskifte.dk.',
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
    heading: 'Jeg nåede det selv',
    body: 'Ikke alle gør. Jeg har set det på tæt hold — hvad der sker når man ikke skifter kurs i tide, og hvad der er anderledes for dem der gør. Jeg taler om det ærligt, fordi det er det der virker.',
  },
  {
    heading: 'Det forkerte fællesskab',
    body: 'Det er sjældent et valg. Man ender der fordi det er det fællesskab der er tilgængeligt. Foredraget handler om hvad der trækker unge i den retning — og hvad der kan trække i den anden.',
  },
  {
    heading: 'Vendepunktet',
    body: 'Der er altid et øjeblik. Et punkt hvor det kan gå begge veje. Jeg taler om de øjeblikke — fra mit eget liv og fra unge jeg har fulgt tæt. Rigtige situationer, ikke eksempler fra en bog.',
  },
  {
    heading: 'Inden det er for sent',
    body: 'Det er det sværeste at sige til en ung der tror han har tid. Men det er det vigtigste. Foredraget slutter ikke med skræmsel — det slutter med at det faktisk er muligt at gå en anden vej.',
  },
]

const FOR_WHOM = [
  { label: 'Folkeskoler', note: '8.–10. klasse' },
  { label: 'Gymnasier', note: 'Alle årgange' },
  { label: 'SSP-samarbejder', note: 'Skole · Social · Politi' },
  { label: 'Kommuner', note: 'Forebyggelsesindsatser' },
]

export default function ForedragPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>

        {/* Hero — personal */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-14 sm:pt-24">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Foredrag</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal mb-6 leading-tight tracking-tight">
                Jeg nåede at skifte kurs.<br />
                <span className="text-[#6B7569]">Ikke alle gør.</span>
              </h1>
              <p className="text-[17px] text-[#6B7569] leading-relaxed mb-4">
                Jeg holder foredrag til skoler, gymnasier og SSP om hvad det vil sige at stå ved et vendepunkt — og hvad der afgør om man går den ene eller den anden vej.
              </p>
              <p className="text-[17px] text-[#6B7569] leading-relaxed mb-8">
                Ikke teori. Egne erfaringer. Og historier fra unge jeg har set — dem der nåede det, og dem der ikke gjorde.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="mailto:info@kursskifte.dk?subject=Foredrag til vores skole/SSP"
                  className="inline-flex items-center gap-2 h-11 px-6 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors"
                >
                  Book et foredrag <ArrowRight />
                </Link>
              </div>
            </div>

            {/* Speaker card */}
            <div className="bg-white border border-[#E0DAD0] rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                {/* Avatar placeholder — replace with real photo */}
                <div className="w-14 h-14 rounded-full bg-[#1C3829] flex items-center justify-center flex-shrink-0">
                  <span className="font-serif text-xl text-white">H</span>
                </div>
                <div>
                  <div className="font-serif text-lg text-[#1A1F1C]">Hassan Bukkhaari</div>
                  <div className="text-sm text-[#6B7569]">Grundlægger, Kursskifte</div>
                </div>
              </div>
              <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
                Hassan Bukkhaari taler af egne erfaringer — om miljøer, fællesskaber og vendepunkter. Han har stiftet Kursskifte, der matcher kommuner i Nordjylland med kontaktpersoner til unge og voksne i mistrivsel.
              </p>
              <div className="border-t border-[#E0DAD0] pt-5 space-y-2">
                {FOR_WHOM.map(f => (
                  <div key={f.label} className="flex items-center justify-between text-sm">
                    <span className="text-[#1A1F1C]">{f.label}</span>
                    <span className="text-[#6B7569]">{f.note}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-[#E0DAD0]">
                <span className="text-xs font-semibold text-[#C8993A] uppercase tracking-wider">Gratis · Ingen forberedelse</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pull quote */}
        <section className="bg-[#1C3829]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
            <blockquote className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug max-w-2xl">
              "De fleste unge ved godt at det er den forkerte vej.<br className="hidden sm:block" />
              De mangler bare én der taler ærligt om det — fordi han selv har stået der."
            </blockquote>
          </div>
        </section>

        {/* What the talk covers */}
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

        {/* How to book */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div className="max-w-lg">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-5 h-px bg-[#C8993A]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Book</span>
                </div>
                <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-3">
                  Skriv til os — vi klarer resten
                </h2>
                <p className="text-sm text-[#6B7569] leading-relaxed">
                  Send en mail til <a href="mailto:info@kursskifte.dk" className="text-[#1C3829] underline underline-offset-2">info@kursskifte.dk</a> med skolens eller organisationens navn og et ønsket tidspunkt. Foredraget tilpasses jeres målgruppe og er gratis. Ingen forberedelse kræves af jer.
                </p>
              </div>
              <Link
                href="mailto:info@kursskifte.dk?subject=Foredrag til vores skole/SSP"
                className="h-11 px-6 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2 flex-shrink-0"
              >
                Skriv til os <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* Kursskifte subtle context */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
          <p className="text-xs text-[#9DA89B] leading-relaxed max-w-xl">
            Foredraget udbydes i samarbejde med Kursskifte ApS, der arbejder med kommuner i Nordjylland om kontaktpersonordninger til unge og voksne i mistrivsel.{' '}
            <Link href="/om-kursskifte" className="underline underline-offset-2 hover:text-[#6B7569] transition-colors">Læs mere om Kursskifte</Link>.
          </p>
        </section>

      </main>
      <PublicFooter />
    </div>
  )
}
