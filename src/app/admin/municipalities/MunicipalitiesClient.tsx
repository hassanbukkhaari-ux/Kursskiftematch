'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/layout/page-header'

type Municipality = {
  id: string
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  sagsbehandler_name: string | null
  sagsbehandler_email: string | null
  sagsbehandler_phone: string | null
  secondary_contact_name: string | null
  secondary_contact_email: string | null
  secondary_contact_phone: string | null
  created_at: string
}

type FormData = {
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  sagsbehandler_name: string
  sagsbehandler_email: string
  sagsbehandler_phone: string
  secondary_contact_name: string
  secondary_contact_email: string
  secondary_contact_phone: string
}

const EMPTY_FORM: FormData = {
  name: '',
  status: 'ACTIVE',
  sagsbehandler_name: '',
  sagsbehandler_email: '',
  sagsbehandler_phone: '',
  secondary_contact_name: '',
  secondary_contact_email: '',
  secondary_contact_phone: '',
}

const inputClass =
  'w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors'

export function MunicipalitiesClient({ initialData }: { initialData: Municipality[] }) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, startSave] = useTransition()

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setDrawerOpen(true)
  }

  function openEdit(m: Municipality) {
    setEditingId(m.id)
    setForm({
      name: m.name,
      status: m.status,
      sagsbehandler_name: m.sagsbehandler_name ?? '',
      sagsbehandler_email: m.sagsbehandler_email ?? '',
      sagsbehandler_phone: m.sagsbehandler_phone ?? '',
      secondary_contact_name: m.secondary_contact_name ?? '',
      secondary_contact_email: m.secondary_contact_email ?? '',
      secondary_contact_phone: m.secondary_contact_phone ?? '',
    })
    setError(null)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingId(null)
    setError(null)
  }

  function field(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleSave() {
    if (!form.name.trim()) return
    startSave(async () => {
      setError(null)

      const payload: Record<string, string> = {
        name: form.name.trim(),
        status: form.status,
        sagsbehandler_name: form.sagsbehandler_name,
        sagsbehandler_email: form.sagsbehandler_email,
        sagsbehandler_phone: form.sagsbehandler_phone,
        secondary_contact_name: form.secondary_contact_name,
        secondary_contact_email: form.secondary_contact_email,
        secondary_contact_phone: form.secondary_contact_phone,
      }

      const url = editingId ? `/api/municipalities/${editingId}` : '/api/municipalities'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Noget gik galt')
        return
      }

      closeDrawer()
      router.refresh()
    })
  }

  const active = initialData.filter(m => m.status === 'ACTIVE').length
  const inactive = initialData.filter(m => m.status === 'INACTIVE').length

  return (
    <>
      <SectionHeader
        title={`${active} aktive · ${inactive} inaktive`}
        actions={
          <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={openNew}>
            Ny kommune
          </Button>
        }
      />

      {initialData.length === 0 ? (
        <EmptyState
          icon={<MuniIcon size={24} />}
          title="Ingen kommuner endnu"
          description="Opret den første kommuneaftale for at komme i gang med sagsstyring"
          action={
            <Button variant="primary" icon={<PlusIcon />} onClick={openNew}>
              Opret kommune
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {initialData.map(m => (
            <button key={m.id} onClick={() => openEdit(m)} className="w-full text-left block">
              <Card hover className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF4F0] flex items-center justify-center text-[#1C3829] shrink-0">
                    <MuniIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm">{m.name}</div>
                    {(m.sagsbehandler_name || m.sagsbehandler_email) && (
                      <div className="text-xs text-[#6B7569] truncate">
                        {[m.sagsbehandler_name, m.sagsbehandler_email].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={m.status === 'ACTIVE' ? 'green' : 'default'} dot>
                    {m.status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv'}
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
        aria-label={editingId ? 'Rediger kommune' : 'Ny kommune'}
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl',
          'flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E0DAD0] shrink-0">
          <h2 className="font-serif text-lg font-semibold text-[#1A1F1C]">
            {editingId ? 'Rediger kommune' : 'Ny kommune'}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-full bg-[#F6F3EE] hover:bg-[#EEF4F0] flex items-center justify-center text-[#6B7569] hover:text-[#1A1F1C] transition-colors"
            aria-label="Luk"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
                Kommunenavn
              </label>
              <input
                type="text"
                value={form.name}
                onChange={field('name')}
                placeholder="f.eks. Aarhus Kommune"
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {(['ACTIVE', 'INACTIVE'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, status: s }))}
                    className={[
                      'flex-1 h-10 rounded-xl text-sm font-medium border transition-all',
                      form.status === s
                        ? s === 'ACTIVE'
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-[#6B7569] text-white border-[#6B7569]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {s === 'ACTIVE' ? 'Aktiv' : 'Inaktiv'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary contact */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-3">
              Primær kontaktperson (sagsbehandler)
            </div>
            <div className="space-y-3">
              <input type="text" value={form.sagsbehandler_name} onChange={field('sagsbehandler_name')} placeholder="Fuldt navn" className={inputClass} />
              <input type="email" value={form.sagsbehandler_email} onChange={field('sagsbehandler_email')} placeholder="E-mailadresse" className={inputClass} />
              <input type="tel" value={form.sagsbehandler_phone} onChange={field('sagsbehandler_phone')} placeholder="Telefonnummer" className={inputClass} />
            </div>
          </div>

          {/* Secondary contact */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">
              Sekundær kontaktperson
            </div>
            <div className="space-y-3">
              <input type="text" value={form.secondary_contact_name} onChange={field('secondary_contact_name')} placeholder="Fuldt navn" className={inputClass} />
              <input type="email" value={form.secondary_contact_email} onChange={field('secondary_contact_email')} placeholder="E-mailadresse" className={inputClass} />
              <input type="tel" value={form.secondary_contact_phone} onChange={field('secondary_contact_phone')} placeholder="Telefonnummer" className={inputClass} />
            </div>
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
        <div className="px-6 py-4 border-t border-[#E0DAD0] shrink-0 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={closeDrawer} disabled={saving}>
            Annuller
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={saving}
            disabled={!form.name.trim()}
            onClick={handleSave}
          >
            {editingId ? 'Gem ændringer' : 'Opret kommune'}
          </Button>
        </div>
      </aside>
    </>
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

function MuniIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  )
}
