import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'invite' | 'magiclink' | null
  const next = searchParams.get('next') ?? '/set-password'

  const supabase = await createClient()

  // PKCE flow — code is in the query string
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const dest = type === 'recovery' ? '/reset-password' : next
      return NextResponse.redirect(new URL(dest, origin))
    }
  }

  // Email OTP / token_hash flow — password reset, magic link
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      const dest = type === 'recovery' ? '/reset-password' : next
      return NextResponse.redirect(new URL(dest, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))
}
