import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { createAnonClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Viden om kontaktpersonforløb | Kursskifte Indsigt',
  description:
    'Faglige artikler om kontaktpersonforløb, §32 i barnets lov og §85, socialfaglig matching, dokumentation og lovgivning. Skrevet til kommuner, socialrådgivere og kontaktpersoner i Nordjylland.',
  alternates: { canonical: '/indsigt' },
  openGraph: {
    title: 'Viden om kontaktpersonforløb | Kursskifte Indsigt',
    description:
      'Faglige artikler og vejledninger om kontaktpersonforløb, §32 i barnets lov og §85, socialpædagogisk støtte og matchning — fra Kursskifte.',
    url: '/indsigt',
  },
}

type Article = {
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  published_at: string
  reading_time_minutes: number
}

type Category = {
  slug: string
  name: string
  description: string | null
  sort_order: number
}

const CATEGORY_COLORS: Record<string, string> = {
  'vejledning': 'bg-[#EEF4F0] text-[#1C3829]',
  'faglig-viden': 'bg-[#FDF6E8] text-[#8B5E1A]',
  'matchning': 'bg-[#F0F0F8] text-[#3B3B8B]',
  'dokumentation': 'bg-[#F8F0F0] text-[#8B1A1A]',
  'lovgivning': 'bg-[#F0F8F4] text-[#1A5C3A]',
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export default async function IndsightPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>
}) {
  const { kategori } = await searchParams
  const db = createAnonClient()

  const [articlesResult, categoriesResult] = await Promise.all([
    db
      .from('cms_articles' as never)
      .select('slug, title, excerpt, category, tags, published_at, reading_time_minutes')
      .eq('is_published', true)
      .order('published_at', { ascending: false }),
    db
      .from('cms_categories' as never)
      .select('slug, name, description, sort_order')
      .order('sort_order'),
  ])

  const allArticles = (articlesResult.data ?? []) as Article[]
  const categories = (categoriesResult.data ?? []) as Category[]

  const articles = kategori
    ? allArticles.filter(a => a.category === kategori)
    : allArticles

  const activeCategory = categories.find(c => c.slug === kategori)

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-12 sm:pt-20">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Vidensbase</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1F1C] font-normal max-w-2xl mb-5 leading-tight tracking-tight">
            {activeCategory ? activeCategory.name : 'Viden om kontaktpersonforløb'}
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed max-w-xl">
            {activeCategory?.description ??
              'Faglige artikler og vejledninger om kontaktpersonforløb, §32 i barnets lov og §85, socialpædagogisk støtte og matchning — skrevet til kommuner, socialrådgivere og fagpersoner.'}
          </p>
        </section>

        {/* Category filter */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-8">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/indsigt"
              className={[
                'h-9 px-4 rounded-xl text-sm font-medium transition-colors inline-flex items-center',
                !kategori
                  ? 'bg-[#1C3829] text-white'
                  : 'bg-white border border-[#E0DAD0] text-[#6B7569] hover:text-[#1C3829] hover:border-[#1C3829]',
              ].join(' ')}
            >
              Alle ({allArticles.length})
            </Link>
            {categories.map(c => {
              const count = allArticles.filter(a => a.category === c.slug).length
              return (
                <Link
                  key={c.slug}
                  href={`/indsigt?kategori=${c.slug}`}
                  className={[
                    'h-9 px-4 rounded-xl text-sm font-medium transition-colors inline-flex items-center',
                    kategori === c.slug
                      ? 'bg-[#1C3829] text-white'
                      : 'bg-white border border-[#E0DAD0] text-[#6B7569] hover:text-[#1C3829] hover:border-[#1C3829]',
                  ].join(' ')}
                >
                  {c.name} ({count})
                </Link>
              )
            })}
          </div>
        </section>

        {/* Articles grid */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
          {articles.length === 0 ? (
            <div className="text-center py-16 text-[#6B7569] text-sm">Ingen artikler fundet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => {
                const catColor = CATEGORY_COLORS[article.category] ?? 'bg-[#F6F3EE] text-[#6B7569]'
                const catName = categories.find(c => c.slug === article.category)?.name ?? article.category
                return (
                  <Link
                    key={article.slug}
                    href={`/indsigt/${article.slug}`}
                    className="group bg-white border border-[#E0DAD0] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#1C3829] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${catColor}`}>
                        {catName}
                      </span>
                      <span className="text-[10px] text-[#6B7569]">{article.reading_time_minutes} min</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-serif text-lg text-[#1A1F1C] font-normal leading-snug mb-2 group-hover:text-[#1C3829] transition-colors">
                        {article.title}
                      </h2>
                      <p className="text-sm text-[#6B7569] leading-relaxed line-clamp-3">{article.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#1C3829]">
                      Læs artikel <ArrowRight />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* CTA strip */}
        <section className="bg-[#EDE9E1] border-t border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-1">Klar til at indsende en sag?</h2>
                <p className="text-sm text-[#6B7569]">Vi varetager matchning, dokumentation og koordination.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/kontakt" className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2">
                  Indsend sag <ArrowRight />
                </Link>
                <Link href="/kommuner" className="h-10 px-5 border border-[#1C3829] text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#EEF4F0] transition-colors inline-flex items-center gap-2">
                  Se processen <ArrowRight />
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
