import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dba = db as any

  const [
    profileRes,
    professionalRes,
    lookupsRes,
    selectionsRes,
    geoRes,
    docsRes,
    certsRes,
    consentsRes,
    munisRes,
  ] = await Promise.all([
    db.from('profiles').select('full_name, email').eq('id', user.id).single(),
    db.from('professionals').select('*').eq('id', user.id).maybeSingle(),

    // All lookup tables (new tables not yet in generated types — use dba)
    Promise.all([
      dba.from('profession_types').select('id, name').eq('is_active', true).order('sort_order'),
      dba.from('competency_types').select('id, name').eq('is_active', true).order('sort_order'),
      dba.from('method_types').select('id, name').eq('is_active', true).order('sort_order'),
      dba.from('target_group_types').select('id, name').eq('is_active', true).order('sort_order'),
      dba.from('work_task_types').select('id, name').eq('is_active', true).order('sort_order'),
      dba.from('language_types').select('id, name').eq('is_active', true).order('sort_order'),
      dba.from('certificate_types').select('id, name').eq('is_active', true).order('sort_order'),
    ]),

    // Current selections
    Promise.all([
      dba.from('professional_competencies').select('competency_type_id').eq('professional_id', user.id),
      dba.from('professional_methods').select('method_type_id').eq('professional_id', user.id),
      dba.from('professional_target_groups').select('target_group_type_id').eq('professional_id', user.id),
      dba.from('professional_work_tasks').select('work_task_type_id').eq('professional_id', user.id),
      dba.from('professional_languages').select('language_type_id').eq('professional_id', user.id),
    ]),

    dba.from('professional_geography').select('municipality_id').eq('professional_id', user.id),

    dba.from('professional_documents')
      .select('id, document_type, status, file_name, uploaded_at, verified_at, expiry_date')
      .eq('professional_id', user.id)
      .order('document_type'),

    dba.from('professional_certificates')
      .select('id, certificate_type_id, custom_name, issued_at, expires_at, status, certificate_types(name)')
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false }),

    dba.from('professional_consents')
      .select('consent_type, accepted_at, document_version')
      .eq('professional_id', user.id),

    db.from('municipalities').select('id, name').eq('status', 'ACTIVE').order('name'),
  ])

  const [profTypes, compTypes, methTypes, tgTypes, wtTypes, langTypes, certTypes] = lookupsRes
  const [compSel, methSel, tgSel, wtSel, langSel] = selectionsRes

  return (
    <div>
      <PageHeader
        label="Kontaktperson"
        title="Min profil"
        subtitle="Kompetenceprofil — bruges direkte i matching"
        breadcrumb={[{ label: 'Overblik', href: '/dashboard' }, { label: 'Min profil' }]}
      />
      <ContentContainer>
        <ProfileClient
          profileName={profileRes.data?.full_name ?? ''}
          profileEmail={profileRes.data?.email ?? ''}
          professional={professionalRes.data ?? null}
          professionTypes={profTypes.data ?? []}
          competencyTypes={compTypes.data ?? []}
          methodTypes={methTypes.data ?? []}
          targetGroupTypes={tgTypes.data ?? []}
          workTaskTypes={wtTypes.data ?? []}
          languageTypes={langTypes.data ?? []}
          certificateTypes={certTypes.data ?? []}
          municipalities={munisRes.data ?? []}
          selectedCompetencies={(compSel.data ?? []).map((r: { competency_type_id: string }) => r.competency_type_id)}
          selectedMethods={(methSel.data ?? []).map((r: { method_type_id: string }) => r.method_type_id)}
          selectedTargetGroups={(tgSel.data ?? []).map((r: { target_group_type_id: string }) => r.target_group_type_id)}
          selectedWorkTasks={(wtSel.data ?? []).map((r: { work_task_type_id: string }) => r.work_task_type_id)}
          selectedLanguages={(langSel.data ?? []).map((r: { language_type_id: string }) => r.language_type_id)}
          selectedGeography={(geoRes.data ?? []).map((r: { municipality_id: string }) => r.municipality_id)}
          documents={(docsRes.data ?? []) as DocumentRow[]}
          certificates={(certsRes.data ?? []) as CertificateRow[]}
          consents={(consentsRes.data ?? []).map((r: { consent_type: string }) => r.consent_type)}
        />
      </ContentContainer>
    </div>
  )
}

export type DocumentRow = {
  id: string
  document_type: string
  status: string
  file_name: string | null
  uploaded_at: string | null
  verified_at: string | null
  expiry_date: string | null
}

export type CertificateRow = {
  id: string
  certificate_type_id: string | null
  custom_name: string | null
  issued_at: string | null
  expires_at: string | null
  status: string
  certificate_types: { name: string } | null
}
