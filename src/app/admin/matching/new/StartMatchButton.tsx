'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StartMatchButtonProps {
  caseId: string
  caseLabel: string
}

export function StartMatchButton({ caseId, caseLabel }: StartMatchButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/match-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Serverfejl (${res.status})`)
        setLoading(false)
        return
      }
      const run = await res.json()
      router.push(`/admin/matching/${run.id}`)
    } catch {
      setError('Netværksfejl — prøv igen')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={loading}
        className={[
          'w-full h-12 rounded-xl text-sm font-semibold transition-all duration-150',
          'flex items-center justify-center gap-2',
          'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
          loading
            ? 'bg-[#2D5840] text-white'
            : 'bg-[#1C3829] text-[#F6F3EE] hover:bg-[#2D5840]',
        ].join(' ')}
      >
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin shrink-0">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
              <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Analyserer fagpersoner — vent venligst…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Start match-kørsel for {caseLabel}
          </>
        )}
      </button>

      <p className="text-xs text-center text-[#6B7569]">
        Algoritmen scorer alle tilgængelige fagpersoner mod sagens krav. Tager typisk under 5 sekunder.
      </p>
    </div>
  )
}
