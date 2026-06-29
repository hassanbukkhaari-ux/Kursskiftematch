import { Badge } from '@/components/ui/badge'

type AvailabilityStatus = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE'

const labels: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Tilgængelig',
  PARTIALLY_AVAILABLE: 'Delvis tilgængelig',
  UNAVAILABLE: 'Utilgængelig',
}

const variants: Record<AvailabilityStatus, 'green' | 'amber' | 'red'> = {
  AVAILABLE: 'green',
  PARTIALLY_AVAILABLE: 'amber',
  UNAVAILABLE: 'red',
}

export function AvailabilityBadge({ status }: { status: AvailabilityStatus | string }) {
  const s = (status as AvailabilityStatus) in labels ? (status as AvailabilityStatus) : 'UNAVAILABLE'
  return (
    <Badge variant={variants[s]} dot>
      {labels[s]}
    </Badge>
  )
}

type ProfessionType = 'TEACHER' | 'PEDAGOGUE' | 'NURSE' | 'PSYCHOLOGIST' | 'SOCIAL_WORKER' | 'COUNSELOR' | 'OTHER'

const professionLabels: Record<ProfessionType, string> = {
  TEACHER: 'Lærer',
  PEDAGOGUE: 'Pædagog',
  NURSE: 'Sygeplejerske',
  PSYCHOLOGIST: 'Psykolog',
  SOCIAL_WORKER: 'Socialrådgiver',
  COUNSELOR: 'Konsulent',
  OTHER: 'Andet',
}

export function ProfessionLabel({ profession }: { profession: string }) {
  const label = professionLabels[profession as ProfessionType] ?? profession
  return <span className="text-sm text-[#6B7569]">{label}</span>
}
