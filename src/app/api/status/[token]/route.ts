import { NextRequest } from 'next/server'
import { ok, notFound } from '@/lib/api-response'

// GET /api/status/:token — public, returns municipality-safe case status (no professional info)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { createServiceClient } = await import('@/lib/supabase/server')
  const db = createServiceClient()
  const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: caseRow } = await dba
    .from('cases')
    .select('id, status, intake_contact_name, created_at')
    .eq('intake_token', token)
    .single()

  if (!caseRow) return notFound('Case')

  // Count match candidates (from most recent SCORED run)
  const { data: latestRun } = await dba
    .from('match_runs')
    .select('id, status, created_at')
    .eq('case_id', caseRow.id)
    .eq('status', 'SCORED')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let candidateCount = 0
  if (latestRun) {
    const { count } = await dba
      .from('match_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('match_run_id', latestRun.id)
    candidateCount = count || 0
  }

  const statusLabel = toMunicipalityStatusLabel(caseRow.status as string, candidateCount)

  return ok({
    status: caseRow.status,
    status_label: statusLabel,
    candidate_count: candidateCount,
    submitted_at: caseRow.created_at,
  })
}

function toMunicipalityStatusLabel(status: string, candidateCount: number): string {
  switch (status) {
    case 'OPEN':
      return candidateCount > 0
        ? `Vi har identificeret ${candidateCount} relevante kandidater og er i gang med den faglige kvalitetssikring.`
        : 'Din henvendelse er modtaget og behandles.'
    case 'MATCHED':
      return 'En kontaktperson er blevet valgt og gennemgår den endelige kvalitetssikring.'
    case 'PROPOSED':
      return 'Et forslag er sendt. Venligst tjek din e-mail for at svare.'
    case 'ACTIVE':
      return 'Forslaget er accepteret. Sagen er nu aktiv.'
    default:
      return 'Din henvendelse behandles.'
  }
}
