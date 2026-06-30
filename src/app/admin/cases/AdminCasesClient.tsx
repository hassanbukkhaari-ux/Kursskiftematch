'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/layout/page-header'
import type { AdminCase, MunicipalityOption } from './page'

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Åben', MATCHED: 'Matchet', ACTIVE: 'Aktiv', COMPLETED: 'Afsluttet', ARCHIVED: 'Arkiveret',
}

const STATUS_BADGE: Record<string, 'amber' | 'brand' | 'green' | 'default'> = {
  OPEN: 'amber', MATCHED: 'brand', ACTIVE: 'green', COMPLETED: 'default', ARCHIVED: 'default',
}

const COMPLEXITY_LABEL: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}

const COMPLEXITY_BADGE: Record<string, 'green' | 'amber' | 'red' | 'default'> = {
  LOW: 'green', MEDIUM: 'amber', HIGH: 'red', CRITICAL: 'red',
}

const AGE_OPTIONS = ['0-5', '6-12', '13-18', '18+'] as const
const COMPLEXITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

type FilterKey = 'all' | 'OPEN' | 'MATCHED' | 'ACTIVE' | 'COMPLETED'

type NewCaseForm = {
  municipality_id: string
  citizen_initials: string
  citizen_age_range: string
  weekly_hours: string
  complexity_level: string
  citizen_notes: string
}

const EMPTY_FORM: NewCaseForm = {
  municipality_id: '',
  citizen_initials: '',
  citizen_age_range: '13-18',
  weekly_hours: '5',
  complexity_level: 'MEDIUM',
  citizen_notes: '',
}

const inputClass =
  'w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors'

export function AdminCasesClient({
  initialCases,
  municipalities,
}: {
  initialCases: AdminCase[]
  municipalities: MunicipalityOption[]
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState<NewCaseForm>(EMPTY_FORM)
  const [saving, startSave] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => ({
    all: initialCases.filter(c => c.status !== 'ARCHIVED').length,
    OPEN: initialCases.filter(c => c.status === 'OPEN').length,
    MATCHED: initialCases.filter(c => c.status === 'MATCHED').length,
    ACTIVE: initialCases.filter(c => c.status === 'ACTIVE').length,
    COMPLETED: initialCases.filter(c => c.status === 'COMPLETED').length,
  }), [initialCases])

  const filtered = useMemo(() => {
    if (filter === 'all') return initialCases.filter(c => c.status !== 'ARCHIVED')
    return initialCases.filter(c => c.status === filter)
  }, [initialCases, filter])

  function field(key: keyof NewCaseForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function openNewCase() {
    setForm({ ...EMPTY_FORM, municipality_id: municipalities[0]?.id ?? '' })
    setError(null)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setError(null)
  }

  function handleCreate() {
    const initials = form.citizen_initials.trim().toUpperCase()
    if (initials.length !== 2) { setError('Initialer skal være præcis 2 bogstaver'); return }
    if (!form.municipality_id) { setError('Vælg en kommune'); return }

    startSave(async () => {
      setError(null)
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipality_id: form.municipality_id,
          citizen_initials: initials,
          citizen_age_range: form.citizen_age_range,
          weekly_hours: Number(form.weekly_hours),
          complexity_level: form.complexity_level,
          citizen_notes: form.citizen_notes || undefined,
        }),
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
    { key: 'OPEN', label: 'Åbne' },
    { key: 'MATCHED', label: 'Matchet' },
    { key: 'ACTIVE', label: 'Aktive' },
    { key: 'COMPLETED', label: 'Afsluttet' },
  ]

  return (
    <>
      <SectionHeader
        title={`${counts.all} sager`}
        description={counts.OPEN > 0 ? `${counts.OPEN} åbne sager afventer matching` : undefined}
        actions={
          <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={openNewCase}>
            Ny sag
          </Button>
        }
      />

      <div className="flex gap-1 mb-5 bg-[#F6F3EE] rounded-xl p-1 w-fit flex-wrap">
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
          icon={<CaseIcon />}
          title="Ingen sager fundet"
          description={filter === 'all' ? 'Opret den første sag for at komme i gang' : undefined}
          action={filter === 'all' ? (
            <Button variant="primary" icon={<PlusIcon />} onClick={openNewCase}>
              Opret sag
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Link key={c.id} href={`/admin/cases/${c.id}`}>
              <Card hover className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FBF3E1] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#92660A]">{c.citizen_initials}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm">
                      Borger {c.citizen_initials} · {c.citizen_age_range}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant={COMPLEXITY_BADGE[c.complexity_level] ?? 'default'}>
                        {COMPLEXITY_LABEL[c.complexity_level] ?? c.complexity_level}
                      </Badge>
                      <span className="text-xs text-[#6B7569]">{c.weekly_hours} t/uge</span>
                      <span className="text-xs text-[#C8C0B0]">{c.municipality_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[c.status] ?? 'default'} dot>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </Badge>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Card>
            </Link>
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
        aria-label="Opret ny sag"
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl',
          'flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
          <h2 className="font-serif text-lg font-semibold text-[#1A1F1C]">Ny sag</h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-full bg-[#F6F3EE] hover:bg-[#EEF4F0] flex items-center justify-center text-[#6B7569] hover:text-[#1A1F1C] transition-colors"
            aria-label="Luk"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kommune</label>
            <select value={form.municipality_id} onChange={field('municipality_id')} className={inputClass}>
              <option value="">Vælg kommune...</option>
              {municipalities.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Borgers initialer (2 bogstaver)</label>
            <input
              type="text"
              value={form.citizen_initials}
              onChange={field('citizen_initials')}
              maxLength={2}
              placeholder="f.eks. AB"
              className={`${inputClass} uppercase`}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Aldersgruppe</label>
            <div className="grid grid-cols-4 gap-2">
              {AGE_OPTIONS.map(age => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, citizen_age_range: age }))}
                  className={[
                    'h-10 rounded-xl text-sm font-medium border transition-all',
                    form.citizen_age_range === age
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                  ].join(' ')}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kompleksitet</label>
            <div className="grid grid-cols-2 gap-2">
              {COMPLEXITY_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, complexity_level: c }))}
                  className={[
                    'h-10 rounded-xl text-sm font-medium border transition-all',
                    form.complexity_level === c
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                  ].join(' ')}
                >
                  {COMPLEXITY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Ugentlige timer</label>
            <input type="number" min={0} max={40} value={form.weekly_hours} onChange={field('weekly_hours')} className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Noter (valgfri)</label>
            <textarea
              value={form.citizen_notes}
              onChange={field('citizen_notes')}
              rows={3}
              placeholder="Tilføj relevante noter om borgerens situation..."
              className={`${inputClass} resize-none`}
            />
          </div>

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

        <div className="px-6 py-4 border-t border-[#E0DAD0] shrink-0 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={closeDrawer} disabled={saving}>
            Annuller
          </Button>
          <Button variant="primary" className="flex-1" loading={saving} onClick={handleCreate}>
            Opret sag
          </Button>
        </div>
      </aside>
    </>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
