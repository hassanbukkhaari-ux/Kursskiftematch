-- =============================================================================
-- PHASE 1: CASE INTAKE + MATCHING INPUT MODEL
-- Additive only — no existing column, table, or row is altered or dropped.
-- Idempotent: safe to re-run.
-- =============================================================================

BEGIN;

-- CASES: new intake fields
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS citizen_gender TEXT;
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS valid_citizen_gender;
ALTER TABLE public.cases ADD CONSTRAINT valid_citizen_gender
  CHECK (citizen_gender IS NULL OR citizen_gender IN ('MALE', 'FEMALE', 'OTHER'));

-- PROFESSIONALS: new kontaktperson profile fields
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS certificates TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS daily_occupation TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS experience_with_genders TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS geography TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS valid_gender;
ALTER TABLE public.professionals ADD CONSTRAINT valid_gender
  CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER'));
ALTER TABLE public.professionals DROP CONSTRAINT IF EXISTS valid_experience_with_genders;
ALTER TABLE public.professionals ADD CONSTRAINT valid_experience_with_genders
  CHECK (experience_with_genders <@ ARRAY['BOYS', 'GIRLS']::TEXT[]);

-- LOOKUP TABLES
CREATE TABLE IF NOT EXISTS public.problem_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label_da TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.goals_lookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label_da TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.special_wishes_lookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label_da TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- JUNCTION TABLES
CREATE TABLE IF NOT EXISTS public.case_problem_areas (
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  problem_area_id UUID NOT NULL REFERENCES public.problem_areas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (case_id, problem_area_id)
);
CREATE TABLE IF NOT EXISTS public.case_goals (
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals_lookup(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (case_id, goal_id)
);
CREATE TABLE IF NOT EXISTS public.case_special_wishes (
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  special_wish_id UUID NOT NULL REFERENCES public.special_wishes_lookup(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (case_id, special_wish_id)
);

-- RLS
ALTER TABLE public.problem_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_wishes_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_problem_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_special_wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "problem_areas_select_policy" ON public.problem_areas;
DROP POLICY IF EXISTS "problem_areas_write_policy" ON public.problem_areas;
CREATE POLICY "problem_areas_select_policy" ON public.problem_areas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "problem_areas_write_policy" ON public.problem_areas FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "goals_lookup_select_policy" ON public.goals_lookup;
DROP POLICY IF EXISTS "goals_lookup_write_policy" ON public.goals_lookup;
CREATE POLICY "goals_lookup_select_policy" ON public.goals_lookup FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "goals_lookup_write_policy" ON public.goals_lookup FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "special_wishes_lookup_select_policy" ON public.special_wishes_lookup;
DROP POLICY IF EXISTS "special_wishes_lookup_write_policy" ON public.special_wishes_lookup;
CREATE POLICY "special_wishes_lookup_select_policy" ON public.special_wishes_lookup FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "special_wishes_lookup_write_policy" ON public.special_wishes_lookup FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "case_problem_areas_select_policy" ON public.case_problem_areas;
DROP POLICY IF EXISTS "case_problem_areas_write_policy" ON public.case_problem_areas;
CREATE POLICY "case_problem_areas_select_policy" ON public.case_problem_areas FOR SELECT USING (
  is_admin() OR EXISTS(SELECT 1 FROM public.case_assignments WHERE case_id = case_problem_areas.case_id AND professional_id = auth.uid() AND ended_at IS NULL)
);
CREATE POLICY "case_problem_areas_write_policy" ON public.case_problem_areas FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "case_goals_select_policy" ON public.case_goals;
DROP POLICY IF EXISTS "case_goals_write_policy" ON public.case_goals;
CREATE POLICY "case_goals_select_policy" ON public.case_goals FOR SELECT USING (
  is_admin() OR EXISTS(SELECT 1 FROM public.case_assignments WHERE case_id = case_goals.case_id AND professional_id = auth.uid() AND ended_at IS NULL)
);
CREATE POLICY "case_goals_write_policy" ON public.case_goals FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "case_special_wishes_select_policy" ON public.case_special_wishes;
DROP POLICY IF EXISTS "case_special_wishes_write_policy" ON public.case_special_wishes;
CREATE POLICY "case_special_wishes_select_policy" ON public.case_special_wishes FOR SELECT USING (
  is_admin() OR EXISTS(SELECT 1 FROM public.case_assignments WHERE case_id = case_special_wishes.case_id AND professional_id = auth.uid() AND ended_at IS NULL)
);
CREATE POLICY "case_special_wishes_write_policy" ON public.case_special_wishes FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- VIEW
CREATE OR REPLACE VIEW public.v_case_tags AS
SELECT
  c.id AS case_id,
  COALESCE(pa.codes, ARRAY[]::TEXT[]) AS problem_area_codes,
  COALESCE(gl.codes, ARRAY[]::TEXT[]) AS goal_codes,
  COALESCE(sw.codes, ARRAY[]::TEXT[]) AS special_wish_codes
FROM public.cases c
LEFT JOIN LATERAL (
  SELECT array_agg(p.code ORDER BY p.sort_order) AS codes
  FROM public.case_problem_areas cpa
  JOIN public.problem_areas p ON p.id = cpa.problem_area_id
  WHERE cpa.case_id = c.id
) pa ON true
LEFT JOIN LATERAL (
  SELECT array_agg(g.code ORDER BY g.sort_order) AS codes
  FROM public.case_goals cg
  JOIN public.goals_lookup g ON g.id = cg.goal_id
  WHERE cg.case_id = c.id
) gl ON true
LEFT JOIN LATERAL (
  SELECT array_agg(s.code ORDER BY s.sort_order) AS codes
  FROM public.case_special_wishes csw
  JOIN public.special_wishes_lookup s ON s.id = csw.special_wish_id
  WHERE csw.case_id = c.id
) sw ON true;

-- SEED
INSERT INTO public.problem_areas (code, label_da, sort_order) VALUES
  ('ADHD','ADHD',10),('AUTISM','Autisme',20),('ANXIETY','Angst',30),
  ('DEPRESSION','Depression',40),('SELF_HARM','Selvskade',50),
  ('SUICIDE_RISK','Selvmordsrisiko',60),('EATING_DISORDER','Spiseforstyrrelse',70),
  ('SCHOOL_REFUSAL','Skolevægring',80),('SUBSTANCE_ABUSE','Misbrug',90),
  ('CRIMINALITY','Kriminalitet',100),('VIOLENCE','Vold',110),
  ('FAMILY_ISSUES','Familieproblematikker',120),('LONELINESS','Ensomhed',130),
  ('LOW_WELLBEING','Lav trivsel',140),('OTHER','Andet',999)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.goals_lookup (code, label_da, sort_order) VALUES
  ('MAINTAIN_SCHOOL','Fastholde skole',10),('DAILY_STRUCTURE','Struktur i hverdagen',20),
  ('REDUCE_CONFLICTS','Mindske konflikter',30),('EMPLOYMENT','Beskæftigelse',40),
  ('WELLBEING','Trivsel',50),('INDEPENDENCE','Selvstændighed',60),
  ('RELATIONSHIPS','Relationer',70),('OTHER','Andet',999)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.special_wishes_lookup (code, label_da, sort_order) VALUES
  ('NO_PREFERENCE','Ingen præference',10),('MALE_PROFESSIONAL','Mand',20),
  ('FEMALE_PROFESSIONAL','Kvinde',30),('EXPERIENCE_AUTISM','Erfaring med autisme',40),
  ('EXPERIENCE_ADHD','Erfaring med ADHD',50),('EXPERIENCE_SUBSTANCE_ABUSE','Erfaring med misbrug',60),
  ('DRIVERS_LICENSE','Kørekort',70),('SAME_LANGUAGE_CULTURE','Samme sprog/kultur',80),
  ('OTHER','Andet',999)
ON CONFLICT (code) DO NOTHING;

COMMIT;
