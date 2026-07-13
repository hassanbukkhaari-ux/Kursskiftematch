interface CompassMarkProps {
  size?: number
  dark?: boolean
}

export function CompassMark({ size = 32, dark = false }: CompassMarkProps) {
  const ringStroke = dark ? 'rgba(255,255,255,0.18)' : '#C8DDD1'
  const pivotFill = dark ? '#1C3829' : '#F6F3EE'
  const southFill = dark ? 'rgba(255,255,255,0.22)' : '#C8C0B0'

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke={ringStroke} strokeWidth="1.5" />
      <g className="compass-ring">
        <line x1="20" y1="3" x2="20" y2="8" stroke="#C8993A" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="20" x2="37" y2="20" stroke={ringStroke} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="32" x2="20" y2="37" stroke={ringStroke} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="3" y1="20" x2="8" y2="20" stroke={ringStroke} strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <g className="compass-needle">
        <polygon points="20,8 22.5,20 20,22 17.5,20" fill="#C8993A" />
        <polygon points="20,22 22.5,21 20,32 17.5,21" fill={southFill} />
      </g>
      <circle cx="20" cy="20" r="2.5" fill={pivotFill} stroke={ringStroke} strokeWidth="1" />
    </svg>
  )
}
