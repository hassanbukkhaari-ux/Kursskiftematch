import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Kontakt Kursskifte | §32 og §85-forløb i Nordjylland',
  description:
    'Kontakt Kursskifte om kontaktpersonforløb, sagsindsendelse eller spørgsmål. Vi betjener kommuner i Nordjylland — Aalborg, Hjørring, Brønderslev og Frederikshavn.',
  alternates: { canonical: '/kontakt' },
  openGraph: {
    title: 'Kontakt Kursskifte',
    description:
      'Henvendelser fra kommuner og fagpersoner i Nordjylland besvares hurtigt og fagligt. Kontakt os om §32 og §85-forløb, kontaktpersonforløb og socialpædagogisk støtte.',
    url: '/kontakt',
  },
}

const orgContactSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kursskifte ApS',
  url: 'https://kursskifte.dk',
  email: 'kontakt@kursskifte.dk',
  telephone: '+4531319594',
  taxID: '46470974',
  areaServed: [
    { '@type': 'City', name: 'Aalborg' },
    { '@type': 'City', name: 'Hjørring' },
    { '@type': 'City', name: 'Brønderslev' },
    { '@type': 'City', name: 'Frederikshavn' },
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'kontakt@kursskifte.dk',
    telephone: '+4531319594',
    contactType: 'customer service',
    availableLanguage: 'Danish',
  },
}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgContactSchema) }}
      />
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
            Vi besvarer henvendelser fra kommuner og fagpersoner hurtigt og fagligt. Vi betjener kommuner i Nordjylland — herunder Aalborg, Hjørring, Brønderslev og Frederikshavn.
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
                  Send en e-mail til kontakt@kursskifte.dk. Vi afklarer behov, formål, målgruppe, timeantal og forventninger — og finder den rette kontaktperson til sagen.
                </p>
              </div>
              <div className="space-y-0">
                <div className="py-2.5 border-b border-white/10">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-0.5">E-mail</div>
                  <a href="mailto:kontakt@kursskifte.dk" className="text-sm text-white hover:text-[#C8993A] transition-colors">kontakt@kursskifte.dk</a>
                </div>
                <div className="py-2.5 border-b border-white/10">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-0.5">Telefon</div>
                  <a href="tel:+4531319594" className="text-sm text-white hover:text-[#C8993A] transition-colors">31 31 95 94</a>
                </div>
              </div>
              <a
                href="mailto:kontakt@kursskifte.dk"
                className="mt-auto h-10 px-5 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2 self-start"
              >
                Send e-mail <ArrowRight />
              </a>
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
                  <a href="mailto:kontakt@kursskifte.dk" className="text-sm text-[#1A1F1C] hover:text-[#1C3829] transition-colors">kontakt@kursskifte.dk</a>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Kursskifte ApS</div>
                  <p className="text-sm text-[#1A1F1C]">CVR: 46470974</p>
                  <p className="text-xs text-[#6B7569] mt-1">Nordjylland, Danmark</p>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Telefon</div>
                  <a href="tel:+4531319594" className="text-sm text-[#1A1F1C] hover:text-[#1C3829] transition-colors">31 31 95 94</a>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">E-mail</div>
                  <a href="mailto:kontakt@kursskifte.dk" className="text-sm text-[#1A1F1C] hover:text-[#1C3829] transition-colors">kontakt@kursskifte.dk</a>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Område</div>
                  <p className="text-xs text-[#6B7569] leading-relaxed">Aalborg · Hjørring · Brønderslev · Frederikshavn</p>
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
