'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  requestId: string
  status: string
  isOverdue: boolean
  professionalName: string
  sharedWithMunicipalityAt: string | null
}

export function AdminStatusReportActions({ requestId, status, isOverdue, professionalName, sharedWithMunicipalityAt }: Props) {
  const router = useRouter()
  const [markingReviewed, startMarkReviewed] = useTransition()
  const [sending, startSend] = useTransition()
  const [sharing, startShare] = useTransition()
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [reminderSent, setReminderSent] = useState(false)
  const [shared, setShared] = useState(!!sharedWithMunicipalityAt)

  function handleMarkReviewed() {
    setError(null)
    startMarkReviewed(async () => {
      const res = await fetch(`/api/admin/status-report-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REVIEWED' }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Noget gik galt')
        return
      }
      router.refresh()
    })
  }

  function handleSendReminder(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startSend(async () => {
      const res = await fetch(`/api/admin/status-report-requests/${requestId}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reminderMessage }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Noget gik galt'); return }
      setReminderSent(true)
      setShowReminderModal(false)
      setReminderMessage('')
    })
  }

  function handleShare() {
    setError(null)
    startShare(async () => {
      const res = await fetch(`/api/admin/status-report-requests/${requestId}/share`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Noget gik galt'); return }
      setShared(true)
      router.refresh()
    })
  }

  const canMarkReviewed = status === 'SUBMITTED'
  const canRemind = (status === 'PENDING' || status === 'ACKNOWLEDGED') && isOverdue
  const canShare = (status === 'SUBMITTED' || status === 'REVIEWED') && !shared

  if (!canMarkReviewed && !canRemind && !canShare && !shared) return null

  return (
    <>
      <div className="flex items-center gap-2">
        {canMarkReviewed && (
          <Button
            variant="primary"
            size="sm"
            loading={markingReviewed}
            onClick={handleMarkReviewed}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Markér som gennemset
          </Button>
        )}
        {canRemind && (
          <button
            type="button"
            onClick={() => setShowReminderModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Send rykker
          </button>
        )}
        {reminderSent && (
          <span className="text-xs text-[#1C3829] font-medium flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Rykker sendt
          </span>
        )}
        {canShare && (
          <Button variant="secondary" size="sm" loading={sharing} onClick={handleShare}>
            Godkend og send til kommune
          </Button>
        )}
        {shared && (
          <span className="text-xs text-[#1C3829] font-medium flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Sendt til kommune
          </span>
        )}
      </div>

      {canShare && (
        <p className="mt-1.5 text-[11px] text-[#9B9589]">
          Tjek at borgerens rigtige navn ikke fremgår af fritekstfelterne, før du sender.
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1F1C]/50" onClick={() => setShowReminderModal(false)} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif text-lg text-[#1A1F1C]">Send rykker</div>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="w-7 h-7 rounded-full bg-[#F6F3EE] flex items-center justify-center text-[#6B7569]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-[#6B7569] mb-4">
              Der sendes en rykker-email til <span className="font-medium text-[#1A1F1C]">{professionalName}</span> med opfordring til at indsende rapporten.
            </p>
            <form onSubmit={handleSendReminder} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#6B7569] block mb-1">Tilføj besked (valgfrit)</label>
                <textarea
                  rows={3}
                  value={reminderMessage}
                  onChange={e => setReminderMessage(e.target.value)}
                  placeholder="F.eks. særlig opfølgning eller kontekst til denne rykker"
                  className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" loading={sending}>
                  Send rykker
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowReminderModal(false)}>
                  Annuller
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
