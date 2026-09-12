'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

const REPORT_TYPE_LABEL: Record<string, string> = {
  MONTHLY: 'Kort månedlig status',
  EXTENDED: 'Udvidet statusrapport',
  FINAL: 'Afsluttende statusrapport',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Afventer',
  ACKNOWLEDGED: 'Bekræftet',
  SUBMITTED: 'Indsendt',
  REVIEWED: 'Gennemset',
}

const STATUS_BADGE: Record<string, 'amber' | 'green' | 'default' | 'brand'> = {
  PENDING: 'amber',
  ACKNOWLEDGED: 'brand',
  SUBMITTED: 'green',
  REVIEWED: 'default',
}

type FilterKey = 'all' | 'PENDING' | 'ACKNOWLEDGED' | 'SUBMITTED' | 'REVIEWED'

interface Props {
  initialRequests: any[]
  cases: any[]
  professionals: any[]
  casesWithoutRequest: any[]
  initialCreating?: boolean
  initialCaseId?: string
}

export function AdminStatusReportsClient({ initialRequests, cases, professionals, casesWithoutRequest, initialCreating, initialCaseId }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [creating, setCreating] = useState(!!initialCreating)
  const [form, setForm] = useState(() => {
    const matched = initialCaseId ? cases.find(c => c.id === initialCaseId) : undefined
    return {
      case_id: initialCaseId ?? '',
      professional_id: matched?.professional_id ?? '',
      report_type: 'EXTENDED',
      deadline: '',
      message: '',
    }
  })
  const [submitting, startSubmit] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const filtered = useMemo(() => {
    const list = initialRequests
    if (filter === 'all') return list
    if (filter === 'PENDING') return list.filter(r => r.status === 'PENDING' || r.status === 'ACKNOWLEDGED')
    return list.filter(r => r.status === filter)
  }, [initialRequests, filter])

  const counts = useMemo(() => ({
    all: initialRequests.length,
    PENDING: initialRequests.filter(r => r.status === 'PENDING' || r.status === 'ACKNOWLEDGED').length,
    SUBMITTED: initialRequests.filter(r => r.status === 'SUBMITTED').length,
    REVIEWED: initialRequests.filter(r => r.status === 'REVIEWED').length,
  }), [initialRequests])

  function isOverdue(r: any) {
    return r.deadline < today && r.status !== 'SUBMITTED' && r.status !== 'REVIEWED'
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startSubmit(async () => {
      const res = await fetch('/api/admin/status-report-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Noget gik galt'); return }
      setCreating(false)
      setForm({ case_id: '', professional_id: '', report_type: 'EXTENDED', deadline: '', message: '' })
      router.refresh()
    })
  }

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Alle' },
    { key: 'PENDING', label: 'Afventer' },
    { key: 'SUBMITTED', label: 'Indsendt' },
    { key: 'REVIEWED', label: 'Gennemset' },
  ]

  return (
    <>
      {/* Blind spots — active cases with no pending request */}
      {casesWithoutRequest.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92660A" strokeWidth="2" strokeLinecap="round" className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-xs font-semibold text-amber-900">
              {casesWithoutRequest.length} {casesWithoutRequest.length === 1 ? 'aktiv sag' : 'aktive sager'} mangler rapport-anmodning
            </span>
          </div>
          <div className="space-y-1.5">
            {casesWithoutRequest.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2 border border-amber-100">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-[#1A1F1C]">Borger {c.citizen_initials}</span>
                  <span className="text-xs text-[#6B7569] ml-2">{c.citizen_age_range} · {c.municipalities?.name ?? ''}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, case_id: c.id, professional_id: c.professional_id ?? '' }))
                    setCreating(true)
                  }}
                  className="shrink-0 text-[10px] font-semibold text-white bg-[#1C3829] hover:bg-[#2D5840] transition-colors rounded-lg px-2.5 py-1.5"
                >
                  Anmod
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-[#F6F3EE] rounded-xl p-1 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                filter === t.key ? 'bg-white text-[#1A1F1C] shadow-sm' : 'text-[#6B7569] hover:text-[#1A1F1C]',
              ].join(' ')}
            >
              {t.label}
              {counts[t.key as keyof typeof counts] > 0 && (
                <span className={`ml-1.5 tabular-nums ${filter === t.key ? 'text-[#1C3829]' : 'text-[#C8C0B0]'}`}>
                  {counts[t.key as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="h-9 px-4 bg-[#1C3829] text-white text-xs font-semibold rounded-xl hover:bg-[#2D5840] transition-colors flex items-center gap-1.5 shrink-0 ml-3"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Anmod om rapport
        </button>
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1F1C]/50" onClick={() => setCreating(false)} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="font-serif text-lg text-[#1A1F1C]">Anmod om statusrapport</div>
              <button type="button" onClick={() => setCreating(false)} className="w-7 h-7 rounded-full bg-[#F6F3EE] flex items-center justify-center text-[#6B7569]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#6B7569] block mb-1">Sag <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.case_id}
                  onChange={e => {
                    const caseId = e.target.value
                    const matched = cases.find(c => c.id === caseId)
                    setForm(f => ({
                      ...f,
                      case_id: caseId,
                      professional_id: matched?.professional_id ?? f.professional_id,
                    }))
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829]"
                >
                  <option value="">Vælg sag</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>Borger {c.citizen_initials} ({c.citizen_age_range})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7569] block mb-1">
                  Kontaktperson <span className="text-red-500">*</span>
                  {form.case_id && cases.find(c => c.id === form.case_id)?.professional_id && (
                    <span className="ml-1 font-normal text-[#1C3829]">(auto-valgt ud fra sagen)</span>
                  )}
                </label>
                <select
                  required
                  value={form.professional_id}
                  onChange={e => setForm(f => ({ ...f, professional_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829]"
                >
                  <option value="">Vælg kontaktperson</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.profiles?.full_name ?? 'Ukendt'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7569] block mb-1">Rapporttype <span className="text-red-500">*</span></label>
                <select
                  value={form.report_type}
                  onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829]"
                >
                  <option value="MONTHLY">Kort månedlig status</option>
                  <option value="EXTENDED">Udvidet statusrapport</option>
                  <option value="FINAL">Afsluttende statusrapport</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7569] block mb-1">Ønsket frist <span className="text-red-500">*</span></label>
                <input
                  required
                  type="date"
                  min={today}
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7569] block mb-1">Besked til kontaktpersonen (valgfrit)</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="F.eks. særlige fokusområder eller context for anmodningen"
                  className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="submit" variant="primary" size="sm" loading={submitting}>
                  Send anmodning
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
                  Annuller
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ReportIcon />}
          title="Ingen statusrapporter"
          description="Klik 'Anmod om rapport' for at sende en ny anmodning"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const overdue = isOverdue(r)
            return (
              <Link key={r.id} href={`/admin/status-reports/${r.id}`} className="block">
                <Card hover className={overdue ? 'border-red-200 bg-[#FEF2F2]' : ''}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm text-[#1A1F1C]">
                          Borger {r.cases?.citizen_initials}
                        </span>
                        <Badge variant="brand" className="text-[10px]">
                          {REPORT_TYPE_LABEL[r.report_type] ?? r.report_type}
                        </Badge>
                        {overdue && <Badge variant="red">Forfalden</Badge>}
                      </div>
                      <div className="text-xs text-[#6B7569]">
                        {r.professionals?.profiles?.full_name ?? 'Ukendt kontaktperson'}
                        {' · '}
                        Frist: {new Date(r.deadline).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {r.promised_date && r.status === 'ACKNOWLEDGED' && (
                          <span className="ml-1 text-[#1C3829]">
                            · Lover {new Date(r.promised_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={STATUS_BADGE[r.status] ?? 'default'} dot>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

function ReportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}
