'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import type { NotificationType } from '@/types/database'
import { NOTIFICATION_TYPE_LABEL as TYPE_LABEL } from '@/lib/labels'

export interface InboxNotificationRow {
  id: string
  notification_type: NotificationType
  subject: string | null
  body_text: string | null
  created_at: string
  sent_at: string | null
  read_at: string | null
}

function formatDatetime(iso: string) {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

interface Props {
  notifications: InboxNotificationRow[]
}

type Filter = 'ALL' | 'UNREAD'

export function NotificationsInboxClient({ notifications: initial }: Props) {
  const [notifications, setNotifications] = useState(initial)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [expanded, setExpanded] = useState<string | null>(null)

  const unreadCount = notifications.filter(n => !n.read_at).length
  const visible = filter === 'UNREAD' ? notifications.filter(n => !n.read_at) : notifications

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n))
    fetch(`/api/notifications/${id}/mark-read`, { method: 'PATCH' }).catch(() => {})
  }

  function toggleExpand(n: InboxNotificationRow) {
    setExpanded(prev => prev === n.id ? null : n.id)
    if (!n.read_at) markRead(n.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-white border border-[#E0DAD0] rounded-xl p-1 w-fit">
        {([
          { key: 'ALL', label: 'Alle' },
          { key: 'UNREAD', label: `Ulæst${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={[
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              filter === t.key ? 'bg-[#1C3829] text-white' : 'text-[#6B7569] hover:text-[#1A1F1C]',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-sm text-[#6B7569]">{filter === 'UNREAD' ? 'Ingen ulæste notifikationer' : 'Ingen notifikationer endnu'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map(n => (
            <Card key={n.id} className={n.read_at ? undefined : 'border-[#1C3829]'}>
              <button className="w-full text-left" onClick={() => toggleExpand(n)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-[#1C3829] shrink-0" />}
                      <span className="text-sm font-medium text-[#1A1F1C]">
                        {TYPE_LABEL[n.notification_type] ?? n.notification_type}
                      </span>
                    </div>
                    {n.subject && <div className="text-xs text-[#6B7569] truncate">{n.subject}</div>}
                  </div>
                  <span className="text-[10px] text-[#6B7569] shrink-0">
                    {formatDatetime(n.sent_at ?? n.created_at)}
                  </span>
                </div>
              </button>
              {expanded === n.id && n.body_text && (
                <div className="mt-2 bg-[#F6F3EE] rounded-xl p-3">
                  <pre className="text-xs text-[#1A1F1C] whitespace-pre-wrap font-sans">{n.body_text}</pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
