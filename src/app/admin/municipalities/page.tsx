import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { MunicipalitiesClient } from './MunicipalitiesClient'

export default async function MunicipalitiesPage() {
  const db = await createClient()

  const { data: municipalities } = await db
    .from('municipalities')
    .select('id, name, status, sagsbehandler_name, sagsbehandler_email, sagsbehandler_phone, secondary_contact_name, secondary_contact_email, secondary_contact_phone, created_at')
    .order('name', { ascending: true })

  return (
    <div>
      <PageHeader
        label="Administration"
        title="Kommuner"
        subtitle="Kommuneaftaler og kontaktpersoner"
        breadcrumb={[{ label: 'Administration', href: '/admin' }, { label: 'Kommuner' }]}
      />
      <ContentContainer>
        <MunicipalitiesClient initialData={municipalities ?? []} />
      </ContentContainer>
    </div>
  )
}
