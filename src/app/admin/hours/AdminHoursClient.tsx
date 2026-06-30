'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AdminHoursRow } from './page'

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Indsendt', APPROVED: 'Godkendt', REJECTED: 'Afvist',
}
const STATUS_BADGE: Record<string, 'amber' | 'green' | 'red'> = {
  SUBMITTED: 'amber', APPROVED: 'green', REJECTED: 'red',
}
const WORK_TYPE_LABEL: Record<string, string> = {
  DIRECT_SESSION: 'Direkte session',
  TRANSPORT: 'Transport',
  DOCUMENTATION: 'Dokumentation',
  COORDINATION: 'Koordinering',
  CRISIS_RESPONSE: 'Krisehåndtering',
  TRAINING: 'Kompetenceudvikling',
  OTHER: 'Andet',
}

type FilterStatus = 'SUBMITTED' | 'ALL' | 'APPROVED' | 'REJECTED'

export function AdminHoursClient({ initialHours }: { initialHours: AdminHoursRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<FilterStatus>('SUBMITTED')
  const [actioning, setActioning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = filter === 'ALL' ? initialHours : initialHours.filter(h => h.status === filter)

  async function handleAction(id: string, action: 'APPROVE' | 'REJECT') {
    setError(null)
    setActioning(id + action)
    try {
      const res = await fetch(`/api/registered-hours/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      startTransition(() => { router.refresh() })
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setActioning(null)
    }
  }

  const countOf = (s: FilterStatus) =>
    s === 'ALL' ? initialHours.length : initialHours.filter(h => h.status === s).length

  const TABS: { label: string; value: FilterStatus }[] = [
    { label: 'Afventer', value: 'SUBMITTED' },
    { label: 'Alle', value: 'ALL' },
    { label: 'Godkendt', value: 'APPROVED' },
    { label: 'Afvist', value: 'REJECTED' },
  ]

  return (
    <>
      <div className="flex items-center mb-4 gap-4 flex-wrap">
        <div className="flex gap-1 bg-white border border-[#E0DAD0] rounded-xl p-1 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === t.value
                  ? 'bg-[#1C3829] text-white'
                  : 'text-[#6B7569] hover:text-[#1A1F1C]',
              ].join(' ')}
            >
              {t.label}
              {countOf(t.value) > 0 && (
                <span className={`ml-1.5 tabular-nums text-xs ${filter === t.value ? 'text-white/70' : 'text-[#C8C0B0]'}`}>
                  {countOf(t.value)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-[#6B7569]">
            {filter === 'SUBMITTED' ? 'Ingen timeregistreringer afventer godkendelse' : 'Ingen resultater'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(h => (
            <Card key={h.id} className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1A1F1C]">
                    {h.professional_name}
                    <span className="text-[#6B7569] font-normal"> · Borger {h.citizen_initials} ({h.citizen_age_range})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#6B7569]">
                      {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(h.work_date))}
                    </span>
                    <span className="text-[#C8C0B0] text-xs">·</span>
                    <span className="text-xs text-[#6B7569]">{h.hours} t</span>
                    <span className="text-[#C8C0B0] text-xs">·</span>
                    <span className="text-xs text-[#6B7569]">{WORK_TYPE_LABEL[h.work_type] ?? h.work_type}</span>
                  </div>
                  {h.description && (
                    <div className="mt-0.5 text-xs text-[#6B7569] truncate max-w-sm">{h.description}</div>
                  )}
                  {h.review_note && (
                    <div className="mt-0.5 text-xs text-[#6B7569] italic">{h.review_note}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={STATUS_BADGE[h.status] ?? 'default'}>
                  {STATUS_LABEL[h.status] ?? h.status}
                </Badge>
                {h.status === 'SUBMITTED' && (
                  <>
                    <button
                      onClick={() => handleAction(h.id, 'APPROVE')}
                      disabled={!!actioning || isPending}
                      className="h-8 px-3 rounded-lg bg-[#1C3829] text-white text-xs font-semibold hover:bg-[#2D5840] transition-colors disabled:opacity-50"
                    >
                      {actioning === h.id + 'APPROVE' ? '…' : 'Godkend'}
                    </button>
                    <button
                      onClick={() => handleAction(h.id, 'REJECT')}
                      disabled={!!actioning || isPending}
                      className="h-8 px-3 rounded-lg border border-[#E0DAD0] text-[#1A1F1C] text-xs font-semibold hover:bg-[#F6F3EE] transition-colors disabled:opacity-50"
                    >
                      {actioning === h.id + 'REJECT' ? '…' : 'Afvis'}
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
