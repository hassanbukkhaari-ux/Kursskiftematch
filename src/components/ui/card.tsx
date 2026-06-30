import { forwardRef } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, padding = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          'bg-white rounded-2xl border border-[#E0DAD0]',
          'shadow-[0_1px_3px_rgba(28,56,41,0.06),0_1px_2px_rgba(28,56,41,0.04)]',
          hover && 'transition-all duration-200 hover:shadow-[0_4px_12px_rgba(28,56,41,0.1)] hover:-translate-y-0.5 cursor-pointer',
          paddings[padding],
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-serif text-[#1A1F1C] font-semibold leading-tight ${className}`}>
      {children}
    </h3>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`border-t border-[#E0DAD0] ${className}`} />
}
