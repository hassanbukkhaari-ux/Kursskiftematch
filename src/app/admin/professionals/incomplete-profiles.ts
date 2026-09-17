import type { ProfessionalRow } from './page'

export type IncompleteProfile = {
  id: string
  full_name: string | null
  email: string
  capacityMissing: boolean
  availabilityMissing: boolean
}

// Same two fields that block activation in
// /api/admin/professionals/[id]/status/route.ts — reused here as the
// definition of "profile still missing info", so this list and that gate
// never disagree with each other.
//
// Kept out of IncompleteProfilesSection.tsx on purpose: that file is
// 'use client', which turns every export (including this plain data
// function) into a client-only reference — calling it from page.tsx (a
// Server Component) threw "toIncompleteProfiles is on the client" on
// every single render.
export function toIncompleteProfiles(professionals: ProfessionalRow[]): IncompleteProfile[] {
  return professionals
    .filter(p => p.status === 'REGISTERED')
    .map(p => ({
      id: p.id,
      full_name: p.profiles?.full_name ?? null,
      email: p.profiles?.email ?? '',
      capacityMissing: !p.capacity_hours_week || p.capacity_hours_week <= 0,
      availabilityMissing: p.availability_status === 'UNAVAILABLE',
    }))
    .filter(p => p.capacityMissing || p.availabilityMissing)
}
