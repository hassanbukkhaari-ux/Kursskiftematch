'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SessionLogRow, CaseOption } from './page'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Kladde', FINAL: 'Afsluttet', CORRECTED: 'Korrigeret', ARCHIVED: 'Arkiveret',
}
const STATUS_BADGE: Record<string, 'default' | 'green' | 'amber'> = {
  DRAFT: 'default', FINAL: 'green', CORRECTED: 'amber', ARCHIVED: 'default',
}

const MOOD_OPTIONS = [
  { value: 'VERY_POSITIVE', label: 'Meget positiv' },
  { value: 'POSITIVE', label: 'Positiv' },
  { value: 'NEUTRAL', label: 'Neutral' },
  { value: 'NEGATIVE', label: 'Negativ' },
  { value: 'VERY_NEGATIVE', label: 'Meget negativ' },
  { value: 'VARIED', label: 'Varierende' },
]
const MOOD_LABEL: Record<string, string> = Object.fromEntries(MOOD_OPTIONS.map(m => [m.value, m.label]))

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
    setViewOpen(true)
  }

  function closeView() {
    setViewOpen(false)
    setViewingLog(null)
    setViewError(null)
  }

  function closeAll() {
    closeCreate()
    closeView()
  }

  async function handleSave() {
    setCreateError(null)
    if (!form.case_id) { setCreateError('Vælg en sag'); return }
    if (!form.session_date) { setCreateError('Angiv sessionsdato'); return }
    if (!form.duration_minutes || parseInt(form.duration_minutes) < 1) {
      setCreateError('Angiv varighed (min. 1 min.)')
      return
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
    { label: 'Kladder', value: 'DRAFT' },
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
                    {log.duration_minutes && (
                      <span className="text-xs text-[#6B7569]">{log.duration_minutes} min.</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Sessionsdato *</label>
              <input
                type="date"
                value={form.session_date}
                onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
                className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Varighed (min.) *</label>
              <input
                type="number"
                min={1}
                placeholder="60"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Observationer</label>
            <textarea
              rows={4}
              placeholder="Beskriv sessionens forløb og observationer…"
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
            {saving ? 'Gemmer…' : 'Gem som kladde'}
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
                <InfoRow label="Varighed" value={`${viewingLog.duration_minutes} minutter`} />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">{label}</div>
      <div className="text-sm text-[#1A1F1C]">{value}</div>
    </div>
  )
}
