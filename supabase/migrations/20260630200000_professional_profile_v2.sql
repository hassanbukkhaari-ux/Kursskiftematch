-- =============================================================================
-- PROFESSIONAL PROFILE v2
-- Adds the full competence profile structure needed for Matching v2.
-- Additive only — no existing column, table, or row is altered or dropped
-- except to broaden existing CHECK constraints to accept new values.
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- ── Lookup: profession types ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profession_types (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int     NOT NULL DEFAULT 0
);

INSERT INTO public.profession_types (name, sort_order) VALUES
  ('Pædagog', 10), ('Skolelærer', 20), ('Psykolog', 30),
  ('Socialrådgiver', 40), ('SOSU-assistent', 50), ('Ergoterapeut', 60),
  ('Fysioterapeut', 70), ('Sygeplejerske', 80), ('Mentor', 90),
  ('Kontaktperson', 100), ('Pædagogisk konsulent', 110),
  ('Familiekonsulent', 120), ('Støttepædagog', 130), ('Andet', 999)
ON CONFLICT (name) DO NOTHING;

-- ── Lookup: competency types ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competency_types (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int     NOT NULL DEFAULT 0
);

INSERT INTO public.competency_types (name, sort_order) VALUES
  ('Autisme (ASF)', 10), ('ADHD', 20), ('Selvskade', 30),
  ('Relationsarbejde', 40), ('Konfliktnedtrapning', 50), ('Misbrug', 60),
  ('Angst', 70), ('PTSD', 80), ('Mentor', 90), ('§85-støtte', 100),
  ('Familiearbejde', 110), ('Skoleindsatser', 120), ('Dobbeltdiagnoser', 130),
  ('Psykiatri', 140), ('Hjemløshed', 150), ('Kriminalitet', 160),
  ('Vold og aggressiv adfærd', 170), ('Depression', 180), ('OCD', 190),
  ('Spiseforstyrrelser', 200), ('Selvmordsforebyggelse', 210),
  ('Tilknytningsforstyrrelser', 220), ('Anbringelsesforløb', 230)
ON CONFLICT (name) DO NOTHING;

-- ── Lookup: method types ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.method_types (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int     NOT NULL DEFAULT 0
);

INSERT INTO public.method_types (name, sort_order) VALUES
  ('Low Arousal', 10), ('LA2', 20), ('KRAP', 30), ('Recovery', 40),
  ('Motiverende Samtale (MI)', 50), ('Mentalisering', 60),
  ('Narrativ tilgang', 70), ('Kognitiv tilgang', 80), ('Neuropædagogik', 90),
  ('TEACCH', 100), ('Signs of Safety', 110), ('ICDP', 120),
  ('Marte Meo', 130), ('ABA', 140), ('DBT', 150), ('ACT', 160),
  ('Mindfulness', 170), ('Tilknytningsbaseret arbejde', 180), ('Anden metode', 999)
ON CONFLICT (name) DO NOTHING;

-- ── Lookup: target group types ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.target_group_types (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int     NOT NULL DEFAULT 0
);

INSERT INTO public.target_group_types (name, sort_order) VALUES
  ('ADHD', 10), ('ASF (Autisme)', 20), ('Udviklingshæmning', 30),
  ('Angst', 40), ('Depression', 50), ('PTSD', 60), ('OCD', 70),
  ('Spiseforstyrrelser', 80), ('Selvskade', 90), ('Selvmordsproblematik', 100),
  ('Misbrug', 110), ('Dobbeltdiagnoser', 120), ('Kriminalitet', 130),
  ('Udadreagerende adfærd', 140), ('Vold', 150),
  ('Tilknytningsforstyrrelser', 160), ('Skolevægring', 170),
  ('Familieproblematikker', 180), ('Hjemmebaserede indsatser', 190),
  ('Anbringelser', 200), ('Hjemløshed', 210),
  ('Børn (0–12 år)', 220), ('Unge (13–18 år)', 230), ('Voksne (18+)', 240)
ON CONFLICT (name) DO NOTHING;

-- ── Lookup: work task types ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_task_types (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int     NOT NULL DEFAULT 0
);

INSERT INTO public.work_task_types (name, sort_order) VALUES
  ('§85-støtte', 10), ('Kontaktperson (§52)', 20), ('Mentor', 30),
  ('Ledsagelse', 40), ('Familiebehandling', 50), ('Familiearbejde', 60),
  ('Skoleindsatser', 70), ('Konflikthåndtering', 80), ('Krisestøtte', 90),
  ('Dokumentation', 100), ('Handleplaner', 110),
  ('Tværfagligt samarbejde', 120), ('Netværksmøder', 130),
  ('Samarbejde med skole', 140), ('Samarbejde med psykiatri', 150),
  ('Samarbejde med jobcenter', 160), ('Samarbejde med pårørende', 170),
  ('§107 botilbud', 180), ('§108 botilbud', 190), ('Bostøtte', 200),
  ('Aktivitetstilbud', 210)
ON CONFLICT (name) DO NOTHING;

-- ── Lookup: language types ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.language_types (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int     NOT NULL DEFAULT 0
);

INSERT INTO public.language_types (name, sort_order) VALUES
  ('Dansk', 10), ('Engelsk', 20), ('Arabisk', 30), ('Somali', 40),
  ('Tyrkisk', 50), ('Urdu', 60), ('Farsi/Dari', 70), ('Polsk', 80),
  ('Tysk', 90), ('Fransk', 100), ('Spansk', 110), ('Romanes', 120),
  ('Tigrinja', 130), ('Bosnisk/Kroatisk/Serbisk', 140),
  ('Russisk', 150), ('Vietnamesisk', 160), ('Andet', 999)
ON CONFLICT (name) DO NOTHING;

-- ── Lookup: certificate types ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificate_types (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int     NOT NULL DEFAULT 0
);

INSERT INTO public.certificate_types (name, sort_order) VALUES
  ('Førstehjælp', 10), ('Konflikthåndtering', 20), ('LA2-certificering', 30),
  ('KRAP-uddannelse', 40), ('Medicinhåndtering', 50), ('NADA', 60),
  ('Magtanvendelse', 70), ('Brandbekæmpelse', 80),
  ('MI-uddannelse', 90), ('Signs of Safety', 100), ('Marte Meo', 110),
  ('Neuropædagogik', 120), ('DBT', 130), ('Andet', 999)
ON CONFLICT (name) DO NOTHING;

-- ── Junction: professional ↔ competencies ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professional_competencies (
  professional_id    uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  competency_type_id uuid NOT NULL REFERENCES public.competency_types(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, competency_type_id)
);

-- ── Junction: professional ↔ methods ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professional_methods (
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  method_type_id  uuid NOT NULL REFERENCES public.method_types(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, method_type_id)
);

-- ── Junction: professional ↔ target groups ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.professional_target_groups (
  professional_id     uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  target_group_type_id uuid NOT NULL REFERENCES public.target_group_types(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, target_group_type_id)
);

-- ── Junction: professional ↔ work tasks ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professional_work_tasks (
  professional_id  uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  work_task_type_id uuid NOT NULL REFERENCES public.work_task_types(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, work_task_type_id)
);

-- ── Junction: professional ↔ languages ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professional_languages (
  professional_id  uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  language_type_id uuid NOT NULL REFERENCES public.language_types(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, language_type_id)
);

-- ── Junction: professional ↔ municipalities (geography) ─────────────────
CREATE TABLE IF NOT EXISTS public.professional_geography (
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  municipality_id uuid NOT NULL REFERENCES public.municipalities(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, municipality_id)
);

-- ── Professional certificates (structured) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.professional_certificates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id     uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  certificate_type_id uuid REFERENCES public.certificate_types(id),
  custom_name         text,
  file_url            text,
  file_name           text,
  issued_at           date,
  expires_at          date,
  status              text NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT valid_cert_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'EXPIRING_SOON')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Professional consents (audit trail) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professional_consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  consent_type    text NOT NULL,
    CONSTRAINT valid_consent_type CHECK (consent_type IN (
      'GDPR', 'PRIVACY', 'CONFIDENTIALITY', 'ETHICS', 'TERMS', 'DOCUMENT_STORAGE'
    )),
  accepted_at      timestamptz NOT NULL DEFAULT now(),
  ip_address       inet,
  document_version text        NOT NULL DEFAULT '1.0',
  UNIQUE (professional_id, consent_type)
);

-- ── Extend professionals table ───────────────────────────────────────────
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS job_title           text,
  ADD COLUMN IF NOT EXISTS phone               text,
  ADD COLUMN IF NOT EXISTS address             text,
  ADD COLUMN IF NOT EXISTS postal_code         text,
  ADD COLUMN IF NOT EXISTS city                text,
  ADD COLUMN IF NOT EXISTS region              text,
  ADD COLUMN IF NOT EXISTS profile_image_url   text,
  ADD COLUMN IF NOT EXISTS profession_type_id  uuid REFERENCES public.profession_types(id),
  ADD COLUMN IF NOT EXISTS specialization      text,
  ADD COLUMN IF NOT EXISTS authorization       text,
  ADD COLUMN IF NOT EXISTS bio                 text,
  ADD COLUMN IF NOT EXISTS max_hours_per_week  int,
  ADD COLUMN IF NOT EXISTS available_now       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_take_acute      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_work_evening    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_work_weekend    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_work_night      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_drivers_license boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_own_car         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_transport_citizen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_driving_radius_km int;

-- ── Broaden professional_documents constraints ───────────────────────────
-- Status: keep existing values, add new human-readable ones
ALTER TABLE public.professional_documents DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE public.professional_documents ADD CONSTRAINT valid_status
  CHECK (status IN (
    'PENDING_UPLOAD', 'UNVERIFIED', 'VERIFIED', 'ARCHIVED',
    'MISSING', 'UPLOADED', 'APPROVED', 'REJECTED', 'EXPIRING_SOON'
  ));

-- Document type: add CHILD_RECORD, EDUCATION, AUTHORIZATION
ALTER TABLE public.professional_documents DROP CONSTRAINT IF EXISTS valid_type;
ALTER TABLE public.professional_documents ADD CONSTRAINT valid_type
  CHECK (document_type IN (
    'CV', 'CRIMINAL_RECORD', 'CHILD_PROTECTION', 'CHILD_RECORD',
    'DRIVING_LICENSE', 'QUALIFICATION', 'EDUCATION',
    'INSURANCE', 'AUTHORIZATION', 'OTHER'
  ));

-- ── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_prof_competencies_pid  ON public.professional_competencies(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_methods_pid       ON public.professional_methods(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_target_groups_pid ON public.professional_target_groups(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_work_tasks_pid    ON public.professional_work_tasks(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_languages_pid     ON public.professional_languages(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_geography_pid     ON public.professional_geography(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_certificates_pid  ON public.professional_certificates(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_consents_pid      ON public.professional_consents(professional_id);

-- ── RLS: lookup tables (any authenticated user reads; admin manages) ──────
ALTER TABLE public.profession_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.method_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_group_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_task_types   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profession_types_read"  ON public.profession_types;
DROP POLICY IF EXISTS "profession_types_admin" ON public.profession_types;
CREATE POLICY "profession_types_read"  ON public.profession_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "profession_types_admin" ON public.profession_types FOR ALL    TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "competency_types_read"  ON public.competency_types;
DROP POLICY IF EXISTS "competency_types_admin" ON public.competency_types;
CREATE POLICY "competency_types_read"  ON public.competency_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "competency_types_admin" ON public.competency_types FOR ALL    TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "method_types_read"  ON public.method_types;
DROP POLICY IF EXISTS "method_types_admin" ON public.method_types;
CREATE POLICY "method_types_read"  ON public.method_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "method_types_admin" ON public.method_types FOR ALL    TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "target_group_types_read"  ON public.target_group_types;
DROP POLICY IF EXISTS "target_group_types_admin" ON public.target_group_types;
CREATE POLICY "target_group_types_read"  ON public.target_group_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "target_group_types_admin" ON public.target_group_types FOR ALL    TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "work_task_types_read"  ON public.work_task_types;
DROP POLICY IF EXISTS "work_task_types_admin" ON public.work_task_types;
CREATE POLICY "work_task_types_read"  ON public.work_task_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "work_task_types_admin" ON public.work_task_types FOR ALL    TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "language_types_read"  ON public.language_types;
DROP POLICY IF EXISTS "language_types_admin" ON public.language_types;
CREATE POLICY "language_types_read"  ON public.language_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "language_types_admin" ON public.language_types FOR ALL    TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "certificate_types_read"  ON public.certificate_types;
DROP POLICY IF EXISTS "certificate_types_admin" ON public.certificate_types;
CREATE POLICY "certificate_types_read"  ON public.certificate_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "certificate_types_admin" ON public.certificate_types FOR ALL    TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ── RLS: junction tables (own row or admin) ───────────────────────────────
ALTER TABLE public.professional_competencies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_methods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_target_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_work_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_languages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_geography     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_certificates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_consents      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prof_competencies_policy" ON public.professional_competencies;
CREATE POLICY "prof_competencies_policy" ON public.professional_competencies
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR is_admin())
  WITH CHECK (professional_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "prof_methods_policy" ON public.professional_methods;
CREATE POLICY "prof_methods_policy" ON public.professional_methods
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR is_admin())
  WITH CHECK (professional_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "prof_target_groups_policy" ON public.professional_target_groups;
CREATE POLICY "prof_target_groups_policy" ON public.professional_target_groups
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR is_admin())
  WITH CHECK (professional_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "prof_work_tasks_policy" ON public.professional_work_tasks;
CREATE POLICY "prof_work_tasks_policy" ON public.professional_work_tasks
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR is_admin())
  WITH CHECK (professional_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "prof_languages_policy" ON public.professional_languages;
CREATE POLICY "prof_languages_policy" ON public.professional_languages
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR is_admin())
  WITH CHECK (professional_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "prof_geography_policy" ON public.professional_geography;
CREATE POLICY "prof_geography_policy" ON public.professional_geography
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR is_admin())
  WITH CHECK (professional_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "prof_certificates_policy" ON public.professional_certificates;
CREATE POLICY "prof_certificates_policy" ON public.professional_certificates
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR is_admin())
  WITH CHECK (professional_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "prof_consents_policy" ON public.professional_consents;
CREATE POLICY "prof_consents_policy" ON public.professional_consents
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR is_admin())
  WITH CHECK (professional_id = auth.uid() OR is_admin());

COMMIT;
