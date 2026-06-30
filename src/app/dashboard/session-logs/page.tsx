import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { SessionLogsClient } from './SessionLogsClient'

interface PageProps {
  searchParams: Promise<{ case_id?: string }>
}

export default async function SessionLogsPage({ searchParams }: PageProps) {
  const { case_id } = await searchParams
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const [logsRes, casesRes] = await Promise.all([
    db.from('session_logs')
      .select('id, case_id, session_date, duration_minutes, observations, citizen_mood_tone, follow_up_needed, follow_up_reason, location, status, created_at')
      .eq('professional_id', user.id)
      .order('session_date', { ascending: false })
      .limit(100),
    db.from('v_cases_with_professional')
      .select('id, citizen_initials, citizen_age_range')
      .eq('professional_id', user.id)
      .in('status', ['ACTIVE', 'MATCHED']),
  ])

  return (
    <div>
      <PageHeader
        label="Dokumentation"
        title="Sessionslogs"
        subtitle={`${logsRes.data?.length ?? 0} registrerede sessioner`}
        breadcrumb={[{ label: 'Mit overblik', href: '/dashboard' }, { label: 'Sessionslogs' }]}
      />
      <ContentContainer>
        <SessionLogsClient
          initialLogs={logsRes.data ?? []}
          cases={casesRes.data ?? []}
          defaultCaseId={case_id}
        />
      </ContentContainer>
    </div>
  )
}

export type SessionLogRow = {
  id: string
  case_id: string
  session_date: string
  duration_minutes: number | null
  observations: string | null
  citizen_mood_tone: string | null
  follow_up_needed: boolean
  follow_up_reason: string | null
  location: string | null
  status: 'DRAFT' | 'FINAL' | 'CORRECTED' | 'ARCHIVED'
  created_at: string
}

export type CaseOption = {
  id: string
  citizen_initials: string
  citizen_age_range: string
}
