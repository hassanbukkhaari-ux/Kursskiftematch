import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role !== 'professional') redirect('/login')

  return (
    <DashboardShell userName={profile?.full_name} role="professional">
      {children}
    </DashboardShell>
  )
}
