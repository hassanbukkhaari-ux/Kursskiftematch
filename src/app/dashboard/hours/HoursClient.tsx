'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { HoursRow, CaseOption } from './page'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Afventer', SUBMITTED: 'Indsendt', APPROVED: 'Godkendt',
  REJECTED: 'Afvist', OUTSIDE_GRANT: 'Uden for bevilling',
}
const STATUS_BADGE: Record<string, 'default' | 'green' | 'amber' | 'red'> = {
  PENDING: 'default', SUBMITTED: 'amber', APPROVED: 'green',
  REJECTED: 'red', OUTSIDE_GRANT: 'default',
}

const WORK_TYPE_LABEL: Record<string, string> = {
  DIRECT_SESSION: 'Direkte session',
  TRANSPORT: 'Transport',
  DOCUMENTATION: 'Dokumentation',
  COORDINATION: 'Koordinering',
  CRISIS_RESPONSE: 'Krisehåndtering',
  TRAINING: 'Kompetenceudvikling',
  OTHER: 'Andet',
}

const WORK_TYPES = Object.entries(WORK_TYPE_LABEL)

type FormData = {
  case_id: string
  work_date: string
  work_type: string
  hours: string
  description: string
}

const EMPTY_FORM: FormData = {
  case_id: '',
  work_date: new Date().toISOString().slice(0, 10),
  work_type: 'DIRECT_SESSION',
  hours: '',
  description: '',
}

type FilterStatus = 'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED'

interface Props {
  initialHours: HoursRow[]
  cases: CaseOption[]
  defaultCaseId?: string
}

export function HoursClient({ initialHours, cases, defaultCaseId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [drawerOpen, setDrawerOpen] = useState(!!defaultCaseId)
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM, case_id: defaultCaseId ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = filter === 'ALL' ? initialHours : initialHours.filter(h => h.status === filter)
  const totalHours = filtered.reduce((sum, h) => sum + h.hours, 0)

  function openNew() {
    setForm({ ...EMPTY_FORM, case_id: defaultCaseId ?? '' })
    setError(null)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setError(null)
  }

  async function handleSave() {
    setError(null)
    if (!form.case_id) { setError('Vælg en sag'); return }
    if (!form.work_date) { setError('Angiv dato'); return }
    const hours = parseFloat(form.hours)
    if (!form.hours || isNaN(hours) || hours < 0.25 || hours > 8) {
      setError('Timer skal være mellem 0,25 og 8')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/registered-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: form.case_id,
          work_date: form.work_date,
          work_type: form.work_type,
          hours,
          description: form.description || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Noget gik galt')
        return
      }
      closeDrawer()
      startTransition(() => { router.refresh() })
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setSaving(false)
    }
  }

  const caseLabel = (id: string) => {
    const c = cases.find(c => c.id === id)
    return c ? `Borger ${c.citizen_initials} · ${c.citizen_age_range}` : id
  }

  const TABS: { label: string; value: FilterStatus }[] = [
    { label: 'Alle', value: 'ALL' },
    { label: 'Afventer', value: 'PENDING' },
    { label: 'Indsendt', value: 'SUBMITTED' },
    { label: 'Godkendt', value: 'APPROVED' },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex gap-1 bg-white border border-[#E0DAD0] rounded-xl p-1 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === t.value
                  ? 'bg-[#1C3829] text-white'
                  : 'text-[#6B7569] hover:text-[#1A1F1C]',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 h-10 px-4 bg-[#1C3829] text-[#F6F3EE] rounded-xl text-sm font-semibold hover:bg-[#2D5840] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Registrer timer
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="mb-4 flex items-center gap-6">
          <div className="bg-white border border-[#E0DAD0] rounded-xl px-5 py-3 flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">Timer i alt</div>
              <div className="text-sm font-semibold text-[#1A1F1C]">{totalHours.toLocaleString('da-DK')} t</div>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-[#6B7569] mb-3">
            {filter === 'ALL' ? 'Ingen timer registreret endnu' : `Ingen ${STATUS_LABEL[filter]?.toLowerCase()} timer`}
          </p>
          <button onClick={openNew} className="text-sm font-semibold text-[#1C3829] hover:underline">
            Registrer første timer →
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(h => (
            <Card key={h.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1A1F1C]">
                    {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(h.work_date))}
                    <span className="text-[#6B7569] font-normal"> · {h.hours} t</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#6B7569]">{WORK_TYPE_LABEL[h.work_type] ?? h.work_type}</span>
                    <span className="text-[#C8C0B0] text-xs">·</span>
                    <span className="text-xs text-[#6B7569] truncate">{caseLabel(h.case_id)}</span>
                  </div>
                </div>
              </div>
              <Badge variant={STATUS_BADGE[h.status] ?? 'default'}>
                {STATUS_LABEL[h.status] ?? h.status}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/40 z-40 transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-label="Registrer timer"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
          <h2 className="font-serif text-lg font-semibold text-[#1A1F1C]">Registrer timer</h2>
          <button onClick={closeDrawer} className="w-8 h-8 rounded-full hover:bg-[#F6F3EE] flex items-center justify-center text-[#6B7569] transition-colors" aria-label="Luk">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Sag *</label>
            <select
              value={form.case_id}
              onChange={e => setForm(f => ({ ...f, case_id: e.target.value }))}
              className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
            >
              <option value="">Vælg sag…</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>Borger {c.citizen_initials} · {c.citizen_age_range}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Dato *</label>
              <input
                type="date"
                value={form.work_date}
                onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))}
                className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Timer *</label>
              <input
                type="number"
                min={0.25}
                max={8}
                step={0.25}
                placeholder="1.5"
                value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Arbejdstype *</label>
            <div className="grid grid-cols-2 gap-2">
              {WORK_TYPES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, work_type: value }))}
                  className={[
                    'h-10 px-3 rounded-xl text-sm font-medium transition-all border text-left',
                    form.work_type === value
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829] hover:text-[#1C3829]',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Beskrivelse</label>
            <textarea
              rows={3}
              placeholder="Valgfri beskrivelse af arbejdet…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829] resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E0DAD0] flex gap-3 shrink-0">
          <button
            onClick={closeDrawer}
            className="flex-1 h-10 rounded-xl border border-[#E0DAD0] text-sm font-semibold text-[#1A1F1C] hover:bg-[#F6F3EE] transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isPending}
            className="flex-1 h-10 rounded-xl bg-[#1C3829] text-[#F6F3EE] text-sm font-semibold hover:bg-[#2D5840] transition-colors disabled:opacity-50"
          >
            {saving ? 'Gemmer…' : 'Registrer'}
          </button>
        </div>
      </aside>
    </>
  )
}
