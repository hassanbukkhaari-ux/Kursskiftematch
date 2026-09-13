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

// Deliberately a bucket, not the exact figure — enough for a sagsbehandler
// to judge seniority without adding a data point that, combined with
// everything else on this page, narrows down who a candidate is.
function experienceBucket(years: number | null): string | null {
  if (years == null) return null
  if (years < 2) return 'Under 2 års erfaring'
  if (years < 5) return '2-4 års erfaring'
  if (years < 10) return '5-9 års erfaring'
  return '10+ års erfaring'
}

interface PageProps {
  params: Promise<{ token: string }>
}

// Public, no-login page a municipality's sagsbehandler reaches from an
// email link — access is the unguessable token itself, not a session (see
// CLAUDE.md: no municipality login). GDPR: never the professional's name,
// only their role; never more citizen detail than initials + age range.
// The bio and match highlights below are the only "human" and case-specific
// context this page may show — both computed/selected so nothing on them
// can identify the professional (see migration 20260913000006 for why the
// bio specifically requires admin approval before it can appear here).
export default async function ProposalResponsePage({ params }: PageProps) {
  const { token } = await params
  const db = createServiceClient()

  const { data: proposal } = await (db as any)
    .from('case_proposals')
    .select(`
      id, status, responded_at, municipality_response_note,
      professionals(id, profession, experience_years, bio, bio_status,
        can_transport_citizen, has_drivers_license, has_own_car,
        can_work_evening, can_work_weekend, can_work_night),
      cases(id, case_number, citizen_initials, citizen_age_range, complexity_level,
        weekly_hours, transport_needs, requires_evening, requires_weekend,
        requires_night, required_languages)
    `)
    .eq('response_token', token)
    .maybeSingle()

  const pro = proposal?.professionals
  const caseRow = proposal?.cases
  const isActive = proposal && proposal.status === 'SENT' && !proposal.responded_at

  // Match highlights + bio are only computed for an active, pending proposal
  // — no point spending the extra queries on an inactive/resolved link.
  let matchHighlights: string[] = []
  if (isActive && pro && caseRow) {
    const [{ data: caseProblemAreas }, { data: targetGroups }, { data: languages }] = await Promise.all([
      (db as any).from('case_problem_areas').select('problem_areas(label_da)').eq('case_id', caseRow.id),
      (db as any).from('professional_target_groups').select('target_group_types(name)').eq('professional_id', pro.id),
      (db as any).from('professional_languages').select('language_types(name)').eq('professional_id', pro.id),
    ])

    const problemAreaLabels: string[] = (caseProblemAreas ?? []).map((r: any) => r.problem_areas?.label_da).filter(Boolean)
    const targetGroupNames: string[] = (targetGroups ?? []).map((r: any) => r.target_group_types?.name).filter(Boolean)
    const languageNames: string[] = (languages ?? []).map((r: any) => r.language_types?.name).filter(Boolean)

    const matchedAreas = problemAreaLabels.filter(label => targetGroupNames.includes(label))
    if (matchedAreas.length > 0) {
      matchHighlights.push(`Erfaring med: ${matchedAreas.join(', ')}`)
    }

    const requiredLanguages: string[] = caseRow.required_languages ?? []
    const matchedLanguages = requiredLanguages.filter(l => languageNames.includes(l))
    if (matchedLanguages.length > 0) {
      matchHighlights.push(`Taler ${matchedLanguages.join(', ')}`)
    }

    if (caseRow.transport_needs === 'JA' && pro.can_transport_citizen && pro.has_drivers_license && pro.has_own_car) {
      matchHighlights.push('Kan transportere borgeren ved behov')
    }

    const timeOfDay = [
      caseRow.requires_evening && pro.can_work_evening && 'aften',
      caseRow.requires_weekend && pro.can_work_weekend && 'weekend',
      caseRow.requires_night && pro.can_work_night && 'nat',
    ].filter(Boolean) as string[]
    if (timeOfDay.length > 0) {
      matchHighlights.push(`Kan arbejde: ${timeOfDay.join(', ')}`)
    }

    const expBucket = experienceBucket(pro.experience_years)
    if (expBucket) matchHighlights.push(expBucket)
  }

  const showBio = isActive && pro?.bio && pro.bio_status === 'APPROVED'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F3EE] px-4 py-10">
      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-[#E0DAD0] shadow-[0_4px_24px_rgba(28,56,41,0.08)] px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center gap-2.5 mb-8">
          <CompassMark size={32} />
          <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
        </div>

        {!proposal ? (
          <InactiveState message="Dette link findes ikke — kontakt Kursskifte hvis du mener det er en fejl." />
        ) : !isActive ? (
          <InactiveState message="Dette link er ikke længere aktivt." resolution={proposal} />
        ) : (
          <>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] mb-1">Forslag til kontaktperson</h1>
            <p className="text-sm text-[#6B7569] mb-6">
              {caseRow?.case_number ?? 'Ukendt sagsnummer'}
            </p>

            <div className="space-y-3 mb-6">
              <Row label="Borger" value={`${caseRow?.citizen_initials ?? '—'} · ${caseRow?.citizen_age_range ?? '—'}`} />
              <Row label="Kompleksitet" value={COMPLEXITY_LABEL[caseRow?.complexity_level] ?? caseRow?.complexity_level ?? '—'} />
              <Row label="Ugentlige timer" value={caseRow?.weekly_hours != null ? `${caseRow.weekly_hours} t/uge` : '—'} />
              <Row
                label="Foreslået kontaktperson"
                value={`Kursskifte har fundet en ${PROFESSION_LABEL[pro?.profession] ?? PROFESSION_LABEL.OTHER} til sagen`}
              />
            </div>

            {matchHighlights.length > 0 && (
              <div className="mb-6">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Hvorfor denne kandidat</div>
                <ul className="space-y-1.5">
                  {matchHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1A1F1C]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showBio && (
              <div className="mb-7">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Om kontaktpersonen</div>
                <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap leading-relaxed bg-[#F6F3EE] rounded-xl p-4">
                  {pro!.bio}
                </p>
              </div>
            )}

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
