'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  proposalId: string
}

// Two admin-only escapes around the municipality's token-based flow, for
// when the sagsbehandler agreed but the response e-mail never landed:
// resend the same e-mail (same token, so the link still works), or mark
// the proposal accepted directly on the municipality's behalf. Admin can
// always override the municipality this way — the platform must not get
// stuck waiting on an e-mail that got lost.
export function ProposalAdminActionsClient({ proposalId }: Props) {
  const router = useRouter()
  const [resending, setResending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  async function handleResend() {
    setError(null)
    setResending(true)
    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}/resend`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Fejl ${res.status}`)
      }
      setResent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ukendt fejl')
    } finally {
      setResending(false)
    }
  }

  async function handleOverrideAccept() {
    setError(null)
    setAccepting(true)
    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}/override-accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Fejl ${res.status}`)
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ukendt fejl')
      setAccepting(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#E0DAD0] space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}

      {!confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" loading={resending} onClick={handleResend}>
            Gensend e-mail til kommunen
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
            Marker som accepteret
          </Button>
          {resent && <span className="text-[11px] text-[#2D5840]">E-mail gensendt.</span>}
        </div>
      ) : (
        <div className="bg-[#F6F3EE] rounded-xl p-3 space-y-2">
          <p className="text-xs text-[#1A1F1C]">
            Brug kun dette hvis kommunen mundtligt har bekræftet, at de accepterer forslaget, men
            svar-mailen ikke kan findes. Sagen aktiveres med det samme.
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note (valgfri) — fx hvem der bekræftede og hvornår"
            className="w-full min-h-[60px] px-3 py-2 bg-white rounded-lg text-xs text-[#1A1F1C] border border-[#E0DAD0] focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={accepting} onClick={handleOverrideAccept}>
              Bekræft — marker som accepteret
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={accepting}>
              Annuller
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
