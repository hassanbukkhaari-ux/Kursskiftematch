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

export default function OmKursskiftePage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Om os</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-2xl mb-5 leading-tight tracking-tight">
            En managed platform for kontaktpersonforløb
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl">
            Kursskifte er ikke blot en hjemmeside — det er en fuldt administreret, kvalitetssikret platform til at finde, koordinere og dokumentere kontaktpersonforløb for borgere i mistrivsel.
          </p>
        </section>

        {/* Mission */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-px bg-[#C8993A]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Hvad vi gør</span>
                </div>
                <h2 className="font-serif text-3xl text-[#1A1F1C] font-normal mb-4">
                  Kursskifte forbinder kommuner med de rette fagpersoner
                </h2>
                <p className="text-sm text-[#6B7569] leading-relaxed mb-4">
                  Vi hjælper kommuner med at finde og koordinere kontaktpersonforløb for borgere i udsatte positioner. Vores platform håndterer hele processen: fra sagsindsendelse til forslaget lander hos kommunen.
                </p>
                <p className="text-sm text-[#6B7569] leading-relaxed">
                  Alle fagpersoner i vores netværk er kvalitetssikrede. Vi verificerer dokumenter, certifikater og baggrund inden aktivering — og matcher kun på kompetencer og kapacitet.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: 'Vi hjælper kommuner', body: 'Sikkert, overskueligt og uden at kommunen skal gennemse en åben database.' },
                  { title: 'Vi kvalitetssikrer fagpersoner', body: 'Dokumentation, certifikater og kompetencer verificeres manuelt.' },
                  { title: 'Vi håndterer koordinationen', body: 'Takst, papirarbejde og forslag — Kursskifte klarer det.' },
                ].map(c => (
                  <div key={c.title} className="bg-[#F6F3EE] rounded-2xl p-6">
                    <h3 className="font-semibold text-sm text-[#1A1F1C] mb-1.5">{c.title}</h3>
                    <p className="text-xs text-[#6B7569] leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-px bg-[#C8993A]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Vores tilgang</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal">
              Relationsbaseret. Fagligt. Trygt.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Relationsbaseret', body: 'Vi tror på at den rigtige relation er afgørende. Matching er ikke tilfældig — det er fagligt begrundet.' },
              { label: 'Fagligt funderet', body: 'Alle beslutninger i platformen er baseret på kompetencer, kapacitet og dokumenteret erfaring.' },
              { label: 'Trygt og sikkert', body: 'GDPR-compliant. Al persondata behandles sikkert. Kommunikation foregår via platformen.' },
            ].map(v => (
              <div key={v.label} className="bg-white border border-[#E0DAD0] rounded-2xl p-6">
                <div className="w-6 h-6 rounded-md bg-[#EEF4F0] flex items-center justify-center mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#1C3829]" />
                </div>
                <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{v.label}</h3>
                <p className="text-xs text-[#6B7569] leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#EDE9E1] border-t border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-1">Kom i kontakt med os</h2>
                <p className="text-sm text-[#6B7569]">Vi besvarer henvendelser hurtigt og fagligt.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/kontakt" className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2">
                  Kontakt os <ArrowRight />
                </Link>
                <Link href="/intake" className="h-10 px-5 border border-[#1C3829] text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#EEF4F0] transition-colors inline-flex items-center gap-2">
                  Indsend sag
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
