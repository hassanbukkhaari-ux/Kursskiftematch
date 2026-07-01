import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import NotificationsClient, { type NotificationRow } from './NotificationsClient'

export default async function AdminNotificationsPage() {
  const db = await createClient()

  const { data, count } = await db
    .from('notification_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(200)

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
        label="Administration"
        title="Notifikationer"
        subtitle="Log over alle udsendte beskeder — genudsend fejlede direkte herfra"
        breadcrumb={[
          { label: 'Administration', href: '/admin' },
          { label: 'Notifikationer' },
        ]}
      />

      <ContentContainer>
        <NotificationsClient notifications={notifications} total={count ?? 0} />
      </ContentContainer>
    </div>
  )
}
