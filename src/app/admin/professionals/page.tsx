import { createServiceClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { ProfessionalsClient } from './ProfessionalsClient'

export default async function ProfessionalsPage() {
  const db = createServiceClient()

  const { data: professionals } = await (db as any)
    .from('professionals')
    .select(`
      id, profession, experience_years, max_complexity_level,
      target_age_groups, qualifications, capacity_hours_week,
      max_concurrent_cases, availability_status, availability_days,
      status, gender, education, certificates, daily_occupation,
      experience_with_genders, created_at, updated_at,
      profile_image_url, profession_type_id, max_hours_per_week,
      profession_types(name),
      profiles(full_name, email)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader
        label="Kursskifte Administration"
        title="Kontaktpersoner"
        subtitle="Administrer profiler, status og dokumenter"
        breadcrumb={[{ label: 'Kursskifte Administration', href: '/admin' }, { label: 'Kontaktpersoner' }]}
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
  created_at: string
  updated_at: string | null
  profile_image_url: string | null
  profession_type_id: string | null
  max_hours_per_week: number | null
  profession_types: { name: string } | null
  profiles: { full_name: string; email: string } | null
}
