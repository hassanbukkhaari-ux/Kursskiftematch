import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { NotificationType } from '@/types/database'

const TYPE_LABEL: Record<NotificationType, string> = {
  INQUIRY_RECEIVED: 'Henvendelse modtaget',
  PROFESSIONAL_APPLICATION_RECEIVED: 'Fagpersonansøgning',
  CASE_CREATED: 'Sag oprettet',
  SAFEGUARDING_FLAGGED: 'Bekymring markeret',
  HOURS_SUBMITTED: 'Timer indsendt',
  DOCUMENT_ACTION_REQUIRED: 'Dokument kræver handling',
  CASE_CLOSED: 'Sag lukket',
}

const STATUS_BADGE: Record<string, 'green' | 'amber' | 'red'> = {
  SENT: 'green',
  PENDING: 'amber',
  FAILED: 'red',
}

const STATUS_LABEL: Record<string, string> = {
  SENT: 'Sendt',
  PENDING: 'Afventer',
  FAILED: 'Fejl',
}

function formatDatetime(iso: string) {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

const CHANNEL_LABEL: Record<string, string> = {
  EMAIL: 'E-mail',
  SMS: 'SMS',
  IN_APP: 'App',
}

export default async function AdminNotificationsPage() {
  const db = await createClient()

  const { data: logs, count } = await db
    .from('notification_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100)

  const failedCount = (logs ?? []).filter(l => l.status === 'FAILED').length
  const pendingCount = (logs ?? []).filter(l => l.status === 'PENDING').length

  return (
    <div>
      <PageHeader
        label="Administration"
        title="Notifikationer"
        subtitle="Log over sendte og fejlede notifikationer"
        breadcrumb={[
          { label: 'Administration', href: '/admin' },
          { label: 'Notifikationer' },
        ]}
      />

      <ContentContainer>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">I alt</div>
            <div className="text-2xl font-bold text-[#1A1F1C]">{count ?? 0}</div>
          </Card>
          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Afventer</div>
            <div className="text-2xl font-bold text-[#92660A]">{pendingCount}</div>
          </Card>
          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Fejlede</div>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
          </Card>
        </div>

        {/* Log */}
        {(logs?.length ?? 0) === 0 ? (
          <Card className="text-center py-16">
            <p className="text-sm text-[#6B7569]">Ingen notifikationer endnu</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {logs?.map(log => (
              <Card key={log.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#1A1F1C]">
                        {TYPE_LABEL[log.notification_type] ?? log.notification_type}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] border border-[#E0DAD0] rounded px-1.5 py-0.5">
                        {CHANNEL_LABEL[log.delivery_channel] ?? log.delivery_channel}
                      </span>
                    </div>
                    {log.recipient_email && (
                      <div className="text-xs text-[#6B7569] mt-0.5">{log.recipient_email}</div>
                    )}
                    {log.failure_reason && (
                      <div className="text-xs text-red-600 mt-1 font-medium">{log.failure_reason}</div>
                    )}
                    {log.attempt_count > 1 && (
                      <div className="text-[10px] text-[#6B7569] mt-0.5">{log.attempt_count} forsøg</div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <Badge variant={STATUS_BADGE[log.status] ?? 'default'} dot>
                      {STATUS_LABEL[log.status] ?? log.status}
                    </Badge>
                    <span className="text-[10px] text-[#6B7569]">
                      {formatDatetime(log.sent_at ?? log.created_at)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ContentContainer>
    </div>
  )
}
