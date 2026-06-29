import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer, StatCard, SectionHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface QuickLink {
  href: string
  title: string
  description: string
  icon: React.ReactNode
  badge?: { label: string; variant: 'amber' | 'green' | 'brand' | 'red' }
}

export default async function AdminPage() {
  const db = await createClient()

  const [casesRes, prosRes, inquiriesRes, runsRes] = await Promise.all([
    db.from('cases').select('id', { count: 'exact', head: true }).neq('status', 'ARCHIVED'),
    db.from('professionals').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    db.from('inbound_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    db.from('match_runs').select('id', { count: 'exact', head: true }).eq('status', 'SCORED'),
  ])

  const pendingMatchRuns = runsRes.count ?? 0

  const quickLinks: QuickLink[] = [
    {
      href: '/admin/cases',
      title: 'Sagsstyring',
      description: 'Opret og administrer sager',
      icon: <CasesIcon />,
      badge: casesRes.count ? { label: `${casesRes.count} aktive`, variant: 'brand' } : undefined,
    },
    {
      href: '/admin/matching',
      title: 'Matching',
      description: 'Start match-kørsler og tildel fagpersoner',
      icon: <MatchIcon />,
      badge: pendingMatchRuns > 0 ? { label: `${pendingMatchRuns} klar`, variant: 'green' } : undefined,
    },
    {
      href: '/admin/professionals',
      title: 'Fagpersoner',
      description: 'Administrer profiler og dokumenter',
      icon: <ProsIcon />,
    },
    {
      href: '/admin/inquiries',
      title: 'Henvendelser',
      description: 'Indkomne kommunehenvendelser',
      icon: <InquiryIcon />,
      badge: inquiriesRes.count ? { label: `${inquiriesRes.count} nye`, variant: 'amber' } : undefined,
    },
    {
      href: '/admin/municipalities',
      title: 'Kommuner',
      description: 'Kommuneaftaler og kontaktpersoner',
      icon: <MuniIcon />,
    },
    {
      href: '/admin/notifications',
      title: 'Notifikationer',
      description: 'Log og genforsendelse af notifikationer',
      icon: <NotifIcon />,
    },
  ]

  return (
    <div>
      <PageHeader
        label="Dashboard"
        title="Administration"
        subtitle="Kursskiftematch — administrationsplatform"
      />
      <ContentContainer>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Aktive sager" value={casesRes.count ?? 0} color="brand" href="/admin/cases" />
          <StatCard label="Aktive fagpersoner" value={prosRes.count ?? 0} color="green" href="/admin/professionals" />
          <StatCard label="Nye henvendelser" value={inquiriesRes.count ?? 0} color="amber" href="/admin/inquiries" />
          <StatCard label="Klar til tildeling" value={pendingMatchRuns} color="gold" sublabel="match-kørsler" href="/admin/matching" />
        </div>

        <SectionHeader title="Genveje" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <Card hover className="h-full">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829] shrink-0">
                    {link.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif font-semibold text-[#1A1F1C]">{link.title}</h3>
                      {link.badge && (
                        <Badge variant={link.badge.variant} dot>
                          {link.badge.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#6B7569] mt-0.5">{link.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </ContentContainer>
    </div>
  )
}

function CasesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function MatchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}
function ProsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function InquiryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function MuniIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" />
    </svg>
  )
}
function NotifIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
