import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await db
    .from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as Profile | null
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <DashboardShell userName={profile?.full_name} role="admin">
      {children}
    </DashboardShell>
  )
}
