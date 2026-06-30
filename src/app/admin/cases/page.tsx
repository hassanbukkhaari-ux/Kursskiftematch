import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { AdminCasesClient } from './AdminCasesClient'

export default async function AdminCasesPage() {
  const db = await createClient()

  const [casesRes, munisRes] = await Promise.all([
    db.from('cases')
      .select('id, citizen_initials, citizen_age_range, status, complexity_level, weekly_hours, municipality_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    db.from('municipalities')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name', { ascending: true }),
  ])

  const muniMap = Object.fromEntries(
    (munisRes.data ?? []).map(m => [m.id, m.name]),
  )

  const cases = (casesRes.data ?? []).map(c => ({
    ...c,
    municipality_name: muniMap[c.municipality_id] ?? 'Ukendt',
  }))

  return (
    <div>
      <PageHeader
        label="Administration"
        title="Sager"
        subtitle="Oversigt over alle aktive og arkiverede sager"
        breadcrumb={[{ label: 'Administration', href: '/admin' }, { label: 'Sager' }]}
      />
      <ContentContainer>
        <AdminCasesClient
          initialCases={cases}
          municipalities={munisRes.data ?? []}
        />
      </ContentContainer>
    </div>
  )
}

export type AdminCase = {
  id: string
  citizen_initials: string
  citizen_age_range: string
  status: 'OPEN' | 'MATCHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  complexity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  weekly_hours: number
  municipality_id: string
  municipality_name: string
  created_at: string
}

export type MunicipalityOption = {
  id: string
  name: string
}
