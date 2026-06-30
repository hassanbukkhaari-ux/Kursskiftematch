'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ProfessionalDetail } from './page'
import type { DocumentRow, CertificateRow } from '@/app/dashboard/profile/page'

// ── Types ────────────────────────────────────────────────────────────────

interface Props {
  professionalId: string
  professional: ProfessionalDetail
  profile: { full_name: string; email: string }
  documents: DocumentRow[]
  certificates: CertificateRow[]
  geographyNames: string[]
  competencyNames: string[]
  methodNames: string[]
  targetGroupNames: string[]
  workTaskNames: string[]
  languageNames: string[]
}

// ── Sub-components ───────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0 && value !== false) return null
  return (
    <div className="flex gap-3 py-2 border-b border-[#F0EBE3] last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] w-36 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-[#1A1F1C] min-w-0">{value}</dd>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-3">{children}</h2>
  )
}

function ChipList({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-sm text-[#C8C0B0]">Ingen valgt</span>
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span key={item} className="px-3 py-1 rounded-xl text-xs font-medium bg-[#EEF4F0] text-[#1C3829] border border-[#C8DDD1]">
          {item}
        </span>
      ))}
    </div>
  )
}

// ── Document management ──────────────────────────────────────────────────

const DOC_TYPES = [
  { type: 'CRIMINAL_RECORD', label: 'Straffeattest', required: true },
  { type: 'CHILD_RECORD', label: 'Børneattest', required: true },
  { type: 'CV', label: 'CV', required: true },
  { type: 'EDUCATION', label: 'Uddannelsesbeviser', required: false },
  { type: 'DRIVING_LICENSE', label: 'Kørekort', required: false },
  { type: 'AUTHORIZATION', label: 'Autorisation', required: false },
]

const DOC_STATUS_LABEL: Record<string, string> = {
  PENDING_UPLOAD: 'Mangler upload', MISSING: 'Mangler', UNVERIFIED: 'Uploadet',
  UPLOADED: 'Uploadet', VERIFIED: 'Godkendt', APPROVED: 'Godkendt',
  REJECTED: 'Afvist', EXPIRING_SOON: 'Udløber snart', ARCHIVED: 'Arkiveret',
}
const DOC_STATUS_BADGE: Record<string, 'default' | 'amber' | 'green' | 'red'> = {
  PENDING_UPLOAD: 'default', MISSING: 'default', UNVERIFIED: 'amber',
  UPLOADED: 'amber', VERIFIED: 'green', APPROVED: 'green',
  REJECTED: 'red', EXPIRING_SOON: 'amber', ARCHIVED: 'default',
}

function DocumentSection({ documents, professionalId }: { documents: DocumentRow[]; professionalId: string }) {
  const router = useRouter()
  const [pending, startT] = useTransition()
  const [acting, setActing] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [showReject, setShowReject] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const docMap = Object.fromEntries(documents.map(d => [d.document_type, d]))

  async function approve(docId: string) {
    setActing(docId); setError(null)
    try {
      const res = await fetch(`/api/profile/documents/${docId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? 'Fejl'); return }
      startT(() => router.refresh())
    } catch { setError('Netværksfejl') }
    finally { setActing(null) }
  }

  async function reject(docId: string) {
    setActing(docId); setError(null)
    try {
      const res = await fetch(`/api/profile/documents/${docId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', note: rejectNote[docId] ?? '' }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? 'Fejl'); return }
      setShowReject(s => ({ ...s, [docId]: false }))
      startT(() => router.refresh())
    } catch { setError('Netværksfejl') }
    finally { setActing(null) }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {DOC_TYPES.map(dt => {
        const doc = docMap[dt.type]
        const status = doc?.status ?? 'MISSING'
        const canAct = doc && ['UPLOADED', 'UNVERIFIED'].includes(status)

        return (
          <div key={dt.type} className="border border-[#E0DAD0] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1A1F1C]">{dt.label}</span>
                  {dt.required && <span className="text-[10px] text-[#C8C0B0] uppercase tracking-wide">krævet</span>}
                </div>
                {doc?.file_name && (
                  <div className="text-xs text-[#6B7569] mt-0.5">{doc.file_name}</div>
                )}
                {doc?.uploaded_at && (
                  <div className="text-xs text-[#6B7569]">
                    Uploadet {new Date(doc.uploaded_at).toLocaleDateString('da-DK')}
                  </div>
                )}
                {doc?.verified_at && (
                  <div className="text-xs text-[#1C3829]">
                    Godkendt {new Date(doc.verified_at).toLocaleDateString('da-DK')}
                  </div>
                )}
              </div>
              <Badge variant={DOC_STATUS_BADGE[status] ?? 'default'}>
                {DOC_STATUS_LABEL[status] ?? status}
              </Badge>
            </div>

            {canAct && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => approve(doc.id)}
                  disabled={acting === doc.id || pending}
                  className="h-8 px-4 bg-[#1C3829] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5840] transition-colors disabled:opacity-50"
                >
                  {acting === doc.id ? 'Behandler…' : 'Godkend'}
                </button>
                {!showReject[doc.id] ? (
                  <button
                    onClick={() => setShowReject(s => ({ ...s, [doc.id]: true }))}
                    className="h-8 px-4 border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Afvis
                  </button>
                ) : (
                  <div className="flex-1 min-w-full mt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Årsag til afvisning (valgfri)"
                      value={rejectNote[doc.id] ?? ''}
                      onChange={e => setRejectNote(n => ({ ...n, [doc.id]: e.target.value }))}
                      className="w-full h-9 px-3 bg-[#F6F3EE] rounded-lg text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => reject(doc.id)}
                        disabled={acting === doc.id || pending}
                        className="h-8 px-4 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Bekræft afvisning
                      </button>
                      <button
                        onClick={() => setShowReject(s => ({ ...s, [doc.id]: false }))}
                        className="h-8 px-4 border border-[#E0DAD0] text-xs font-semibold rounded-lg hover:bg-[#F6F3EE] transition-colors"
                      >
                        Annuller
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Status toggle ────────────────────────────────────────────────────────

function StatusToggle({ professionalId, currentStatus }: { professionalId: string; currentStatus: string }) {
  const router = useRouter()
  const [pending, startT] = useTransition()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isActive = currentStatus === 'ACTIVE'

  async function toggle() {
    setSaving(true); setError(null)
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE'
    try {
      const res = await fetch(`/api/admin/professionals/${professionalId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? 'Fejl'); return }
      startT(() => router.refresh())
    } catch { setError('Netværksfejl') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#1A1F1C]">Status:</span>
        <Badge variant={isActive ? 'green' : 'default'}>
          {isActive ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>
      <button
        onClick={toggle}
        disabled={saving || pending}
        className={[
          'h-8 px-4 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50',
          isActive
            ? 'border-red-300 text-red-600 hover:bg-red-50'
            : 'border-[#1C3829] text-[#1C3829] hover:bg-[#EEF4F0]',
        ].join(' ')}
      >
        {saving ? 'Behandler…' : isActive ? 'Deaktiver' : 'Aktiver'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

export function ProfessionalDetailClient({
  professionalId, professional: pro, profile,
  documents, certificates,
  geographyNames, competencyNames, methodNames,
  targetGroupNames, workTaskNames, languageNames,
}: Props) {
  const boolLabel = (v: boolean) => v ? 'Ja' : 'Nej'

  const availabilityFlags = [
    pro.available_now && 'Ledig nu',
    pro.can_take_acute && 'Akutte sager',
    pro.can_work_evening && 'Aften',
    pro.can_work_weekend && 'Weekend',
    pro.can_work_night && 'Nat',
  ].filter(Boolean) as string[]

  const expiringSoon = certificates.filter(c =>
    c.expires_at && new Date(c.expires_at) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  )
  const missingDocs = ['CRIMINAL_RECORD', 'CHILD_RECORD', 'CV'].filter(
    type => !documents.find(d => d.document_type === type && ['APPROVED', 'VERIFIED', 'UPLOADED', 'UNVERIFIED'].includes(d.status))
  )

  return (
    <div className="space-y-4 max-w-3xl">

      {/* Alerts */}
      {(missingDocs.length > 0 || expiringSoon.length > 0) && (
        <div className="space-y-2">
          {missingDocs.length > 0 && (
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Manglende påkrævede dokumenter: {missingDocs.map(t => t.replace('_', ' ').toLowerCase()).join(', ')}
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              {expiringSoon.length} certifikat{expiringSoon.length > 1 ? 'er' : ''} udløber inden for 90 dage
            </div>
          )}
        </div>
      )}

      {/* Status + actions */}
      <Card className="!p-5">
        <StatusToggle professionalId={professionalId} currentStatus={pro.status} />
        <div className="mt-3 text-xs text-[#6B7569]">
          Oprettet {new Date(pro.created_at).toLocaleDateString('da-DK')}
          {pro.updated_at && ` · Opdateret ${new Date(pro.updated_at).toLocaleDateString('da-DK')}`}
        </div>
      </Card>

      {/* Profil */}
      <Card className="!p-5">
        <SectionTitle>Profil</SectionTitle>
        <dl className="space-y-0">
          <InfoRow label="Navn" value={profile.full_name} />
          <InfoRow label="E-mail" value={profile.email} />
          <InfoRow label="Jobtitel" value={pro.job_title} />
          <InfoRow label="Telefon" value={pro.phone} />
          <InfoRow label="By" value={[pro.postal_code, pro.city].filter(Boolean).join(' ') || null} />
          <InfoRow label="Region" value={pro.region} />
          <InfoRow label="Profession" value={pro.profession_types?.name ?? pro.profession} />
          <InfoRow label="Uddannelse" value={pro.education} />
          <InfoRow label="Specialisering" value={pro.specialization} />
          <InfoRow label="Autorisation" value={pro.authorization} />
          <InfoRow label="Erfaring (år)" value={pro.experience_years?.toString()} />
          <InfoRow label="Køn" value={pro.gender} />
        </dl>
      </Card>

      {/* Om fagperson */}
      {pro.bio && (
        <Card className="!p-5">
          <SectionTitle>Om fagperson</SectionTitle>
          <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap leading-relaxed">{pro.bio}</p>
        </Card>
      )}

      {/* Kompetencer */}
      <Card className="!p-5 space-y-4">
        <SectionTitle>Kompetencer og profil</SectionTitle>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kernekompetencer</div>
          <ChipList items={competencyNames} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Metoder</div>
          <ChipList items={methodNames} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Målgrupper</div>
          <ChipList items={targetGroupNames} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Arbejdsopgaver</div>
          <ChipList items={workTaskNames} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Sprog</div>
          <ChipList items={languageNames} />
        </div>
      </Card>

      {/* Tilgængelighed + geografi */}
      <Card className="!p-5">
        <SectionTitle>Tilgængelighed og geografi</SectionTitle>
        <dl className="space-y-0">
          <InfoRow label="Timer/uge" value={pro.max_hours_per_week?.toString()} />
          <InfoRow label="Tilgængelighed" value={availabilityFlags.length ? availabilityFlags.join(', ') : null} />
          <InfoRow label="Har kørekort" value={pro.has_drivers_license ? boolLabel(pro.has_drivers_license) : null} />
          <InfoRow label="Har bil" value={pro.has_own_car ? boolLabel(pro.has_own_car) : null} />
          <InfoRow label="Kan transportere borger" value={pro.can_transport_citizen ? boolLabel(pro.can_transport_citizen) : null} />
          <InfoRow label="Kørselsradius" value={pro.max_driving_radius_km ? `${pro.max_driving_radius_km} km` : null} />
          <InfoRow
            label="Kommuner"
            value={geographyNames.length
              ? <div className="flex flex-wrap gap-1.5">{geographyNames.map(n => <span key={n} className="text-xs bg-[#F6F3EE] px-2 py-0.5 rounded-lg">{n}</span>)}</div>
              : null
            }
          />
        </dl>
      </Card>

      {/* Certifikater */}
      <Card className="!p-5">
        <SectionTitle>Certifikater og kurser</SectionTitle>
        {certificates.length === 0 ? (
          <p className="text-sm text-[#C8C0B0]">Ingen certifikater</p>
        ) : (
          <div className="space-y-2">
            {certificates.map(c => {
              const name = c.certificate_types?.name ?? c.custom_name ?? '—'
              const isExpiring = c.expires_at && new Date(c.expires_at) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#F0EBE3] last:border-0">
                  <div>
                    <div className="text-sm font-medium text-[#1A1F1C]">{name}</div>
                    {(c.issued_at || c.expires_at) && (
                      <div className="text-xs text-[#6B7569]">
                        {c.issued_at ? `Udstedt ${new Date(c.issued_at).toLocaleDateString('da-DK')}` : ''}
                        {c.issued_at && c.expires_at ? ' · ' : ''}
                        {c.expires_at ? `Udløber ${new Date(c.expires_at).toLocaleDateString('da-DK')}` : ''}
                      </div>
                    )}
                  </div>
                  {isExpiring && <Badge variant="amber">Udløber snart</Badge>}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Dokumenter */}
      <Card className="!p-5">
        <SectionTitle>Dokumenter</SectionTitle>
        <DocumentSection documents={documents} professionalId={professionalId} />
      </Card>

    </div>
  )
}
