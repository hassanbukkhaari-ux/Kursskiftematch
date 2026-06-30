interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#EEF4F0] flex items-center justify-center mb-4 text-[#1C3829]">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg font-semibold text-[#1A1F1C] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#6B7569] max-w-xs mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}

export function LoadingState({ message = 'Indlæser...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-[#E0DAD0] border-t-[#1C3829] rounded-full animate-spin" />
      <p className="text-sm text-[#6B7569]">{message}</p>
    </div>
  )
}

export function ErrorState({ title = 'Noget gik galt', description, retry }: {
  title?: string
  description?: string
  retry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="font-serif text-lg font-semibold text-[#1A1F1C] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#6B7569] max-w-xs mb-4">{description}</p>}
      {retry && (
        <button
          onClick={retry}
          className="text-sm font-medium text-[#1C3829] hover:underline"
        >
          Prøv igen
        </button>
      )}
    </div>
  )
}
