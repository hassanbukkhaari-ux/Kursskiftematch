# Technical Specification: Kurskifte-Match 2.0
## Phase 2: API Specification

**Document Type:** Technical Specification (Implementation Blueprint)  
**Version:** 1.0 (Based on Architecture v1.0)  
**Audience:** Backend developers, frontend developers, API consumers  
**Date:** June 27, 2026  
**Status:** APPROVED FOR IMPLEMENTATION  

**Reference Architecture:** MASTER_DIRECTIVE.md, PERMISSION_MODEL.md, all workflows

---

## PART 2: API SPECIFICATION

## 2.1 API DESIGN PRINCIPLES

**Framework:** Next.js 15 API Routes (serverless functions)  
**Protocol:** REST over HTTPS  
**Format:** JSON request/response  
**Versioning:** URL-based (`/api/v1/...`)  
**Pagination:** Cursor-based or offset (max 100 items/page)  
**Authentication:** Supabase JWT tokens in Authorization header  
**Authorization:** RLS + backend permission checks  

**Rationale:** Source: MASTER_DIRECTIVE.md (Technology Stack)

---

## 2.2 AUTHENTICATION

### Authorization Header

```
Authorization: Bearer <jwt_token>
```

JWT token obtained from Supabase Auth during login.

**Token Claims:**
```json
{
  "sub": "user-uuid",
  "email": "professional@example.com",
  "role": "professional|admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Validation:**
- Backend verifies JWT signature (Supabase public key)
- Checks token not expired
- Extracts role for authorization

### Authentication Endpoints

```
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me (current user profile)
```

---

## 2.3 ENDPOINT STRUCTURE

**Base URL:** `https://kursskifte.dk/api/v1`

**Endpoint Pattern:**
```
{METHOD} /api/v1/{domain}/{resource}[/{id}][/{subresource}]
```

**Examples:**
```
GET    /api/v1/professionals/me
GET    /api/v1/professionals/:id
GET    /api/v1/professionals
POST   /api/v1/professionals
PATCH  /api/v1/professionals/:id
GET    /api/v1/cases/:caseId/assignments
POST   /api/v1/cases/:caseId/assignments
GET    /api/v1/cases/:caseId/session-logs
POST   /api/v1/cases/:caseId/session-logs
PATCH  /api/v1/session-logs/:id/finalize
GET    /api/v1/cases/:caseId/hours
POST   /api/v1/cases/:caseId/hours
PATCH  /api/v1/hours/:id/approve
POST   /api/v1/cases/:caseId/match-run
GET    /api/v1/match-runs/:id/candidates
PATCH  /api/v1/match-runs/:id/assign
```

---

## 2.4 DOMAIN ENDPOINTS

### PROFESSIONAL DOMAIN

#### GET /api/v1/professionals/me
**Purpose:** Current user's professional profile  
**Auth:** Required (professional)  
**Response:**
```json
{
  "id": "uuid",
  "email": "professional@example.com",
  "profession": "PEDAGOGUE",
  "experience_years": 5,
  "target_age_groups": ["13-18"],
  "max_complexity_level": "HIGH",
  "capacity_hours_week": 20,
  "max_concurrent_cases": 3,
  "availability_days": ["MON", "TUE", "WED", "THU", "FRI"],
  "status": "ACTIVE",
  "documents": [
    {
      "id": "uuid",
      "document_type": "CV",
      "status": "VERIFIED",
      "expiry_date": "2027-06-30"
    }
  ],
  "created_at": "2026-01-15T10:00:00Z"
}
```

#### PATCH /api/v1/professionals/me
**Purpose:** Update own availability/capacity  
**Auth:** Required (professional)  
**Request:**
```json
{
  "availability_days": ["MON", "TUE", "WED"],
  "capacity_hours_week": 15,
  "availability_status": "AVAILABLE|ON_LEAVE|UNAVAILABLE"
}
```
**Response:** Updated professional object

#### POST /api/v1/professionals
**Purpose:** Create new professional (admin only)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "email": "new.professional@example.com",
  "profession": "PEDAGOGUE",
  "experience_years": 8,
  "target_age_groups": ["6-12", "13-18"],
  "max_complexity_level": "HIGH",
  "capacity_hours_week": 20,
  "max_concurrent_cases": 4
}
```
**Response:** Created professional object with id

#### GET /api/v1/professionals/:id
**Purpose:** Admin view professional  
**Auth:** Required (admin)  
**Response:** Full professional object

#### GET /api/v1/professionals/:id/documents
**Purpose:** List professional's documents  
**Auth:** Required (own or admin)  
**Response:** Array of documents with verification status

#### POST /api/v1/professionals/:id/documents
**Purpose:** Upload document  
**Auth:** Required (own or admin)  
**Request:** multipart/form-data with file  
**Response:**
```json
{
  "id": "uuid",
  "document_type": "CV",
  "status": "UNVERIFIED",
  "file_hash": "sha256hash",
  "uploaded_at": "2026-06-27T10:00:00Z"
}
```

#### PATCH /api/v1/professionals/:id/documents/:docId
**Purpose:** Verify document (admin)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "status": "VERIFIED|UNVERIFIED",
  "expiry_date": "2027-06-30",
  "verification_notes": "Approved"
}
```
**Response:** Updated document object

#### PATCH /api/v1/professionals/:id/approve
**Purpose:** Approve professional (REGISTERED → ACTIVE)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "approved": true
}
```
**Response:** Professional with status = ACTIVE

#### PATCH /api/v1/professionals/:id/reject
**Purpose:** Reject professional  
**Auth:** Required (admin)  
**Request:**
```json
{
  "reason": "Insufficient qualifications"
}
```
**Response:** Professional with status = ARCHIVED

#### GET /api/v1/professionals
**Purpose:** List professionals (filtered)  
**Auth:** Required (admin)  
**Query Parameters:**
```
?status=ACTIVE|INACTIVE|REGISTERED|ARCHIVED
?profession=PEDAGOGUE|TEACHER|...
?complexity=LOW|MEDIUM|HIGH|CRITICAL
?search=name/profession
?page=1&limit=50
```
**Response:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127
  }
}
```

---

### CASE DOMAIN

#### POST /api/v1/cases
**Purpose:** Create new case from inquiry  
**Auth:** Required (admin)  
**Request:** (from WF-002)
```json
{
  "municipality_id": "uuid",
  "citizen_initials": "AB",
  "citizen_age_range": "13-18",
  "weekly_hours": 4.5,
  "complexity_factors": {
    "mental_health": true,
    "family_instability": true,
    "school": false,
    "violence": false,
    "substance_use": false,
    "criminality": false,
    "multiple_agencies": true,
    "notes": "Youth has school refusal and family conflict"
  }
}
```
**Response:**
```json
{
  "id": "uuid",
  "status": "OPEN",
  "complexity_level": "MEDIUM",
  "weekly_hours": 4.5,
  "created_at": "2026-06-27T10:00:00Z"
}
```
**Side Effects:**
- Case created with status = OPEN
- CaseComplexityFactors record created
- data_retention_expires_at = NULL (set when archived)
- Audit event: CASE_CREATED logged

#### GET /api/v1/cases/:id
**Purpose:** Get case details  
**Auth:** Required (admin or assigned professional)  
**Response:**
```json
{
  "id": "uuid",
  "municipality": { "id": "uuid", "name": "Aalborg Kommune" },
  "status": "ACTIVE",
  "citizen_initials": "AB",
  "citizen_age_range": "13-18",
  "weekly_hours": 4.5,
  "complexity_level": "MEDIUM",
  "current_professional": {
    "id": "uuid",
    "name": "Jane Doe",
    "profession": "PEDAGOGUE"
  },
  "assignment_history": [...],
  "active_grant": {
    "id": "uuid",
    "granted_hours": 24,
    "period_start": "2026-06-01",
    "period_end": "2026-06-30",
    "remaining_hours": 12.5
  },
  "created_at": "2026-06-27T10:00:00Z"
}
```

#### PATCH /api/v1/cases/:id/complexity
**Purpose:** Update complexity assessment  
**Auth:** Required (admin)  
**Request:** Updated complexity_factors object  
**Response:** Updated case with new complexity_level

#### PATCH /api/v1/cases/:id/grant
**Purpose:** Add or amend grant allocation  
**Auth:** Required (admin)  
**Request:**
```json
{
  "granted_hours": 24,
  "period_start": "2026-07-01",
  "period_end": "2026-07-31"
}
```
**Response:** CaseGrant object

#### GET /api/v1/cases/:id/grants
**Purpose:** Grant history for case  
**Auth:** Required (admin or assigned)  
**Response:** Array of CaseGrant objects (all periods)

#### PATCH /api/v1/cases/:id/close
**Purpose:** Close case (ACTIVE → COMPLETED → ARCHIVED)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "closure_reason": "Support objectives met",
  "follow_up_required": false
}
```
**Response:** Case with status = COMPLETED

#### GET /api/v1/cases
**Purpose:** List cases (admin)  
**Auth:** Required (admin)  
**Query Parameters:**
```
?status=OPEN|MATCHED|ACTIVE|COMPLETED
?municipality=uuid
?complexity=LOW|MEDIUM|HIGH|CRITICAL
?search=initials
?page=1&limit=50
```
**Response:** Paginated case list

---

### DELIVERY DOMAIN

#### POST /api/v1/cases/:caseId/session-logs
**Purpose:** Create session (DRAFT)  
**Auth:** Required (assigned professional)  
**Request:** (WF-002 implies session creation)
```json
{
  "session_date": "2026-06-27",
  "observations": "Session went well, youth engaged",
  "citizen_mood_tone": "Positive and cooperative",
  "follow_up_needed": false,
  "safeguarding_concern_flag": false,
  "participant_names": ["Jane Doe", "John Youth"],
  "location": "Community Center"
}
```
**Response:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "status": "DRAFT",
  "session_date": "2026-06-27",
  "created_at": "2026-06-27T14:30:00Z"
}
```

#### PATCH /api/v1/session-logs/:id
**Purpose:** Edit DRAFT session  
**Auth:** Required (creator or admin)  
**Request:** Updated fields (only DRAFT sessions)  
**Response:** Updated session

#### PATCH /api/v1/session-logs/:id/finalize
**Purpose:** Finalize session (DRAFT → FINAL)  
**Auth:** Required (creator)  
**Request:**
```json
{
  "action": "finalize"
}
```
**Response:** Session with status = FINAL
**Side Effects:**
- Status set to FINAL
- No further edits allowed (corrections only)
- Audit event: SESSION_LOG_FINALIZED logged

#### POST /api/v1/session-logs/:id/corrections
**Purpose:** Correct finalized session  
**Auth:** Required (creator or admin)  
**Request:**
```json
{
  "correction_note": "Session time was 15:00-16:30, not 14:00-15:30",
  "correction_reason": "WRONG_TIME"
}
```
**Response:**
```json
{
  "id": "uuid",
  "session_log_id": "uuid",
  "correction_note": "...",
  "created_at": "2026-06-27T14:40:00Z"
}
```
**Side Effects:**
- SessionLogCorrection record created (immutable)
- Original SessionLog unchanged
- Audit event: SESSION_LOG_CORRECTED logged

#### GET /api/v1/cases/:caseId/session-logs
**Purpose:** List sessions for case  
**Auth:** Required (admin or assigned)  
**Query:**
```
?status=DRAFT|FINAL|CORRECTED
?page=1&limit=50
```
**Response:** Array of sessions with corrections

---

### HOURS DOMAIN

#### POST /api/v1/cases/:caseId/hours
**Purpose:** Register hours  
**Auth:** Required (professional)  
**Request:** (from WF-006)
```json
{
  "work_date": "2026-06-27",
  "work_type": "DIRECT_SESSION",
  "hours": 1.5,
  "session_log_id": "uuid",
  "description": "Session with John"
}
```
**Response:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "status": "PENDING",
  "hours": 1.5,
  "created_at": "2026-06-27T14:35:00Z"
}
```

#### PATCH /api/v1/hours/:id
**Purpose:** Edit pending hours  
**Auth:** Required (creator or admin)  
**Request:** Updated fields (PENDING only)  
**Response:** Updated hours

#### PATCH /api/v1/hours/:id/submit
**Purpose:** Submit for approval (PENDING → SUBMITTED)  
**Auth:** Required (creator)  
**Request:**
```json
{
  "action": "submit"
}
```
**Response:** Hours with status = SUBMITTED
**Side Effects:**
- Status set to SUBMITTED
- System checks grant remaining
- If over grant: status = OUTSIDE_GRANT (triggers WF-007)
- Audit event: HOURS_SUBMITTED logged

#### PATCH /api/v1/hours/:id/approve
**Purpose:** Approve hours (admin)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "action": "approve"
}
```
**Response:** Hours with status = APPROVED
**Side Effects:**
- Audit event: HOURS_APPROVED logged
- Grant remaining recalculated

#### PATCH /api/v1/hours/:id/reject
**Purpose:** Reject hours (admin)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "rejection_reason": "Hours seem excessive for this case"
}
```
**Response:** Hours with status = REJECTED
**Side Effects:**
- Audit event: HOURS_REJECTED logged

#### PATCH /api/v1/hours/:id/review-outside-grant
**Purpose:** Review outside grant hours (WF-007)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "action": "approve|reject",
  "review_note": "Approved due to crisis intervention required"
}
```
**Response:** Hours with status = APPROVED or REJECTED

#### GET /api/v1/cases/:caseId/hours
**Purpose:** List hours for case  
**Auth:** Required (admin or assigned)  
**Query:**
```
?status=PENDING|SUBMITTED|APPROVED|REJECTED|OUTSIDE_GRANT
?page=1&limit=50
```
**Response:** Array of hours with approval status

---

### MATCHING DOMAIN

#### POST /api/v1/cases/:caseId/match-run
**Purpose:** Trigger matching (WF-003)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "trigger_reason": "New case ready for professional assignment"
}
```
**Response:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "status": "INITIATED",
  "algorithm_version": "1.0",
  "created_at": "2026-06-27T10:00:00Z"
}
```
**Side Effects:**
- MatchRun created with status = INITIATED
- Backend scores candidates asynchronously
- MatchRun status → SCORED when complete
- Audit event: MATCH_RUN_TRIGGERED logged

#### GET /api/v1/match-runs/:id
**Purpose:** Get match run and candidates  
**Auth:** Required (admin)  
**Response:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "status": "SCORED",
  "algorithm_version": "1.0",
  "candidates": [
    {
      "rank": 1,
      "professional": {
        "id": "uuid",
        "name": "Jane Doe",
        "profession": "PEDAGOGUE",
        "experience_years": 8
      },
      "overall_score": 85,
      "explanation": "Excellent qualifications (8 years) + available capacity (5h/5h needed) + strong complexity fit",
      "scores": {
        "qualifications_score": 90,
        "availability_score": 100,
        "capacity_score": 75,
        "complexity_fit_score": 85
      }
    },
    {
      "rank": 2,
      "professional": { ... },
      "overall_score": 72,
      "explanation": "Good experience but limited availability"
    }
  ],
  "created_at": "2026-06-27T10:00:00Z"
}
```

#### PATCH /api/v1/match-runs/:id/assign
**Purpose:** Select professional and create assignment (WF-003)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "professional_id": "uuid",
  "override_reason": null
}
```
**Response:**
```json
{
  "match_run_id": "uuid",
  "assignment_id": "uuid",
  "case_id": "uuid",
  "professional_id": "uuid",
  "status": "ASSIGNED",
  "created_at": "2026-06-27T10:05:00Z"
}
```
**Side Effects:**
- MatchRun status → ASSIGNED (or OVERRIDDEN if rank != 1)
- CaseAssignment created (new record, never updates)
- Case status → MATCHED
- Audit event: HUMAN_DECISION_RECORDED logged
- Audit event: HUMAN_DECISION_OVERRIDE logged (if not rank 1)

---

### HANDOVER DOMAIN

#### POST /api/v1/cases/:caseId/handover
**Purpose:** Initiate professional handover (WF-008)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "reason": "PROFESSIONAL_UNAVAILABLE",
  "incoming_professional_id": "uuid|null"
}
```
**Response:**
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "outgoing_professional_id": "uuid",
  "incoming_professional_id": "uuid",
  "status": "INITIATED",
  "created_at": "2026-06-27T10:00:00Z"
}
```

#### PATCH /api/v1/cases/:caseId/handover/:handoverId/transfer-sessions
**Purpose:** Transfer session logs (WF-008)  
**Auth:** Required (admin)  
**Request:**
```json
{
  "session_log_ids": ["uuid1", "uuid2", "uuid3"]
}
```
**Response:** Handover with transferred_session_logs array
**Side Effects:**
- SessionLogTransfer records created for each session
- Audit event: SESSION_LOG_TRANSFERRED logged per transfer

#### PATCH /api/v1/cases/:caseId/handover/:handoverId/complete
**Purpose:** Complete handover  
**Auth:** Required (admin)  
**Request:**
```json
{
  "action": "complete"
}
```
**Response:** Handover with status = COMPLETED
**Side Effects:**
- Old CaseAssignment ended (ended_at set)
- New CaseAssignment created (if incoming_professional_id not null)
- Audit event: HANDOVER_COMPLETED logged

---

### AUDIT DOMAIN

#### GET /api/v1/audit/events
**Purpose:** Query audit log  
**Auth:** Required (admin)  
**Query:**
```
?event_type=CASE_CREATED|PROFESSIONAL_APPROVED|HOURS_APPROVED|...
?actor_id=uuid
?resource_type=case|professional|hours|...
?resource_id=uuid
?from=2026-06-01T00:00:00Z
?to=2026-06-30T23:59:59Z
?page=1&limit=100
```
**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "event_type": "HOURS_APPROVED",
      "actor_id": "uuid",
      "actor_email": "admin@kursskifte.dk",
      "resource_type": "hours",
      "resource_id": "uuid",
      "metadata": {
        "case_id": "uuid",
        "hours": 4.5
      },
      "created_at": "2026-06-27T14:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### GET /api/v1/audit/events/:eventId
**Purpose:** Get full audit event details  
**Auth:** Required (admin)  
**Response:** Single audit event with all metadata

---

## 2.5 ERROR RESPONSES

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Insufficient permissions (RLS) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Status transition invalid |
| 422 | Unprocessable | Validation failed |
| 500 | Server Error | Unhandled exception |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hours cannot exceed 8 per day",
    "details": [
      {
        "field": "hours",
        "reason": "INVALID_RANGE",
        "message": "Must be between 0.25 and 8"
      }
    ]
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| VALIDATION_ERROR | 422 | Input validation failed |
| UNAUTHORIZED | 401 | JWT missing or invalid |
| FORBIDDEN | 403 | RLS policy denied access |
| NOT_FOUND | 404 | Resource doesn't exist |
| CONFLICT | 409 | Invalid state transition |
| EXTERNAL_SERVICE | 502 | Dependency failed |
| INTERNAL_ERROR | 500 | Unhandled exception |

---

## 2.6 VALIDATION RULES

### Professional

- `email`: Valid email format, unique
- `profession`: Must be one of enum values
- `experience_years`: >= 0
- `capacity_hours_week`: > 0, <= 100
- `max_concurrent_cases`: > 0, <= 10
- `target_age_groups`: Array of valid age ranges

### Case

- `citizen_initials`: Exactly 2 characters
- `citizen_age_range`: One of ["0-5", "6-12", "13-18", "18+"]
- `weekly_hours`: > 0, <= 40
- `complexity_factors`: At least one boolean true (validation recommendation)

### Session Log

- `session_date`: <= TODAY (cannot be future)
- `observations`: Max 5000 chars
- `participant_names`: Array, max 10 names
- `location`: Max 500 chars

### Registered Hours

- `hours`: >= 0.25, <= 8.0
- `work_date`: <= TODAY
- `work_type`: Valid enum
- `session_log_id`: If DIRECT_SESSION, must reference session for this case

### Match Run

- `case_id`: Must have status = OPEN
- `trigger_reason`: Max 300 chars

---

## 2.7 PAGINATION

**Strategy:** Offset-based with max limit

**Request:**
```
GET /api/v1/cases?page=2&limit=50
GET /api/v1/professionals?page=1&limit=25
```

**Response:**
```json
{
  "items": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 250,
    "total_pages": 5,
    "has_next": true,
    "has_previous": true
  }
}
```

**Limits:**
- Min limit: 1
- Default limit: 20
- Max limit: 100

---

## 2.8 RATE LIMITING

**Strategy:** Per-user rate limiting via Supabase/middleware

**Limits:**
- Professional: 100 requests/minute
- Admin: 500 requests/minute

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1624867200
```

**Exceeded Response:**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retry_after": 45
  }
}
```

---

## 2.9 FILTERING & SEARCH

### Professionals
```
GET /api/v1/professionals?status=ACTIVE&profession=PEDAGOGUE
```

### Cases
```
GET /api/v1/cases?status=ACTIVE&municipality=uuid&complexity=HIGH
```

### Hours
```
GET /api/v1/cases/:caseId/hours?status=PENDING&from=2026-06-01
```

---

## 2.10 WEBHOOKS (Future Phase 2)

**Not in MVP.** Phase 2 can add webhook support for external integrations.

---

**End of Part 2: API Specification**

**Next:** Part 3 — Backend Specification (domain services, business logic, transactions)

---

This API Specification is complete and implementation-ready.

Every endpoint, request/response, validation rule, and error code is defined.

**Status:** Ready for Part 3 (Backend Specification)
