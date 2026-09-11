'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function handleCallback() {
      // PKCE flow: ?code= in URL query params
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      const next = searchParams.get('next') ?? '/set-password'

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace(next)
          return
        }
      }

      // Implicit / token-hash flow: #access_token= in URL fragment
      const hash = window.location.hash.substring(1)
      if (hash) {
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            router.replace('/set-password')
            return
          }
        }
      }

      // Already authenticated (e.g. page reload)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/set-password')
        return
      }

      router.replace('/login?error=auth_callback_failed')
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE]">
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="animate-spin text-[#1C3829]">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
        <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
