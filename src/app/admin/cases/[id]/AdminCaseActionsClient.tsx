'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type GrantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export interface Grant {
  id: string
  granted_hours: number
  period_start: string
  period_end: string
  status: GrantStatus
  approved_at: string | null
}

export interface AvailableProfessional {
  id: string
  full_name: string
}

const HANDOVER_REASONS: { value: string; label: string }[] = [
  { value: 'PROFESSIONAL_UNAVAILABLE', label: 'Fagperson utilgængelig' },
  { value: 'WORKLOAD_EXCEEDED', label: 'For høj arbejdsbyrde' },
  { value: 'REQUEST_PROFESSIONAL', label: 'Ønske fra fagperson' },
  { value: 'REQUEST_CASE', label: 'Ønske fra borger/sag' },
  { value: 'BETTER_MATCH', label: 'Bedre match tilgængeligt' },
  { value: 'SAFEGUARDING_CONCERN', label: 'Bekymring for borger' },
  { value: 'OTHER', label: 'Andet' },
]

const GRANT_STATUS_LABEL: Record<GrantStatus, string> = {
  PENDING: 'Afventer',
  APPROVED: 'Godkendt',
  REJECTED: 'Afvist',
  EXPIRED: 'Udløbet',
}

const GRANT_STATUS_COLOR: Record<GrantStatus, string> = {
  PENDING: 'text-[#92660A] bg-[#FEF2E2] border-[#F5DDB0]',
  APPROVED: 'text-[#1C3829] bg-[#EEF4F0] border-[#D1E7D8]',
  REJECTED: 'text-red-700 bg-red-50 border-red-200',
  EXPIRED: 'text-[#6B7569] bg-[#F6F3EE] border-[#E0DAD0]',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

interface Props {
  caseId: string
  currentStatus: string
  grants: Grant[]
  professionals: AvailableProfessional[]
}

export default function AdminCaseActionsClient({ caseId, currentStatus, grants: initialGrants, professionals }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Close state
  const [showClose, setShowClose] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [retentionYears, setRetentionYears] = useState(5)

  // Grant state
  const [grants, setGrants] = useState<Grant[]>(initialGrants)
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [grantHours, setGrantHours] = useState('')
  const [grantStart, setGrantStart] = useState('')
  const [grantEnd, setGrantEnd] = useState('')

  // Handover state
  const [showHandover, setShowHandover] = useState(false)
  const [handoverReason, setHandoverReason] = useState('')
  const [handoverPro, setHandoverPro] = useState('')
  const [handoverNote, setHandoverNote] = useState('')
  const [handoverUrgent, setHandoverUrgent] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function doFetch(url: string, method: string, body: object) {
    setError(null)
    setSuccess(null)
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.error ?? `Fejl ${res.status}`)
    }
    return res.json()
  }

  function handleClose() {
    if (!closeReason.trim()) { setError('Angiv en årsag'); return }
    startTransition(async () => {
      try {
        await doFetch(`/api/cases/${caseId}/close`, 'POST', {
          reason: closeReason.trim(),
          retention_years: retentionYears,
        })
        setSuccess('Sagen er lukket.')
        setShowClose(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ukendt fejl')
      }
    })
  }

  function handleArchive() {
    if (!confirm('Er du sikker på, at du vil arkivere denne sag?')) return
    startTransition(async () => {
      try {
        await doFetch(`/api/cases/${caseId}`, 'PATCH', { status: 'ARCHIVED' })
        setSuccess('Sagen er arkiveret.')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ukendt fejl')
      }
    })
  }

  function handleAddGrant() {
    const hours = parseFloat(grantHours)
    if (!grantHours || isNaN(hours) || hours <= 0) { setError('Angiv gyldigt antal timer'); return }
    if (!grantStart || !grantEnd) { setError('Angiv start- og slutdato'); return }
    if (grantStart >= grantEnd) { setError('Slutdato skal være efter startdato'); return }
    startTransition(async () => {
      try {
        const newGrant = await doFetch(`/api/cases/${caseId}/grant`, 'POST', {
          granted_hours: hours,
          period_start: grantStart,
          period_end: grantEnd,
        })
        setGrants(prev => [newGrant, ...prev])
        setSuccess('Bevilling oprettet.')
        setShowGrantForm(false)
        setGrantHours('')
        setGrantStart('')
        setGrantEnd('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ukendt fejl')
      }
    })
  }

  function handleHandover() {
    if (!handoverReason) { setError('Vælg en årsag til overdragelse'); return }
    startTransition(async () => {
      try {
        await doFetch(`/api/cases/${caseId}/handover`, 'POST', {
          reason: handoverReason,
          incoming_professional_id: handoverPro || null,
          handover_note: handoverNote || undefined,
          is_urgent: handoverUrgent,
        })
        const msg = handoverPro
          ? 'Overdragelse initieret. Den nye kontaktperson er notificeret.'
          : 'Overdragelse initieret.'
        setSuccess(msg)
        setShowHandover(false)
        setHandoverReason('')
        setHandoverPro('')
        setHandoverNote('')
        setHandoverUrgent(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ukendt fejl')
      }
    })
  }

  const isActive = currentStatus === 'ACTIVE'
  const isCompleted = currentStatus === 'COMPLETED'
  const canClose = isActive || currentStatus === 'OPEN' || currentStatus === 'MATCHED'
  const canArchive = isCompleted
  const canHandover = isActive

  return (
    <div className="space-y-4">

      {/* Feedback */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-[#D1E7D8] bg-[#EEF4F0] px-4 py-3 text-sm text-[#1C3829]">{success}</div>
      )}

      {/* Case status actions */}
      {(canClose || canArchive) && (
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Sagshandlinger</div>
          <div className="space-y-2">
            {canClose && !showClose && (
              <Button
                variant="danger"
                size="sm"
                className="w-full justify-center"
                onClick={() => { setShowClose(true); setShowHandover(false); setShowGrantForm(false) }}
              >
                Luk sag
              </Button>
            )}
            {canArchive && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center"
                loading={pending}
                onClick={handleArchive}
              >
                Arkiver sag
              </Button>
            )}
          </div>

          {showClose && (
            <div className="mt-4 pt-4 border-t border-[#E0DAD0] space-y-3">
              <div className="text-xs font-semibold text-[#1A1F1C]">Luk sag</div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Årsag *</label>
                <textarea
                  value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                  rows={3}
                  className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20 resize-none"
                  placeholder="Beskriv årsagen til lukning..."
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Opbevaringsperiode</label>
                <select
                  value={retentionYears}
                  onChange={e => setRetentionYears(Number(e.target.value))}
                  className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20 bg-white"
                >
                  {[3, 5, 7, 10].map(y => (
                    <option key={y} value={y}>{y} år</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" loading={pending} onClick={handleClose} className="flex-1 justify-center">
                  Bekræft lukning
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowClose(false)}>
                  Annuller
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Grant management */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">Bevillinger</div>
          {!showGrantForm && (
            <button
              onClick={() => { setShowGrantForm(true); setShowHandover(false); setShowClose(false) }}
              className="text-[10px] font-semibold uppercase tracking-widest text-[#1C3829] hover:underline"
            >
              + Ny
            </button>
          )}
        </div>

        {showGrantForm && (
          <div className="mb-4 p-3 bg-[#F6F3EE] rounded-xl space-y-3">
            <div className="text-xs font-semibold text-[#1A1F1C]">Ny bevilling</div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Timer *</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={grantHours}
                onChange={e => setGrantHours(e.target.value)}
                className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20"
                placeholder="F.eks. 10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Startdato *</label>
                <input
                  type="date"
                  value={grantStart}
                  onChange={e => setGrantStart(e.target.value)}
                  className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Slutdato *</label>
                <input
                  type="date"
                  value={grantEnd}
                  onChange={e => setGrantEnd(e.target.value)}
                  className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" loading={pending} onClick={handleAddGrant} className="flex-1 justify-center">
                Opret bevilling
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowGrantForm(false)}>
                Annuller
              </Button>
            </div>
          </div>
        )}

        {grants.length === 0 ? (
          <p className="text-sm text-[#6B7569]">Ingen bevillinger endnu</p>
        ) : (
          <div className="space-y-2">
            {grants.map(g => (
              <div key={g.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-[#1A1F1C]">{g.granted_hours} t</div>
                  <div className="text-[10px] text-[#6B7569]">
                    {formatDate(g.period_start)} – {formatDate(g.period_end)}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${GRANT_STATUS_COLOR[g.status]}`}>
                  {GRANT_STATUS_LABEL[g.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Handover */}
      {canHandover && (
        <Card>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Overdragelse</div>

          {!showHandover ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => { setShowHandover(true); setShowClose(false); setShowGrantForm(false) }}
            >
              Initier overdragelse
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Urgent flag */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={handoverUrgent}
                  onChange={e => setHandoverUrgent(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E0DAD0] text-red-600 focus:ring-red-400"
                />
                <span className="text-sm font-semibold text-red-700">Markér som Akut</span>
              </label>
              {handoverUrgent && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                  Akut overdragelse — den nye kontaktperson vil modtage en markeret notifikation.
                </div>
              )}

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Årsag *</label>
                <select
                  value={handoverReason}
                  onChange={e => setHandoverReason(e.target.value)}
                  className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20 bg-white"
                >
                  <option value="">Vælg årsag...</option>
                  {HANDOVER_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {professionals.length > 0 && (
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">
                    Ny kontaktperson <span className="normal-case font-normal">(valgfri — send notifikation)</span>
                  </label>
                  <select
                    value={handoverPro}
                    onChange={e => setHandoverPro(e.target.value)}
                    className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20 bg-white"
                  >
                    <option value="">Ingen valgt endnu</option>
                    {professionals.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">
                  Intern note <span className="normal-case font-normal">(indgår i notifikation)</span>
                </label>
                <textarea
                  value={handoverNote}
                  onChange={e => setHandoverNote(e.target.value)}
                  rows={2}
                  className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20 resize-none"
                  placeholder="Yderligere information til den nye kontaktperson..."
                />
              </div>

              <div className="flex gap-2">
                <Button variant="primary" size="sm" loading={pending} onClick={handleHandover} className="flex-1 justify-center">
                  Initier overdragelse
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowHandover(false); setHandoverUrgent(false) }}>
                  Annuller
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
