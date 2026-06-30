import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { ProfessionalsClient } from './ProfessionalsClient'

export default async function ProfessionalsPage() {
  const db = await createClient()

  const { data: professionals } = await db
    .from('professionals')
    .select(`
      id, profession, experience_years, max_complexity_level,
      target_age_groups, qualifications, capacity_hours_week,
      max_concurrent_cases, availability_status, availability_days,
      status, gender, education, certificates, daily_occupation,
      experience_with_genders, geography, created_at, updated_at,
      profiles!inner(full_name, email)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader
        label="Administration"
        title="Fagpersoner"
        subtitle="Administrer profiler, status og dokumenter"
        breadcrumb={[{ label: 'Administration', href: '/admin' }, { label: 'Fagpersoner' }]}
      />
      <ContentContainer>
        <ProfessionalsClient initialData={(professionals ?? []) as unknown as ProfessionalRow[]} />
      </ContentContainer>
    </div>
  )
}

export type ProfessionalRow = {
  id: string
  profession: string
  experience_years: number
  max_complexity_level: string
  target_age_groups: string[]
  qualifications: string[]
  capacity_hours_week: number
  max_concurrent_cases: number
  availability_status: string
  availability_days: string[]
  status: string
  gender: string | null
  education: string | null
  certificates: string[]
  daily_occupation: string | null
  experience_with_genders: string[]
  geography: string[]
  created_at: string
  updated_at: string | null
  profiles: { full_name: string; email: string }
}
