'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ProfessionalDetail, AvailabilityPeriod } from './page'
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
  availabilityPeriods: AvailabilityPeriod[]
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

// ── Capacity + Availability Panel ────────────────────────────────────────

const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: 'Ledig', color: 'text-[#1C3829]', bg: 'bg-[#EEF4F0]', border: 'border-[#C8DDD1]' },
  { value: 'PARTIALLY_AVAILABLE', label: 'Delvist ledig', color: 'text-[#92660A]', bg: 'bg-[#FEF2E2]', border: 'border-[#F5DDB0]' },
  { value: 'UNAVAILABLE', label: 'Ikke ledig', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
]

const PERIOD_TYPE_LABEL: Record<string, string> = {
  VACATION: 'Ferie',
  PAUSE: 'Pause',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function isActivePeriod(period: AvailabilityPeriod): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return period.start_date <= today && (period.end_date == null || period.end_date >= today)
}

function CapacityPanel({
  professionalId,
  professional: pro,
  initialPeriods,
}: {
  professionalId: string
  professional: ProfessionalDetail
  initialPeriods: AvailabilityPeriod[]
}) {
  const router = useRouter()
  const [, startT] = useTransition()

  // Capacity edit state
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoursWeek, setHoursWeek] = useState(String(pro.capacity_hours_week ?? 10))
  const [maxCases, setMaxCases] = useState(String(pro.max_concurrent_cases ?? 3))
  const [availStatus, setAvailStatus] = useState(pro.availability_status ?? 'AVAILABLE')
  const [availFrom, setAvailFrom] = useState(pro.available_from_date ?? '')
  const [availNote, setAvailNote] = useState(pro.availability_note ?? '')

  // Vacation/pause periods state
  const [periods, setPeriods] = useState<AvailabilityPeriod[]>(initialPeriods)
  const [addingPeriod, setAddingPeriod] = useState(false)
  const [periodType, setPeriodType] = useState<'VACATION' | 'PAUSE'>('VACATION')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [periodNote, setPeriodNote] = useState('')
  const [periodSaving, setPeriodSaving] = useState(false)
  const [periodError, setPeriodError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function cancelEdit() {
    setEditing(false)
    setError(null)
    setHoursWeek(String(pro.capacity_hours_week ?? 10))
    setMaxCases(String(pro.max_concurrent_cases ?? 3))
    setAvailStatus(pro.availability_status ?? 'AVAILABLE')
    setAvailFrom(pro.available_from_date ?? '')
    setAvailNote(pro.availability_note ?? '')
  }

  async function saveCapacity() {
    const h = parseFloat(hoursWeek)
    const m = parseInt(maxCases, 10)
    if (isNaN(h) || h <= 0) { setError('Angiv et gyldigt antal timer'); return }
    if (isNaN(m) || m < 1) { setError('Maks. sager skal være mindst 1'); return }

    setSaving(true); setError(null)
    try {
      const body: Record<string, unknown> = {
        capacity_hours_week: h,
        max_concurrent_cases: m,
        availability_status: availStatus,
        availability_note: availNote.trim() || null,
        available_from_date: (availStatus !== 'AVAILABLE' && availFrom) ? availFrom : null,
      }
      const res = await fetch(`/api/professionals/${professionalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? 'Fejl')
        return
      }
      setEditing(false)
      startT(() => router.refresh())
    } catch { setError('Netværksfejl') }
    finally { setSaving(false) }
  }

  async function addPeriod() {
    if (!periodStart) { setPeriodError('Angiv startdato'); return }
    if (periodEnd && periodEnd < periodStart) { setPeriodError('Slutdato kan ikke være før startdato'); return }
    setPeriodSaving(true); setPeriodError(null)
    try {
      const res = await fetch(`/api/professionals/${professionalId}/availability-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_type: periodType,
          start_date: periodStart,
          end_date: periodEnd || null,
          note: periodNote.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setPeriodError((j as { error?: string }).error ?? 'Fejl')
        return
      }
      const data = await res.json()
      setPeriods(prev => [...prev, data].sort((a, b) => a.start_date.localeCompare(b.start_date)))
      setAddingPeriod(false)
      setPeriodStart(''); setPeriodEnd(''); setPeriodNote('')
    } catch { setPeriodError('Netværksfejl') }
    finally { setPeriodSaving(false) }
  }

  async function deletePeriod(periodId: string) {
    setDeletingId(periodId)
    try {
      const res = await fetch(`/api/professionals/${professionalId}/availability-periods/${periodId}`, { method: 'DELETE' })
      if (res.ok) {
        setPeriods(prev => prev.filter(p => p.id !== periodId))
      }
    } catch { /* silent */ }
    finally { setDeletingId(null) }
  }

  const statusOpt = AVAILABILITY_OPTIONS.find(o => o.value === availStatus) ?? AVAILABILITY_OPTIONS[0]
  const currentStatusOpt = AVAILABILITY_OPTIONS.find(o => o.value === (pro.availability_status ?? 'AVAILABLE')) ?? AVAILABILITY_OPTIONS[0]
  const activePeriods = periods.filter(isActivePeriod)

  return (
    <>
      {/* Kapacitetskort */}
      <Card className="!p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Kapacitet og tilgængelighed</SectionTitle>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-[#1C3829] hover:underline"
            >
              Rediger
            </button>
          )}
        </div>

        {activePeriods.length > 0 && (
          <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            Aktiv periode: {activePeriods.map(p =>
              `${PERIOD_TYPE_LABEL[p.period_type]} (${formatDate(p.start_date)}${p.end_date ? ` – ${formatDate(p.end_date)}` : ' →'})`
            ).join(', ')} — ekskluderet fra matching
          </div>
        )}

        {!editing ? (
          <dl className="space-y-0">
            <InfoRow label="Timer pr. uge" value={pro.capacity_hours_week != null ? `${pro.capacity_hours_week} t/uge` : null} />
            <InfoRow label="Maks. sager" value={pro.max_concurrent_cases != null ? `${pro.max_concurrent_cases} sager` : null} />
            <InfoRow
              label="Tilgængelighed"
              value={
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${currentStatusOpt.bg} ${currentStatusOpt.color} border ${currentStatusOpt.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pro.availability_status === 'AVAILABLE' ? 'bg-[#1C3829]' : pro.availability_status === 'PARTIALLY_AVAILABLE' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  {currentStatusOpt.label}
                </span>
              }
            />
            {pro.available_from_date && (
              <InfoRow label="Ledig fra" value={formatDate(pro.available_from_date)} />
            )}
            {pro.availability_note && (
              <InfoRow label="Note" value={pro.availability_note} />
            )}
          </dl>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">Timer pr. uge</label>
                <input
                  type="number" min="1" step="0.5"
                  className="w-full h-9 px-3 bg-[#F6F3EE] rounded-lg text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  value={hoursWeek}
                  onChange={e => setHoursWeek(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">Maks. aktive sager</label>
                <input
                  type="number" min="1" max="20"
                  className="w-full h-9 px-3 bg-[#F6F3EE] rounded-lg text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  value={maxCases}
                  onChange={e => setMaxCases(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-2">Tilgængelighed</label>
              <div className="flex gap-2 flex-wrap">
                {AVAILABILITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAvailStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      availStatus === opt.value
                        ? `${opt.bg} ${opt.color} ${opt.border}`
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {availStatus !== 'AVAILABLE' && (
              <div>
                <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">Ledig fra dato (valgfri)</label>
                <input
                  type="date"
                  className="w-full h-9 px-3 bg-[#F6F3EE] rounded-lg text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  value={availFrom}
                  onChange={e => setAvailFrom(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">Note (intern)</label>
              <input
                type="text"
                placeholder="f.eks. tilbage efter sommerferie, reduceret kapacitet pga. privat aftale"
                className="w-full h-9 px-3 bg-[#F6F3EE] rounded-lg text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                value={availNote}
                onChange={e => setAvailNote(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={saveCapacity}
                disabled={saving}
                className="h-8 px-4 bg-[#1C3829] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5840] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Gemmer…' : 'Gem'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="h-8 px-4 border border-[#E0DAD0] text-xs font-semibold rounded-lg hover:bg-[#F6F3EE] transition-colors"
              >
                Annuller
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Ferier og pauser */}
      <Card className="!p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Ferier og pauser</SectionTitle>
          {!addingPeriod && (
            <button
              onClick={() => setAddingPeriod(true)}
              className="text-xs font-semibold text-[#1C3829] hover:underline"
            >
              + Tilføj periode
            </button>
          )}
        </div>

        {periods.length === 0 && !addingPeriod && (
          <p className="text-sm text-[#C8C0B0]">Ingen planlagte ferier eller pauser</p>
        )}

        {periods.length > 0 && (
          <div className="space-y-2 mb-4">
            {periods.map(p => {
              const isActive = isActivePeriod(p)
              return (
                <div key={p.id} className={`flex items-start justify-between gap-3 py-2 border-b border-[#F0EBE3] last:border-0`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isActive ? 'bg-amber-100 text-amber-800' : 'bg-[#F6F3EE] text-[#6B7569]'}`}>
                        {PERIOD_TYPE_LABEL[p.period_type]}
                      </span>
                      <span className="text-xs text-[#1A1F1C]">
                        {formatDate(p.start_date)}
                        {p.end_date ? ` – ${formatDate(p.end_date)}` : ' (åben slutdato)'}
                      </span>
                      {isActive && <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Aktiv</span>}
                    </div>
                    {p.note && <p className="text-xs text-[#6B7569] mt-0.5">{p.note}</p>}
                  </div>
                  <button
                    onClick={() => deletePeriod(p.id)}
                    disabled={deletingId === p.id}
                    className="shrink-0 text-[10px] font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {deletingId === p.id ? '…' : 'Slet'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {addingPeriod && (
          <div className="space-y-3 border-t border-[#F0EBE3] pt-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-2">Type</label>
              <div className="flex gap-2">
                {(['VACATION', 'PAUSE'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPeriodType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      periodType === t
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]'
                    }`}
                  >
                    {PERIOD_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">Fra dato *</label>
                <input
                  type="date"
                  className="w-full h-9 px-3 bg-[#F6F3EE] rounded-lg text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  value={periodStart}
                  onChange={e => setPeriodStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">Til dato (valgfri)</label>
                <input
                  type="date"
                  className="w-full h-9 px-3 bg-[#F6F3EE] rounded-lg text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  value={periodEnd}
                  onChange={e => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">Note (valgfri)</label>
              <input
                type="text"
                placeholder="f.eks. sommerferie 2026"
                className="w-full h-9 px-3 bg-[#F6F3EE] rounded-lg text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                value={periodNote}
                onChange={e => setPeriodNote(e.target.value)}
              />
            </div>
            {periodError && <p className="text-sm text-red-600">{periodError}</p>}
            <div className="flex gap-2">
              <button
                onClick={addPeriod}
                disabled={periodSaving}
                className="h-8 px-4 bg-[#1C3829] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5840] disabled:opacity-50 transition-colors"
              >
                {periodSaving ? 'Gemmer…' : 'Tilføj'}
              </button>
              <button
                onClick={() => { setAddingPeriod(false); setPeriodError(null); setPeriodStart(''); setPeriodEnd(''); setPeriodNote('') }}
                className="h-8 px-4 border border-[#E0DAD0] text-xs font-semibold rounded-lg hover:bg-[#F6F3EE] transition-colors"
              >
                Annuller
              </button>
            </div>
          </div>
        )}
      </Card>
    </>
  )
}

// ── Document management ──────────────────────────────────────────────────

const DOC_TYPES = [
  { type: 'CRIMINAL_RECORD', label: 'Straffeattest', required: true, managed: true },
  { type: 'CHILD_PROTECTION', label: 'Børneattest', required: true, managed: true },
  { type: 'CV', label: 'CV', required: true, managed: false },
  { type: 'EDUCATION', label: 'Uddannelsesbeviser', required: false, managed: false },
  { type: 'DRIVING_LICENSE', label: 'Kørekort', required: false, managed: false },
  { type: 'AUTHORIZATION', label: 'Autorisation', required: false, managed: false },
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

  async function managedAction(docType: string, action: 'APPROVE' | 'REVOKE') {
    setActing(docType); setError(null)
    try {
      const res = await fetch(`/api/admin/professionals/${professionalId}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_type: docType, action }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? 'Fejl'); return }
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
        const isApproved = ['APPROVED', 'VERIFIED'].includes(status)
        const canAct = doc && ['UPLOADED', 'UNVERIFIED'].includes(status)

        return (
          <div key={dt.type} className={`border rounded-xl p-4 ${isApproved ? 'border-[#A3C4AE] bg-[#F0F7F2]' : 'border-[#E0DAD0]'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1A1F1C]">{dt.label}</span>
                  {dt.required && <span className="text-[10px] text-[#C8C0B0] uppercase tracking-wide">krævet</span>}
                  {dt.managed && <span className="text-[10px] text-[#6B7569] uppercase tracking-wide">indhentes af Kursskifte</span>}
                </div>
                {doc?.file_name && (
                  <div className="text-xs text-[#6B7569] mt-0.5">{doc.file_name}</div>
                )}
                {doc?.uploaded_at && !dt.managed && (
                  <div className="text-xs text-[#6B7569]">
                    Uploadet {new Date(doc.uploaded_at).toLocaleDateString('da-DK')}
                  </div>
                )}
                {doc?.verified_at && (
                  <div className="text-xs text-[#1C3829] font-medium">
                    ✓ Godkendt {new Date(doc.verified_at).toLocaleDateString('da-DK')}
                  </div>
                )}
              </div>
              <Badge variant={DOC_STATUS_BADGE[status] ?? 'default'}>
                {DOC_STATUS_LABEL[status] ?? status}
              </Badge>
            </div>

            {/* Managed docs: admin marks as verified without file upload */}
            {dt.managed && (
              <div className="mt-3">
                {isApproved ? (
                  <button
                    onClick={() => managedAction(dt.type, 'REVOKE')}
                    disabled={acting === dt.type || pending}
                    className="h-8 px-4 border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {acting === dt.type ? 'Behandler…' : 'Fortryd godkendelse'}
                  </button>
                ) : (
                  <button
                    onClick={() => managedAction(dt.type, 'APPROVE')}
                    disabled={acting === dt.type || pending}
                    className="h-8 px-4 bg-[#1C3829] text-white text-xs font-semibold rounded-lg hover:bg-[#2D5840] transition-colors disabled:opacity-50"
                  >
                    {acting === dt.type ? 'Behandler…' : '✓ Markér som indhentet og godkendt'}
                  </button>
                )}
              </div>
            )}

            {/* Uploaded docs: approve / reject flow */}
            {!dt.managed && canAct && (
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

// ── Edit profile panel ───────────────────────────────────────────────────

function EditProfilePanel({
  professionalId,
  profile,
  professional: pro,
}: {
  professionalId: string
  profile: { full_name: string; email: string }
  professional: ProfessionalDetail
}) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(profile.full_name)
  const [email, setEmail] = useState(profile.email)
  const [phone, setPhone] = useState(pro.phone ?? '')
  const [jobTitle, setJobTitle] = useState(pro.job_title ?? '')
  const [address, setAddress] = useState(pro.address ?? '')
  const [postalCode, setPostalCode] = useState(pro.postal_code ?? '')
  const [city, setCity] = useState(pro.city ?? '')
  const [region, setRegion] = useState(pro.region ?? '')

  function cancel() {
    setEditing(false)
    setError(null)
    setFullName(profile.full_name)
    setEmail(profile.email)
    setPhone(pro.phone ?? '')
    setJobTitle(pro.job_title ?? '')
    setAddress(pro.address ?? '')
    setPostalCode(pro.postal_code ?? '')
    setCity(pro.city ?? '')
    setRegion(pro.region ?? '')
  }

  async function save() {
    if (!fullName.trim()) { setError('Navn er påkrævet'); return }
    if (!email.trim()) { setError('Email er påkrævet'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/professionals/${professionalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          job_title: jobTitle.trim() || null,
          address: address.trim() || null,
          postal_code: postalCode.trim() || null,
          city: city.trim() || null,
          region: region.trim() || null,
        }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? 'Fejl'); return }
      setEditing(false)
      startT(() => router.refresh())
    } catch { setError('Netværksfejl') }
    finally { setSaving(false) }
  }

  const inp = 'w-full h-9 px-3 rounded-xl border border-[#E0DAD0] text-sm text-[#1A1F1C] focus:outline-none focus:border-[#1C3829] bg-white'

  if (!editing) return (
    <button onClick={() => setEditing(true)} className="text-xs font-semibold text-[#1C3829] hover:underline">
      Rediger
    </button>
  )

  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Navn *</label>
          <input className={inp} value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Email *</label>
          <input className={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Telefon</label>
          <input className={inp} value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Jobtitel</label>
          <input className={inp} value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Adresse</label>
          <input className={inp} value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Postnummer</label>
          <input className={inp} value={postalCode} onChange={e => setPostalCode(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">By</label>
          <input className={inp} value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Region</label>
          <input className={inp} value={region} onChange={e => setRegion(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" loading={saving} onClick={save}>Gem ændringer</Button>
        <Button variant="ghost" size="sm" onClick={cancel}>Annuller</Button>
      </div>
    </div>
  )
}

// ── Delete / archive professional ─────────────────────────────────────────

function DeletePanel({ professionalId }: { professionalId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function archive() {
    setDeleting(true); setError(null)
    try {
      const res = await fetch(`/api/admin/professionals/${professionalId}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError((j as { error?: string }).error ?? 'Fejl'); return }
      router.push('/admin/professionals')
    } catch { setError('Netværksfejl') }
    finally { setDeleting(false) }
  }

  if (!confirming) return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-red-600 hover:underline"
    >
      Arkiver kontaktperson
    </button>
  )

  return (
    <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
      <p className="text-sm font-medium text-red-800">Er du sikker?</p>
      <p className="text-xs text-red-700">
        Kontaktpersonen sættes til <strong>Arkiveret</strong> og fjernes fra matching. Sagerne bevares i systemet.
        Kontaktpersonen kan ikke have aktive sager.
      </p>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={archive}
          disabled={deleting}
          className="h-8 px-4 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Arkiverer…' : 'Bekræft arkivering'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null) }}
          className="h-8 px-4 border border-red-300 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
        >
          Annuller
        </button>
      </div>
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
  availabilityPeriods,
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
  const missingDocs = ['CRIMINAL_RECORD', 'CHILD_PROTECTION', 'CV'].filter(
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
        <div className="mt-4 pt-4 border-t border-[#F0EBE3]">
          <DeletePanel professionalId={professionalId} />
        </div>
      </Card>

      {/* Profil */}
      <Card className="!p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Profil</SectionTitle>
          <EditProfilePanel professionalId={professionalId} profile={profile} professional={pro} />
        </div>
        {pro.profile_image_url && (
          <div className="mb-4">
            <img
              src={pro.profile_image_url}
              alt={profile.full_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#E0DAD0]"
            />
          </div>
        )}
        <dl className="space-y-0">
          <InfoRow label="Navn" value={profile.full_name} />
          <InfoRow label="E-mail" value={profile.email} />
          <InfoRow label="Jobtitel" value={pro.job_title} />
          <InfoRow label="Telefon" value={pro.phone} />
          <InfoRow label="Adresse" value={[pro.address, pro.postal_code, pro.city].filter(Boolean).join(', ') || null} />
          <InfoRow label="Region" value={pro.region} />
          <InfoRow label="Daglig beskæftigelse" value={pro.daily_occupation} />
          <InfoRow label="Profession" value={pro.profession_types?.name ?? pro.profession} />
          <InfoRow label="Specialisering" value={pro.specialization} />
          <InfoRow label="Autorisation" value={pro.authorization_note} />
          <InfoRow label="Uddannelse" value={pro.education} />
          <InfoRow label="Erfaring (år)" value={pro.experience_years?.toString()} />
          <InfoRow label="Køn" value={pro.gender} />
        </dl>
      </Card>

      {/* Om kontaktperson */}
      {pro.bio && (
        <Card className="!p-5">
          <SectionTitle>Om kontaktperson</SectionTitle>
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

      {/* Kapacitet og tilgængelighed — editbar */}
      <CapacityPanel
        professionalId={professionalId}
        professional={pro}
        initialPeriods={availabilityPeriods}
      />

      {/* Geografi og transport */}
      <Card className="!p-5">
        <SectionTitle>Geografi og transport</SectionTitle>
        <dl className="space-y-0">
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
