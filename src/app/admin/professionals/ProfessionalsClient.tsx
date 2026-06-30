'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/layout/page-header'
import type { ProfessionalRow } from './page'

const PROFESSION_LABEL: Record<string, string> = {
  TEACHER: 'Lærer',
  PEDAGOGUE: 'Pædagog',
  NURSE: 'Sygeplejerske',
  PSYCHOLOGIST: 'Psykolog',
  SOCIAL_WORKER: 'Socialrådgiver',
  COUNSELOR: 'Vejleder',
  OTHER: 'Andet',
}

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: 'Ny registrering',
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
  ARCHIVED: 'Arkiveret',
}

const STATUS_BADGE: Record<string, 'amber' | 'green' | 'red' | 'default'> = {
  REGISTERED: 'amber',
  ACTIVE: 'green',
  INACTIVE: 'red',
  ARCHIVED: 'default',
}

const COMPLEXITY_LABEL: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: 'Tilgængelig',
  PARTIALLY_AVAILABLE: 'Delvis tilgængelig',
  UNAVAILABLE: 'Utilgængelig',
}

const AVAILABILITY_BADGE: Record<string, 'green' | 'amber' | 'red'> = {
  AVAILABLE: 'green',
  PARTIALLY_AVAILABLE: 'amber',
  UNAVAILABLE: 'red',
}

type FilterKey = 'all' | 'REGISTERED' | 'ACTIVE' | 'INACTIVE'

export function ProfessionalsClient({ initialData }: { initialData: ProfessionalRow[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selected, setSelected] = useState<ProfessionalRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [updating, startUpdate] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => ({
    all: initialData.length,
    REGISTERED: initialData.filter(p => p.status === 'REGISTERED').length,
    ACTIVE: initialData.filter(p => p.status === 'ACTIVE').length,
    INACTIVE: initialData.filter(p => p.status === 'INACTIVE').length,
  }), [initialData])

  const filtered = useMemo(() =>
    filter === 'all' ? initialData : initialData.filter(p => p.status === filter),
    [initialData, filter],
  )

  function openDrawer(pro: ProfessionalRow) {
    setSelected(pro)
    setError(null)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setSelected(null)
    setError(null)
  }

  function setStatus(newStatus: string) {
    if (!selected) return
    startUpdate(async () => {
      setError(null)
      const res = await fetch(`/api/professionals/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      closeDrawer()
      router.refresh()
    })
  }

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Alle' },
    { key: 'REGISTERED', label: 'Nye' },
    { key: 'ACTIVE', label: 'Aktive' },
    { key: 'INACTIVE', label: 'Inaktive' },
  ]

  return (
    <>
      <SectionHeader
        title={`${counts.ACTIVE} aktive fagpersoner`}
        description={counts.REGISTERED > 0 ? `${counts.REGISTERED} afventer aktivering` : undefined}
      />

      <div className="flex gap-1 mb-5 bg-[#F6F3EE] rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === tab.key
                ? 'bg-white text-[#1A1F1C] shadow-sm'
                : 'text-[#6B7569] hover:text-[#1A1F1C]',
            ].join(' ')}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 tabular-nums ${filter === tab.key ? 'text-[#1C3829]' : 'text-[#C8C0B0]'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PeopleIcon />}
          title={filter === 'all' ? 'Ingen fagpersoner endnu' : `Ingen ${STATUS_LABEL[filter]?.toLowerCase() ?? ''} fagpersoner`}
          description={filter === 'REGISTERED' ? 'Nye registreringer vises her' : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(pro => (
            <button key={pro.id} onClick={() => openDrawer(pro)} className="w-full text-left block">
              <Card hover className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#EEF4F0] flex items-center justify-center text-sm font-semibold text-[#1C3829] shrink-0">
                    {pro.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm">{pro.profiles.full_name}</div>
                    <div className="text-xs text-[#6B7569]">
                      {PROFESSION_LABEL[pro.profession] ?? pro.profession}
                      {pro.experience_years > 0 && ` · ${pro.experience_years} år erfaring`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[pro.status] ?? 'default'} dot>
                    {STATUS_LABEL[pro.status] ?? pro.status}
                  </Badge>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/50 z-40 transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Fagpersonprofil"
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl',
          'flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen && selected ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {selected && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#EEF4F0] flex items-center justify-center text-base font-semibold text-[#1C3829] shrink-0">
                  {selected.profiles.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-serif font-semibold text-[#1A1F1C] truncate">{selected.profiles.full_name}</div>
                  <div className="text-xs text-[#6B7569] truncate">{selected.profiles.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full bg-[#F6F3EE] hover:bg-[#EEF4F0] flex items-center justify-center text-[#6B7569] hover:text-[#1A1F1C] transition-colors shrink-0"
                aria-label="Luk"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Status</div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={STATUS_BADGE[selected.status] ?? 'default'} dot>
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'REGISTERED' && (
                    <Button variant="primary" size="sm" loading={updating} onClick={() => setStatus('ACTIVE')}>
                      Aktiver
                    </Button>
                  )}
                  {selected.status === 'ACTIVE' && (
                    <Button variant="secondary" size="sm" loading={updating} onClick={() => setStatus('INACTIVE')}>
                      Deaktiver
                    </Button>
                  )}
                  {selected.status === 'INACTIVE' && (
                    <>
                      <Button variant="primary" size="sm" loading={updating} onClick={() => setStatus('ACTIVE')}>
                        Genaktiver
                      </Button>
                      <Button variant="ghost" size="sm" loading={updating} onClick={() => setStatus('ARCHIVED')}>
                        Arkiver
                      </Button>
                    </>
                  )}
                  {selected.status === 'ARCHIVED' && (
                    <Button variant="secondary" size="sm" loading={updating} onClick={() => setStatus('INACTIVE')}>
                      Genopret
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoBlock label="Fag" value={PROFESSION_LABEL[selected.profession] ?? selected.profession} />
                <InfoBlock label="Erfaring" value={`${selected.experience_years} år`} />
                <InfoBlock label="Maks. kompleksitet" value={COMPLEXITY_LABEL[selected.max_complexity_level] ?? selected.max_complexity_level} />
                <InfoBlock label="Kapacitet" value={`${selected.capacity_hours_week} t/uge · maks. ${selected.max_concurrent_cases} sager`} />
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Tilgængelighed</div>
                <Badge variant={AVAILABILITY_BADGE[selected.availability_status] ?? 'default'} dot>
                  {AVAILABILITY_LABEL[selected.availability_status] ?? selected.availability_status}
                </Badge>
                {selected.availability_days.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.availability_days.map(d => (
                      <span key={d} className="text-xs bg-[#F6F3EE] border border-[#E0DAD0] rounded-lg px-2 py-1 text-[#6B7569]">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              {selected.target_age_groups.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Målgrupper</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.target_age_groups.map(g => (
                      <Badge key={g} variant="brand">{g}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selected.qualifications.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kompetencer</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.qualifications.map(q => (
                      <span key={q} className="text-xs bg-[#EEF4F0] border border-[#D1E7D8] rounded-lg px-2 py-1 text-[#1C3829]">{q}</span>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E0DAD0] shrink-0">
              <Button variant="secondary" className="w-full" onClick={closeDrawer}>
                Luk
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F6F3EE] rounded-xl p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">{label}</div>
      <div className="text-sm font-medium text-[#1A1F1C]">{value}</div>
    </div>
  )
}

function PeopleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
