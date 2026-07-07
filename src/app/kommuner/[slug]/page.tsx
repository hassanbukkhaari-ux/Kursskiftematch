import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { createAnonClient } from '@/lib/supabase/server'

export const revalidate = 3600

type CmsMunicipality = {
  slug: string
  name: string
  county: string
  population_approx: number | null
  hero_title: string
  hero_intro: string
  local_context: string
  services_description: string
  meta_title: string
  meta_description: string
}

async function getMunicipality(slug: string): Promise<CmsMunicipality | null> {
  const db = createAnonClient()
  const { data } = await db
    .from('cms_municipalities' as never)
    .select('slug, name, county, population_approx, hero_title, hero_intro, local_context, services_description, meta_title, meta_description')
    .eq('slug', slug)
    .single()
  return data as CmsMunicipality | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const m = await getMunicipality(slug)
  if (!m) return { title: 'Ikke fundet' }
  return {
    title: m.meta_title,
    description: m.meta_description,
    alternates: { canonical: `/kommuner/${slug}` },
    openGraph: {
      title: m.meta_title,
      description: m.meta_description,
      url: `/kommuner/${slug}`,
    },
  }
}

const STEPS = [
  { n: '01', title: 'I indsender sagen', body: 'Beskriv borgeren, behovet og eventuelle særlige hensyn via Kursskiftes sikre platform.' },
  { n: '02', title: 'Vi vurderer og matcher', body: 'Kursskifte gennemgår sagen og scorer kvalificerede fagpersoner på kompetencer, kapacitet og tilgængelighed.' },
  { n: '03', title: 'I modtager et forslag', body: 'Et fagligt begrundet forslag med anbefalet kontaktperson sendes typisk inden for 1–3 arbejdsdage.' },
  { n: '04', title: 'Godkendelse og opstart', body: 'I godkender forslaget. Kursskifte koordinerer opstart og dokumentation.' },
]

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

export default async function KommuneLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = await getMunicipality(slug)
  if (!m) notFound()

  const localSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Kontaktpersonforløb i ${m.name} Kommune`,
    provider: { '@type': 'Organization', name: 'Kursskifte ApS', url: 'https://kursskifte.dk' },
    description: m.services_description,
    areaServed: { '@type': 'City', name: m.name },
    serviceType: 'Socialpædagogisk kontaktpersonforløb',
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }} />
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">{m.county}</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-3xl mb-5 leading-tight tracking-tight">
            {m.hero_title}
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl mb-8">
            {m.hero_intro}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/intake"
              className="h-12 px-6 bg-[#1C3829] text-white font-semibold text-sm rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
            >
              Indsend sag nu <ArrowRight />
            </Link>
            <Link
              href="/kontakt"
              className="h-12 px-6 border border-[#1C3829] text-[#1C3829] font-semibold text-sm rounded-xl hover:bg-[#EEF4F0] transition-colors inline-flex items-center gap-2"
            >
              Kontakt os
            </Link>
          </div>
        </section>

        {/* Local context */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-px bg-[#C8993A]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">{m.name} Kommune</span>
                </div>
                <h2 className="font-serif text-3xl text-[#1A1F1C] font-normal mb-4">
                  Social indsats i {m.name}
                </h2>
                <p className="text-sm text-[#6B7569] leading-relaxed mb-4">{m.local_context}</p>
                {m.population_approx && (
                  <p className="text-xs text-[#6B7569]">
                    {m.name} Kommune har ca. {m.population_approx.toLocaleString('da-DK')} indbyggere.
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-[#1C3829] rounded-2xl p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-4">Hvad Kursskifte leverer</div>
                  <p className="text-sm text-white/80 leading-relaxed mb-4">{m.services_description}</p>
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {[
                      'Kontaktpersonforløb §32 i barnets lov (børn og unge)',
                      'Socialpædagogisk støtte §85 (voksne)',
                      'Bostøtte og støttekontaktpersonordning',
                      'Faglig anbefaling og koordination',
                    ].map(item => (
                      <div key={item} className="flex items-start gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C8993A" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-xs text-white/70">{item}</span>
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
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Processen</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal">
              Fra sag til forslag — typisk inden for 1–3 arbejdsdage
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map(step => (
              <div key={step.n} className="bg-white border border-[#E0DAD0] rounded-2xl p-6">
                <div className="font-serif text-2xl text-[#C8993A] mb-3">{step.n}</div>
                <h3 className="font-semibold text-sm text-[#1A1F1C] mb-2">{step.title}</h3>
                <p className="text-xs text-[#6B7569] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quality strip */}
        <section className="bg-white border-y border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-5 h-px bg-[#C8993A]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kvalitetssikring</span>
                </div>
                <h2 className="font-serif text-3xl text-[#1A1F1C] font-normal mb-4">
                  Verifikation inden aktivering
                </h2>
                <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
                  Inden en fagperson tilknyttes et forløb i {m.name} Kommune, gennemgår Kursskifte en grundig kvalitetssikring af kompetencer og baggrund.
                </p>
                <div className="space-y-3">
                  {[
                    'Straffeattest og børneattest verificeres',
                    'CV og uddannelse gennemgås manuelt',
                    'Kapacitet og tilgængelighed registreres',
                    'Profil godkendes inden aktivering',
                    'Løbende opfølgning under forløbet',
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
                    { label: 'Matchning', value: 'Fagligt begrundet, systematisk' },
                    { label: 'Dokumentation', value: 'Sessionslogs og timeregistrering' },
                    { label: 'Takst', value: 'Administreret af Kursskifte' },
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

        {/* Other municipalities */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Vi betjener hele Nordjylland</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { slug: 'aalborg', name: 'Aalborg' },
              { slug: 'hjoerring', name: 'Hjørring' },
              { slug: 'frederikshavn', name: 'Frederikshavn' },
              { slug: 'broenderslev', name: 'Brønderslev' },
              { slug: 'rebild', name: 'Rebild' },
              { slug: 'jammerbugt', name: 'Jammerbugt' },
              { slug: 'mariagerfjord', name: 'Mariagerfjord' },
              { slug: 'vesthimmerland', name: 'Vesthimmerland' },
              { slug: 'morso', name: 'Morsø' },
              { slug: 'thisted', name: 'Thisted' },
            ]
              .filter(k => k.slug !== slug)
              .map(k => (
                <Link
                  key={k.slug}
                  href={`/kommuner/${k.slug}`}
                  className="h-9 px-4 bg-white border border-[#E0DAD0] rounded-xl text-sm text-[#6B7569] hover:text-[#1C3829] hover:border-[#1C3829] transition-colors inline-flex items-center"
                >
                  {k.name}
                </Link>
              ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#EDE9E1] border-t border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
            <div className="bg-[#1C3829] rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-2">
                  Klar til at indsende en sag fra {m.name} Kommune?
                </h2>
                <p className="text-sm text-white/65">Vi bekræfter modtagelse og vender typisk tilbage inden for 1–3 arbejdsdage.</p>
              </div>
              <Link
                href="/intake"
                className="shrink-0 h-11 px-6 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors inline-flex items-center gap-2"
              >
                Indsend sag <ArrowRight />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
