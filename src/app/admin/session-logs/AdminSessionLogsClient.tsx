'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface AdminLogRow {
  id: string
  case_id: string
  citizen_initials: string
  citizen_age_range: string
  professional_name: string
  session_date: string
  duration_minutes: number
  observations: string | null
  citizen_mood_tone: string | null
  follow_up_needed: boolean
  follow_up_reason: string | null
  status: 'DRAFT' | 'FINAL' | 'CORRECTED' | 'ARCHIVED'
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Oprettet', FINAL: 'Afsluttet', CORRECTED: 'Korrigeret', ARCHIVED: 'Arkiveret',
}
const STATUS_BADGE: Record<string, 'default' | 'green' | 'amber'> = {
  DRAFT: 'default', FINAL: 'green', CORRECTED: 'amber', ARCHIVED: 'default',
}
const MOOD_LABEL: Record<string, string> = {
  VERY_POSITIVE: 'Meget positiv', POSITIVE: 'Positiv', NEUTRAL: 'Neutral',
  NEGATIVE: 'Negativ', VERY_NEGATIVE: 'Meget negativ', VARIED: 'Varierende',
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min.`
  if (m === 0) return `${h} time${h > 1 ? 'r' : ''}`
  return `${h} time${h > 1 ? 'r' : ''} ${m} min.`
}

type Filter = 'ALL' | 'DRAFT' | 'FINAL' | 'FOLLOW_UP'

interface Props {
  initialLogs: AdminLogRow[]
}

export function AdminSessionLogsClient({ initialLogs }: Props) {
  const [logs, setLogs] = useState<AdminLogRow[]>(initialLogs)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [viewing, setViewing] = useState<AdminLogRow | null>(null)
  const [liveIndicator, setLiveIndicator] = useState(false)

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/admin/session-logs')
    const json = await res.json()
    if (json.data) setLogs(json.data)
  }, [])

  useEffect(() => {
    const db = createClient()
    const channel = db
      .channel('admin-session-logs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_logs' },
        () => {
          setLiveIndicator(true)
          setTimeout(() => setLiveIndicator(false), 2000)
          fetchLogs()
        }
      )
      .subscribe()

    return () => { db.removeChannel(channel) }
  }, [fetchLogs])

  // Also subscribe to professionals table for daily_occupation changes
  useEffect(() => {
    // Polling fallback every 60s in case realtime misses something
    const interval = setInterval(fetchLogs, 60_000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  const filtered = logs.filter(l => {
    if (filter === 'ALL') return true
    if (filter === 'FOLLOW_UP') return l.follow_up_needed
    return l.status === filter
  })

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(['ALL', 'DRAFT', 'FINAL', 'FOLLOW_UP'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors',
                filter === f
                  ? 'bg-[#1C3829] text-white border-[#1C3829]'
                  : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829] hover:text-[#1C3829]',
              ].join(' ')}
            >
              {f === 'ALL' ? 'Alle' : f === 'FOLLOW_UP' ? 'Opfølgning' : f === 'DRAFT' ? 'Oprettede' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9B9589]">
          <span
            className={[
              'w-2 h-2 rounded-full transition-colors duration-500',
              liveIndicator ? 'bg-green-500' : 'bg-[#C8C0B0]',
            ].join(' ')}
          />
          Live
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-[#6B7569]">
            {filter === 'ALL' ? 'Ingen sessionslogs registreret endnu' : 'Ingen sessionslogs matcher filtret'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <button
              key={log.id}
              onClick={() => setViewing(log)}
              className="w-full text-left block"
            >
              <Card hover className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#1A1F1C]">
                      {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(log.session_date))}
                    </span>
                    <span className="text-xs text-[#6B7569]">{formatDuration(log.duration_minutes)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6B7569]">
                    <span className="font-medium text-[#1A1F1C]">{log.professional_name}</span>
                    <span>·</span>
                    <span>Borger {log.citizen_initials} · {log.citizen_age_range}</span>
                  </div>
                  {log.observations && (
                    <span className="text-xs text-[#6B7569] line-clamp-1">{log.observations}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-0.5 flex-wrap justify-end">
                  {log.follow_up_needed && <Badge variant="amber">Opfølgning</Badge>}
                  <Badge variant={STATUS_BADGE[log.status] ?? 'default'}>{STATUS_LABEL[log.status] ?? log.status}</Badge>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/40 z-40 transition-opacity duration-300',
          viewing ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setViewing(null)}
        aria-hidden="true"
      />

      {/* Detail drawer */}
      <aside
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          viewing ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-label="Sessionslog detalje"
      >
        {viewing && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1A1F1C]">
                  {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(viewing.session_date))}
                </h2>
                <p className="text-xs text-[#6B7569] mt-0.5">{viewing.professional_name} · Borger {viewing.citizen_initials}</p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F6F3EE] flex items-center justify-center text-[#6B7569]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F6F3EE] rounded-xl p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Varighed</div>
                  <div className="text-sm font-medium text-[#1A1F1C]">{formatDuration(viewing.duration_minutes)}</div>
                </div>
                <div className="bg-[#F6F3EE] rounded-xl p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Status</div>
                  <Badge variant={STATUS_BADGE[viewing.status] ?? 'default'}>{STATUS_LABEL[viewing.status]}</Badge>
                </div>
                {viewing.citizen_mood_tone && (
                  <div className="bg-[#F6F3EE] rounded-xl p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Borgers stemning</div>
                    <div className="text-sm text-[#1A1F1C]">{MOOD_LABEL[viewing.citizen_mood_tone] ?? viewing.citizen_mood_tone}</div>
                  </div>
                )}
                <div className="bg-[#F6F3EE] rounded-xl p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Opfølgning</div>
                  <div className="text-sm text-[#1A1F1C]">{viewing.follow_up_needed ? 'Ja' : 'Nej'}</div>
                </div>
              </div>

              {/* Observations */}
              {viewing.observations && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Observationer</div>
                  <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap bg-[#F6F3EE] rounded-xl px-4 py-3 leading-relaxed">
                    {viewing.observations}
                  </p>
                </div>
              )}

              {/* Follow-up reason */}
              {viewing.follow_up_needed && viewing.follow_up_reason && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Opfølgningsnotat</div>
                  <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
                    {viewing.follow_up_reason}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  )
}
