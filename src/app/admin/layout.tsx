import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/login')

  // Admin notifications mostly go to SYSTEM_ADMIN_EMAIL rather than a
  // specific recipient_profile_id, so "unread" isn't a meaningful metric
  // here — PENDING/FAILED count instead, since those are the ones that
  // actually need an admin to look and possibly retry a delivery.
  const { count: actionableNotificationCount } = await supabase
    .from('notification_log')
    .select('id', { count: 'exact', head: true })
    .in('status', ['PENDING', 'FAILED'])

  return (
    <DashboardShell
      userName={profile?.full_name}
      role="admin"
      unreadNotificationCount={actionableNotificationCount ?? 0}
    >
      {children}
    </DashboardShell>
  )
}
