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

export default function KontaktPage() {
  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kontakt</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-xl mb-5 leading-tight tracking-tight">
            Tag kontakt til Kursskifte
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-lg">
            Vi besvarer henvendelser fra kommuner og fagpersoner hurtigt og fagligt.
          </p>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* For kommuner */}
            <div className="bg-[#1C3829] rounded-2xl p-7 flex flex-col gap-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">For kommuner</div>
                <h2 className="font-serif text-2xl text-white font-normal mb-3">Har du en sag eller et spørgsmål?</h2>
                <p className="text-sm text-white/65 leading-relaxed">
                  Den hurtigste vej til os er via sagsindsendelse på platformen. Har du generelle spørgsmål, er du velkommen til at kontakte os direkte.
                </p>
              </div>
              <div className="space-y-0">
                <div className="py-2.5 border-b border-white/10">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-0.5">E-mail</div>
                  <a href="mailto:kommuner@kursskifte.dk" className="text-sm text-white hover:text-[#C8993A] transition-colors">kommuner@kursskifte.dk</a>
                </div>
                <div className="py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-0.5">Responstid</div>
                  <span className="text-sm text-white/80">Typisk inden for 1 arbejdsdag</span>
                </div>
              </div>
              <Link
                href="/intake"
                className="mt-auto h-10 px-5 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2 self-start"
              >
                Indsend sag direkte <ArrowRight />
              </Link>
            </div>

            {/* For fagpersoner */}
            <div className="bg-white border border-[#E0DAD0] rounded-2xl p-7 flex flex-col gap-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">For kontaktpersoner</div>
                <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-3">Spørgsmål om din profil eller ansøgning?</h2>
                <p className="text-sm text-[#6B7569] leading-relaxed">
                  Ønsker du at oprette en profil som kontaktperson, eller har du spørgsmål til processen — kontakt os her.
                </p>
              </div>
              <div className="space-y-0">
                <div className="py-2.5 border-b border-[#E0DAD0]">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-0.5">E-mail</div>
                  <a href="mailto:fagpersoner@kursskifte.dk" className="text-sm text-[#1A1F1C] hover:text-[#1C3829] transition-colors">fagpersoner@kursskifte.dk</a>
                </div>
                <div className="py-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-0.5">Responstid</div>
                  <span className="text-sm text-[#1A1F1C]">Typisk inden for 1–2 arbejdsdage</span>
                </div>
              </div>
              <Link
                href="/kontaktpersoner"
                className="mt-auto h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2 self-start"
              >
                Læs om at blive kontaktperson <ArrowRight />
              </Link>
            </div>

            {/* General */}
            <div className="lg:col-span-2 bg-[#F6F3EE] border border-[#E0DAD0] rounded-2xl p-7">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Virksomhed</div>
                  <p className="text-sm text-[#1A1F1C] font-semibold">Kursskifte ApS</p>
                  <p className="text-xs text-[#6B7569] mt-1">CVR: —</p>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Generel henvendelse</div>
                  <a href="mailto:info@kursskifte.dk" className="text-sm text-[#1A1F1C] hover:text-[#1C3829] transition-colors">info@kursskifte.dk</a>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Platform</div>
                  <a href="https://kursskifte.dk" className="text-sm text-[#1A1F1C] hover:text-[#1C3829] transition-colors">kursskifte.dk</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
