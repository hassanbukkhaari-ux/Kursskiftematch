import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

// ── Small reusable pieces ────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8993A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

// ── Sections ────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-14 sm:pt-20">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-5 h-px bg-[#C8993A]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kursskifte Match</span>
      </div>
      <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] leading-[1.06] text-[#1A1F1C] font-normal max-w-3xl mb-5 tracking-tight">
        Relationsbaseret støtte med de{' '}
        <span className="italic text-[#C8993A]">rette kontaktpersoner</span>
      </h1>
      <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl mb-8">
        Kursskifte hjælper kommuner med at finde, kvalitetssikre og koordinere kontaktpersonforløb for borgere i mistrivsel.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/intake"
          className="h-12 px-6 bg-[#1C3829] text-white font-semibold text-sm rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
        >
          Indsend sag
          <ArrowRight />
        </Link>
        <Link
          href="/kontaktpersoner"
          className="h-12 px-6 border border-[#E0DAD0] text-[#1A1F1C] font-semibold text-sm rounded-xl hover:bg-[#EEF4F0] hover:border-[#C8DDD1] transition-colors inline-flex items-center"
        >
          Jeg vil være kontaktperson
        </Link>
      </div>
    </section>
  )
}

function JourneyCards() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-14">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#1C3829] rounded-2xl p-7 sm:p-8 flex flex-col gap-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">For kommuner</div>
            <h2 className="font-serif text-2xl text-white font-normal leading-snug mb-3">
              Send en sag til Kursskifte
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Vi vurderer behovet, finder relevante kontaktpersoner og sender et fagligt begrundet forslag. Du behøver ikke gennemse en åben database.
            </p>
          </div>
          <div className="space-y-2">
            {[
              'Ingen browsing i åben database',
              'Kursskifte håndterer matching og takst',
              'Fagligt begrundet forslag retur',
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8993A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="text-xs text-white/65">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/intake"
            className="mt-auto h-10 px-5 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2 self-start"
          >
            Indsend sag <ArrowRight />
          </Link>
        </div>

        <div className="bg-white border border-[#E0DAD0] rounded-2xl p-7 sm:p-8 flex flex-col gap-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">For kontaktpersoner</div>
            <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal leading-snug mb-3">
              Bliv en del af netværket
            </h2>
            <p className="text-sm text-[#6B7569] leading-relaxed">
              Bliv en del af Kursskiftes netværk af kvalitetssikrede fagpersoner og få adgang til relevante forløb.
            </p>
          </div>
          <div className="space-y-2">
            {[
              'Matching baseret på kompetencer og kapacitet',
              'Dokumenteret profil og kvalitetssikring',
              'Tydelig opfølgning og dokumentation',
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <CheckIcon />
                <span className="text-xs text-[#6B7569]">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/kontaktpersoner"
            className="mt-auto h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2 self-start"
          >
            Opret profil <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}

const PROCESS_STEPS = [
  { n: '01', title: 'Kommunen indsender sag', body: 'Sikkert via Kursskiftes platform. Ingen offentlig database — kun direkte henvendelse.' },
  { n: '02', title: 'Kursskifte vurderer behovet', body: 'Vi gennemgår sagen, kompleksitetsniveauet og de specifikke krav til kontaktpersonen.' },
  { n: '03', title: 'Platformen finder relevante kandidater', body: 'Matchmotoren scorer fagpersoner på kvalifikationer, kapacitet, aldersgruppe og kompleksitet.' },
  { n: '04', title: 'Faglig kvalitetssikring', body: 'Kandidaterne gennemgås — dokumenter, certifikater og tilgængelighed verificeres.' },
  { n: '05', title: 'Kommunen modtager forslag', body: 'Et fagligt begrundet forslag sendes til kommunen med anbefalet kontaktperson.' },
  { n: '06', title: 'Opstart og dokumentation', body: 'Forløbet startes op, og al dokumentation håndteres i platformen.' },
]

function ProcessSection() {
  return (
    <section className="bg-white border-y border-[#E0DAD0]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Processen</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal">
            Sådan arbejder Kursskifte
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROCESS_STEPS.map(step => (
            <div key={step.n} className="bg-[#F6F3EE] rounded-2xl p-6">
              <div className="font-serif text-2xl text-[#C8993A] mb-3">{step.n}</div>
              <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{step.title}</h3>
              <p className="text-xs text-[#6B7569] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TRUST_ITEMS = [
  { label: 'Kvalitetssikrede kontaktpersoner', desc: 'Alle fagpersoner dokumenterer baggrund, certifikater og erfaring.' },
  { label: 'Dokumenteret matchproces', desc: 'Algoritmebaseret matching med faglig begrundelse ved hvert forslag.' },
  { label: 'Tydelig opfølgning', desc: 'Løbende status og kontaktmulighed under hele forløbet.' },
  { label: 'Løbende dokumentation', desc: 'Sessionslogs, timeregistrering og forløbsoversigt i platformen.' },
  { label: 'Tryg kommunikation', desc: 'Al kommunikation foregår sikkert — ingen åbne e-mailkæder.' },
  { label: 'GDPR og datasikkerhed', desc: 'Persondata behandles sikkert og i overensstemmelse med GDPR.' },
]

function TrustSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-5 h-px bg-[#C8993A]" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvorfor Kursskifte</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal">
          Tryghed i hele forløbet
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TRUST_ITEMS.map(item => (
          <div key={item.label} className="bg-white border border-[#E0DAD0] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-[#EEF4F0] flex items-center justify-center shrink-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <span className="text-sm font-semibold text-[#1A1F1C]">{item.label}</span>
            </div>
            <p className="text-xs text-[#6B7569] leading-relaxed pl-7">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function MunicipalitySection() {
  return (
    <section className="bg-white border-y border-[#E0DAD0]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Til kommuner</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal mb-4">
              Vi klarer matchningen for jer
            </h2>
            <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
              Kommunen indsender sagen sikkert. Kursskifte vurderer behov, finder egnede kontaktpersoner og sender et fagligt begrundet forslag.
            </p>
            <div className="space-y-3 mb-8">
              {[
                'Indsend en sag — vi vurderer og finder de rette kandidater',
                'I gennemser ikke en åben database af fagpersoner',
                'Kursskifte håndterer matching, takst og papirarbejde',
                'Ét fagligt begrundet forslag med anbefalet kontaktperson',
              ].map(item => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckIcon />
                  <span className="text-sm text-[#1A1F1C]">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/intake"
              className="h-11 px-6 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
            >
              Indsend sag til Kursskifte <ArrowRight />
            </Link>
          </div>

          <div className="bg-[#F6F3EE] rounded-2xl p-7 border border-[#E0DAD0]">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-5">Hvad I kan indsende</div>
            <div className="space-y-0">
              {[
                { label: 'Type', value: 'Kontaktpersonforløb §52.3' },
                { label: 'Borger', value: 'Barn/ung eller voksen i mistrivsel' },
                { label: 'Kompleksitet', value: 'Lav til kritisk — vi vurderer' },
                { label: 'Respons', value: 'Fagligt forslag inden for aftalt tid' },
                { label: 'Takst', value: 'Kursskifte håndterer takst og aftaler' },
              ].map(row => (
                <div key={row.label} className="flex gap-3 py-2.5 border-b border-[#E0DAD0] last:border-0">
                  <span className="text-xs font-semibold text-[#6B7569] w-24 shrink-0">{row.label}</span>
                  <span className="text-xs text-[#1A1F1C]">{row.value}</span>
                </div>
              ))}
            </div>
            <Link
              href="/kommuner"
              className="mt-5 text-xs font-semibold text-[#1C3829] hover:underline inline-flex items-center gap-1"
            >
              Læs mere om forløbet <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProfessionalSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="bg-[#1C3829] rounded-2xl p-7 order-2 lg:order-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-5">Profil</div>
          <div className="space-y-0">
            {[
              { label: 'Uddannelse', value: 'Socialrådgiver, pædagog, lærer og andre fagprofiler' },
              { label: 'Erfaring', value: 'Minimum 2 år med relevante målgrupper' },
              { label: 'Dokumentation', value: 'Straffeattest, CV, uddannelsesbeviser' },
              { label: 'Matching', value: 'Baseret på kompetencer, kapacitet og aldersgruppe' },
              { label: 'Kapacitet', value: 'Du angiver timer og tilgængelighed' },
            ].map(row => (
              <div key={row.label} className="flex gap-3 py-2.5 border-b border-white/10 last:border-0">
                <span className="text-xs font-semibold text-white/50 w-28 shrink-0">{row.label}</span>
                <span className="text-xs text-white/80">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">For kontaktpersoner</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal mb-4">
            Bliv kontaktperson hos Kursskifte
          </h2>
          <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
            Vi søger fagpersoner med erfaring inden for socialt arbejde, pædagogik, rådgivning og beslægtede felter. Din profil kvalitetssikres, og du matches kun med sager der passer til dine kompetencer og kapacitet.
          </p>
          <div className="space-y-3 mb-8">
            {[
              'Opret profil med baggrund og kompetencer',
              'Angiv din tilgængelighed og kapacitet',
              'Profilen kvalitetssikres af Kursskifte',
              'Du matches på kompetencer, ikke tilfældighed',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckIcon />
                <span className="text-sm text-[#1A1F1C]">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/kontaktpersoner"
            className="h-11 px-6 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
          >
            Opret profil <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="bg-[#EDE9E1] border-t border-[#E0DAD0]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-7">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">Kommuner</div>
            <h3 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-2">Har du en sag?</h3>
            <p className="text-sm text-[#6B7569] mb-5 leading-relaxed">Indsend en sag sikkert til Kursskifte. Vi vurderer og finder de rette kandidater.</p>
            <Link
              href="/intake"
              className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
            >
              Indsend sag <ArrowRight />
            </Link>
          </div>
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-7">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">Fagpersoner</div>
            <h3 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-2">Vil du være kontaktperson?</h3>
            <p className="text-sm text-[#6B7569] mb-5 leading-relaxed">Opret en profil og bliv en del af Kursskiftes netværk af kvalitetssikrede fagpersoner.</p>
            <Link
              href="/kontaktpersoner"
              className="h-10 px-5 border border-[#1C3829] text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#EEF4F0] transition-colors inline-flex items-center gap-2"
            >
              Opret profil <ArrowRight />
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
        <JourneyCards />
        <ProcessSection />
        <TrustSection />
        <MunicipalitySection />
        <ProfessionalSection />
        <FinalCTA />
      </main>
      <PublicFooter />
    </div>
  )
}
