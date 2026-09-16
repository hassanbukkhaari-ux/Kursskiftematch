'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProfessionalRow } from './page'

export type IncompleteProfile = {
  id: string
  full_name: string | null
  email: string
  capacityMissing: boolean
  availabilityMissing: boolean
}

// Same two fields that block activation in
// /api/admin/professionals/[id]/status/route.ts — reused here as the
// definition of "profile still missing info", so this list and that gate
// never disagree with each other.
export function toIncompleteProfiles(professionals: ProfessionalRow[]): IncompleteProfile[] {
  return professionals
    .filter(p => p.status === 'REGISTERED')
    .map(p => ({
      id: p.id,
      full_name: p.profiles?.full_name ?? null,
      email: p.profiles?.email ?? '',
      capacityMissing: !p.capacity_hours_week || p.capacity_hours_week <= 0,
      availabilityMissing: p.availability_status === 'UNAVAILABLE',
    }))
    .filter(p => p.capacityMissing || p.availabilityMissing)
}

function Row({ profile }: { profile: IncompleteProfile }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function remind() {
    setSending(true); setError(null)
    try {
      const res = await fetch(`/api/admin/professionals/${profile.id}/remind-profile`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = (json as { error?: unknown }).error
        setError(typeof msg === 'string' && msg.trim() ? msg : `Noget gik galt (fejl ${res.status})`)
        return
      }
      setDone(true)
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setSending(false)
    }
  }

  const missing = [
    profile.capacityMissing ? 'kapacitet' : null,
    profile.availabilityMissing ? 'tilgængelighed' : null,
  ].filter(Boolean).join(' og ')

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-medium text-[#1A1F1C] text-sm">{profile.full_name || profile.email}</div>
        <div className="text-xs text-[#6B7569] mt-0.5">
          {profile.full_name ? `${profile.email} · ` : ''}Mangler {missing}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="amber" dot>Mangler oplysninger</Badge>
        {done ? (
          <span className="text-xs text-[#1C3829] font-medium">Sendt</span>
        ) : (
          <button
            type="button"
            onClick={remind}
            disabled={sending}
            className="h-8 px-3 bg-[#1C3829] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5840] transition-colors disabled:opacity-50"
          >
            {sending ? 'Sender…' : 'Send påmindelse'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 shrink-0">{error}</p>}
    </Card>
  )
}

export function IncompleteProfilesSection({ profiles }: { profiles: IncompleteProfile[] }) {
  if (profiles.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7569]">
          Mangler profiloplysninger ({profiles.length})
        </span>
        <div className="flex-1 h-px bg-[#E0DAD0]" />
      </div>
      <div className="space-y-2">
        {profiles.map(p => <Row key={p.id} profile={p} />)}
      </div>
    </div>
  )
}
