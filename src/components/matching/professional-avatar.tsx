import { ScoreRing, getScoreColor } from './score-ring'

interface ProfessionalAvatarProps {
  name: string
  score: number
  size?: number
  showScore?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const avatarHues = [
  '#1C3829', '#2D5840', '#264D38', '#1E4433', '#234030',
]

function getAvatarBg(name: string): string {
  const index = name.charCodeAt(0) % avatarHues.length
  return avatarHues[index]
}

export function ProfessionalAvatar({ name, score, size = 80, showScore = true }: ProfessionalAvatarProps) {
  const initials = getInitials(name)
  const bg = getAvatarBg(name)
  const ringPad = size * 0.12
  const innerSize = size - ringPad * 2

  if (!showScore) {
    return (
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: bg,
          fontSize: size * 0.3,
        }}
      >
        {initials}
      </div>
    )
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Score ring underneath */}
      <div className="absolute inset-0">
        <ScoreRing score={score} size={size} />
      </div>
      {/* Avatar inner circle */}
      <div
        className="absolute rounded-full flex items-center justify-center font-semibold text-white"
        style={{
          inset: ringPad,
          backgroundColor: bg,
          fontSize: innerSize * 0.35,
        }}
      >
        {initials}
      </div>
    </div>
  )
}

export function ScoreChip({ score }: { score: number }) {
  const color = getScoreColor(score)
  const bg = score >= 60 ? '#DCFCE7' : score >= 40 ? '#FEF3C7' : '#FEE2E2'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ color, backgroundColor: bg }}
    >
      {Math.round(score)}
      <span className="font-normal opacity-70">/ 100</span>
    </span>
  )
}
