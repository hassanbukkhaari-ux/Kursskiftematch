import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { AdminPlanningClient, type PlannedRow, type ProfessionalRow, type ActualRow } from './AdminPlanningClient'

function mondayOf(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default async function AdminPlanningPage() {
  const db = await createClient()
  const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const weekStart = mondayOf(new Date()).toISOString().slice(0, 10)
  const weekEndDate = new Date(`${weekStart}T00:00:00`)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = weekEndDate.toISOString().slice(0, 10)

  const [{ data: planned }, { data: professionals }, { data: actual }] = await Promise.all([
    dba.from('planned_hours')
      .select('id, case_id, professional_id, planned_hours, cases!inner(citizen_initials, citizen_age_range)')
      .eq('week_start', weekStart),
    dba.from('professionals')
      .select('id, capacity_hours_week, profiles!inner(full_name)')
      .eq('status', 'ACTIVE'),
    dba.from('registered_hours')
      .select('professional_id, case_id, hours')
      .gte('work_date', weekStart)
      .lte('work_date', weekEnd)
      .neq('status', 'REJECTED')
      .is('archived_at', null),
  ])

  return (
    <div>
      <PageHeader
        label="Kursskifte Administration"
        title="Timeplanlægning"
        subtitle="Overblik over kontaktpersonernes planlagte timer, uge for uge"
        breadcrumb={[
          { label: 'Kursskifte Administration', href: '/admin' },
          { label: 'Timeplanlægning' },
        ]}
      />
      <ContentContainer>
        <AdminPlanningClient
          initialWeekStart={weekStart}
          initialPlanned={(planned ?? []) as PlannedRow[]}
          initialProfessionals={(professionals ?? []) as ProfessionalRow[]}
          initialActual={(actual ?? []) as ActualRow[]}
        />
      </ContentContainer>
    </div>
  )
}
