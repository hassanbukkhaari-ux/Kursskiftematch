import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer, SectionHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type ArticleRow = {
  id: string
  slug: string
  title: string
  category: string
  is_published: boolean
  published_at: string | null
  reading_time_minutes: number
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  'vejledning': 'Vejledning',
  'faglig-viden': 'Faglig viden',
  'matchning': 'Matchning',
  'dokumentation': 'Dokumentation',
  'lovgivning': 'Lovgivning',
}

export default async function AdminIndsightPage() {
  const db = await createClient()
  const { data: articles } = await db
    .from('cms_articles' as never)
    .select('id, slug, title, category, is_published, published_at, reading_time_minutes, created_at')
    .order('created_at', { ascending: false })

  const rows = (articles ?? []) as ArticleRow[]
  const published = rows.filter(a => a.is_published).length
  const drafts = rows.filter(a => !a.is_published).length

  return (
    <div>
      <PageHeader
        label="Indhold"
        title="Artikler"
        subtitle={`${published} udgivet · ${drafts} kladde`}
        actions={
          <Link
            href="/admin/indsigt/ny"
            className="h-9 px-4 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-2"
          >
            <PlusIcon /> Ny artikel
          </Link>
        }
      />
      <ContentContainer>
        <SectionHeader title="Alle artikler" />
        {rows.length === 0 ? (
          <Card>
            <p className="text-sm text-[#6B7569] text-center py-8">Ingen artikler endnu. Opret den første.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map(article => (
              <Link key={article.id} href={`/admin/indsigt/${article.id}`}>
                <Card hover className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829] shrink-0">
                      <ArticleIcon />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[#1A1F1C] text-sm truncate">{article.title}</div>
                      <div className="text-xs text-[#6B7569] flex items-center gap-2 mt-0.5">
                        <span>{CATEGORY_LABELS[article.category] ?? article.category}</span>
                        <span>·</span>
                        <span>{article.reading_time_minutes} min</span>
                        <span>·</span>
                        <span>/indsigt/{article.slug}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={article.is_published ? 'green' : 'default'} dot>
                      {article.is_published ? 'Udgivet' : 'Kladde'}
                    </Badge>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#E0DAD0]">
          <p className="text-sm text-[#6B7569]">
            Artikler vises på{' '}
            <Link href="/indsigt" target="_blank" className="text-[#1C3829] hover:underline">
              kursskifte.dk/indsigt
            </Link>
          </p>
        </div>
      </ContentContainer>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ArticleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
