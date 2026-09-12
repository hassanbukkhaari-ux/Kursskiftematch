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
      from: 'Kursskifte <noreply@kursskifte.dk>',
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
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
  const map: Record<NotificationType, { subject: string; body: string }> = {
    INQUIRY_RECEIVED: {
      subject: 'Ny henvendelse modtaget — Kursskifte',
      body: `En ny henvendelse er modtaget og afventer behandling.\n\nHenvendelses-ID: ${entityId}\n\nOpret sagen her:\n${base}/admin/cases`,
    },
    PROFESSIONAL_APPLICATION_RECEIVED: {
      subject: 'Ny fagperson-ansøgning — Kursskifte',
      body: `En ny fagperson-ansøgning er modtaget og afventer godkendelse.\n\nFagperson-ID: ${entityId}\n\nSe ansøgningen her:\n${base}/admin/professionals`,
    },
    CASE_CREATED: {
      subject: 'Ny sag oprettet — Kursskifte',
      body: `En ny sag er oprettet og afventer tildeling af fagperson.\n\nSags-ID: ${entityId}\n\nÅbn sagen:\n${base}/admin/cases/${entityId}`,
    },
    SAFEGUARDING_FLAGGED: {
      subject: 'VIGTIGT: Bekymring om borgerens sikkerhed — Kursskifte',
      body: `En sessionlog har udløst en sikkerhedsflag.\n\nSessionlog-ID: ${entityId}\n\nHandl straks:\n${base}/admin/session-logs/${entityId}`,
    },
    HOURS_SUBMITTED: {
      subject: 'Timer indsendt til godkendelse — Kursskifte',
      body: `Registrerede timer er indsendt til din godkendelse.\n\nTime-ID: ${entityId}\n\nGodkend eller afvis:\n${base}/admin/hours`,
    },
    DOCUMENT_ACTION_REQUIRED: {
      subject: 'Handling påkrævet: Dokument skal genindsendes — Kursskifte',
      body: `Et dokument kræver handling — kontaktpersonen skal genindsende det.\n\nDokument-ID: ${entityId}\n\nSe fagpersonens profil:\n${base}/admin/professionals`,
    },
    CASE_CLOSED: {
      subject: 'Sag afsluttet — Kursskifte',
      body: `En sag er nu afsluttet.\n\nSags-ID: ${entityId}\n\nSe sagen:\n${base}/admin/cases/${entityId}`,
    },
    HANDOVER_INITIATED: {
      subject: 'Overdragelse igangsat — Kursskifte',
      body: `En sag er ved at blive overdraget til en ny kontaktperson.\n\nSags-ID: ${entityId}\n\nFølg op på sagen:\n${base}/admin/cases/${entityId}`,
    },
    PROPOSAL_SENT: {
      subject: 'Forslag sendt til kommunen — Kursskifte',
      body: `Et forslag er sendt til kommunen for sag ${entityId}.\n\nAfvent kommunens svar:\n${base}/admin/cases/${entityId}`,
    },
    PROPOSAL_ACCEPTED: {
      subject: 'Kommunen har accepteret forslaget — Kursskifte',
      body: `Kommunen har accepteret forslaget for sag ${entityId}.\n\nAktivér sagen og del kontaktoplysninger:\n${base}/admin/cases/${entityId}`,
    },
    PROPOSAL_DECLINED: {
      subject: 'Kommunen har afvist forslaget — Kursskifte',
      body: `Kommunen har afvist forslaget for sag ${entityId}.\n\nGennemgå og send et nyt forslag:\n${base}/admin/cases/${entityId}`,
    },
    FOLLOW_UP_NEEDED: {
      subject: 'Opfølgning påkrævet — Kursskifte',
      body: `Der er markeret behov for opfølgning i en sessionslog.\n\nLog-ID: ${entityId}\n\nSe dine sager:\n${base}/dashboard/session-logs`,
    },
    STATUS_REPORT_REQUESTED: {
      subject: 'Ny anmodning om statusrapport — Kursskifte',
      body: `Admin har anmodet om en statusrapport.\n\nAnmodnings-ID: ${entityId}\n\nSe anmodningen:\n${base}/admin/status-reports/${entityId}`,
    },
    STATUS_REPORT_REMINDER: {
      subject: 'Påmindelse om statusrapport — Kursskifte',
      body: `En statusrapport nærmer sig fristen.\n\nAnmodnings-ID: ${entityId}\n\nSe anmodningen:\n${base}/admin/status-reports/${entityId}`,
    },
    STATUS_REPORT_SUBMITTED: {
      subject: 'Statusrapport indsendt — Kursskifte',
      body: `En kontaktperson har indsendt en statusrapport.\n\nAnmodnings-ID: ${entityId}\n\nGennemse rapporten:\n${base}/admin/status-reports/${entityId}`,
    },
    GRANT_ACTIVATED: {
      subject: 'Bevilling oprettet — Kursskifte',
      body: `En ny bevilling er oprettet for en sag.\n\nBevillings-ID: ${entityId}\n\nSe sagen:\n${base}/admin/cases`,
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
