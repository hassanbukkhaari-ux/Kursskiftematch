'use client'

import { useState, useTransition, useMemo } from 'react'
import { MatchCard, type MatchCandidate } from '@/components/matching/match-card'
import { ProfessionalProfileDrawer, type CaseRequirements } from '@/components/matching/professional-profile-drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState } from '@/components/ui/empty-state'
import { Label } from '@/components/ui/badge'
import { getScoreColor } from '@/components/matching/score-ring'

interface MatchingUIProps {
  candidates: MatchCandidate[]
  runId: string
  caseId: string
  runStatus: string
  caseData?: CaseRequirements
}

type FilterState = {
  minScore: number
  availability: string
  search: string
}

export function MatchingUI({ candidates, runId, caseId, runStatus, caseData }: MatchingUIProps) {
  const [selected, setSelected] = useState<MatchCandidate | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [assigning, startAssign] = useTransition()
  const [assignedId, setAssignedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmCandidate, setConfirmCandidate] = useState<MatchCandidate | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    minScore: 0,
    availability: '',
    search: '',
  })

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (c.overall_score < filters.minScore) return false
      const avail = c.professionals?.availability_status ?? ''
      if (filters.availability && avail !== filters.availability) return false
      const name = c.professionals?.profiles?.full_name?.toLowerCase() ?? ''
      if (filters.search && !name.includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [candidates, filters])

  function handleSelect(candidate: MatchCandidate) {
    setSelected(candidate)
    setDrawerOpen(true)
  }

  function handleAssign(candidate: MatchCandidate) {
    setConfirmCandidate(candidate)
  }

  async function executeAssign(candidate: MatchCandidate) {
    setConfirmCandidate(null)
    setError(null)
    startAssign(async () => {
      try {
        const res = await fetch(`/api/match-runs/${runId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professional_id: candidate.professional_id,
            candidate_id: candidate.id,
            notes: `Tildelt via matching UI — score: ${candidate.overall_score}`,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? 'Tildeling fejlede')
          return
        }
        setAssignedId(candidate.id)
        setDrawerOpen(false)
      } catch {
        setError('Netværksfejl — prøv igen')
      }
    })
  }

  if (runStatus !== 'SCORED') {
    return (
      <EmptyState
        icon={<SpinnerIcon />}
        title="Match-kørslen er ikke klar endnu"
        description={`Status: ${runStatus}. Algoritmen scorer kandidaterne...`}
      />
    )
  }

  if (assignedId) {
    const assignedName = candidates.find(c => c.id === assignedId)?.professionals?.profiles?.full_name ?? 'Fagpersonen'
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-1">Tildeling gennemført</h3>
        <p className="text-[#6B7569] text-sm">{assignedName} er nu tildelt sagen.</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E0DAD0] sticky top-14 lg:top-0 z-20">

        {/* Mobile search — above the scrollable row */}
        <div className="px-4 pt-3 pb-2 md:hidden">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7569]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Søg fagperson..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-9 pr-3 h-10 w-full text-sm border border-[#E0DAD0] rounded-xl bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] transition-colors"
            />
          </div>
        </div>

        {/* Filter chips — horizontal scroll on mobile, wrap on desktop */}
        <div className="overflow-x-auto scrollbar-none">
          <div className="px-4 md:px-8 pb-3 pt-2 md:pt-3 flex items-center gap-3 md:gap-4 min-w-max md:min-w-0 md:flex-wrap">

            {/* Search — desktop only */}
            <div className="relative hidden md:block shrink-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7569]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Søg fagperson..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9 pr-3 h-9 w-52 text-sm border border-[#E0DAD0] rounded-xl bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] transition-colors"
              />
            </div>

            {/* Min score */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Label>Min. score</Label>
              {[0, 40, 60, 80].map(v => (
                <button
                  key={v}
                  onClick={() => setFilters(f => ({ ...f, minScore: v }))}
                  className={[
                    'px-2.5 h-8 rounded-lg text-xs font-medium border transition-all whitespace-nowrap',
                    filters.minScore === v
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829] hover:text-[#1C3829]',
                  ].join(' ')}
                >
                  {v === 0 ? 'Alle' : `≥ ${v}`}
                </button>
              ))}
            </div>

            {/* Availability */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Label>Tilgængelighed</Label>
              {(['', 'AVAILABLE', 'PARTIALLY_AVAILABLE'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setFilters(f => ({ ...f, availability: v }))}
                  className={[
                    'px-2.5 h-8 rounded-lg text-xs font-medium border transition-all whitespace-nowrap',
                    filters.availability === v
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829] hover:text-[#1C3829]',
                  ].join(' ')}
                >
                  {v === '' ? 'Alle' : v === 'AVAILABLE' ? 'Tilgængelig' : 'Delvis'}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className="shrink-0 md:ml-auto text-sm text-[#6B7569] whitespace-nowrap">
              {filtered.length} af {candidates.length} kandidater
            </div>
          </div>
        </div>
      </div>

      {/* ── Candidates list ── */}
      <div className="px-4 md:px-8 py-4 md:py-6">
        {error && (
          <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C] flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title="Ingen kandidater matcher filtrene"
            description="Prøv at justere filtrene for at se flere resultater"
          />
        ) : (
          <div className="space-y-3 max-w-3xl">
            {filtered.map(candidate => (
              <MatchCard
                key={candidate.id}
                candidate={candidate}
                onSelect={handleSelect}
                isSelected={selected?.id === candidate.id}
                rank={candidate.rank}
              />
            ))}
          </div>
        )}
      </div>

      {/* Profile drawer */}
      <ProfessionalProfileDrawer
        candidate={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAssign={runStatus === 'SCORED' ? handleAssign : undefined}
        assignLoading={assigning}
        caseData={caseData}
      />

      {/* ── Assignment confirmation modal ── */}
      {confirmCandidate && (
        <>
          <div
            className="fixed inset-0 bg-[#1A1F1C]/60 z-[60]"
            onClick={() => setConfirmCandidate(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed z-[70] inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm bg-white rounded-2xl shadow-xl p-6"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EEF4F0] flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#1A1F1C] mb-1">Bekræft tildeling</h3>
            <p className="text-sm text-[#6B7569] mb-6 leading-relaxed">
              Er du sikker på, at du vil tildele{' '}
              <strong className="text-[#1A1F1C]">
                {confirmCandidate.professionals?.profiles?.full_name ?? 'denne fagperson'}
              </strong>{' '}
              til sagen? Handlingen registreres i systemet.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirmCandidate(null)}
              >
                Annuller
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={assigning}
                onClick={() => executeAssign(confirmCandidate)}
              >
                Tildel
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function SpinnerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
    </svg>
  )
}
