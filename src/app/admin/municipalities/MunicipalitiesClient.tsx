'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { MunicipalityCaseStats } from './page'

type Municipality = {
  id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  sagsbehandler_name: string | null
  sagsbehandler_email: string | null
  sagsbehandler_phone: string | null
  created_at: string
}

type FormData = {
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  sagsbehandler_name: string
  sagsbehandler_email: string
  sagsbehandler_phone: string
}

type CaseEntry = {
  id: string
  citizen_initials: string
  citizen_age_range: string
  status: string
  case_number: string | null
  intake_contact_name: string | null
  intake_contact_email: string | null
  intake_contact_phone: string | null
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Åben', MATCHED: 'Matchet', PROPOSED: 'Foreslået',
  ACTIVE: 'Aktiv', COMPLETED: 'Afsluttet', ARCHIVED: 'Arkiveret',
}

const STATUS_VARIANT: Record<string, 'green' | 'amber' | 'default'> = {
  OPEN: 'amber', MATCHED: 'amber', PROPOSED: 'amber',
  ACTIVE: 'green', COMPLETED: 'default', ARCHIVED: 'default',
}

const EMPTY_FORM: FormData = {
  name: '',
  status: 'ACTIVE',
  sagsbehandler_name: '',
  sagsbehandler_email: '',
  sagsbehandler_phone: '',
}

const inputClass =
  'w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors'

type SortKey = 'volume' | 'name'

export function MunicipalitiesClient({ initialData, caseStats }: { initialData: Municipality[]; caseStats: MunicipalityCaseStats[] }) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [saving, startSave] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('volume')
  const [municipalityCases, setMunicipalityCases] = useState<CaseEntry[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [reassigningId, setReassigningId] = useState<string | null>(null)
  const [reassignTarget, setReassignTarget] = useState('')
  const [reassigning, startReassign] = useTransition()
  const [bulkTarget, setBulkTarget] = useState('')
  const [bulkMoving, startBulkMove] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState('')

  const statsById = new Map(caseStats.map(s => [s.municipality_id, s]))
  const getStats = (id: string) => statsById.get(id) ?? { active: 0, completed_90d: 0, municipality_id: id }
  const maxActive = Math.max(...caseStats.map(s => s.active), 1)

  const sorted = [...initialData].sort((a, b) => {
    if (sortKey === 'volume') return getStats(b.id).active - getStats(a.id).active
    return a.name.localeCompare(b.name, 'da')
  })

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setSuccessMsg(null)
    setDeleteTarget('')
    setDrawerOpen(true)
  }

  function openEdit(m: Municipality) {
    setEditingId(m.id)
    setForm({
      name: m.name,
      status: m.status,
      sagsbehandler_name: m.sagsbehandler_name ?? '',
      sagsbehandler_email: m.sagsbehandler_email ?? '',
      sagsbehandler_phone: m.sagsbehandler_phone ?? '',
    })
    setError(null)
    setSuccessMsg(null)
    setMunicipalityCases([])
    setReassigningId(null)
    setReassignTarget('')
    setBulkTarget('')
    setDeleteTarget('')
    setDrawerOpen(true)
    setCasesLoading(true)
    fetch(`/api/municipalities/${m.id}/cases`)
      .then(r => r.json())
      .then((d: { data?: CaseEntry[] }) => setMunicipalityCases(d.data ?? []))
      .catch(() => setMunicipalityCases([]))
      .finally(() => setCasesLoading(false))
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingId(null)
    setError(null)
    setSuccessMsg(null)
    setDeleteConfirm(false)
    setDeleteTarget('')
    setMunicipalityCases([])
    setReassigningId(null)
    setReassignTarget('')
    setBulkTarget('')
  }

  function handleBulkReassign() {
    if (!bulkTarget || !editingId) return
    startBulkMove(async () => {
      setError(null)
      const res = await fetch(`/api/municipalities/${editingId}/reassign-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_municipality_id: bulkTarget }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      const { moved, target_name } = data as { moved: number; target_name: string }
      setMunicipalityCases([])
      setBulkTarget('')
      setError(null)
      setSuccessMsg(`${moved} ${moved === 1 ? 'sag' : 'sager'} er flyttet til ${target_name}. Kommunen kan nu slettes.`)
      router.refresh()
    })
  }

  function handleReassign(caseId: string) {
    if (!reassignTarget) return
    startReassign(async () => {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipality_id: reassignTarget }),
      })
      if (res.ok) {
        setMunicipalityCases(prev => prev.filter(c => c.id !== caseId))
        setReassigningId(null)
        setReassignTarget('')
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!editingId) return
    startDelete(async () => {
      setError(null)
      const body = deleteTarget ? JSON.stringify({ reassign_to: deleteTarget }) : undefined
      const res = await fetch(`/api/municipalities/${editingId}`, {
        method: 'DELETE',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Kunne ikke slette kommunen')
        setDeleteConfirm(false)
        return
      }
      closeDrawer()
      router.refresh()
    })
  }

  function field(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleSave() {
    if (!form.name.trim()) return
    startSave(async () => {
      setError(null)

      const payload: Record<string, string> = {
        name: form.name.trim(),
        status: form.status,
        sagsbehandler_name: form.sagsbehandler_name,
        sagsbehandler_email: form.sagsbehandler_email,
        sagsbehandler_phone: form.sagsbehandler_phone,
      }

      const url = editingId ? `/api/municipalities/${editingId}` : '/api/municipalities'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Noget gik galt')
        return
      }

      closeDrawer()
      router.refresh()
    })
  }

  const activeCount = initialData.filter(m => m.status === 'ACTIVE').length
  const inactiveCount = initialData.filter(m => m.status === 'INACTIVE').length

  return (
    <>
      {/* Toolbar — stacks on mobile so title never wraps */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base font-semibold text-[#1A1F1C]">
          {activeCount} aktive{inactiveCount > 0 ? ` · ${inactiveCount} inaktive` : ''}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[#E0DAD0] overflow-hidden text-xs font-medium">
            {(['volume', 'name'] as SortKey[]).map(k => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={[
                  'px-3 py-1.5 transition-colors',
                  sortKey === k ? 'bg-[#1C3829] text-white' : 'text-[#6B7569] hover:bg-[#F6F3EE]',
                ].join(' ')}
              >
                {k === 'volume' ? 'Flest sager' : 'A–Å'}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={openNew}>
            Ny kommune
          </Button>
        </div>
      </div>

      {initialData.length === 0 ? (
        <EmptyState
          icon={<MuniIcon size={24} />}
          title="Ingen kommuner endnu"
          description="Opret den første kommuneaftale for at komme i gang med sagsstyring"
          action={
            <Button variant="primary" icon={<PlusIcon />} onClick={openNew}>
              Opret kommune
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((m, i) => {
            const stats = getStats(m.id)
            const barWidth = maxActive > 0 ? Math.round((stats.active / maxActive) * 100) : 0
            return (
              <button key={m.id} onClick={() => openEdit(m)} className="w-full text-left block">
                <Card hover className="flex items-center gap-3 sm:gap-4">
                  {/* Rank */}
                  <div className="w-5 text-center text-xs font-semibold text-[#C8C0B0] shrink-0 tabular-nums">
                    {i + 1}
                  </div>
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829] shrink-0">
                    <MuniIcon size={18} />
                  </div>
                  {/* Name + contact + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm truncate mb-0.5">{m.name}</div>
                    {m.sagsbehandler_name && (
                      <div className="text-xs text-[#6B7569] truncate mb-1">{m.sagsbehandler_name}</div>
                    )}
                    {/* Volume bar */}
                    <div className="h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1C3829] rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#1A1F1C] tabular-nums">{stats.active}</div>
                      <div className="text-[10px] text-[#6B7569]">aktive</div>
                    </div>
                    {stats.completed_90d > 0 && (
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-[#6B7569] tabular-nums">{stats.completed_90d}</div>
                        <div className="text-[10px] text-[#6B7569]">afsl. 90d</div>
                      </div>
                    )}
                    <Badge variant={m.status === 'ACTIVE' ? 'green' : 'default'} dot>
                      {m.status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Card>
              </button>
            )
          })}
        </div>
      )}

      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/50 z-40 transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={editingId ? 'Rediger kommune' : 'Ny kommune'}
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl',
          'flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
          <h2 className="font-serif text-lg font-semibold text-[#1A1F1C]">
            {editingId ? 'Rediger kommune' : 'Ny kommune'}
          </h2>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

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

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-[#EEF4F0] border border-[#D1E7D8] rounded-xl text-sm text-[#1C3829]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {successMsg}
            </div>
          )}

          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
                Kommunenavn
              </label>
              <input
                type="text"
                value={form.name}
                onChange={field('name')}
                placeholder="f.eks. Aarhus Kommune"
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {(['ACTIVE', 'INACTIVE'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, status: s }))}
                    className={[
                      'flex-1 h-10 rounded-xl text-sm font-medium border transition-all',
                      form.status === s
                        ? s === 'ACTIVE'
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-[#6B7569] text-white border-[#6B7569]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {s === 'ACTIVE' ? 'Aktiv' : 'Inaktiv'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">
              Generel kommunekontakt
            </div>
            <div className="space-y-3">
              <input type="text" value={form.sagsbehandler_name} onChange={field('sagsbehandler_name')} placeholder="Fuldt navn" className={inputClass} />
              <input type="email" value={form.sagsbehandler_email} onChange={field('sagsbehandler_email')} placeholder="E-mailadresse" className={inputClass} />
              <input type="tel" value={form.sagsbehandler_phone} onChange={field('sagsbehandler_phone')} placeholder="Telefonnummer" className={inputClass} />
            </div>
          </div>

          {/* Linked cases — only when editing */}
          {editingId && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">
                Tilknyttede sager
              </div>
              {!casesLoading && municipalityCases.length > 0 && (
                <div className="mb-3 flex gap-2">
                  <select
                    value={bulkTarget}
                    onChange={e => setBulkTarget(e.target.value)}
                    className="flex-1 border border-[#E0DAD0] rounded-xl px-3 py-2 text-xs text-[#1A1F1C] bg-white focus:outline-none focus:border-[#1C3829]"
                  >
                    <option value="">Flyt alle {municipalityCases.length} sager til…</option>
                    {initialData
                      .filter(m => m.id !== editingId && m.status === 'ACTIVE')
                      .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={handleBulkReassign}
                    disabled={!bulkTarget || bulkMoving}
                    className="px-3 py-2 text-xs font-medium text-white bg-[#1C3829] rounded-xl hover:bg-[#16302d] transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {bulkMoving ? 'Flytter…' : 'Flyt alle'}
                  </button>
                </div>
              )}
              {casesLoading ? (
                <p className="text-xs text-[#6B7569]">Henter sager…</p>
              ) : municipalityCases.length === 0 ? (
                <p className="text-xs text-[#C8C0B0]">Ingen sager tilknyttet denne kommune</p>
              ) : (
                <div className="space-y-2">
                  {municipalityCases.map(c => (
                    <div key={c.id} className="rounded-xl border border-[#E0DAD0] p-3 bg-[#FAFAF8]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#1A1F1C]">{c.citizen_initials}</span>
                            <span className="text-xs text-[#6B7569]">{c.citizen_age_range} år</span>
                          </div>
                          {c.case_number && (
                            <div className="text-[10px] text-[#C8C0B0] mt-0.5">{c.case_number}</div>
                          )}
                          {c.intake_contact_name || c.intake_contact_email || c.intake_contact_phone ? (
                            <div className="mt-1.5 space-y-0.5">
                              {c.intake_contact_name && (
                                <div className="flex items-center gap-1.5 text-[10px] text-[#6B7569]">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                  </svg>
                                  <span className="truncate font-medium text-[#1A1F1C]">{c.intake_contact_name}</span>
                                </div>
                              )}
                              {c.intake_contact_email && (
                                <div className="flex items-center gap-1.5 text-[10px] text-[#6B7569]">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                  </svg>
                                  <a href={`mailto:${c.intake_contact_email}`} className="truncate hover:underline text-[#1C3829]">{c.intake_contact_email}</a>
                                </div>
                              )}
                              {c.intake_contact_phone && (
                                <div className="flex items-center gap-1.5 text-[10px] text-[#6B7569]">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.1 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.84h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 18z" />
                                  </svg>
                                  <a href={`tel:${c.intake_contact_phone}`} className="truncate hover:underline">{c.intake_contact_phone}</a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-1.5 text-[10px] text-[#C8C0B0]">Ingen sagsbehandler angivet</div>
                          )}
                        </div>
                        <Badge variant={STATUS_VARIANT[c.status] ?? 'default'}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </Badge>
                      </div>

                      {reassigningId === c.id ? (
                        <div className="mt-2 flex gap-2">
                          <select
                            value={reassignTarget}
                            onChange={e => setReassignTarget(e.target.value)}
                            className="flex-1 border border-[#E0DAD0] rounded-lg px-2 py-1.5 text-xs text-[#1A1F1C] bg-white focus:outline-none focus:border-[#1C3829]"
                          >
                            <option value="">Vælg kommune…</option>
                            {initialData
                              .filter(m => m.id !== editingId && m.status === 'ACTIVE')
                              .map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleReassign(c.id)}
                            disabled={!reassignTarget || reassigning}
                            className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#1C3829] rounded-lg hover:bg-[#16302d] transition-colors disabled:opacity-40"
                          >
                            Flyt
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReassigningId(null); setReassignTarget('') }}
                            className="px-2.5 py-1.5 text-xs text-[#6B7569] border border-[#E0DAD0] rounded-lg hover:bg-[#F6F3EE] transition-colors"
                          >
                            Annuller
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setReassigningId(c.id); setReassignTarget('') }}
                          className="mt-1.5 text-[10px] text-[#1C3829] hover:text-[#16302d] transition-colors"
                        >
                          Skift kommune →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E0DAD0] shrink-0 space-y-3">
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={closeDrawer} disabled={saving || deleting}>
              Annuller
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={saving}
              disabled={!form.name.trim() || deleting}
              onClick={handleSave}
            >
              {editingId ? 'Gem ændringer' : 'Opret kommune'}
            </Button>
          </div>

          {/* Delete — only shown when editing */}
          {editingId && (
            deleteConfirm ? (
              <div className="space-y-3">
                {municipalityCases.length > 0 ? (
                  <>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                      <p className="font-semibold">
                        {form.name} har {municipalityCases.length} {municipalityCases.length === 1 ? 'sag' : 'sager'} der skal flyttes.
                      </p>
                      <p>Vælg hvilken kommune sagerne overføres til inden sletning:</p>
                    </div>
                    <select
                      value={deleteTarget}
                      onChange={e => setDeleteTarget(e.target.value)}
                      className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] bg-white focus:outline-none focus:border-[#B91C1C]"
                    >
                      <option value="">Vælg modtagerkommune…</option>
                      {initialData
                        .filter(m => m.id !== editingId && m.status === 'ACTIVE')
                        .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    {deleteTarget && (
                      <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#B91C1C] space-y-1">
                        <p className="font-semibold">Advarsel — dette kan ikke fortrydes</p>
                        <p>
                          {municipalityCases.length} {municipalityCases.length === 1 ? 'sag' : 'sager'} flyttes til{' '}
                          <span className="font-semibold">{initialData.find(m => m.id === deleteTarget)?.name}</span>,
                          og <span className="font-semibold">{form.name}</span> slettes permanent.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#B91C1C] space-y-1">
                    <p className="font-semibold">Advarsel — dette kan ikke fortrydes</p>
                    <p><span className="font-semibold">{form.name}</span> slettes permanent.</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDeleteConfirm(false); setDeleteTarget('') }}
                    className="flex-1 px-3 py-2 text-xs text-[#6B7569] border border-[#E0DAD0] rounded-xl hover:bg-[#F6F3EE] transition-colors"
                    disabled={deleting}
                  >
                    Fortryd
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || (municipalityCases.length > 0 && !deleteTarget)}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-[#B91C1C] rounded-xl hover:bg-[#991B1B] transition-colors disabled:opacity-40"
                  >
                    {deleting
                      ? 'Sletter…'
                      : municipalityCases.length > 0
                        ? `Flyt ${municipalityCases.length} ${municipalityCases.length === 1 ? 'sag' : 'sager'} og slet`
                        : 'Ja, slet permanent'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-full text-xs text-[#B91C1C] hover:text-[#991B1B] py-1 transition-colors"
                disabled={saving || deleting || casesLoading}
              >
                Slet kommune
              </button>
            )
          )}
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

function MuniIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  )
}
