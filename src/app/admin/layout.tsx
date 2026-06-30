// TODO: Re-enable authentication before production
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell userName="Hassan Bukkhaari" role="admin">
      {children}
    </DashboardShell>
  )
}
