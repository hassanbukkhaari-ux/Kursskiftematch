interface CompassMarkProps {
  size?: number
  dark?: boolean
}

export function CompassMark({ size = 32, dark = false }: CompassMarkProps) {
  const stroke  = dark ? '#F6F3EE' : '#1C3829'
  const tailFill = dark ? '#F6F3EE' : '#1C3829'
  const pivot   = dark ? '#1C3829' : '#F6F3EE'

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* Outer ring */}
      <circle cx="20" cy="20" r="17" stroke={stroke} strokeWidth="1.4"/>

      {/* Cardinal ticks */}
      <line x1="20" y1="3"  x2="20" y2="5.6" stroke={stroke} strokeWidth="1.4"/>
      <line x1="37" y1="20" x2="34.4" y2="20" stroke={stroke} strokeWidth="1.4"/>
      <line x1="20" y1="37" x2="20" y2="34.4" stroke={stroke} strokeWidth="1.4"/>
      <line x1="3"  y1="20" x2="5.6" y2="20"  stroke={stroke} strokeWidth="1.4"/>

      {/* Needle — 35° off north: the course change */}
      <g transform="rotate(35, 20, 20)">
        <polygon points="20,7 22.4,20 17.6,20" fill="#C8993A"/>
        <polygon points="20,31 22.4,20 17.6,20" fill={tailFill} opacity="0.2"/>
      </g>

      {/* Pivot */}
      <circle cx="20" cy="20" r="1.4" fill={stroke}/>
    </svg>
  )
}
