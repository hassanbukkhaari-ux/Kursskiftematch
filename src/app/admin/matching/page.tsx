import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { PageHeader, ContentContainer, StatCard } from '@/components/layout/page-header'
import { SectionHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const complexityColor: Record<string, 'green' | 'amber' | 'red' | 'default'> = {
  LOW: 'green',
  MEDIUM: 'amber',
  HIGH: 'red',
  CRITICAL: 'red',
}
const complexityLabel: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}
const statusLabel: Record<string, string> = {
  OPEN: 'Åben', MATCHED: 'Matchet', ACTIVE: 'Aktiv', COMPLETED: 'Afsluttet', ARCHIVED: 'Arkiveret',
}
const statusColor: Record<string, 'default' | 'green' | 'amber' | 'brand'> = {
  OPEN: 'amber', MATCHED: 'brand', ACTIVE: 'green', COMPLETED: 'default', ARCHIVED: 'default',
}

export default async function AdminMatchingPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await db
    .from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as Profile | null
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [casesRes, runsRes] = await Promise.all([
    db.from('v_cases_with_professional')
      .select('*')
      .in('status', ['OPEN', 'MATCHED'])
      .order('id', { ascending: false })
      .limit(20),
    db.from('match_runs')
      .select('*, cases(citizen_initials, citizen_age_range)')
      .in('status', ['INITIATED', 'SCORED'])
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const cases = casesRes.data ?? []
  const activeRuns = (runsRes.data ?? []) as unknown as Array<{
    id: string
    case_id: string
    status: string
    algorithm_version: string
    cases?: { citizen_initials: string; citizen_age_range: string } | null
  }>

  return (
    <div>
      <PageHeader
        label="Matching"
        title="Match-administration"
        subtitle="Tildel fagpersoner til sager baseret på algoritme-scoren"
        breadcrumb={[{ label: 'Administration', href: '/admin' }, { label: 'Matching' }]}
      />
      <ContentContainer>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Åbne sager" value={cases.filter(c => c.status === 'OPEN').length} color="amber" />
          <StatCard label="Afventende match" value={activeRuns.length} color="brand" />
          <StatCard label="Matchede sager" value={cases.filter(c => c.status === 'MATCHED').length} color="gold" />
          <StatCard label="Sager klar til tildeling" value={activeRuns.filter(r => r.status === 'SCORED').length} color="green" />
        </div>

        {/* Active match runs */}
        {activeRuns.length > 0 && (
          <div className="mb-8">
            <SectionHeader
              title="Igangværende match-kørsler"
              description="Algoritmen har scoret kandidater — klar til menneskelig beslutning"
            />
            <div className="space-y-3">
              {activeRuns.map(run => (
                <Link key={run.id} href={`/admin/matching/${run.id}`}>
                  <Card hover className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-[#1A1F1C] text-sm">Match-kørsel</div>
                        <div className="text-xs text-[#6B7569]">
                          {run.cases
                            ? `Borger ${run.cases.citizen_initials} · ${run.cases.citizen_age_range}`
                            : `Sag: ${run.case_id.slice(0, 8)}…`
                          } · Algoritme v{run.algorithm_version}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={run.status === 'SCORED' ? 'green' : 'amber'} dot>
                        {run.status === 'SCORED' ? 'Klar til tildeling' : 'Initieret'}
                      </Badge>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Cases needing matching */}
        <SectionHeader
          title="Sager klar til matching"
          description="Åbne sager uden tildelt fagperson"
        />
        {cases.length === 0 ? (
          <Card className="text-center py-12 text-[#6B7569] text-sm">
            Ingen åbne sager fundet
          </Card>
        ) : (
          <div className="space-y-3">
            {cases.map(c => (
              <Link key={c.id} href={`/admin/matching/new?case_id=${c.id}`}>
                <Card hover className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FBF3E1] flex items-center justify-center">
                      <span className="text-sm font-bold text-[#92660A]">
                        {(c.citizen_initials as string | undefined) ?? 'XX'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-[#1A1F1C] text-sm">
                        Borger {c.citizen_initials} · {c.citizen_age_range}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={complexityColor[c.complexity_level as string] ?? 'default'}>
                          {complexityLabel[c.complexity_level as string] ?? c.complexity_level}
                        </Badge>
                        <span className="text-xs text-[#6B7569]">{c.weekly_hours} t/uge</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor[c.status as string] ?? 'default'} dot>
                      {statusLabel[c.status as string] ?? c.status}
                    </Badge>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </ContentContainer>
    </div>
  )
}
