'use client'

import { useState } from 'react'
import Link from 'next/link'

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-[#C8993A] flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 13L8 3L13 13" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 9.5h6" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mt-0.5">Match</div>
      </div>
    </div>
  )
}

const NAV_LINKS = [
  { href: '/kommuner', label: 'Kommuner' },
  { href: '/kontaktpersoner', label: 'Kontaktpersoner' },
  { href: '/metode', label: 'Metode' },
  { href: '/om-kursskifte', label: 'Om Kursskifte' },
  { href: '/kontakt', label: 'Kontakt' },
]

export default function PublicNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#F6F3EE]/90 backdrop-blur-md border-b border-[#E0DAD0]">
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <LogoMark />
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-[#6B7569] hover:text-[#1C3829] hover:bg-[#EEF4F0] rounded-lg transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-2 px-3 py-1.5 text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors"
          >
            Log ind
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <Link
            href="/intake"
            className="h-9 px-4 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-1.5"
          >
            Indsend sag
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/intake"
            className="h-8 px-3 bg-[#1C3829] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5840] transition-colors inline-flex items-center"
          >
            Indsend sag
          </Link>
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#EEF4F0] transition-colors text-[#1C3829]"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-[#E0DAD0] bg-[#F6F3EE] px-5 py-4 space-y-1">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm text-[#1A1F1C] hover:bg-[#EEF4F0] rounded-lg transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="border-t border-[#E0DAD0] mt-2 pt-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm text-[#6B7569] hover:text-[#1C3829] rounded-lg transition-colors"
            >
              Log ind
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
