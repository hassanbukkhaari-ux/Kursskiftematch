import { createServiceClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { AdminSessionLogsClient, type AdminLogRow } from './AdminSessionLogsClient'

export default async function AdminSessionLogsPage() {
  const svc = createServiceClient()

  const { data } = await (svc as any)
    .from('session_logs')
    .select(`
      id, case_id, session_date, duration_minutes, observations,
      citizen_mood_tone, follow_up_needed, follow_up_reason,
      status, created_at,
      cases!inner(citizen_initials, citizen_age_range),
      professionals!inner(profiles!inner(full_name))
    `)
    .order('session_date', { ascending: false })
    .limit(200)

  const logs: AdminLogRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    case_id: r.case_id,
    citizen_initials: r.cases?.citizen_initials ?? '??',
    citizen_age_range: r.cases?.citizen_age_range ?? '',
    professional_name: r.professionals?.profiles?.full_name ?? 'Ukendt',
    session_date: r.session_date,
    duration_minutes: r.duration_minutes,
    observations: r.observations,
    citizen_mood_tone: r.citizen_mood_tone,
    follow_up_needed: r.follow_up_needed,
    follow_up_reason: r.follow_up_reason,
    status: r.status,
    created_at: r.created_at,
  }))

  return (
    <div>
      <PageHeader
        label="Dokumentation"
        title="Sessionslogs"
        subtitle={`${logs.length} registrerede sessioner på tværs af alle sager`}
        breadcrumb={[
          { label: 'Kursskifte Administration', href: '/admin' },
          { label: 'Sessionslogs' },
        ]}
      />
      <ContentContainer>
        <AdminSessionLogsClient initialLogs={logs} />
      </ContentContainer>
    </div>
  )
}
