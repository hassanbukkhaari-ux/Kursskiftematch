'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WORK_TYPE_LABEL } from '@/lib/labels'
import type { AdminHoursRow } from './page'

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Indsendt', APPROVED: 'Godkendt', REJECTED: 'Afvist',
}
const STATUS_BADGE: Record<string, 'amber' | 'green' | 'red'> = {
  SUBMITTED: 'amber', APPROVED: 'green', REJECTED: 'red',
}

type FilterStatus = 'SUBMITTED' | 'ALL' | 'APPROVED' | 'REJECTED'

export function AdminHoursClient({ initialHours }: { initialHours: AdminHoursRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<FilterStatus>('SUBMITTED')
  const [actioning, setActioning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const filtered = filter === 'ALL' ? initialHours : initialHours.filter(h => h.status === filter)

  async function handleAction(id: string, action: 'APPROVE' | 'REJECT', review_note?: string) {
    setError(null)
    setActioning(id + action)
    try {
      const res = await fetch(`/api/registered-hours/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, review_note: review_note || undefined }),
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

  function openReject(id: string) {
    setRejectTarget(id)
    setRejectNote('')
  }

  function closeReject() {
    setRejectTarget(null)
    setRejectNote('')
  }

  async function confirmReject() {
    if (!rejectTarget) return
    await handleAction(rejectTarget, 'REJECT', rejectNote)
    closeReject()
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
        <div className="flex gap-1 bg-white border border-[#E0DAD0] rounded-xl p-1 overflow-x-auto scrollbar-none">
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
                    <span className="text-xs text-[#6B7569]">{h.work_type.split(',').map((t: string) => WORK_TYPE_LABEL[t] ?? t).join(' · ')}</span>
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
                      onClick={() => openReject(h.id)}
                      disabled={!!actioning || isPending}
                      className="h-8 px-3 rounded-lg border border-[#E0DAD0] text-[#1A1F1C] text-xs font-semibold hover:bg-[#F6F3EE] transition-colors disabled:opacity-50"
                    >
                      Afvis
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1F1C]/50" onClick={closeReject} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <div className="font-serif text-lg text-[#1A1F1C] mb-1">Afvis timeregistrering</div>
            <p className="text-xs text-[#6B7569] mb-4">Skriv en begrundelse — den sendes til kontaktpersonen.</p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="F.eks. mangler sessionslog, timer overstiger grant-rammen..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmReject}
                disabled={!!actioning}
                className="flex-1 h-9 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actioning ? '…' : 'Afvis'}
              </button>
              <button
                onClick={closeReject}
                className="h-9 px-4 border border-[#E0DAD0] text-[#1A1F1C] text-sm font-semibold rounded-xl hover:bg-[#F6F3EE] transition-colors"
              >
                Annuller
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
