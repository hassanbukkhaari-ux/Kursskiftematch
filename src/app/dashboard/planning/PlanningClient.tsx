'use client'

import { useState, useMemo } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import type { PlanningCase, PlannedHoursRow } from './page'

interface Props {
  cases: PlanningCase[]
  initialPlanned: PlannedHoursRow[]
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

export function PlanningClient({ cases, initialPlanned, weekStarts, capacityHoursWeek }: Props) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const p of initialPlanned) map[keyOf(p.case_id, p.week_start)] = Number(p.planned_hours)
    return map
  })
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const weekTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const ws of weekStarts) {
      totals[ws] = cases.reduce((sum, c) => sum + (values[keyOf(c.id, ws)] ?? 0), 0)
    }
    return totals
  }, [values, cases, weekStarts])

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
                <th key={ws} className="text-center pb-3 px-2 min-w-[90px]">
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
                  </td>
                  {weekStarts.map(ws => {
                    const k = keyOf(c.id, ws)
                    const val = values[k] ?? 0
                    return (
                      <td key={ws} className="py-2 px-2 text-center">
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
        Timerne gemmes automatisk når du forlader et felt. Dette er en planlægning — de faktiske timer registreres stadig under Timeregistrering.
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
