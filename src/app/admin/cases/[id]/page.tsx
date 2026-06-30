import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer, SectionHeader } from '@/components/layout/page-header'
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

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminCasePage({ params }: PageProps) {
  const { id } = await params
  const db = await createClient()

  const { data: caseData } = await db
    .from('v_cases_with_professional')
    .select('*')
    .eq('id', id)
    .single()

  if (!caseData) notFound()

  const [muniRes, logsRes] = await Promise.all([
    db.from('municipalities').select('name, sagsbehandler_name, sagsbehandler_email').eq('id', caseData.municipality_id).single(),
    db.from('session_logs').select('id, session_date, duration_minutes, professional_id', { count: 'exact' }).eq('case_id', id).order('session_date', { ascending: false }).limit(5),
  ])

  const professional = caseData.professional_id
    ? await db.from('professionals').select('profession, experience_years, profiles!inner(full_name, email)').eq('id', caseData.professional_id).single()
    : null

  const proData = professional?.data as unknown as {
    profession: string
    experience_years: number
    profiles: { full_name: string; email: string }
  } | null

  const PROFESSION_LABEL: Record<string, string> = {
    TEACHER: 'Lærer', PEDAGOGUE: 'Pædagog', NURSE: 'Sygeplejerske',
    PSYCHOLOGIST: 'Psykolog', SOCIAL_WORKER: 'Socialrådgiver', COUNSELOR: 'Vejleder', OTHER: 'Andet',
  }

  return (
    <div>
      <PageHeader
        label="Sag"
        title={`Borger ${caseData.citizen_initials}`}
        subtitle={`${caseData.citizen_age_range} · ${muniRes.data?.name ?? 'Ukendt kommune'}`}
        breadcrumb={[
          { label: 'Administration', href: '/admin' },
          { label: 'Sager', href: '/admin/cases' },
          { label: `Borger ${caseData.citizen_initials}` },
        ]}
        actions={
          <Badge
            variant={STATUS_BADGE[caseData.status] ?? 'default'}
            dot
          >
            {STATUS_LABEL[caseData.status] ?? caseData.status}
          </Badge>
        }
      />

      <ContentContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-4">Sagsoplysninger</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <InfoBlock label="Kompleksitet">
                  <Badge variant={COMPLEXITY_BADGE[caseData.complexity_level] ?? 'default'}>
                    {COMPLEXITY_LABEL[caseData.complexity_level] ?? caseData.complexity_level}
                  </Badge>
                </InfoBlock>
                <InfoBlock label="Ugentlige timer">
                  <span className="font-semibold text-[#1A1F1C]">{caseData.weekly_hours} t/uge</span>
                </InfoBlock>
                <InfoBlock label="Aldersgruppe">
                  <span className="font-semibold text-[#1A1F1C]">{caseData.citizen_age_range}</span>
                </InfoBlock>
                {caseData.active_grant_hours !== null && (
                  <InfoBlock label="Bevilgede timer">
                    <span className="font-semibold text-[#1A1F1C]">{caseData.active_grant_hours} t</span>
                  </InfoBlock>
                )}
                {caseData.approved_hours_used > 0 && (
                  <InfoBlock label="Timer brugt">
                    <span className="font-semibold text-[#1A1F1C]">{caseData.approved_hours_used} t</span>
                  </InfoBlock>
                )}
              </div>
            </Card>

            <div>
              <SectionHeader
                title="Seneste sessionslog"
                description={`${logsRes.count ?? 0} sessioner i alt`}
              />
              {(logsRes.data?.length ?? 0) === 0 ? (
                <Card className="text-center py-10 text-[#6B7569] text-sm">
                  Ingen sessionslogs registreret endnu
                </Card>
              ) : (
                <div className="space-y-2">
                  {logsRes.data?.map(log => (
                    <Card key={log.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="text-sm text-[#1A1F1C]">
                          {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(log.session_date))}
                        </span>
                      </div>
                      {log.duration_minutes && (
                        <span className="text-xs text-[#6B7569]">{log.duration_minutes} min.</span>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">

            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Tildelt fagperson</div>
              {proData ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EEF4F0] flex items-center justify-center text-sm font-semibold text-[#1C3829] shrink-0">
                    {proData.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm">{proData.profiles.full_name}</div>
                    <div className="text-xs text-[#6B7569]">
                      {PROFESSION_LABEL[proData.profession] ?? proData.profession}
                      {proData.experience_years > 0 && ` · ${proData.experience_years} år`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[#6B7569]">Ingen fagperson tildelt endnu</div>
              )}
            </Card>

            {muniRes.data && (
              <Card>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Kommunekontakt</div>
                <div className="space-y-1.5">
                  <div className="text-sm font-medium text-[#1A1F1C]">{muniRes.data.name}</div>
                  {muniRes.data.sagsbehandler_name && (
                    <div className="text-xs text-[#6B7569]">{muniRes.data.sagsbehandler_name}</div>
                  )}
                  {muniRes.data.sagsbehandler_email && (
                    <a href={`mailto:${muniRes.data.sagsbehandler_email}`} className="text-xs text-[#1C3829] hover:underline block">
                      {muniRes.data.sagsbehandler_email}
                    </a>
                  )}
                </div>
              </Card>
            )}

            {(caseData.status === 'OPEN' || caseData.status === 'MATCHED') && (
              <Card>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Handlinger</div>
                <Link
                  href={`/admin/matching/new?case_id=${caseData.id}`}
                  className="flex items-center justify-between w-full h-10 px-4 bg-[#1C3829] text-[#F6F3EE] rounded-xl text-sm font-semibold hover:bg-[#2D5840] transition-colors"
                >
                  <span>Start matching</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#F6F3EE] rounded-xl p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">{label}</div>
      {children}
    </div>
  )
}
