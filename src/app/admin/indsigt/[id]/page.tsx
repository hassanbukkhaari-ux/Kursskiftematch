import { notFound } from 'next/navigation'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { ArticleEditorClient } from '../ArticleEditorClient'
import { createClient } from '@/lib/supabase/server'

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createClient()

  const { data: article } = await db
    .from('cms_articles' as never)
    .select('id, slug, title, excerpt, content, category, tags, is_published, reading_time_minutes, meta_title, meta_description')
    .eq('id', id)
    .single()

  if (!article) notFound()

  const a = article as {
    id: string
    slug: string
    title: string
    excerpt: string
    content: string
    category: string
    tags: string[]
    is_published: boolean
    reading_time_minutes: number
    meta_title: string | null
    meta_description: string | null
  }

  return (
    <div>
      <PageHeader
        label="Indhold"
        title={a.title}
        subtitle={a.is_published ? 'Udgivet' : 'Kladde'}
        breadcrumb={[
          { label: 'Artikler', href: '/admin/indsigt' },
          { label: a.title },
        ]}
      />
      <ContentContainer>
        <ArticleEditorClient article={a} isNew={false} />
      </ContentContainer>
    </div>
  )
}
