'use client'

import { useState, useMemo } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import type { PlanningCase, PlannedHoursRow, ActualHoursRow } from './page'

interface Props {
  cases: PlanningCase[]
  initialPlanned: PlannedHoursRow[]
  actualHours: ActualHoursRow[]
  weekStarts: string[]
  capacityHoursWeek: number | null
}

function keyOf(caseId: string, weekStart: string) {
  return `${caseId}_${weekStart}`
}

function weekRange(weekStart: string) {
  const monday = new Date(`${weekStart}T00:00:00`)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
  return `${fmt(monday)}–${fmt(sunday)}`
}

function mondayOfDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function PlanningClient({ cases, initialPlanned, actualHours, weekStarts, capacityHoursWeek }: Props) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const p of initialPlanned) map[keyOf(p.case_id, p.week_start)] = Number(p.planned_hours)
    return map
  })
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const todayMonday = useMemo(() => mondayOfDate(new Date().toISOString().slice(0, 10)), [])

  // Bucket actual (registered) hours into the same Monday-keyed weeks as the plan.
  const actuals = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of actualHours) {
      const ws = mondayOfDate(r.work_date)
      const k = keyOf(r.case_id, ws)
      map[k] = (map[k] ?? 0) + Number(r.hours)
    }
    return map
  }, [actualHours])

  const weekTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const ws of weekStarts) {
      totals[ws] = cases.reduce((sum, c) => sum + (values[keyOf(c.id, ws)] ?? 0), 0)
    }
    return totals
  }, [values, cases, weekStarts])

  // Cumulative variance per case, for weeks that have started (current or past)
  // — future weeks have no actual yet, so they're excluded from this comparison.
  const caseVariance = useMemo(() => {
    const variance: Record<string, number> = {}
    for (const c of cases) {
      let v = 0
      for (const ws of weekStarts) {
        if (ws > todayMonday) continue
        const planned = values[keyOf(c.id, ws)] ?? 0
        const actual = actuals[keyOf(c.id, ws)] ?? 0
        v += actual - planned
      }
      variance[c.id] = v
    }
    return variance
  }, [values, actuals, cases, weekStarts, todayMonday])

  const caseTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const c of cases) {
      totals[c.id] = weekStarts.reduce((sum, ws) => sum + (values[keyOf(c.id, ws)] ?? 0), 0)
    }
    return totals
  }, [values, cases, weekStarts])

  async function saveCell(caseId: string, weekStart: string, hours: number) {
    const k = keyOf(caseId, weekStart)
    setSavingKey(k)
    setError(null)
    try {
      const res = await fetch('/api/planned-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: caseId, week_start: weekStart, planned_hours: hours }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Kunne ikke gemme')
      }
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setSavingKey(null)
    }
  }

  function handleChange(caseId: string, weekStart: string, raw: string) {
    const parsed = raw === '' ? 0 : parseFloat(raw)
    const hours = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(80, parsed))
    setValues(v => ({ ...v, [keyOf(caseId, weekStart)]: hours }))
  }

  function handleBlur(caseId: string, weekStart: string) {
    saveCell(caseId, weekStart, values[keyOf(caseId, weekStart)] ?? 0)
  }

  if (cases.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon />}
        title="Ingen aktive sager"
        description="Du har ingen aktive sager at planlægge timer for endnu"
      />
    )
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] pb-3 pr-4 sticky left-0 bg-[#F6F3EE] z-10 min-w-[200px]">
                Borger
              </th>
              {weekStarts.map((ws, i) => (
                <th key={ws} className="text-center pb-3 px-2 min-w-[92px]">
                  <div className="text-xs font-semibold text-[#1A1F1C]">
                    {i === 0 ? 'Denne uge' : `Om ${i} ${i === 1 ? 'uge' : 'uger'}`}
                  </div>
                  <div className="text-[10px] text-[#9B9589] mt-0.5">{weekRange(ws)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cases.map(c => {
              const grantRemaining = c.active_grant_hours != null
                ? Math.max(0, c.active_grant_hours - (c.approved_hours_used ?? 0))
                : null
              const overPlanned = grantRemaining != null && caseTotals[c.id] > grantRemaining
              const variance = caseVariance[c.id] ?? 0
              return (
                <tr key={c.id}>
                  <td className="py-2 pr-4 sticky left-0 bg-[#F6F3EE] z-10 align-top">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#1A1F1C]">Borger {c.citizen_initials}</span>
                      <span className="text-xs text-[#9B9589]">{c.citizen_age_range}</span>
                    </div>
                    {grantRemaining != null && (
                      <div className={`text-[11px] mt-0.5 ${overPlanned ? 'text-red-600 font-medium' : 'text-[#9B9589]'}`}>
                        {overPlanned
                          ? `Planlagt overstiger bevilling (${grantRemaining}t tilbage)`
                          : `${grantRemaining}t tilbage på bevilling`}
                      </div>
                    )}
                    {Math.round(Math.abs(variance) * 4) / 4 > 0 && (
                      <div className={`text-[11px] mt-0.5 font-medium ${variance > 0 ? 'text-amber-700' : 'text-[#92660A]'}`}>
                        {variance > 0
                          ? `${variance.toFixed(2).replace(/\.?0+$/, '')}t mere brugt end planlagt`
                          : `${Math.abs(variance).toFixed(2).replace(/\.?0+$/, '')}t mindre brugt end planlagt`}
                      </div>
                    )}
                  </td>
                  {weekStarts.map(ws => {
                    const k = keyOf(c.id, ws)
                    const val = values[k] ?? 0
                    const hasHappened = ws <= todayMonday
                    const actual = actuals[k] ?? 0
                    const delta = actual - val
                    const isFullyPast = ws < todayMonday
                    return (
                      <td key={ws} className="py-2 px-2 text-center align-top">
                        <input
                          type="number"
                          min={0}
                          max={80}
                          step={0.25}
                          value={val === 0 ? '' : val}
                          placeholder="0"
                          onChange={e => handleChange(c.id, ws, e.target.value)}
                          onBlur={() => handleBlur(c.id, ws)}
                          className={[
                            'w-16 h-9 text-center rounded-lg border text-sm focus:outline-none transition-colors bg-white',
                            savingKey === k ? 'border-[#1C3829]' : 'border-[#E0DAD0] focus:border-[#1C3829]',
                          ].join(' ')}
                        />
                        {hasHappened && (actual > 0 || val > 0) && (
                          <div className={[
                            'text-[10px] mt-1',
                            !isFullyPast ? 'text-[#9B9589]' : delta === 0 ? 'text-[#9B9589]' : delta > 0 ? 'text-amber-700 font-medium' : 'text-[#92660A] font-medium',
                          ].join(' ')}>
                            {actual}t reg.{isFullyPast && delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta.toFixed(2).replace(/\.?0+$/, '')})` : ''}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 pr-4 sticky left-0 bg-[#F6F3EE] z-10 text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">
                Total / kapacitet
              </td>
              {weekStarts.map(ws => {
                const total = weekTotals[ws]
                const overCapacity = capacityHoursWeek != null && total > capacityHoursWeek
                return (
                  <td key={ws} className="pt-3 px-2 text-center">
                    <span
                      className={[
                        'inline-flex items-center justify-center min-w-[56px] px-2 py-1 rounded-lg text-xs font-semibold',
                        overCapacity ? 'bg-red-50 text-red-600' : 'bg-[#EEF4F0] text-[#1C3829]',
                      ].join(' ')}
                    >
                      {total}t{capacityHoursWeek != null ? ` / ${capacityHoursWeek}t` : ''}
                    </span>
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-[#9B9589] mt-4">
        Timerne gemmes automatisk når du forlader et felt. "Reg." viser hvad du faktisk har registreret den uge under Timeregistrering —
        brug det til at justere kommende ugers plan, hvis I ligger foran eller bagud.
      </p>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
