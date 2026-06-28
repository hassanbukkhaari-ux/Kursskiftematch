# Permission Model: Kurskifte-Match

**Date:** June 27, 2026  
**Status:** APPROVED (blocking document for Tech Spec)  
**Purpose:** Define access control, roles, and Row-Level Security (RLS) foundations

---

## BUSINESS ROLES

These are real-world roles at Kurskifte ApS.

| Role | Responsibility | Accesses Platform? |
|------|----------------|-------------------|
| **Recruiter** | Recruit professionals, manage applications | YES (limited) |
| **Hiring Manager** | Approve/reject professional applications | YES (limited) |
| **Compliance Officer** | Verify documents, track credentials, GDPR | YES (limited) |
| **Case Coordinator** | Create cases, assign professionals, approve hours | YES (full admin) |
| **Operations Manager** | Manage grants, budget, KPIs | YES (limited) |
| **Professional** | Provide support, document sessions, register hours | YES (portal) |
| **Sagsbehandler (Municipality)** | Case worker, NO platform access | NO |
| **Citizen (Borger)** | Support recipient, NO platform access | NO |

---

## SYSTEM ROLES (Database/Application Level)

Two primary system roles for MVP.

### 1. ADMIN
- **Who:** Case Coordinators, Compliance Officers, Operations Managers, Recruiters (all staff)
- **Permissions:** Full CRUD access to all administrative entities
- **Cannot:** Cannot be assigned to cases as professional (never a professional role)
- **RLS Rule:** `auth.jwt()->>'role' = 'admin'`

### 2. PROFESSIONAL
- **Who:** Professionals only
- **Permissions:** Limited to own data and assigned cases
- **Scoping:** See only own profile, assigned cases, own sessions/hours
- **RLS Rule:** `auth.jwt()->>'user_id' = professionals.id`

### 3. PUBLIC (Future, Phase 2)
- **For:** Recruitment landing page, application form
- **NOT MVP**

---

## PERMISSION MATRIX

**Who can do WHAT to WHICH resources:**

| Resource | Admin | Professional | Public |
|----------|-------|--------------|--------|
| **Professional Entity** | CRUD | R (own) | - |
| **ProfessionalDocument** | CRUD | R/CU (own) | - |
| **Case** | CRUD | R (assigned) | - |
| **CaseAssignment** | CRD (no update) | R (own) | - |
| **CaseGrant** | CRUD | R (assigned) | - |
| **SessionLog** | R | CRU (own) | - |
| **RegisteredHours** | CRU | CRU (own, pending) | - |
| **ContactLog** | CR | CR (own) | - |
| **MatchRun** | CR | R (relevant) | - |
| **AuditEvents** | R (all) | R (own actions) | - |

**Legend:**
- C = Create, R = Read, U = Update, D = Delete
- `-` = No access
- R (own) = Read only own data
- R (assigned) = Read only cases assigned to them

---

## RESOURCE OWNERSHIP RULES

**Who owns what? Who can modify it?**

| Resource | Owner | Creator | Modifier | Deleter |
|----------|-------|---------|----------|---------|
| Professional | Admin | Recruiter | Admin | (archive only) |
| Case | Admin | Admin | Admin | (archive only) |
| CaseAssignment | Case Domain | Admin | (no update, new record) | (terminate only) |
| SessionLog | Professional | Professional | (correct only) | (archive only) |
| RegisteredHours | Professional | Professional | Admin | (archive only) |
| MatchRun | Admin | Admin | (immutable) | (cancel only) |
| AuditEvents | Governance | System | (immutable) | (never) |

---

## ACCESS BOUNDARIES

### What ADMIN Can Access
- ✅ All professionals (profiles, documents, capacity)
- ✅ All cases (view, create, assign, close)
- ✅ All hours (approve, reject, review)
- ✅ All sessions (view, not edit)
- ✅ All contacts (disclose, audit)
- ✅ All audit events (full trail)
- ✅ Matching (trigger, decide)
- ❌ Cannot see encrypted notes content? (TBD: depends on encryption strategy)

### What PROFESSIONAL Can Access
- ✅ Own profile (view, update availability/capacity)
- ✅ Own documents (view, upload)
- ✅ Assigned cases only (view case details)
- ✅ Own sessions (create, view, correct)
- ✅ Own hours (register, view)
- ✅ Own contact logs (create, view)
- ❌ Cannot access other professionals' data
- ❌ Cannot approve hours
- ❌ Cannot assign themselves to cases
- ❌ Cannot view matching scores
- ❌ Cannot view audit trail

---

## SPECIFIC RULES (NOT ALLOWED)

**These are explicitly forbidden:**

❌ **Professional cannot:**
- Auto-assign self to a case (only admin can assign)
- Approve/reject own hours (only admin)
- View other professionals' sessions (privacy)
- Access audit events for other professionals
- Download compliance export
- Modify another professional's documents
- Cancel own assignment (must request handover)

❌ **Admin cannot:**
- Log into professional portal (see citizens' data)
- Bypass permissions via API (RLS enforces at database level)
- Hard-delete records (soft delete only)
- Modify audit events (immutable)
- Auto-assign professional (must choose explicitly)

❌ **System cannot:**
- Auto-delete data before retention period
- Automatically approve hours over grant
- Automatically expire documents (must flag for review)
- Automatically close cases (must be explicit)

---

## ROW-LEVEL SECURITY (RLS) IMPLICATIONS

RLS policies will be implemented in Supabase PostgreSQL. Key implications:

### Professional Entity
```
-- Admin can see all
-- Professional can see own profile only
CREATE POLICY "professionals_select_policy"
  ON professionals FOR SELECT
  USING (auth.jwt()->>'role' = 'admin' OR auth.uid() = id);

-- Admin can create/update
-- Professional cannot
CREATE POLICY "professionals_modify_policy"
  ON professionals FOR INSERT, UPDATE, DELETE
  USING (auth.jwt()->>'role' = 'admin');
```

### SessionLog Entity
```
-- Admin can see all
-- Professional can see own sessions only
CREATE POLICY "sessions_select_policy"
  ON session_logs FOR SELECT
  USING (auth.jwt()->>'role' = 'admin' OR professional_id = auth.uid());

-- Professional can create/update own (corrections only)
-- Admin can see but not modify
CREATE POLICY "sessions_modify_policy"
  ON session_logs FOR INSERT, UPDATE
  USING (professional_id = auth.uid() AND auth.jwt()->>'role' = 'professional');
```

### RegisteredHours Entity
```
-- Admin can see all
-- Professional can see own hours only
CREATE POLICY "hours_select_policy"
  ON registered_hours FOR SELECT
  USING (auth.jwt()->>'role' = 'admin' OR professional_id = auth.uid());

-- Professional can create/update own (pending only)
-- Admin can update status (APPROVED/REJECTED)
CREATE POLICY "hours_professional_policy"
  ON registered_hours FOR INSERT, UPDATE
  USING (professional_id = auth.uid() AND status = 'PENDING');

CREATE POLICY "hours_admin_policy"
  ON registered_hours FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin');
```

### Case Entity
```
-- Admin can see all
-- Professional can see assigned cases only (via CaseAssignment)
CREATE POLICY "cases_select_policy"
  ON cases FOR SELECT
  USING (auth.jwt()->>'role' = 'admin' OR 
         EXISTS(SELECT 1 FROM case_assignments 
                WHERE case_id = cases.id 
                AND professional_id = auth.uid() 
                AND ended_at IS NULL));

-- Admin only can modify
CREATE POLICY "cases_modify_policy"
  ON cases FOR INSERT, UPDATE, DELETE
  USING (auth.jwt()->>'role' = 'admin');
```

### AuditEvents Entity (Special)
```
-- Admin can see all
-- Professional can see only own actions
CREATE POLICY "audit_select_policy"
  ON audit_events FOR SELECT
  USING (auth.jwt()->>'role' = 'admin' OR actor_id = auth.uid());

-- Only system can insert (via trigger)
CREATE POLICY "audit_insert_policy"
  ON audit_events FOR INSERT
  USING (auth.jwt()->>'role' = 'system');

-- Never update or delete
CREATE POLICY "audit_immutable"
  ON audit_events FOR UPDATE, DELETE
  USING (false);
```

---

## ENCRYPTION STRATEGY (High-Level)

Fields requiring encryption (to be decided in Tech Spec):
- SessionLog.observations (work notes)
- SessionLog.safeguarding_detail (sensitive flags)
- SessionLog.participant_names (citizen names)
- Case.citizen_notes (encrypted)
- ContactLog.note (communication notes)
- ContactLog.outcome (results)
- ContactDisclosure.sagsbehandler_* (contact info snapshot)

**Decision needed:** Application-level encryption or Supabase field-level?

---

## ADMIN vs PROFESSIONAL: CLEAR BOUNDARY

### Admin Portal
- **Access:** Case management, professional management, hour approval, audit trail
- **Not access:** Professional portal data (citizen details)
- **Goal:** Operational oversight

### Professional Portal
- **Access:** My cases, my sessions, my hours, my profile
- **Not access:** Admin operations, other professionals' data, audit trail
- **Goal:** Daily work documentation

**Why separate?** Professionals should NOT see case details they're not assigned to (privacy for other professionals and citizens).

---

## OPEN QUESTIONS FOR TECH SPEC

1. **Should encrypted fields be readable by admin?** (e.g., can admin read citizen notes?)
2. **Should admin see professional portal view or different view?** (same UI or different?)
3. **Should session logs be searchable by professional name?** (privacy vs usability)
4. **Should audit trail include failed permission checks?** (security logging)
5. **Should inactive professionals still see past cases?** (after offboarding)

---

**This Permission Model is the foundation for Technical Specification.**  
**RLS policies will be refined in Tech Spec with exact SQL.**
