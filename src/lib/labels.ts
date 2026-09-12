// Shared display labels for enum-like status/type fields, used across both
// admin and dashboard client components (and the API routes/emails that
// reference the same report types). Kept in one place so a naming change
// only needs to happen once.

export const REPORT_TYPE_LABEL: Record<string, string> = {
  MONTHLY: 'Kort månedlig status',
  EXTENDED: 'Udvidet statusrapport',
  FINAL: 'Afsluttende statusrapport',
}

export const WORK_TYPE_LABEL: Record<string, string> = {
  DIRECT_SESSION: 'Direkte session',
  TRANSPORT: 'Transport',
  DOCUMENTATION: 'Dokumentation',
  COORDINATION: 'Koordinering',
  CRISIS_RESPONSE: 'Krisehåndtering',
  TRAINING: 'Kompetenceudvikling',
  OTHER: 'Andet',
}

export const SESSION_LOG_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Oprettet',
  FINAL: 'Afsluttet',
  CORRECTED: 'Korrigeret',
  ARCHIVED: 'Arkiveret',
}

export const SESSION_LOG_STATUS_BADGE: Record<string, 'default' | 'green' | 'amber'> = {
  DRAFT: 'default',
  FINAL: 'green',
  CORRECTED: 'amber',
  ARCHIVED: 'default',
}
