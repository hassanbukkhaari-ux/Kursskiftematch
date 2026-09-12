'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'

export type PlannedRow = {
  id: string
  case_id: string
  professional_id: string
  planned_hours: number
  cases: { citizen_initials: string; citizen_age_range: string } | null
}

export type ProfessionalRow = {
  id: string
  capacity_hours_week: number | null
  profiles: { full_name: string | null } | null
}

interface Props {
  initialWeekStart: string
  initialPlanned: PlannedRow[]
  initialProfessionals: ProfessionalRow[]
}

function shiftWeek(weekStart: string, deltaWeeks: number) {
  const d = new Date(`${weekStart}T00:00:00`)
  d.setDate(d.getDate() + deltaWeeks * 7)
  return d.toISOString().slice(0, 10)
}

function weekRangeLabel(weekStart: string) {
  const monday = new Date(`${weekStart}T00:00:00`)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function currentMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function AdminPlanningClient({ initialWeekStart, initialPlanned, initialProfessionals }: Props) {
  const [weekStart, setWeekStart] = useState(initialWeekStart)
  const [planned, setPlanned] = useState<PlannedRow[]>(initialPlanned)
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>(initialProfessionals)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchWeek = useCallback(async (ws: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/planned-hours?week_start=${ws}`)
      const json = await res.json()
      if (json.planned) setPlanned(json.planned)
      if (json.professionals) setProfessionals(json.professionals)
    } finally {
      setLoading(false)
    }
  }, [])

  function goToWeek(ws: string) {
    setWeekStart(ws)
    fetchWeek(ws)
  }

  const todayMonday = useMemo(() => currentMonday(), [])

  const byProfessional = useMemo(() => {
    const map = new Map<string, PlannedRow[]>()
    for (const p of planned) {
      const list = map.get(p.professional_id) ?? []
      list.push(p)
      map.set(p.professional_id, list)
    }
    return map
  }, [planned])

  const rows = professionals
    .map(pro => {
      const cases = byProfessional.get(pro.id) ?? []
      const total = cases.reduce((sum, c) => sum + Number(c.planned_hours), 0)
      return { pro, cases, total }
    })
    .filter(r => r.cases.length > 0)
    .sort((a, b) => b.total - a.total)

  const isCurrentWeek = weekStart === todayMonday

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToWeek(shiftWeek(weekStart, -1))}
            className="w-9 h-9 rounded-xl border border-[#E0DAD0] bg-white flex items-center justify-center text-[#6B7569] hover:bg-[#F6F3EE] transition-colors"
            aria-label="Forrige uge"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="text-sm font-medium text-[#1A1F1C] min-w-[220px] text-center">
            {weekRangeLabel(weekStart)}
            {isCurrentWeek && <span className="ml-2 text-xs text-[#1C3829] font-semibold">· Denne uge</span>}
          </div>
          <button
            type="button"
            onClick={() => goToWeek(shiftWeek(weekStart, 1))}
            className="w-9 h-9 rounded-xl border border-[#E0DAD0] bg-white flex items-center justify-center text-[#6B7569] hover:bg-[#F6F3EE] transition-colors"
            aria-label="Næste uge"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        {!isCurrentWeek && (
          <button type="button" onClick={() => goToWeek(todayMonday)} className="text-xs font-medium text-[#1C3829] hover:underline">
            Gå til denne uge
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#1C3829] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon />}
          title="Ingen planlagte timer denne uge"
          description="Ingen kontaktpersoner har planlagt timer for den valgte uge endnu"
        />
      ) : (
        <div className="space-y-2">
          {rows.map(({ pro, cases, total }) => {
            const capacity = pro.capacity_hours_week
            const overCapacity = capacity != null && total > capacity
            const isExpanded = expanded === pro.id
            return (
              <Card key={pro.id} className="!p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : pro.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#FAFAF8] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1A1F1C]">{pro.profiles?.full_name ?? 'Ukendt'}</div>
                    <div className="text-xs text-[#6B7569] mt-0.5">{cases.length} {cases.length === 1 ? 'sag' : 'sager'} planlagt</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={overCapacity ? 'red' : 'green'} dot>
                      {total}t{capacity != null ? ` / ${capacity}t` : ''}
                    </Badge>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="2" strokeLinecap="round"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-[#E0DAD0] divide-y divide-[#EEEAE2]">
                    {cases.map(c => (
                      <div key={c.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                        <span className="text-[#1A1F1C]">
                          Borger {c.cases?.citizen_initials} <span className="text-[#9B9589]">· {c.cases?.citizen_age_range}</span>
                        </span>
                        <span className="font-medium text-[#1A1F1C]">{c.planned_hours}t</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
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
