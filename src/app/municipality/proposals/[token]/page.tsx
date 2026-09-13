import { createServiceClient } from '@/lib/supabase/server'
import { CompassMark } from '@/components/brand/compass'
import { ProposalResponseClient } from './ProposalResponseClient'

const COMPLEXITY_LABEL: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}

const PROFESSION_LABEL: Record<string, string> = {
  TEACHER: 'lærer', PEDAGOGUE: 'pædagog', NURSE: 'sygeplejerske',
  PSYCHOLOGIST: 'psykolog', SOCIAL_WORKER: 'socialrådgiver',
  COUNSELOR: 'vejleder', OTHER: 'kvalificeret fagperson',
}

interface PageProps {
  params: Promise<{ token: string }>
}

// Public, no-login page a municipality's sagsbehandler reaches from an
// email link — access is the unguessable token itself, not a session (see
// CLAUDE.md: no municipality login). GDPR: never the professional's name,
// only their role; never more citizen detail than initials + age range.
export default async function ProposalResponsePage({ params }: PageProps) {
  const { token } = await params
  const db = createServiceClient()

  const { data: proposal } = await (db as any)
    .from('case_proposals')
    .select(`
      id, status, responded_at, municipality_response_note,
      professionals(profession),
      cases(case_number, citizen_initials, citizen_age_range, complexity_level, weekly_hours)
    `)
    .eq('response_token', token)
    .maybeSingle()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F3EE] px-4 py-10">
      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-[#E0DAD0] shadow-[0_4px_24px_rgba(28,56,41,0.08)] px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center gap-2.5 mb-8">
          <CompassMark size={32} />
          <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
        </div>

        {!proposal ? (
          <InactiveState message="Dette link findes ikke — kontakt Kursskifte hvis du mener det er en fejl." />
        ) : proposal.status !== 'SENT' || proposal.responded_at ? (
          <InactiveState message="Dette link er ikke længere aktivt." resolution={proposal} />
        ) : (
          <>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] mb-1">Forslag til kontaktperson</h1>
            <p className="text-sm text-[#6B7569] mb-6">
              {proposal.cases?.case_number ?? 'Ukendt sagsnummer'}
            </p>

            <div className="space-y-3 mb-7">
              <Row label="Borger" value={`${proposal.cases?.citizen_initials ?? '—'} · ${proposal.cases?.citizen_age_range ?? '—'}`} />
              <Row label="Kompleksitet" value={COMPLEXITY_LABEL[proposal.cases?.complexity_level] ?? proposal.cases?.complexity_level ?? '—'} />
              <Row label="Ugentlige timer" value={proposal.cases?.weekly_hours != null ? `${proposal.cases.weekly_hours} t/uge` : '—'} />
              <Row
                label="Foreslået kontaktperson"
                value={`Kursskifte har fundet en ${PROFESSION_LABEL[proposal.professionals?.profession] ?? PROFESSION_LABEL.OTHER} til sagen`}
              />
            </div>

            <ProposalResponseClient token={token} />
          </>
        )}
      </div>
      <p className="mt-6 text-xs text-[#6B7569]">Kursskiftematch · kursskifte.dk</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-[#F0EBE3] pb-2">
      <span className="text-[#6B7569]">{label}</span>
      <span className="font-medium text-[#1A1F1C] text-right">{value}</span>
    </div>
  )
}

function InactiveState({ message, resolution }: { message: string; resolution?: { status: string; municipality_response_note: string | null } }) {
  const STATUS_LABEL: Record<string, string> = {
    ACCEPTED: 'Du har accepteret dette forslag.',
    DECLINED: 'Du har afvist dette forslag.',
    CHANGES_REQUESTED: 'Du har bedt om ændringer til dette forslag.',
    WITHDRAWN: 'Kursskifte har trukket dette forslag tilbage.',
  }
  return (
    <div>
      <h1 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-2">Ikke aktivt</h1>
      <p className="text-sm text-[#6B7569] mb-2">{message}</p>
      {resolution && STATUS_LABEL[resolution.status] && (
        <p className="text-sm text-[#1A1F1C] font-medium">{STATUS_LABEL[resolution.status]}</p>
      )}
      {resolution?.municipality_response_note && (
        <p className="text-xs text-[#6B7569] mt-2 whitespace-pre-wrap">"{resolution.municipality_response_note}"</p>
      )}
    </div>
  )
}
