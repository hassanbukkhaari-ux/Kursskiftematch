import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { HoursClient } from './HoursClient'

interface PageProps {
  searchParams: Promise<{ case_id?: string }>
}

function mondayOf(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default async function HoursPage({ searchParams }: PageProps) {
  const { case_id } = await searchParams
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const thisMonday = mondayOf(new Date())
  const nextMonday = new Date(thisMonday); nextMonday.setDate(thisMonday.getDate() + 7)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [hoursRes, casesRes, plannedRes] = await Promise.all([
    db.from('registered_hours')
      .select('id, case_id, work_date, work_type, hours, description, status, created_at')
      .eq('professional_id', user.id)
      .order('work_date', { ascending: false })
      .limit(100),
    db.from('v_cases_with_professional')
      .select('id, citizen_initials, citizen_age_range')
      .eq('professional_id', user.id)
      .in('status', ['ACTIVE', 'MATCHED']),
    db.from('planned_hours')
      .select('week_start, planned_hours')
      .eq('professional_id', user.id)
      .in('week_start', [fmt(thisMonday), fmt(nextMonday)]),
  ])

  const plannedThisWeek = (plannedRes.data ?? [])
    .filter(p => p.week_start === fmt(thisMonday))
    .reduce((sum, p) => sum + (p.planned_hours ?? 0), 0)
  const plannedNextWeek = (plannedRes.data ?? [])
    .filter(p => p.week_start === fmt(nextMonday))
    .reduce((sum, p) => sum + (p.planned_hours ?? 0), 0)

  return (
    <div>
      <PageHeader
        label="Timeregistrering"
        title="Registrerede timer"
        subtitle={`${hoursRes.data?.length ?? 0} registreringer`}
        breadcrumb={[{ label: 'Mit overblik', href: '/dashboard' }, { label: 'Timeregistrering' }]}
      />
      <ContentContainer>
        <Card className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-medium text-[#1A1F1C]">Kommende planlagte timer</div>
            <div className="text-xs text-[#6B7569] mt-0.5">
              Denne uge: {plannedThisWeek} t · Næste uge: {plannedNextWeek} t
            </div>
          </div>
          <Link href="/dashboard/planning" className="text-xs font-semibold text-[#1C3829] hover:underline shrink-0">
            Se/ret planlægning →
          </Link>
        </Card>
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
