-- =============================================================================
-- Opstartskontakt til kommunens sagsbehandler — påmindelse
--
-- Når kommunen godkender en sag, forventes det i praksis at kontaktpersonen
-- selv tager kontakt til sagsbehandleren for at aftale et opstartsmøde/brief
-- om borgeren. Det stod hidtil ikke nogen steder i systemet — kontaktpersonen
-- fik kun besked om at være tildelt sagen, ikke om at tage det næste skridt.
--
-- Ny type bruges af cron-jobbet der minder kontaktpersonen om at tage kontakt,
-- hvis der ikke er logget nogen kontakt (contact_logs) nogle dage efter sagen
-- blev aktiv.
--
-- Safe: extends an existing CHECK constraint only, same pattern as every
-- prior notification_type addition in this project. No data changes.
-- =============================================================================

BEGIN;

ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS valid_notification_type;
ALTER TABLE public.notification_log ADD CONSTRAINT valid_notification_type CHECK (notification_type IN (
  'INQUIRY_RECEIVED', 'PROFESSIONAL_APPLICATION_RECEIVED', 'CASE_CREATED',
  'SAFEGUARDING_FLAGGED', 'HOURS_SUBMITTED', 'DOCUMENT_ACTION_REQUIRED',
  'CASE_CLOSED', 'HANDOVER_INITIATED', 'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED',
  'PROPOSAL_DECLINED', 'FOLLOW_UP_NEEDED', 'STATUS_REPORT_REQUESTED',
  'STATUS_REPORT_REMINDER', 'STATUS_REPORT_SUBMITTED', 'GRANT_ACTIVATED',
  'PROPOSAL_CHANGES_REQUESTED', 'STATUS_REPORT_SHARED',
  'HOURS_APPROVED', 'HOURS_REJECTED', 'PROFESSIONAL_ACTIVATED', 'HANDOVER_COMPLETED',
  'PROFESSIONAL_AVAILABILITY_PERIOD_ADDED', 'MATCH_OFFERED', 'MATCH_OFFER_DECLINED',
  'STARTUP_CONTACT_REMINDER'
));

COMMIT;
