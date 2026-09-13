import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role !== 'professional') redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dba = db as any

  const [
    { data: pro },
    { data: consentsData },
    { data: compData },
    { data: geoData },
    { count: unreadNotificationCount },
  ] = await Promise.all([
    dba.from('professionals').select('profile_image_url, phone, profession_type_id').eq('id', user.id).maybeSingle(),
    dba.from('professional_consents').select('consent_type').eq('professional_id', user.id),
    dba.from('professional_competencies').select('competency_type_id').eq('professional_id', user.id),
    dba.from('professional_geography').select('municipality_id').eq('professional_id', user.id),
    dba.from('notification_log').select('id', { count: 'exact', head: true }).eq('recipient_profile_id', user.id).is('read_at', null),
  ])

  const REQUIRED_CONSENTS = ['GDPR', 'PRIVACY', 'CONFIDENTIALITY', 'ETHICS', 'TERMS', 'DOCUMENT_STORAGE']
  const hasAllConsents = REQUIRED_CONSENTS.every(
    c => (consentsData ?? []).some((r: { consent_type: string }) => r.consent_type === c)
  )
  const onboardingComplete =
    pro?.phone && pro?.profession_type_id && hasAllConsents &&
    (compData ?? []).length > 0 && (geoData ?? []).length > 0

  if (!onboardingComplete) redirect('/onboarding')

  return (
    <DashboardShell
      userName={profile?.full_name}
      role="professional"
      profileImageUrl={pro?.profile_image_url as string | undefined}
      unreadNotificationCount={unreadNotificationCount ?? 0}
    >
      {children}
    </DashboardShell>
  )
}
