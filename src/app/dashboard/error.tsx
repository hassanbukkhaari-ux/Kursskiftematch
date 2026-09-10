'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#F6F3EE]">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-[#1A1F1C] mb-2">Siden kunne ikke indlæses</h1>
        <p className="text-sm text-[#6B7569] mb-6 leading-relaxed">
          Der opstod en fejl ved indlæsning af denne side. Prøv igen eller gå tilbage til overblikket.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="h-9 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors"
          >
            Prøv igen
          </button>
          <Link
            href="/dashboard"
            className="h-9 px-5 bg-white text-[#1A1F1C] text-sm font-semibold rounded-xl border border-[#E0DAD0] hover:bg-[#F6F3EE] transition-colors flex items-center"
          >
            Tilbage til overblikket
          </Link>
        </div>
      </div>
    </div>
  )
}
