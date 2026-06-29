'use client'

import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-[#1C3829] text-[#F6F3EE] hover:bg-[#2D5840] border-transparent',
  secondary: 'bg-white text-[#1C3829] border-[#E0DAD0] hover:bg-[#EEF4F0] hover:border-[#2D5840]',
  ghost: 'bg-transparent text-[#6B7569] border-transparent hover:bg-[#EEF4F0] hover:text-[#1C3829]',
  danger: 'bg-[#B91C1C] text-white border-transparent hover:bg-[#991B1B]',
  gold: 'bg-[#C8993A] text-white border-transparent hover:bg-[#B8891A]',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center font-medium border transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'sm' ? 12 : 14} />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

function Spinner({ size }: { size: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 16 16"
      fill="none"
      className="animate-spin"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
