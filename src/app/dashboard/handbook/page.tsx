import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { HANDBOOK_SECTIONS } from '@/lib/handbook-content'
import { HandbookClient } from './HandbookClient'

export default async function HandbookPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <PageHeader
        label="Guide"
        title="Håndbog for kontaktpersoner"
        subtitle="Sådan virker systemet, og hvad du gør i forskellige situationer med en borger"
        breadcrumb={[{ label: 'Mit overblik', href: '/dashboard' }, { label: 'Håndbog' }]}
      />
      <ContentContainer>
        <HandbookClient sections={HANDBOOK_SECTIONS} />
      </ContentContainer>
    </div>
  )
}
