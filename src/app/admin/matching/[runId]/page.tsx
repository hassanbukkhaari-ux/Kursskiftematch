import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MatchingUI } from './MatchingUI'

const complexityLabel: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}

interface PageProps {
  params: Promise<{ runId: string }>
}

type MatchRun = {
  id: string
  case_id: string
  status: string
  algorithm_version: string
}

type CaseData = {
  id: string
  citizen_initials: string
  citizen_age_range: string
  complexity_level: string
  weekly_hours: number
  status: string
}

export default async function MatchRunPage({ params }: PageProps) {
  const { runId } = await params

  const db = await createClient()

  const { data: runRaw, error: runError } = await db
    .from('match_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (runError || !runRaw) notFound()

  const run = runRaw as unknown as MatchRun

  const { data: candidates } = await db
    .from('match_candidates')
    .select(`
      id, rank, overall_score,
      qualifications_score, availability_score, capacity_score, complexity_fit_score,
      scoring_explanation, professional_id,
      professionals!inner(
        id, profession, experience_years, max_complexity_level,
        target_age_groups, qualifications, capacity_hours_week,
        max_concurrent_cases, availability_status, availability_days,
        profiles!inner(full_name, email)
      )
    `)
    .eq('match_run_id', runId)
    .order('rank', { ascending: true })

  const { data: caseRaw } = await db
    .from('cases')
    .select('id, citizen_initials, citizen_age_range, complexity_level, weekly_hours, status')
    .eq('id', run.case_id)
    .single()

  const caseData = caseRaw as unknown as CaseData | null
  const candidateList = (candidates ?? []) as unknown as Parameters<typeof MatchingUI>[0]['candidates']
  const topScore = candidateList[0]?.overall_score ?? 0

  return (
    <div>
      <PageHeader
        label="Match-kørsel"
        title={caseData ? `Match for borger ${caseData.citizen_initials}` : 'Match-kandidater'}
        subtitle={`${candidateList.length} kandidater scoret · Algoritme v${run.algorithm_version}`}
        breadcrumb={[
          { label: 'Administration', href: '/admin' },
          { label: 'Matching', href: '/admin/matching' },
          { label: caseData ? `Borger ${caseData.citizen_initials}` : runId.slice(0, 8) },
        ]}
        actions={
          <Badge
            variant={run.status === 'SCORED' ? 'green' : run.status === 'ASSIGNED' ? 'brand' : 'amber'}
            dot
          >
            {run.status === 'SCORED' ? 'Klar til tildeling' :
             run.status === 'ASSIGNED' ? 'Tildelt' :
             run.status === 'INITIATED' ? 'Scorer...' : run.status}
          </Badge>
        }
      />

      {caseData && (
        <div className="bg-[#1C3829]/5 border-b border-[#1C3829]/10 px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center gap-4 md:gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[#6B7569]">Aldersgruppe</span>
              <Badge variant="brand">{caseData.citizen_age_range}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#6B7569]">Kompleksitet</span>
              <Badge variant={caseData.complexity_level === 'CRITICAL' || caseData.complexity_level === 'HIGH' ? 'red' : caseData.complexity_level === 'MEDIUM' ? 'amber' : 'green'}>
                {complexityLabel[caseData.complexity_level] ?? caseData.complexity_level}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#6B7569]">Ugentlige timer</span>
              <span className="font-medium text-[#1A1F1C]">{caseData.weekly_hours}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#6B7569]">Bedste score</span>
              <span className="font-bold" style={{ color: topScore >= 60 ? '#15803D' : topScore >= 40 ? '#B45309' : '#B91C1C' }}>
                {Math.round(topScore)}
              </span>
            </div>
          </div>
        </div>
      )}

      <MatchingUI
        candidates={candidateList}
        runId={runId}
        caseId={run.case_id}
        runStatus={run.status}
        caseData={caseData ?? undefined}
      />
    </div>
  )
}
