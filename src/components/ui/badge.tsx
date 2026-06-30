type BadgeVariant = 'default' | 'green' | 'amber' | 'red' | 'brand' | 'gold' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[#EDE9E1] text-[#1A1F1C]',
  green: 'bg-[#DCFCE7] text-[#15803D]',
  amber: 'bg-[#FEF3C7] text-[#B45309]',
  red: 'bg-[#FEE2E2] text-[#B91C1C]',
  brand: 'bg-[#EEF4F0] text-[#1C3829]',
  gold: 'bg-[#FBF3E1] text-[#92660A]',
  muted: 'bg-[#F0EDE8] text-[#6B7569]',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#6B7569]',
  green: 'bg-[#15803D]',
  amber: 'bg-[#B45309]',
  red: 'bg-[#B91C1C]',
  brand: 'bg-[#1C3829]',
  gold: 'bg-[#C8993A]',
  muted: 'bg-[#6B7569]',
}

export function Badge({ children, variant = 'default', className = '', dot }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
        'text-xs font-medium tracking-wide',
        variants[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  )
}

export function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] ${className}`}>
      {children}
    </span>
  )
}
