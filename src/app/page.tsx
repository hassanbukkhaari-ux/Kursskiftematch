import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'admin') redirect('/admin')
  redirect('/dashboard')
}
