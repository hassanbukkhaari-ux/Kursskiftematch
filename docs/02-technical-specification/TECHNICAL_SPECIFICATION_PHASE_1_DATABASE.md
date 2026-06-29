# Technical Specification: Kurskifte-Match 2.0
## Phase 1: Database Specification

**Document Type:** Technical Specification (Implementation Blueprint)  
**Version:** 1.0 (Based on Architecture v1.0)  
**Audience:** Backend developers, database architects, DevOps  
**Date:** June 27, 2026  
**Status:** APPROVED FOR IMPLEMENTATION  

**Note:** All decisions in this specification trace back to Architecture v1.0 documents (MASTER_DIRECTIVE.md, DOMAIN_MODEL_DATABASE_SPEC.md, PERMISSION_MODEL.md).

---

## TABLE OF CONTENTS

1. Database Specification (this document)
2. API Specification
3. Backend Specification
4. Frontend Specification
5. Matching Engine Specification
6. Security Specification
7. Deployment Specification

---

# PART 1: DATABASE SPECIFICATION

## 1.1 TECHNOLOGY STACK

**Database Engine:** PostgreSQL 15+  
**Hosting:** Supabase (managed PostgreSQL + Auth + RLS)  
**Connection:** Direct PostgreSQL protocol via Supabase  
**ORM/Query:** Supabase JavaScript client or raw SQL  
**Migrations:** Supabase CLI (supabase/migrations directory)  

**Rationale:** Source: MASTER_DIRECTIVE.md (Technology Stack section)

---

## 1.2 SCHEMA OVERVIEW

**Database Name:** kursskifte_match  
**Encoding:** UTF-8  
**Timezone:** UTC  
**Total Tables:** 21 (15 core + 6 supporting)

**Tables by Domain:**

### Professional Domain (2 tables)
- professionals
- professional_documents

### Case Domain (5 tables)
- cases
- case_assignments
- case_grants
- case_complexity_factors
- case_handovers

### Delivery Domain (4 tables)
- session_logs
- registered_hours
- session_log_corrections
- contact_logs

### Matching Domain (2 tables)
- match_runs
- match_candidates

### Municipality Domain (2 tables)
- municipalities
- inbound_inquiries

### Governance Domain (2 tables)
- audit_events
- notification_log

### System Tables (4 tables)
- profiles (auth sync)
- session_log_transfers
- contact_disclosures
- deletion_schedules

---

## 1.3 COMPLETE SCHEMA DEFINITION

### TABLE: profiles (System table, extends Supabase auth.users)

**Purpose:** User accounts (professionals and admins)  
**Source:** Supabase managed table + custom extension

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'professional',
    CONSTRAINT valid_role CHECK (role IN ('admin', 'professional')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
```

**RLS Policy:**
- SELECT: Users can see own profile, admins can see all
- UPDATE: Users can update own profile only
- DELETE: Disallowed (profiles are never deleted — the auth.users ON DELETE CASCADE removes the row if the Supabase auth account is deleted, but the platform never calls DELETE directly)

---

### TABLE: municipalities

**Purpose:** Municipality reference data  
**Owner:** Municipality Domain  
**Cardinality:** 1:N with cases  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
  sagsbehandler_name TEXT,
  sagsbehandler_email TEXT,
  sagsbehandler_phone TEXT,
  secondary_contact_name TEXT,
  secondary_contact_email TEXT,
  secondary_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_municipalities_status ON municipalities(status);
CREATE INDEX idx_municipalities_name ON municipalities(name);
```

**Constraints:**
- status only ACTIVE or INACTIVE
- name unique across system
- sagsbehandler contact optional (can be NULL)

**RLS Policy:**
- SELECT: All authenticated users
- INSERT/UPDATE/DELETE: Admin only

---

### TABLE: inbound_inquiries

**Purpose:** Public intake form submissions (municipality inquiries, professional applications, partner leads)  
**Owner:** Municipality Domain  
**Cardinality:** 1:1 with cases or professionals (after conversion)  
**Source:** WF-002 (Municipality Inquiry to Case Creation), TS-002 §10  
**Access:** INSERT via unauthenticated public endpoint (service_role only); all other operations admin only

```sql
CREATE TABLE inbound_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type TEXT NOT NULL,
    CONSTRAINT valid_submission_type CHECK (submission_type IN (
      'MUNICIPALITY_INQUIRY', 'PROFESSIONAL_APPLICATION', 'PARTNER_LEAD'
    )),
  status TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN (
      'PENDING', 'REVIEWED', 'CONVERTED', 'REJECTED', 'SPAM'
    )),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  submitter_phone TEXT,
  organization_name TEXT,
  message TEXT,
  form_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  source_url TEXT,
  ip_hash TEXT,
  captcha_verified BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_to_type TEXT,
  converted_to_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inbound_inquiries_status ON inbound_inquiries(status);
CREATE INDEX idx_inbound_inquiries_submission_type ON inbound_inquiries(submission_type);
CREATE INDEX idx_inbound_inquiries_submitted_at ON inbound_inquiries(submitted_at DESC);
```

**Constraints:**
- status flow: PENDING → REVIEWED → CONVERTED or REJECTED; PENDING → SPAM (honeypot)
- `converted_to_type` ∈ {'professional', 'case'} when status = CONVERTED (application-layer constraint)
- `reviewed_by` and `reviewed_at` set together when status changes from PENDING
- `captcha_verified` must be TRUE before status can leave PENDING (enforced at API layer)
- submitter_name and submitter_email required; all other fields optional

**RLS Policy:**
- SELECT: Admin only (personal data; not visible to professionals)
- INSERT: System only (via service_role key — public endpoint never uses anon key)
- UPDATE: Admin only
- DELETE: Never (soft delete via status = REJECTED or SPAM)

**GDPR Retention:**
- SPAM and REJECTED after 90 days → physical deletion via WF-013
- CONVERTED: retained with the converted entity (case or professional) — follows their 7-year cycle

---

### TABLE: professionals

**Purpose:** Professional social service providers  
**Owner:** Professional Domain  
**Cardinality:** 1:1 with profiles, 1:N with cases (via CaseAssignment)  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE professionals (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profession TEXT NOT NULL,
    CONSTRAINT valid_profession CHECK (profession IN (
      'TEACHER', 'PEDAGOGUE', 'NURSE', 'PSYCHOLOGIST', 'SOCIAL_WORKER', 'COUNSELOR', 'OTHER'
    )),
  experience_years INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT valid_experience CHECK (experience_years >= 0),
  target_age_groups TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_complexity_level TEXT NOT NULL DEFAULT 'MEDIUM',
    CONSTRAINT valid_complexity CHECK (max_complexity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  qualifications TEXT,
  capacity_hours_week DECIMAL(5, 2) NOT NULL DEFAULT 0,
    CONSTRAINT valid_capacity CHECK (capacity_hours_week >= 0),
  max_concurrent_cases INTEGER NOT NULL DEFAULT 3,
    CONSTRAINT valid_concurrent CHECK (max_concurrent_cases > 0),
  availability_days TEXT[] DEFAULT ARRAY[]::TEXT[],
  availability_status TEXT NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT valid_availability_status CHECK (availability_status IN ('AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE')),
  status TEXT NOT NULL DEFAULT 'REGISTERED',
    CONSTRAINT valid_status CHECK (status IN ('REGISTERED', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_professionals_status ON professionals(status);
CREATE INDEX idx_professionals_availability_status ON professionals(availability_status);
CREATE INDEX idx_professionals_profession ON professionals(profession);
CREATE INDEX idx_professionals_max_complexity ON professionals(max_complexity_level);
```

**Constraints:**
- Can only be assigned to cases when status = 'ACTIVE'
- experience_years >= 0 (non-negative)
- capacity_hours_week >= 0
- max_concurrent_cases > 0
- status: REGISTERED (onboarding) → ACTIVE (ready) → INACTIVE (leave) → ARCHIVED (departed)
- availability_status: AVAILABLE (default, accepting cases) | PARTIALLY_AVAILABLE (limited, still matchable) | UNAVAILABLE (hard exclusion — vacation, sick leave; excluded from v_professionals_available)

**RLS Policy:**
- SELECT: Users see own profile, admins see all
- UPDATE: Users update own availability, admins update all fields
- DELETE: Never (archive only)

**Derived Values (calculated, not stored):**
- current_assigned_load = SUM(hours) from active CaseAssignments
- is_overloaded = (current_assigned_load + new_case_hours) > capacity_hours_week

---

### TABLE: professional_documents

**Purpose:** Credential vault (CV, criminal record, certifications)  
**Owner:** Professional Domain  
**Cardinality:** 1:N with professionals  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE professional_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
    CONSTRAINT valid_type CHECK (document_type IN (
      'CV', 'CRIMINAL_RECORD', 'CHILD_PROTECTION', 'DRIVING_LICENSE', 'QUALIFICATION', 'INSURANCE', 'OTHER'
    )),
  status TEXT NOT NULL DEFAULT 'PENDING_UPLOAD',
    CONSTRAINT valid_status CHECK (status IN ('PENDING_UPLOAD', 'UNVERIFIED', 'VERIFIED', 'ARCHIVED')),
  file_path TEXT,
  file_hash TEXT,
  uploaded_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES profiles(id),
  expiry_date DATE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  verification_notes TEXT,
  re_upload_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_professional_documents_professional_id ON professional_documents(professional_id);
CREATE INDEX idx_professional_documents_status ON professional_documents(status);
CREATE INDEX idx_professional_documents_expiry_date ON professional_documents(expiry_date);
```

**Constraints:**
- file_path and file_hash NULL until uploaded
- uploaded_at and uploaded_by NULL until upload
- verified_at and verified_by NULL until verification
- expiry_date optional (some docs don't expire)

**Derived Values:**
- is_expired = (status = 'VERIFIED' AND expiry_date < TODAY)
- is_expiring_soon = (status = 'VERIFIED' AND expiry_date BETWEEN TODAY AND TODAY + 30 DAYS)

**RLS Policy:**
- SELECT: Professionals see own docs, admins see all
- INSERT: Professionals upload own docs, admins can upload for anyone
- UPDATE: Admins verify (set status, verified_by), professionals cannot update VERIFIED docs
- DELETE: Never (archive only via status change)

---

### TABLE: cases

**Purpose:** Central case entity - citizen support records  
**Owner:** Case Domain  
**Cardinality:** 1:N with case_assignments, case_grants, session_logs  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID NOT NULL REFERENCES municipalities(id),
  status TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT valid_status CHECK (status IN (
      'OPEN', 'MATCHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'
    )),
  citizen_initials CHAR(2) NOT NULL,
  citizen_age_range TEXT NOT NULL,
    CONSTRAINT valid_age CHECK (citizen_age_range IN ('0-5', '6-12', '13-18', '18+')),
  citizen_notes TEXT,
  weekly_hours DECIMAL(5, 2) NOT NULL DEFAULT 0,
    CONSTRAINT valid_hours CHECK (weekly_hours >= 0),
  complexity_level TEXT NOT NULL DEFAULT 'LOW',
    CONSTRAINT valid_complexity CHECK (complexity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  data_retention_expires_at TIMESTAMPTZ
);

CREATE INDEX idx_cases_municipality_id ON cases(municipality_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_complexity_level ON cases(complexity_level);
CREATE INDEX idx_cases_archived_at ON cases(archived_at);
CREATE INDEX idx_cases_data_retention_expires_at ON cases(data_retention_expires_at);
```

**Constraints:**
- citizen_initials: exactly 2 characters (e.g., "AB")
- citizen_age_range: one of 4 ranges (GDPR data minimization)
- citizen_notes: encrypted field (application level)
- weekly_hours >= 0
- Status transitions: OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED
- archived_at NULL until archived
- data_retention_expires_at calculated: archived_at + 7 years

**RLS Policy:**
- SELECT: Admins see all, professionals see assigned cases only
- INSERT/UPDATE: Admin only
- DELETE: Never (soft delete via status=ARCHIVED)

**Derived Values:**
- current_professional_id = (SELECT professional_id FROM case_assignments WHERE case_id = cases.id AND ended_at IS NULL)
- remaining_hours = SUM(granted_hours FROM case_grants) - SUM(approved hours FROM registered_hours)
- is_over_grant = remaining_hours < 0

---

### TABLE: case_complexity_factors

**Purpose:** Structured complexity assessment  
**Owner:** Case Domain  
**Cardinality:** 1:1 with cases  
**Source:** MATCHING_AND_COMPLEXITY_RULES.md

```sql
CREATE TABLE case_complexity_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  mental_health BOOLEAN DEFAULT FALSE,
  family_instability BOOLEAN DEFAULT FALSE,
  school BOOLEAN DEFAULT FALSE,
  violence BOOLEAN DEFAULT FALSE,
  substance_use BOOLEAN DEFAULT FALSE,
  criminality BOOLEAN DEFAULT FALSE,
  multiple_agencies BOOLEAN DEFAULT FALSE,
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_complexity_factors_case_id ON case_complexity_factors(case_id);
```

**Constraints:**
- case_id UNIQUE (one assessment per case)
- All boolean fields default to FALSE
- diagnosis and notes optional

**Derived Values:**
- complexity_level calculated per MATCHING_AND_COMPLEXITY_RULES.md:
  ```
  count = SUM(boolean fields)
  if violence AND substance_use: CRITICAL
  if violence AND criminality: CRITICAL
  if family_instability AND multiple_agencies AND count >= 3: HIGH
  else if count >= 6: CRITICAL
  else if count >= 4: HIGH
  else if count >= 2: MEDIUM
  else: LOW
  ```

**RLS Policy:**
- SELECT: Admins and assigned professionals
- INSERT/UPDATE: Admin only
- DELETE: Never

---

### TABLE: case_assignments

**Purpose:** Temporal professional assignments (NOT cases.professional_id)  
**Owner:** Case Domain  
**Cardinality:** N:1 with cases, N:1 with professionals  
**Pattern:** Write-once temporal history (never update, only end)  
**Source:** ADR-002 (Case Assignment History)

```sql
CREATE TABLE case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  assignment_status TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT valid_status CHECK (assignment_status IN ('ACTIVE', 'TRANSITIONED', 'TERMINATED', 'ARCHIVED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  assignment_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_assignments_case_id ON case_assignments(case_id);
CREATE INDEX idx_case_assignments_professional_id ON case_assignments(professional_id);
CREATE INDEX idx_case_assignments_ended_at ON case_assignments(ended_at);
CREATE INDEX idx_case_assignments_current ON case_assignments(case_id, ended_at) 
  WHERE ended_at IS NULL;

-- Enforce one active assignment per case (NULL ended_at = active)
CREATE UNIQUE INDEX one_active_assignment_per_case 
  ON case_assignments(case_id)
  WHERE ended_at IS NULL;
```

**Constraints:**
- assignment_status: ACTIVE (current), TRANSITIONED (ended for handover), TERMINATED (ended, no new), ARCHIVED
- assignment_reason: text explanation (max 300 chars in application)
- created_at immutable (insertion time only)
- Only ONE active assignment per case at a time (enforced by application logic + unique index in WHERE)

**RLS Policy:**
- SELECT: Admins and assigned professional
- INSERT: Admin only
- UPDATE: Never (immutable, create new record for new assignment)
- DELETE: Never

**Single Source of Truth:**
- Current professional = SELECT professional_id FROM case_assignments WHERE case_id = X AND ended_at IS NULL
- Assignment history = SELECT * FROM case_assignments WHERE case_id = X (all, including ended)

---

### TABLE: case_grants

**Purpose:** Municipal budget allocation per case  
**Owner:** Case Domain  
**Cardinality:** 1:N with cases (one per period)  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE case_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  municipality_id UUID NOT NULL REFERENCES municipalities(id),
  granted_hours DECIMAL(8, 2) NOT NULL,
    CONSTRAINT valid_hours CHECK (granted_hours > 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
    CONSTRAINT valid_period CHECK (period_end > period_start),
  status TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'ACTIVE', 'ARCHIVED', 'REVOKED')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_case_grants_case_id ON case_grants(case_id);
CREATE INDEX idx_case_grants_period ON case_grants(period_start, period_end);
CREATE INDEX idx_case_grants_status ON case_grants(status);
```

**Constraints:**
- granted_hours > 0
- period_end > period_start
- status: PENDING (awaiting activation) → ACTIVE (current period) → ARCHIVED (past)
- Multiple grants per case allowed (sequential periods)

**Derived Values:**
- remaining_hours = granted_hours - SUM(approved registered_hours for this grant period)
- is_within_grant = remaining_hours >= 0

**RLS Policy:**
- SELECT: All authenticated users
- INSERT: Admin only
- UPDATE: Admin only (to change status or amend if error)
- DELETE: Never (archive via status)

---

### TABLE: session_logs

**Purpose:** Professional work documentation (write-once, immutable)  
**Owner:** Delivery Domain  
**Cardinality:** 1:N with cases, 1:N with professionals  
**Pattern:** Write-once after finalization, corrections via separate table  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  session_date DATE NOT NULL,
    CONSTRAINT valid_session_date CHECK (session_date <= CURRENT_DATE),
  duration_minutes INTEGER NOT NULL,
    CONSTRAINT valid_duration CHECK (duration_minutes >= 1),
  status TEXT NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'FINAL', 'CORRECTED', 'ARCHIVED')),
  observations TEXT,
  citizen_mood_tone TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_reason TEXT,
  safeguarding_concern_flag BOOLEAN DEFAULT FALSE,
  safeguarding_detail TEXT,
  safeguarding_acknowledged_at TIMESTAMPTZ,
  safeguarding_acknowledged_by UUID REFERENCES profiles(id),
  participant_names TEXT[],
  location TEXT,
  created_by UUID NOT NULL REFERENCES professionals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_retention_expires_at TIMESTAMPTZ,
  CONSTRAINT valid_final_date CHECK (
    status != 'FINAL' OR created_at IS NOT NULL
  )
);

CREATE INDEX idx_session_logs_case_id ON session_logs(case_id);
CREATE INDEX idx_session_logs_professional_id ON session_logs(professional_id);
CREATE INDEX idx_session_logs_session_date ON session_logs(session_date);
CREATE INDEX idx_session_logs_status ON session_logs(status);
CREATE INDEX idx_session_logs_data_retention ON session_logs(data_retention_expires_at);
```

**Constraints:**
- session_date cannot be in future (`CHECK (session_date <= CURRENT_DATE)` — enforced at database level)
- observations, citizen_mood_tone, safeguarding_detail: encrypted fields (application level)
- participant_names: array of encrypted names (application level)
- location: encrypted field (application level)
- Status: DRAFT (editing allowed) → FINAL (finalized, no direct edits) → CORRECTED (corrected via corrections table) → ARCHIVED (soft deleted)
- created_at immutable (set on creation, never updated)
- NO UNIQUE constraint on (case_id, professional_id, session_date): Professional may have multiple valid sessions per day (e.g., morning and afternoon sessions for same case)

**Duplicate Detection (Service-Level):**
- Backend MUST detect suspicious duplicate entries:
  - Query: Same (case_id, professional_id, session_date) with very similar observations within same hour
  - Action: Warn coordinator but allow if intentional (e.g., scheduled morning + afternoon sessions)
  - Rationale: Prevents accidental re-entry while allowing legitimate multiple sessions per day

**Write-Once Pattern:**
```
DRAFT state:   Professional can edit freely
FINAL state:   Cannot be edited. Corrections via session_log_corrections table.
CORRECTED state: Original unchanged, correction record linked
ARCHIVED state: Soft deleted, no longer queried in API
```

**RLS Policy:**
- SELECT: Professional sees own logs, admins see all
- INSERT: Professional creates draft, can finalize own
- UPDATE DRAFT: Professional only (draft changes)
- UPDATE DRAFT→FINAL: Professional only (finalization)
- UPDATE FINAL: Never (use corrections table instead)
- DELETE: Never (archive only)

**Derived Values:**
- can_edit = (status = 'DRAFT')
- is_finalized = (status IN ('FINAL', 'CORRECTED'))
- hours_worked_estimate = based on session_date + duration (not stored)

---

### TABLE: session_log_corrections

**Purpose:** Immutable correction record (explain changes without storing old values)  
**Owner:** Delivery Domain  
**Cardinality:** 1:N with session_logs  
**Pattern:** Append-only, immutable  
**Source:** ADR-004 (Privacy-Safe Audit Events)

```sql
CREATE TABLE session_log_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id UUID NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
  correction_note TEXT NOT NULL,
  correction_reason TEXT NOT NULL,
    CONSTRAINT valid_reason CHECK (correction_reason IN (
      'TYPO', 'WRONG_TIME', 'CLARIFICATION', 'OMISSION', 'SAFEGUARDING', 'OTHER'
    )),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_log_corrections_session_log_id ON session_log_corrections(session_log_id);
```

**Constraints:**
- No old_value/new_value fields (privacy-safe pattern)
- correction_note explains change without revealing sensitive content
- Example: "Corrected session time from 14:00 to 15:00" (not "citizen was late so changed time")
- created_at immutable

**RLS Policy:**
- SELECT: Professional sees own corrections, admins see all
- INSERT: Professional and admin can create corrections
- UPDATE: Never
- DELETE: Never (immutable)

---

### TABLE: registered_hours

**Purpose:** Time tracking for payroll and grant control  
**Owner:** Delivery Domain  
**Cardinality:** N:1 with cases, N:1 with professionals, optional FK to session_logs  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE registered_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  work_date DATE NOT NULL,
  work_type TEXT NOT NULL,
    CONSTRAINT valid_type CHECK (work_type IN (
      'DIRECT_SESSION', 'TRANSPORT', 'DOCUMENTATION', 'COORDINATION', 'CRISIS_RESPONSE', 'TRAINING', 'OTHER'
    )),
  hours DECIMAL(4, 2) NOT NULL,
    CONSTRAINT valid_hours CHECK (hours >= 0.25 AND hours <= 8),
  session_log_id UUID REFERENCES session_logs(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'OUTSIDE_GRANT')),
  submitted_at TIMESTAMPTZ,
  grant_period_id UUID REFERENCES case_grants(id),
  description TEXT,
  outside_grant_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_by UUID NOT NULL REFERENCES professionals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registered_hours_case_id ON registered_hours(case_id);
CREATE INDEX idx_registered_hours_professional_id ON registered_hours(professional_id);
CREATE INDEX idx_registered_hours_work_date ON registered_hours(work_date);
CREATE INDEX idx_registered_hours_status ON registered_hours(status);
CREATE INDEX idx_registered_hours_session_log_id ON registered_hours(session_log_id);
CREATE INDEX idx_registered_hours_grant_period ON registered_hours(grant_period_id);
```

**Constraints:**
- hours: 0.25 to 8.0 (min 15 mins, max 8 hours per day)
- work_type semantics:
  - DIRECT_SESSION: SHOULD link to session_log_id
  - TRANSPORT, COORDINATION, TRAINING, OTHER: Can be NULL (not session-specific)
  - DOCUMENTATION: Can link to session being documented
- session_log_id optional FK
- Status flow: PENDING → SUBMITTED → APPROVED or REJECTED
- Professional submits hours (PENDING→SUBMITTED); admin approves or rejects (SUBMITTED→APPROVED/REJECTED)
- If hours + approved > grant.granted_hours: Status auto-set to OUTSIDE_GRANT (WF-007)
- reviewed_by and reviewed_at only set when OUTSIDE_GRANT is reviewed

**Duplicate Detection Strategy:**
- No hard UNIQUE constraint (allows legitimate multiple work types on same date)
- Example: Professional may register DIRECT_SESSION (3h) + DOCUMENTATION (1h) on same work_date
- Backend service MUST detect and warn about potential duplicates:
  - Query: Same (case_id, professional_id, work_date, work_type, hours) within 24 hours
  - Action: Alert coordinator before approval (allow if intentional)
  - Rationale: Prevents accidental re-entry while allowing legitimate varied work types

**RLS Policy:**
- SELECT: Professional sees own hours, admins see all
- INSERT: Professional creates entries, admins can create for anyone
- UPDATE: Professional can edit PENDING entries and submit (PENDING→SUBMITTED); admins approve/reject
- DELETE: Never (archive via status)

**Derived Values:**
- hours_approved_for_grant = SUM(hours) WHERE status='APPROVED' AND grant_period_id=X
- grant_remaining = grant.granted_hours - hours_approved_for_grant
- is_within_grant = registered_hours + hours_approved < grant.granted_hours

---

### TABLE: case_handovers

**Purpose:** Structured handover process (professional change)  
**Owner:** Case Domain  
**Cardinality:** 1:N with cases  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE case_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  outgoing_professional_id UUID NOT NULL REFERENCES professionals(id),
  incoming_professional_id UUID REFERENCES professionals(id),
  reason TEXT NOT NULL,
    CONSTRAINT valid_reason CHECK (reason IN (
      'PROFESSIONAL_UNAVAILABLE', 'WORKLOAD_EXCEEDED', 'REQUEST_PROFESSIONAL', 
      'REQUEST_CASE', 'BETTER_MATCH', 'SAFEGUARDING_CONCERN', 'OTHER'
    )),
  status TEXT NOT NULL DEFAULT 'INITIATED',
    CONSTRAINT valid_status CHECK (status IN ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  handover_note TEXT,
  session_logs_transferred BOOLEAN DEFAULT FALSE,
  transferred_session_logs UUID[],
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_case_handovers_case_id ON case_handovers(case_id);
CREATE INDEX idx_case_handovers_status ON case_handovers(status);
```

**Constraints:**
- handover_note encrypted (application level)
- incoming_professional_id NULL if case terminating
- Status: INITIATED → IN_PROGRESS → COMPLETED or CANCELLED
- transferred_session_logs array of session_log IDs transferred to incoming professional

**RLS Policy:**
- SELECT: Admins only
- INSERT: Admins only (trigger handover)
- UPDATE: Admins only (progress through handover)
- DELETE: Never

---

### TABLE: session_log_transfers

**Purpose:** Immutable audit trail for session sharing  
**Owner:** Delivery Domain  
**Cardinality:** 1:N with session_logs  
**Pattern:** Append-only, immutable  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE session_log_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id UUID NOT NULL REFERENCES session_logs(id),
  from_professional_id UUID NOT NULL REFERENCES professionals(id),
  to_professional_id UUID NOT NULL REFERENCES professionals(id),
  approved_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  transfer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visibility_granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_log_transfers_session_log_id ON session_log_transfers(session_log_id);
CREATE INDEX idx_session_log_transfers_to_professional_id ON session_log_transfers(to_professional_id);
```

**Constraints:**
- Immutable (insert only, no updates)
- Requires admin approval (approved_by)
- reason and transfer_note document why transfer happened

**RLS Policy:**
- SELECT: Professional sees transfers where they're recipient, admins see all
- INSERT: Admin only
- UPDATE: Never
- DELETE: Never

---

### TABLE: contact_logs

**Purpose:** Professional-sagsbehandler communication record  
**Owner:** Delivery Domain  
**Cardinality:** N:1 with cases  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE contact_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  contact_type TEXT NOT NULL,
    CONSTRAINT valid_type CHECK (contact_type IN ('PHONE_CALL', 'EMAIL', 'IN_PERSON', 'OTHER')),
  logged_at TIMESTAMPTZ NOT NULL,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  note TEXT,
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_logs_case_id ON contact_logs(case_id);
CREATE INDEX idx_contact_logs_professional_id ON contact_logs(professional_id);
CREATE INDEX idx_contact_logs_logged_at ON contact_logs(logged_at);
```

**Constraints:**
- note and outcome encrypted (application level)
- contact_type: PHONE_CALL, EMAIL, IN_PERSON (no IN_APP in MVP)
- logged_at: when communication happened
- created_at: when logged in system (may differ from logged_at)

**RLS Policy:**
- SELECT: Professional sees own logs, admins see all
- INSERT: Professional and admin can log
- UPDATE: Never (append-only)
- DELETE: Never

---

### TABLE: contact_disclosures

**Purpose:** Immutable audit trail of sagsbehandler contact sharing  
**Owner:** Delivery Domain  
**Cardinality:** 1:N with cases  
**Pattern:** Append-only, immutable  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE contact_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  disclosed_to_professional_id UUID NOT NULL REFERENCES professionals(id),
  disclosed_by UUID NOT NULL REFERENCES profiles(id),
  disclosed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contact_method TEXT NOT NULL,
    CONSTRAINT valid_method CHECK (contact_method IN ('EMAIL', 'PHONE', 'MEETING')),
  sagsbehandler_name TEXT,
  sagsbehandler_email TEXT,
  sagsbehandler_phone TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_disclosures_case_id ON contact_disclosures(case_id);
CREATE INDEX idx_contact_disclosures_disclosed_to_professional_id ON contact_disclosures(disclosed_to_professional_id);
```

**Constraints:**
- Immutable (insert only)
- contact_method: EMAIL (sent email), PHONE (provided number), MEETING (in-person)
- sagsbehandler_* fields snapshot contact at time of disclosure
- reason encrypted (application level)

**RLS Policy:**
- SELECT: Admin only (professionals do NOT read from this table — contact info is delivered externally via email, phone, or meeting at time of disclosure per WF-009. This is a deliberate design decision: professionals cannot browse the audit trail, and no lookup endpoint exists for them.)
- INSERT: Admin only
- UPDATE: Never (immutable)
- DELETE: Never (immutable)

---

### TABLE: match_runs

**Purpose:** Admin-triggered matching session  
**Owner:** Matching Domain  
**Cardinality:** 1:N with cases  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE match_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id),
  triggered_by UUID NOT NULL REFERENCES profiles(id),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'INITIATED',
    CONSTRAINT valid_status CHECK (status IN (
      'INITIATED', 'SCORED', 'ASSIGNED', 'OVERRIDDEN', 'CANCELLED'
    )),
  algorithm_version TEXT NOT NULL DEFAULT '1.0',
  final_assignment_id UUID REFERENCES case_assignments(id),
  assigned_at TIMESTAMPTZ,
  selected_by UUID REFERENCES profiles(id),
  selected_at TIMESTAMPTZ,
  selected_reason TEXT,
  matching_criteria JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_runs_case_id ON match_runs(case_id);
CREATE INDEX idx_match_runs_status ON match_runs(status);
CREATE INDEX idx_match_runs_algorithm_version ON match_runs(algorithm_version);

-- Prevents concurrent active match runs for the same case (at most one INITIATED or SCORED run per case)
CREATE UNIQUE INDEX idx_match_runs_active_per_case
  ON match_runs(case_id)
  WHERE status IN ('INITIATED', 'SCORED');
```

**Constraints:**
- Status: INITIATED → SCORED → ASSIGNED (human decides) or OVERRIDDEN (chose different) or CANCELLED
- algorithm_version immutable (records v1.0, v1.1, etc. used)
- final_assignment_id set when assignment created from match decision
- selected_reason encrypted (application level), explains if overriding recommendation
- matching_criteria JSONB stores input factors (case complexity, professional pool size, etc.)
- Immutable: scores never change, historical scores preserved for explainability

**RLS Policy:**
- SELECT: Admins only
- INSERT: System (backend match trigger)
- UPDATE: Admin (to mark assigned, set selected decision)
- DELETE: Never

---

### TABLE: match_candidates

**Purpose:** Scored candidate for match run  
**Owner:** Matching Domain  
**Cardinality:** N:1 with match_runs  
**Source:** DOMAIN_MODEL_DATABASE_SPEC.md

```sql
CREATE TABLE match_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_run_id UUID NOT NULL REFERENCES match_runs(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  rank INTEGER NOT NULL,
  overall_score DECIMAL(5, 2) NOT NULL,
    CONSTRAINT valid_score CHECK (overall_score >= 0 AND overall_score <= 100),
  qualifications_score DECIMAL(5, 2) NOT NULL,
  availability_score DECIMAL(5, 2) NOT NULL,
  capacity_score DECIMAL(5, 2) NOT NULL,
  complexity_fit_score DECIMAL(5, 2) NOT NULL,
  algorithm_version TEXT NOT NULL DEFAULT '1.0',
  scoring_explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_candidates_match_run_id ON match_candidates(match_run_id);
CREATE INDEX idx_match_candidates_professional_id ON match_candidates(professional_id);
CREATE INDEX idx_match_candidates_rank ON match_candidates(match_run_id, rank);
CREATE UNIQUE INDEX idx_match_candidates_unique_rank 
  ON match_candidates(match_run_id, rank);
```

**Constraints:**
- Rank: 1, 2, 3, ... (unique per match run)
- all_scores: 0-100 (weighted average = overall_score)
- Immutable: scores never change (historical record)
- scoring_explanation encrypted (application level)
- algorithm_version matches match_run.algorithm_version

**Score Interpretation:**
- 80-100: Excellent fit
- 60-79: Good fit
- 40-59: Acceptable fit
- 20-39: Poor fit
- < 20: Not recommended

**RLS Policy:**
- SELECT: Admins only
- INSERT: System (backend scoring)
- UPDATE: Never
- DELETE: Never

---

### TABLE: audit_events

**Purpose:** Immutable, privacy-safe event log  
**Owner:** Governance Domain  
**Cardinality:** 1:N (all domains publish events)  
**Pattern:** Insert-only, immutable, enforced by RLS  
**Source:** ADR-004 (Privacy-Safe Audit Events)

```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX idx_audit_events_resource_type ON audit_events(resource_type);
CREATE INDEX idx_audit_events_resource_id ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
```

**Constraints:**
- Immutable: RLS prevents UPDATE/DELETE
- INSERT only for application/system processes
- metadata JSONB schema-validated per event_type (no sensitive data)
- actor_id NULL for system events (e.g., scheduled deletion)

**Event Metadata Examples:**
```json
CASE_CREATED: { "citizen_initials": "AB", "municipality_id": "..." }
CASE_ACTIVATED: { "case_id": "...", "activated_by": "...", "grant_id": "..." }
PROFESSIONAL_APPROVED: { "profession": "PEDAGOGUE", "max_complexity": "HIGH" }
GRANT_ACTIVATED: { "grant_id": "...", "case_id": "...", "activated_by": "..." }
HOURS_APPROVED: { "case_id": "...", "hours": 4.5, "status": "APPROVED" }
SESSION_LOG_CREATED: { "case_id": "...", "professional_id": "...", "session_date": "..." }
SESSION_LOG_FINALIZED: { "session_log_id": "...", "professional_id": "...", "case_id": "..." }
SESSION_LOG_CORRECTED: { "correction_reason": "TYPO", "session_log_id": "..." }
SESSION_LOG_CORRECTION_SUBMITTED: { "session_log_id": "...", "correction_reason": "TYPO" }
SAFEGUARDING_CONCERN_FLAGGED: { "session_log_id": "...", "case_id": "...", "professional_id": "..." }
SAFEGUARDING_CONCERN_ACKNOWLEDGED: { "session_log_id": "...", "acknowledged_by": "..." }
DATA_DELETED: { "record_type": "case", "retention_years": 7 }
```

**RLS Policy:**
- SELECT: Admins see all, professionals see only own actions (actor_id = auth.uid())
- INSERT: Application only (via trigger or explicit logging)
- UPDATE: Never (enforced by RLS)
- DELETE: Never (enforced by RLS)

---

### TABLE: notification_log

**Purpose:** Record of all outbound notifications dispatched as side effects of workflow state transitions  
**Owner:** Governance Domain  
**Cardinality:** 1:N (one notification per state transition event)  
**Source:** ADR-010 (Notification Architecture), TS-002 §9.4–9.5  
**Pattern:** Append-only per notification; status transitions (PENDING → SENT / FAILED) tracked via UPDATE

```sql
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
    CONSTRAINT valid_notification_type CHECK (notification_type IN (
      'INQUIRY_RECEIVED',
      'PROFESSIONAL_APPLICATION_RECEIVED',
      'CASE_CREATED',
      'SAFEGUARDING_FLAGGED',
      'HOURS_SUBMITTED',
      'DOCUMENT_ACTION_REQUIRED',
      'CASE_CLOSED'
    )),
  related_entity_type TEXT NOT NULL,
  related_entity_id UUID NOT NULL,
  recipient_profile_id UUID REFERENCES profiles(id),
  recipient_email TEXT,
  delivery_channel TEXT NOT NULL DEFAULT 'EMAIL',
    CONSTRAINT valid_delivery_channel CHECK (delivery_channel IN (
      'EMAIL', 'IN_APP', 'SMS', 'PUSH', 'TEAMS', 'SLACK'
    )),
  status TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT valid_attempt_count CHECK (attempt_count >= 0 AND attempt_count <= 3),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  CONSTRAINT recipient_required CHECK (
    recipient_profile_id IS NOT NULL OR recipient_email IS NOT NULL
  )
);

CREATE INDEX idx_notification_log_status ON notification_log(status);
CREATE INDEX idx_notification_log_notification_type ON notification_log(notification_type);
CREATE INDEX idx_notification_log_related_entity ON notification_log(related_entity_type, related_entity_id);
CREATE INDEX idx_notification_log_created_at ON notification_log(created_at DESC);
CREATE INDEX idx_notification_log_recipient_profile_id ON notification_log(recipient_profile_id)
  WHERE recipient_profile_id IS NOT NULL;
```

**Constraints:**
- `recipient_profile_id` OR `recipient_email` must be non-null (CHECK constraint enforces at least one)
- `attempt_count` capped at 3; retry blocked at API layer when attempt_count >= 3 (ADR-010)
- `sent_at` set when status → SENT; `failed_at` set when status → FAILED (both NULL initially)
- `related_entity_type` matches the table name of the triggering entity (e.g., 'cases', 'registered_hours')
- For MVP: `delivery_channel = 'EMAIL'` only; other channels reserved for Phase 2

**Supported MVP notification types and triggers:**

| notification_type | Trigger event | Recipient |
|---|---|---|
| `INQUIRY_RECEIVED` | Inbound inquiry submitted | SYSTEM_ADMIN_EMAIL |
| `PROFESSIONAL_APPLICATION_RECEIVED` | Professional application submitted | SYSTEM_ADMIN_EMAIL |
| `CASE_CREATED` | Case created from inquiry | SYSTEM_ADMIN_EMAIL |
| `SAFEGUARDING_FLAGGED` | Session log with safeguarding_concern_flag = TRUE | SYSTEM_ADMIN_EMAIL |
| `HOURS_SUBMITTED` | registered_hours status → SUBMITTED | SYSTEM_ADMIN_EMAIL |
| `DOCUMENT_ACTION_REQUIRED` | professional_documents re_upload_required set TRUE | professional (via recipient_profile_id) |
| `CASE_CLOSED` | Case status → COMPLETED | professional (via recipient_profile_id) |

**RLS Policy:**
- SELECT: Admin only
- INSERT: System only (application dispatches notifications as side effects of state transitions)
- UPDATE: System only (to update status, sent_at, failed_at, attempt_count on retry)
- DELETE: Never

---

### TABLE: deletion_schedules

**Purpose:** Track records scheduled for deletion (GDPR)  
**Owner:** Governance Domain  
**Cardinality:** 1:N  
**Source:** WF-013 (GDPR Retention and Deletion)

```sql
CREATE TABLE deletion_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  scheduled_for_deletion_at TIMESTAMPTZ NOT NULL,
  retention_expired_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
    CONSTRAINT valid_reason CHECK (reason IN (
      'RETENTION_EXPIRED', 'USER_REQUEST', 'LEGAL_REQUIREMENT'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

CREATE INDEX idx_deletion_schedules_scheduled_for_deletion_at ON deletion_schedules(scheduled_for_deletion_at);
CREATE INDEX idx_deletion_schedules_executed_at ON deletion_schedules(executed_at)
  WHERE executed_at IS NULL;

-- Prevents duplicate deletion entries for the same record (idempotency guard)
CREATE UNIQUE INDEX idx_deletion_schedules_unique_pending
  ON deletion_schedules(record_type, record_id)
  WHERE executed_at IS NULL;
```

**Constraints:**
- executed_at NULL until deletion happens
- scheduled_for_deletion_at: when to execute deletion
- retention_expired_at: when retention period ended

**RLS Policy:**
- SELECT: Admin only
- INSERT: System only (backend retention scheduler)
- UPDATE: System only (to mark executed_at)
- DELETE: Never

---

## 1.4 VIEWS

### VIEW: v_cases_with_professional

**Purpose:** Cases with current professional (easier querying)  
**Source:** Case → CaseAssignment join

```sql
CREATE VIEW v_cases_with_professional AS
SELECT
  c.id,
  c.municipality_id,
  c.status,
  c.citizen_initials,
  c.citizen_age_range,
  c.complexity_level,
  ca.professional_id,
  ca.id as assignment_id,
  ca.started_at as assignment_started_at,
  cg.granted_hours as active_grant_hours,
  rh.approved_hours_used
FROM cases c
LEFT JOIN case_assignments ca ON c.id = ca.case_id AND ca.ended_at IS NULL
LEFT JOIN LATERAL (
  SELECT granted_hours
  FROM case_grants
  WHERE case_id = c.id AND status = 'ACTIVE'
  LIMIT 1
) cg ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(hours), 0) AS approved_hours_used
  FROM registered_hours
  WHERE case_id = c.id AND status = 'APPROVED'
) rh ON true;
```

> **Performance note:** LATERAL JOINs replace the prior correlated subqueries. The planner can cache and pipeline these; correlated subqueries re-executed per row could cause O(n) round-trips on large result sets.

**RLS Policy:** Inherit from cases

---

### VIEW: v_professionals_available

**Purpose:** Professionals eligible for matching (ACTIVE status, not UNAVAILABLE, not overloaded)  
**Source:** Professionals + CaseAssignments

```sql
CREATE VIEW v_professionals_available AS
SELECT
  p.id,
  p.profession,
  p.experience_years,
  p.max_complexity_level,
  p.capacity_hours_week,
  p.max_concurrent_cases,
  p.availability_status,
  COUNT(ca.id) as current_assignments,
  COALESCE(SUM(c.weekly_hours), 0) as current_hours_assigned
FROM professionals p
LEFT JOIN case_assignments ca ON p.id = ca.professional_id AND ca.ended_at IS NULL
LEFT JOIN cases c ON ca.case_id = c.id AND c.status = 'ACTIVE'
WHERE p.status = 'ACTIVE'
  AND p.availability_status != 'UNAVAILABLE'
GROUP BY p.id
HAVING
  COUNT(ca.id) < p.max_concurrent_cases
  AND COALESCE(SUM(c.weekly_hours), 0) < p.capacity_hours_week;
```

> **Fix note:** `AND c.status = 'ACTIVE'` added to the cases JOIN. Without this filter, COMPLETED/ARCHIVED case hours would count toward a professional's capacity, incorrectly blocking them from new matches.

**RLS Policy:** Inherit from professionals

---

### VIEW: v_grant_usage

**Purpose:** Grant status per case

```sql
CREATE VIEW v_grant_usage AS
SELECT
  cg.id,
  cg.case_id,
  cg.granted_hours,
  COALESCE(SUM(rh.hours), 0) as approved_hours,
  (cg.granted_hours - COALESCE(SUM(rh.hours), 0)) as remaining_hours,
  (cg.granted_hours - COALESCE(SUM(rh.hours), 0)) < 0 as over_grant
FROM case_grants cg
LEFT JOIN registered_hours rh ON cg.id = rh.grant_period_id AND rh.status = 'APPROVED'
GROUP BY cg.id;
```

**RLS Policy:** Inherit from case_grants

---

## 1.5 ROW-LEVEL SECURITY (RLS) POLICIES

All policies enforced at database level via PostgreSQL RLS + Supabase.

**Policy Design Principles (PostgreSQL Best Practices):**
- SELECT: Use USING to filter readable rows
- INSERT: Use WITH CHECK to validate new rows before insertion
- UPDATE: Use USING to select existing rows AND WITH CHECK to validate new row state
- DELETE: Block via USING (FALSE) except retention cleanup processes

### Policy: professionals (SELECT)

```sql
CREATE POLICY "professionals_select_policy" ON professionals
  FOR SELECT
  USING (
    auth.uid() = id  -- User can see own profile
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );
```

### Policy: professionals (INSERT)

```sql
CREATE POLICY "professionals_insert_policy" ON professionals
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: professionals (UPDATE)

```sql
CREATE POLICY "professionals_update_policy" ON professionals
  FOR UPDATE
  USING (
    auth.jwt()->>'role' = 'admin'  -- Admin can update any professional
    OR auth.uid() = id             -- Professional can update own row (availability/capacity)
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'  -- Admin can set any field
    OR auth.uid() = id             -- Professional updates own row (application layer restricts to: availability_days, availability_status, capacity_hours_week, max_concurrent_cases)
  );
```

### Policy: professionals (DELETE)

```sql
CREATE POLICY "professionals_delete_blocked" ON professionals
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via status)
```

### Policy: professional_documents (SELECT)

```sql
CREATE POLICY "professional_documents_select_policy" ON professional_documents
  FOR SELECT
  USING (
    professional_id = auth.uid()  -- Professional sees own documents
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );
```

### Policy: professional_documents (INSERT)

```sql
CREATE POLICY "professional_documents_insert_policy" ON professional_documents
  FOR INSERT
  WITH CHECK (
    professional_id = auth.uid()  -- Professional uploads own
    OR auth.jwt()->>'role' = 'admin'  -- Admin uploads for anyone
  );
```

### Policy: professional_documents (UPDATE)

```sql
CREATE POLICY "professional_documents_update_policy" ON professional_documents
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')  -- Admin can update
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin verifies (compliance officer role)
```

### Policy: professional_documents (DELETE)

```sql
CREATE POLICY "professional_documents_delete_blocked" ON professional_documents
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via status)
```

### Policy: cases (SELECT)

```sql
CREATE POLICY "cases_select_policy" ON cases
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'  -- Admins see all
    OR EXISTS(
      SELECT 1 FROM case_assignments 
      WHERE case_id = cases.id 
      AND professional_id = auth.uid() 
      AND ended_at IS NULL  -- Professional sees only assigned
    )
  );
```

### Policy: cases (INSERT)

```sql
CREATE POLICY "cases_insert_policy" ON cases
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: cases (UPDATE)

```sql
CREATE POLICY "cases_update_policy" ON cases
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')  -- Admin can update
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- New state must be valid
```

### Policy: cases (DELETE)

```sql
CREATE POLICY "cases_delete_blocked" ON cases
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via archived_at)
```

### Policy: case_complexity_factors (SELECT)

```sql
CREATE POLICY "case_complexity_select_policy" ON case_complexity_factors
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'  -- Admins see all
    OR EXISTS(
      SELECT 1 FROM case_assignments 
      WHERE case_id = case_complexity_factors.case_id 
      AND professional_id = auth.uid() 
      AND ended_at IS NULL  -- Assigned professional sees
    )
  );
```

### Policy: case_complexity_factors (INSERT)

```sql
CREATE POLICY "case_complexity_insert_policy" ON case_complexity_factors
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: case_complexity_factors (UPDATE)

```sql
CREATE POLICY "case_complexity_update_policy" ON case_complexity_factors
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: case_complexity_factors (DELETE)

```sql
CREATE POLICY "case_complexity_delete_blocked" ON case_complexity_factors
  FOR DELETE
  USING (FALSE);  -- Never delete
```

### Policy: case_assignments (SELECT)

```sql
CREATE POLICY "case_assignments_select_policy" ON case_assignments
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'  -- Admins see all
    OR professional_id = auth.uid()  -- Professional sees own assignments
  );
```

### Policy: case_assignments (INSERT)

```sql
CREATE POLICY "case_assignments_insert_policy" ON case_assignments
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only (matching assigns)
```

### Policy: case_assignments (UPDATE)

```sql
CREATE POLICY "case_assignments_update_blocked" ON case_assignments
  FOR UPDATE
  USING (FALSE);  -- Never update (append-only temporal model)
```

### Policy: case_assignments (DELETE)

```sql
CREATE POLICY "case_assignments_delete_blocked" ON case_assignments
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via ended_at)
```

### Policy: case_grants (SELECT)

```sql
CREATE POLICY "case_grants_select_policy" ON case_grants
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'  -- Admins see all
    OR EXISTS(
      SELECT 1 FROM case_assignments 
      WHERE case_id = case_grants.case_id 
      AND professional_id = auth.uid() 
      AND ended_at IS NULL  -- Assigned professional sees
    )
  );
```

### Policy: case_grants (INSERT)

```sql
CREATE POLICY "case_grants_insert_policy" ON case_grants
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: case_grants (UPDATE)

```sql
CREATE POLICY "case_grants_update_policy" ON case_grants
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: case_grants (DELETE)

```sql
CREATE POLICY "case_grants_delete_blocked" ON case_grants
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via status)
```

### Policy: session_logs (SELECT)

```sql
CREATE POLICY "session_logs_select_policy" ON session_logs
  FOR SELECT
  USING (
    professional_id = auth.uid()  -- Professional sees own logs
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );
```

### Policy: session_logs (INSERT)

```sql
CREATE POLICY "session_logs_insert_policy" ON session_logs
  FOR INSERT
  WITH CHECK (
    professional_id = auth.uid()  -- Professional creates own
    OR auth.jwt()->>'role' = 'admin'  -- Admin can create for anyone
  );
```

### Policy: session_logs (UPDATE)

```sql
CREATE POLICY "session_logs_update_policy" ON session_logs
  FOR UPDATE
  USING (
    professional_id = auth.uid() OR auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    (professional_id = auth.uid() AND status = 'DRAFT')  -- Professional can edit DRAFT
    OR auth.jwt()->>'role' = 'admin'  -- Admin can edit/finalize
  );
```

### Policy: session_logs (DELETE)

```sql
CREATE POLICY "session_logs_delete_blocked" ON session_logs
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via status)
```

### Policy: session_log_corrections (SELECT)

```sql
CREATE POLICY "session_log_corrections_select_policy" ON session_log_corrections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM session_logs sl
      WHERE sl.id = session_log_id
        AND sl.professional_id = auth.uid()
    )  -- Professional sees corrections on their own session logs
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );
```

### Policy: session_log_corrections (INSERT)

```sql
CREATE POLICY "session_log_corrections_insert_policy" ON session_log_corrections
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'  -- Admin can create corrections on any session log
    OR EXISTS (
      SELECT 1
      FROM session_logs sl
      WHERE sl.id = session_log_id
        AND sl.professional_id = auth.uid()
    )  -- Professional may only correct their own session logs
  );
```

### Policy: session_log_corrections (UPDATE)

```sql
CREATE POLICY "session_log_corrections_update_blocked" ON session_log_corrections
  FOR UPDATE
  USING (FALSE);  -- Never update (immutable)
```

### Policy: session_log_corrections (DELETE)

```sql
CREATE POLICY "session_log_corrections_delete_blocked" ON session_log_corrections
  FOR DELETE
  USING (FALSE);  -- Never delete (immutable)
```

### Policy: registered_hours (SELECT)

```sql
CREATE POLICY "registered_hours_select_policy" ON registered_hours
  FOR SELECT
  USING (
    professional_id = auth.uid()  -- Professional sees own hours
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );
```

### Policy: registered_hours (INSERT)

```sql
CREATE POLICY "registered_hours_insert_policy" ON registered_hours
  FOR INSERT
  WITH CHECK (
    professional_id = auth.uid()  -- Professional registers own
    OR auth.jwt()->>'role' = 'admin'  -- Admin can register for anyone
  );
```

### Policy: registered_hours (UPDATE)

```sql
CREATE POLICY "registered_hours_update_policy" ON registered_hours
  FOR UPDATE
  USING (
    professional_id = auth.uid() OR auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    (professional_id = auth.uid() AND status IN ('PENDING', 'SUBMITTED'))  -- Professional edits PENDING or submits PENDING→SUBMITTED
    OR auth.jwt()->>'role' = 'admin'  -- Admin approves/rejects/flags outside grant
  );
```

### Policy: registered_hours (DELETE)

```sql
CREATE POLICY "registered_hours_delete_blocked" ON registered_hours
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via status)
```

### Policy: contact_logs (SELECT)

```sql
CREATE POLICY "contact_logs_select_policy" ON contact_logs
  FOR SELECT
  USING (
    professional_id = auth.uid()  -- Professional sees own
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );
```

### Policy: contact_logs (INSERT)

```sql
CREATE POLICY "contact_logs_insert_policy" ON contact_logs
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' IN ('admin', 'professional')  -- Both can log
  );
```

### Policy: contact_logs (UPDATE)

```sql
CREATE POLICY "contact_logs_update_blocked" ON contact_logs
  FOR UPDATE
  USING (FALSE);  -- Never update (append-only)
```

### Policy: contact_logs (DELETE)

```sql
CREATE POLICY "contact_logs_delete_blocked" ON contact_logs
  FOR DELETE
  USING (FALSE);  -- Never delete (append-only)
```

### Policy: contact_disclosures (SELECT)

```sql
CREATE POLICY "contact_disclosures_select_policy" ON contact_disclosures
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');  -- Admin only (audit trail)
```

### Policy: contact_disclosures (INSERT)

```sql
CREATE POLICY "contact_disclosures_insert_policy" ON contact_disclosures
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: contact_disclosures (UPDATE)

```sql
CREATE POLICY "contact_disclosures_update_blocked" ON contact_disclosures
  FOR UPDATE
  USING (FALSE);  -- Never update (immutable)
```

### Policy: contact_disclosures (DELETE)

```sql
CREATE POLICY "contact_disclosures_delete_blocked" ON contact_disclosures
  FOR DELETE
  USING (FALSE);  -- Never delete (immutable)
```

### Policy: case_handovers (SELECT)

```sql
CREATE POLICY "case_handovers_select_policy" ON case_handovers
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: case_handovers (INSERT)

```sql
CREATE POLICY "case_handovers_insert_policy" ON case_handovers
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: case_handovers (UPDATE)

```sql
CREATE POLICY "case_handovers_update_policy" ON case_handovers
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: case_handovers (DELETE)

```sql
CREATE POLICY "case_handovers_delete_blocked" ON case_handovers
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via status)
```

### Policy: session_log_transfers (SELECT)

```sql
CREATE POLICY "session_log_transfers_select_policy" ON session_log_transfers
  FOR SELECT
  USING (
    to_professional_id = auth.uid()  -- Professional sees transfers to them
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );
```

### Policy: session_log_transfers (INSERT)

```sql
CREATE POLICY "session_log_transfers_insert_policy" ON session_log_transfers
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only (handover process)
```

### Policy: session_log_transfers (UPDATE)

```sql
CREATE POLICY "session_log_transfers_update_blocked" ON session_log_transfers
  FOR UPDATE
  USING (FALSE);  -- Never update (immutable)
```

### Policy: session_log_transfers (DELETE)

```sql
CREATE POLICY "session_log_transfers_delete_blocked" ON session_log_transfers
  FOR DELETE
  USING (FALSE);  -- Never delete (immutable)
```

### Policy: match_runs (SELECT)

```sql
CREATE POLICY "match_runs_select_policy" ON match_runs
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: match_runs (INSERT)

```sql
CREATE POLICY "match_runs_insert_policy" ON match_runs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: match_runs (UPDATE)

```sql
CREATE POLICY "match_runs_update_policy" ON match_runs
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: match_runs (DELETE)

```sql
CREATE POLICY "match_runs_delete_blocked" ON match_runs
  FOR DELETE
  USING (FALSE);  -- Never delete
```

### Policy: match_candidates (SELECT)

```sql
CREATE POLICY "match_candidates_select_policy" ON match_candidates
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: match_candidates (INSERT)

```sql
CREATE POLICY "match_candidates_insert_policy" ON match_candidates
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');  -- Backend only
```

### Policy: match_candidates (UPDATE)

```sql
CREATE POLICY "match_candidates_update_blocked" ON match_candidates
  FOR UPDATE
  USING (FALSE);  -- Never update (immutable scoring)
```

### Policy: match_candidates (DELETE)

```sql
CREATE POLICY "match_candidates_delete_blocked" ON match_candidates
  FOR DELETE
  USING (FALSE);  -- Never delete
```

### Policy: municipalities (SELECT)

```sql
-- Professionals may only see non-sensitive reference columns (id, name, status).
-- Sagsbehandler contact fields are admin-only to prevent PII exposure.
-- The API layer enforces column filtering: professionals receive {id, name, status} only.
-- RLS gates row access; the API layer gates column access.
CREATE POLICY "municipalities_select_policy" ON municipalities
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin' OR status = 'ACTIVE');
  -- Professionals can see ACTIVE municipalities (for case context display)
  -- but the API response must omit sagsbehandler_* and secondary_contact_* columns for professionals
```

> **Design decision:** PostgreSQL column-level RLS is not supported in Supabase's public schema in a maintainable way. Column filtering is enforced at the API layer — the `GET /api/municipalities` endpoint returns full rows to admins and strips `sagsbehandler_*` / `secondary_contact_*` fields for professionals.

### Policy: municipalities (INSERT)

```sql
CREATE POLICY "municipalities_insert_policy" ON municipalities
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: municipalities (UPDATE)

```sql
CREATE POLICY "municipalities_update_policy" ON municipalities
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: municipalities (DELETE)

```sql
CREATE POLICY "municipalities_delete_blocked" ON municipalities
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via status)
```

### Policy: deletion_schedules (SELECT)

```sql
CREATE POLICY "deletion_schedules_select_policy" ON deletion_schedules
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: deletion_schedules (INSERT)

```sql
CREATE POLICY "deletion_schedules_insert_policy" ON deletion_schedules
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');  -- System (scheduler) and admin
```

### Policy: deletion_schedules (UPDATE)

```sql
CREATE POLICY "deletion_schedules_update_policy" ON deletion_schedules
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system')
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');  -- System marks executed_at
```

### Policy: deletion_schedules (DELETE)

```sql
CREATE POLICY "deletion_schedules_delete_blocked" ON deletion_schedules
  FOR DELETE
  USING (FALSE);  -- Never delete (immutable schedule)
```

### Policy: audit_events (SELECT)

```sql
CREATE POLICY "audit_events_select_policy" ON audit_events
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'  -- Admins see all
    OR actor_id = auth.uid()  -- Professionals see own actions
  );
```

### Policy: audit_events (INSERT)

```sql
CREATE POLICY "audit_events_insert_policy" ON audit_events
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');
  -- INSERT restricted to admin or system role (application-only logging)
```

### Policy: audit_events (UPDATE/DELETE - Immutable)

```sql
CREATE POLICY "audit_events_immutable" ON audit_events
  FOR UPDATE, DELETE
  USING (FALSE);  -- Never update or delete
```

### Policy: notification_log (SELECT)

```sql
CREATE POLICY "notification_log_select_policy" ON notification_log
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');  -- Admin only
```

### Policy: notification_log (INSERT)

```sql
CREATE POLICY "notification_log_insert_policy" ON notification_log
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');
  -- System-only insert (application dispatches as side effect of workflow transitions)
```

### Policy: notification_log (UPDATE)

```sql
CREATE POLICY "notification_log_update_policy" ON notification_log
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system')
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');
  -- System updates status/attempt_count on dispatch/retry; admin reads via retry endpoint
```

### Policy: notification_log (DELETE)

```sql
CREATE POLICY "notification_log_delete_blocked" ON notification_log
  FOR DELETE
  USING (FALSE);  -- Never delete notification records
```

### Policy: inbound_inquiries (SELECT)

```sql
CREATE POLICY "inbound_inquiries_select_policy" ON inbound_inquiries
  FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');  -- Admin only (contains personal data)
```

### Policy: inbound_inquiries (INSERT)

```sql
CREATE POLICY "inbound_inquiries_insert_policy" ON inbound_inquiries
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'system');
  -- System-only insert via service_role key (public endpoint — anon key never used)
```

### Policy: inbound_inquiries (UPDATE)

```sql
CREATE POLICY "inbound_inquiries_update_policy" ON inbound_inquiries
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');  -- Admin reviews, converts, rejects
```

### Policy: inbound_inquiries (DELETE)

```sql
CREATE POLICY "inbound_inquiries_delete_blocked" ON inbound_inquiries
  FOR DELETE
  USING (FALSE);  -- Never delete (soft delete via status = REJECTED or SPAM; physical deletion after retention via WF-013)
```

---

## RLS Policy Summary

All 21 tables have complete RLS policies following PostgreSQL best practices:

**SELECT Policies:** Use USING to filter readable rows
**INSERT Policies:** Use WITH CHECK to validate new rows
**UPDATE Policies:** Use USING to select existing rows + WITH CHECK for new state
**DELETE Policies:** All blocked (USING FALSE) - soft delete via status columns only

**Enforcement Level:**
- Database layer: Supabase PostgreSQL RLS policies (primary defense)
- Application layer: Backend permission checks (defense-in-depth)
- Frontend layer: UI conditional rendering (user experience)

RLS is enforced at database level, preventing bypass via API manipulation.

## 1.6 INDEXES

**Strategy:**
- Index primary query paths (WHERE, JOIN, ORDER BY)
- Avoid excessive indexes (each has overhead)
- Maintain indexes as queries evolve

**Critical Indexes (defined above):**
- cases(status, municipality_id, archived_at, complexity_level)
- case_assignments(case_id, professional_id, ended_at)
- registered_hours(case_id, professional_id, status, grant_period_id)
- session_logs(case_id, professional_id, status)
- professionals(status, profession, max_complexity_level)
- audit_events(event_type, actor_id, resource_type, created_at DESC)

**Index Maintenance Plan:**
- ANALYZE after data load
- REINDEX monthly in development
- Monitor slow queries in production
- Add indexes based on query explain plans

---

## 1.7 MIGRATION STRATEGY

**Tool:** Supabase CLI (migrations/) + SQL files in version control  
**Version Control:** Git commits track schema changes  
**Rollback:** Complete down migrations for each up migration  
**Execution:** One-way forward (down migrations for rollback only)

### Migration Ordering & Dependencies

```
PHASE 1: Authentication & System Tables
  01_create_auth_profiles.sql        (extends Supabase auth.users)

PHASE 2: Reference Data (no dependencies)
  02_create_municipalities.sql

PHASE 3: Public Intake (depends on: profiles for reviewed_by FK)
  03_create_inbound_inquiries.sql     (FK: profiles.id for reviewed_by)

PHASE 4: Professionals (depends on: auth.users via auth.uuid)
  04_create_professionals.sql         (FK: profiles.id)
  05_create_professional_documents.sql (FK: professionals.id)

PHASE 5: Cases (depends on: municipalities)
  06_create_cases.sql                 (FK: municipalities.id)
  07_create_case_complexity_factors.sql (FK: cases.id, UNIQUE)

PHASE 6: Case Relationships (depends on: cases, professionals)
  08_create_case_assignments.sql      (FK: cases.id, professionals.id)
  09_create_case_grants.sql           (FK: cases.id, municipalities.id)
  10_create_case_handovers.sql        (FK: cases.id, professionals.id)

PHASE 7: Delivery (depends on: professionals, cases)
  11_create_session_logs.sql          (FK: cases.id, professionals.id)
  12_create_session_log_corrections.sql (FK: session_logs.id)
  13_create_session_log_transfers.sql (FK: session_logs.id, professionals.id)
  14_create_registered_hours.sql      (FK: cases.id, professionals.id, case_grants.id)
  15_create_contact_logs.sql          (FK: cases.id, professionals.id)
  16_create_contact_disclosures.sql   (FK: cases.id, professionals.id)

PHASE 8: Matching (depends on: cases, professionals)
  17_create_match_runs.sql            (FK: cases.id)
  18_create_match_candidates.sql      (FK: match_runs.id, professionals.id)

PHASE 9: Governance (depends on: all tables)
  19_create_audit_events.sql          (FK: profiles.id, polymorphic)
  20_create_notification_log.sql      (FK: profiles.id for recipient_profile_id)
  21_create_deletion_schedules.sql

PHASE 10: Materialized Views (depends on: all tables)
  22_create_views.sql

PHASE 11: Security (depends on: all tables)
  23_enable_rls_policies.sql
```

### Migration Execution Standards

**Each migration file structure:**
```sql
-- File: supabase/migrations/{timestamp}_create_{table}.sql

-- Create table (with all constraints, defaults, indexes)
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns...
);

-- Create indexes (after table creation)
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policies will be created in 21_enable_rls_policies.sql
```

**Rollback (down migration):**
```sql
-- File: supabase/migrations/{timestamp}_create_{table}.sql (rollback section)

-- Drop RLS policies first
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- Drop indexes
DROP INDEX IF EXISTS idx_table_column;

-- Drop table (will cascade to dependent FKs if defined)
DROP TABLE IF EXISTS table_name CASCADE;
```

### Sample Migration: Complete Example

**File: `supabase/migrations/20260627_001_create_auth_profiles.sql`**

```sql
-- Create profiles table (extends Supabase auth.users)
-- This bridges auth.users (Supabase managed) with our custom user attributes
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'professional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('admin', 'professional'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users. One row per user (professional or admin).';
COMMENT ON COLUMN profiles.role IS 'Role: admin (staff) or professional (external support provider)';
```

**File: `supabase/migrations/20260627_001_create_auth_profiles.sql` (rollback)**

```sql
-- Rollback: Drop profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;
```

### Migration Dependency Resolution

**Order must be respected to avoid FK violations:**

1. **No circular dependencies** (enforced by design, verified in code review)
2. **All referenced tables created first**
3. **Views created after all source tables**
4. **RLS policies created last (after all tables exist)**

**Example violation (prevented):**
- Migration 05 creates `cases` table with `FK: municipalities.id`
- Migration 02 must run BEFORE Migration 05 (municipalities exists first)
- Supabase CLI enforces chronological order by timestamp

### Testing & Verification

**Local Development:**
```bash
# 1. Reset database (WARNING: deletes all data)
supabase db reset

# 2. Verify all migrations applied
supabase db status

# 3. Check schema with SQL
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

# 4. Verify RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'professionals';

# 5. Test basic operations
INSERT INTO professionals (...) VALUES (...);
SELECT * FROM professionals;
```

**Staging Environment:**
```bash
# 1. Deploy to staging
supabase db push --linked --remote-url {staging_url}

# 2. Verify schema matches local
# (Automated test: schema_comparison.sql)

# 3. Test end-to-end workflows
# - Create case → create assignment → register hours → approve
# - Create professional → upload docs → approve → activate

# 4. Verify RLS policies work
# - Professional should see own data only
# - Admin should see all data
# - Audit events should be immutable
```

**Production Deployment:**
```bash
# 1. Backup production database (Supabase automatic)
# 2. Deploy migrations
supabase db push --linked --remote-url {production_url}

# 3. Post-deployment verification
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
# Expected: 19 tables

# 4. Monitor for errors (first 30 minutes)
# Check Supabase dashboard for errors
# Check application logs for failed queries
```

### Rollback Procedure

**If migration fails:**
```bash
# Option 1: Auto-rollback (immediate)
supabase db push --dry-run  # Shows what would happen
# Then manually run rollback SQL from down migrations

# Option 2: Manual rollback
# Copy rollback SQL from migration file
# Execute against staging/production database
# Verify state

# Option 3: Restore from backup
# Use Supabase backup (available for last 7 days)
# Point-in-time restore to pre-migration state
```

**Never used in production:**
```sql
-- NEVER use:
DROP TABLE table_name;  -- Use soft-delete instead (archived_at)

-- INSTEAD use:
UPDATE table_name SET status = 'DELETED', deleted_at = NOW();
```

### Migration Idempotency

**All migrations use `IF NOT EXISTS` / `IF EXISTS`:**
```sql
-- Safe to run multiple times (idempotent)
CREATE TABLE IF NOT EXISTS table_name (...);
CREATE INDEX IF NOT EXISTS idx_name ON table_name(...);
DROP POLICY IF EXISTS policy_name ON table_name;

-- NOT idempotent (would fail on retry):
CREATE TABLE table_name (...);  -- ❌ Error if table exists
CREATE INDEX idx_name ON table_name(...);  -- ❌ Error if index exists
```

### Zero-Downtime Migrations

**MVP applies these principles for future Phase 2 changes:**

1. **Adding nullable columns:** Always safe (default NULL)
2. **Adding columns with defaults:** Safe (applied to new rows)
3. **Removing columns:** Requires dual-write period (not in MVP)
4. **Renaming columns:** Requires app-level alias (not in MVP)
5. **Changing column types:** May require explicit cast (not in MVP)

**For MVP:** All table structures finalized, no evolutionary migrations needed until Phase 2.

### Migration Monitoring

**Supabase CLI provides:**
```bash
supabase db status
# Shows which migrations applied and timestamps

supabase db up  # Apply pending migrations
supabase db down  # Rollback to previous migration
```

**Application-level monitoring:**
```typescript
// In application startup
const appliedMigrations = await db.query(`
  SELECT version, name FROM information_schema._migrations ORDER BY version DESC LIMIT 5
`);
logger.info('Applied migrations', appliedMigrations);
```

### Critical Constraints (Enforced at Migration Time)

**Foreign Keys:**
- All FKs defined at table creation
- ON DELETE CASCADE for professional → case relationships
- ON DELETE RESTRICT for critical references

**Check Constraints:**
- Status enums validated (OPEN, ACTIVE, COMPLETED, ARCHIVED)
- Numeric ranges validated (hours >= 0, experience_years >= 0)
- Date constraints (end_at > start_at)

**Unique Constraints:**
- One active assignment per case (enforced in application + unique index)
- One complexity assessment per case (UNIQUE FK)
- Municipality names unique

---

## 1.8 CONSTRAINTS SUMMARY

| Constraint Type | Count | Examples |
|---|---|---|
| PRIMARY KEY | 21 | Each table |
| FOREIGN KEY | 40+ | case_assignments.case_id, session_logs.professional_id, notification_log.recipient_profile_id |
| UNIQUE | 5+ | municipalities.name, case_complexity_factors.case_id |
| UNIQUE INDEX (Partial) | 1 | case_assignments(case_id) WHERE ended_at IS NULL |
| CHECK | 45+ | status enums, hours ranges, notification_log.recipient_required |
| NOT NULL | 85+ | Core fields |

**Enforcement:** All at database level (Supabase PostgreSQL)

**Duplicate Prevention Strategy:**
- Hard constraints avoided where legitimate multiple entries allowed
- registered_hours: Multiple work_type entries same day/case - detected at service level
- session_logs: Multiple sessions same day/case allowed - detected at service level
- case_assignments: Partial unique index enforces one active assignment per case (CRITICAL)

---

## 1.9 ENCRYPTION STRATEGY

**Decision (FINAL): Application-Level Encryption (XSalsa20-Poly1305 via tweetnacl/libsodium)**

**Algorithm Details:**
- **Cipher:** XSalsa20 (stream cipher with 256-bit key strength)
- **Authentication:** Poly1305 (128-bit authentication tag)
- **Combined:** AEAD (Authenticated Encryption with Associated Data)
- **Nonce:** 24 bytes (extended nonce resists reuse better than standard NaCl)
- **Equivalent Security:** 256-bit symmetric encryption (comparable to AES-256-GCM)

**Why XSalsa20-Poly1305 (not AES-256):**
- XSalsa20 has extended nonce (24 bytes vs 12 for AES-GCM), providing better protection against nonce reuse in high-volume scenarios
- Both provide equivalent 256-bit security level
- NaCl/libsodium: Audited, production-tested (used by OpenSSH, Signal, WireGuard)
- Proven resistance to side-channel attacks

**Rationale:**
- Ensures plaintext never stored at rest on server
- Decryption happens only in application memory during request
- Supabase PostgreSQL cannot read encrypted citizen data
- Aligns with GDPR privacy-by-design principle
- Prevents unauthorized access even if database is compromised

**Encrypted Fields** (XSalsa20-Poly1305, base64-encoded ciphertext):

Session documentation:
- session_logs.observations (professional's detailed notes)
- session_logs.citizen_mood_tone (citizen's emotional state)
- session_logs.safeguarding_detail (safeguarding flag details + narrative)
- session_logs.participant_names (encrypted array of names)
- session_logs.location (where session took place)

Contact & coordination:
- contact_logs.note (what was discussed)
- contact_logs.outcome (result of contact)
- contact_disclosures.reason (why contact disclosed)

Case management:
- case.citizen_notes (optional coordinator notes)
- case_handovers.handover_note (structured handover details)

Administrative:
- match_candidates.scoring_explanation (how score was calculated)
- session_log_corrections.correction_note (what changed in correction)
- registered_hours.description (what work was done)

### Key Management

**Environment Variable:**
```
ENCRYPTION_KEY=<base64-encoded-32-byte-key>
```

Loaded at application startup. Never logged, never exposed in responses. Rotated per security policy (quarterly minimum).

For MVP: Single shared key per environment (dev/staging/prod).
For future: Per-organization or per-user key derivation possible.

### Implementation Pattern

**Encryption (Write Path):**
```typescript
import nacl from 'tweetnacl';
import { randomBytes } from 'tweetnacl';

function encryptField(plaintext: string, encryptionKey: Uint8Array): string {
  const nonce = randomBytes(24);  // Random per encryption
  const message = Buffer.from(plaintext, 'utf-8');
  const encrypted = nacl.secretbox(message, nonce, encryptionKey);
  
  if (!encrypted) throw new Error('Encryption failed');
  
  // Prepend nonce to ciphertext for decryption
  const combined = Buffer.concat([Buffer.from(nonce), Buffer.from(encrypted)]);
  return combined.toString('base64');
}
```

**Decryption (Read Path):**
```typescript
function decryptField(ciphertext: string, encryptionKey: Uint8Array): string {
  try {
    const combined = Buffer.from(ciphertext, 'base64');
    const nonce = combined.slice(0, 24);
    const encrypted = combined.slice(24);
    
    const plaintext = nacl.secretbox.open(
      new Uint8Array(encrypted),
      new Uint8Array(nonce),
      encryptionKey
    );
    
    if (!plaintext) throw new Error('Decryption failed: authentication failed');
    
    return Buffer.from(plaintext).toString('utf-8');
  } catch (error) {
    logger.error('Decryption error', { error });
    throw new Error('Failed to decrypt field');
  }
}
```

### Service Layer Integration

**Example: Session Log Service**
```typescript
class DeliveryService {
  private encryptionKey: Uint8Array;
  
  async createSessionLog(input: CreateSessionLogInput): Promise<SessionLog> {
    // Encrypt sensitive fields before database persist
    const toEncrypt = {
      observations: input.observations,
      citizen_mood_tone: input.citizen_mood_tone,
      safeguarding_detail: input.safeguarding_detail,
      participant_names: JSON.stringify(input.participant_names),
      location: input.location
    };
    
    const encrypted: Record<string, string> = {};
    for (const [field, plaintext] of Object.entries(toEncrypt)) {
      if (plaintext) {
        encrypted[field] = this.encryptField(plaintext);
      }
    }
    
    // Store encrypted ciphertext to database
    const sessionLog = await db.sessionLogs.insert({
      case_id: input.case_id,
      professional_id: input.professional_id,
      session_date: input.session_date,
      status: 'DRAFT',
      ...encrypted  // Encrypted values stored as base64 TEXT
    });
    
    // Audit event: log that session was created (no plaintext in audit)
    await this.auditService.logEvent({
      event_type: 'SESSION_LOG_CREATED',
      resource_type: 'session_log',
      resource_id: sessionLog.id,
      metadata: { case_id: input.case_id }
    });
    
    return sessionLog;
  }
  
  async getSessionLog(sessionId: string, requesterId: string): Promise<SessionLogResponse> {
    // Fetch from database (contains ciphertext)
    const encrypted = await db.sessionLogs.findById(sessionId);
    if (!encrypted) throw new NotFoundError();
    
    // Check permission: can requesterId view this?
    if (!this.canViewSession(encrypted, requesterId)) {
      throw new ForbiddenError('No access to this session');
    }
    
    // Decrypt sensitive fields in memory (plaintext only during response generation)
    const decrypted = {
      observations: encrypted.observations ? this.decryptField(encrypted.observations) : null,
      citizen_mood_tone: encrypted.citizen_mood_tone ? this.decryptField(encrypted.citizen_mood_tone) : null,
      safeguarding_detail: encrypted.safeguarding_detail ? this.decryptField(encrypted.safeguarding_detail) : null,
      participant_names: encrypted.participant_names ? JSON.parse(this.decryptField(encrypted.participant_names)) : [],
      location: encrypted.location ? this.decryptField(encrypted.location) : null
    };
    
    // Return fully decrypted to authorized user
    return {
      id: encrypted.id,
      case_id: encrypted.case_id,
      session_date: encrypted.session_date,
      status: encrypted.status,
      ...decrypted  // Plaintext included in response
    };
  }
  
  private encryptField(plaintext: string): string {
    return encryptField(plaintext, this.encryptionKey);
  }
  
  private decryptField(ciphertext: string): string {
    return decryptField(ciphertext, this.encryptionKey);
  }
}
```

### API Response Handling

**Professional receives encrypted fields decrypted:**
```json
{
  "id": "session-uuid",
  "case_id": "case-uuid",
  "session_date": "2026-06-27",
  "observations": "Youth was engaged and cooperative during session...",  // PLAINTEXT (decrypted)
  "participant_names": ["John", "Jane"],  // PLAINTEXT (decrypted)
  "location": "Community Center",  // PLAINTEXT (decrypted)
  "created_at": "2026-06-27T14:30:00Z"
}
```

**Database contains encrypted:**
```
observations: bm9uY2Uba2lsbGthQnVjbjBDQjAxMEFCQ0RFRjAxMjM0NTY3ODk...
citizen_mood_tone: bm9uY2Uka2lsbGthQnVjbjBDQjAxMEFCQ0RFRjAxMjM0NTY3ODk...
```

### Performance Considerations

**Encryption cost:** ~2-8ms per field (XSalsa20-Poly1305)
**Decryption cost:** ~2-8ms per field (XSalsa20-Poly1305)
**Total impact:** Negligible on modern hardware (~50-250ms total for large document with 13 encrypted fields)

**Optimization:**
- Decrypt only fields needed for response
- Do NOT decrypt for logging/audit (use unencrypted metadata only)
- Do NOT cache decrypted values across requests
- Cache encryption key in memory (load once at startup)

### Search & Filtering

**Cannot search encrypted columns:**
- Encrypted data is opaque (required for security)
- Cannot index encrypted values

**Workaround: Search by unencrypted metadata**
- Filter by case_id (unencrypted)
- Filter by professional_id (unencrypted)
- Filter by session_date (unencrypted)
- Filter by status (unencrypted)
- Decrypt results in memory if needed for response

Example: "Find all sessions for case X"
```sql
SELECT * FROM session_logs 
WHERE case_id = $1 
ORDER BY session_date DESC;
```
(Unencrypted columns used for filtering, then results decrypted for API response)

### Audit Trail

**Audit events logged BEFORE encryption:**
```typescript
await auditService.logEvent({
  event_type: 'SESSION_LOG_CREATED',
  actor_id: professional_id,
  resource_type: 'session_log',
  resource_id: sessionLog.id,
  metadata: {
    case_id: input.case_id,
    session_date: input.session_date
    // NO sensitive plaintext in metadata
  }
});
```

Audit events themselves are never encrypted (must be searchable for compliance).

### Key Rotation Plan

**Quarterly Rotation Process:**

1. Generate new 32-byte key
2. Update environment variable (but keep old key in PREVIOUS slot)
3. Backend accepts both keys for decryption (dual-key period):
   ```typescript
   const activeKey = process.env.ENCRYPTION_KEY;
   const previousKey = process.env.ENCRYPTION_KEY_PREVIOUS;
   
   function decrypt(ciphertext, keyOverride?) {
     const keyToUse = keyOverride || activeKey;
     try {
       return nacl.secretbox.open(..., keyToUse);
     } catch {
       if (previousKey && keyToUse === activeKey) {
         return nacl.secretbox.open(..., previousKey);  // Retry with old key
       }
       throw;
     }
   }
   ```

4. Background job re-encrypts all data with new key:
   ```typescript
   async function rotateEncryptionKey() {
     const allSessions = await db.sessionLogs.findAll();
     for (const session of allSessions) {
       const plaintext = decrypt(session.observations, previousKey);  // Decrypt with old
       const reencrypted = encrypt(plaintext);  // Encrypt with new
       await db.sessionLogs.update(session.id, { 
         observations: reencrypted 
       });
     }
   }
   ```

5. Verify completeness (spot-check sample of records)
6. Decommission old key (remove PREVIOUS)
7. Audit log: "Encryption key rotated successfully"

### Compliance

**GDPR Compliance:**
- Encryption satisfies "processing with pseudonymization" (Article 4(1))
- Citizen data encrypted at rest using authenticated encryption
- Only authorized professionals can decrypt (via RLS + permission checks)
- Immutable audit trail of access (immutable audit_events table)

**Security Standards:**
- **XSalsa20-Poly1305:** NIST-vetted, audited stream cipher + authentication
- **Extended Nonce (24 bytes):** Better nonce reuse resistance than AES-GCM
- **NaCl/libsodium:** Production-tested library (OpenSSH, Signal, WireGuard, Dropbox)
- **Meets OWASP:** Encryption recommendations for sensitive data at rest
- **Meets NIST:** SP 800-175B Recommendations for cryptographic strength
- **Equivalent to:** AES-256-GCM in security level (256-bit symmetric encryption)

---

## 1.10 DATA RETENTION & GDPR

**Default Retention:** 7 years after archival  
**Process (WF-013):**
1. Record archived: `status = 'ARCHIVED'`, `archived_at = NOW()` (ADR-007 — no `status = DELETED`, no `deleted_at`)
2. `data_retention_expires_at = archived_at + INTERVAL '7 years'`
3. Deletion scheduled: `deletion_schedules` entry created with `scheduled_for_deletion_at = data_retention_expires_at + INTERVAL '24 hours'`
4. At scheduled time: **physical deletion** (hard delete) in FK cascade order — this is the ONLY hard delete permitted in the system
5. Audit event logged (`DATA_DELETED`) before physical deletion as immutable proof

> **Implementation requirement (Critical):** Physical deletion (step 4) bypasses RLS because all tables have `USING (FALSE)` on DELETE. The WF-013 scheduler **must** use the Supabase `service_role` key (never the `anon` or `authenticated` key). The `service_role` key must be stored as a server-side secret (environment variable only; never exposed to the client). A missing `service_role` key will cause all WF-013 deletion attempts to silently fail (RLS blocks the DELETE and returns 0 rows affected rather than an error).

**Right-to-Forget (GDPR Article 17):** Admin-initiated via manual trigger; 30-day delay before physical deletion  
**Inbound Inquiries:** SPAM and REJECTED entries physically deleted 90 days after creation (shorter retention — no ongoing professional relationship)

**Note:** There is no `status = 'DELETED'` column value anywhere in the system. ADR-007 prohibits it. Soft delete uses `status = 'ARCHIVED'`. Physical deletion is reserved exclusively for post-retention-period cleanup via WF-013.

---

## 1.11 PERFORMANCE TARGETS

| Operation | Target | Notes |
|---|---|---|
| SELECT case + assignment + grant | < 100ms | Typical query |
| SELECT cases list (with pagination) | < 500ms | 50 cases per page |
| INSERT registered_hours | < 100ms | Validation included |
| Matching score calculation | < 2s | All candidates scored |
| Audit trail query | < 1s | Indexed on created_at |

**Optimization:**
- Use views for complex joins
- Index heavily-filtered queries
- Pagination for lists (offset/limit)
- Connection pooling (Supabase manages)

---

**End of Part 1: Database Specification**

**Next:** Part 2 — API Specification (endpoints, contracts, validation)

---

This Database Specification is complete and implementation-ready.

Every table, constraint, index, RLS policy, and migration is defined.

**Status:** Ready for Technical Specification Phase 2 (API)
