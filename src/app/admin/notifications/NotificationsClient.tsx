'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { NotificationType } from '@/types/database'

export interface NotificationRow {
  id: string
  notification_type: NotificationType
  related_entity_type: string
  related_entity_id: string
  recipient_email: string | null
  delivery_channel: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  attempt_count: number
  failure_reason: string | null
  subject: string | null
  body_text: string | null
  created_at: string
  sent_at: string | null
  failed_at: string | null
}

const TYPE_LABEL: Record<NotificationType, string> = {
  INQUIRY_RECEIVED: 'Henvendelse modtaget',
  PROFESSIONAL_APPLICATION_RECEIVED: 'Fagpersonansøgning',
  CASE_CREATED: 'Sag oprettet',
  SAFEGUARDING_FLAGGED: 'Bekymring markeret',
  HOURS_SUBMITTED: 'Timer indsendt',
  DOCUMENT_ACTION_REQUIRED: 'Dokument kræver handling',
  CASE_CLOSED: 'Sag lukket',
  HANDOVER_INITIATED: 'Overdragelse initieret',
  PROPOSAL_SENT: 'Forslag sendt',
  PROPOSAL_ACCEPTED: 'Forslag accepteret',
  PROPOSAL_DECLINED: 'Forslag afvist',
}

const STATUS_BADGE: Record<string, 'green' | 'amber' | 'red'> = {
  SENT: 'green', PENDING: 'amber', FAILED: 'red',
}
const STATUS_LABEL: Record<string, string> = {
  SENT: 'Sendt', PENDING: 'Afventer', FAILED: 'Fejl',
}
const CHANNEL_LABEL: Record<string, string> = {
  EMAIL: 'E-mail', SMS: 'SMS', IN_APP: 'App',
}

function formatDatetime(iso: string) {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

interface Props {
  notifications: NotificationRow[]
  total: number
}

export default function NotificationsClient({ notifications: initial, total }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notifications, setNotifications] = useState(initial)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'SENT' | 'PENDING' | 'FAILED'>('ALL')

  const failedCount = notifications.filter(n => n.status === 'FAILED').length
  const pendingCount = notifications.filter(n => n.status === 'PENDING').length
  const sentCount = notifications.filter(n => n.status === 'SENT').length

  const visible = filter === 'ALL' ? notifications : notifications.filter(n => n.status === filter)

  function handleRetry(notif: NotificationRow) {
    setRetrying(notif.id)
    setFeedback(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/notification-log/${notif.id}/retry`, { method: 'POST' })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? `Fejl ${res.status}`)
        }
        const updated = await res.json()
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, ...updated } : n))
        setFeedback({ id: notif.id, msg: 'Notifikation genudsendt.', ok: true })
        router.refresh()
      } catch (e) {
        setFeedback({ id: notif.id, msg: e instanceof Error ? e.message : 'Ukendt fejl', ok: false })
      } finally {
        setRetrying(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'ALL', label: 'I alt', value: total, color: 'text-[#1A1F1C]' },
          { key: 'SENT', label: 'Sendt', value: sentCount, color: 'text-[#1C3829]' },
          { key: 'PENDING', label: 'Afventer', value: pendingCount, color: 'text-[#92660A]' },
          { key: 'FAILED', label: 'Fejlet', value: failedCount, color: 'text-red-600' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key as typeof filter)}
            className={`text-left p-4 rounded-2xl border transition-colors ${
              filter === s.key
                ? 'border-[#1C3829] bg-[#EEF4F0]'
                : 'border-[#E0DAD0] bg-white hover:bg-[#F6F3EE]'
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* Log */}
      {visible.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-sm text-[#6B7569]">Ingen notifikationer {filter !== 'ALL' ? 'med denne status' : 'endnu'}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map(n => (
            <Card key={n.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium text-[#1A1F1C]">
                      {TYPE_LABEL[n.notification_type] ?? n.notification_type}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] border border-[#E0DAD0] rounded px-1.5 py-0.5">
                      {CHANNEL_LABEL[n.delivery_channel] ?? n.delivery_channel}
                    </span>
                  </div>
                  {n.recipient_email && (
                    <div className="text-xs text-[#6B7569]">{n.recipient_email}</div>
                  )}
                  {n.failure_reason && (
                    <div className="text-xs text-red-600 mt-1 font-medium">{n.failure_reason}</div>
                  )}
                  {n.attempt_count > 1 && (
                    <div className="text-[10px] text-[#6B7569]">{n.attempt_count} forsøg</div>
                  )}

                  {/* Expandable content */}
                  {(n.subject || n.body_text) && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpanded(prev => prev === n.id ? null : n.id)}
                        className="text-[10px] font-semibold uppercase tracking-widest text-[#1C3829] hover:underline"
                      >
                        {expanded === n.id ? '▲ Skjul indhold' : '▼ Vis indhold'}
                      </button>
                      {expanded === n.id && (
                        <div className="mt-2 bg-[#F6F3EE] rounded-xl p-3 space-y-2">
                          {n.subject && (
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-0.5">Emne</div>
                              <div className="text-xs font-medium text-[#1A1F1C]">{n.subject}</div>
                            </div>
                          )}
                          {n.body_text && (
                            <div>
                              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-0.5">Besked</div>
                              <pre className="text-xs text-[#1A1F1C] whitespace-pre-wrap font-sans">{n.body_text}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {feedback?.id === n.id && (
                    <div className={`mt-2 text-xs font-medium ${feedback.ok ? 'text-[#1C3829]' : 'text-red-600'}`}>
                      {feedback.msg}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Badge variant={STATUS_BADGE[n.status] ?? 'default'} dot>
                    {STATUS_LABEL[n.status] ?? n.status}
                  </Badge>
                  <span className="text-[10px] text-[#6B7569]">
                    {formatDatetime(n.sent_at ?? n.created_at)}
                  </span>
                  {n.status === 'FAILED' && n.attempt_count < 3 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={pending && retrying === n.id}
                      onClick={() => handleRetry(n)}
                    >
                      Genudsend
                    </Button>
                  )}
                  {n.status === 'FAILED' && n.attempt_count >= 3 && (
                    <span className="text-[10px] text-red-500 font-semibold">Max forsøg nået</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
