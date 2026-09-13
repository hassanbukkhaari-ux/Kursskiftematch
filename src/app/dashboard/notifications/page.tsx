import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { NotificationsInboxClient, type InboxNotificationRow } from './NotificationsInboxClient'

export default async function DashboardNotificationsPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data, count } = await db
    .from('notification_log')
    .select('*', { count: 'exact' })
    .eq('recipient_profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  const notifications: InboxNotificationRow[] = (data ?? []).map(n => ({
    id: n.id,
    notification_type: n.notification_type,
    subject: n.subject,
    body_text: n.body_text,
    created_at: n.created_at,
    sent_at: n.sent_at,
    read_at: n.read_at,
  }))

  return (
    <div>
      <PageHeader
        label="Mit overblik"
        title="Notifikationer"
        subtitle={`${count ?? 0} notifikationer i alt`}
        breadcrumb={[{ label: 'Mit overblik', href: '/dashboard' }, { label: 'Notifikationer' }]}
      />
      <ContentContainer>
        <NotificationsInboxClient notifications={notifications} />
      </ContentContainer>
    </div>
  )
}
