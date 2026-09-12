'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SessionLogOption {
  id: string
  session_date: string
}

interface Props {
  caseId: string
  handoverId: string
  incomingProfessionalId: string | null
  alreadyTransferred: string[]
  sessionLogs: SessionLogOption[]
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

// Surfaces the two mandatory steps CLAUDE.md requires before a handover can
// actually be considered done — transferring the relevant session logs and
// confirming the overlap meeting — since nothing in the UI ever called the
// endpoints that do this. Shown inline on an INITIATED/IN_PROGRESS handover.
export function HandoverActionsClient({ caseId, handoverId, incomingProfessionalId, alreadyTransferred, sessionLogs }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>(
    sessionLogs.filter(l => !alreadyTransferred.includes(l.id)).map(l => l.id)
  )
  const [overlapConfirmed, setOverlapConfirmed] = useState(false)

  const untransferred = sessionLogs.filter(l => !alreadyTransferred.includes(l.id))

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function doFetch(url: string, body: object) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error ?? `Fejl ${res.status}`)
    }
    return res.json()
  }

  async function handleTransfer() {
    if (selected.length === 0) { setError('Vælg mindst én sessionslog'); return }
    setError(null)
    setPending(true)
    try {
      await doFetch(`/api/cases/${caseId}/handover/${handoverId}/transfer-sessions`, {
        session_log_ids: selected,
      })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ukendt fejl')
    } finally {
      setPending(false)
    }
  }

  async function handleComplete() {
    setError(null)
    setPending(true)
    try {
      await doFetch(`/api/cases/${caseId}/handover/${handoverId}/complete`, {
        overlap_meeting_completed: overlapConfirmed,
      })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ukendt fejl')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#E0DAD0] space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {untransferred.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
            Overfør sessionslogs til ny kontaktperson
          </div>
          <div className="space-y-1.5 mb-2">
            {untransferred.map(log => (
              <label key={log.id} className="flex items-center gap-2 text-xs text-[#1A1F1C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(log.id)}
                  onChange={() => toggle(log.id)}
                  className="w-3.5 h-3.5 rounded border-[#E0DAD0]"
                />
                Session {formatDate(log.session_date)}
              </label>
            ))}
          </div>
          <Button variant="secondary" size="sm" loading={pending} onClick={handleTransfer}>
            Overfør valgte sessionslogs
          </Button>
        </div>
      )}

      <div>
        {incomingProfessionalId && (
          <label className="flex items-start gap-2 text-xs text-[#1A1F1C] cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={overlapConfirmed}
              onChange={e => setOverlapConfirmed(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#E0DAD0] mt-0.5"
            />
            Overlapsmøde mellem udgående og indgående kontaktperson er afholdt
          </label>
        )}
        {!incomingProfessionalId && (
          <p className="text-xs text-[#9B9589] mb-2">Ingen ny kontaktperson valgt — sagen går tilbage i matching-puljen ved fuldførelse.</p>
        )}
        <Button
          variant="primary"
          size="sm"
          loading={pending}
          disabled={!!incomingProfessionalId && !overlapConfirmed}
          onClick={handleComplete}
        >
          Fuldfør overdragelse
        </Button>
      </div>
    </div>
  )
}
