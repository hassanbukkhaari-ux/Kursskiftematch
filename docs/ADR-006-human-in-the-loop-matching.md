# Implementation Strategy: Kurskifte-Match

**Document Type:** Technical Strategy (Bridge between Architecture and Technical Specification)  
**Audience:** Technical Leads, Architects, Engineering Managers, Developers  
**Date:** June 27, 2026  
**Status:** DRAFT (awaiting technical approval)  
**Purpose:** Define the sequence and approach for implementing Kurskifte-Match to minimize risk and avoid rework

---

## EXECUTIVE SUMMARY

This document describes HOW to build Kurskifte-Match based on WHAT to build (MVP Definition) and WHERE to build it (Architecture).

**Key Strategy:**
- Build domain-by-domain in dependency order
- Build bottom-up (database → API → UI)
- Implement authentication and permissions FIRST (foundation for everything)
- Validate each layer before proceeding
- Minimize rework by locking architecture before building

**Build Sequence (13-week estimate):**
1. **Phase 0 (Week 1):** Foundation (auth, database, base API structure)
2. **Phase 1 (Weeks 2-3):** Professional Domain (foundation for all other domains)
3. **Phase 2 (Week 4):** Municipality & Governance Domains
4. **Phase 3 (Weeks 5-7):** Case Domain (central to platform)
5. **Phase 4 (Weeks 8-9):** Matching Domain
6. **Phase 5 (Weeks 10-11):** Delivery Domain
7. **Phase 6 (Week 12):** UI/Integration
8. **Phase 7 (Week 13):** Testing & Hardening

---

## 1. DEVELOPMENT PHASES

### Phase 0: Foundation (Week 1)

**Objective:** Establish technical base for all domains

**Deliverables:**
- Development environment (local + staging)
- **Database schema: ALL 17 tables from DOMAIN_MODEL_DATABASE_SPEC created and migrated** (complete schema upfront, then implement per-domain logic in Phases 1-5)
- Authentication system (login, session management)
- Base API structure (middleware, error handling, logging)
- Permission enforcement framework (RLS, backend checks)
- Audit logging infrastructure

**Key Decisions Required:**
- Database choice finalization (Supabase confirmed in MASTER_DIRECTIVE)
- Auth provider (built-in or external?)
- API versioning strategy
- Error response format

**Why First:**
- Authentication and permissions needed by ALL domains
- Database schema impacts all implementation
- Audit logging required from day one (GDPR)
- Prevents rework later when permissions change

**Source:** MASTER_DIRECTIVE.md (unified Next.js + Supabase architecture)

---

### Phase 1: Professional Domain (Weeks 2-3)

**Objective:** Complete professional lifecycle — recruitment through offboarding

**Deliverables:**
- Professional entity with all fields
- ProfessionalDocument entity for credentials
- Professional status tracking (REGISTERED → ACTIVE → ARCHIVED)
- Document verification workflow
- Capacity and availability tracking
- Professional CRUD endpoints
- Document upload/verification endpoints
- Professional list and search
- Recruiter and Professional UI screens

**Build Order (for this domain):**
1. Database: Professional, ProfessionalDocument tables already created in Phase 0. This step: Add domain-specific indexes, constraints, RLS policies
2. API: Professional endpoints (create, read, update, list)
3. API: Document endpoints (upload, verify, list)
4. API: Capacity/availability endpoints
5. Auth: Professional system role
6. Permission: Professional data access rules
7. UI: Admin professional management screens
8. UI: Professional portal screens
9. Testing: Professional workflows end-to-end

**Critical Path Item:**
- Professional entity must be complete before other domains (all cases need professional assignments)

**Source:** BUSINESS_CAPABILITY_MAP.md (Professional Domain, 10 capabilities)

---

### Phase 2: Municipality & Governance Domains (Week 4)

**Objective:** Establish reference data and audit foundation

**Deliverables:**
- Municipality reference data
- Sagsbehandler contact management
- Audit event logging (all events from Phase 0-1 logged)
- Basic compliance export (audit trail)
- Permission matrix enforcement

**Build Order:**
1. Database: Municipality, Sagsbehandler contact tables
2. API: Municipality CRUD endpoints
3. API: Sagsbehandler CRUD endpoints
4. API: Audit event recording (apply to all Phase 0-1 changes)
5. API: Audit trail query (compliance export)
6. UI: Municipality management
7. Testing: Audit trail verification

**Why This Phase:**
- Needed for case creation (WF-002 prerequisite)
- Audit trail foundation for entire system
- Permission matrix can now be fully tested

**Source:** BUSINESS_CAPABILITY_MAP.md (Municipality Domain 2.1-2.5, Governance 5.1-5.8)

---

### Phase 3: Case Domain (Weeks 5-7)

**Objective:** Implement case lifecycle — from inquiry to closure

**Deliverables:**
- Case entity with all fields
- CaseAssignment temporal tracking
- CaseGrant budget tracking
- CaseComplexityFactors assessment
- Case status workflow (OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED)
- Case creation from inquiry (WF-002)
- Complexity assessment
- Grant tracking and "outside grant" detection
- Case assignment process
- Case handover process
- Case closure and archival
- Case management UI screens

**Build Order (for this domain):**
1. Database: Case, CaseAssignment, CaseGrant, CaseComplexityFactors
2. API: Case creation endpoint
3. API: Complexity assessment endpoint
4. API: Case assignment endpoint (without matching yet — manual)
5. API: Case status update endpoints
6. API: Case handover endpoints
7. API: Case closure/archival endpoints
8. API: Grant tracking endpoints
9. Audit: Integrate all case events into audit trail
10. UI: Case creation (from inquiry)
11. UI: Case management dashboard
12. UI: Complexity assessment form
13. UI: Assignment UI (manual selection initially)
14. Testing: WF-002 (Municipality Inquiry to Case Creation) end-to-end

**Critical Path Item:**
- Case domain must be complete before matching (matching operates on cases)

**Complexity Consideration:**
- CaseAssignment is temporal (never updated, only ended)
- Handover is explicit workflow (not automatic)
- Case state machine must be enforced

**Source:** BUSINESS_CAPABILITY_MAP.md (Case Domain, 9 capabilities) + WF-002

---

### Phase 4: Matching Domain (Weeks 8-9)

**Objective:** Implement matching as decision support (not automatic assignment)

**Deliverables:**
- MatchRun entity for tracking match sessions
- MatchCandidate scoring and ranking
- Matching algorithm (v1.0) with explainability
- Candidate recommendation to Case Coordinator
- Match decision recording (human approval)
- Matching score calculation
- Match explanation generation
- Matching API endpoints
- Matching UI screens

**Build Order:**
1. Database: MatchRun, MatchCandidate tables
2. Matching Algorithm v1.0:
   - Define scoring factors (qualifications, experience, capacity, availability, fit)
   - Implement deterministic algorithm
   - Make algorithm testable and versioned
3. API: Trigger match run endpoint
4. API: Score candidates endpoint
5. API: Generate explanations endpoint
6. API: Recommend candidates endpoint
7. API: Record human decision endpoint
8. Permission: Match decision must be admin-only (no auto-assign)
9. Audit: All matching events audited
10. UI: Match run UI (trigger, view results, select candidate)
11. Testing: Matching logic (deterministic, repeatable)
12. Testing: WF-003 (Match Run and Assignment) end-to-end

**Constraint:**
- Matching CANNOT auto-assign (human decision always required)
- Scores must be explainable (not black-box)

**Source:** BUSINESS_CAPABILITY_MAP.md (Matching Domain, 6 capabilities)

---

### Phase 5: Delivery Domain (Weeks 10-11)

**Objective:** Implement work tracking — sessions, hours, contact logs

**Deliverables:**
- SessionLog entity (write-once work documentation)
- RegisteredHours for payroll/grant tracking
- SessionLogCorrection correction model
- Contact logs for professional-sagsbehandler communication
- Hour approval/rejection workflow
- Outside grant review workflow
- Session logging endpoints
- Hour registration and approval endpoints
- Contact log endpoints
- Professional work portal (session/hour management)

**Build Order:**
1. Database: SessionLog, RegisteredHours, SessionLogCorrection, ContactLog
2. API: SessionLog endpoints (create, finalize, list)
3. API: Correction endpoints (record correction)
4. API: RegisteredHours endpoints (register, submit, list)
5. API: Hour approval/rejection endpoints (admin only)
6. API: Outside grant review endpoint (admin)
7. API: ContactLog endpoints
8. Audit: Integrate all delivery events into audit trail
9. Permission: Professional can only access own sessions/hours
10. UI: Professional session logging portal
11. UI: Professional hour registration portal
12. UI: Admin hour approval dashboard
13. UI: Admin contact log view
14. Testing: WF-005 (Session Documentation) end-to-end
15. Testing: WF-006 (Registered Hours) end-to-end
16. Testing: WF-007 (Outside Grant Review) end-to-end

**Complexity:**
- SessionLog is write-once (immutable after finalization)
- Corrections use correction model (explain without hiding original)
- Hours can exist independently of sessions (admin work, documentation)
- Grant tracking automatic (remaining hours calculated per query)

**Source:** BUSINESS_CAPABILITY_MAP.md (Delivery Domain, 7 capabilities)

---

### Phase 6: UI Integration & Completion (Week 12)

**Objective:** Complete UI, integrate all domains, polish

**Deliverables:**
- Complete professional portal
- Complete admin portal
- Integration testing of all domains
- Documentation export (compliance)
- Basic reporting (hours, budget, audit trail)
- Error handling across all flows
- Session-based navigation
- Role-based UI (show only what user can access)

**Build Order:**
1. Professional Portal:
   - Dashboard (my cases, pending sessions/hours)
   - Case view (assigned cases, session history)
   - Session logging (create, submit, view)
   - Hour registration (submit, view status)
   - Profile/availability management
2. Admin Portal:
   - Dashboard (KPIs, pending actions)
   - Professional management (create, verify, capacity)
   - Municipality management
   - Case management (create, assign, close)
   - Matching interface (trigger, review, decide)
   - Hour approval queue
   - Audit trail viewer
   - Compliance export
3. Integration:
   - Navigation between screens
   - Role-based access
   - Error message display
   - Loading indicators
   - Data consistency across domains

**Source:** MVP_DEFINITION.md (Screens/Pages section)

---

### Phase 7: Testing, Hardening & Go-Live Prep (Week 13)

**Objective:** Validate complete system, identify issues, prepare for launch

**Deliverables:**
- All unit tests passing
- All integration tests passing
- Manual testing of all workflows complete
- Load testing (expected user volume)
- Security review (permissions, SQL injection, XSS)
- Audit trail validation
- GDPR compliance checklist
- Deployment documentation
- Runbook (how to operate)
- Rollback plan

**Build Order:**
1. Unit Testing:
   - All domain logic tested
   - All calculations verified (complexity, matching scores, remaining hours)
   - All validations tested
2. Integration Testing:
   - All workflows end-to-end (WF-001 through WF-013, as documented)
   - All domain interactions verified
   - All permission checks verified
   - All audit events verified
3. Manual Testing:
   - Professional onboarding workflow
   - Case creation from inquiry
   - Matching workflow
   - Hour approval workflow
   - Case closure workflow
4. System Testing:
   - Concurrent users
   - Concurrent case/hour updates
   - Race conditions
   - Cascade deletes/archives
5. Security Testing:
   - Permission enforcement
   - Data access isolation (professional sees only own data)
   - Audit trail immutability
   - Input validation
6. GDPR Testing:
   - Data retention schedule working
   - Deletion not happening before schedule
   - Sensitive data encrypted
   - Audit events not containing sensitive data
7. Performance Testing:
   - Query response times < 2s
   - No N+1 problems
   - Index effectiveness
   - Report generation time
8. Documentation:
   - Architecture as-built
   - Database schema
   - API documentation (if exposed)
   - Deployment guide
   - Operational runbook

---

## 2. BUILD ORDER (Dependency Sequence)

**Critical Path:**

```
Phase 0: Foundation
  ↓
Phase 1: Professional Domain
  ↓
Phase 2: Municipality Domain + Governance
  ↓
Phase 3: Case Domain
  ↓
Phase 4: Matching Domain
  ↓
Phase 5: Delivery Domain
  ↓
Phase 6: UI Integration
  ↓
Phase 7: Testing & Hardening
```

**Why This Order:**

1. **Foundation First:** Authentication and permissions needed by everything
2. **Professional Domain Second:** Other domains reference professionals
3. **Municipality/Governance Third:** Enables case creation, audit trail baseline
4. **Case Domain Fourth:** Central entity, depends on Professional and Municipality
5. **Matching Domain Fifth:** Operates on Cases, depends on Professional capacity
6. **Delivery Domain Sixth:** Tracks work on Cases, depends on Case and Professional
7. **UI Integration Last:** Can integrate all domains once APIs complete
8. **Testing Final:** Full system validation

**No Parallelization Recommended:** Domains have dependencies that make parallelization risky:
- Can't build Case without Professional
- Can't build Matching without Case
- Can't build Delivery without Case
- Parallel UI work OK but depends on complete API

---

## 3. MODULE DEPENDENCIES

### Dependency Graph

```
┌─────────────────────────────────────────────┐
│         Foundation Layer                    │
│  (Auth, DB, API Base, Audit Logging)       │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
   Professional Municipality Governance
        │          │          │
        └──────────┼──────────┘
                   │
                   ▼
                 Case Domain
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
     Matching   Delivery    (UI Integration)
```

### Explicit Dependencies

| Domain | Depends On | Why |
|--------|-----------|-----|
| Professional | Foundation | Auth, DB, Audit |
| Municipality | Foundation | Auth, DB, Audit |
| Governance | Foundation, Professional, Municipality | Audit all entities |
| Case | Professional, Municipality, Governance | Needs both, must audit |
| Matching | Case, Professional | Scores professionals for cases |
| Delivery | Case, Professional | Logs work on cases |
| UI | All domains | Presents all data |

### Breaking Circular Dependencies

- **Case ↔ Matching:** Matching only RECOMMENDS (doesn't decide). Case records decision. No cycle.
- **Case ↔ Delivery:** Delivery only records work. Case only tracks assignments. No cycle.
- **Professional ↔ Matching:** Professional provides data. Matching uses it. No cycle.

---

## 4. DOMAIN IMPLEMENTATION ORDER

### Domain 1: Professional Domain (Weeks 2-3)

**Why First:**
- Required by all other domains (they reference professionals)
- Simplest domain (CRUD operations mostly)
- Foundation for capacity/availability constraints

**Entities to Build:**
- Professional (status, qualifications, capacity, availability)
- ProfessionalDocument (credentials, verification)

**Key Features:**
- Professional status machine (REGISTERED → ACTIVE → ARCHIVED)
- Document verification with expiry
- Capacity and availability tracking

**Testing Gate:**
- Professional can be created → verified → approved
- Professional profile can be updated
- Document can be uploaded → verified
- Capacity can be updated

---

### Domain 2: Municipality Domain (Week 4, early)

**Why Second:**
- Reference data needed for case creation
- Simple (mostly reference data)
- No dependencies on other domains

**Entities to Build:**
- Municipality
- Sagsbehandler contact info

**Key Features:**
- Municipality CRUD
- Sagsbehandler contact management

**Testing Gate:**
- Municipality can be created/updated
- Sagsbehandler contacts can be added/updated

---

### Domain 3: Governance Domain (Week 4, concurrent with Municipality)

**Why Concurrent:**
- Foundation for audit trail
- Needed by all domains
- Relatively independent

**Entities to Build:**
- AuditEvent (immutable event log)

**Key Features:**
- Event recording (one-way, immutable)
- Audit trail queries
- Compliance export

**Testing Gate:**
- Audit events recorded for all Phase 0-2 changes
- Audit trail is immutable (cannot be deleted/updated)
- Compliance export contains all events

---

### Domain 4: Case Domain (Weeks 5-7)

**Why Fourth:**
- Depends on Professional and Municipality
- Central to platform (all other work is for cases)
- Most complex domain

**Entities to Build:**
- Case (central entity)
- CaseAssignment (temporal tracking, not cases.professional_id)
- CaseGrant (budget tracking)
- CaseComplexityFactors (structured assessment)

**Key Features:**
- Case status machine (OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED)
- Complexity assessment
- Grant tracking
- Case assignment (choosing professional)
- Handover workflow

**Critical Implementation Decision:**
- CaseAssignment must be temporal (never updated, only ended)
- Prevents confusion with cases.professional_id
- Audit trail automatically shows history

**Testing Gate:**
- Case can be created from inquiry (WF-002)
- Complexity can be assessed
- Grant can be allocated
- Professional can be assigned
- Professional can be changed (handover)
- Case can be completed and archived

---

### Domain 5: Matching Domain (Weeks 8-9)

**Why Fifth:**
- Depends on Case (operates on cases)
- Depends on Professional (scores professionals)
- Recommendation system (not decision system)

**Entities to Build:**
- MatchRun (match session)
- MatchCandidate (scored professional)

**Key Features:**
- Matching algorithm (deterministic, explainable)
- Candidate scoring
- Recommendation to admin
- Decision recording (admin must decide)

**Critical Implementation Constraint:**
- Matching NEVER auto-assigns
- Admin ALWAYS selects professional
- Scores must be explainable (not ML black-box)

**Algorithm Complexity:**
- Scoring factors: qualifications, experience, capacity, availability, fit
- Weights: to be determined during technical design
- Version: v1.0 (can be updated to v1.1, v2.0, etc.)

**Testing Gate:**
- Match run can be triggered
- Candidates scored
- Scores explained
- Admin can select candidate
- Selection is recorded as human decision

---

### Domain 6: Delivery Domain (Weeks 10-11)

**Why Sixth:**
- Depends on Case (logs work on cases)
- Depends on Professional (logs work by professionals)
- Can only work after Case/Professional exist

**Entities to Build:**
- SessionLog (work documentation, write-once)
- RegisteredHours (time tracking)
- SessionLogCorrection (correction model)
- ContactLog (communication log)

**Key Features:**
- Session logging (professional logs support work)
- Hour registration (professional tracks billable time)
- Hour approval (admin approves before payment)
- Outside grant detection (alert when hours exceed budget)
- Contact logging (track professional-sagsbehandler communication)

**Critical Implementation Pattern:**
- SessionLog is write-once (immutable after finalization)
- Corrections use correction model (explain changes, don't hide)
- Hours can exist without sessions (admin work, documentation)
- Remaining grant calculated per query (not stored)

**Testing Gate:**
- Professional can log session
- Session can be corrected (with explanation)
- Hours can be registered
- Admin can approve/reject hours
- System alerts on outside grant
- Contact can be logged

---

## 5. DATABASE IMPLEMENTATION ORDER

### Phase 0 Database (Week 1)

Build ALL tables but implement domain-by-domain in code.

**Tables:**
1. auth (authentication, built-in to Supabase)
2. profiles (system users - admins and professionals)
3. professionals
4. professional_documents
5. municipalities
6. sagsbehandlers
7. audit_events (immutable)
8. cases
9. case_assignments (temporal, not cases.professional_id)
10. case_grants
11. case_complexity_factors
12. session_logs (write-once)
13. registered_hours
14. session_log_corrections
15. case_handovers
16. contact_logs
17. match_runs
18. match_candidates

**Why Build All Tables at Once:**
- Schema is locked (from architecture)
- Reduces migration complexity later
- Clear from day one what tables exist
- Easier to validate relationships

**Migrations Strategy:**
- All tables in single migration (schema is frozen)
- RLS policies added per domain (as domain is built)
- Indexes added per domain (as domain is optimized)
- No schema changes after Phase 0 (if architecture is correct)

**Supabase Specific:**
- Use Supabase migrations (via CLI)
- RLS (Row-Level Security) enforced in database
- Audit trigger on sensitive tables (optional, can be in code)
- Encryption at field level (Supabase pgcrypto or app-level)

**Source:** DOMAIN_MODEL_DATABASE_SPEC.md (all entities)

---

## 6. AUTHENTICATION IMPLEMENTATION ORDER

### Phase 0 Auth (Week 1)

**Objective:** Establish login and session management

**Implementation:**
1. Supabase Auth (built-in)
   - Email/password login
   - Session tokens (JWT)
   - Role assignment (via custom claim or profiles table)

2. Roles Table (profiles.role)
   - ADMIN (full platform access)
   - PROFESSIONAL (professional's own data only)
   - [Future roles if needed]

3. Session Management
   - Login endpoint
   - Logout endpoint
   - Session verification (every request)
   - Token refresh

4. Basic Permission Check
   - Is user authenticated? (Allow/Deny)
   - What is user's role? (ADMIN or PROFESSIONAL)
   - Can user access resource? (Enforce in API + DB RLS)

**Not Yet Implemented (Phase 0):**
- Fine-grained permissions (which specific cases can admin see?)
- RLS policies per domain
- Audit of access attempts

**Will Be Added In Phase 2:**
- Detailed permission matrix
- RLS policies per domain
- Access audit events

**Source:** MASTER_DIRECTIVE.md (Section "Unified Architecture")

---

## 7. PERMISSION IMPLEMENTATION ORDER

### Phase 0: Basic Permission (Week 1)

- Authentication working
- Roles assigned (ADMIN, PROFESSIONAL)
- Basic API authorization (token required)

### Phase 1-2: Basic Data Access (Weeks 2-4)

- Admin can access all Professional data
- Professional can access own Professional data
- Admin can access all Municipality data

### Phase 3-4: Case & Matching Permissions (Weeks 5-9)

- Admin can access all Cases
- Professional cannot access Cases directly (through assignment only)
- Admin can make match decisions
- Professional cannot make match decisions

### Phase 5: Delivery Permissions (Weeks 10-11)

- Professional can access own SessionLogs
- Professional can access own RegisteredHours
- Admin can access all SessionLogs and RegisteredHours
- Admin can approve hours
- Professional cannot approve hours

### Phase 7: Comprehensive Permission Testing (Week 13)

- All permission rules validated
- All permission denials return 403 (not 500)
- Audit trail shows access attempts
- Sensitive data not accessible to unauthorized users

**Final Permission Model:**
- Use Supabase RLS (Row-Level Security)
- Combined with API-layer checks (defense in depth)
- Audit all access attempts
- Deny by default (whitelist only allowed access)

**Source:** PERMISSION_MODEL.md (to be created before Tech Spec)

---

## 8. API IMPLEMENTATION ORDER

### Phase 0: Base API (Week 1)

**Framework:** Next.js API routes (from MASTER_DIRECTIVE)

**Infrastructure:**
- Error handling middleware (consistent error format)
- Logging middleware (all requests logged)
- Authentication middleware (verify token)
- Permission middleware (check authorization)
- CORS configuration
- Rate limiting (optional)

**Base Endpoints:**
- GET /health (system health check)
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh

### Phase 1: Professional Domain API (Weeks 2-3)

**Endpoints (CRUD + Domain-Specific):**
- POST /professionals (create professional from application)
- GET /professionals (list, admin only)
- GET /professionals/:id (get one)
- PATCH /professionals/:id (update capacity, availability)
- POST /professionals/:id/approve (approve for assignment)
- GET /professionals/:id/documents (list documents)
- POST /professionals/:id/documents (upload document)
- PATCH /professionals/:id/documents/:docid (verify document)

### Phase 2: Municipality API (Week 4)

- POST /municipalities (create)
- GET /municipalities (list)
- PATCH /municipalities/:id (update)
- POST /municipalities/:id/contacts (add sagsbehandler)
- PATCH /municipalities/:id/contacts/:contactid (update contact)

### Phase 3: Case Domain API (Weeks 5-7)

- POST /cases (create from inquiry)
- GET /cases (list)
- GET /cases/:id (get one)
- PATCH /cases/:id (update status, complexity)
- POST /cases/:id/assign (assign professional)
- POST /cases/:id/handover (initiate handover)
- POST /cases/:id/close (close case)
- POST /cases/:id/archive (archive case)

### Phase 4: Matching API (Weeks 8-9)

- POST /matching/runs (trigger match)
- GET /matching/runs/:id (get match run results)
- POST /matching/runs/:id/decide (record human decision)

### Phase 5: Delivery API (Weeks 10-11)

- POST /sessions (create session log draft)
- PATCH /sessions/:id (update draft)
- POST /sessions/:id/finalize (submit session)
- POST /sessions/:id/correct (correction)
- POST /hours (register hours)
- POST /hours/:id/submit (submit for approval)
- PATCH /hours/:id/approve (admin approves)
- PATCH /hours/:id/reject (admin rejects)
- POST /contact-logs (record contact)

### Phase 6: Governance API (Week 12)

- GET /audit-trail (query audit events)
- GET /compliance/export (export for GDPR/compliance)

**API Design Principles:**
- RESTful endpoints (resource-based URLs)
- Consistent error format (error_code, message, details)
- Pagination for list endpoints (limit, offset)
- Filtering by relevant fields (domain-specific)
- All responses wrapped in consistent envelope

**Source:** Not yet fully specified (will be in Technical Specification)

---

## 9. FRONTEND IMPLEMENTATION ORDER

### Phase 0: Base Frontend (Week 1)

- React/Next.js setup
- Layout/navigation component
- Login page
- Logout
- Permission-based route protection

### Phase 1: Professional Portal (Weeks 2-3)

**Pages:**
- Login
- Dashboard (my cases, pending items)
- My Cases (list assigned cases)
- Case Detail (sessions, hours for case)
- Session Log (create, view, submit)
- Hour Registration (submit, view status)
- My Profile (view/edit profile, documents, availability)

### Phase 2: Admin Portal - Foundation (Week 4)

**Pages:**
- Admin Dashboard (KPIs, pending actions)
- Professional Management (list, create, verify)
- Municipality Management (list, create, update)

### Phase 3: Admin Portal - Cases (Weeks 5-7)

**Pages:**
- Case Creation (from inquiry)
- Case Management (list, detail)
- Case Assignment (select professional manually)
- Case Detail (history, status, assignment)

### Phase 4: Admin Portal - Matching (Weeks 8-9)

**Pages:**
- Match Run (trigger, view results)
- Candidate Scoring (view scores and explanations)
- Candidate Selection (choose professional)

### Phase 5: Admin Portal - Hours & Delivery (Weeks 10-11)

**Pages:**
- Hour Approval Queue (pending hours)
- Hour Detail (session linked, amount, decision)
- Contact Log View
- Audit Trail (search, filter, export)

### Frontend Technology Stack

- **Framework:** Next.js (from MASTER_DIRECTIVE)
- **UI Framework:** React with Tailwind CSS (or chosen UI library)
- **State Management:** React Context or SWR (Stale-While-Revalidate)
- **Form Handling:** React Hook Form or similar
- **API Communication:** SWR or Fetch
- **Authentication:** Supabase Auth (built-in)

---

## 10. TESTING STRATEGY

### Unit Testing (Per Domain)

**Coverage:** ≥80% of code

**Test Categories:**
1. Entity validation (e.g., Case status machine)
2. Calculations (e.g., remaining grant hours, complexity scoring)
3. Business rules (e.g., cannot assign without match)
4. Permissions (e.g., professional can only see own data)

**Framework:** Jest (standard for Next.js)

**Example Tests:**
- Test complexity calculation with all factor combinations
- Test matching score is deterministic (same inputs = same output)
- Test case status transitions are valid
- Test grant tracking (used hours cannot exceed granted)

### Integration Testing (Per Workflow)

**Coverage:** All 13 workflows (as documented)

**Test Categories:**
1. End-to-end workflow (start to finish)
2. Domain interactions (case depends on professional)
3. Data consistency (audit trail is complete)
4. Permission enforcement (authorization works)

**Example Tests:**
- WF-002: Create case from municipality inquiry (end-to-end)
- WF-005: Professional logs session, hours tracked correctly
- WF-006: Admin approves hours, grant budget updated
- WF-008: Professional handed over to another professional

**Framework:** Integration tests using API endpoints (not mocked)

### Manual Testing (Per Domain)

**Coverage:** User workflows through UI

**Test Categories:**
1. UI screens render correctly
2. Form validation works
3. Error messages clear
4. Data displays correctly after operations
5. Navigation works

**Test Plan:** Document by domain/workflow

### System Testing

**Coverage:** Concurrent operations, race conditions

**Test Categories:**
1. Two admins assigning same case simultaneously
2. Professional logging hours while hours being approved
3. Multiple users logged in simultaneously
4. Database constraints enforced

**Tools:** Automated concurrency tests

### Security Testing

**Coverage:** Permission enforcement, data access

**Test Categories:**
1. Cannot access others' data (professional sees only own cases)
2. Cannot bypass permissions (API enforces, not just UI)
3. Sensitive data encrypted
4. Audit trail immutable

**Tools:** Manual + automated permission tests

### Performance Testing

**Coverage:** Response time, throughput

**Targets:**
- API response time < 2 seconds (typical query)
- No N+1 queries
- Indexes effective
- Report generation < 10 seconds

**Tools:** k6 or similar load testing

### GDPR Compliance Testing

**Coverage:** Data handling, retention, deletion

**Test Cases:**
- Sensitive data encrypted
- Audit events don't contain sensitive data
- Data retention schedule works
- Data deletion happens after schedule
- Data subject export works

**Source:** MVP_DEFINITION.md (Acceptance Criteria)

---

## 11. DEPLOYMENT STRATEGY

### Deployment Architecture

**Environment Stages:**
1. **Local Development** — Developer's machine
2. **Staging** — Isolated test environment (mirrors production)
3. **Production** — Live system

**Infrastructure:** Supabase + Vercel (or similar)
- Database: Supabase (managed PostgreSQL)
- API/Frontend: Vercel (serverless Next.js)
- Authentication: Supabase Auth
- File Storage: Supabase Storage (if needed)

**CI/CD Pipeline:**
- GitHub Actions (push → test → deploy)
- Automated tests on every PR
- Staging deploy on merge to main
- Manual production deploy (approval required)

### Deployment Process

**Phase Deployments:**

**Phase 0 → Phase 1:** Schema + Foundation APIs
- Deploy database schema
- Deploy authentication
- Deploy base API middleware
- Deploy Professional endpoints
- Deploy Professional UI (admin portal)

**Phase 1 → Phase 2:** Municipality & Governance
- Deploy Municipality endpoints
- Deploy Audit logging
- Deploy Compliance export

**Phase 2 → Phase 3:** Cases
- Deploy Case endpoints
- Deploy Case UI
- Deploy WF-002 workflow

**Phase 3 → Phase 4:** Matching
- Deploy Matching endpoints
- Deploy Matching UI

**Phase 4 → Phase 5:** Delivery
- Deploy Delivery endpoints
- Deploy Professional portal (sessions/hours)

**Phase 5 → Phase 6:** UI Integration
- Deploy complete UI
- Deploy routing/navigation
- Deploy error handling

**Phase 6 → Phase 7:** Production Preparation
- Run all tests
- Load testing
- Security review
- Documentation review
- Contingency testing (rollback)

**Production Deployment (Week 13):**
1. Final testing on staging (mirrors production)
2. Data migration (if needed)
3. Cutover plan (when switch to production)
4. Rollback plan ready
5. Deploy to production
6. Monitoring enabled
7. Support team trained

### Rollback Strategy

**For Each Deployment Phase:**

**Level 1 — Code Rollback (Fastest):**
- Deploy previous working version
- Time: ~5 minutes
- Risk: Low (code only)

**Level 2 — Data Rollback (Moderate):**
- Restore database to previous state
- Revert code
- Time: ~15-30 minutes
- Risk: Moderate (data consistency)

**Level 3 — Full Rollback (Slowest):**
- Restore entire environment from backup
- Restore code
- Full system restart
- Time: ~1 hour
- Risk: Higher (data loss possible)

**Rollback Triggers:**
- Critical API error (500 errors increasing)
- Permission bypass discovered
- Data corruption detected
- Audit trail broken
- Major performance degradation

**Who Can Trigger Rollback:**
- Engineering Lead (any time)
- On-call Engineer (with Lead approval)
- CTO (emergency authority)

**Rollback Testing:**
- Week 13: Test rollback process (restore from backup, verify data integrity)
- Must succeed within target time window

---

## 12. MILESTONES

### Week 1: Foundation

**Deliverable:** Technical base operational
- Authentication working (login/logout)
- Database schema deployed
- API base structure functional
- Basic error handling
- Audit logging framework

**Gate:** Can create professional, log session, audit event recorded

**Definition of Complete:**
- ✅ User can log in
- ✅ Tables created with no errors
- ✅ API responses in consistent format
- ✅ Audit event recorded for login

---

### Weeks 2-3: Professional Domain MVP

**Deliverable:** Complete professional lifecycle
- Professional can be created, verified, approved
- Documents can be uploaded and verified
- Capacity and availability can be tracked
- Admin can manage professionals

**Gate:** Professional onboarding workflow complete (WF-001 equivalent)

**Definition of Complete:**
- ✅ Professional created and verified
- ✅ Document verified with expiry
- ✅ Professional approved for assignment
- ✅ All professional state transitions working
- ✅ Admin UI operational

---

### Week 4: Foundation Domains

**Deliverable:** Municipality, Governance, Audit Trail
- Municipality reference data managed
- Audit trail for all changes
- Compliance export available

**Gate:** Audit trail complete and verifiable

**Definition of Complete:**
- ✅ Municipality created/updated
- ✅ Audit event for every change
- ✅ Compliance export shows all events

---

### Weeks 5-7: Case Domain MVP

**Deliverable:** Complete case lifecycle
- Cases created from inquiries (WF-002)
- Complexity assessed
- Grant allocated
- Professional assigned
- Case completed and archived

**Gate:** Municipality Inquiry to Case Creation workflow complete (WF-002)

**Definition of Complete:**
- ✅ Case created from inquiry
- ✅ Complexity assessed
- ✅ Grant allocated
- ✅ Professional assigned (manually)
- ✅ Case closed and archived
- ✅ Admin case management UI operational

---

### Weeks 8-9: Matching MVP

**Deliverable:** Matching decision support
- Match run triggered
- Candidates scored
- Score explained
- Admin selects professional

**Gate:** Matching Run and Assignment workflow complete (WF-003 equivalent)

**Definition of Complete:**
- ✅ Match run produces deterministic scores
- ✅ Scores explained
- ✅ Admin can select candidate
- ✅ Match decision recorded
- ✅ Selection creates case assignment

---

### Weeks 10-11: Delivery MVP

**Deliverable:** Work tracking operational
- Professionals log sessions
- Hours registered
- Admin approves/rejects hours
- Outside grant detected

**Gate:** Session Documentation and Hour Approval workflows complete (WF-005, WF-006, WF-007)

**Definition of Complete:**
- ✅ Session logged and finalized
- ✅ Hours registered and submitted
- ✅ Admin approves hours
- ✅ Outside grant detected and reviewed
- ✅ Professional portal operational

---

### Week 12: UI Integration

**Deliverable:** Complete platform functional
- All domains integrated
- All screens operational
- Navigation complete
- Error handling consistent

**Gate:** All features accessible and working

**Definition of Complete:**
- ✅ Professional portal: session/hour management
- ✅ Admin portal: complete case management
- ✅ All workflows navigable
- ✅ Error messages clear

---

### Week 13: Testing & Go-Live Prep

**Deliverable:** Production-ready system
- All tests passing
- Load testing successful
- Security review passed
- Documentation complete
- Rollback tested

**Gate:** Ready for production deployment

**Definition of Complete:**
- ✅ Unit tests ≥80% passing
- ✅ Integration tests all passing
- ✅ Manual testing approved
- ✅ Load test successful
- ✅ Security review cleared
- ✅ Runbook documented
- ✅ Rollback tested and working

---

## 13. RISKS

### Risk 1: Architecture Incomplete (Medium Risk)

**Description:** MVP Definition identified 26 gaps. Some gaps could require architecture changes during implementation.

**Impact:** 
- Rework of already-built features
- Delay in timeline
- Cost overrun

**Mitigation:**
- Resolve all 26 gaps BEFORE starting Phase 1
- Permission Model document created
- Workflow documentation complete
- Lock architecture at start of week 1

**Contingency:** If gap found during implementation, stop, escalate, resolve before proceeding.

---

### Risk 2: Database Schema Wrong (High Risk)

**Description:** All tables built in Phase 0. If schema is wrong, major rework needed.

**Impact:**
- Rework all domain code
- Rework all API endpoints
- Rework all UI screens
- Significant timeline delay

**Mitigation:**
- Architecture is locked (from DOMAIN_MODEL_DATABASE_SPEC.md)
- Schema review during technical spec
- Schema validation before Phase 0 completion
- Migration strategy in place

**Contingency:** If schema error found, rollback and fix. Schema changes only allowed with architecture review.

---

### Risk 3: Authentication/Permissions Incomplete (High Risk)

**Description:** If auth or permissions wrong, every domain affected.

**Impact:**
- Cannot secure system
- Cannot prevent data access violations
- Must rework all endpoints

**Mitigation:**
- Create Permission Model document before Phase 1
- Build auth/permissions in Phase 0
- Test permissions thoroughly (end of Phase 7)
- Use Supabase RLS (mature, tested)

**Contingency:** Phase 0 extension to fix auth/permissions.

---

### Risk 4: Matching Algorithm Too Complex (Medium Risk)

**Description:** Matching algorithm (Phase 4) could be more complex than anticipated.

**Impact:**
- Phase 4 extends beyond 2 weeks
- Scores not explainable (black-box)
- Quality concerns

**Mitigation:**
- Define algorithm explicitly during technical spec
- Use simple, deterministic algorithm for v1.0
- Scores must be explainable (not ML)
- Test algorithm thoroughly (no surprises)

**Contingency:** Simplify algorithm if complexity too high. Phase 4 extension if needed.

---

### Risk 5: Domain Interactions Unexpected (Medium Risk)

**Description:** Domains might have hidden interactions not caught in architecture review.

**Impact:**
- Data inconsistency
- Audit trail incomplete
- Permission violations

**Mitigation:**
- Integration testing comprehensive (all workflows)
- Domain boundary testing explicit
- Audit trail validation
- Phase 7 focused on integration issues

**Contingency:** Fix interactions as discovered. Not a blocker if found early.

---

### Risk 6: Performance Problems (Medium Risk)

**Description:** System might be slow due to poor query design or missing indexes.

**Impact:**
- Users frustrated
- Rework query design
- Optimize database

**Mitigation:**
- Performance targets defined (< 2 seconds)
- Load testing in Phase 7
- Index strategy upfront
- Monitoring built in

**Contingency:** Phase 7 extension for performance optimization.

---

### Risk 7: GDPR Compliance Incomplete (High Risk)

**Description:** GDPR requirements might not be fully implemented.

**Impact:**
- Legal liability
- Cannot go to production
- Must rework data handling

**Mitigation:**
- GDPR requirements explicit in MVP Definition
- Data retention & deletion tested in Phase 7
- Audit trail immutability validated
- Compliance checklist in Phase 7

**Contingency:** Phase 7 extension until compliance verified.

---

### Risk 8: Team Capacity (Low Risk)

**Description:** Team might not have capacity to deliver in 13 weeks.

**Impact:**
- Timeline extends
- Scope reduced
- Phase compression

**Mitigation:**
- Clear phases and milestones
- Phase gates (stop if gate not met)
- Team size appropriate for workload
- Parallel work where possible (UI can be done in parallel with API)

**Contingency:** If behind, extend timeline or reduce scope (defer Phase 2+ features).

---

### Risk 9: External Dependencies (Low Risk)

**Description:** Supabase API changes, Next.js updates, etc.

**Impact:**
- Code rework
- Delay

**Mitigation:**
- Use stable versions (not bleeding edge)
- Lock dependency versions
- Test updates before deployment

**Contingency:** Rollback to previous version if update breaks things.

---

### Risk 10: Test Coverage Insufficient (Medium Risk)

**Description:** Tests might not catch important bugs.

**Impact:**
- Production issues
- Customer impact
- Rework

**Mitigation:**
- Coverage targets (≥80%)
- Integration tests of all workflows
- Manual testing of all features
- Phase 7 focused on testing

**Contingency:** Extend Phase 7 if test gaps discovered.

---

## 14. ROLLBACK STRATEGY

### Rollback By Phase

**Phase 0 Deployment Rollback:**
- Restore previous database schema (if modified)
- Redeploy previous API
- Clear sessions
- **Time:** 5-15 minutes
- **Trigger:** Authentication broken, database corruption

**Phase 1 Deployment Rollback:**
- Restore Professional tables to previous state (if data corrupted)
- Redeploy previous API
- **Time:** 15-30 minutes
- **Trigger:** Professional workflow broken, data inconsistency

**Phase 3 Deployment Rollback (Case Domain):**
- Restore Case tables to previous state
- Redeploy previous API
- **Time:** 15-30 minutes
- **Trigger:** Case creation broken, audit trail corruption

**Phase 4 Deployment Rollback (Matching):**
- Redeploy previous API
- Clear match runs (non-destructive)
- **Time:** 5-10 minutes
- **Trigger:** Matching scoring broken, scores not deterministic

**Phase 5 Deployment Rollback (Delivery):**
- Restore SessionLog, RegisteredHours to previous state
- Redeploy previous API
- **Time:** 15-30 minutes
- **Trigger:** Session logging broken, hour approval broken

**Full System Rollback (Emergency):**
- Restore entire database from backup
- Redeploy complete previous version
- **Time:** 30-60 minutes
- **Trigger:** Data corruption, major security issue, unrecoverable state

### Rollback Decision Tree

```
Issue Detected?
├─ API Error (5xx)? 
│  └─ Increase? (>5% of requests)
│     └─ YES → Code Rollback (Level 1)
│     └─ NO → Continue monitoring
├─ Permission Bypass?
│  └─ YES → Code Rollback (Level 1)
├─ Data Corruption?
│  └─ YES → Data Rollback (Level 2)
├─ Audit Trail Broken?
│  └─ YES → Data Rollback (Level 2)
├─ Multiple Issues?
│  └─ YES → Full Rollback (Level 3)
└─ All OK? → Continue
```

### Rollback Execution

**Before Rollback:**
1. Identify issue clearly
2. Get approval from Engineering Lead
3. Notify affected users (if production)
4. Prepare rollback process

**During Rollback:**
1. Stop accepting new requests
2. Restore to previous good state
3. Verify restoration successful
4. Resume operations
5. Monitor for issues

**After Rollback:**
1. Investigate root cause
2. Fix issue
3. Test fix thoroughly
4. Plan redeployment
5. Document incident

**Rollback Testing (Week 13):**
- Test database restore from backup
- Verify data integrity after restore
- Test code rollback process
- Verify system functional after rollback
- **Success Criteria:** Rollback complete within target time, data intact

---

## 15. DEFINITION OF IMPLEMENTATION COMPLETE

MVP Implementation is complete and ready to ship when:

### Code Quality
- ✅ All code reviewed and approved
- ✅ No critical security issues
- ✅ No hardcoded secrets
- ✅ Consistent code style
- ✅ No TODO comments (or documented backlog)

### Functionality
- ✅ All 13 domains operational
- ✅ All workflows testable (WF-001 through WF-013 equivalent)
- ✅ All business capabilities working
- ✅ All entity types implemented

### Testing
- ✅ Unit tests ≥80% code coverage
- ✅ All integration tests passing
- ✅ All manual testing approved (sign-off)
- ✅ Load test successful (response times < 2s)
- ✅ Security test passed (no bypasses)
- ✅ All edge cases tested

### Performance
- ✅ API response time < 2 seconds (typical)
- ✅ No N+1 query problems
- ✅ Database indexes optimized
- ✅ Report generation < 10 seconds

### Security
- ✅ Authentication working
- ✅ Permissions enforced (backend + API)
- ✅ Sensitive data encrypted
- ✅ Audit trail immutable
- ✅ No SQL injection vulnerabilities
- ✅ CORS configured correctly

### Data & Compliance
- ✅ GDPR data minimization (initials only, etc.)
- ✅ Data retention schedule active
- ✅ Deletion schedule working (not executing yet)
- ✅ Audit trail complete (no events missing)
- ✅ Audit trail immutable (cannot be edited/deleted)
- ✅ Data subject export working

### Documentation
- ✅ Architecture documentation updated (as-built)
- ✅ Database schema documented
- ✅ API contract documented
- ✅ Deployment guide written
- ✅ Runbook written (how to operate)
- ✅ Troubleshooting guide written

### Operations Readiness
- ✅ Monitoring configured (error alerts, performance)
- ✅ Logging configured (all requests logged)
- ✅ Backup strategy in place
- ✅ Disaster recovery tested
- ✅ Support team trained
- ✅ Rollback tested and working

### Stakeholder Sign-Off
- ✅ Product Owner approval
- ✅ Technical Lead approval
- ✅ Architecture approval
- ✅ Security review approved
- ✅ Operations approval
- ✅ Legal/Compliance approval (GDPR)

### Go-Live Checklist
- ✅ Final staging verification (mirrors production)
- ✅ Data migration plan (if applicable)
- ✅ Cutover plan written
- ✅ Rollback plan tested
- ✅ Communication plan (notify users)
- ✅ Support escalation ready
- ✅ Post-launch monitoring plan

### Success Metrics
- ✅ System uptime ≥99%
- ✅ API response time < 2 seconds (average)
- ✅ No critical bugs in first week
- ✅ Professional users can complete workflows
- ✅ Admin can manage cases
- ✅ Audit trail growing (events being logged)

---

## SUMMARY

### Implementation Path

```
Week 1:  Foundation (Auth, DB, API base)
         ↓
Weeks 2-3: Professional Domain (Recruitment, verification, capacity)
         ↓
Week 4:  Municipality & Governance (Reference data, audit trail)
         ↓
Weeks 5-7: Case Domain (Case lifecycle, assignments, handovers)
         ↓
Weeks 8-9: Matching Domain (Scoring, recommendations, decisions)
         ↓
Weeks 10-11: Delivery Domain (Sessions, hours, contacts)
         ↓
Week 12: UI Integration (Professional portal, Admin portal)
         ↓
Week 13: Testing & Hardening (Validation, security, GDPR, go-live prep)
```

### Key Success Factors

1. **Lock Architecture First** — Resolve all 26 gaps before Phase 1
2. **Test As You Build** — Integration tests for each phase
3. **Permission Foundation** — Get auth/permissions right early (Phase 0)
4. **Phase Gates** — Don't proceed to next phase until gate met
5. **Documentation** — Keep docs current (not catch-up later)
6. **GDPR by Design** — Implement compliance from day one
7. **Rollback Ready** — Test rollback at each phase

### Risk Mitigation

- Architecture locked before coding
- Phase gates prevent moving forward with broken foundations
- Comprehensive testing at each phase
- Rollback plan ready for each phase
- GDPR compliance baked in (not bolted on)

### Timeline

- **13 weeks** from Week 1 (Foundation) to Week 13 (Launch)
- **4 weeks pre-work** needed to resolve architecture gaps
- **Total project duration:** ~17 weeks (gap resolution + build + test)

---

**Document Status:** DRAFT (awaiting technical approval)  
**Next Step:** Technical Specification (can now proceed with confidence)  
**Approval Required By:** Engineering Lead, CTO

---

**This Implementation Strategy is the roadmap from Architecture to Production. Follow this sequencing to minimize risk and rework.**
