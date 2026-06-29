# TS-002: API Specification

**Document Type:** Technical Specification (Implementation Blueprint)  
**Version:** 2.0 (Generated directly from TS-001)  
**Depends On:** TECHNICAL_SPECIFICATION_PHASE_1_DATABASE.md (TS-001) — authoritative for all schema, enums, constraints, and RLS  
**Audience:** Backend developers, frontend engineers  
**Date:** June 29, 2026  
**Status:** APPROVED FOR IMPLEMENTATION  

> **Schema Source Rule:** Every field name, enum value, constraint, and status in this document is derived from TS-001 table definitions. No field in this document may contradict TS-001. TS-001 is the single source of truth for the database; this document is a derived API contract.

---

## TABLE OF CONTENTS

1. [Architecture Decisions](#1-architecture-decisions)
2. [Authentication and Authorization](#2-authentication-and-authorization)
3. [Common Conventions](#3-common-conventions)
4. [Professional Domain Endpoints](#4-professional-domain-endpoints)
5. [Municipality Domain Endpoints](#5-municipality-domain-endpoints)
6. [Case Domain Endpoints](#6-case-domain-endpoints)
7. [Delivery Domain Endpoints](#7-delivery-domain-endpoints)
8. [Matching Domain Endpoints](#8-matching-domain-endpoints)
9. [Governance Domain Endpoints](#9-governance-domain-endpoints)
10. [Public Intake Endpoint](#10-public-intake-endpoint)
11. [Profile Endpoint](#11-profile-endpoint)
12. [Workflow-to-Endpoint Traceability Matrix](#12-workflow-to-endpoint-traceability-matrix)
13. [Complete Endpoint Inventory](#13-complete-endpoint-inventory)
14. [Enum Reference](#14-enum-reference)
15. [Fields Explicitly Excluded](#15-fields-explicitly-excluded)

---

## 1. Architecture Decisions

| Decision | Value | Source |
|---|---|---|
| Framework | Next.js 15 App Router (`/app/api`) | MASTER_DIRECTIVE.md |
| Auth | Supabase JWT; `auth.jwt()->>'role'` = `admin` or `professional` | TS-001, PERMISSION_MODEL.md |
| Database | Supabase PostgreSQL 15+ with RLS | TS-001 |
| Soft Delete | `status = 'ARCHIVED'` + `archived_at`; no hard deletes, no `deleted_at` | ADR-007, TS-001 |
| Derived Values | Not stored; computed at query time | ADR-008 |
| Audit Logging | Every state transition writes to `audit_events` | ADR-004 |
| Notification | 6 MVP types written to `notification_log`; dispatched as side effects of workflow state transitions | ADR-010 |
| Privacy | No `citizen_name`, `citizen_cpr`; GDPR minimization per WF-002 | TS-001 |
| Encryption | Sensitive fields encrypted at application layer before storage | TS-001 |
| Public Intake | `inbound_inquiries` only; service_role key never exposed to browser | WF-002 |

---

## 2. Authentication and Authorization

### 2.1 JWT Structure

All authenticated requests carry a Supabase JWT with:
```
auth.uid()          → profiles.id (UUID)
auth.jwt()->>'role' → 'admin' | 'professional'
```

### 2.2 Role Capabilities

| Role | Capabilities |
|---|---|
| `admin` | Full read/write across all domains |
| `professional` | Own profile, assigned cases only, own session logs, own hours |
| `public` (unauthenticated) | POST `/api/inquiries` only (with CAPTCHA + rate limit) |

### 2.3 HTTP Headers

All authenticated endpoints require:
```
Authorization: Bearer <supabase-jwt>
Content-Type: application/json
```

### 2.4 Error Responses

```json
{
  "error": "string description",
  "code": "SNAKE_CASE_CODE"
}
```

| HTTP Status | Meaning |
|---|---|
| 400 | Validation failure |
| 401 | Missing or invalid JWT |
| 403 | JWT valid, role insufficient |
| 404 | Resource not found |
| 409 | Conflict (duplicate, invalid state transition) |
| 422 | Business rule violation |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## 3. Common Conventions

### 3.1 IDs

All IDs are UUID v4 (`DEFAULT gen_random_uuid()`).

### 3.2 Timestamps

ISO 8601 UTC strings (`TIMESTAMPTZ`). Example: `"2026-06-27T12:00:00Z"`.

### 3.3 Pagination

List endpoints support `?limit=50&offset=0`. Response shape:
```json
{
  "data": [...],
  "count": 123,
  "limit": 50,
  "offset": 0
}
```

### 3.4 Encrypted Fields

Fields marked `(encrypted)` are stored as ciphertext, decrypted at application layer before return.  
Encrypted fields per TS-001: `citizen_notes`, `observations`, `citizen_mood_tone`, `safeguarding_detail`, `participant_names`, `location`, `handover_note`, `note` (contact_logs), `outcome`, `scoring_explanation`, `selected_reason`, `reason` (contact_disclosures).

---

## 4. Professional Domain Endpoints

**Tables:** `profiles`, `professionals`, `professional_documents`  
**Workflows:** WF-001, WF-008, WF-011

---

### 4.1 List Professionals

```
GET /api/professionals
```

**Auth:** Admin only  
**Query params:** `?status=ACTIVE&profession=PEDAGOGUE&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "string (joined from profiles.email)",
      "profession": "PEDAGOGUE",
      "experience_years": 5,
      "target_age_groups": ["6-12", "13-18"],
      "max_complexity_level": "HIGH",
      "qualifications": ["string"],
      "capacity_hours_week": 30.00,
      "max_concurrent_cases": 3,
      "availability_days": ["MONDAY", "TUESDAY", "WEDNESDAY"],
      "availability_status": "AVAILABLE",
      "status": "ACTIVE",
      "created_at": "2026-06-01T10:00:00Z",
      "updated_at": "2026-06-01T10:00:00Z"
    }
  ],
  "count": 42,
  "limit": 50,
  "offset": 0
}
```

**TS-001 columns used:** `professionals.id`, `professionals.profession`, `professionals.experience_years`, `professionals.target_age_groups`, `professionals.max_complexity_level`, `professionals.qualifications`, `professionals.capacity_hours_week`, `professionals.max_concurrent_cases`, `professionals.availability_days`, `professionals.availability_status`, `professionals.status`, `professionals.created_at`, `professionals.updated_at`, `profiles.email` (JOIN on `professionals.id = profiles.id`)

---

### 4.2 Get Professional

```
GET /api/professionals/:id
```

**Auth:** Own profile (`auth.uid() = id`) or admin  
**RLS:** TS-001 `professionals_select_policy`: `auth.uid() = id OR auth.jwt()->>'role' = 'admin'`

**Response 200:** Same shape as list item.

---

### 4.3 Create Professional

```
POST /api/professionals
```

**Auth:** Admin only  
**Workflow:** WF-001 step 1  
**Audit:** `PROFESSIONAL_RECRUITED` — `resource_type='professionals'`, `resource_id=new_id`  
**Notification:** `PROFESSIONAL_APPLICATION_RECEIVED` to `notification_log` with `recipient_email = SYSTEM_ADMIN_EMAIL`

**Request body:**
```json
{
  "profile_id": "uuid",
  "profession": "PEDAGOGUE",
  "experience_years": 5,
  "target_age_groups": ["6-12", "13-18"],
  "max_complexity_level": "MEDIUM",
  "qualifications": "string | null",
  "capacity_hours_week": 30.00,
  "max_concurrent_cases": 3,
  "availability_days": ["MONDAY", "TUESDAY"]
}
```

**Validations:**
- `profile_id` must reference existing `profiles.id` with `role = 'professional'`
- `profession` ∈ `{TEACHER, PEDAGOGUE, NURSE, PSYCHOLOGIST, SOCIAL_WORKER, COUNSELOR, OTHER}`
- `experience_years >= 0`
- `capacity_hours_week >= 0`
- `max_concurrent_cases > 0`
- `max_complexity_level` ∈ `{LOW, MEDIUM, HIGH, CRITICAL}`

**Response 201:**
```json
{
  "id": "uuid",
  "status": "REGISTERED",
  "created_at": "2026-06-27T12:00:00Z"
}
```

---

### 4.4 Update Professional

```
PATCH /api/professionals/:id
```

**Auth:** Admin (all fields); Professional (own: `availability_days`, `availability_status`, `capacity_hours_week`, `max_concurrent_cases` only)

**Request body (all optional):**
```json
{
  "profession": "SOCIAL_WORKER",
  "experience_years": 6,
  "target_age_groups": ["0-5", "6-12"],
  "max_complexity_level": "HIGH",
  "qualifications": "string | null",
  "capacity_hours_week": 35.00,
  "max_concurrent_cases": 4,
  "availability_days": ["MONDAY", "TUESDAY", "THURSDAY"],
  "availability_status": "AVAILABLE",
  "status": "ACTIVE"
}
```

**Status transitions (admin only):**

| From | To | Workflow | Audit Event |
|---|---|---|---|
| `REGISTERED` | `ACTIVE` | WF-001 step 5 | `PROFESSIONAL_APPROVED` |
| `REGISTERED` | `ARCHIVED` | WF-001 A1 | `PROFESSIONAL_REJECTED` |
| `ACTIVE` | `INACTIVE` | WF-008 | `PROFESSIONAL_DEACTIVATED` |
| `INACTIVE` | `ACTIVE` | WF-008 | `PROFESSIONAL_REACTIVATED` |
| `ACTIVE` | `ARCHIVED` | WF-008 | `PROFESSIONAL_ARCHIVED` |

**Response 200:** Updated professional object (same shape as GET).

---

### 4.5 List Professional Documents

```
GET /api/professionals/:id/documents
```

**Auth:** Own documents (`auth.uid() = professional_id`) or admin  
**Query params:** `?status=UNVERIFIED&document_type=CV`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "professional_id": "uuid",
      "document_type": "CRIMINAL_RECORD",
      "status": "VERIFIED",
      "file_path": "string | null",
      "file_hash": "string | null",
      "uploaded_at": "2026-06-01T10:00:00Z | null",
      "uploaded_by": "uuid | null",
      "expiry_date": "2027-06-01 | null",
      "verified_at": "2026-06-05T14:00:00Z | null",
      "verified_by": "uuid | null",
      "verification_notes": "string | null",
      "re_upload_required": false,
      "created_at": "2026-05-30T10:00:00Z"
    }
  ],
  "count": 5
}
```

**TS-001 columns used:** `professional_documents.id`, `.professional_id`, `.document_type`, `.status`, `.file_path`, `.file_hash`, `.uploaded_at`, `.uploaded_by`, `.expiry_date`, `.verified_at`, `.verified_by`, `.verification_notes`, `.re_upload_required`, `.created_at`

---

### 4.6 Create Professional Document

```
POST /api/professionals/:id/documents
```

**Auth:** Professional (own) or admin  
**Workflow:** WF-001 step 2 / WF-011  
**Audit:** `DOCUMENT_UPLOADED` — `resource_type='professional_documents'`, `resource_id=new_id`

**Request body:**
```json
{
  "document_type": "CV",
  "file_path": "storage/professionals/{id}/cv_2026.pdf",
  "file_hash": "sha256:abc123...",
  "expiry_date": "2027-06-01"
}
```

**Validations:**
- `document_type` ∈ `{CV, CRIMINAL_RECORD, CHILD_PROTECTION, DRIVING_LICENSE, QUALIFICATION, INSURANCE, OTHER}`
- `file_path` required
- `file_hash` required (integrity)
- `expiry_date` optional (DATE)
- `uploaded_by` set from `auth.uid()`
- `uploaded_at` set to `NOW()`
- Status created as `UNVERIFIED` (file is present but not yet verified)

**Response 201:**
```json
{
  "id": "uuid",
  "professional_id": "uuid",
  "document_type": "CV",
  "status": "UNVERIFIED",
  "file_path": "storage/professionals/{id}/cv_2026.pdf",
  "file_hash": "sha256:abc123...",
  "uploaded_at": "2026-06-27T12:00:00Z",
  "uploaded_by": "uuid",
  "expiry_date": "2027-06-01",
  "verified_at": null,
  "verified_by": null,
  "verification_notes": null,
  "re_upload_required": false,
  "created_at": "2026-06-27T12:00:00Z"
}
```

---

### 4.7 Update Professional Document

```
PATCH /api/professionals/:id/documents/:docId
```

**Auth:** Admin (verification); Professional (re-upload when `re_upload_required = true`)

**Admin verification body:**
```json
{
  "status": "VERIFIED",
  "verification_notes": "Authentic, no issues",
  "expiry_date": "2028-06-01"
}
```

**Professional re-upload body:**
```json
{
  "file_path": "storage/professionals/{id}/cv_2026_v2.pdf",
  "file_hash": "sha256:def456..."
}
```

**Status transitions:**

| From | To | Actor | Audit Event |
|---|---|---|---|
| `UNVERIFIED` | `VERIFIED` | Admin (WF-001 step 3) | `DOCUMENT_VERIFIED` |
| `UNVERIFIED` → set `re_upload_required=true` | `PENDING_UPLOAD` | Admin | `DOCUMENT_REJECTED` |
| `PENDING_UPLOAD` | `UNVERIFIED` | Professional (re-uploads file) | `DOCUMENT_REUPLOADED` |
| Any | `ARCHIVED` | Admin | — |

**Notification:** `DOCUMENT_ACTION_REQUIRED` written to `notification_log` with `recipient_profile_id = professional_id` when `re_upload_required` set to `true`

**Response 200:** Updated document object (same shape as GET /documents item).

---

### 4.8 List Available Professionals

```
GET /api/professionals/available
```

**Auth:** Admin only  
**Purpose:** Professionals eligible for matching (WF-003)  
**Source:** `v_professionals_available` view (TS-001 §1.4)

**Query params:** `?max_complexity_level=HIGH&profession=PEDAGOGUE`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "profession": "PEDAGOGUE",
      "experience_years": 5,
      "max_complexity_level": "HIGH",
      "capacity_hours_week": 30.00,
      "max_concurrent_cases": 3,
      "current_assignments": 1,
      "current_hours_assigned": 12.50
    }
  ],
  "count": 8
}
```

**Columns from `v_professionals_available`:** `p.id`, `p.profession`, `p.experience_years`, `p.max_complexity_level`, `p.capacity_hours_week`, `p.max_concurrent_cases`, `COUNT(ca.id) as current_assignments`, `SUM(c.weekly_hours) as current_hours_assigned`

---

## 5. Municipality Domain Endpoints

**Tables:** `municipalities`  
**Workflows:** WF-002 (case creation uses municipality FK), WF-009

---

### 5.1 List Municipalities

```
GET /api/municipalities
```

**Auth:** All authenticated users  
**RLS:** TS-001 municipalities SELECT: all authenticated  
**Query params:** `?status=ACTIVE&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Aarhus Kommune",
      "status": "ACTIVE",
      "sagsbehandler_name": "string | null",
      "sagsbehandler_email": "string | null",
      "sagsbehandler_phone": "string | null",
      "secondary_contact_name": "string | null",
      "secondary_contact_email": "string | null",
      "secondary_contact_phone": "string | null",
      "created_at": "2026-06-01T10:00:00Z",
      "updated_at": "2026-06-01T10:00:00Z"
    }
  ],
  "count": 15
}
```

**TS-001 columns used:** `municipalities.id`, `.name`, `.status`, `.sagsbehandler_name`, `.sagsbehandler_email`, `.sagsbehandler_phone`, `.secondary_contact_name`, `.secondary_contact_email`, `.secondary_contact_phone`, `.created_at`, `.updated_at`

---

### 5.2 Get Municipality

```
GET /api/municipalities/:id
```

**Auth:** All authenticated users

**Response 200:** Single municipality object (same shape as list item).

---

### 5.3 Create Municipality

```
POST /api/municipalities
```

**Auth:** Admin only  
**Audit:** `MUNICIPALITY_CREATED` — `resource_type='municipalities'`

**Request body:**
```json
{
  "name": "Aarhus Kommune",
  "sagsbehandler_name": "string | null",
  "sagsbehandler_email": "string | null",
  "sagsbehandler_phone": "string | null",
  "secondary_contact_name": "string | null",
  "secondary_contact_email": "string | null",
  "secondary_contact_phone": "string | null"
}
```

**Validations:**
- `name` required; must be unique (`UNIQUE` constraint on `municipalities.name`)
- Status defaults to `ACTIVE`

**Response 201:**
```json
{
  "id": "uuid",
  "name": "Aarhus Kommune",
  "status": "ACTIVE",
  "created_at": "2026-06-27T12:00:00Z"
}
```

---

### 5.4 Update Municipality

```
PATCH /api/municipalities/:id
```

**Auth:** Admin only  
**RLS:** TS-001 municipalities UPDATE: admin only  
**Audit:** `MUNICIPALITY_UPDATED` — `resource_type='municipalities'`

**Request body (all optional):**
```json
{
  "name": "string",
  "status": "INACTIVE",
  "sagsbehandler_name": "string | null",
  "sagsbehandler_email": "string | null",
  "sagsbehandler_phone": "string | null",
  "secondary_contact_name": "string | null",
  "secondary_contact_email": "string | null",
  "secondary_contact_phone": "string | null"
}
```

**Status transitions:** `ACTIVE ↔ INACTIVE`

**Response 200:** Updated municipality object.

---

## 6. Case Domain Endpoints

**Tables:** `cases`, `case_complexity_factors`, `case_assignments`, `case_grants`, `case_handovers`  
**Workflows:** WF-002, WF-003, WF-004, WF-007, WF-008, WF-012

---

### 6.1 List Cases

```
GET /api/cases
```

**Auth:** Admin (all); Professional (assigned cases only — RLS enforced)  
**RLS:** TS-001 cases SELECT: `admin sees all`, `professional sees assigned cases only`  
**Query params:** `?status=OPEN&municipality_id=uuid&complexity_level=HIGH&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "municipality_id": "uuid",
      "status": "ACTIVE",
      "citizen_initials": "AB",
      "citizen_age_range": "13-18",
      "citizen_notes": "string | null (encrypted, decrypted before return)",
      "weekly_hours": 8.00,
      "complexity_level": "HIGH",
      "created_at": "2026-06-01T10:00:00Z",
      "updated_at": "2026-06-01T10:00:00Z",
      "archived_at": null,
      "data_retention_expires_at": null
    }
  ],
  "count": 27
}
```

**TS-001 columns used:** `cases.id`, `.municipality_id`, `.status`, `.citizen_initials`, `.citizen_age_range`, `.citizen_notes`, `.weekly_hours`, `.complexity_level`, `.created_at`, `.updated_at`, `.archived_at`, `.data_retention_expires_at`

---

### 6.2 Get Case

```
GET /api/cases/:id
```

**Auth:** Admin or assigned professional (RLS enforced)

**Response 200:** Single case object (same shape as list item).

---

### 6.3 Create Case

```
POST /api/cases
```

**Auth:** Admin only  
**Workflow:** WF-002 step 1  
**Audit:** `CASE_CREATED` — metadata: `{ "citizen_initials": "AB", "municipality_id": "uuid" }`  
**Notification:** `CASE_CREATED` to `notification_log`

**Request body:**
```json
{
  "municipality_id": "uuid",
  "citizen_initials": "AB",
  "citizen_age_range": "13-18",
  "citizen_notes": "string | null",
  "weekly_hours": 8.00,
  "complexity_level": "HIGH"
}
```

**Validations:**
- `municipality_id` must reference existing municipality (`status = 'ACTIVE'` recommended)
- `citizen_initials` exactly 2 characters (`CHAR(2)` constraint in TS-001)
- `citizen_age_range` ∈ `{0-5, 6-12, 13-18, 18+}`
- `weekly_hours >= 0`
- `complexity_level` ∈ `{LOW, MEDIUM, HIGH, CRITICAL}`
- **No `citizen_name`, `citizen_cpr`, `citizen_age`, `case_number`** — GDPR prohibition (WF-002, TS-001)

**Response 201:**
```json
{
  "id": "uuid",
  "status": "OPEN",
  "created_at": "2026-06-27T12:00:00Z"
}
```

---

### 6.4 Update Case

```
PATCH /api/cases/:id
```

**Auth:** Admin only  
**RLS:** TS-001 cases UPDATE: admin only

**Request body (all optional):**
```json
{
  "citizen_initials": "CD",
  "citizen_age_range": "18+",
  "citizen_notes": "string | null",
  "weekly_hours": 10.00,
  "complexity_level": "CRITICAL"
}
```

**Notes:**
- `municipality_id` not patchable after creation
- Status transitions are handled by `POST /api/cases/:id/status`
- `archived_at` and `data_retention_expires_at` set by system, not via this endpoint

**Response 200:** Updated case object.

---

### 6.5 Transition Case Status

```
POST /api/cases/:id/status
```

**Auth:** Admin only

**Request body:**
```json
{
  "status": "ACTIVE",
  "reason": "string | null"
}
```

**Valid transitions (TS-001):**

| From | To | Workflow | Audit Event |
|---|---|---|---|
| `OPEN` | `MATCHED` | WF-003 | `CASE_MATCHED` |
| `MATCHED` | `ACTIVE` | WF-004 | `CASE_ACTIVATED` |
| `MATCHED` | `OPEN` | WF-003 cancelled | `CASE_REOPENED` |
| `ACTIVE` | `COMPLETED` | WF-012 | `CASE_COMPLETED` |
| `COMPLETED` | `ARCHIVED` | WF-012 | `CASE_ARCHIVED` |
| `OPEN` | `ARCHIVED` | WF-012 | `CASE_ARCHIVED` |

**Response 200:**
```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "updated_at": "2026-06-27T12:00:00Z"
}
```

---

### 6.6 Get Case Complexity Factors

```
GET /api/cases/:id/complexity
```

**Auth:** Admin or assigned professional  
**RLS:** TS-001 case_complexity_factors SELECT: admins and assigned professionals

**Response 200:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "mental_health": true,
  "family_instability": false,
  "school": true,
  "violence": false,
  "substance_use": false,
  "criminality": false,
  "multiple_agencies": true,
  "diagnosis": "string | null",
  "notes": "string | null",
  "created_at": "2026-06-01T10:00:00Z",
  "updated_at": "2026-06-01T10:00:00Z"
}
```

**TS-001 columns used:** `case_complexity_factors.id`, `.case_id`, `.mental_health`, `.family_instability`, `.school`, `.violence`, `.substance_use`, `.criminality`, `.multiple_agencies`, `.diagnosis`, `.notes`, `.created_at`, `.updated_at`

**Response 404:** No complexity record yet for this case.

---

### 6.7 Upsert Case Complexity Factors

```
PUT /api/cases/:id/complexity
```

**Auth:** Admin only  
**Pattern:** Upsert (`case_id UNIQUE` in TS-001 — one row per case)  
**Audit:** `COMPLEXITY_FACTORS_UPDATED` — `resource_type='case_complexity_factors'`

**Request body:**
```json
{
  "mental_health": true,
  "family_instability": false,
  "school": true,
  "violence": false,
  "substance_use": false,
  "criminality": false,
  "multiple_agencies": true,
  "diagnosis": "string | null",
  "notes": "string | null"
}
```

**Notes:**
- All boolean fields default to `false` if omitted
- After upsert, backend recalculates `complexity_level` per scoring formula (TS-001 §case_complexity_factors) and updates `cases.complexity_level`

**Response 200:** Updated complexity factors object.

---

### 6.8 List Case Assignments

```
GET /api/cases/:id/assignments
```

**Auth:** Admin or assigned professional  
**Query params:** `?assignment_status=ACTIVE`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "professional_id": "uuid",
      "assignment_status": "ACTIVE",
      "started_at": "2026-06-01T10:00:00Z",
      "ended_at": null,
      "assigned_by": "uuid",
      "assignment_reason": "Algorithm top-ranked candidate",
      "created_at": "2026-06-01T10:00:00Z"
    }
  ],
  "count": 2
}
```

**TS-001 columns used:** `case_assignments.id`, `.case_id`, `.professional_id`, `.assignment_status`, `.started_at`, `.ended_at`, `.assigned_by`, `.assignment_reason`, `.created_at`

---

### 6.9 Create Case Assignment

```
POST /api/cases/:id/assignments
```

**Auth:** Admin only  
**Workflow:** WF-003 step 5 / WF-004  
**Constraint:** Only one ACTIVE assignment per case (`UNIQUE INDEX on case_id WHERE ended_at IS NULL` in TS-001)  
**Audit:** `CASE_ASSIGNED` — `resource_type='case_assignments'`

**Request body:**
```json
{
  "professional_id": "uuid",
  "assignment_reason": "Algorithm top-ranked candidate, approved by admin",
  "started_at": "2026-06-27T12:00:00Z"
}
```

**Validations:**
- `professional_id` must reference professional with `status = 'ACTIVE'`
- No existing active assignment for this case
- Case `status` must be `MATCHED` or `ACTIVE`
- `assigned_by` set from `auth.uid()`
- `assignment_status` defaults to `ACTIVE`

**Response 201:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "professional_id": "uuid",
  "assignment_status": "ACTIVE",
  "started_at": "2026-06-27T12:00:00Z",
  "ended_at": null,
  "assigned_by": "uuid",
  "assignment_reason": "string",
  "created_at": "2026-06-27T12:00:00Z"
}
```

---

### 6.10 End Case Assignment

```
POST /api/cases/:id/assignments/:assignmentId/end
```

**Auth:** Admin only  
**Pattern:** Write-once — assignments are never UPDATEd, only ended (TS-001 §case_assignments)  
**Audit:** `CASE_ASSIGNMENT_ENDED` — `resource_type='case_assignments'`

**Request body:**
```json
{
  "assignment_status": "TRANSITIONED",
  "ended_at": "2026-06-27T12:00:00Z"
}
```

**Valid terminal statuses:** `TRANSITIONED | TERMINATED`

**Response 200:**
```json
{
  "id": "uuid",
  "assignment_status": "TRANSITIONED",
  "ended_at": "2026-06-27T12:00:00Z"
}
```

---

### 6.11 List Case Grants

```
GET /api/cases/:id/grants
```

**Auth:** All authenticated users (TS-001 RLS: SELECT all authenticated)  
**Query params:** `?status=ACTIVE`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "municipality_id": "uuid",
      "granted_hours": 48.00,
      "period_start": "2026-06-01",
      "period_end": "2026-08-31",
      "status": "ACTIVE",
      "created_by": "uuid",
      "created_at": "2026-06-01T10:00:00Z",
      "activated_at": "2026-06-01T10:00:00Z",
      "archived_at": null
    }
  ],
  "count": 3
}
```

**TS-001 columns used:** `case_grants.id`, `.case_id`, `.municipality_id`, `.granted_hours`, `.period_start`, `.period_end`, `.status`, `.created_by`, `.created_at`, `.activated_at`, `.archived_at`

---

### 6.12 Create Case Grant

```
POST /api/cases/:id/grants
```

**Auth:** Admin only  
**Audit:** `GRANT_CREATED` — `resource_type='case_grants'`

**Request body:**
```json
{
  "municipality_id": "uuid",
  "granted_hours": 48.00,
  "period_start": "2026-06-01",
  "period_end": "2026-08-31"
}
```

**Validations:**
- `granted_hours > 0`
- `period_end > period_start`
- `created_by` set from `auth.uid()`
- Status defaults to `PENDING`

**Response 201:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "municipality_id": "uuid",
  "granted_hours": 48.00,
  "period_start": "2026-06-01",
  "period_end": "2026-08-31",
  "status": "PENDING",
  "created_by": "uuid",
  "created_at": "2026-06-27T12:00:00Z",
  "activated_at": null,
  "archived_at": null
}
```

---

### 6.13 Update Case Grant Status

```
PATCH /api/cases/:id/grants/:grantId
```

**Auth:** Admin only  
**Audit:** `GRANT_ACTIVATED` / `GRANT_ARCHIVED` / `GRANT_REVOKED`

**Request body:**
```json
{
  "status": "ACTIVE"
}
```

**Valid transitions (TS-001):**

| From | To | Description |
|---|---|---|
| `PENDING` | `ACTIVE` | Activate grant (WF-004) |
| `ACTIVE` | `ARCHIVED` | Period ended |
| `ACTIVE` | `REVOKED` | Municipality revokes |

**Response 200:** Updated grant object.

---

### 6.14 List Case Handovers

```
GET /api/cases/:id/handovers
```

**Auth:** Admin only (TS-001 RLS: SELECT admins only)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "outgoing_professional_id": "uuid",
      "incoming_professional_id": "uuid | null",
      "reason": "WORKLOAD_EXCEEDED",
      "status": "COMPLETED",
      "handover_note": "string | null (encrypted)",
      "session_logs_transferred": true,
      "transferred_session_logs": ["uuid", "uuid"],
      "created_by": "uuid",
      "created_at": "2026-06-01T10:00:00Z",
      "completed_at": "2026-06-10T10:00:00Z"
    }
  ],
  "count": 1
}
```

**TS-001 columns used:** `case_handovers.id`, `.case_id`, `.outgoing_professional_id`, `.incoming_professional_id`, `.reason`, `.status`, `.handover_note`, `.session_logs_transferred`, `.transferred_session_logs`, `.created_by`, `.created_at`, `.completed_at`

---

### 6.15 Initiate Case Handover

```
POST /api/cases/:id/handovers
```

**Auth:** Admin only  
**Workflow:** WF-008 step 1  
**Audit:** `HANDOVER_INITIATED` — `resource_type='case_handovers'`

**Request body:**
```json
{
  "outgoing_professional_id": "uuid",
  "incoming_professional_id": "uuid | null",
  "reason": "WORKLOAD_EXCEEDED",
  "handover_note": "string | null"
}
```

**Reason enum (TS-001):** `PROFESSIONAL_UNAVAILABLE | WORKLOAD_EXCEEDED | REQUEST_PROFESSIONAL | REQUEST_CASE | BETTER_MATCH | SAFEGUARDING_CONCERN | OTHER`

**Validations:**
- `outgoing_professional_id` must be the current ACTIVE assignment for this case
- `reason` must match TS-001 CHECK constraint exactly
- `incoming_professional_id` null if case is terminating (no replacement)
- `created_by` set from `auth.uid()`
- Status defaults to `INITIATED`

**Response 201:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "status": "INITIATED",
  "created_at": "2026-06-27T12:00:00Z"
}
```

---

### 6.16 Update Case Handover

```
PATCH /api/cases/:id/handovers/:handoverId
```

**Auth:** Admin only  
**Audit:** `HANDOVER_PROGRESSED` / `HANDOVER_COMPLETED` / `HANDOVER_CANCELLED`

**Request body:**
```json
{
  "status": "COMPLETED",
  "incoming_professional_id": "uuid | null",
  "session_logs_transferred": true,
  "transferred_session_logs": ["uuid", "uuid"]
}
```

**Valid transitions (TS-001):**

| From | To |
|---|---|
| `INITIATED` | `IN_PROGRESS` |
| `IN_PROGRESS` | `COMPLETED` |
| `INITIATED` | `CANCELLED` |
| `IN_PROGRESS` | `CANCELLED` |

**Response 200:** Updated handover object.

---

## 7. Delivery Domain Endpoints

**Tables:** `session_logs`, `session_log_corrections`, `session_log_transfers`, `registered_hours`, `contact_logs`, `contact_disclosures`  
**Workflows:** WF-005, WF-006, WF-007, WF-008, WF-009, WF-010

---

### 7.1 List Session Logs

```
GET /api/session-logs
```

**Auth:** Admin (all); Professional (own only — RLS: `professional_id = auth.uid()`)  
**Query params:** `?case_id=uuid&status=DRAFT&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "professional_id": "uuid",
      "session_date": "2026-06-20",
      "duration_minutes": 90,
      "status": "FINAL",
      "observations": "string | null (encrypted)",
      "citizen_mood_tone": "string | null (encrypted)",
      "follow_up_needed": false,
      "follow_up_reason": null,
      "safeguarding_concern_flag": false,
      "safeguarding_detail": null,
      "safeguarding_acknowledged_at": null,
      "safeguarding_acknowledged_by": null,
      "participant_names": [],
      "location": "string | null (encrypted)",
      "created_by": "uuid",
      "created_at": "2026-06-20T15:00:00Z",
      "data_retention_expires_at": null
    }
  ],
  "count": 12
}
```

**TS-001 columns used:** `session_logs.id`, `.case_id`, `.professional_id`, `.session_date`, `.duration_minutes`, `.status`, `.observations`, `.citizen_mood_tone`, `.follow_up_needed`, `.follow_up_reason`, `.safeguarding_concern_flag`, `.safeguarding_detail`, `.safeguarding_acknowledged_at`, `.safeguarding_acknowledged_by`, `.participant_names`, `.location`, `.created_by`, `.created_at`, `.data_retention_expires_at`

---

### 7.2 Get Session Log

```
GET /api/session-logs/:id
```

**Auth:** Admin, own professional, or recipient of session transfer (RLS)

**Response 200:** Single session log object (same shape as list item).

---

### 7.3 Create Session Log

```
POST /api/session-logs
```

**Auth:** Professional (own) or admin  
**Workflow:** WF-005 step 1  
**Audit:** `SESSION_LOG_CREATED` — metadata: `{ "case_id": "uuid", "professional_id": "uuid", "session_date": "2026-06-20" }`

**Request body:**
```json
{
  "case_id": "uuid",
  "session_date": "2026-06-20",
  "duration_minutes": 90,
  "observations": "string | null",
  "citizen_mood_tone": "string | null",
  "follow_up_needed": false,
  "follow_up_reason": null,
  "safeguarding_concern_flag": false,
  "safeguarding_detail": null,
  "participant_names": [],
  "location": "string | null"
}
```

**Validations:**
- `case_id` must be a case where professional is the active assignment
- `session_date` must not be in future
- `duration_minutes >= 1`
- `professional_id` and `created_by` set from `auth.uid()` (both reference `professionals.id`)
- Status defaults to `DRAFT`
- Duplicate detection: backend warns if same (case_id, professional_id, session_date) within 1 hour (TS-001 §session_logs)
- **No `session_start_time`, `session_end_time`, `submitted_at`** — TS-001 stores only `duration_minutes`
- **No `status = 'SUBMITTED'`** — TS-001 status is `DRAFT | FINAL | CORRECTED | ARCHIVED`

**Response 201:**
```json
{
  "id": "uuid",
  "status": "DRAFT",
  "created_at": "2026-06-20T15:00:00Z"
}
```

---

### 7.4 Update Session Log

```
PATCH /api/session-logs/:id
```

**Auth:** Professional (own, DRAFT only)  
**Constraint:** `status = 'DRAFT'` — FINAL logs are immutable (TS-001 write-once pattern)

**Request body (any subset):**
```json
{
  "session_date": "2026-06-20",
  "duration_minutes": 90,
  "observations": "string | null",
  "citizen_mood_tone": "string | null",
  "follow_up_needed": true,
  "follow_up_reason": "string",
  "safeguarding_concern_flag": false,
  "safeguarding_detail": null,
  "participant_names": [],
  "location": "string | null"
}
```

**Error 409:** If `status != 'DRAFT'`

**Response 200:** Updated session log object.

---

### 7.5 Finalize Session Log

```
POST /api/session-logs/:id/finalize
```

**Auth:** Professional (own)  
**Workflow:** WF-005 step 2  
**Constraint:** `status = 'DRAFT'`  
**Audit:** `SESSION_LOG_FINALIZED` — metadata: `{ "session_log_id": "uuid", "professional_id": "uuid", "case_id": "uuid" }`  
**Notification:** If `safeguarding_concern_flag = true`: `SAFEGUARDING_FLAGGED` to `notification_log` with `recipient_email = SYSTEM_ADMIN_EMAIL`

**Effect:** `status → FINAL` (immutable after this)

**Response 200:**
```json
{
  "id": "uuid",
  "status": "FINAL",
  "updated_at": "2026-06-20T16:00:00Z"
}
```

**Error 409:** If already `FINAL`, `CORRECTED`, or `ARCHIVED`

---

### 7.6 Create Session Log Correction

```
POST /api/session-logs/:id/corrections
```

**Auth:** Professional (own) or admin  
**Workflow:** WF-005 A1  
**Constraint:** `session_log.status = 'FINAL'` before correction  
**Effect:** Parent `session_logs.status → CORRECTED`  
**Audit:** `SESSION_LOG_CORRECTED` — metadata: `{ "correction_reason": "TYPO", "session_log_id": "uuid" }`

**Request body:**
```json
{
  "correction_note": "Corrected session date from 2026-06-19 to 2026-06-20",
  "correction_reason": "TYPO"
}
```

**Correction reason enum (TS-001):** `TYPO | WRONG_TIME | CLARIFICATION | OMISSION | OTHER`

**Validations:**
- `correction_note` required (non-empty)
- `correction_reason` must match TS-001 CHECK constraint exactly
- No `old_value` / `new_value` fields — privacy-safe pattern (ADR-004)
- `created_by` set from `auth.uid()`

**Response 201:**
```json
{
  "id": "uuid",
  "session_log_id": "uuid",
  "correction_note": "Corrected session date from 2026-06-19 to 2026-06-20",
  "correction_reason": "TYPO",
  "created_by": "uuid",
  "created_at": "2026-06-21T10:00:00Z"
}
```

**TS-001 columns used:** `session_log_corrections.id`, `.session_log_id`, `.correction_note`, `.correction_reason`, `.created_by`, `.created_at`

---

### 7.7 List Session Log Corrections

```
GET /api/session-logs/:id/corrections
```

**Auth:** Admin or own session log professional

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "session_log_id": "uuid",
      "correction_note": "string",
      "correction_reason": "TYPO",
      "created_by": "uuid",
      "created_at": "2026-06-21T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 7.8 Transfer Session Log

```
POST /api/session-logs/:id/transfers
```

**Auth:** Admin only  
**Workflow:** WF-008  
**Audit:** `SESSION_LOG_TRANSFERRED` — `resource_type='session_log_transfers'`

**Request body:**
```json
{
  "to_professional_id": "uuid",
  "reason": "Case handover — incoming professional needs case history",
  "transfer_note": "string | null"
}
```

**Validations:**
- `from_professional_id` derived from `session_log.professional_id`
- `to_professional_id` must reference an ACTIVE professional
- `approved_by` set from `auth.uid()`
- `visibility_granted_at` defaults to `NOW()`

**Response 201:**
```json
{
  "id": "uuid",
  "session_log_id": "uuid",
  "from_professional_id": "uuid",
  "to_professional_id": "uuid",
  "approved_by": "uuid",
  "reason": "string",
  "transfer_note": "string | null",
  "created_at": "2026-06-27T12:00:00Z",
  "visibility_granted_at": "2026-06-27T12:00:00Z"
}
```

**TS-001 columns used:** `session_log_transfers.id`, `.session_log_id`, `.from_professional_id`, `.to_professional_id`, `.approved_by`, `.reason`, `.transfer_note`, `.created_at`, `.visibility_granted_at`

---

### 7.9 Acknowledge Safeguarding Concern

```
POST /api/session-logs/:id/safeguarding/acknowledge
```

**Auth:** Admin only  
**Constraint:** `session_log.safeguarding_concern_flag = true`  
**Audit:** `SAFEGUARDING_CONCERN_ACKNOWLEDGED` — metadata: `{ "session_log_id": "uuid", "acknowledged_by": "uuid" }`

**Request body:** None

**Effect:** Sets `safeguarding_acknowledged_at = NOW()`, `safeguarding_acknowledged_by = auth.uid()`

**Response 200:**
```json
{
  "id": "uuid",
  "safeguarding_acknowledged_at": "2026-06-27T12:00:00Z",
  "safeguarding_acknowledged_by": "uuid"
}
```

---

### 7.10 List Registered Hours

```
GET /api/registered-hours
```

**Auth:** Admin (all); Professional (own only — RLS: `professional_id = auth.uid()`)  
**Query params:** `?case_id=uuid&status=SUBMITTED&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "professional_id": "uuid",
      "work_date": "2026-06-20",
      "work_type": "DIRECT_SESSION",
      "hours": 3.00,
      "session_log_id": "uuid | null",
      "status": "APPROVED",
      "submitted_at": "2026-06-21T10:00:00Z | null",
      "grant_period_id": "uuid | null",
      "description": "string | null",
      "outside_grant_reason": null,
      "reviewed_by": "uuid | null",
      "reviewed_at": "2026-06-22T10:00:00Z | null",
      "review_note": "string | null",
      "created_by": "uuid",
      "created_at": "2026-06-20T17:00:00Z",
      "updated_by": "uuid | null",
      "updated_at": "2026-06-22T10:00:00Z"
    }
  ],
  "count": 14
}
```

**TS-001 columns used:** `registered_hours.id`, `.case_id`, `.professional_id`, `.work_date`, `.work_type`, `.hours`, `.session_log_id`, `.status`, `.submitted_at`, `.grant_period_id`, `.description`, `.outside_grant_reason`, `.reviewed_by`, `.reviewed_at`, `.review_note`, `.created_by`, `.created_at`, `.updated_by`, `.updated_at`

---

### 7.11 Get Registered Hours Entry

```
GET /api/registered-hours/:id
```

**Auth:** Admin or own entry professional

**Response 200:** Single hours entry (same shape as list item).

---

### 7.12 Create Registered Hours Entry

```
POST /api/registered-hours
```

**Auth:** Professional (own) or admin  
**Workflow:** WF-006 step 1  
**Audit:** `HOURS_REGISTERED` — `resource_type='registered_hours'`

**Request body:**
```json
{
  "case_id": "uuid",
  "work_date": "2026-06-20",
  "work_type": "DIRECT_SESSION",
  "hours": 3.00,
  "session_log_id": "uuid | null",
  "grant_period_id": "uuid | null",
  "description": "string | null"
}
```

**Validations:**
- `hours >= 0.25 AND hours <= 8.0` (TS-001 CHECK constraint)
- `work_type` ∈ `{DIRECT_SESSION, TRANSPORT, DOCUMENTATION, COORDINATION, CRISIS_RESPONSE, TRAINING, OTHER}`
- `case_id` must be a case where professional is active assignment
- Professional status must be `ACTIVE`
- `created_by` set from `auth.uid()` (references `professionals.id`)
- Status defaults to `PENDING`
- `submitted_at` defaults to `NULL`
- Duplicate detection: backend warns on same (case_id, professional_id, work_date, work_type, hours) within 24h
- **No field `hours_worked`** — TS-001 column is `hours`
- **No field `session_date`** — TS-001 column is `work_date`
- **No field `notes`** — TS-001 column is `description`

**Response 201:**
```json
{
  "id": "uuid",
  "status": "PENDING",
  "created_at": "2026-06-20T17:00:00Z"
}
```

---

### 7.13 Update Registered Hours Entry

```
PATCH /api/registered-hours/:id
```

**Auth:** Professional (own, `status = PENDING` only)  
**Constraint:** Only PENDING entries are editable (TS-001 business rule WF-006)  
**Audit:** `HOURS_MODIFIED`

**Request body:**
```json
{
  "work_date": "2026-06-21",
  "work_type": "DOCUMENTATION",
  "hours": 2.50,
  "session_log_id": "uuid | null",
  "description": "string | null"
}
```

**Error 409:** If `status != 'PENDING'`

**Response 200:** Updated hours entry.

---

### 7.14 Submit Registered Hours

```
POST /api/registered-hours/:id/submit
```

**Auth:** Professional (own)  
**Workflow:** WF-006 step 2  
**Constraint:** `status = 'PENDING'`  
**Audit:** `HOURS_SUBMITTED` — `resource_type='registered_hours'`  
**Notification:** `HOURS_SUBMITTED` to `notification_log` with `recipient_email = SYSTEM_ADMIN_EMAIL` (ADR-010)

**Request body:** None

**Effect:** `status → SUBMITTED`, `submitted_at = NOW()` — immutable for professional after this point (TS-001)

**Response 200:**
```json
{
  "id": "uuid",
  "status": "SUBMITTED",
  "submitted_at": "2026-06-21T10:00:00Z"
}
```

---

### 7.15 Review Registered Hours (Admin)

```
POST /api/registered-hours/:id/review
```

**Auth:** Admin only  
**Workflow:** WF-006 steps 4–5; WF-007 for OUTSIDE_GRANT  
**Constraint:** `status = 'SUBMITTED'`

**Request body:**
```json
{
  "status": "APPROVED",
  "review_note": "string | null"
}
```

**Valid outcome statuses (TS-001):** `APPROVED | REJECTED | OUTSIDE_GRANT`

**Grant check (WF-006 step 4):**
```
remaining_hours = grant.granted_hours - SUM(registered_hours.hours WHERE status='APPROVED' AND grant_period_id=X)
If this_entry.hours + approved_total > grant.granted_hours:
  → return status=OUTSIDE_GRANT (WF-007)
```

**Effect on APPROVED/REJECTED/OUTSIDE_GRANT:** Sets `reviewed_by = auth.uid()`, `reviewed_at = NOW()`

**Audit events:**
- `APPROVED` → `HOURS_APPROVED`
- `REJECTED` → `HOURS_REJECTED`
- `OUTSIDE_GRANT` → `HOURS_OUTSIDE_GRANT_FLAGGED`

**Response 200:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "reviewed_by": "uuid",
  "reviewed_at": "2026-06-22T10:00:00Z"
}
```

---

### 7.16 List Contact Logs

```
GET /api/cases/:id/contact-logs
```

**Auth:** Admin or assigned professional  
**RLS:** TS-001 contact_logs SELECT: professional sees own, admins see all

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "professional_id": "uuid",
      "contact_type": "PHONE_CALL",
      "logged_at": "2026-06-20T11:00:00Z",
      "logged_by": "uuid",
      "note": "string | null (encrypted)",
      "outcome": "string | null (encrypted)",
      "follow_up_required": false,
      "created_at": "2026-06-20T11:05:00Z"
    }
  ],
  "count": 5
}
```

**TS-001 columns used:** `contact_logs.id`, `.case_id`, `.professional_id`, `.contact_type`, `.logged_at`, `.logged_by`, `.note`, `.outcome`, `.follow_up_required`, `.created_at`

---

### 7.17 Create Contact Log

```
POST /api/cases/:id/contact-logs
```

**Auth:** Professional (assigned) or admin  
**Workflow:** WF-010  
**Audit:** `CONTACT_LOGGED` — `resource_type='contact_logs'`

**Request body:**
```json
{
  "professional_id": "uuid",
  "contact_type": "PHONE_CALL",
  "logged_at": "2026-06-20T11:00:00Z",
  "note": "string | null",
  "outcome": "string | null",
  "follow_up_required": false
}
```

**Validations:**
- `contact_type` ∈ `{PHONE_CALL, EMAIL, IN_PERSON, OTHER}`
- `logged_at` required (`TIMESTAMPTZ NOT NULL` in TS-001)
- `logged_by` set from `auth.uid()`
- **No `contacted_party` field** — not in TS-001
- Append-only (no updates after creation)

**Response 201:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "professional_id": "uuid",
  "contact_type": "PHONE_CALL",
  "logged_at": "2026-06-20T11:00:00Z",
  "logged_by": "uuid",
  "created_at": "2026-06-20T11:05:00Z"
}
```

---

### 7.18 List Contact Disclosures

```
GET /api/cases/:id/contact-disclosures
```

**Auth:** Admin only (TS-001 RLS: SELECT admin only)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "disclosed_to_professional_id": "uuid",
      "disclosed_by": "uuid",
      "disclosed_at": "2026-06-01T10:00:00Z",
      "contact_method": "EMAIL",
      "sagsbehandler_name": "string | null",
      "sagsbehandler_email": "string | null",
      "sagsbehandler_phone": "string | null",
      "reason": "string | null (encrypted)",
      "created_at": "2026-06-01T10:00:00Z"
    }
  ],
  "count": 2
}
```

**TS-001 columns used:** `contact_disclosures.id`, `.case_id`, `.disclosed_to_professional_id`, `.disclosed_by`, `.disclosed_at`, `.contact_method`, `.sagsbehandler_name`, `.sagsbehandler_email`, `.sagsbehandler_phone`, `.reason`, `.created_at`

---

### 7.19 Create Contact Disclosure

```
POST /api/cases/:id/contact-disclosures
```

**Auth:** Admin only  
**Workflow:** WF-004, WF-008, WF-009  
**Audit:** `CONTACT_DISCLOSED` — `resource_type='contact_disclosures'`

**Request body:**
```json
{
  "disclosed_to_professional_id": "uuid",
  "contact_method": "EMAIL",
  "sagsbehandler_name": "string | null",
  "sagsbehandler_email": "string | null",
  "sagsbehandler_phone": "string | null",
  "reason": "string | null"
}
```

**Validations:**
- `contact_method` ∈ `{EMAIL, PHONE, MEETING}`
- `disclosed_by` set from `auth.uid()`
- `disclosed_at` set to `NOW()`
- Append-only (immutable after creation)

**Response 201:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "disclosed_to_professional_id": "uuid",
  "contact_method": "EMAIL",
  "disclosed_at": "2026-06-27T12:00:00Z",
  "created_at": "2026-06-27T12:00:00Z"
}
```

---

## 8. Matching Domain Endpoints

**Tables:** `match_runs`, `match_candidates`  
**Workflow:** WF-003

---

### 8.1 List Match Runs

```
GET /api/match-runs
```

**Auth:** Admin only (TS-001 RLS: SELECT admins only)  
**Query params:** `?case_id=uuid&status=SCORED&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "triggered_by": "uuid",
      "triggered_at": "2026-06-27T10:00:00Z",
      "status": "SCORED",
      "algorithm_version": "1.0",
      "final_assignment_id": "uuid | null",
      "assigned_at": null,
      "selected_by": null,
      "selected_at": null,
      "selected_reason": null,
      "matching_criteria": {},
      "notes": null,
      "created_at": "2026-06-27T10:00:00Z"
    }
  ],
  "count": 4
}
```

**TS-001 columns used:** `match_runs.id`, `.case_id`, `.triggered_by`, `.triggered_at`, `.status`, `.algorithm_version`, `.final_assignment_id`, `.assigned_at`, `.selected_by`, `.selected_at`, `.selected_reason`, `.matching_criteria`, `.notes`, `.created_at`

---

### 8.2 Get Match Run

```
GET /api/match-runs/:id
```

**Auth:** Admin only

**Response 200:** Single match run object (same shape as list item).

---

### 8.3 Trigger Match Run

```
POST /api/match-runs
```

**Auth:** Admin only  
**Workflow:** WF-003 step 1  
**Audit:** `MATCH_RUN_TRIGGERED` — `resource_type='match_runs'`

**Request body:**
```json
{
  "case_id": "uuid",
  "matching_criteria": {
    "require_profession": "PEDAGOGUE",
    "min_experience_years": 3,
    "notes": "string | null"
  }
}
```

**Validations:**
- `case_id` must reference case with `status = 'OPEN'`
- `triggered_by` set from `auth.uid()`
- `triggered_at` set to `NOW()`
- Status defaults to `INITIATED`

**Backend processing:**
1. Insert `match_runs` with `status = INITIATED`
2. Score professionals from `v_professionals_available`
3. Insert `match_candidates` rows with 5 score columns each
4. Update `match_runs.status = SCORED`

**Response 201:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "status": "INITIATED",
  "algorithm_version": "1.0",
  "triggered_at": "2026-06-27T10:00:00Z"
}
```

---

### 8.4 List Match Candidates

```
GET /api/match-runs/:id/candidates
```

**Auth:** Admin only

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "match_run_id": "uuid",
      "professional_id": "uuid",
      "rank": 1,
      "overall_score": 87.50,
      "qualifications_score": 90.00,
      "availability_score": 85.00,
      "capacity_score": 88.00,
      "complexity_fit_score": 87.00,
      "algorithm_version": "1.0",
      "scoring_explanation": "string (decrypted before return — human-readable explanation of the overall score)",
      "created_at": "2026-06-27T10:05:00Z",
      "professional": {
        "full_name": "string | null",
        "profession": "string",
        "experience_years": 5,
        "availability_status": "AVAILABLE",
        "capacity_hours_week": 20,
        "max_concurrent_cases": 4,
        "availability_days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        "qualifications": ["Socialrådgiver", "Familieterapeut"],
        "profile_photo_url": "string | null"
      },
      "match_strengths": ["string"],
      "attention_points": ["string"]
    }
  ],
  "count": 5
}
```

**TS-001 columns used:**
- `match_candidates`: `id`, `match_run_id`, `professional_id`, `rank`, `overall_score`, `qualifications_score`, `availability_score`, `capacity_score`, `complexity_fit_score`, `algorithm_version`, `scoring_explanation`, `created_at`
- `professionals` (joined): `profession`, `experience_years`, `availability_status`, `capacity_hours_week`, `max_concurrent_cases`, `availability_days`, `qualifications`
- `profiles` (joined): `full_name`

**Derived fields (computed at API layer — not stored in DB):**

| Field | Source | Logic |
|---|---|---|
| `professional.profile_photo_url` | Supabase Storage | Signed URL generated at API layer for the professional's photo object; `null` if no photo uploaded |
| `match_strengths` | Score dimensions | Array of human-readable strings derived from score components: dimension scores ≥ 80 become a strength bullet. E.g. `qualifications_score ≥ 80` → `"Stærke kvalifikationer inden for feltet"`. Computed by the API, never stored |
| `attention_points` | Score dimensions | Array of human-readable strings derived from score components: dimension scores < 60 become an attention bullet. E.g. `capacity_score < 60` → `"Begrænset kapacitet — verificér ugentlige timer"`. Computed by the API, never stored |

**Thresholds for match_strengths / attention_points:**

| Dimension | Strength (≥) | Attention (<) | Example strength text | Example attention text |
|---|---|---|---|---|
| `qualifications_score` | 80 | 60 | "Stærke faglige kvalifikationer" | "Kvalifikationer matcher ikke fuldt ud — gennemgå CV" |
| `availability_score` | 80 | 60 | "God tilgængelighed i sagperioden" | "Begrænset tilgængelighed — tjek datoer" |
| `capacity_score` | 80 | 60 | "Kapacitet til nye sager" | "Tæt på kapacitetsgrænsen — verificér ugentlige timer" |
| `complexity_fit_score` | 80 | 60 | "Erfaring med tilsvarende kompleksitet" | "Har primært erfaring med enklere sager" |

**Notes:**
- Ordered by `rank ASC` (1 = best)
- **No `selected BOOLEAN` field** — not in TS-001
- **No single `score` field** — TS-001 has 5 separate score columns
- `match_strengths` and `attention_points` are **never stored in the database** — they are computed on each API call from the stored score dimensions (ADR-008: no derived values stored)
- UI rendering spec: see §16 (Match UI/UX Requirements)

---

### 8.5 Assign Professional from Match Run

```
POST /api/match-runs/:id/assign
```

**Auth:** Admin only  
**Workflow:** WF-003 step 5 (human selection)  
**Audit:** `MATCH_ASSIGNED` or `MATCH_OVERRIDDEN`

**Request body:**
```json
{
  "professional_id": "uuid",
  "selected_reason": "string | null",
  "assignment_reason": "string | null"
}
```

**Logic:**
- If `professional_id` == rank-1 candidate: `match_runs.status → ASSIGNED`
- If `professional_id` != rank-1 candidate: `match_runs.status → OVERRIDDEN`
- Creates `case_assignments` record
- Sets `match_runs.final_assignment_id`, `selected_by = auth.uid()`, `selected_at = NOW()`

**Response 200:**
```json
{
  "match_run_id": "uuid",
  "assignment_id": "uuid",
  "status": "ASSIGNED",
  "professional_id": "uuid",
  "selected_at": "2026-06-27T11:00:00Z"
}
```

---

### 8.6 Cancel Match Run

```
PATCH /api/match-runs/:id
```

**Auth:** Admin only  
**Audit:** `MATCH_RUN_CANCELLED`

**Request body:**
```json
{
  "status": "CANCELLED",
  "notes": "string | null"
}
```

**Constraint:** Only from `INITIATED` or `SCORED`

**Response 200:** Updated match run object.

---

## 9. Governance Domain Endpoints

**Tables:** `audit_events`, `deletion_schedules`, `notification_log`  
**Workflows:** WF-013

---

### 9.1 List Audit Events

```
GET /api/audit-events
```

**Auth:** Admin (all events); Professional (own actions only — `actor_id = auth.uid()`)  
**Query params:** `?event_type=CASE_CREATED&resource_type=cases&actor_id=uuid&limit=100&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "CASE_CREATED",
      "actor_id": "uuid | null",
      "resource_type": "cases",
      "resource_id": "uuid",
      "metadata": {},
      "created_at": "2026-06-01T10:00:00Z"
    }
  ],
  "count": 250
}
```

**TS-001 columns used:** `audit_events.id`, `.event_type`, `.actor_id`, `.resource_type`, `.resource_id`, `.metadata`, `.created_at`

**Critical field note:**
- Column is `resource_type TEXT` — **not** `related_entity_type`
- Column is `resource_id UUID` — **not** `related_entity_id`
- **No `actor_role` column** — not in TS-001

---

### 9.2 List Deletion Schedules

```
GET /api/deletion-schedules
```

**Auth:** Admin only  
**Query params:** `?executed=false&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "record_type": "case",
      "record_id": "uuid",
      "scheduled_for_deletion_at": "2033-06-01T00:00:00Z",
      "retention_expired_at": "2033-06-01T00:00:00Z",
      "reason": "RETENTION_EXPIRED",
      "created_at": "2026-06-01T10:00:00Z",
      "executed_at": null
    }
  ],
  "count": 3
}
```

**TS-001 columns used:** `deletion_schedules.id`, `.record_type`, `.record_id`, `.scheduled_for_deletion_at`, `.retention_expired_at`, `.reason`, `.created_at`, `.executed_at`

---

### 9.3 Create Deletion Schedule

```
POST /api/deletion-schedules
```

**Auth:** Admin or system only  
**Workflow:** WF-013  
**Audit:** `DELETION_SCHEDULED`

**Request body:**
```json
{
  "record_type": "case",
  "record_id": "uuid",
  "scheduled_for_deletion_at": "2033-06-01T00:00:00Z",
  "retention_expired_at": "2033-06-01T00:00:00Z",
  "reason": "RETENTION_EXPIRED"
}
```

**Validations:** `reason` ∈ `{RETENTION_EXPIRED, USER_REQUEST, LEGAL_REQUIREMENT}`

**Response 201:**
```json
{
  "id": "uuid",
  "record_type": "case",
  "record_id": "uuid",
  "scheduled_for_deletion_at": "2033-06-01T00:00:00Z",
  "created_at": "2026-06-27T12:00:00Z"
}
```

---

### 9.4 List Notification Log

```
GET /api/notification-log
```

**Auth:** Admin only  
**Query params:** `?status=FAILED&notification_type=HOURS_SUBMITTED&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "notification_type": "HOURS_SUBMITTED",
      "related_entity_type": "registered_hours",
      "related_entity_id": "uuid",
      "recipient_profile_id": "uuid | null",
      "recipient_email": "string | null",
      "delivery_channel": "EMAIL",
      "status": "SENT",
      "attempt_count": 1,
      "failure_reason": null,
      "created_at": "2026-06-21T10:00:00Z",
      "sent_at": "2026-06-21T10:00:05Z",
      "failed_at": null
    }
  ],
  "count": 8
}
```

**TS-001 columns used:** `notification_log.id`, `.notification_type`, `.related_entity_type`, `.related_entity_id`, `.recipient_profile_id`, `.recipient_email`, `.delivery_channel`, `.status`, `.attempt_count`, `.failure_reason`, `.created_at`, `.sent_at`, `.failed_at`

**Note:** `notification_log` uses `related_entity_type` / `related_entity_id` (not `resource_type`/`resource_id` — those names are in `audit_events`). This is correct per TS-001.  
Either `recipient_profile_id` OR `recipient_email` is set (CHECK constraint requires at least one).

---

### 9.5 Retry Notification

```
POST /api/notification-log/:id/retry
```

**Auth:** Admin only  
**Constraint:** `attempt_count < 3` (max 3 attempts per TS-001)

**Request body:** None

**Response 200:**
```json
{
  "id": "uuid",
  "status": "PENDING",
  "attempt_count": 2
}
```

**Error 422:** If `attempt_count >= 3`

---

## 10. Public Intake Endpoint

**Table:** `inbound_inquiries`  
**Workflow:** WF-002

---

### 10.1 Submit Inbound Inquiry

```
POST /api/inquiries
```

**Auth:** None (public endpoint)  
**Rate limit:** 5 requests per IP per hour  
**CORS:** `kursskifte.dk` origin only  
**Security:** Honeypot checked FIRST; Cloudflare Turnstile CAPTCHA via `CLOUDFLARE_TURNSTILE_SECRET_KEY`; `service_role` key never in browser  
**Audit:** `INQUIRY_RECEIVED` — `resource_type='inbound_inquiries'`  
**Notification:** `INQUIRY_RECEIVED` to `notification_log` with `recipient_email = SYSTEM_ADMIN_EMAIL`

**Request body:**
```json
{
  "submission_type": "PROFESSIONAL_APPLICATION",
  "submitter_name": "string",
  "submitter_email": "string",
  "submitter_phone": "string | null",
  "organization_name": "string | null",
  "message": "string | null",
  "form_data": {},
  "source_url": "string | null",
  "captcha_token": "string",
  "honeypot": ""
}
```

**Submission type enum (TS-001):** `MUNICIPALITY_INQUIRY | PROFESSIONAL_APPLICATION | PARTNER_LEAD`

**Processing order (WF-002):**
1. Check `honeypot == ""` — if non-empty, insert with `status = SPAM` silently
2. Rate limit check
3. CAPTCHA verification via Cloudflare Turnstile API
4. Validate required fields
5. Hash submitter IP (SHA-256) → `ip_hash`
6. Insert with `status = PENDING`, `captcha_verified = true`

**Response 201:**
```json
{
  "id": "uuid",
  "status": "PENDING",
  "submitted_at": "2026-06-27T12:00:00Z"
}
```

---

### 10.2 List Inbound Inquiries

```
GET /api/inquiries
```

**Auth:** Admin only  
**Query params:** `?status=PENDING&submission_type=PROFESSIONAL_APPLICATION&limit=50&offset=0`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "submission_type": "PROFESSIONAL_APPLICATION",
      "status": "PENDING",
      "submitted_at": "2026-06-27T12:00:00Z",
      "submitter_name": "string",
      "submitter_email": "string",
      "submitter_phone": "string | null",
      "organization_name": "string | null",
      "message": "string | null",
      "form_data": {},
      "source_url": "string | null",
      "ip_hash": "string | null",
      "captcha_verified": true,
      "reviewed_by": "uuid | null",
      "reviewed_at": null,
      "rejection_reason": null,
      "converted_to_type": null,
      "converted_to_id": null,
      "created_at": "2026-06-27T12:00:00Z"
    }
  ],
  "count": 12
}
```

**TS-001 columns used:** `inbound_inquiries.id`, `.submission_type`, `.status`, `.submitted_at`, `.submitter_name`, `.submitter_email`, `.submitter_phone`, `.organization_name`, `.message`, `.form_data`, `.source_url`, `.ip_hash`, `.captcha_verified`, `.reviewed_by`, `.reviewed_at`, `.rejection_reason`, `.converted_to_type`, `.converted_to_id`, `.created_at`

---

### 10.3 Get Inbound Inquiry

```
GET /api/inquiries/:id
```

**Auth:** Admin only

**Response 200:** Single inquiry object (same shape as list item).

---

### 10.4 Update Inbound Inquiry

```
PATCH /api/inquiries/:id
```

**Auth:** Admin only  
**Audit:** `INQUIRY_REVIEWED` or `INQUIRY_REJECTED`

**Request body:**
```json
{
  "status": "REVIEWED",
  "rejection_reason": "string | null"
}
```

**Valid transitions (TS-001):**

| From | To |
|---|---|
| `PENDING` | `REVIEWED` |
| `REVIEWED` | `REJECTED` |
| `PENDING` | `REJECTED` |
| `PENDING` | `SPAM` |

**Effect:** `reviewed_by = auth.uid()`, `reviewed_at = NOW()`

**Response 200:** Updated inquiry object.

---

### 10.5 Convert Inbound Inquiry

```
POST /api/inquiries/:id/convert
```

**Auth:** Admin only  
**Workflow:** WF-002  
**Audit:** `INQUIRY_CONVERTED`

**Request body:**
```json
{
  "converted_to_type": "professional",
  "converted_to_id": "uuid"
}
```

**Constraint:** `inquiry.status` must be `PENDING` or `REVIEWED`  
**Effect:** Sets `status = CONVERTED`, `converted_to_type`, `converted_to_id`

**Response 200:**
```json
{
  "id": "uuid",
  "status": "CONVERTED",
  "converted_to_type": "professional",
  "converted_to_id": "uuid"
}
```

---

## 11. Profile Endpoint

**Table:** `profiles`

---

### 11.1 Get Own Profile

```
GET /api/profile
```

**Auth:** Any authenticated user

**Response 200:**
```json
{
  "id": "uuid",
  "email": "string",
  "role": "professional",
  "created_at": "2026-06-01T10:00:00Z",
  "updated_at": "2026-06-01T10:00:00Z"
}
```

**TS-001 columns used:** `profiles.id`, `.email`, `.role`, `.created_at`, `.updated_at`

---

### 11.2 Update Own Profile

```
PATCH /api/profile
```

**Auth:** Any authenticated user (own only)

**Request body:**
```json
{
  "email": "new@email.com"
}
```

**Notes:**
- `email` must remain unique across profiles
- `role` not patchable by self

**Response 200:** Updated profile object.

---

## 12. Workflow-to-Endpoint Traceability Matrix

| Workflow | Endpoints | Coverage |
|---|---|---|
| **WF-001** Professional Onboarding | `POST /api/professionals`, `POST /api/professionals/:id/documents` (initial), `PATCH /api/professionals/:id/documents/:docId` (initial verification), `PATCH /api/professionals/:id` (REGISTERED→ACTIVE) | Complete |
| **WF-002** Municipality Inquiry to Case Creation | `POST /api/inquiries`, `GET /api/inquiries`, `PATCH /api/inquiries/:id`, `POST /api/inquiries/:id/convert`, `POST /api/cases`, `PUT /api/cases/:id/complexity` | Complete |
| **WF-003** Match Run and Assignment | `POST /api/match-runs`, `GET /api/match-runs/:id/candidates`, `POST /api/match-runs/:id/assign`, `GET /api/professionals/available` | Complete |
| **WF-004** Case Activation | `POST /api/cases/:id/status` (MATCHED→ACTIVE), `POST /api/cases/:id/grants`, `PATCH /api/cases/:id/grants/:grantId`, `POST /api/cases/:id/assignments`, `POST /api/cases/:id/contact-disclosures` | Complete |
| **WF-005** Session Documentation | `POST /api/session-logs`, `PATCH /api/session-logs/:id`, `POST /api/session-logs/:id/finalize`, `POST /api/session-logs/:id/corrections`, `POST /api/session-logs/:id/safeguarding/acknowledge` | Complete |
| **WF-006** Registered Hours | `POST /api/registered-hours`, `PATCH /api/registered-hours/:id`, `POST /api/registered-hours/:id/submit`, `POST /api/registered-hours/:id/review` | Complete |
| **WF-007** Outside Grant Review | `POST /api/registered-hours/:id/review` (OUTSIDE_GRANT), `GET /api/registered-hours?status=OUTSIDE_GRANT` | Complete |
| **WF-008** Professional Handover | `POST /api/cases/:id/handovers`, `PATCH /api/cases/:id/handovers/:handoverId`, `POST /api/session-logs/:id/transfers`, `POST /api/cases/:id/assignments/:assignmentId/end`, `PATCH /api/professionals/:id` (ACTIVE↔INACTIVE, ACTIVE→ARCHIVED) | Complete |
| **WF-009** Contact Disclosure | `POST /api/cases/:id/contact-disclosures`, `GET /api/cases/:id/contact-disclosures` | Complete |
| **WF-010** Contact Log | `GET /api/cases/:id/contact-logs`, `POST /api/cases/:id/contact-logs` | Complete |
| **WF-011** Document Upload and Verification | `GET /api/professionals/:id/documents`, `POST /api/professionals/:id/documents`, `PATCH /api/professionals/:id/documents/:docId` | Complete |
| **WF-012** Case Closure and Archival | `POST /api/cases/:id/status` (ACTIVE→COMPLETED, COMPLETED→ARCHIVED), `POST /api/deletion-schedules` | Complete |
| **WF-013** GDPR Retention and Deletion | `GET /api/deletion-schedules`, `POST /api/deletion-schedules`, `GET /api/notification-log`, `POST /api/notification-log/:id/retry` | Complete |

---

## 13. Complete Endpoint Inventory

**Total: 65 endpoints across 11 domains**

### Professional Domain (8 endpoints)

| # | Method | Path | Auth | Table(s) |
|---|---|---|---|---|
| 1 | GET | `/api/professionals` | Admin | professionals, profiles |
| 2 | GET | `/api/professionals/:id` | Own/Admin | professionals, profiles |
| 3 | POST | `/api/professionals` | Admin | professionals |
| 4 | PATCH | `/api/professionals/:id` | Own(avail)/Admin | professionals |
| 5 | GET | `/api/professionals/:id/documents` | Own/Admin | professional_documents |
| 6 | POST | `/api/professionals/:id/documents` | Own/Admin | professional_documents |
| 7 | PATCH | `/api/professionals/:id/documents/:docId` | Own(re-upload)/Admin | professional_documents |
| 8 | GET | `/api/professionals/available` | Admin | v_professionals_available |

### Municipality Domain (4 endpoints)

| # | Method | Path | Auth | Table(s) |
|---|---|---|---|---|
| 9 | GET | `/api/municipalities` | All | municipalities |
| 10 | GET | `/api/municipalities/:id` | All | municipalities |
| 11 | POST | `/api/municipalities` | Admin | municipalities |
| 12 | PATCH | `/api/municipalities/:id` | Admin | municipalities |

### Case Domain (16 endpoints)

| # | Method | Path | Auth | Table(s) |
|---|---|---|---|---|
| 13 | GET | `/api/cases` | Own/Admin | cases |
| 14 | GET | `/api/cases/:id` | Own/Admin | cases |
| 15 | POST | `/api/cases` | Admin | cases |
| 16 | PATCH | `/api/cases/:id` | Admin | cases |
| 17 | POST | `/api/cases/:id/status` | Admin | cases |
| 18 | GET | `/api/cases/:id/complexity` | Own/Admin | case_complexity_factors |
| 19 | PUT | `/api/cases/:id/complexity` | Admin | case_complexity_factors |
| 20 | GET | `/api/cases/:id/assignments` | Own/Admin | case_assignments |
| 21 | POST | `/api/cases/:id/assignments` | Admin | case_assignments |
| 22 | POST | `/api/cases/:id/assignments/:assignmentId/end` | Admin | case_assignments |
| 23 | GET | `/api/cases/:id/grants` | All | case_grants |
| 24 | POST | `/api/cases/:id/grants` | Admin | case_grants |
| 25 | PATCH | `/api/cases/:id/grants/:grantId` | Admin | case_grants |
| 26 | GET | `/api/cases/:id/handovers` | Admin | case_handovers |
| 27 | POST | `/api/cases/:id/handovers` | Admin | case_handovers |
| 28 | PATCH | `/api/cases/:id/handovers/:handoverId` | Admin | case_handovers |

### Delivery Domain (19 endpoints)

| # | Method | Path | Auth | Table(s) |
|---|---|---|---|---|
| 29 | GET | `/api/session-logs` | Own/Admin | session_logs |
| 30 | GET | `/api/session-logs/:id` | Own/Transfer/Admin | session_logs |
| 31 | POST | `/api/session-logs` | Professional/Admin | session_logs |
| 32 | PATCH | `/api/session-logs/:id` | Own(DRAFT) | session_logs |
| 33 | POST | `/api/session-logs/:id/finalize` | Own | session_logs |
| 34 | POST | `/api/session-logs/:id/corrections` | Own/Admin | session_log_corrections, session_logs |
| 35 | GET | `/api/session-logs/:id/corrections` | Own/Admin | session_log_corrections |
| 36 | POST | `/api/session-logs/:id/transfers` | Admin | session_log_transfers |
| 37 | POST | `/api/session-logs/:id/safeguarding/acknowledge` | Admin | session_logs |
| 38 | GET | `/api/registered-hours` | Own/Admin | registered_hours |
| 39 | GET | `/api/registered-hours/:id` | Own/Admin | registered_hours |
| 40 | POST | `/api/registered-hours` | Professional/Admin | registered_hours |
| 41 | PATCH | `/api/registered-hours/:id` | Own(PENDING) | registered_hours |
| 42 | POST | `/api/registered-hours/:id/submit` | Own | registered_hours |
| 43 | POST | `/api/registered-hours/:id/review` | Admin | registered_hours |
| 44 | GET | `/api/cases/:id/contact-logs` | Own/Admin | contact_logs |
| 45 | POST | `/api/cases/:id/contact-logs` | Own/Admin | contact_logs |
| 46 | GET | `/api/cases/:id/contact-disclosures` | Admin | contact_disclosures |
| 47 | POST | `/api/cases/:id/contact-disclosures` | Admin | contact_disclosures |

### Matching Domain (6 endpoints)

| # | Method | Path | Auth | Table(s) |
|---|---|---|---|---|
| 48 | GET | `/api/match-runs` | Admin | match_runs |
| 49 | GET | `/api/match-runs/:id` | Admin | match_runs |
| 50 | POST | `/api/match-runs` | Admin | match_runs, match_candidates |
| 51 | GET | `/api/match-runs/:id/candidates` | Admin | match_candidates |
| 52 | POST | `/api/match-runs/:id/assign` | Admin | match_runs, case_assignments |
| 53 | PATCH | `/api/match-runs/:id` | Admin | match_runs |

### Governance Domain (5 endpoints)

| # | Method | Path | Auth | Table(s) |
|---|---|---|---|---|
| 54 | GET | `/api/audit-events` | Own/Admin | audit_events |
| 55 | GET | `/api/deletion-schedules` | Admin | deletion_schedules |
| 56 | POST | `/api/deletion-schedules` | Admin/System | deletion_schedules |
| 57 | GET | `/api/notification-log` | Admin | notification_log |
| 58 | POST | `/api/notification-log/:id/retry` | Admin | notification_log |

### Public Intake (5 endpoints)

| # | Method | Path | Auth | Table(s) |
|---|---|---|---|---|
| 59 | POST | `/api/inquiries` | Public | inbound_inquiries |
| 60 | GET | `/api/inquiries` | Admin | inbound_inquiries |
| 61 | GET | `/api/inquiries/:id` | Admin | inbound_inquiries |
| 62 | PATCH | `/api/inquiries/:id` | Admin | inbound_inquiries |
| 63 | POST | `/api/inquiries/:id/convert` | Admin | inbound_inquiries |

### Profile (2 endpoints)

| # | Method | Path | Auth | Table(s) |
|---|---|---|---|---|
| 64 | GET | `/api/profile` | Self | profiles |
| 65 | PATCH | `/api/profile` | Self | profiles |

---

## 14. Enum Reference

All enum values are from TS-001 CHECK constraints. These are the only valid values.

| Table.Column | Valid Values |
|---|---|
| `profiles.role` | `admin`, `professional` |
| `professionals.profession` | `TEACHER`, `PEDAGOGUE`, `NURSE`, `PSYCHOLOGIST`, `SOCIAL_WORKER`, `COUNSELOR`, `OTHER` |
| `professionals.max_complexity_level` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `professionals.status` | `REGISTERED`, `ACTIVE`, `INACTIVE`, `ARCHIVED` |
| `professional_documents.document_type` | `CV`, `CRIMINAL_RECORD`, `CHILD_PROTECTION`, `DRIVING_LICENSE`, `QUALIFICATION`, `INSURANCE`, `OTHER` |
| `professional_documents.status` | `PENDING_UPLOAD`, `UNVERIFIED`, `VERIFIED`, `ARCHIVED` |
| `municipalities.status` | `ACTIVE`, `INACTIVE` |
| `cases.status` | `OPEN`, `MATCHED`, `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| `cases.citizen_age_range` | `0-5`, `6-12`, `13-18`, `18+` |
| `cases.complexity_level` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `case_assignments.assignment_status` | `ACTIVE`, `TRANSITIONED`, `TERMINATED`, `ARCHIVED` |
| `case_grants.status` | `PENDING`, `ACTIVE`, `ARCHIVED`, `REVOKED` |
| `case_handovers.reason` | `PROFESSIONAL_UNAVAILABLE`, `WORKLOAD_EXCEEDED`, `REQUEST_PROFESSIONAL`, `REQUEST_CASE`, `BETTER_MATCH`, `SAFEGUARDING_CONCERN`, `OTHER` |
| `case_handovers.status` | `INITIATED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `session_logs.status` | `DRAFT`, `FINAL`, `CORRECTED`, `ARCHIVED` |
| `session_log_corrections.correction_reason` | `TYPO`, `WRONG_TIME`, `CLARIFICATION`, `OMISSION`, `OTHER` |
| `registered_hours.work_type` | `DIRECT_SESSION`, `TRANSPORT`, `DOCUMENTATION`, `COORDINATION`, `CRISIS_RESPONSE`, `TRAINING`, `OTHER` |
| `registered_hours.status` | `PENDING`, `SUBMITTED`, `APPROVED`, `REJECTED`, `OUTSIDE_GRANT` |
| `contact_logs.contact_type` | `PHONE_CALL`, `EMAIL`, `IN_PERSON`, `OTHER` |
| `contact_disclosures.contact_method` | `EMAIL`, `PHONE`, `MEETING` |
| `match_runs.status` | `INITIATED`, `SCORED`, `ASSIGNED`, `OVERRIDDEN`, `CANCELLED` |
| `deletion_schedules.reason` | `RETENTION_EXPIRED`, `USER_REQUEST`, `LEGAL_REQUIREMENT` |
| `notification_log.status` | `PENDING`, `SENT`, `FAILED` |
| `notification_log.delivery_channel` | `EMAIL`, `IN_APP`, `SMS`, `PUSH`, `TEAMS`, `SLACK` |
| `notification_log.notification_type` | `INQUIRY_RECEIVED`, `PROFESSIONAL_APPLICATION_RECEIVED`, `CASE_CREATED`, `SAFEGUARDING_FLAGGED`, `HOURS_SUBMITTED`, `DOCUMENT_ACTION_REQUIRED` |
| `inbound_inquiries.submission_type` | `MUNICIPALITY_INQUIRY`, `PROFESSIONAL_APPLICATION`, `PARTNER_LEAD` |
| `inbound_inquiries.status` | `PENDING`, `REVIEWED`, `CONVERTED`, `REJECTED`, `SPAM` |

---

## 15. Fields Explicitly Excluded

These fields appeared in TS-002 v1.0 but are **not in TS-001** and must never be implemented:

| Field | Table Context | Reason |
|---|---|---|
| `first_name`, `last_name`, `professional_title`, `bio`, `specializations`, `years_of_experience` | professionals | Not in TS-001; identity from `auth.users` metadata |
| `onboarding_status` | professionals | Not in TS-001; `status` column handles lifecycle |
| `municipality_name`, `municipality_code` | municipalities | TS-001 uses `name TEXT UNIQUE`; no `municipality_code` column |
| `citizen_name`, `citizen_cpr`, `citizen_age` | cases | GDPR prohibition (WF-002); TS-001 uses `citizen_initials CHAR(2)` + `citizen_age_range` |
| `case_number`, `opened_at`, `activated_at`, `completed_at`, `case_type`, `primary_challenge` | cases | Not in TS-001 |
| `session_start_time`, `session_end_time` | session_logs | TS-001 stores `duration_minutes INTEGER` only |
| `submitted_at` | session_logs | Not in TS-001 (this field exists in `registered_hours`, not `session_logs`) |
| `status = 'SUBMITTED'` | session_logs | TS-001 status is `DRAFT → FINAL`, not SUBMITTED |
| `storage_path`, `document_name`, `file_size_bytes`, `mime_type`, `rejection_reason` | professional_documents | TS-001 uses `file_path`, `file_hash`, `verification_notes`; no rejection_reason or mime_type |
| `status = 'PENDING_REVIEW'` or `'REJECTED'` | professional_documents | TS-001 statuses are `PENDING_UPLOAD`, `UNVERIFIED`, `VERIFIED`, `ARCHIVED` |
| `factor_type`, `factor_description` (multi-row pattern) | case_complexity_factors | TS-001 is a single-row boolean model (one row per case with 7 boolean columns) |
| `grant_hours`, `grant_start`, `grant_end`, `grant_amount`, `grant_currency`, `granted_by`, `notes` | case_grants | TS-001 uses `granted_hours`, `period_start`, `period_end`, `created_by` |
| `assigned_at`, `end_reason` | case_assignments | TS-001 uses `started_at`, `assignment_reason` |
| `correction_text`, `corrected_by`, `corrected_at` | session_log_corrections | TS-001 uses `correction_note`, `created_by`, `created_at` |
| `hours_worked` (max 24), `session_date`, `notes` | registered_hours | TS-001 uses `hours` (max 8), `work_date`, `description` |
| `contacted_party`, `contact_method`, `contacted_at` | contact_logs | TS-001 uses `contact_type` enum, `logged_at`, `logged_by`; no `contacted_party` |
| `run_at`, `selected_candidate_id`, `status = 'PENDING'/'COMPLETED'/'FAILED'` | match_runs | TS-001 uses `triggered_at`, `final_assignment_id FK case_assignments`, status `INITIATED/SCORED/ASSIGNED/OVERRIDDEN/CANCELLED` |
| `score` (single field), `selected BOOLEAN` | match_candidates | TS-001 has 5 separate score columns; no `selected` field |
| `related_entity_type`, `related_entity_id`, `actor_role` | audit_events | TS-001 uses `resource_type`, `resource_id`; no `actor_role` |

---

---

## 16. Match UI/UX Requirements

> **Scope:** Specifies what the frontend must render when displaying matching candidates to admin. These requirements derive from §8.4 (GET /api/match-runs/:id/candidates) — no additional backend endpoints are required for MVP.

---

### 16.1 Candidate Card (list view)

Displayed for each candidate in the match result list. All data comes from the §8.4 response.

| UI Element | Data Field | Notes |
|---|---|---|
| Circular match score | `overall_score` | Displayed as a percentage ring (e.g., 87%). Color: green ≥ 80, yellow 60–79, red < 60 |
| Profile photo | `professional.profile_photo_url` | Round avatar. If `null`: show initials from `professional.full_name` |
| Name | `professional.full_name` | Falls back to `professional.profession` if `null` |
| Profession | `professional.profession` | e.g. "Socialrådgiver", "Pædagog" |
| Key qualifications | `professional.qualifications` | Show first 3 items as chips/tags |
| "Hvorfor dette match?" | `match_strengths[0]` | First strength bullet shown inline on card |
| Rank badge | `rank` | "#1 Match", "#2 Match" etc. |
| Availability indicator | `professional.availability_status` | "Tilgængelig" / "Delvist tilgængelig" |

**Interaction:** Clicking a card opens the Detailed Profile View (§16.2).

---

### 16.2 Detailed Profile View

Full-screen or modal view for a single candidate. All data from §8.4 (single candidate object).

**Section: Score Breakdown**

| UI Element | Data Field |
|---|---|
| Overall score (large) | `overall_score` |
| Kvalifikationer | `qualifications_score` |
| Tilgængelighed | `availability_score` |
| Kapacitet | `capacity_score` |
| Kompleksitet | `complexity_fit_score` |
| Score-forklaring (expandable) | `scoring_explanation` |

**Section: Matchstyrker & Opmærksomhedspunkter**

| UI Element | Data Field |
|---|---|
| Styrker (green checkmarks) | `match_strengths` (array — show all) |
| Opmærksomhedspunkter (yellow warnings) | `attention_points` (array — show all) |
| Empty state | If both arrays empty: "Ingen fremhævede styrker eller opmærksomhedspunkter" |

**Section: Kapacitet & Tilgængelighed**

| UI Element | Data Field |
|---|---|
| Tilgængelighed | `professional.availability_status` |
| Ugentlige timer | `professional.capacity_hours_week` |
| Max samtidige sager | `professional.max_concurrent_cases` |
| Tilgængelige dage | `professional.availability_days` (rendered as day chips) |

**Section: Erfaring & Uddannelse**

| UI Element | Data Field |
|---|---|
| Erhvervserfaring | `professional.experience_years` years |
| Profession | `professional.profession` |
| Kvalifikationer | `professional.qualifications` (full list) |

> **Phase 2 note:** Structured education history, multi-profession tables, certifications, and specialization tags are deferred to Phase 2. In MVP, `profession` is a single text field and `qualifications` is a text array on the `professionals` table. No schema changes are needed to render this view.

**Section: Dokumentstatus** (requires separate API call)

| UI Element | Endpoint | Notes |
|---|---|---|
| Dokumentliste med status | `GET /api/professionals/:id/documents` (§4.5) | Show document type, status (VERIFIED / UNVERIFIED / PENDING_UPLOAD), expiry_date |
| CRIMINAL_RECORD badge | From documents list | Required for assignment; show warning if not VERIFIED |

**Admin Actions**

| Action | Endpoint | Notes |
|---|---|---|
| Vælg denne fagperson | `POST /api/match-runs/:id/assign` (§8.5) | Assigns the professional; transitions match_run status |
| Afvis kandidat | No endpoint — admin simply selects another | No rejection record stored in MVP |

---

### 16.3 UI Constraints

1. **No additional API calls beyond §8.4 + §4.5** — The candidate list and all score/profile data are returned in a single §8.4 call. Only the document status section requires a separate §4.5 call (lazy-loaded when admin opens document tab).
2. **match_strengths / attention_points are frontend-displayable directly** — No frontend logic needed to compute them; the API delivers ready-to-render strings.
3. **profile_photo_url is a signed URL** — It expires after a configurable TTL (default: 1 hour). The frontend should not cache it beyond this window.
4. **Score color thresholds** — green ≥ 80, yellow 60–79, red < 60. Apply consistently across both card and detail views.
5. **Encryption** — `scoring_explanation` is decrypted server-side before the API response. The frontend never receives encrypted ciphertext from §8.4.

---

*End of TS-002 API Specification v2.0*
