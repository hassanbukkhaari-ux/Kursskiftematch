import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, NotificationType } from '@/types/database'
import { Resend } from 'resend'

type DB = Database

interface SendNotificationParams {
  db: SupabaseClient<DB>
  notification_type: NotificationType
  related_entity_type: string
  related_entity_id: string
  recipient_profile_id?: string
  recipient_email?: string
  subject: string
  body: string
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const {
    db,
    notification_type,
    related_entity_type,
    related_entity_id,
    recipient_profile_id,
    recipient_email,
    subject,
    body,
  } = params

  const email = recipient_email || process.env.SYSTEM_ADMIN_EMAIL!

  const { data: logEntry, error: logError } = await db
    .from('notification_log')
    .insert({
      notification_type,
      related_entity_type,
      related_entity_id,
      recipient_profile_id: recipient_profile_id || null,
      recipient_email: email,
      delivery_channel: 'EMAIL',
      status: 'PENDING',
      attempt_count: 0,
      subject,
      body_text: body,
    })
    .select('id')
    .single()

  if (logError || !logEntry) {
    console.error('[notification] Failed to create notification_log entry:', logError)
    return
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Kursskiftematch <noreply@kursskiftematch.dk>',
      to: email,
      subject,
      text: body,
    })

    await db
      .from('notification_log')
      .update({
        status: 'SENT',
        sent_at: new Date().toISOString(),
        attempt_count: 1,
      })
      .eq('id', logEntry.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .from('notification_log')
      .update({
        status: 'FAILED',
        failed_at: new Date().toISOString(),
        failure_reason: message,
        attempt_count: 1,
      })
      .eq('id', logEntry.id)
  }
}

// Email templates — one function per audience (admin vs professional)
export function adminEmailBody(type: NotificationType, entityId: string): { subject: string; body: string } {
  const map: Record<NotificationType, { subject: string; body: string }> = {
    INQUIRY_RECEIVED: {
      subject: 'Ny henvendelse modtaget — Kursskiftematch',
      body: `En ny henvendelse er modtaget og afventer behandling.\n\nHenvendelses-ID: ${entityId}\n\nLog ind for at behandle henvendelsen.`,
    },
    PROFESSIONAL_APPLICATION_RECEIVED: {
      subject: 'Ny fagperson-ansøgning — Kursskiftematch',
      body: `En ny fagperson-ansøgning er modtaget og afventer godkendelse.\n\nHenvendelses-ID: ${entityId}\n\nLog ind for at behandle ansøgningen.`,
    },
    CASE_CREATED: {
      subject: 'Ny sag oprettet — Kursskiftematch',
      body: `En ny sag er oprettet og afventer tildeling af fagperson.\n\nSags-ID: ${entityId}\n\nLog ind for at starte matching-processen.`,
    },
    SAFEGUARDING_FLAGGED: {
      subject: 'VIGTIGT: Bekymring om borgerens sikkerhed — Kursskiftematch',
      body: `En sessionlog har udløst en sikkerhedsflag.\n\nSessionlog-ID: ${entityId}\n\nLog ind straks for at håndtere bekymringen.`,
    },
    HOURS_SUBMITTED: {
      subject: 'Timer indsendt til godkendelse — Kursskiftematch',
      body: `Registrerede timer er indsendt til din godkendelse.\n\nTime-ID: ${entityId}\n\nLog ind for at godkende eller afvise.`,
    },
    DOCUMENT_ACTION_REQUIRED: {
      subject: 'Handling påkrævet: Dokument skal genindsendes — Kursskiftematch',
      body: `Et af dine dokumenter kræver handling. Venligst indsend dokumentet igen.\n\nDokument-ID: ${entityId}\n\nLog ind for at se detaljerne.`,
    },
    CASE_CLOSED: {
      subject: 'Sag afsluttet — Kursskiftematch',
      body: `En sag du var tilknyttet er nu afsluttet.\n\nSags-ID: ${entityId}\n\nLog ind for at se de afsluttende detaljer.`,
    },
    HANDOVER_INITIATED: {
      subject: 'Du er blevet tildelt en ny sag — Kursskiftematch',
      body: `En sag er ved at blive overdraget til dig.\n\nSags-ID: ${entityId}\n\nLog ind for at se sagen og forberede overdragelsen.`,
    },
  }
  return map[type]
}

export function handoverEmailBody(
  caseId: string,
  outgoingName: string,
  isUrgent: boolean,
  note?: string,
): { subject: string; body: string } {
  const urgentPrefix = isUrgent ? '[AKUT] ' : ''
  const subject = `${urgentPrefix}Du overtager en sag — Kursskiftematch`
  const lines = [
    `Du er blevet tildelt som ny kontaktperson på en sag, der overdrages fra ${outgoingName}.`,
    '',
    `Sags-ID: ${caseId}`,
  ]
  if (isUrgent) lines.push('', '⚠️ Denne overdragelse er markeret som AKUT.')
  if (note) lines.push('', `Note fra administrator:\n${note}`)
  lines.push('', 'Log ind på Kursskiftematch for at se sagen og tilhørende dokumentation.')
  return { subject, body: lines.join('\n') }
}
