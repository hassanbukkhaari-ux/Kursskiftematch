import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { AdminHoursClient } from './AdminHoursClient'

export default async function AdminHoursPage() {
  const db = await createClient()

  const hoursRes = await db
    .from('registered_hours')
    .select('id, case_id, professional_id, work_date, work_type, hours, description, status, submitted_at, review_note')
    .in('status', ['SUBMITTED', 'APPROVED', 'REJECTED'])
    .order('submitted_at', { ascending: false })
    .limit(200)

  const hours = hoursRes.data ?? []
  const caseIds = [...new Set(hours.map(h => h.case_id).filter(Boolean))]
  const profIds = [...new Set(hours.map(h => h.professional_id).filter(Boolean))]

  const [casesRes, profsRes] = await Promise.all([
    caseIds.length > 0
      ? db.from('cases').select('id, citizen_initials, citizen_age_range').in('id', caseIds)
      : Promise.resolve({ data: [] as { id: string; citizen_initials: string; citizen_age_range: string }[] }),
    profIds.length > 0
      ? db.from('profiles').select('id, full_name').in('id', profIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ])

  const caseMap = Object.fromEntries((casesRes.data ?? []).map(c => [c.id, c]))
  const profMap = Object.fromEntries((profsRes.data ?? []).map(p => [p.id, p]))

  // For the export filter's professional dropdown — independent of the
  // 200-row capped list above, so someone without recent submissions still
  // shows up as a choice.
  const { data: activeProfessionals } = await (db as any)
    .from('professionals')
    .select('id, profiles!inner(full_name)')
    .eq('status', 'ACTIVE')

  const professionalOptions = (activeProfessionals ?? [])
    .map((p: any) => ({ id: p.id, full_name: p.profiles?.full_name ?? 'Ukendt' }))
    .sort((a: { full_name: string }, b: { full_name: string }) => a.full_name.localeCompare(b.full_name, 'da'))

  const enriched: AdminHoursRow[] = hours.map(h => ({
    id: h.id,
    case_id: h.case_id,
    professional_id: h.professional_id,
    work_date: h.work_date,
    work_type: h.work_type,
    hours: h.hours,
    description: h.description,
    status: h.status as AdminHoursRow['status'],
    submitted_at: h.submitted_at,
    review_note: h.review_note,
    citizen_initials: caseMap[h.case_id]?.citizen_initials ?? '??',
    citizen_age_range: caseMap[h.case_id]?.citizen_age_range ?? '',
    professional_name: profMap[h.professional_id]?.full_name ?? 'Ukendt',
  }))

  const pendingCount = enriched.filter(h => h.status === 'SUBMITTED').length

  return (
    <div>
      <PageHeader
        label="Kursskifte Administration"
        title="Timeregistreringer"
        subtitle={pendingCount > 0 ? `${pendingCount} afventer godkendelse` : 'Ingen afventer godkendelse'}
        breadcrumb={[{ label: 'Kursskifte Administration', href: '/admin' }, { label: 'Timer' }]}
      />
      <ContentContainer>
        <AdminHoursClient initialHours={enriched} professionalOptions={professionalOptions} />
      </ContentContainer>
    </div>
  )
}

export type AdminHoursRow = {
  id: string
  case_id: string
  professional_id: string
  work_date: string
  work_type: string
  hours: number
  description: string | null
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  submitted_at: string | null
  review_note: string | null
  citizen_initials: string
  citizen_age_range: string
  professional_name: string
}
