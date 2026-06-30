'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/layout/page-header'
import type { InquiryRow } from './page'

const TYPE_LABEL: Record<string, string> = {
  MUNICIPALITY_INQUIRY: 'Kommunehenvendelse',
  PROFESSIONAL_APPLICATION: 'Fagpersonansøgning',
  PARTNER_LEAD: 'Partnerhenvendelse',
}

const TYPE_BADGE: Record<string, 'brand' | 'gold' | 'green'> = {
  MUNICIPALITY_INQUIRY: 'brand',
  PROFESSIONAL_APPLICATION: 'green',
  PARTNER_LEAD: 'gold',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Afventer',
  REVIEWED: 'Gennemset',
  CONVERTED: 'Konverteret',
  REJECTED: 'Afvist',
  SPAM: 'Spam',
}

const STATUS_BADGE: Record<string, 'amber' | 'green' | 'brand' | 'red' | 'default'> = {
  PENDING: 'amber',
  REVIEWED: 'brand',
  CONVERTED: 'green',
  REJECTED: 'red',
  SPAM: 'default',
}

type FilterKey = 'all' | 'PENDING' | 'REVIEWED' | 'CONVERTED' | 'REJECTED'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export function InquiriesClient({ initialData }: { initialData: InquiryRow[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('PENDING')
  const [selected, setSelected] = useState<InquiryRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [updating, startUpdate] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => ({
    all: initialData.length,
    PENDING: initialData.filter(i => i.status === 'PENDING').length,
    REVIEWED: initialData.filter(i => i.status === 'REVIEWED').length,
    CONVERTED: initialData.filter(i => i.status === 'CONVERTED').length,
    REJECTED: initialData.filter(i => i.status === 'REJECTED').length,
  }), [initialData])

  const filtered = useMemo(() =>
    filter === 'all' ? initialData : initialData.filter(i => i.status === filter),
    [initialData, filter],
  )

  function openDrawer(inquiry: InquiryRow) {
    setSelected(inquiry)
    setError(null)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setSelected(null)
    setError(null)
  }

  function updateStatus(newStatus: string) {
    if (!selected) return
    startUpdate(async () => {
      setError(null)
      const res = await fetch(`/api/inbound-inquiries/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      closeDrawer()
      router.refresh()
    })
  }

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Alle' },
    { key: 'PENDING', label: 'Afventer' },
    { key: 'REVIEWED', label: 'Gennemset' },
    { key: 'CONVERTED', label: 'Konverteret' },
    { key: 'REJECTED', label: 'Afvist' },
  ]

  return (
    <>
      <SectionHeader
        title={`${counts.PENDING} afventer behandling`}
        description={counts.PENDING === 0 ? 'Ingen henvendelser afventer' : undefined}
      />

      <div className="flex gap-1 mb-5 bg-[#F6F3EE] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === tab.key
                ? 'bg-white text-[#1A1F1C] shadow-sm'
                : 'text-[#6B7569] hover:text-[#1A1F1C]',
            ].join(' ')}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 tabular-nums ${filter === tab.key ? 'text-[#1C3829]' : 'text-[#C8C0B0]'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<InboxIcon />}
          title={filter === 'PENDING' ? 'Ingen henvendelser afventer' : 'Ingen resultater'}
          description={filter === 'PENDING' ? 'Nye henvendelser vil dukke op her' : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(inquiry => (
            <button key={inquiry.id} onClick={() => openDrawer(inquiry)} className="w-full text-left block">
              <Card hover className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829] shrink-0">
                    <InboxIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm">
                      {inquiry.submitter_name}
                      {inquiry.organization_name && (
                        <span className="text-[#6B7569] font-normal"> · {inquiry.organization_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={TYPE_BADGE[inquiry.submission_type]}>
                        {TYPE_LABEL[inquiry.submission_type]}
                      </Badge>
                      <span className="text-xs text-[#C8C0B0]">{formatDate(inquiry.submitted_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[inquiry.status] ?? 'default'} dot>
                    {STATUS_LABEL[inquiry.status] ?? inquiry.status}
                  </Badge>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/50 z-40 transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Henvendelsesdetaljer"
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl',
          'flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen && selected ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {selected && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
              <div className="min-w-0">
                <h2 className="font-serif text-base font-semibold text-[#1A1F1C] truncate">{selected.submitter_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={TYPE_BADGE[selected.submission_type]}>
                    {TYPE_LABEL[selected.submission_type]}
                  </Badge>
                  <span className="text-xs text-[#6B7569]">{formatDate(selected.submitted_at)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full bg-[#F6F3EE] hover:bg-[#EEF4F0] flex items-center justify-center text-[#6B7569] hover:text-[#1A1F1C] transition-colors shrink-0 ml-3"
                aria-label="Luk"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kontakt</div>
                <ContactRow icon={<EmailIcon />} value={selected.submitter_email} href={`mailto:${selected.submitter_email}`} />
                {selected.submitter_phone && (
                  <ContactRow icon={<PhoneIcon />} value={selected.submitter_phone} href={`tel:${selected.submitter_phone}`} />
                )}
                {selected.organization_name && (
                  <ContactRow icon={<OrgIcon />} value={selected.organization_name} />
                )}
              </div>

              {selected.message && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Besked</div>
                  <div className="bg-[#F6F3EE] rounded-xl p-4 text-sm text-[#1A1F1C] leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Status</div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={STATUS_BADGE[selected.status] ?? 'default'} dot>
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </Badge>
                  {selected.reviewed_at && (
                    <span className="text-xs text-[#6B7569]">Behandlet {formatDate(selected.reviewed_at)}</span>
                  )}
                </div>

                {selected.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm" loading={updating} onClick={() => updateStatus('REVIEWED')}>
                      Marker gennemset
                    </Button>
                    <Button variant="secondary" size="sm" loading={updating} onClick={() => updateStatus('REJECTED')}>
                      Afvis
                    </Button>
                    <Button variant="ghost" size="sm" loading={updating} onClick={() => updateStatus('SPAM')}>
                      Spam
                    </Button>
                  </div>
                )}

                {selected.status === 'REVIEWED' && selected.submission_type === 'MUNICIPALITY_INQUIRY' && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm" icon={<PlusIcon />}>
                      Opret sag (kommer snart)
                    </Button>
                    <Button variant="secondary" size="sm" loading={updating} onClick={() => updateStatus('REJECTED')}>
                      Afvis
                    </Button>
                  </div>
                )}

                {selected.status === 'REVIEWED' && selected.submission_type !== 'MUNICIPALITY_INQUIRY' && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" loading={updating} onClick={() => updateStatus('REJECTED')}>
                      Afvis
                    </Button>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E0DAD0] shrink-0">
              <Button variant="secondary" className="w-full" onClick={closeDrawer}>
                Luk
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function ContactRow({ icon, value, href }: { icon: React.ReactNode; value: string; href?: string }) {
  const base = 'flex items-center gap-2 text-sm text-[#1A1F1C]'
  return href ? (
    <a href={href} className={`${base} hover:text-[#1C3829] hover:underline`}>
      <span className="text-[#6B7569] shrink-0">{icon}</span>
      {value}
    </a>
  ) : (
    <div className={base}>
      <span className="text-[#6B7569] shrink-0">{icon}</span>
      {value}
    </div>
  )
}

function InboxIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.9-1.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function OrgIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
