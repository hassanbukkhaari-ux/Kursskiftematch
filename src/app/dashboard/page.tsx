import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer, StatCard, SectionHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function DashboardPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  // Layout handles auth + role redirect — user is guaranteed professional here
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  const userId = user!.id

  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  const mondayStr = monday.toISOString().slice(0, 10)
  const sundayStr = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { createServiceClient } = await import('@/lib/supabase/server')
  const svc = createServiceClient() as any

  const [casesRes, logsRes, proRes, weeklyHoursRes, pendingReportsRes] = await Promise.all([
    db.from('v_cases_with_professional')
      .select('id, citizen_initials, status, weekly_hours', { count: 'exact' })
      .eq('professional_id', userId)
      .neq('status', 'ARCHIVED')
      .limit(3),
    db.from('session_logs')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', userId),
    db.from('professionals')
      .select('status')
      .eq('id', userId)
      .single(),
    db.from('registered_hours')
      .select('hours')
      .eq('professional_id', userId)
      .gte('work_date', mondayStr)
      .lte('work_date', sundayStr)
      .neq('status', 'REJECTED')
      .is('archived_at', null),
    svc.from('status_report_requests')
      .select('id, report_type, deadline, status, cases!inner(citizen_initials)')
      .eq('professional_id', userId)
      .in('status', ['PENDING', 'ACKNOWLEDGED'])
      .order('deadline', { ascending: true })
      .limit(5),
  ])

  const activeCases = casesRes.data ?? []
  const totalCases = casesRes.count ?? 0
  const totalLogs = logsRes.count ?? 0
  const weeklyHours = (weeklyHoursRes.data ?? []).reduce((sum, r) => sum + (r.hours ?? 0), 0)
  const pendingReports = pendingReportsRes.data ?? []
  const today = new Date().toISOString().slice(0, 10)

  const REPORT_TYPE_SHORT: Record<string, string> = {
    MONTHLY: 'Månedlig',
    EXTENDED: 'Udvidet',
    FINAL: 'Afsluttende',
  }

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
    <div>
        <PageHeader
          label="Mit overblik"
          title={`Hej, ${profile?.full_name?.split(' ')[0] ?? 'konsulent'}`}
          subtitle="Kursskifte — din platform"
        />
        <ContentContainer>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Aktive sager" value={totalCases} color="brand" />
            <StatCard label="Sessionslogs" value={totalLogs} color="green" />
            <StatCard label="Timer denne uge" value={weeklyHours > 0 ? `${weeklyHours} t` : '0 t'} color="gold" />
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

          {/* Pending status reports alert */}
          {pendingReports.length > 0 && (
            <div className="mb-10">
              <SectionHeader title="Afventende statusrapporter" />
              <div className="space-y-2">
                {pendingReports.map((r: any) => {
                  const overdue = r.deadline < today
                  return (
                    <Link key={r.id} href={`/dashboard/status-reports/${r.id}`}>
                      <Card hover className={overdue ? 'border-red-200 bg-[#FEF2F2]' : 'border-amber-200 bg-[#FFFBF0]'}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${overdue ? 'bg-red-100' : 'bg-amber-100'}`}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={overdue ? '#B91C1C' : '#92660A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-[#1A1F1C]">
                                {REPORT_TYPE_SHORT[r.report_type] ?? r.report_type} — Borger {r.cases?.citizen_initials}
                              </div>
                              <div className={`text-xs mt-0.5 ${overdue ? 'text-red-600 font-medium' : 'text-[#92660A]'}`}>
                                {overdue ? 'Forfalden — ' : 'Frist '}
                                {new Date(r.deadline).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </Card>
                    </Link>
                  )
                })}
                {pendingReports.length === 5 && (
                  <Link href="/dashboard/status-reports" className="block text-center text-xs text-[#1C3829] font-medium py-2 hover:underline">
                    Se alle statusrapporter →
                  </Link>
                )}
              </div>
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
  )
}
