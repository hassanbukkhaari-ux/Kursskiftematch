import { createServiceClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { AdminStatusReportsClient } from './AdminStatusReportsClient'

export default async function AdminStatusReportsPage() {
  const svc = createServiceClient() as any

  const [{ data: requests }, { data: cases }, { data: professionals }] = await Promise.all([
    svc.from('status_report_requests')
      .select(`
        id, case_id, report_type, deadline, promised_date, status, message, created_at,
        cases!inner(citizen_initials, citizen_age_range),
        professionals!inner(id, profiles!inner(full_name, email)),
        status_reports(id, submitted_at)
      `)
      .order('deadline', { ascending: true }),

    svc.from('cases')
      .select('id, citizen_initials, citizen_age_range, status')
      .in('status', ['ACTIVE', 'OPEN', 'MATCHING']),

    svc.from('professionals')
      .select('id, profiles!inner(full_name)')
      .eq('status', 'ACTIVE'),
  ])

  return (
    <div>
      <PageHeader
        label="Kursskifte Administration"
        title="Statusrapporter"
        subtitle="Anmod om og følg op på rapporter fra kontaktpersoner"
        breadcrumb={[
          { label: 'Kursskifte Administration', href: '/admin' },
          { label: 'Statusrapporter' },
        ]}
      />
      <ContentContainer>
        <AdminStatusReportsClient
          initialRequests={(requests ?? []) as any[]}
          cases={(cases ?? []) as any[]}
          professionals={(professionals ?? []) as any[]}
        />
      </ContentContainer>
    </div>
  )
}
