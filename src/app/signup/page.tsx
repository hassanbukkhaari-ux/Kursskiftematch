'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CompassMark } from '@/components/brand/compass'

function SignupForm() {
  const searchParams = useSearchParams()
  const prefillEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(prefillEmail)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || undefined },
      },
    })

    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already registered')) {
        setError('Der findes allerede en konto med denne e-mail — prøv at logge ind')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    // If session is returned immediately (email confirmation disabled), go to dashboard
    if (data.session) {
      router.push('/dashboard')
      return
    }

    // Otherwise, confirmation email was sent
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F3EE] px-4">
        <div className="w-full max-w-[400px] bg-white rounded-2xl border border-[#E0DAD0] shadow-[0_4px_24px_rgba(28,56,41,0.08)] px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center gap-2.5 mb-8">
            <CompassMark size={32} />
            <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
          </div>

          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#ECFDF5] mb-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] mb-2">Tjek din indbakke</h1>
          <p className="text-sm text-[#6B7569] leading-relaxed mb-6">
            Vi har sendt en bekræftelsesmail til <strong className="text-[#1A1F1C]">{email}</strong>.
            Klik på linket i mailen for at aktivere din konto.
          </p>
          <p className="text-xs text-[#6B7569]">
            Har du allerede en konto?{' '}
            <Link href="/login" className="text-[#1C3829] font-medium hover:underline">
              Log ind her
            </Link>
          </p>
        </div>
        <p className="mt-6 text-xs text-[#6B7569]">Kursskiftematch · kursskifte.dk</p>
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
          Opret konto
        </h1>
        <p className="text-sm text-[#6B7569] mb-7">
          Kontaktperson · Kursskifte
        </p>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
              Fulde navn
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="Fornavn Efternavn"
              className="w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors"
            />
          </div>

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
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
              Adgangskode
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
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
                Opretter konto...
              </>
            ) : (
              'Opret konto'
            )}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-[#6B7569]">
          Har du allerede en konto?{' '}
          <Link href="/login" className="text-[#1C3829] font-medium hover:underline">
            Log ind
          </Link>
        </p>
      </div>

      <p className="mt-6 text-xs text-[#6B7569]">Kursskiftematch · kursskifte.dk</p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
