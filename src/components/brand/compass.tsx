interface CompassMarkProps {
  size?: number
  dark?: boolean
}

const ringStyle: React.CSSProperties = {
  animation: 'compass-spin 16s linear infinite',
  transformBox: 'fill-box',
  transformOrigin: 'center',
}

const needleStyle: React.CSSProperties = {
  animation: 'compass-wobble 5s ease-in-out infinite',
  transformBox: 'fill-box',
  transformOrigin: 'center',
}

export function CompassMark({ size = 32, dark = false }: CompassMarkProps) {
  const ringStroke = dark ? 'rgba(255,255,255,0.18)' : '#C8DDD1'
  const pivotFill = dark ? '#1C3829' : '#F6F3EE'
  const southFill = dark ? 'rgba(255,255,255,0.22)' : '#C8C0B0'

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke={ringStroke} strokeWidth="2" />

      <g style={ringStyle}>
        <line x1="20" y1="3" x2="20" y2="9" stroke="#C8993A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="31" y1="20" x2="37" y2="20" stroke={ringStroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="31" x2="20" y2="37" stroke={ringStroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="3" y1="20" x2="9" y2="20" stroke={ringStroke} strokeWidth="2" strokeLinecap="round" />
      </g>

      <g style={needleStyle}>
        <polygon points="20,7 23,20 20,23 17,20" fill="#C8993A" />
        <polygon points="20,23 23,21 20,33 17,21" fill={southFill} />
      </g>

      <circle cx="20" cy="20" r="3" fill={pivotFill} stroke={ringStroke} strokeWidth="1.5" />
    </svg>
  )
}
