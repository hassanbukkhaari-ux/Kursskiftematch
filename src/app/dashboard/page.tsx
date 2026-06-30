import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { PageHeader, ContentContainer, StatCard, SectionHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function DashboardPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  if (profile?.role === 'admin') redirect('/admin')

  const [casesRes, logsRes, proRes] = await Promise.all([
    db.from('v_cases_with_professional')
      .select('id, citizen_initials, status, weekly_hours', { count: 'exact' })
      .eq('professional_id', user.id)
      .neq('status', 'ARCHIVED')
      .limit(3),
    db.from('session_logs')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', user.id),
    db.from('professionals')
      .select('status')
      .eq('id', user.id)
      .single(),
  ])

  const activeCases = casesRes.data ?? []
  const totalCases = casesRes.count ?? 0
  const totalLogs = logsRes.count ?? 0

  const proStatusRaw = (proRes.data?.status as string | undefined) ?? 'ACTIVE'
  const proStatusLabel: Record<string, string> = {
    REGISTERED: 'Registreret', ACTIVE: 'Aktiv', INACTIVE: 'Inaktiv', ARCHIVED: 'Arkiveret',
  }
  const proStatusColor: Record<string, 'green' | 'amber' | 'red' | 'brand'> = {
    REGISTERED: 'amber', ACTIVE: 'green', INACTIVE: 'red', ARCHIVED: 'brand',
  }
  const proStatusDisplay = proStatusLabel[proStatusRaw] ?? proStatusRaw
  const proStatusColorValue = proStatusColor[proStatusRaw] ?? 'green'

  return (
    <DashboardShell userName={profile?.full_name} role="professional">
      <div>
        <PageHeader
          label="Mit overblik"
          title={`Hej, ${profile?.full_name?.split(' ')[0] ?? 'konsulent'}`}
          subtitle="Kursskifte Match — din platform"
        />
        <ContentContainer>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Aktive sager" value={totalCases} color="brand" />
            <StatCard label="Sessionslogs" value={totalLogs} color="green" />
            <StatCard label="Timer denne uge" value="—" color="gold" sublabel="ikke implementeret endnu" />
            <StatCard label="Konsulentstatus" value={proStatusDisplay} color={proStatusColorValue} />
          </div>

          {/* Recent cases */}
          <SectionHeader title="Mine sager" />
          {activeCases.length === 0 ? (
            <Card className="text-center py-12 text-[#6B7569] text-sm">
              Ingen aktive sager tildelt endnu
            </Card>
          ) : (
            <div className="space-y-3">
              {activeCases.map(c => (
                <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                  <Card hover className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FBF3E1] flex items-center justify-center">
                        <span className="text-sm font-bold text-[#92660A]">
                          {(c.citizen_initials as string | undefined) ?? 'XX'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-[#1A1F1C] text-sm">Borger {c.citizen_initials}</div>
                        <div className="text-xs text-[#6B7569]">{c.weekly_hours} t/uge</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="green" dot>Aktiv</Badge>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Quick links */}
          <SectionHeader title="Genveje" className="mt-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/cases">
              <Card hover className="h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829] shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-[#1A1F1C]">Mine sager</h3>
                    <p className="text-sm text-[#6B7569] mt-0.5">Se og opdater dine sager</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/session-logs">
              <Card hover className="h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829] shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-[#1A1F1C]">Sessionsdokumentation</h3>
                    <p className="text-sm text-[#6B7569] mt-0.5">Log sessioner og noter</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/hours">
              <Card hover className="h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829] shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-[#1A1F1C]">Timeregistrering</h3>
                    <p className="text-sm text-[#6B7569] mt-0.5">Registrer dine arbejdstimer</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </ContentContainer>
      </div>
    </DashboardShell>
  )
}
