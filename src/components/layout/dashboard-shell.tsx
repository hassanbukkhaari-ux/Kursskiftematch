'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const professionalNav: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Mit overblik',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/dashboard/cases',
    label: 'Mine sager',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: '/dashboard/session-logs',
    label: 'Sessionslogs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/hours',
    label: 'Timeregistrering',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

const adminNav: NavItem[] = [
  {
    href: '/admin',
    label: 'Overblik',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/admin/cases',
    label: 'Sager',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: '/admin/matching',
    label: 'Matching',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    href: '/admin/professionals',
    label: 'Fagpersoner',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/inquiries',
    label: 'Henvendelser',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/municipalities',
    label: 'Kommuner',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="22" x2="21" y2="22" />
        <line x1="6" y1="18" x2="6" y2="11" />
        <line x1="10" y1="18" x2="10" y2="11" />
        <line x1="14" y1="18" x2="14" y2="11" />
        <line x1="18" y1="18" x2="18" y2="11" />
        <polygon points="12 2 20 7 4 7" />
      </svg>
    ),
  },
]

// ── Sub-components (no hooks — safe to define at module scope) ──────────

function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-6 h-6 rounded-md' : 'w-7 h-7 rounded-lg'
  const iconSize = size === 'sm' ? 12 : 14
  return (
    <div className={`${dim} bg-[#C8993A] flex items-center justify-center shrink-0`}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
        <path d="M3 13L8 3L13 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 9.5h5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function SidebarNav({
  nav, pathname, isRootRoute,
}: { nav: NavItem[]; pathname: string; isRootRoute: string }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Primær navigation">
      {nav.map((item) => {
        const isActive = item.href === isRootRoute
          ? pathname === isRootRoute
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
              'transition-all duration-150 active:scale-[0.97]',
              isActive
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/[0.08]',
            ].join(' ')}
          >
            <span className="shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarUser({
  userName, roleLabel, defaultInitial,
}: { userName?: string | null; roleLabel: string; defaultInitial: string }) {
  return (
    <div className="px-4 py-4 border-t border-white/10 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#2D5840] flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {userName ? userName.charAt(0).toUpperCase() : defaultInitial}
        </div>
        <div className="min-w-0">
          <div className="text-white text-sm font-medium truncate">{userName || roleLabel}</div>
          <div className="text-white/40 text-xs">{roleLabel}</div>
        </div>
      </div>
    </div>
  )
}

// ── Props ───────────────────────────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode
  userName?: string | null
  role?: 'admin' | 'professional'
}

// ── Main component ──────────────────────────────────────────────────────

export function DashboardShell({ children, userName, role = 'admin' }: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = role === 'professional' ? professionalNav : adminNav
  const isRootRoute = role === 'professional' ? '/dashboard' : '/admin'
  const roleLabel = role === 'professional' ? 'Fagperson' : 'Administrator'
  const defaultInitial = role === 'professional' ? 'P' : 'A'

  // Close slide-over on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Keyboard: Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-[#F6F3EE]">

      {/* ── Desktop sidebar · lg+ ── */}
      <aside
        className="hidden lg:flex flex-col w-[220px] bg-[#1C3829] fixed inset-y-0 left-0 z-30"
        aria-label="Sidenavigation"
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10 shrink-0">
          <Link href={isRootRoute} className="flex items-center gap-2.5">
            <LogoMark />
            <div>
              <div className="text-white font-serif font-semibold text-sm leading-none">Kursskifte</div>
              <div className="text-white/50 text-[10px] tracking-widest uppercase mt-0.5">Match</div>
            </div>
          </Link>
        </div>
        <SidebarNav nav={nav} pathname={pathname} isRootRoute={isRootRoute} />
        <SidebarUser userName={userName} roleLabel={roleLabel} defaultInitial={defaultInitial} />
      </aside>

      {/* ── Mobile / Tablet top bar · < lg ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[#1C3829] flex items-center justify-between px-4 border-b border-white/10">
        <Link href={isRootRoute} className="flex items-center gap-2.5">
          <LogoMark size="sm" />
          <span className="text-white font-serif font-semibold text-sm leading-none">Kursskifte</span>
          <span className="text-white/50 text-[10px] tracking-widest uppercase hidden sm:inline">Match</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
          aria-label="Åbn navigationsmenuen"
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── Mobile backdrop ── */}
      <div
        className={[
          'lg:hidden fixed inset-0 bg-[#1A1F1C]/50 z-40 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile slide-over sidebar ── */}
      <aside
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Navigationsmenuen"
        className={[
          'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col',
          'w-[280px] bg-[#1C3829]',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'shadow-[4px_0_32px_rgba(0,0,0,0.25)]',
        ].join(' ')}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all"
          aria-label="Luk menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div>
              <div className="text-white font-serif font-semibold text-sm leading-none">Kursskifte</div>
              <div className="text-white/50 text-[10px] tracking-widest uppercase mt-0.5">Match</div>
            </div>
          </div>
        </div>

        <SidebarNav nav={nav} pathname={pathname} isRootRoute={isRootRoute} />
        <SidebarUser userName={userName} roleLabel={roleLabel} defaultInitial={defaultInitial} />
      </aside>

      {/* ── Main content ── */}
      <main className="lg:ml-[220px] min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
