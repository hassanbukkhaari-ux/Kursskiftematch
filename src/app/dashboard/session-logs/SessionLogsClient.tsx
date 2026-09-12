'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SESSION_LOG_STATUS_LABEL as STATUS_LABEL, SESSION_LOG_STATUS_BADGE as STATUS_BADGE } from '@/lib/labels'
import type { SessionLogRow, CaseOption } from './page'

const MOOD_OPTIONS = [
  { value: 'VERY_POSITIVE', label: 'Meget positiv' },
  { value: 'POSITIVE', label: 'Positiv' },
  { value: 'NEUTRAL', label: 'Neutral' },
  { value: 'NEGATIVE', label: 'Negativ' },
  { value: 'VERY_NEGATIVE', label: 'Meget negativ' },
  { value: 'VARIED', label: 'Varierende' },
]
const MOOD_LABEL: Record<string, string> = Object.fromEntries(MOOD_OPTIONS.map(m => [m.value, m.label]))

const CORRECTION_REASON_OPTIONS = [
  { value: 'TYPO', label: 'Tastefejl' },
  { value: 'WRONG_TIME', label: 'Forkert tidspunkt' },
  { value: 'CLARIFICATION', label: 'Uddybning' },
  { value: 'OMISSION', label: 'Manglende oplysning' },
  { value: 'SAFEGUARDING', label: 'Underretningsbekymring' },
  { value: 'OTHER', label: 'Andet' },
]
const CORRECTION_REASON_LABEL: Record<string, string> = Object.fromEntries(CORRECTION_REASON_OPTIONS.map(o => [o.value, o.label]))

type SessionLogCorrection = {
  id: string
  correction_note: string
  correction_reason: string
  created_at: string
}

type FormData = {
  case_id: string
  session_date: string
  duration_minutes: string
  observations: string
  citizen_mood_tone: string
  follow_up_needed: boolean
  follow_up_reason: string
  location: string
}

const EMPTY_FORM: FormData = {
  case_id: '',
  session_date: new Date().toISOString().slice(0, 10),
  duration_minutes: '',
  observations: '',
  citizen_mood_tone: '',
  follow_up_needed: false,
  follow_up_reason: '',
  location: '',
}

type FilterStatus = 'ALL' | 'DRAFT' | 'FINAL' | 'CORRECTED'

interface Props {
  initialLogs: SessionLogRow[]
  cases: CaseOption[]
  defaultCaseId?: string
}

export function SessionLogsClient({ initialLogs, cases, defaultCaseId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<FilterStatus>('ALL')

  // Create drawer
  const [createOpen, setCreateOpen] = useState(!!defaultCaseId)
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM, case_id: defaultCaseId ?? '' })
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // View/finalize drawer
  const [viewingLog, setViewingLog] = useState<SessionLogRow | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)
  const [editedDuration, setEditedDuration] = useState('')
  const [savingDuration, setSavingDuration] = useState(false)

  // Corrections (only relevant once a log is FINAL/CORRECTED and immutable)
  const [corrections, setCorrections] = useState<SessionLogCorrection[]>([])
  const [correctionsLoading, setCorrectionsLoading] = useState(false)
  const [correctionFormOpen, setCorrectionFormOpen] = useState(false)
  const [correctionReason, setCorrectionReason] = useState('')
  const [correctionNote, setCorrectionNote] = useState('')
  const [correctionSaving, setCorrectionSaving] = useState(false)
  const [correctionError, setCorrectionError] = useState<string | null>(null)

  const filtered = filter === 'ALL' ? initialLogs : initialLogs.filter(l => l.status === filter)
  const anyOpen = createOpen || viewOpen

  function openNew() {
    setForm({ ...EMPTY_FORM, case_id: defaultCaseId ?? '' })
    setCreateError(null)
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
    setCreateError(null)
  }

  function openView(log: SessionLogRow) {
    setViewingLog(log)
    setViewError(null)
    setEditedDuration(String(log.duration_minutes ?? ''))
    setViewOpen(true)
    setCorrections([])
    setCorrectionFormOpen(false)
    setCorrectionReason('')
    setCorrectionNote('')
    setCorrectionError(null)
    if (log.status === 'FINAL' || log.status === 'CORRECTED') {
      setCorrectionsLoading(true)
      fetch(`/api/session-logs/${log.id}/corrections`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setCorrections(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setCorrectionsLoading(false))
    }
  }

  function closeView() {
    setViewOpen(false)
    setViewingLog(null)
    setViewError(null)
  }

  async function handleSubmitCorrection() {
    if (!viewingLog) return
    if (!correctionReason) { setCorrectionError('Vælg en årsag'); return }
    if (!correctionNote.trim()) { setCorrectionError('Beskriv rettelsen'); return }

    setCorrectionError(null)
    setCorrectionSaving(true)
    try {
      const res = await fetch(`/api/session-logs/${viewingLog.id}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correction_reason: correctionReason, correction_note: correctionNote }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCorrectionError((json as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      setCorrections(prev => [json as SessionLogCorrection, ...prev])
      setViewingLog(v => v ? { ...v, status: 'CORRECTED' } : v)
      setCorrectionFormOpen(false)
      setCorrectionReason('')
      setCorrectionNote('')
      startTransition(() => { router.refresh() })
    } catch {
      setCorrectionError('Netværksfejl — prøv igen')
    } finally {
      setCorrectionSaving(false)
    }
  }

  function closeAll() {
    closeCreate()
    closeView()
  }

  async function handleSave() {
    setCreateError(null)
    if (!form.case_id) { setCreateError('Vælg en sag'); return }
    if (!form.session_date) { setCreateError('Angiv sessionsdato'); return }
    if (form.session_date > new Date().toISOString().slice(0, 10)) {
      setCreateError('Sessionsdato kan ikke være i fremtiden'); return
    }
    if (!form.duration_minutes || parseInt(form.duration_minutes) < 1) {
      setCreateError('Angiv varighed'); return
    }
    if (!form.observations.trim()) {
      setCreateError('Beskriv hvad der skete i sessionen (Observationer er påkrævet)'); return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/session-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: form.case_id,
          session_date: form.session_date,
          duration_minutes: parseInt(form.duration_minutes),
          observations: form.observations || undefined,
          citizen_mood_tone: form.citizen_mood_tone || undefined,
          follow_up_needed: form.follow_up_needed,
          follow_up_reason: form.follow_up_needed && form.follow_up_reason ? form.follow_up_reason : undefined,
          location: form.location || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setCreateError((json as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      closeCreate()
      startTransition(() => { router.refresh() })
    } catch {
      setCreateError('Netværksfejl — prøv igen')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDuration() {
    if (!viewingLog) return
    const minutes = parseInt(editedDuration, 10)
    if (!minutes || minutes < 1) { setViewError('Angiv en gyldig varighed'); return }
    if (minutes === viewingLog.duration_minutes) return

    setViewError(null)
    setSavingDuration(true)
    try {
      const res = await fetch(`/api/session-logs/${viewingLog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_minutes: minutes }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setViewError((json as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      setViewingLog(v => v ? { ...v, duration_minutes: minutes } : v)
      startTransition(() => { router.refresh() })
    } catch {
      setViewError('Netværksfejl — prøv igen')
    } finally {
      setSavingDuration(false)
    }
  }

  async function handleFinalize() {
    if (!viewingLog) return
    setViewError(null)
    setFinalizing(true)
    try {
      const res = await fetch(`/api/session-logs/${viewingLog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FINALIZE' }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setViewError((json as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      closeView()
      startTransition(() => { router.refresh() })
    } catch {
      setViewError('Netværksfejl — prøv igen')
    } finally {
      setFinalizing(false)
    }
  }

  const caseLabel = (id: string) => {
    const c = cases.find(c => c.id === id)
    return c ? `Borger ${c.citizen_initials} · ${c.citizen_age_range}` : id
  }

  const TABS: { label: string; value: FilterStatus }[] = [
    { label: 'Alle', value: 'ALL' },
    { label: 'Oprettede', value: 'DRAFT' },
    { label: 'Afsluttede', value: 'FINAL' },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex gap-1 bg-white border border-[#E0DAD0] rounded-xl p-1">
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
          Ny sessionslog
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-[#6B7569] mb-3">
            {filter === 'ALL' ? 'Ingen sessionslogs endnu' : `Ingen ${STATUS_LABEL[filter]?.toLowerCase()} logs`}
          </p>
          <button onClick={openNew} className="text-sm font-semibold text-[#1C3829] hover:underline">
            Opret første sessionslog →
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <button key={log.id} onClick={() => openView(log)} className="w-full text-left block">
              <Card hover className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1A1F1C]">
                      {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(log.session_date))}
                    </span>
                    {log.duration_minutes != null && (
                      <span className="text-xs text-[#6B7569]">{formatDuration(log.duration_minutes)}</span>
                    )}
                  </div>
                  <span className="text-xs text-[#6B7569]">{caseLabel(log.case_id)}</span>
                  {log.observations && (
                    <span className="text-xs text-[#6B7569] truncate max-w-sm">{log.observations}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  {log.follow_up_needed && <Badge variant="amber">Opfølgning</Badge>}
                  <Badge variant={STATUS_BADGE[log.status] ?? 'default'}>
                    {STATUS_LABEL[log.status] ?? log.status}
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

      {/* Shared backdrop */}
      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/40 z-40 transition-opacity duration-300',
          anyOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={closeAll}
        aria-hidden="true"
      />

      {/* ── Create drawer ── */}
      <aside
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          createOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-label="Ny sessionslog"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
          <h2 className="font-serif text-lg font-semibold text-[#1A1F1C]">Ny sessionslog</h2>
          <button onClick={closeCreate} className="w-8 h-8 rounded-full hover:bg-[#F6F3EE] flex items-center justify-center text-[#6B7569] transition-colors" aria-label="Luk">
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

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Sessionsdato *</label>
            <input
              type="date"
              value={form.session_date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
              className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Varighed *</label>
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90, 120, 150, 180, 240].map(min => {
                const h = Math.floor(min / 60)
                const m = min % 60
                const label = h > 0 ? (m > 0 ? `${h}t ${m}min` : `${h}t`) : `${m}min`
                const active = form.duration_minutes === String(min)
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, duration_minutes: String(min) }))}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                      active
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-[#F6F3EE] text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829] hover:text-[#1C3829]'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Hvad skete der i sessionen? *</label>
            <textarea
              rows={4}
              placeholder="Beskriv sessionens forløb, observationer og hvad I arbejdede med…"
              value={form.observations}
              onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Borgers stemning</label>
              <select
                value={form.citizen_mood_tone}
                onChange={e => setForm(f => ({ ...f, citizen_mood_tone: e.target.value }))}
                className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
              >
                <option value="">Vælg…</option>
                {MOOD_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Sted</label>
              <input
                type="text"
                placeholder="F.eks. hjemme, skole…"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Opfølgning nødvendig</label>
            <div className="flex gap-2">
              {[{ label: 'Nej', value: false }, { label: 'Ja', value: true }].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, follow_up_needed: opt.value }))}
                  className={[
                    'flex-1 h-10 rounded-xl text-sm font-medium transition-all border',
                    form.follow_up_needed === opt.value
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829] hover:text-[#1C3829]',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.follow_up_needed && (
              <textarea
                rows={2}
                placeholder="Beskriv hvad der skal følges op på…"
                value={form.follow_up_reason}
                onChange={e => setForm(f => ({ ...f, follow_up_reason: e.target.value }))}
                className="mt-2 w-full px-3 py-2.5 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829] resize-none"
              />
            )}
          </div>

          {createError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{createError}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E0DAD0] flex gap-3 shrink-0">
          <button
            onClick={closeCreate}
            className="flex-1 h-10 rounded-xl border border-[#E0DAD0] text-sm font-semibold text-[#1A1F1C] hover:bg-[#F6F3EE] transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isPending}
            className="flex-1 h-10 rounded-xl bg-[#1C3829] text-[#F6F3EE] text-sm font-semibold hover:bg-[#2D5840] transition-colors disabled:opacity-50"
          >
            {saving ? 'Gemmer…' : 'Gem sessionslog'}
          </button>
        </div>
      </aside>

      {/* ── View / finalize drawer ── */}
      <aside
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          viewOpen && viewingLog ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-label="Sessionslog"
      >
        {viewingLog && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1A1F1C]">Sessionslog</h2>
                <div className="mt-1">
                  <Badge variant={STATUS_BADGE[viewingLog.status] ?? 'default'}>
                    {STATUS_LABEL[viewingLog.status] ?? viewingLog.status}
                  </Badge>
                </div>
              </div>
              <button onClick={closeView} className="w-8 h-8 rounded-full hover:bg-[#F6F3EE] flex items-center justify-center text-[#6B7569] transition-colors" aria-label="Luk">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <InfoRow label="Sag" value={caseLabel(viewingLog.case_id)} />
              <InfoRow
                label="Dato"
                value={new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(viewingLog.session_date))}
              />
              {viewingLog.duration_minutes != null && (
                viewingLog.status === 'DRAFT' ? (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Varighed</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={editedDuration}
                        onChange={e => setEditedDuration(e.target.value)}
                        className="w-24 h-9 px-3 rounded-lg border border-[#E0DAD0] text-sm text-[#1A1F1C] focus:outline-none focus:border-[#1C3829]"
                      />
                      <span className="text-sm text-[#6B7569]">minutter</span>
                      {parseInt(editedDuration, 10) !== viewingLog.duration_minutes && (
                        <button
                          onClick={handleSaveDuration}
                          disabled={savingDuration}
                          className="h-9 px-3 rounded-lg bg-[#1C3829] text-white text-xs font-semibold hover:bg-[#2D5840] transition-colors disabled:opacity-50"
                        >
                          {savingDuration ? 'Gemmer…' : 'Gem'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#9B9589] mt-1">Opdaterer også de tilknyttede timer under Timeregistrering.</p>
                  </div>
                ) : (
                  <InfoRow label="Varighed" value={formatDuration(viewingLog.duration_minutes)} />
                )
              )}
              {viewingLog.location && (
                <InfoRow label="Sted" value={viewingLog.location} />
              )}
              {viewingLog.citizen_mood_tone && (
                <InfoRow
                  label="Borgers stemning"
                  value={MOOD_LABEL[viewingLog.citizen_mood_tone] ?? viewingLog.citizen_mood_tone}
                />
              )}
              {viewingLog.observations && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Observationer</div>
                  <div className="bg-[#F6F3EE] rounded-xl p-4 text-sm text-[#1A1F1C] leading-relaxed whitespace-pre-wrap">
                    {viewingLog.observations}
                  </div>
                </div>
              )}
              {viewingLog.follow_up_needed && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">Opfølgning</div>
                    <Badge variant="amber">Nødvendig</Badge>
                  </div>
                  {viewingLog.follow_up_reason && (
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 text-sm text-[#1A1F1C] leading-relaxed whitespace-pre-wrap">
                      {viewingLog.follow_up_reason}
                    </div>
                  )}
                </div>
              )}

              {(viewingLog.status === 'FINAL' || viewingLog.status === 'CORRECTED') && (
                <div className="pt-2 border-t border-[#E0DAD0]">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Rettelser</div>
                  {correctionsLoading && <p className="text-xs text-[#9B9589]">Henter…</p>}
                  {!correctionsLoading && corrections.length === 0 && !correctionFormOpen && (
                    <p className="text-xs text-[#9B9589] mb-2">Ingen rettelser endnu</p>
                  )}
                  {corrections.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {corrections.map(c => (
                        <div key={c.id} className="bg-[#F6F3EE] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[#1A1F1C]">{CORRECTION_REASON_LABEL[c.correction_reason] ?? c.correction_reason}</span>
                            <span className="text-[10px] text-[#9B9589]">
                              {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(c.created_at))}
                            </span>
                          </div>
                          <p className="text-xs text-[#1A1F1C] whitespace-pre-wrap">{c.correction_note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!correctionFormOpen ? (
                    <button
                      type="button"
                      onClick={() => setCorrectionFormOpen(true)}
                      className="text-sm font-semibold text-[#1C3829] hover:underline"
                    >
                      Ret log
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Årsag *</label>
                        <select
                          value={correctionReason}
                          onChange={e => setCorrectionReason(e.target.value)}
                          className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                        >
                          <option value="">Vælg…</option>
                          {CORRECTION_REASON_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Beskriv rettelsen *</label>
                        <textarea
                          rows={3}
                          value={correctionNote}
                          onChange={e => setCorrectionNote(e.target.value)}
                          placeholder="Hvad rettes, og hvorfor…"
                          className="w-full px-3 py-2.5 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829] resize-none"
                        />
                      </div>
                      {correctionError && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{correctionError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setCorrectionFormOpen(false); setCorrectionError(null) }}
                          className="h-9 px-4 rounded-lg border border-[#E0DAD0] text-xs font-semibold text-[#1A1F1C] hover:bg-[#F6F3EE] transition-colors"
                        >
                          Annuller
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitCorrection}
                          disabled={correctionSaving}
                          className="h-9 px-4 rounded-lg bg-[#1C3829] text-white text-xs font-semibold hover:bg-[#2D5840] transition-colors disabled:opacity-50"
                        >
                          {correctionSaving ? 'Gemmer…' : 'Gem rettelse'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{viewError}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E0DAD0] flex gap-3 shrink-0">
              <button
                onClick={closeView}
                className={[
                  'h-10 rounded-xl border border-[#E0DAD0] text-sm font-semibold text-[#1A1F1C] hover:bg-[#F6F3EE] transition-colors',
                  viewingLog.status === 'DRAFT' ? 'flex-none px-5' : 'flex-1',
                ].join(' ')}
              >
                Luk
              </button>
              {viewingLog.status === 'DRAFT' && (
                <button
                  onClick={handleFinalize}
                  disabled={finalizing || isPending}
                  className="flex-1 h-10 rounded-xl bg-[#1C3829] text-[#F6F3EE] text-sm font-semibold hover:bg-[#2D5840] transition-colors disabled:opacity-50"
                >
                  {finalizing ? 'Afslutter…' : 'Afslut sessionslog'}
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min.`
  if (m === 0) return `${h} time${h > 1 ? 'r' : ''}`
  return `${h} time${h > 1 ? 'r' : ''} ${m} min.`
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">{label}</div>
      <div className="text-sm text-[#1A1F1C]">{value}</div>
    </div>
  )
}
