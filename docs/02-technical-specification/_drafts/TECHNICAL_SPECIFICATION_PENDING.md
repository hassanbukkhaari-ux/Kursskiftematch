# Technical Specification (PENDING APPROVAL)
## Kursskifte Match 2.0

**Date:** June 27, 2026  
**Status:** NOT YET APPROVED — NEXT PHASE  
**Version:** 0.0 (Not Started)

---

## ⚠️ WARNING

**This specification is not yet approved.**

Development cannot begin until this document is complete, reviewed, and explicitly approved.

All work on this document happens AFTER domain model (V4) is locked.

---

## PURPOSE

This document will define:
1. API endpoint design
2. Request/response contracts
3. Validation rules
4. Data encryption strategy
5. Error handling
6. Testing strategy
7. Performance targets
8. Security requirements

---

## SECTIONS TO BE COMPLETED

### 1. API Endpoints (Decision: REST vs GraphQL)

**TBD:**
- Create case: POST /api/cases
- Update case: PATCH /api/cases/:caseId
- List cases: GET /api/cases (with filters, pagination)
- Create CaseAssignment: POST /api/cases/:caseId/assignments
- Register hours: POST /api/cases/:caseId/hours
- Create SessionLog: POST /api/cases/:caseId/sessions
- ... (30+ endpoints)

**Decisions needed:**
- REST (simple, familiar) vs GraphQL (flexible queries)
- HTTP method choices (PATCH vs PUT)
- Response envelope (data vs bare objects)
- Pagination strategy (cursor vs offset)

### 2. Authentication & Authorization

**Flow to document:**
- Email/password login endpoint
- MFA flow (optional for MVP?)
- JWT token generation
- Custom claims (role stored in JWT or checked from profiles table?)
- Token refresh strategy
- Session management

**Decisions needed:**
- JWT custom claims vs. database role checks
- Token expiry (15m access + 7d refresh?)
- MFA required or optional
- Session revocation mechanism

### 3. Data Encryption

**Fields to encrypt (application layer):**
- SessionLog.observations
- SessionLog.safeguarding_detail
- RegisteredHours descriptions? (TBD)
- ContactLog.note
- CaseHandover.handover_note
- Others?

**Decisions needed:**
- Encryption library (TweetNaCl.js, libsodium.js?)
- Key management (Supabase KMS, key rotation policy)
- Which fields encrypted (full list)
- Search capability on encrypted fields (full-text search impossible)
- Decryption at application layer (Supabase views vs. app code)

### 4. Validation Rules

**Examples to detail:**
- Case creation: complexity_level must match factors (auto-calculated?)
- RegisteredHours: hours between 0.25 and 8.0
- SessionLog: observations required if not DRAFT
- CaseAssignment: only one ACTIVE per case
- Document expiry: must be future date
- Others?

**Decisions needed:**
- Client-side validation (UX hints)
- Server-side validation (security)
- Custom validators (complexity calculation, workload checks)
- Error response format

### 5. Error Handling

**Response codes to standardize:**
- 400 Bad Request (validation failed)
- 401 Unauthorized (not authenticated)
- 403 Forbidden (authenticated but no access)
- 404 Not Found (resource doesn't exist)
- 409 Conflict (state violation, e.g., creating 2nd ACTIVE assignment)
- 422 Unprocessable Entity (semantic validation failed)
- 500 Internal Server Error
- Others?

**Error response format:**
```
{
  "error": "CASE_CONFLICT",
  "message": "Cannot assign professional: case already has active assignment",
  "details": { "caseId": "...", "existingAssignmentId": "..." }
}
```

**Decisions needed:**
- Which errors return which codes
- When to log errors (all? only 5xx?)
- User-facing messages vs. technical details

### 6. Testing Strategy

**Unit tests:**
- Domain logic (complexity calculation, workload status)
- Validators
- Auth checks

**Integration tests:**
- API endpoints (happy path + error cases)
- RLS policies (verify access control)
- Audit event creation

**E2E tests (Playwright):**
- Admin: create case → assign professional → register hours
- Professional: view case → write session log → register hours
- Handover: transition professional → session log transfer

**Performance tests:**
- Workload calculation (for 100+ cases)
- Audit query performance
- Grant calculation (for 1000s of hours)

**Decisions needed:**
- Test coverage targets (80%? 90%?)
- Automated testing in CI/CD
- Performance benchmarks
- Load testing approach

### 7. Performance Targets

**Query performance:**
- Load professional dashboard: < 500ms
- Calculate workload status: < 100ms
- List cases: < 1s (with pagination)
- Generate audit report: < 5s (for 1000 events)

**Decisions needed:**
- Database indexing strategy
- Caching (Redis? Application-level?)
- Query optimization approach
- Monitoring (APM tool? Supabase monitoring?)

### 8. Security Requirements

**Required:**
- HTTPS only (enforced)
- CSRF protection (SameSite cookies)
- SQL injection prevention (parameterized queries)
- XSS prevention (HTML escaping)
- Rate limiting (login attempts, API calls)
- CORS policy (localhost:3000, kursskifte.dk)
- Secret management (env vars, no hardcoding)

**Decisions needed:**
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limit thresholds (attempts/minute, requests/hour)
- CORS allowed origins
- DDoS protection (Cloudflare?)
- Vulnerability scanning (OWASP?)

---

## PLACEHOLDER: SPECIFICATION STRUCTURE

When approved, this document will contain:

### Section 1: API Overview
- Base URL
- Authentication header format
- Error response format
- Rate limiting headers

### Section 2: Authentication Endpoints
- POST /auth/signup
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- POST /auth/mfa (if implemented)

### Section 3: Case Endpoints (15+ endpoints)
- POST /api/cases
- GET /api/cases
- GET /api/cases/:caseId
- PATCH /api/cases/:caseId
- ... (CRUD operations)

### Section 4: Professional Endpoints (10+ endpoints)
- POST /api/professionals
- GET /api/professionals
- GET /api/professionals/:professionalId
- ... (crud, documents, capacity)

### Section 5: Work Tracking Endpoints (15+ endpoints)
- POST /api/cases/:caseId/sessions
- GET /api/cases/:caseId/sessions
- POST /api/cases/:caseId/sessions/:sessionId/corrections
- POST /api/cases/:caseId/hours
- ... (hours, approvals, reviews)

### Section 6: Assignment Endpoints (5+ endpoints)
- POST /api/cases/:caseId/assignments
- GET /api/cases/:caseId/assignments
- PATCH /api/cases/:caseId/assignments/:assignmentId (transition status)

### Section 7: Matching Endpoints (5+ endpoints)
- POST /api/cases/:caseId/match-runs
- GET /api/cases/:caseId/match-runs/:runId/candidates
- POST /api/cases/:caseId/match-runs/:runId/assign

### Section 8: Admin Endpoints (10+ endpoints)
- POST /api/municipalities
- GET /api/audit-events
- POST /api/documents/:docId/verify
- ... (grant management, document verification)

### Section 9: Data Encryption
- Which fields encrypted
- Encryption algorithm
- Key management
- Decryption strategy

### Section 10: Validation Rules
- Per-endpoint validation
- Custom validators
- Error responses

### Section 11: Testing Strategy
- Unit tests
- Integration tests
- E2E tests
- Performance benchmarks

### Section 12: Security
- Headers
- CORS
- Rate limiting
- Secret management

---

## DECISION DEPENDENCIES

Before writing Technical Specification:

1. **REST or GraphQL?** (impacts every endpoint)
2. **JWT custom claims or database lookups?** (impacts auth)
3. **Which fields encrypted?** (impacts all endpoints with data)
4. **MFA required?** (impacts login flow)
5. **Caching strategy?** (impacts performance endpoints)

---

## APPROVAL GATE

**This specification cannot be approved until:**

1. ✅ Domain Model (V4) is approved and locked
2. ✅ Master Directive is approved
3. ⏳ This Technical Specification is written in full
4. ⏳ It is reviewed by Hassan
5. ⏳ All questions answered
6. ⏳ It is explicitly approved (signed off)

---

## CRITICAL RULE

**NO CODE WRITTEN BEFORE THIS SPECIFICATION IS APPROVED.**

Any code written before approval will be discarded.

---

## NEXT STEPS

1. Complete this specification (2-3 weeks)
2. Review with Hassan
3. Get explicit approval
4. Only then: Supabase schema + Next.js scaffold
5. Then: Development begins

---

**Placeholder document by:** Kursskifte ApS — Architecture  
**Status:** PENDING CREATION  
**Reference:** Master Directive, Domain Model (V4)  
**Critical Note:** No code before approval
