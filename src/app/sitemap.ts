import { MetadataRoute } from 'next'
import { createAnonClient } from '@/lib/supabase/server'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://kursskifte.dk'

  let articles: { slug: string; published_at: string }[] = []
  let municipalities: { slug: string; updated_at: string }[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const db = createAnonClient()
      const [articlesResult, municipalitiesResult] = await Promise.all([
        db.from('cms_articles' as never).select('slug, published_at').eq('is_published', true),
        db.from('cms_municipalities' as never).select('slug, updated_at'),
      ])
      articles = (articlesResult.data ?? []) as { slug: string; published_at: string }[]
      municipalities = (municipalitiesResult.data ?? []) as { slug: string; updated_at: string }[]
    } catch {
      // silently fall back to static pages
    }
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/kommuner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/kontaktpersoner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/intake`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/metode`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/indsigt`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/om-kursskifte`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/kontakt`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const municipalityPages: MetadataRoute.Sitemap = municipalities.map(m => ({
    url: `${base}/kommuner/${m.slug}`,
    lastModified: new Date(m.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }))

  const articlePages: MetadataRoute.Sitemap = articles.map(a => ({
    url: `${base}/indsigt/${a.slug}`,
    lastModified: a.published_at ? new Date(a.published_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...municipalityPages, ...articlePages]
}
