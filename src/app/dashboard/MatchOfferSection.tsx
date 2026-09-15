'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface MatchOffer {
  id: string
  caseNumber: string | null
  citizenInitials: string
  citizenAgeRange: string
  weeklyHours: number | null
}

function OfferCard({ offer }: { offer: MatchOffer }) {
  const router = useRouter()
  const [acting, setActing] = useState<'ACCEPT' | 'DECLINE' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'ACCEPT' | 'DECLINE' | null>(null)

  async function respond(action: 'ACCEPT' | 'DECLINE') {
    setActing(action); setError(null)
    try {
      const res = await fetch(`/api/case-proposals/${offer.id}/respond`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? 'Noget gik galt — prøv igen')
        return
      }
      setDone(action)
      router.refresh()
    } catch { setError('Netværksfejl — prøv igen') }
    finally { setActing(null) }
  }

  if (done) {
    return (
      <div className="bg-white/10 rounded-xl p-4 text-sm text-white">
        {done === 'ACCEPT'
          ? 'Tak! Forslaget er sendt til kommunen.'
          : 'Okay, sagen går videre til en anden kandidat.'}
      </div>
    )
  }

  return (
    <div className="bg-white/10 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
        <span className="text-sm font-semibold text-white">
          {offer.caseNumber ?? `Borger ${offer.citizenInitials}`}
        </span>
        <span className="text-xs text-[#C5D9CB]">
          {offer.citizenInitials} · {offer.citizenAgeRange}
          {offer.weeklyHours ? ` · ${offer.weeklyHours} t/uge` : ''}
        </span>
      </div>
      {error && <p className="text-xs text-red-300 mb-2">{error}</p>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => respond('ACCEPT')}
          disabled={acting !== null}
          className="h-9 px-4 bg-[#C8993A] text-white text-sm font-semibold rounded-xl hover:bg-[#B8891A] transition-colors disabled:opacity-50"
        >
          {acting === 'ACCEPT' ? 'Bekræfter…' : 'Ja, jeg er ledig'}
        </button>
        <button
          onClick={() => respond('DECLINE')}
          disabled={acting !== null}
          className="h-9 px-4 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/20"
        >
          {acting === 'DECLINE' ? 'Sender…' : 'Nej, ikke ledig'}
        </button>
      </div>
    </div>
  )
}

export function MatchOfferSection({ offers }: { offers: MatchOffer[] }) {
  return (
    <div className="mb-10 rounded-2xl bg-[#1C3829] px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#C8993A] mb-1">
        {offers.length > 1 ? 'Nye matches — er du ledig?' : 'Nyt match — er du ledig?'}
      </p>
      <p className="text-sm text-[#C5D9CB] mb-4">
        Bekræft om du er ledig, så sender vi forslaget videre til kommunen.
      </p>
      <div className="space-y-3">
        {offers.map(o => <OfferCard key={o.id} offer={o} />)}
      </div>
    </div>
  )
}
