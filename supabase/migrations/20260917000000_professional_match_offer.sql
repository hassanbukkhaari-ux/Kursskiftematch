-- =============================================================================
-- Fagpersonen skal bekræfte tilgængelighed, før forslaget går til kommunen
--
-- Hidtil gik et match direkte til kommunen, så snart admin valgte en
-- kandidat — uden at spørge fagpersonen om de reelt var ledige. Hvis deres
-- profil var forældet (ferie, kapacitet fyldt op osv.), risikerede kommunen
-- at godkende en kandidat der viste sig ikke at være tilgængelig.
--
-- Ny flow: admin vælger en kandidat -> fagpersonen får en forespørgsel
-- ("Vi har et match. Er du ledig?") -> ved accept sendes forslaget først nu
-- til kommunen, som før. Ved afslag vender sagen tilbage så admin kan vælge
-- en anden kandidat.
--
-- case_proposals.status = 'DRAFT' genbruges til den nye "afventer
-- fagpersonens svar"-tilstand (var defineret men aldrig reelt brugt før).
-- 'PROFESSIONAL_DECLINED' er nyt, adskilt fra kommunens egen 'DECLINED'.
--
-- Safe: additiv CHECK-udvidelse + to nye RLS-policies der kun giver
-- fagpersonen adgang til egne rækker. Ingen data ændres.
-- =============================================================================

BEGIN;

ALTER TABLE public.case_proposals DROP CONSTRAINT IF EXISTS valid_proposal_status;
ALTER TABLE public.case_proposals ADD CONSTRAINT valid_proposal_status
  CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'CHANGES_REQUESTED', 'PROFESSIONAL_DECLINED'));

ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notification_log ADD CONSTRAINT valid_notification_type CHECK (notification_type IN (
  'INQUIRY_RECEIVED', 'PROFESSIONAL_APPLICATION_RECEIVED', 'CASE_CREATED',
  'SAFEGUARDING_FLAGGED', 'HOURS_SUBMITTED', 'DOCUMENT_ACTION_REQUIRED',
  'CASE_CLOSED', 'HANDOVER_INITIATED', 'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED',
  'PROPOSAL_DECLINED', 'FOLLOW_UP_NEEDED', 'STATUS_REPORT_REQUESTED',
  'STATUS_REPORT_REMINDER', 'STATUS_REPORT_SUBMITTED', 'GRANT_ACTIVATED',
  'PROPOSAL_CHANGES_REQUESTED', 'STATUS_REPORT_SHARED',
  'HOURS_APPROVED', 'HOURS_REJECTED', 'PROFESSIONAL_ACTIVATED', 'HANDOVER_COMPLETED',
  'PROFESSIONAL_AVAILABILITY_PERIOD_ADDED', 'MATCH_OFFERED', 'MATCH_OFFER_DECLINED'
));

DROP POLICY IF EXISTS "case_proposals_professional_select" ON public.case_proposals;
CREATE POLICY "case_proposals_professional_select" ON public.case_proposals
  FOR SELECT USING (professional_id = auth.uid());

DROP POLICY IF EXISTS "case_proposals_professional_respond" ON public.case_proposals;
CREATE POLICY "case_proposals_professional_respond" ON public.case_proposals
  FOR UPDATE USING (professional_id = auth.uid() AND status = 'DRAFT')
  WITH CHECK (professional_id = auth.uid());

COMMIT;
