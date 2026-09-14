export function SecureMailBadge({ light }: { light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold ${light ? 'text-white/50' : 'text-[#6B7569]'}`}
      title="Vores mailserver kræver krypteret (TLS) forbindelse ved afsendelse og modtagelse"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Sikker mail
    </span>
  )
}
