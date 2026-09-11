import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './OnboardingWizard'

export default async function OnboardingPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dba = db as any

  const [
    profileRes,
    professionalRes,
    profTypesRes,
    compTypesRes,
    munisRes,
    consentsRes,
    compSelRes,
    geoSelRes,
  ] = await Promise.all([
    db.from('profiles').select('full_name, role').eq('id', user.id).single(),
    dba.from('professionals').select('phone, job_title, profession_type_id').eq('id', user.id).maybeSingle(),
    dba.from('profession_types').select('id, name').eq('is_active', true).order('sort_order'),
    dba.from('competency_types').select('id, name').eq('is_active', true).order('sort_order'),
    db.from('municipalities').select('id, name').eq('status', 'ACTIVE').order('name'),
    dba.from('professional_consents').select('consent_type').eq('professional_id', user.id),
    dba.from('professional_competencies').select('competency_type_id').eq('professional_id', user.id),
    dba.from('professional_geography').select('municipality_id').eq('professional_id', user.id),
  ])

  if (profileRes.data?.role === 'admin') redirect('/admin')
  if (profileRes.data?.role !== 'professional') redirect('/login')

  return (
    <OnboardingWizard
      profileName={profileRes.data?.full_name ?? ''}
      professional={professionalRes.data ?? null}
      professionTypes={profTypesRes.data ?? []}
      competencyTypes={compTypesRes.data ?? []}
      municipalities={munisRes.data ?? []}
      existingConsents={(consentsRes.data ?? []).map((r: { consent_type: string }) => r.consent_type)}
      existingCompetencies={(compSelRes.data ?? []).map((r: { competency_type_id: string }) => r.competency_type_id)}
      existingGeography={(geoSelRes.data ?? []).map((r: { municipality_id: string }) => r.municipality_id)}
    />
  )
}
