'use client'

interface CapacityBarProps {
  label: string
  score: number
  max?: number
  color?: string
  showValue?: boolean
}

export function CapacityBar({ label, score, max = 100, color, showValue = false }: CapacityBarProps) {
  const pct = Math.min(Math.max((score / max) * 100, 0), 100)
  const barColor = color ?? (pct >= 60 ? '#15803D' : pct >= 40 ? '#B45309' : '#B91C1C')
  const bgColor = pct >= 60 ? '#DCFCE7' : pct >= 40 ? '#FEF3C7' : '#FEE2E2'

  return (
    <div className="flex items-center gap-2.5">
      <div className="text-xs text-[#6B7569] w-[110px] shrink-0 truncate">{label}</div>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: bgColor }}>
        <div
          className="h-full rounded-full capacity-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      {showValue && (
        <div className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color: barColor }}>
          {Math.round(score)}
        </div>
      )}
    </div>
  )
}

interface ScoreBreakdownProps {
  qualifications_score: number
  availability_score: number
  capacity_score: number
  complexity_fit_score: number
  overall_score: number
}

export function ScoreBreakdown(scores: ScoreBreakdownProps) {
  const dimensions = [
    { label: 'Kvalifikationer', score: scores.qualifications_score },
    { label: 'Tilgængelighed', score: scores.availability_score },
    { label: 'Kapacitet', score: scores.capacity_score },
    { label: 'Kompleksitet', score: scores.complexity_fit_score },
  ]

  return (
    <div className="space-y-2">
      {dimensions.map(d => (
        <CapacityBar key={d.label} label={d.label} score={d.score} showValue />
      ))}
    </div>
  )
}
