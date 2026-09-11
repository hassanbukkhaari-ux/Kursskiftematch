'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CompassMark } from '@/components/brand/compass'

export default function SetPasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabaseRef.current = supabase
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login')
      } else {
        setEmail(data.user.email ?? '')
        setChecking(false)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Adgangskoden skal være mindst 8 tegn')
      return
    }
    if (password !== confirmPassword) {
      setError('Adgangskoderne stemmer ikke overens')
      return
    }

    setLoading(true)
    const supabase = supabaseRef.current ?? createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE]">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="animate-spin text-[#1C3829]">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
          <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F3EE] px-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-[#E0DAD0] shadow-[0_4px_24px_rgba(28,56,41,0.08)] px-6 py-8 sm:px-8 sm:py-10">

        <div className="flex items-center gap-2.5 mb-8">
          <CompassMark size={32} />
          <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
        </div>

        <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] leading-tight mb-1">
          Vælg en adgangskode
        </h1>
        <p className="text-sm text-[#6B7569] mb-7">
          Du er inviteret som kontaktperson. Vælg en personlig adgangskode for at aktivere din konto.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#6B7569] bg-[#F6F3EE] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
              Adgangskode
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="new-password"
              placeholder="Mindst 8 tegn"
              className="w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
              Gentag adgangskode
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
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
                Aktiverer konto...
              </>
            ) : (
              'Aktiver konto'
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-[#6B7569]">Kursskiftematch · kursskifte.dk</p>
    </div>
  )
}
