import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { InquiriesClient } from './InquiriesClient'

export default async function InquiriesPage() {
  const db = await createClient()

  const [inquiriesRes, munisRes] = await Promise.all([
    db
      .from('inbound_inquiries')
      .select('id, submission_type, submitter_name, submitter_email, submitter_phone, organization_name, message, status, submitted_at, reviewed_at')
      .order('submitted_at', { ascending: false })
      .limit(100),
    db
      .from('municipalities')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name', { ascending: true }),
  ])

  return (
    <div>
      <PageHeader
        label="Administration"
        title="Henvendelser"
        subtitle="Indkomne kommunehenvendelser og fagpersonansøgninger"
        breadcrumb={[{ label: 'Administration', href: '/admin' }, { label: 'Henvendelser' }]}
      />
      <ContentContainer>
        <InquiriesClient
          initialData={(inquiriesRes.data ?? []) as InquiryRow[]}
          municipalities={munisRes.data ?? []}
        />
      </ContentContainer>
    </div>
  )
}

export type InquiryRow = {
  id: string
  submission_type: 'MUNICIPALITY_INQUIRY' | 'PROFESSIONAL_APPLICATION' | 'PARTNER_LEAD'
  submitter_name: string
  submitter_email: string
  submitter_phone: string | null
  organization_name: string | null
  message: string | null
  status: 'PENDING' | 'REVIEWED' | 'CONVERTED' | 'REJECTED' | 'SPAM'
  submitted_at: string
  reviewed_at: string | null
}

export type MunicipalityOption = {
  id: string
  name: string
}
