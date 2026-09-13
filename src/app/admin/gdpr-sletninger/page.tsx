import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'

const DELETION_REASON_LABEL: Record<string, string> = {
  RETENTION_EXPIRED: 'Opbevaringsperiode udløbet',
  USER_REQUEST: 'Anmodning fra borger/fagperson',
  LEGAL_REQUIREMENT: 'Lovkrav',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export default async function AdminGdprDeletionsPage() {
  const db = await createClient()

  const { data: deletionSchedules } = await db
    .from('deletion_schedules')
    .select('*')
    .is('executed_at', null)
    .order('scheduled_for_deletion_at', { ascending: true })
    .limit(100)

  return (
    <div>
      <PageHeader
        label="Kursskifte Administration"
        title="GDPR-sletninger"
        subtitle="Planlagte sletninger på tværs af sager, fagpersoner og borgere"
        breadcrumb={[
          { label: 'Kursskifte Administration', href: '/admin' },
          { label: 'GDPR-sletninger' },
        ]}
      />

      <ContentContainer>
        <p className="text-xs text-[#6B7569] mb-3">
          {(deletionSchedules ?? []).length} planlagt{(deletionSchedules ?? []).length === 1 ? '' : 'e'} — endnu ikke udført
        </p>
        {(deletionSchedules ?? []).length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-[#6B7569]">Ingen planlagte sletninger</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {(deletionSchedules ?? []).map(d => (
              <Card key={d.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1A1F1C]">{d.record_type} · {d.record_id}</div>
                  <div className="text-xs text-[#6B7569]">{DELETION_REASON_LABEL[d.reason] ?? d.reason}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-[#1A1F1C]">{formatDate(d.scheduled_for_deletion_at)}</div>
                  <div className="text-[10px] text-[#9B9589]">Planlagt sletningsdato</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ContentContainer>
    </div>
  )
}
