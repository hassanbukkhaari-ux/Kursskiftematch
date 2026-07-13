'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { CompassMark } from '@/components/brand/compass'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const passwordUpdated = searchParams.get('message') === 'password_updated'
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setError('Din e-mail er ikke bekræftet endnu — tjek din indbakke for en bekræftelsesmail')
      } else {
        setError('Forkert e-mail eller adgangskode')
      }
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F3EE] px-4">
      {/* Card */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-[#E0DAD0] shadow-[0_4px_24px_rgba(28,56,41,0.08)] px-6 py-8 sm:px-8 sm:py-10">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <CompassMark size={32} />
          <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
        </div>

        {/* Heading */}
        <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] leading-tight mb-1">
          Log ind
        </h1>
        <p className="text-sm text-[#6B7569] mb-7">
          Kursskifte
        </p>

        {passwordUpdated && (
          <div className="flex items-center gap-2 p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-sm text-[#065F46] mb-5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Adgangskode opdateret. Log ind med din nye adgangskode.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569]">
                Adgangskode
              </label>
              <Link href="/forgot-password" className="text-xs text-[#6B7569] hover:text-[#1C3829] transition-colors">
                Glemt adgangskode?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
                Logger ind...
              </>
            ) : (
              'Log ind'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-[#6B7569]">
        Kursskiftematch · kursskifte.dk
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
