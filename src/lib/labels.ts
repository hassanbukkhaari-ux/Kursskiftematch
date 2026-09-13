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

export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  INQUIRY_RECEIVED: 'Henvendelse modtaget',
  PROFESSIONAL_APPLICATION_RECEIVED: 'Kontaktpersonansøgning',
  CASE_CREATED: 'Sag oprettet',
  SAFEGUARDING_FLAGGED: 'Bekymring markeret',
  HOURS_SUBMITTED: 'Timer indsendt',
  DOCUMENT_ACTION_REQUIRED: 'Dokument kræver handling',
  CASE_CLOSED: 'Sag lukket',
  HANDOVER_INITIATED: 'Overdragelse initieret',
  PROPOSAL_SENT: 'Forslag sendt',
  PROPOSAL_ACCEPTED: 'Forslag accepteret',
  PROPOSAL_DECLINED: 'Forslag afvist',
  FOLLOW_UP_NEEDED: 'Opfølgning påkrævet',
  STATUS_REPORT_REQUESTED: 'Statusrapport anmodet',
  STATUS_REPORT_REMINDER: 'Påmindelse om statusrapport',
  STATUS_REPORT_SUBMITTED: 'Statusrapport indsendt',
  GRANT_ACTIVATED: 'Bevilling oprettet',
  PROPOSAL_CHANGES_REQUESTED: 'Kommune bad om ændring',
  STATUS_REPORT_SHARED: 'Statusrapport sendt til kommune',
  HOURS_APPROVED: 'Timer godkendt',
  HOURS_REJECTED: 'Timer afvist',
  PROFESSIONAL_ACTIVATED: 'Profil aktiveret',
  HANDOVER_COMPLETED: 'Overdragelse fuldført',
}

export const NOTIFICATION_STATUS_BADGE: Record<string, 'green' | 'amber' | 'red'> = {
  SENT: 'green', PENDING: 'amber', FAILED: 'red',
}
export const NOTIFICATION_STATUS_LABEL: Record<string, string> = {
  SENT: 'Sendt', PENDING: 'Afventer', FAILED: 'Fejl',
}
export const NOTIFICATION_CHANNEL_LABEL: Record<string, string> = {
  EMAIL: 'E-mail', SMS: 'SMS', IN_APP: 'App',
}
