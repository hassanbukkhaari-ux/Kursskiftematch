// TODO: Re-enable authentication before production
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { StartMatchButton } from './StartMatchButton'

const complexityLabel: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}
const complexityColor: Record<string, 'green' | 'amber' | 'red'> = {
  LOW: 'green', MEDIUM: 'amber', HIGH: 'red', CRITICAL: 'red',
}

type CaseData = {
  id: string
  citizen_initials: string
  citizen_age_range: string
  complexity_level: string
  weekly_hours: number
  status: string
}

type ExistingRun = {
  id: string
  status: string
  created_at: string
}

export default async function NewMatchRunPage({
  searchParams,
}: {
  searchParams: Promise<{ case_id?: string }>
}) {
  const { case_id } = await searchParams
  if (!case_id) redirect('/admin/matching')

  const db = await createClient()

  const { data: caseRaw } = await db
    .from('cases')
    .select('id, citizen_initials, citizen_age_range, complexity_level, weekly_hours, status')
    .eq('id', case_id)
    .single()

  const caseData = caseRaw as unknown as CaseData | null
  if (!caseData) redirect('/admin/matching')

  const { data: existingRunsRaw } = await db
    .from('match_runs')
    .select('id, status, created_at')
    .eq('case_id', case_id)
    .in('status', ['INITIATED', 'SCORED'])
    .order('created_at', { ascending: false })
    .limit(1)
  const existingRun = (existingRunsRaw as unknown as ExistingRun[] | null)?.[0] ?? null

  const complexColor = complexityColor[caseData.complexity_level] ?? 'amber'
  const complexText = complexityLabel[caseData.complexity_level] ?? caseData.complexity_level
  const caseLabel = `borger ${caseData.citizen_initials}`

  return (
    <div>
      <PageHeader
        label="Matching"
        title="Ny match-kørsel"
        subtitle={`Scorer fagpersoner mod borger ${caseData.citizen_initials} · ${caseData.citizen_age_range}`}
        breadcrumb={[
          { label: 'Administration', href: '/admin' },
          { label: 'Matching', href: '/admin/matching' },
          { label: 'Ny kørsel' },
        ]}
      />
      <ContentContainer>
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-[#FBF3E1] flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[#92660A]">
                {caseData.citizen_initials ?? 'XX'}
              </span>
            </div>
            <div>
              <div className="font-serif font-semibold text-[#1A1F1C] text-base">
                Borger {caseData.citizen_initials}
              </div>
              <div className="text-sm text-[#6B7569]">{caseData.citizen_age_range}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#F6F3EE] rounded-xl p-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">Kompleksitet</div>
              <Badge variant={complexColor}>{complexText}</Badge>
            </div>
            <div className="bg-[#F6F3EE] rounded-xl p-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">Ugentlige timer</div>
              <div className="font-semibold text-[#1A1F1C]">{caseData.weekly_hours} t/uge</div>
            </div>
            <div className="bg-[#F6F3EE] rounded-xl p-3 col-span-2 sm:col-span-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">Aldersgruppe</div>
              <div className="font-semibold text-[#1A1F1C]">{caseData.citizen_age_range}</div>
            </div>
          </div>
        </Card>

        {existingRun && (
          <div className="mb-6 p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#92660A] mb-0.5">
                Der eksisterer allerede en aktiv match-kørsel for denne sag
              </div>
              <div className="text-xs text-[#B45309]">
                Status: {existingRun.status === 'SCORED' ? 'Klar til tildeling' : 'Initieret'}
              </div>
              <Link
                href={`/admin/matching/${existingRun.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C3829] hover:underline mt-2"
              >
                Se eksisterende kørsel
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        <div className="max-w-sm">
          <StartMatchButton caseId={case_id} caseLabel={caseLabel} />
        </div>
      </ContentContainer>
    </div>
  )
}
