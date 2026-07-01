import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProposalResponseClient from './ProposalResponseClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ProposalPage({ params }: PageProps) {
  const { token } = await params
  const db = createServiceClient()
  const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: proposal } = await dba
    .from('case_proposals')
    .select('id, status, proposal_note, estimated_hours_week, sent_at, responded_at, response_token')
    .eq('response_token', token)
    .single()

  if (!proposal) notFound()

  const sentAt = proposal.sent_at
    ? new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(proposal.sent_at))
    : null

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kursskiftematch</div>
          <h1 className="text-2xl font-bold text-[#1A1F1C] mb-1">Forslag til kontaktperson</h1>
          {sentAt && <p className="text-sm text-[#6B7569]">Sendt {sentAt}</p>}
        </div>

        {proposal.status !== 'SENT' ? (
          <div className="rounded-2xl border border-[#E0DAD0] bg-white p-6">
            <p className="text-sm text-[#6B7569]">
              {proposal.status === 'ACCEPTED'
                ? 'Du har allerede accepteret dette forslag. Sagen er nu aktiv.'
                : 'Du har allerede afvist dette forslag. Kontakt os for yderligere oplysninger.'}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-[#E0DAD0] bg-white p-6 mb-6 space-y-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Detaljer</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-[#6B7569]">Kandidater identificeret</div>
                    <div className="text-sm font-semibold text-[#1A1F1C]">
                      Vi har gennemgået relevante kandidater og har identificeret en velegnet kontaktperson.
                    </div>
                  </div>
                  {proposal.estimated_hours_week && (
                    <div>
                      <div className="text-xs text-[#6B7569]">Estimeret timeforbrug</div>
                      <div className="text-sm font-semibold text-[#1A1F1C]">{proposal.estimated_hours_week} timer/uge</div>
                    </div>
                  )}
                  {proposal.proposal_note && (
                    <div>
                      <div className="text-xs text-[#6B7569]">Bemærkning fra Kursskifte</div>
                      <div className="text-sm text-[#1A1F1C] whitespace-pre-line">{proposal.proposal_note}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E0DAD0]">
                <p className="text-xs text-[#6B7569]">
                  Kontaktpersonens navn og kontaktoplysninger deles først, når I accepterer forslaget.
                </p>
              </div>
            </div>

            <ProposalResponseClient responseToken={token} />
          </>
        )}
      </div>
    </div>
  )
}
