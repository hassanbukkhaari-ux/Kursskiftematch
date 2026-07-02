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

const DIMENSIONS = [
  { label: 'Faglige kvalifikationer', desc: 'Uddannelse, erfaring i år og relevante certifikater vægtes i scoren.' },
  { label: 'Tilgængelighed og kapacitet', desc: 'Resterende timer og antal aktive sager bestemmer om fagpersonen kan tage en ny sag.' },
  { label: 'Kompleksitetsmatch', desc: 'Fagpersonens maksimale kompleksitetsniveau sammenlignes med sagens niveau.' },
  { label: 'Aldersgruppe og specialer', desc: 'Match på borgerens aldersgruppe og fagpersonens primære målgruppe og specialer.' },
]

export default function MetodePage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Metode</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-2xl mb-5 leading-tight tracking-tight">
            Fagligt begrundet matching
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl">
            Kursskiftes matchningsproces er ikke tilfældig. Hver fagperson scores på fire dimensioner — og kun dem med ledig kapacitet og relevante kompetencer vises som kandidater.
          </p>
        </section>

        {/* How it works */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="mb-10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-5 h-px bg-[#C8993A]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Matchmotoren</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal mb-4">
                Fire dimensioner — én samlet score
              </h2>
              <p className="text-sm text-[#6B7569] leading-relaxed max-w-xl">
                Platformen scorer alle kvalificerede fagpersoner på fire dimensioner. Den samlede score bestemmer rangeringen. Fagpersoner på ferie, pause eller uden kapacitet filtreres fra inden scoringen begynder.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DIMENSIONS.map((d, i) => (
                <div key={d.label} className="bg-[#F6F3EE] rounded-2xl p-6 flex gap-4">
                  <div className="font-serif text-2xl text-[#C8993A] shrink-0 w-8">{String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#1A1F1C] mb-1.5">{d.label}</h3>
                    <p className="text-xs text-[#6B7569] leading-relaxed">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quality */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-5 h-px bg-[#C8993A]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kvalitetssikring</span>
              </div>
              <h2 className="font-serif text-3xl text-[#1A1F1C] font-normal mb-4">
                Verifikation før matching
              </h2>
              <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
                Inden en fagperson aktiveres i platformen gennemgår Kursskifte en grundig kvalitetssikring. Dokumenter, certifikater og baggrund verificeres manuelt.
              </p>
              <div className="space-y-3">
                {[
                  'Straffeattest og børneattest verificeres',
                  'CV og uddannelse gennemgås',
                  'Kapacitet og tilgængelighed registreres',
                  'Profil godkendes inden aktivering',
                  'Løbende opfølgning under forløb',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8993A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span className="text-sm text-[#1A1F1C]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1C3829] rounded-2xl p-7">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-5">Hvad der filtreres fra automatisk</div>
              <div className="space-y-0">
                {[
                  { cond: 'Ferie eller pause', effect: 'Ekskluderes fra kandidatlisten' },
                  { cond: 'Fuld kapacitet (timer)', effect: 'Ekskluderes fra matching' },
                  { cond: 'For mange aktive sager', effect: 'Ekskluderes automatisk' },
                  { cond: 'Fremtidig tilgængelighed', effect: 'Vises ikke som ledig endnu' },
                  { cond: 'Uverificeret profil', effect: 'Kan ikke matches' },
                ].map(row => (
                  <div key={row.cond} className="flex gap-3 py-2.5 border-b border-white/10 last:border-0">
                    <span className="text-xs text-white/50 w-44 shrink-0">{row.cond}</span>
                    <span className="text-xs text-white/80">{row.effect}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="bg-[#EDE9E1] border-t border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-1">Klar til at bruge platformen?</h2>
                <p className="text-sm text-[#6B7569]">Indsend en sag eller log ind på Kursskifte Match.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/intake" className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2">
                  Indsend sag <ArrowRight />
                </Link>
                <Link href="/login" className="h-10 px-5 border border-[#1C3829] text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#EEF4F0] transition-colors inline-flex items-center gap-2">
                  Log ind
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
