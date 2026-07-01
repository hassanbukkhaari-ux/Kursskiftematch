import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

const STATUS_STEPS: { status: string; label: string }[] = [
  { status: 'OPEN', label: 'Sag modtaget' },
  { status: 'MATCHED', label: 'Kontaktperson valgt' },
  { status: 'PROPOSED', label: 'Forslag sendt' },
  { status: 'ACTIVE', label: 'Sag aktiv' },
]

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex(s => s.status === status)
  return idx >= 0 ? idx : 0
}

export default async function StatusPage({ params }: PageProps) {
  const { token } = await params
  const db = createServiceClient()
  const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: caseRow } = await dba
    .from('cases')
    .select('id, status, intake_contact_name, created_at')
    .eq('intake_token', token)
    .single()

  if (!caseRow) notFound()

  const { data: latestRun } = await dba
    .from('match_runs')
    .select('id')
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

  const stepIndex = getStepIndex(caseRow.status)
  const submittedAt = new Intl.DateTimeFormat('da-DK', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(caseRow.created_at))

  const statusMessage = getStatusMessage(caseRow.status as string, candidateCount)

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kursskiftematch</div>
          <h1 className="text-2xl font-bold text-[#1A1F1C] mb-1">Sagsstatus</h1>
          <p className="text-sm text-[#6B7569]">Indsendt {submittedAt}</p>
        </div>

        {/* Progress steps */}
        <div className="rounded-2xl border border-[#E0DAD0] bg-white p-6 mb-6">
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i < stepIndex
              const active = i === stepIndex
              const last = i === STATUS_STEPS.length - 1
              return (
                <div key={step.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? 'bg-[#2D6A4F]' : active ? 'bg-[#2D6A4F]' : 'bg-[#E0DAD0]'
                    }`}>
                      {done ? (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-[#6B7569]'}`} />
                      )}
                    </div>
                    {!last && <div className={`w-px flex-1 my-1 ${done ? 'bg-[#2D6A4F]' : 'bg-[#E0DAD0]'}`} style={{ minHeight: '1.5rem' }} />}
                  </div>
                  <div className={`pb-6 ${last ? 'pb-0' : ''}`}>
                    <div className={`text-sm font-semibold ${active ? 'text-[#1A1F1C]' : done ? 'text-[#2D6A4F]' : 'text-[#9A9E97]'}`}>
                      {step.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status message */}
        <div className="rounded-2xl border border-[#D1E7D8] bg-[#EEF4F0] p-6">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#2D6A4F] mb-2">Status</div>
          <p className="text-sm text-[#1A1F1C]">{statusMessage}</p>
        </div>

        {caseRow.status === 'PROPOSED' && (
          <div className="mt-4 rounded-2xl border border-[#F5DDB0] bg-[#FEF2E2] p-4">
            <p className="text-sm text-[#92660A]">
              Tjek din indbakke — vi har sendt et forslag til din e-mailadresse. Brug linket i e-mailen til at acceptere eller afvise.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusMessage(status: string, candidateCount: number): string {
  switch (status) {
    case 'OPEN':
      if (candidateCount > 0) {
        return `Vi har identificeret ${candidateCount} relevante kandidater og er nu i gang med den faglige kvalitetssikring. Vi vender tilbage med et forslag hurtigst muligt.`
      }
      return 'Din henvendelse er modtaget og behandles. Vi vender tilbage hurtigst muligt.'
    case 'MATCHED':
      return 'En kontaktperson er valgt og gennemgår den afsluttende kvalitetssikring. Vi sender snart et forslag til din e-mailadresse.'
    case 'PROPOSED':
      return 'Et forslag er sendt til din e-mailadresse. Venligst bekræft eller afvis forslaget via linket i mailen.'
    case 'ACTIVE':
      return 'Forslaget er accepteret og sagen er nu aktiv. Kontaktpersonen vil tage kontakt inden for kort tid.'
    default:
      return 'Din henvendelse behandles.'
  }
}
