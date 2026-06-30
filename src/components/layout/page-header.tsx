import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  label?: string
  actions?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

export function PageHeader({ title, subtitle, label, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-[#E0DAD0] px-4 py-4 md:px-8 md:py-5">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-none whitespace-nowrap" aria-label="Brødkrummer">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <span className="text-[#C8C0B0] text-xs">/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-xs text-[#6B7569] hover:text-[#1C3829] transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-xs text-[#1A1F1C] font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {label && (
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-1">
              {label}
            </div>
          )}
          <h1 className="font-serif text-xl md:text-2xl font-semibold text-[#1A1F1C] leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[#6B7569] mt-1 hidden sm:block">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 mt-0.5">{actions}</div>
        )}
      </div>
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  actions,
  className = '',
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-5 ${className}`}>
      <div className="min-w-0">
        <h2 className="font-serif text-lg font-semibold text-[#1A1F1C]">{title}</h2>
        {description && <p className="text-sm text-[#6B7569] mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function ContentContainer({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8 ${className}`}>
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sublabel,
  color = 'brand',
  href,
}: {
  label: string
  value: string | number
  sublabel?: string
  color?: 'brand' | 'gold' | 'green' | 'amber' | 'red'
  href?: string
}) {
  const colors = {
    brand: 'text-[#1C3829]',
    gold: 'text-[#C8993A]',
    green: 'text-[#15803D]',
    amber: 'text-[#B45309]',
    red: 'text-[#B91C1C]',
  }
  const content = (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2 leading-tight">{label}</div>
      <div className={`font-serif text-2xl md:text-3xl font-bold leading-none ${colors[color]}`}>{value}</div>
      {sublabel && <div className="text-xs text-[#6B7569] mt-1.5">{sublabel}</div>}
    </>
  )
  if (href) {
    return (
      <Link
        href={href}
        className="block bg-white rounded-2xl border border-[#E0DAD0] p-4 md:p-5 shadow-[0_1px_3px_rgba(28,56,41,0.05)] hover:shadow-[0_4px_16px_rgba(28,56,41,0.10)] hover:-translate-y-0.5 transition-all duration-150"
      >
        {content}
      </Link>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-[#E0DAD0] p-4 md:p-5 shadow-[0_1px_3px_rgba(28,56,41,0.05)]">
      {content}
    </div>
  )
}
