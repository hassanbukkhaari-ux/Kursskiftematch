'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Status = 'OPEN' | 'MATCHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
type Complexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type Urgency = 'NORMAL' | 'HURTIG' | 'AKUT'

interface Props {
  caseId: string
  status: Status
  complexityLevel: Complexity
  urgency: Urgency
  weeklyHours: number
  citizenNotes: string | null
  intakeContactName: string | null
  intakeContactEmail: string | null
  intakeContactPhone: string | null
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'OPEN', label: 'Åben' },
  { value: 'MATCHED', label: 'Matchet' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'COMPLETED', label: 'Afsluttet' },
  { value: 'ARCHIVED', label: 'Arkiveret' },
]
const COMPLEXITY_OPTIONS: { value: Complexity; label: string }[] = [
  { value: 'LOW', label: 'Lav' },
  { value: 'MEDIUM', label: 'Mellem' },
  { value: 'HIGH', label: 'Høj' },
  { value: 'CRITICAL', label: 'Kritisk' },
]
const URGENCY_OPTIONS: { value: Urgency; label: string; color: string }[] = [
  { value: 'NORMAL', label: '⚪ Normal', color: 'text-[#6B7569]' },
  { value: 'HURTIG', label: '🟡 Hurtig', color: 'text-amber-700' },
  { value: 'AKUT', label: '🔴 Akut', color: 'text-red-700' },
]

const selectClass = 'w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20 bg-white'

export default function AdminCaseEditClient({ caseId, status, complexityLevel, urgency, weeklyHours, citizenNotes, intakeContactName, intakeContactEmail, intakeContactPhone }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, startSave] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    status,
    complexity_level: complexityLevel,
    urgency,
    weekly_hours: weeklyHours,
    citizen_notes: citizenNotes ?? '',
    intake_contact_name: intakeContactName ?? '',
    intake_contact_email: intakeContactEmail ?? '',
    intake_contact_phone: intakeContactPhone ?? '',
  })

  function handleSave() {
    startSave(async () => {
      setError(null)
      setSuccess(false)
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          complexity_level: form.complexity_level,
          weekly_hours: Number(form.weekly_hours),
          citizen_notes: form.citizen_notes || undefined,
          intake_contact_name: form.intake_contact_name || null,
          intake_contact_email: form.intake_contact_email || null,
          intake_contact_phone: form.intake_contact_phone || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      setSuccess(true)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">Rediger sag</div>
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setError(null); setSuccess(false) }}
            className="text-[10px] font-semibold uppercase tracking-widest text-[#1C3829] hover:underline"
          >
            Rediger
          </button>
        )}
      </div>

      {success && !open && (
        <p className="text-xs text-[#1C3829]">Ændringer gemt.</p>
      )}

      {!open && (
        <div className="space-y-1 text-xs text-[#6B7569]">
          <div><span className="font-medium text-[#1A1F1C]">Status:</span> {STATUS_OPTIONS.find(s => s.value === form.status)?.label}</div>
          <div><span className="font-medium text-[#1A1F1C]">Kompleksitet:</span> {COMPLEXITY_OPTIONS.find(c => c.value === form.complexity_level)?.label}</div>
          <div><span className="font-medium text-[#1A1F1C]">Hastighed:</span> {URGENCY_OPTIONS.find(u => u.value === form.urgency)?.label}</div>
          <div><span className="font-medium text-[#1A1F1C]">Timer/uge:</span> {form.weekly_hours}</div>
          {form.intake_contact_name && (
            <div><span className="font-medium text-[#1A1F1C]">Sagsbehandler:</span> {form.intake_contact_name}</div>
          )}
        </div>
      )}

      {open && (
        <div className="space-y-3">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
          )}

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))} className={selectClass}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Kompleksitet</label>
            <select value={form.complexity_level} onChange={e => setForm(f => ({ ...f, complexity_level: e.target.value as Complexity }))} className={selectClass}>
              {COMPLEXITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Hastighed</label>
            <div className="flex gap-1.5">
              {URGENCY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, urgency: o.value }))}
                  className={[
                    'flex-1 h-8 rounded-xl text-xs font-medium border transition-all',
                    form.urgency === o.value
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                  ].join(' ')}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Timer/uge</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.weekly_hours}
              onChange={e => setForm(f => ({ ...f, weekly_hours: Number(e.target.value) }))}
              className={selectClass}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1">Interne noter</label>
            <textarea
              value={form.citizen_notes}
              onChange={e => setForm(f => ({ ...f, citizen_notes: e.target.value }))}
              rows={3}
              className="w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20 resize-none"
              placeholder="Interne noter om sagen..."
            />
          </div>

          <div className="pt-1 border-t border-[#E0DAD0]">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Sagsbehandler</div>
            <div className="space-y-2">
              <input
                type="text"
                value={form.intake_contact_name}
                onChange={e => setForm(f => ({ ...f, intake_contact_name: e.target.value }))}
                placeholder="Fuldt navn"
                className={selectClass}
              />
              <input
                type="email"
                value={form.intake_contact_email}
                onChange={e => setForm(f => ({ ...f, intake_contact_email: e.target.value }))}
                placeholder="E-mailadresse"
                className={selectClass}
              />
              <input
                type="tel"
                value={form.intake_contact_phone}
                onChange={e => setForm(f => ({ ...f, intake_contact_phone: e.target.value }))}
                placeholder="Telefonnummer"
                className={selectClass}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave} className="flex-1 justify-center">
              Gem
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Annuller
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
