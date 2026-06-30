'use client'

import { useEffect, useCallback } from 'react'
import { ProfessionalAvatar } from './professional-avatar'
import { ScoreRing, getScoreLabel, getScoreColor } from './score-ring'
import { ScoreBreakdown } from './capacity-bar'
import { AvailabilityBadge, ProfessionLabel } from './availability-badge'
import { Badge, Label } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MatchCandidate } from './match-card'

export interface CaseRequirements {
  complexity_level: string
  weekly_hours: number
  citizen_age_range: string
}

interface ProfessionalProfileDrawerProps {
  candidate: MatchCandidate | null
  open: boolean
  onClose: () => void
  onAssign?: (candidate: MatchCandidate) => void
  assignLoading?: boolean
  caseData?: CaseRequirements
}

const complexityLabels: Record<string, string> = {
  LOW: 'Lav',
  MEDIUM: 'Mellem',
  HIGH: 'Høj',
  CRITICAL: 'Kritisk',
}

const complexityOrder: Record<string, number> = {
  LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
}

const ageGroupLabels: Record<string, string> = {
  '0-5': '0–5 år',
  '6-12': '6–12 år',
  '13-18': '13–18 år',
  '18+': '18+ år',
}

function generateStrengths(c: MatchCandidate): string[] {
  const s: string[] = []
  if (c.qualifications_score >= 70) s.push('Stærk faglig profil og kvalifikationer')
  if (c.availability_score >= 70) s.push('God tilgængelighed og fleksibilitet')
  if (c.capacity_score >= 70) s.push('Tilstrækkelig kapacitet til sagen')
  if (c.complexity_fit_score >= 70) s.push('Erfaringen matcher sagens kompleksitetsniveau')
  return s
}

function generateAttentionPoints(c: MatchCandidate): string[] {
  const p: string[] = []
  if (c.qualifications_score < 50) p.push('Faglige kvalifikationer bør verificeres nærmere')
  if (c.availability_score < 50) p.push('Begrænset tilgængelighed — afklar kapacitet inden tildeling')
  if (c.capacity_score < 50) p.push('Kapaciteten er tæt på grænsen')
  if (c.complexity_fit_score < 50) p.push('Sagens kompleksitetsniveau overskrider normalerfaring')
  return p
}

export function ProfessionalProfileDrawer({
  candidate,
  open,
  onClose,
  onAssign,
  assignLoading,
  caseData,
}: ProfessionalProfileDrawerProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open && !candidate) return null

  const pro = candidate?.professionals
  const profile = pro?.profiles
  const name = profile?.full_name ?? 'Ukendt fagperson'
  const score = candidate?.overall_score ?? 0
  const scoreColor = getScoreColor(score)

  const strengths = (candidate?.match_strengths && candidate.match_strengths.length > 0)
    ? candidate.match_strengths
    : candidate ? generateStrengths(candidate) : []

  const attentionPoints = (candidate?.attention_points && candidate.attention_points.length > 0)
    ? candidate.attention_points
    : candidate ? generateAttentionPoints(candidate) : []

  const proComplexOrder = complexityOrder[pro?.max_complexity_level ?? 'LOW'] ?? 0
  const caseComplexOrder = complexityOrder[caseData?.complexity_level ?? 'LOW'] ?? 0
  const complexityMatch = proComplexOrder >= caseComplexOrder
  const hoursMatch = (pro?.capacity_hours_week ?? 0) >= (caseData?.weekly_hours ?? 0)
  const ageMatch = !pro?.target_age_groups?.length ||
    (pro.target_age_groups.includes(caseData?.citizen_age_range ?? '') ||
     pro.target_age_groups.some(g => g === '18+' && (caseData?.citizen_age_range ?? '').startsWith('18')))

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/40 z-40 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Profil: ${name}`}
        className={[
          'fixed top-0 right-0 h-full bg-white z-50 flex flex-col',
          'w-full sm:max-w-[420px] md:max-w-[480px]',
          'shadow-[-4px_0_40px_rgba(28,56,41,0.15)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* ── Header ── */}
        <div className="relative bg-[#1C3829] px-5 pt-5 pb-6 md:px-6 md:pt-6 md:pb-7 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all"
            aria-label="Luk"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-4 pr-8">
            <div className="relative shrink-0 hidden sm:block" style={{ width: 88, height: 88 }}>
              <ScoreRing score={score} size={88} />
              <div
                className="absolute rounded-full flex items-center justify-center font-bold text-white text-xl"
                style={{ inset: 10.5, backgroundColor: '#2D5840' }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="relative shrink-0 sm:hidden" style={{ width: 68, height: 68 }}>
              <ScoreRing score={score} size={68} />
              <div
                className="absolute rounded-full flex items-center justify-center font-bold text-white text-base"
                style={{ inset: 8, backgroundColor: '#2D5840' }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="text-white min-w-0 flex-1">
              <h2 className="font-serif text-lg md:text-xl font-semibold leading-tight">{name}</h2>
              <div className="text-white/70 text-sm mt-0.5">
                <ProfessionLabel profession={pro?.profession ?? ''} />
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold"
                  style={{ color: scoreColor, backgroundColor: 'rgba(255,255,255,0.12)' }}
                >
                  <span className="text-white text-xs opacity-70">Score</span>
                  <span>{Math.round(score)}</span>
                </span>
                <span className="text-white/60 text-xs">{getScoreLabel(score)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Match-analyse */}
          <section className="px-5 py-4 md:px-6 md:py-5 border-b border-[#E0DAD0]">
            <Label className="block mb-4">Match-analyse</Label>
            {candidate && (
              <ScoreBreakdown
                qualifications_score={candidate.qualifications_score}
                availability_score={candidate.availability_score}
                capacity_score={candidate.capacity_score}
                complexity_fit_score={candidate.complexity_fit_score}
                overall_score={candidate.overall_score}
              />
            )}
            {candidate?.scoring_explanation && (
              <p className="mt-4 text-sm text-[#6B7569] leading-relaxed bg-[#F6F3EE] rounded-xl p-3 border border-[#E0DAD0]">
                {candidate.scoring_explanation}
              </p>
            )}
          </section>

          {/* Sagskrav vs. fagperson — only shown when caseData is available */}
          {caseData && candidate && (
            <section className="px-5 py-4 md:px-6 md:py-5 border-b border-[#E0DAD0]">
              <Label className="block mb-4">Sagskrav vs. fagpersonprofil</Label>
              <div className="space-y-3">
                <RequirementRow
                  label="Kompleksitet"
                  required={complexityLabels[caseData.complexity_level] ?? caseData.complexity_level}
                  actual={complexityLabels[pro?.max_complexity_level ?? 'LOW'] ?? (pro?.max_complexity_level ?? '—')}
                  match={complexityMatch}
                />
                <RequirementRow
                  label="Timer / uge"
                  required={`${caseData.weekly_hours} t/uge`}
                  actual={`${pro?.capacity_hours_week ?? 0} t/uge`}
                  match={hoursMatch}
                />
                <RequirementRow
                  label="Aldersgruppe"
                  required={ageGroupLabels[caseData.citizen_age_range] ?? caseData.citizen_age_range}
                  actual={pro?.target_age_groups?.map(g => ageGroupLabels[g] ?? g).join(', ') ?? '—'}
                  match={ageMatch}
                />
              </div>
            </section>
          )}

          {/* Styrker */}
          {strengths.length > 0 && (
            <section className="px-5 py-4 md:px-6 md:py-5 border-b border-[#E0DAD0]">
              <Label className="block mb-3">Styrker ved denne match</Label>
              <div className="space-y-2.5">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-sm text-[#1A1F1C] leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Opmærksomhedspunkter */}
          {attentionPoints.length > 0 && (
            <section className="px-5 py-4 md:px-6 md:py-5 border-b border-[#E0DAD0]">
              <Label className="block mb-3">Opmærksomhedspunkter</Label>
              <div className="space-y-2.5">
                {attentionPoints.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M6 4v3M6 9h.01" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-sm text-[#1A1F1C] leading-relaxed">{a}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Profil-detaljer */}
          <section className="px-5 py-4 md:px-6 md:py-5 border-b border-[#E0DAD0]">
            <Label className="block mb-4">Fagpersonprofil</Label>
            <div className="space-y-4">
              <DetailRow label="Tilgængelighed">
                <AvailabilityBadge status={pro?.availability_status ?? 'UNAVAILABLE'} />
              </DetailRow>
              <DetailRow label="Kapacitet">
                <span className="text-sm text-[#1A1F1C]">{pro?.capacity_hours_week ?? 0} timer/uge</span>
              </DetailRow>
              <DetailRow label="Max. samtidige sager">
                <span className="text-sm text-[#1A1F1C]">{pro?.max_concurrent_cases ?? 0}</span>
              </DetailRow>
              <DetailRow label="Erfaring">
                <span className="text-sm text-[#1A1F1C]">{pro?.experience_years ?? 0} år</span>
              </DetailRow>
              <DetailRow label="Maks. kompleksitet">
                <Badge variant="brand">
                  {complexityLabels[pro?.max_complexity_level ?? 'LOW'] ?? pro?.max_complexity_level}
                </Badge>
              </DetailRow>
              {pro?.target_age_groups && pro.target_age_groups.length > 0 && (
                <DetailRow label="Aldersgrupper">
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {pro.target_age_groups.map(g => (
                      <Badge key={g} variant="muted">{ageGroupLabels[g] ?? g}</Badge>
                    ))}
                  </div>
                </DetailRow>
              )}
              {pro?.qualifications && pro.qualifications.length > 0 && (
                <DetailRow label="Kvalifikationer">
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {pro.qualifications.map(q => (
                      <Badge key={q} variant="gold">{q}</Badge>
                    ))}
                  </div>
                </DetailRow>
              )}
              {profile?.email && (
                <DetailRow label="E-mail">
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-sm text-[#1C3829] hover:underline break-all"
                  >
                    {profile.email}
                  </a>
                </DetailRow>
              )}
            </div>
          </section>
        </div>

        {/* ── Footer CTA ── */}
        {onAssign && candidate && (
          <div className="px-5 py-4 md:px-6 border-t border-[#E0DAD0] bg-[#F6F3EE] shrink-0">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              loading={assignLoading}
              onClick={() => onAssign(candidate)}
            >
              Tildel fagperson
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-medium text-[#6B7569] pt-0.5 shrink-0">{label}</span>
      <div className="text-right flex-1 min-w-0">{children}</div>
    </div>
  )
}

function RequirementRow({
  label,
  required,
  actual,
  match,
}: {
  label: string
  required: string
  actual: string
  match: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={[
        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        match ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]',
      ].join(' ')}>
        {match ? (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[#6B7569] mb-0.5">{label}</div>
        <div className="text-sm flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[#6B7569]">Krævet: <span className="font-medium text-[#1A1F1C]">{required}</span></span>
          <span className="text-[#C8C0B0]">·</span>
          <span className="text-[#6B7569]">Har: <span className="font-medium text-[#1A1F1C]">{actual}</span></span>
        </div>
      </div>
    </div>
  )
}
