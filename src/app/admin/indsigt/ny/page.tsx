import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { ArticleEditorClient } from '../ArticleEditorClient'

export default function NewArticlePage() {
  return (
    <div>
      <PageHeader
        label="Indhold"
        title="Ny artikel"
        breadcrumb={[
          { label: 'Artikler', href: '/admin/indsigt' },
          { label: 'Ny artikel' },
        ]}
      />
      <ContentContainer>
        <ArticleEditorClient article={null} isNew={true} />
      </ContentContainer>
    </div>
  )
}
