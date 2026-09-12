import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { PlanningClient } from './PlanningClient'

const WEEKS_AHEAD = 6

function mondayOf(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default async function PlanningPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const firstMonday = mondayOf(new Date())
  const weekStarts: string[] = []
  for (let i = 0; i < WEEKS_AHEAD; i++) {
    const d = new Date(firstMonday)
    d.setDate(firstMonday.getDate() + i * 7)
    weekStarts.push(d.toISOString().slice(0, 10))
  }

  const [casesRes, plannedRes, proRes] = await Promise.all([
    db.from('v_cases_with_professional')
      .select('id, citizen_initials, citizen_age_range, status, active_grant_hours, approved_hours_used')
      .eq('professional_id', user.id)
      .in('status', ['ACTIVE', 'MATCHED']),
    db.from('planned_hours')
      .select('id, case_id, week_start, planned_hours')
      .eq('professional_id', user.id)
      .gte('week_start', weekStarts[0])
      .lte('week_start', weekStarts[weekStarts.length - 1]),
    db.from('professionals').select('capacity_hours_week').eq('id', user.id).single(),
  ])

  return (
    <div>
      <PageHeader
        label="Planlægning"
        title="Timeplanlægning"
        subtitle="Planlæg dine kommende ugers timer per borger"
        breadcrumb={[{ label: 'Mit overblik', href: '/dashboard' }, { label: 'Timeplanlægning' }]}
      />
      <ContentContainer>
        <PlanningClient
          cases={(casesRes.data ?? []) as PlanningCase[]}
          initialPlanned={(plannedRes.data ?? []) as PlannedHoursRow[]}
          weekStarts={weekStarts}
          capacityHoursWeek={proRes.data?.capacity_hours_week ?? null}
        />
      </ContentContainer>
    </div>
  )
}

export type PlanningCase = {
  id: string
  citizen_initials: string
  citizen_age_range: string
  status: string
  active_grant_hours: number | null
  approved_hours_used: number
}

export type PlannedHoursRow = {
  id: string
  case_id: string
  week_start: string
  planned_hours: number
}
