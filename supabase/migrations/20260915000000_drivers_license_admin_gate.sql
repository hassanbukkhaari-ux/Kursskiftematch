-- =============================================================================
-- Kørekort skal admin-godkendes, før matching-algoritmen bruger det
--
-- has_drivers_license er et selvrapporteret felt, fagpersonen sætter det
-- selv på sin egen profil (dashboard/profile), og algoritmen har hidtil
-- brugt det direkte som et kritisk kriterie for "kan transportere borgeren"
-- ved akutte/transportkrævende sager — uden nogen admin-kontrol undervejs.
-- Aktiverings-tjekket (status/route.ts) kræver ganske vist et godkendt,
-- ikke-udløbet DRIVING_LICENSE-dokument for at kunne SÆTTE en fagperson til
-- ACTIVE, men intet genvurderer det, hvis fagpersonen selv slår "Har
-- kørekort" til bagefter, mens de allerede er aktive.
--
-- drivers_license_admin_verified er en separat, admin-only kontakt: kun
-- admin kan tænde/slukke den (via UI-knap på fagpersonens profil), og det
-- er DEN algoritmen fremover læser for transport-kriteriet, ikke det
-- selvrapporterede felt.
--
-- Backfill: sæt den til TRUE for fagpersoner der allerede har et godkendt,
-- ikke-udløbet kørekort-dokument, så ingen mister deres nuværende
-- transport-kapacitet i matching ved denne ændring.
--
-- Safe: additiv kolonne med default FALSE, ingen data slettes.
-- =============================================================================

BEGIN;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS drivers_license_admin_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.professionals p
SET drivers_license_admin_verified = TRUE
FROM public.professional_documents d
WHERE d.professional_id = p.id
  AND d.document_type = 'DRIVING_LICENSE'
  AND d.status = 'APPROVED'
  AND d.expiry_date IS NOT NULL
  AND d.expiry_date >= CURRENT_DATE;

COMMIT;
