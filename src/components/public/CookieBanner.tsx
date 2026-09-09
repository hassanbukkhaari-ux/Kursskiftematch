'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('cookie-consent')) setShow(true)
    } catch {
      // localStorage unavailable
    }
  }, [])

  function save(value: 'accepted' | 'declined') {
    try { localStorage.setItem('cookie-consent', value) } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E0DAD0] bg-[#F6F3EE]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-[#3A3F3C] leading-relaxed flex-1">
          Vi bruger nødvendige cookies til at sikre en sikker og velfungerende brugeroplevelse. Læs mere i vores{' '}
          <Link href="/privatlivspolitik" className="underline text-[#1C3829] hover:no-underline">
            privatlivspolitik
          </Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => save('declined')}
            className="h-9 px-4 text-sm text-[#6B7569] border border-[#D0CAC0] rounded-lg hover:bg-[#EEF4F0] transition-colors"
          >
            Afvis
          </button>
          <button
            onClick={() => save('accepted')}
            className="h-9 px-4 text-sm font-semibold text-white bg-[#1C3829] rounded-lg hover:bg-[#2D5840] transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
