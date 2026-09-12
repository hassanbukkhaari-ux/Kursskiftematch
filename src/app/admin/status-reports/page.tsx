import { createServiceClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { AdminStatusReportsClient } from './AdminStatusReportsClient'

interface PageProps {
  searchParams: Promise<{ new?: string; case_id?: string }>
}

export default async function AdminStatusReportsPage({ searchParams }: PageProps) {
  const { new: openNew, case_id: initialCaseId } = await searchParams
  const svc = createServiceClient() as any

  const [{ data: requests }, { data: activeCases }, { data: professionals }] = await Promise.all([
    svc.from('status_report_requests')
      .select(`
        id, case_id, report_type, deadline, promised_date, status, message, created_at,
        cases!inner(citizen_initials, citizen_age_range),
        professionals!inner(id, profiles!inner(full_name, email)),
        status_reports(id, submitted_at)
      `)
      .order('deadline', { ascending: true }),

    svc.from('cases')
      .select('id, citizen_initials, citizen_age_range, status, municipality_id, professional_id, municipalities(name)')
      .in('status', ['ACTIVE', 'OPEN', 'MATCHED']),

    svc.from('professionals')
      .select('id, profiles!inner(full_name)')
      .eq('status', 'ACTIVE'),
  ])

  // Find active cases with no pending/acknowledged request (blind spots)
  const pendingCaseIds = new Set(
    (requests ?? [])
      .filter((r: any) => r.status === 'PENDING' || r.status === 'ACKNOWLEDGED')
      .map((r: any) => r.case_id)
  )
  const casesWithoutRequest = (activeCases ?? []).filter((c: any) => !pendingCaseIds.has(c.id))
  const cases = activeCases ?? []

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
          cases={cases as any[]}
          professionals={(professionals ?? []) as any[]}
          casesWithoutRequest={casesWithoutRequest as any[]}
          initialCreating={openNew === '1'}
          initialCaseId={initialCaseId}
        />
      </ContentContainer>
    </div>
  )
}
