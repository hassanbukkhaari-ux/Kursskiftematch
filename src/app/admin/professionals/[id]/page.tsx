import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { ProfessionalDetailClient } from './ProfessionalDetailClient'
import type { DocumentRow, CertificateRow } from '@/app/dashboard/profile/page'

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const db = await createClient()

  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dba = db as any

  const [proRes, profileRes, docsRes, certsRes, geoRes, compRes, methRes, tgRes, wtRes, langRes] = await Promise.all([
    dba.from('professionals')
      .select(`
        id, profession, experience_years, max_complexity_level,
        availability_status, status, gender, education, daily_occupation,
        job_title, phone, address, postal_code, city, region,
        profession_type_id, specialization, authorization, bio,
        max_hours_per_week, available_now, can_take_acute,
        can_work_evening, can_work_weekend, can_work_night,
        has_drivers_license, has_own_car, can_transport_citizen,
        max_driving_radius_km, updated_at, created_at,
        profession_types(name)
      `)
      .eq('id', id)
      .single(),

    db.from('profiles').select('full_name, email').eq('id', id).single(),

    dba.from('professional_documents')
      .select('id, document_type, status, file_name, uploaded_at, verified_at, expiry_date')
      .eq('professional_id', id)
      .order('document_type'),

    dba.from('professional_certificates')
      .select('id, certificate_type_id, custom_name, issued_at, expires_at, status, certificate_types(name)')
      .eq('professional_id', id)
      .order('created_at', { ascending: false }),

    dba.from('professional_geography')
      .select('municipalities(id, name)')
      .eq('professional_id', id),

    dba.from('professional_competencies')
      .select('competency_types(name)')
      .eq('professional_id', id),

    dba.from('professional_methods')
      .select('method_types(name)')
      .eq('professional_id', id),

    dba.from('professional_target_groups')
      .select('target_group_types(name)')
      .eq('professional_id', id),

    dba.from('professional_work_tasks')
      .select('work_task_types(name)')
      .eq('professional_id', id),

    dba.from('professional_languages')
      .select('language_types(name)')
      .eq('professional_id', id),
  ])

  if (proRes.error || !proRes.data) notFound()

  const professional = proRes.data as unknown as ProfessionalDetail
  const profileData = profileRes.data
  const profile = { full_name: profileData?.full_name ?? '', email: profileData?.email ?? '' }

  const geoNames = ((geoRes.data ?? []) as unknown as { municipalities: { id: string; name: string } | null }[])
    .map(r => r.municipalities?.name).filter(Boolean) as string[]

  const compNames = ((compRes.data ?? []) as unknown as { competency_types: { name: string } | null }[])
    .map(r => r.competency_types?.name).filter(Boolean) as string[]

  const methNames = ((methRes.data ?? []) as unknown as { method_types: { name: string } | null }[])
    .map(r => r.method_types?.name).filter(Boolean) as string[]

  const tgNames = ((tgRes.data ?? []) as unknown as { target_group_types: { name: string } | null }[])
    .map(r => r.target_group_types?.name).filter(Boolean) as string[]

  const wtNames = ((wtRes.data ?? []) as unknown as { work_task_types: { name: string } | null }[])
    .map(r => r.work_task_types?.name).filter(Boolean) as string[]

  const langNames = ((langRes.data ?? []) as unknown as { language_types: { name: string } | null }[])
    .map(r => r.language_types?.name).filter(Boolean) as string[]

  return (
    <div>
      <PageHeader
        label="Fagperson"
        title={profile.full_name || 'Profil'}
        subtitle={profile.email}
        breadcrumb={[
          { label: 'Administration', href: '/admin' },
          { label: 'Fagpersoner', href: '/admin/professionals' },
          { label: profile.full_name || 'Detalje' },
        ]}
      />
      <ContentContainer>
        <ProfessionalDetailClient
          professionalId={id}
          professional={professional}
          profile={profile}
          documents={(docsRes.data ?? []) as DocumentRow[]}
          certificates={(certsRes.data ?? []) as CertificateRow[]}
          geographyNames={geoNames}
          competencyNames={compNames}
          methodNames={methNames}
          targetGroupNames={tgNames}
          workTaskNames={wtNames}
          languageNames={langNames}
        />
      </ContentContainer>
    </div>
  )
}

export type ProfessionalDetail = {
  id: string
  profession: string
  experience_years: number | null
  max_complexity_level: string | null
  availability_status: string | null
  status: string
  gender: string | null
  education: string | null
  daily_occupation: string | null
  job_title: string | null
  phone: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  region: string | null
  profession_type_id: string | null
  specialization: string | null
  authorization: string | null
  bio: string | null
  max_hours_per_week: number | null
  available_now: boolean
  can_take_acute: boolean
  can_work_evening: boolean
  can_work_weekend: boolean
  can_work_night: boolean
  has_drivers_license: boolean
  has_own_car: boolean
  can_transport_citizen: boolean
  max_driving_radius_km: number | null
  updated_at: string | null
  created_at: string
  profession_types: { name: string } | null
}
