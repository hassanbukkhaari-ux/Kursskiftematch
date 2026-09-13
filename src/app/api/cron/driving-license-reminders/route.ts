import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireCronSecret } from '@/lib/cron-auth'
import { sendNotification } from '@/lib/notifications/service'

// GET /api/cron/driving-license-reminders — kørekort skal godkendes af
// admin en gang om året (expiry_date sat automatisk ved godkendelse, se
// /api/profile/documents/[id]). Påminder fagpersonen 30 dage før udløb om
// at indsende nyt billede/dokumentation, så admin kan nå at godkende igen
// inden aktiveringstjekket blokerer dem.
export async function GET(request: NextRequest) {
  const denied = requireCronSecret(request)
  if (denied) return denied

  const svc = createServiceClient() as any

  const today = new Date()
  const in30 = new Date(today); in30.setDate(today.getDate() + 30)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const { data: docs } = await svc
    .from('professional_documents')
    .select('id, professional_id, expiry_date, professionals!inner(profiles!inner(full_name, email))')
    .eq('document_type', 'DRIVING_LICENSE')
    .eq('status', 'APPROVED')
    .lte('expiry_date', fmt(in30))
    .gte('expiry_date', fmt(today))

  if (!docs?.length) return NextResponse.json({ reminded: 0 })

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'
  let reminded = 0

  for (const d of docs) {
    const email = d.professionals?.profiles?.email
    if (!email) continue

    const expiryFormatted = new Date(d.expiry_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })

    await sendNotification({
      db: svc,
      notification_type: 'DOCUMENT_ACTION_REQUIRED',
      related_entity_type: 'professional_documents',
      related_entity_id: d.id,
      recipient_profile_id: d.professional_id,
      recipient_email: email,
      subject: `Påmindelse: kørekort skal genindsendes — udløber ${expiryFormatted}`,
      body: [
        `Hej ${d.professionals?.profiles?.full_name ?? ''},`,
        '',
        `Din kørekort-dokumentation hos Kursskifte udløber ${expiryFormatted}. Kørekort skal dokumenteres og godkendes en gang om året.`,
        '',
        `Send et nyt billede af dit kørekort på din profil, så det kan blive godkendt igen:`,
        `${base}/dashboard/profile`,
      ].join('\n'),
    })
    reminded++
  }

  return NextResponse.json({ reminded })
}
