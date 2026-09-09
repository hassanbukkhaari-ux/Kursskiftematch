import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { MarkdownContent } from '@/components/public/MarkdownContent'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Article = {
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  published_at: string
  reading_time_minutes: number
  meta_title: string | null
  meta_description: string | null
}

type CategoryInfo = {
  slug: string
  name: string
}

async function getArticle(slug: string): Promise<Article | null> {
  const db = createServiceClient()
  const { data } = await db
    .from('cms_articles' as never)
    .select('slug, title, excerpt, content, category, tags, published_at, reading_time_minutes, meta_title, meta_description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data as Article | null
}

async function getRelated(category: string, currentSlug: string): Promise<Article[]> {
  const db = createServiceClient()
  const { data } = await db
    .from('cms_articles' as never)
    .select('slug, title, excerpt, category, tags, published_at, reading_time_minutes, meta_title, meta_description, content')
    .eq('category', category)
    .eq('is_published', true)
    .neq('slug', currentSlug)
    .limit(3)
  return (data ?? []) as Article[]
}

async function getCategory(slug: string): Promise<CategoryInfo | null> {
  const db = createServiceClient()
  const { data } = await db
    .from('cms_categories' as never)
    .select('slug, name')
    .eq('slug', slug)
    .single()
  return data as CategoryInfo | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: 'Artikel ikke fundet' }

  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.excerpt,
    alternates: { canonical: `/indsigt/${slug}` },
    openGraph: {
      title: article.meta_title ?? article.title,
      description: article.meta_description ?? article.excerpt,
      url: `/indsigt/${slug}`,
      type: 'article',
    },
  }
}

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
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

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [article, category] = await Promise.all([
    getArticle(slug),
    getArticle(slug).then(a => a ? getCategory(a.category) : null),
  ])
  if (!article) notFound()

  const related = await getRelated(article.category, slug)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    author: { '@type': 'Organization', name: 'Kursskifte ApS' },
    publisher: { '@type': 'Organization', name: 'Kursskifte ApS', url: 'https://kursskifte.dk' },
    datePublished: article.published_at,
    keywords: article.tags.join(', '),
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <PublicNav />
      <main>
        {/* Header */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pt-14 pb-10 sm:pt-18">
          <Link
            href="/indsigt"
            className="inline-flex items-center gap-1.5 text-xs text-[#6B7569] hover:text-[#1C3829] transition-colors mb-8"
          >
            <ArrowLeft /> Tilbage til vidensbasen
          </Link>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#C8993A]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">
              {category?.name ?? article.category}
            </span>
            <span className="text-[10px] text-[#6B7569]">· {article.reading_time_minutes} min læsning</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1F1C] font-normal leading-tight tracking-tight mb-5">
            {article.title}
          </h1>
          <p className="text-[17px] text-[#6B7569] leading-relaxed">
            {article.excerpt}
          </p>
        </section>

        {/* Article content */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 pb-16">
          <div className="bg-white border border-[#E0DAD0] rounded-2xl p-8 sm:p-10 article-content">
            <MarkdownContent content={article.content} />
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {article.tags.map(tag => (
                <span key={tag} className="text-xs text-[#6B7569] bg-white border border-[#E0DAD0] rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="bg-white border-y border-[#E0DAD0]">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-5 h-px bg-[#C8993A]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Relaterede artikler</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map(r => (
                  <Link
                    key={r.slug}
                    href={`/indsigt/${r.slug}`}
                    className="group bg-[#F6F3EE] border border-[#E0DAD0] rounded-2xl p-6 flex flex-col gap-3 hover:border-[#1C3829] transition-colors"
                  >
                    <h3 className="font-serif text-base text-[#1A1F1C] font-normal leading-snug group-hover:text-[#1C3829] transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-xs text-[#6B7569] leading-relaxed line-clamp-2">{r.excerpt}</p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#1C3829] mt-auto">
                      Læs <ArrowRight />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-[#EDE9E1] border-t border-[#E0DAD0]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="font-serif text-2xl text-[#1A1F1C] font-normal mb-1">Har I brug for en kvalitetssikret kontaktperson?</h2>
                <p className="text-sm text-[#6B7569]">Kursskifte varetager matchning, dokumentation og koordination til kommuner i Nordjylland.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/kontakt" className="h-10 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2">
                  Indsend sag <ArrowRight />
                </Link>
                <Link href="/kontakt" className="h-10 px-5 border border-[#1C3829] text-[#1C3829] text-sm font-semibold rounded-xl hover:bg-[#EEF4F0] transition-colors inline-flex items-center">
                  Kontakt os
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
