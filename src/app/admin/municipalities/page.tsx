import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { MunicipalitiesClient } from './MunicipalitiesClient'

export type MunicipalityCaseStats = {
  municipality_id: string
  active: number
  completed_90d: number
}

export default async function MunicipalitiesPage() {
  const db = await createClient()

  const [{ data: municipalities }, { data: cases }] = await Promise.all([
    db
      .from('municipalities')
      .select('id, name, status, sagsbehandler_name, sagsbehandler_email, sagsbehandler_phone, secondary_contact_name, secondary_contact_email, secondary_contact_phone, created_at')
      .order('name', { ascending: true }),
    db
      .from('cases')
      .select('municipality_id, status, updated_at')
      .neq('status', 'ARCHIVED'),
  ])

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const ACTIVE_STATUSES = new Set(['OPEN', 'MATCHED', 'PROPOSED', 'ACTIVE'])

  const statsMap = new Map<string, MunicipalityCaseStats>()
  for (const c of cases ?? []) {
    if (!statsMap.has(c.municipality_id)) {
      statsMap.set(c.municipality_id, { municipality_id: c.municipality_id, active: 0, completed_90d: 0 })
    }
    const s = statsMap.get(c.municipality_id)!
    if (ACTIVE_STATUSES.has(c.status)) s.active++
    if (c.status === 'COMPLETED' && new Date(c.updated_at) >= cutoff) s.completed_90d++
  }

  const caseStats = Array.from(statsMap.values())

  return (
    <div>
      <PageHeader
        label="Kursskifte Administration"
        title="Kommuner"
        subtitle="Kommuneaftaler og kontaktpersoner"
        breadcrumb={[{ label: 'Kursskifte Administration', href: '/admin' }, { label: 'Kommuner' }]}
      />
      <ContentContainer>
        <MunicipalitiesClient initialData={municipalities ?? []} caseStats={caseStats} />
      </ContentContainer>
    </div>
  )
}
