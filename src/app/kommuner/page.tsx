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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8993A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const STEPS = [
  { n: '01', title: 'I indsender sagen', body: 'Via Kursskiftes sikre platform. I beskriver borgeren, behovet og eventuelle særlige hensyn. Ingen offentlig database — direkte til os.' },
  { n: '02', title: 'Vi vurderer behovet', body: 'Kursskifte gennemgår sagen og vurderer kompleksitetsniveauet, aldersgruppe og kompetencebehov. Vi stiller opklarende spørgsmål hvis nødvendigt.' },
  { n: '03', title: 'Matching og kvalitetssikring', body: 'Platformen scorer kvalificerede kontaktpersoner på kapacitet, erfaring, kompetencer og tilgængelighed. Vi verificerer dokumenter og certifikater.' },
  { n: '04', title: 'I modtager et forslag', body: 'Et fagligt begrundet forslag med anbefalet kontaktperson sendes til jer. Inkluderer profil, begrundelse og estimeret opstart.' },
  { n: '05', title: 'Godkendelse og opstart', body: 'I godkender forslaget. Kursskifte koordinerer opstarten og sikrer at dokumentation og takst er på plads.' },
  { n: '06', title: 'Løbende opfølgning', body: 'Kursskifte følger op på forløbet. Al dokumentation, sessionslogs og timeregistrering håndteres i platformen.' },
]

export default function KommunerPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Til kommuner</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-2xl mb-5 leading-tight tracking-tight">
            Én henvendelse. Et fagligt begrundet forslag.
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl mb-8">
            Kommunen indsender sagen sikkert. Kursskifte vurderer, matcher og sender jer et forslag med en kvalitetssikret kontaktperson.
          </p>
          <Link
            href="/intake"
            className="h-12 px-6 bg-[#1C3829] text-white font-semibold text-sm rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
          >
            Indsend sag nu <ArrowRight />
          </Link>
        </section>

        {/* Core message */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'I indsender — vi finder',
                  body: 'I behøver ikke at gennemse en åben database af fagpersoner. I indsender sagen til Kursskifte, og vi finder de rette kandidater.',
                },
                {
                  title: 'Kursskifte klarer papirarbejdet',
                  body: 'Vi håndterer matchning, takst, aftaler og dokumentation. Kommunen modtager et klart forslag og kan koncentrere sig om borgeren.',
                },
                {
                  title: 'Faglig kvalitetssikring',
                  body: 'Alle kontaktpersoner er dokumenteret, verificeret og matched på relevante kompetencer — ikke tilfældighed.',
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
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Processen</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal">
              Fra sag til forslag
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

        {/* What you can request */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-px bg-[#C8993A]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvad I kan indsende</span>
                </div>
                <h2 className="font-serif text-3xl text-[#1A1F1C] font-normal mb-4">Kursskifte tager sager på tværs af kompleksitet</h2>
                <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
                  Vi modtager sager med kontaktpersonbehov for børn, unge og voksne. Vi vurderer kompleksitetsniveauet og matcher derefter.
                </p>
                <div className="space-y-3">
                  {[
                    'Kontaktpersonforløb §52.3 og tilsvarende',
                    'Lav til kritisk kompleksitet — vi vurderer',
                    'Børn og unge (0–18) samt voksne (18+)',
                    'Akutte behov kan håndteres ved særlig aftale',
                    'Kommunen modtager forslag inden for aftalt tid',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-[#1A1F1C]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#F6F3EE] border border-[#E0DAD0] rounded-2xl p-7">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-5">Hvad vi håndterer for jer</div>
                <div className="space-y-0">
                  {[
                    { label: 'Matching', value: 'Algoritmebaseret, fagligt begrundet' },
                    { label: 'Takst', value: 'Aftalt og administreret af Kursskifte' },
                    { label: 'Dokumentation', value: 'Sessionslogs og timeregistrering' },
                    { label: 'Opfølgning', value: 'Løbende under hele forløbet' },
                    { label: 'Kvalitetssikring', value: 'Verifikation af alle fagpersoner' },
                  ].map(row => (
                    <div key={row.label} className="flex gap-3 py-2.5 border-b border-[#E0DAD0] last:border-0">
                      <span className="text-xs font-semibold text-[#6B7569] w-28 shrink-0">{row.label}</span>
                      <span className="text-xs text-[#1A1F1C]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="bg-[#1C3829] rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-2">Klar til at indsende en sag?</h2>
              <p className="text-sm text-white/65">Det tager få minutter. Vi vender tilbage hurtigt.</p>
            </div>
            <Link
              href="/intake"
              className="shrink-0 h-11 px-6 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
            >
              Indsend sag <ArrowRight />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
