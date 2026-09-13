'use client'

export const PAGE_SIZE = 10

export function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 mt-5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="h-8 px-3 rounded-lg border border-[#E0DAD0] text-xs font-semibold text-[#1A1F1C] hover:bg-[#F6F3EE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Forrige
      </button>
      <span className="text-xs text-[#6B7569] tabular-nums">Side {page} af {totalPages}</span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="h-8 px-3 rounded-lg border border-[#E0DAD0] text-xs font-semibold text-[#1A1F1C] hover:bg-[#F6F3EE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Næste
      </button>
    </div>
  )
}

export function SearchInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7569] pointer-events-none"
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-3 h-9 w-full sm:w-64 text-sm border border-[#E0DAD0] rounded-xl bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors"
      />
    </div>
  )
}
