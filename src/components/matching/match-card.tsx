'use client'

import { ProfessionalAvatar, ScoreChip } from './professional-avatar'
import { ScoreBreakdown } from './capacity-bar'
import { AvailabilityBadge, ProfessionLabel } from './availability-badge'
import { getScoreLabel } from './score-ring'

export interface MatchCandidate {
  id: string
  rank: number
  overall_score: number
  qualifications_score: number
  availability_score: number
  capacity_score: number
  complexity_fit_score: number
  scoring_explanation: string
  match_strengths?: string[]
  attention_points?: string[]
  professional_id: string
  professionals?: {
    id: string
    profession: string
    experience_years: number
    max_complexity_level: string
    target_age_groups: string[]
    qualifications: string[]
    capacity_hours_week: number
    max_concurrent_cases: number
    availability_status: string
    availability_days: string[]
    profiles?: {
      full_name: string
      email: string
    }
  }
}

interface MatchCardProps {
  candidate: MatchCandidate
  onSelect: (candidate: MatchCandidate) => void
  isSelected?: boolean
  rank?: number
}

export function MatchCard({ candidate, onSelect, isSelected, rank }: MatchCardProps) {
  const pro = candidate.professionals
  const profile = pro?.profiles
  const name = profile?.full_name ?? 'Ukendt fagperson'
  const score = candidate.overall_score

  return (
    <div
      onClick={() => onSelect(candidate)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(candidate) } }}
      aria-label={`Åbn profil for ${name}, score ${Math.round(score)}`}
      className={[
        'bg-white rounded-2xl border transition-all duration-200 cursor-pointer group',
        'shadow-[0_1px_3px_rgba(28,56,41,0.06)]',
        'hover:shadow-[0_6px_20px_rgba(28,56,41,0.10)] hover:-translate-y-0.5',
        'active:scale-[0.99] active:shadow-[0_2px_8px_rgba(28,56,41,0.08)]',
        isSelected
          ? 'border-[#1C3829] ring-1 ring-[#1C3829]/20'
          : 'border-[#E0DAD0]',
      ].join(' ')}
    >
      {/* Main row */}
      <div className="p-4 md:p-5 flex items-start gap-3 md:gap-4">
        {/* Rank badge */}
        {rank !== undefined && (
          <div className="shrink-0 w-6 h-6 rounded-full bg-[#F0EDE8] flex items-center justify-center text-xs font-semibold text-[#6B7569] mt-2">
            {rank}
          </div>
        )}

        {/* Avatar + score ring */}
        <div className="shrink-0">
          {/* Mobile: 60px · Desktop: 72px */}
          <div className="block md:hidden">
            <ProfessionalAvatar name={name} score={score} size={60} />
          </div>
          <div className="hidden md:block">
            <ProfessionalAvatar name={name} score={score} size={72} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-serif font-semibold text-[#1A1F1C] text-sm md:text-base leading-tight truncate">
                {name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <ProfessionLabel profession={pro?.profession ?? ''} />
                <span className="text-[#C8C0B0] text-xs hidden sm:inline">·</span>
                <span className="text-xs md:text-sm text-[#6B7569] hidden sm:inline">{pro?.experience_years ?? 0} år erfaring</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <ScoreChip score={score} />
              <span className="text-[10px] md:text-xs text-[#6B7569] hidden sm:block">{getScoreLabel(score)}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-2 md:gap-3 mt-2 flex-wrap">
            <AvailabilityBadge status={pro?.availability_status ?? 'UNAVAILABLE'} />
            <span className="text-xs text-[#6B7569] hidden sm:inline">
              {pro?.capacity_hours_week ?? 0} t/uge
            </span>
          </div>
        </div>

        {/* Chevron */}
        <div className="shrink-0 mt-2 text-[#C8C0B0] group-hover:text-[#1C3829] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Score breakdown — visible on sm+ */}
      <div className="hidden sm:block px-4 md:px-5 pb-4 pt-1 border-t border-[#F0EDE8]">
        <ScoreBreakdown
          qualifications_score={candidate.qualifications_score}
          availability_score={candidate.availability_score}
          capacity_score={candidate.capacity_score}
          complexity_fit_score={candidate.complexity_fit_score}
          overall_score={candidate.overall_score}
        />
      </div>

      {/* Mobile-only minimal score breakdown (single bar) */}
      <div className="sm:hidden px-4 pb-3 pt-1 border-t border-[#F0EDE8]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6B7569] shrink-0 w-20">Overall score</span>
          <div className="flex-1 h-1.5 rounded-full bg-[#E0DAD0] overflow-hidden">
            <div
              className="h-full rounded-full capacity-bar-fill"
              style={{
                width: `${score}%`,
                backgroundColor: score >= 60 ? '#15803D' : score >= 40 ? '#B45309' : '#B91C1C',
              }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums shrink-0"
            style={{ color: score >= 60 ? '#15803D' : score >= 40 ? '#B45309' : '#B91C1C' }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
    </div>
  )
}
