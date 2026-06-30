import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { HoursClient } from './HoursClient'

interface PageProps {
  searchParams: Promise<{ case_id?: string }>
}

export default async function HoursPage({ searchParams }: PageProps) {
  const { case_id } = await searchParams
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const [hoursRes, casesRes] = await Promise.all([
    db.from('registered_hours')
      .select('id, case_id, work_date, work_type, hours, description, status, created_at')
      .eq('professional_id', user.id)
      .order('work_date', { ascending: false })
      .limit(100),
    db.from('v_cases_with_professional')
      .select('id, citizen_initials, citizen_age_range')
      .eq('professional_id', user.id)
      .in('status', ['ACTIVE', 'MATCHED']),
  ])

  return (
    <div>
      <PageHeader
        label="Timeregistrering"
        title="Registrerede timer"
        subtitle={`${hoursRes.data?.length ?? 0} registreringer`}
        breadcrumb={[{ label: 'Mit overblik', href: '/dashboard' }, { label: 'Timeregistrering' }]}
      />
      <ContentContainer>
        <HoursClient
          initialHours={hoursRes.data ?? []}
          cases={casesRes.data ?? []}
          defaultCaseId={case_id}
        />
      </ContentContainer>
    </div>
  )
}

export type HoursRow = {
  id: string
  case_id: string
  work_date: string
  work_type: string
  hours: number
  description: string | null
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'OUTSIDE_GRANT'
  created_at: string
}

export type CaseOption = {
  id: string
  citizen_initials: string
  citizen_age_range: string
}
