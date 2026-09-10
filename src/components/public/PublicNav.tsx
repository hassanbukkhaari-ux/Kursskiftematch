'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CompassMark } from '@/components/brand/compass'

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <CompassMark size={40} />
      <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
    </div>
  )
}

const NAV_ITEMS = [
  {
    label: 'Kommuner',
    href: '/kommuner',
    children: [
      { label: 'Hvem hjælper vi', href: '/kommuner#hvem-hjaelper-vi' },
      { label: 'Ydelser', href: '/kommuner#ydelser' },
      { label: 'Sådan arbejder vi', href: '/kommuner#proces' },
    ],
  },
  {
    label: 'Kontaktpersoner',
    href: '/kontaktpersoner',
    children: [
      { label: 'Hvem kan søge', href: '/kontaktpersoner#hvem-kan-soege' },
      { label: 'Sådan kommer du i gang', href: '/kontaktpersoner#proces' },
    ],
  },
  {
    label: 'Kontakt',
    href: '/kontakt',
    children: [],
  },
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
          {NAV_ITEMS.map(item => (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#6B7569] hover:text-[#1C3829] hover:bg-[#EEF4F0] rounded-lg transition-colors"
              >
                {item.label}
                {item.children.length > 0 && (
                  <svg
                    className="transition-transform duration-200 group-hover:rotate-180"
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </Link>

              {/* Dropdown — animates in/out via CSS */}
              {item.children.length > 0 && (
                <div
                  className="
                    absolute top-full left-0 mt-1.5 min-w-[200px] z-50
                    bg-white border border-[#E0DAD0] rounded-xl shadow-sm py-1.5
                    opacity-0 -translate-y-1 pointer-events-none
                    group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
                    transition-all duration-150 ease-out
                  "
                >
                  {item.children.map(child => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-2 text-sm text-[#6B7569] hover:text-[#1C3829] hover:bg-[#F6F3EE] transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
            href="/kontakt"
            className="h-9 px-4 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors inline-flex items-center gap-1.5"
          >
            Kontakt os
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/kontakt"
            className="h-8 px-3 bg-[#1C3829] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5840] transition-colors inline-flex items-center"
          >
            Kontakt os
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
          {NAV_ITEMS.map(item => (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-[#1A1F1C] hover:bg-[#EEF4F0] rounded-lg transition-colors"
              >
                {item.label}
              </Link>
              {item.children.map(child => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setOpen(false)}
                  className="block pl-7 pr-3 py-2 text-sm text-[#6B7569] hover:text-[#1C3829] hover:bg-[#EEF4F0] rounded-lg transition-colors"
                >
                  {child.label}
                </Link>
              ))}
            </div>
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
