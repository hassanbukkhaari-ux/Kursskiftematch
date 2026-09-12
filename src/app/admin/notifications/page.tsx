import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import NotificationsClient, { type NotificationRow } from './NotificationsClient'

const DELETION_REASON_LABEL: Record<string, string> = {
  RETENTION_EXPIRED: 'Opbevaringsperiode udløbet',
  USER_REQUEST: 'Anmodning fra borger/fagperson',
  LEGAL_REQUIREMENT: 'Lovkrav',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export default async function AdminNotificationsPage() {
  const db = await createClient()

  const [{ data, count }, { data: deletionSchedules }] = await Promise.all([
    db
      .from('notification_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(200),
    db
      .from('deletion_schedules')
      .select('*')
      .is('executed_at', null)
      .order('scheduled_for_deletion_at', { ascending: true })
      .limit(100),
  ])

  const notifications: NotificationRow[] = (data ?? []).map(n => ({
    id: n.id,
    notification_type: n.notification_type,
    related_entity_type: n.related_entity_type,
    related_entity_id: n.related_entity_id,
    recipient_email: n.recipient_email,
    delivery_channel: n.delivery_channel,
    status: n.status,
    attempt_count: n.attempt_count,
    failure_reason: n.failure_reason,
    subject: n.subject,
    body_text: n.body_text,
    created_at: n.created_at,
    sent_at: n.sent_at,
    failed_at: n.failed_at,
  }))

  return (
    <div>
      <PageHeader
        label="Kursskifte Administration"
        title="Notifikationer"
        subtitle="Log over alle udsendte beskeder — genudsend fejlede direkte herfra"
        breadcrumb={[
          { label: 'Kursskifte Administration', href: '/admin' },
          { label: 'Notifikationer' },
        ]}
      />

      <ContentContainer>
        <div className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-[#1A1F1C] mb-1">Planlagte GDPR-sletninger</h2>
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
        </div>

        <NotificationsClient notifications={notifications} total={count ?? 0} />
      </ContentContainer>
    </div>
  )
}
