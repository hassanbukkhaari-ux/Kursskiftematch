import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Åben', MATCHED: 'Matchet', ACTIVE: 'Aktiv', COMPLETED: 'Afsluttet', ARCHIVED: 'Arkiveret',
}
const STATUS_BADGE: Record<string, 'amber' | 'brand' | 'green' | 'default'> = {
  OPEN: 'amber', MATCHED: 'brand', ACTIVE: 'green', COMPLETED: 'default', ARCHIVED: 'default',
}
const COMPLEXITY_LABEL: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}
const COMPLEXITY_BADGE: Record<string, 'green' | 'amber' | 'red'> = {
  LOW: 'green', MEDIUM: 'amber', HIGH: 'red', CRITICAL: 'red',
}

export default async function DashboardCasesPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: cases } = await db
    .from('v_cases_with_professional')
    .select('id, citizen_initials, citizen_age_range, status, complexity_level, weekly_hours, municipality_id, assignment_started_at')
    .eq('professional_id', user.id)
    .order('assignment_started_at', { ascending: false })

  const activeCases = cases?.filter(c => c.status !== 'ARCHIVED') ?? []

  return (
    <div>
      <PageHeader
        label="Mine sager"
        title="Sagsoversigt"
        subtitle={`${activeCases.length} aktive sager`}
        breadcrumb={[{ label: 'Mit overblik', href: '/dashboard' }, { label: 'Mine sager' }]}
      />
      <ContentContainer>
        {activeCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E0DAD0] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF4F0] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#1A1F1C] mb-1">Ingen sager tildelt</h3>
            <p className="text-sm text-[#6B7569]">Du har endnu ikke fået tildelt nogen sager</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCases.map(c => (
              <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                <Card hover className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FBF3E1] flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-[#92660A]">{c.citizen_initials}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[#1A1F1C] text-sm">Borger {c.citizen_initials} · {c.citizen_age_range}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={COMPLEXITY_BADGE[c.complexity_level] ?? 'default'}>
                          {COMPLEXITY_LABEL[c.complexity_level] ?? c.complexity_level}
                        </Badge>
                        <span className="text-xs text-[#6B7569]">{c.weekly_hours} t/uge</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={STATUS_BADGE[c.status] ?? 'default'} dot>
                      {STATUS_LABEL[c.status] ?? c.status}
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
