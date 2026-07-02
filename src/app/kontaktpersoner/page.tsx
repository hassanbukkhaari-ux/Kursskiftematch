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

const PROFILE_STEPS = [
  { n: '01', title: 'Opret profil', body: 'Udfyld profil med baggrund, uddannelse, erfaring og kompetencer. Upload dokumentation.' },
  { n: '02', title: 'Kvalitetssikring', body: 'Kursskifte gennemgår din profil og verificerer dokumenter, certifikater og straffeattest.' },
  { n: '03', title: 'Angiv kapacitet', body: 'Du angiver din tilgængelighed, timer pr. uge og de aldersgrupper du arbejder med.' },
  { n: '04', title: 'Matching', body: 'Kursskiftes platform matcher dig med relevante sager baseret på dine kompetencer og kapacitet.' },
]

export default function KontaktpersonerPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">For kontaktpersoner</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-2xl mb-5 leading-tight tracking-tight">
            Bliv en del af Kursskiftes faglige netværk
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl mb-8">
            Vi søger fagpersoner med erfaring inden for socialt arbejde, pædagogik og rådgivning. Din profil kvalitetssikres og du matches kun med sager der passer til dine kompetencer.
          </p>
          <Link
            href="/login"
            className="h-12 px-6 bg-[#1C3829] text-white font-semibold text-sm rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
          >
            Opret profil <ArrowRight />
          </Link>
        </section>

        {/* Who can apply */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-px bg-[#C8993A]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvem kan søge</span>
                </div>
                <h2 className="font-serif text-3xl text-[#1A1F1C] font-normal mb-4">Fagpersoner med relevant erfaring</h2>
                <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
                  Vi søger uddannede fagpersoner med erfaring i arbejdet med børn, unge og voksne i udsatte positioner. Det afgørende er din faglige baggrund, dine dokumenterede kompetencer og din kapacitet.
                </p>
                <div className="space-y-3">
                  {[
                    'Socialrådgiver, pædagog, lærer eller beslægtet baggrund',
                    'Erfaring med målgruppen (minimum 2 år anbefales)',
                    'Ren straffeattest og børneattest',
                    'Evne til at dokumentere og registrere tid',
                    'Fleksibel tilgængelighed til forløb',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-[#1A1F1C]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-[#1C3829] rounded-2xl p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">Hvad du kan tilbyde</div>
                  <div className="space-y-0">
                    {[
                      { label: 'Målgrupper', value: 'Børn/unge (0–18) eller voksne (18+)' },
                      { label: 'Kapacitet', value: 'Du angiver timer og max antal sager' },
                      { label: 'Geografi', value: 'Kommuner og områder du dækker' },
                      { label: 'Specialer', value: 'Fx vold, misbrug, kriminalitet, psykiatri' },
                    ].map(row => (
                      <div key={row.label} className="flex gap-3 py-2.5 border-b border-white/10 last:border-0">
                        <span className="text-xs font-semibold text-white/50 w-24 shrink-0">{row.label}</span>
                        <span className="text-xs text-white/80">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#F6F3EE] border border-[#E0DAD0] rounded-2xl p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Dokumentation der kræves</div>
                  <div className="space-y-2">
                    {['Straffeattest', 'Børneattest', 'CV', 'Uddannelsesbeviser', 'Eventuelt relevante certifikater'].map(doc => (
                      <div key={doc} className="flex items-center gap-2">
                        <CheckIcon />
                        <span className="text-sm text-[#1A1F1C]">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Sådan kommer du i gang</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal">
              Fra profil til første sag
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROFILE_STEPS.map(step => (
              <div key={step.n} className="bg-white border border-[#E0DAD0] rounded-2xl p-6">
                <div className="font-serif text-2xl text-[#C8993A] mb-3">{step.n}</div>
                <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{step.title}</h3>
                <p className="text-xs text-[#6B7569] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#EDE9E1] border-t border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="bg-[#1C3829] rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-2">Klar til at oprette profil?</h2>
                <p className="text-sm text-white/65">Log ind og opret din profil — vi gennemgår den og vender tilbage.</p>
              </div>
              <Link
                href="/login"
                className="shrink-0 h-11 px-6 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
              >
                Opret profil <ArrowRight />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
