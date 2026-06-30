'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/layout/page-header'
import type { ProfessionalRow } from './page'

const PROFESSION_LABEL: Record<string, string> = {
  TEACHER: 'Lærer',
  PEDAGOGUE: 'Pædagog',
  NURSE: 'Sygeplejerske',
  PSYCHOLOGIST: 'Psykolog',
  SOCIAL_WORKER: 'Socialrådgiver',
  COUNSELOR: 'Vejleder',
  OTHER: 'Andet',
}

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: 'Ny registrering',
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
  ARCHIVED: 'Arkiveret',
}

const STATUS_BADGE: Record<string, 'amber' | 'green' | 'red' | 'default'> = {
  REGISTERED: 'amber',
  ACTIVE: 'green',
  INACTIVE: 'red',
  ARCHIVED: 'default',
}

const COMPLEXITY_LABEL: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}

const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: 'Tilgængelig',
  PARTIALLY_AVAILABLE: 'Delvis tilgængelig',
  UNAVAILABLE: 'Utilgængelig',
}

const AVAILABILITY_BADGE: Record<string, 'green' | 'amber' | 'red'> = {
  AVAILABLE: 'green',
  PARTIALLY_AVAILABLE: 'amber',
  UNAVAILABLE: 'red',
}

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Mand',
  FEMALE: 'Kvinde',
  OTHER: 'Andet',
}

const EXPERIENCE_GENDER_LABEL: Record<string, string> = {
  BOYS: 'Drenge',
  GIRLS: 'Piger',
}

type FilterKey = 'all' | 'REGISTERED' | 'ACTIVE' | 'INACTIVE'

type ProfileForm = {
  gender: string
  education: string
  daily_occupation: string
  certificates: string
  geography: string
  experience_with_genders: string[]
}

function toForm(pro: ProfessionalRow): ProfileForm {
  return {
    gender: pro.gender ?? '',
    education: pro.education ?? '',
    daily_occupation: pro.daily_occupation ?? '',
    certificates: pro.certificates.join(', '),
    geography: pro.geography.join(', '),
    experience_with_genders: pro.experience_with_genders,
  }
}

export function ProfessionalsClient({ initialData }: { initialData: ProfessionalRow[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selected, setSelected] = useState<ProfessionalRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [updating, startUpdate] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null)

  const counts = useMemo(() => ({
    all: initialData.length,
    REGISTERED: initialData.filter(p => p.status === 'REGISTERED').length,
    ACTIVE: initialData.filter(p => p.status === 'ACTIVE').length,
    INACTIVE: initialData.filter(p => p.status === 'INACTIVE').length,
  }), [initialData])

  const filtered = useMemo(() =>
    filter === 'all' ? initialData : initialData.filter(p => p.status === filter),
    [initialData, filter],
  )

  function openDrawer(pro: ProfessionalRow) {
    setSelected(pro)
    setError(null)
    setEditingProfile(false)
    setProfileForm(toForm(pro))
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setSelected(null)
    setError(null)
    setEditingProfile(false)
    setProfileForm(null)
  }

  function saveProfile() {
    if (!selected || !profileForm) return
    startUpdate(async () => {
      setError(null)
      const res = await fetch(`/api/professionals/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: profileForm.gender || undefined,
          education: profileForm.education || undefined,
          daily_occupation: profileForm.daily_occupation || undefined,
          certificates: profileForm.certificates.split(',').map(s => s.trim()).filter(Boolean),
          geography: profileForm.geography.split(',').map(s => s.trim()).filter(Boolean),
          experience_with_genders: profileForm.experience_with_genders,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      setEditingProfile(false)
      router.refresh()
    })
  }

  function setStatus(newStatus: string) {
    if (!selected) return
    startUpdate(async () => {
      setError(null)
      const res = await fetch(`/api/professionals/${selected.id}`, {
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
    { key: 'REGISTERED', label: 'Nye' },
    { key: 'ACTIVE', label: 'Aktive' },
    { key: 'INACTIVE', label: 'Inaktive' },
  ]

  return (
    <>
      <SectionHeader
        title={`${counts.ACTIVE} aktive fagpersoner`}
        description={counts.REGISTERED > 0 ? `${counts.REGISTERED} afventer aktivering` : undefined}
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-[#F6F3EE] rounded-xl p-1 w-fit">
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
          icon={<PeopleIcon />}
          title={filter === 'all' ? 'Ingen fagpersoner endnu' : `Ingen ${STATUS_LABEL[filter]?.toLowerCase() ?? ''} fagpersoner`}
          description={filter === 'REGISTERED' ? 'Nye registreringer vises her' : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(pro => (
            <button key={pro.id} onClick={() => openDrawer(pro)} className="w-full text-left block">
              <Card hover className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#EEF4F0] flex items-center justify-center text-sm font-semibold text-[#1C3829] shrink-0">
                    {pro.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm">{pro.profiles.full_name}</div>
                    <div className="text-xs text-[#6B7569]">
                      {PROFESSION_LABEL[pro.profession] ?? pro.profession}
                      {pro.experience_years > 0 && ` · ${pro.experience_years} år erfaring`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[pro.status] ?? 'default'} dot>
                    {STATUS_LABEL[pro.status] ?? pro.status}
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

      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/50 z-40 transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Fagpersonprofil"
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl',
          'flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen && selected ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {selected && (
          <>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#EEF4F0] flex items-center justify-center text-base font-semibold text-[#1C3829] shrink-0">
                  {selected.profiles.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-serif font-semibold text-[#1A1F1C] truncate">{selected.profiles.full_name}</div>
                  <div className="text-xs text-[#6B7569] truncate">{selected.profiles.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full bg-[#F6F3EE] hover:bg-[#EEF4F0] flex items-center justify-center text-[#6B7569] hover:text-[#1A1F1C] transition-colors shrink-0"
                aria-label="Luk"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

              {/* Current status */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Status</div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={STATUS_BADGE[selected.status] ?? 'default'} dot>
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </Badge>
                </div>

                {/* Status actions */}
                <div className="flex flex-wrap gap-2">
                  {selected.status === 'REGISTERED' && (
                    <Button variant="primary" size="sm" loading={updating} onClick={() => setStatus('ACTIVE')}>
                      Aktiver
                    </Button>
                  )}
                  {selected.status === 'ACTIVE' && (
                    <Button variant="secondary" size="sm" loading={updating} onClick={() => setStatus('INACTIVE')}>
                      Deaktiver
                    </Button>
                  )}
                  {selected.status === 'INACTIVE' && (
                    <>
                      <Button variant="primary" size="sm" loading={updating} onClick={() => setStatus('ACTIVE')}>
                        Genaktiver
                      </Button>
                      <Button variant="ghost" size="sm" loading={updating} onClick={() => setStatus('ARCHIVED')}>
                        Arkiver
                      </Button>
                    </>
                  )}
                  {selected.status === 'ARCHIVED' && (
                    <Button variant="secondary" size="sm" loading={updating} onClick={() => setStatus('INACTIVE')}>
                      Genopret
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile details */}
              <div className="grid grid-cols-2 gap-3">
                <InfoBlock label="Fag" value={PROFESSION_LABEL[selected.profession] ?? selected.profession} />
                <InfoBlock label="Erfaring" value={`${selected.experience_years} år`} />
                <InfoBlock label="Maks. kompleksitet" value={COMPLEXITY_LABEL[selected.max_complexity_level] ?? selected.max_complexity_level} />
                <InfoBlock label="Kapacitet" value={`${selected.capacity_hours_week} t/uge · maks. ${selected.max_concurrent_cases} sager`} />
              </div>

              {/* Availability */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Tilgængelighed</div>
                <Badge variant={AVAILABILITY_BADGE[selected.availability_status] ?? 'default'} dot>
                  {AVAILABILITY_LABEL[selected.availability_status] ?? selected.availability_status}
                </Badge>
                {selected.availability_days.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.availability_days.map(d => (
                      <span key={d} className="text-xs bg-[#F6F3EE] border border-[#E0DAD0] rounded-lg px-2 py-1 text-[#6B7569]">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Age groups */}
              {selected.target_age_groups.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Målgrupper</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.target_age_groups.map(g => (
                      <Badge key={g} variant="brand">{g}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {selected.qualifications.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kompetencer</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.qualifications.map(q => (
                      <span key={q} className="text-xs bg-[#EEF4F0] border border-[#D1E7D8] rounded-lg px-2 py-1 text-[#1C3829]">{q}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Kontaktperson profile */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">Kontaktpersonprofil</div>
                  {!editingProfile && (
                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                      className="text-xs font-medium text-[#1C3829] hover:underline"
                    >
                      Rediger
                    </button>
                  )}
                </div>

                {editingProfile && profileForm ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[#6B7569] mb-1 block">Køn</label>
                      <div className="flex gap-1.5">
                        {(['MALE', 'FEMALE', 'OTHER'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setProfileForm({ ...profileForm, gender: profileForm.gender === g ? '' : g })}
                            className={[
                              'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                              profileForm.gender === g
                                ? 'bg-[#1C3829] text-white border-[#1C3829]'
                                : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                            ].join(' ')}
                          >
                            {GENDER_LABEL[g]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[#6B7569] mb-1 block">Erfaring med</label>
                      <div className="flex gap-1.5">
                        {(['BOYS', 'GIRLS'] as const).map(eg => {
                          const active = profileForm.experience_with_genders.includes(eg)
                          return (
                            <button
                              key={eg}
                              type="button"
                              onClick={() => setProfileForm({
                                ...profileForm,
                                experience_with_genders: active
                                  ? profileForm.experience_with_genders.filter(x => x !== eg)
                                  : [...profileForm.experience_with_genders, eg],
                              })}
                              className={[
                                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                active
                                  ? 'bg-[#1C3829] text-white border-[#1C3829]'
                                  : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                              ].join(' ')}
                            >
                              {EXPERIENCE_GENDER_LABEL[eg]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[#6B7569] mb-1 block">Uddannelse</label>
                      <input
                        type="text"
                        value={profileForm.education}
                        onChange={e => setProfileForm({ ...profileForm, education: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#6B7569] mb-1 block">Daglig beskæftigelse</label>
                      <input
                        type="text"
                        value={profileForm.daily_occupation}
                        onChange={e => setProfileForm({ ...profileForm, daily_occupation: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#6B7569] mb-1 block">Certifikater (kommasepareret)</label>
                      <input
                        type="text"
                        value={profileForm.certificates}
                        onChange={e => setProfileForm({ ...profileForm, certificates: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#6B7569] mb-1 block">Geografi (kommasepareret)</label>
                      <input
                        type="text"
                        value={profileForm.geography}
                        onChange={e => setProfileForm({ ...profileForm, geography: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829]"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="primary" size="sm" loading={updating} onClick={saveProfile}>
                        Gem
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingProfile(false); setProfileForm(toForm(selected)) }}
                      >
                        Annuller
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <InfoBlock label="Køn" value={selected.gender ? (GENDER_LABEL[selected.gender] ?? selected.gender) : '—'} />
                    <InfoBlock
                      label="Erfaring med"
                      value={selected.experience_with_genders.length > 0
                        ? selected.experience_with_genders.map(g => EXPERIENCE_GENDER_LABEL[g] ?? g).join(', ')
                        : '—'}
                    />
                    <InfoBlock label="Uddannelse" value={selected.education || '—'} />
                    <InfoBlock label="Daglig beskæftigelse" value={selected.daily_occupation || '—'} />
                    <InfoBlock label="Certifikater" value={selected.certificates.length > 0 ? selected.certificates.join(', ') : '—'} />
                    <InfoBlock label="Geografi" value={selected.geography.length > 0 ? selected.geography.join(', ') : '—'} />
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

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E0DAD0] shrink-0 flex gap-2">
              <Link
                href={`/admin/professionals/${selected.id}`}
                className="flex-1 h-9 flex items-center justify-center bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors"
              >
                Se fuld profil
              </Link>
              <Button variant="secondary" onClick={closeDrawer}>
                Luk
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F6F3EE] rounded-xl p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">{label}</div>
      <div className="text-sm font-medium text-[#1A1F1C]">{value}</div>
    </div>
  )
}

function PeopleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
