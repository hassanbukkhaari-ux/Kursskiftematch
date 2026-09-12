import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { REPORT_TYPE_LABEL } from '@/lib/labels'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Afventer',
  ACKNOWLEDGED: 'Bekræftet',
  SUBMITTED: 'Indsendt',
  REVIEWED: 'Gennemset',
}

const STATUS_BADGE: Record<string, 'amber' | 'green' | 'default' | 'brand'> = {
  PENDING: 'amber',
  ACKNOWLEDGED: 'brand',
  SUBMITTED: 'green',
  REVIEWED: 'default',
}

export default async function DashboardStatusReportsPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient() as any
  const { data: requests } = await svc
    .from('status_report_requests')
    .select(`
      id, case_id, report_type, deadline, promised_date, status, message, created_at,
      cases!inner(citizen_initials, citizen_age_range),
      status_reports(id, submitted_at)
    `)
    .eq('professional_id', user.id)
    .order('deadline', { ascending: true })

  const list = requests ?? []
  const today = new Date().toISOString().slice(0, 10)

  function isOverdue(r: any) {
    return r.deadline < today && r.status !== 'SUBMITTED' && r.status !== 'REVIEWED'
  }

  const pending = list.filter((r: any) => r.status === 'PENDING' || r.status === 'ACKNOWLEDGED')
  const done = list.filter((r: any) => r.status === 'SUBMITTED' || r.status === 'REVIEWED')

  return (
    <div>
      <PageHeader
        label="Dokumentation"
        title="Statusrapporter"
        subtitle={`${pending.length} afventer · ${done.length} afsluttet`}
        breadcrumb={[{ label: 'Mit overblik', href: '/dashboard' }, { label: 'Statusrapporter' }]}
      />
      <ContentContainer>
        {list.length === 0 ? (
          <EmptyState
            icon={<ReportIcon />}
            title="Ingen statusrapporter"
            description="Du har ingen anmodninger om statusrapporter endnu"
          />
        ) : (
          <div className="space-y-2">
            {list.map((r: any) => {
              const overdue = isOverdue(r)
              return (
                <Link key={r.id} href={`/dashboard/status-reports/${r.id}`} className="block">
                  <Card hover className={overdue ? 'border-red-200 bg-[#FEF2F2]' : ''}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm text-[#1A1F1C]">
                            Borger {r.cases?.citizen_initials}
                          </span>
                          <Badge variant="brand" className="text-[10px]">
                            {REPORT_TYPE_LABEL[r.report_type] ?? r.report_type}
                          </Badge>
                          {overdue && <Badge variant="red">Forfalden</Badge>}
                        </div>
                        <div className="text-xs text-[#6B7569]">
                          Frist: {new Date(r.deadline).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {r.promised_date && r.status === 'ACKNOWLEDGED' && (
                            <span className="ml-1 text-[#1C3829]">
                              · Lovet {new Date(r.promised_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={STATUS_BADGE[r.status] ?? 'default'} dot>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </Badge>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </ContentContainer>
    </div>
  )
}

function ReportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}
