'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PendingInvitation } from '@/lib/professionals/pending-invitations'

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000))
}

function Row({ invite }: { invite: PendingInvitation }) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function nudge() {
    setSending(true); setError(null)
    try {
      const res = await fetch(`/api/admin/professionals/${invite.id}/nudge-invitation`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((json as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      setDone(true)
      router.refresh()
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setSending(false)
    }
  }

  const age = daysAgo(invite.invited_at)

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-medium text-[#1A1F1C] text-sm">{invite.full_name || invite.email}</div>
        <div className="text-xs text-[#6B7569] mt-0.5">
          {invite.full_name ? `${invite.email} · ` : ''}Inviteret for {age} {age === 1 ? 'dag' : 'dage'} siden
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={invite.opened ? 'amber' : 'default'} dot>
          {invite.opened ? 'Åbnet, ikke færdig' : 'Ikke åbnet endnu'}
        </Badge>
        {done ? (
          <span className="text-xs text-[#1C3829] font-medium">Sendt igen</span>
        ) : (
          <button
            type="button"
            onClick={nudge}
            disabled={sending}
            className="h-8 px-3 bg-[#1C3829] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5840] transition-colors disabled:opacity-50"
          >
            {sending ? 'Sender…' : 'Følg op'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 shrink-0">{error}</p>}
    </Card>
  )
}

export function PendingInvitationsSection({ pending }: { pending: PendingInvitation[] }) {
  if (pending.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7569]">
          Afventende invitationer ({pending.length})
        </span>
        <div className="flex-1 h-px bg-[#E0DAD0]" />
      </div>
      <div className="space-y-2">
        {pending.map(p => <Row key={p.id} invite={p} />)}
      </div>
    </div>
  )
}
