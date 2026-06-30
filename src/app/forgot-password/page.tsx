'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    setLoading(false)
    if (error) {
      setError('Noget gik galt. Prøv igen eller kontakt support.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F3EE] px-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-[#E0DAD0] shadow-[0_4px_24px_rgba(28,56,41,0.08)] px-6 py-8 sm:px-8 sm:py-10">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-[#C8993A] flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 13L8 3L13 13" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 9.5h6" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mt-0.5">Match</div>
          </div>
        </div>

        {sent ? (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#ECFDF5] mb-5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] leading-tight mb-2">
              E-mail sendt
            </h1>
            <p className="text-sm text-[#6B7569] mb-7">
              Vi har sendt et link til <span className="font-medium text-[#1A1F1C]">{email}</span>. Klik på linket i e-mailen for at nulstille din adgangskode.
            </p>
            <p className="text-xs text-[#6B7569]">
              Modtog du ikke e-mailen?{' '}
              <button
                onClick={() => setSent(false)}
                className="text-[#1C3829] font-semibold hover:underline"
              >
                Prøv igen
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] leading-tight mb-1">
              Glemt adgangskode?
            </h1>
            <p className="text-sm text-[#6B7569] mb-7">
              Indtast din e-mail, og vi sender dig et link til at nulstille din adgangskode.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="navn@organisation.dk"
                  className="w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#1C3829] text-[#F6F3EE] rounded-xl text-sm font-semibold hover:bg-[#2D5840] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="animate-spin">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Sender...
                  </>
                ) : (
                  'Send nulstillingslink'
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-[#6B7569] hover:text-[#1C3829] transition-colors">
            ← Tilbage til log ind
          </Link>
        </div>
      </div>

      <p className="mt-6 text-xs text-[#6B7569]">
        Kursskiftematch · kursskifte.dk
      </p>
    </div>
  )
}
