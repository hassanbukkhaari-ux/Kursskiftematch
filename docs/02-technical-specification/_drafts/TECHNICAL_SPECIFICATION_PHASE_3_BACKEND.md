# Technical Specification: Kurskifte-Match 2.0
## Phase 3: Backend Specification

**Document Type:** Technical Specification (Implementation Blueprint)  
**Version:** 1.0 (Based on Architecture v1.0)  
**Audience:** Backend developers, architects  
**Date:** June 27, 2026  
**Status:** APPROVED FOR IMPLEMENTATION  

**Reference:** PERMISSION_MODEL.md, all domain specifications

---

## PART 3: BACKEND SPECIFICATION

## 3.1 ARCHITECTURE OVERVIEW

**Framework:** Next.js 15 (backend via API Routes)  
**Database Client:** Supabase JavaScript client or direct PostgreSQL  
**Business Logic:** Domain services (one per domain)  
**Event Publishing:** Audit event logging (built-in, not external)  
**Transaction Control:** Database-level + application validation  

**Rationale:** Source: MASTER_DIRECTIVE.md (Technology Stack)

---

## 3.2 DOMAIN SERVICES

Six domain services correspond to the six frozen domains.

### 3.2.1 Professional Service

**File:** `services/professionalService.ts`  
**Responsibilities:** Manage professional lifecycle (onboard → activate → archive)

**Methods:**

```typescript
class ProfessionalService {
  // Create professional (admin)
  async createProfessional(input: CreateProfessionalInput): Promise<Professional>
    - Validate input
    - Create profile in auth.users
    - Create professionals record
    - Log audit event: PROFESSIONAL_RECRUITED
    - Return professional with status = REGISTERED

  // Approve professional (admin) - WF-001
  async approveProfessional(professionalId: string): Promise<Professional>
    - Check all documents are VERIFIED
    - If not: throw error "All documents must be verified"
    - Update status REGISTERED → ACTIVE
    - Log audit event: PROFESSIONAL_APPROVED
    - Return updated professional

  // Update professional (professional or admin)
  async updateProfessional(id: string, updates: Partial<Professional>): Promise<Professional>
    - Professional can update: availability_days, availability_status
    - Admin can update: all fields
    - Check permission (RLS will enforce)
    - Log audit event: PROFESSIONAL_UPDATED

  // Upload document (professional or admin)
  async uploadDocument(professionalId: string, file: File, docType: string): Promise<ProfessionalDocument>
    - Hash file (SHA-256)
    - Store to file system (path: /documents/{professionalId}/{docType}_{timestamp})
    - Create ProfessionalDocument record with status = UNVERIFIED
    - Log audit event: DOCUMENT_UPLOADED
    - Return document

  // Verify document (compliance officer - admin role)
  async verifyDocument(docId: string, verified: boolean, expiry?: Date): Promise<ProfessionalDocument>
    - Update document status to VERIFIED or UNVERIFIED
    - Set verified_by, verified_at
    - Set expiry_date if provided
    - Log audit event: DOCUMENT_VERIFIED or DOCUMENT_FAILED
    - Return document

  // Get professional (for self or admin)
  async getProfessional(id: string, requesterId: string): Promise<Professional>
    - Check permission: requesterId = id OR requesterId.role = admin
    - Query professionals + documents + current assignments
    - Return full professional object
}
```

**Exports:** Public static interface, instantiated in API handlers

---

### 3.2.2 Case Service

**File:** `services/caseService.ts`  
**Responsibilities:** Manage case lifecycle (create → assign → close → archive)

**Methods:**

```typescript
class CaseService {
  // Create case from inquiry - WF-002
  async createCase(input: CreateCaseInput): Promise<Case>
    - Input: municipality_id, citizen_initials, age_range, complexity_factors, hours
    - Validate: citizen_initials 2 chars, age_range in enum, hours > 0
    - Calculate complexity_level from factors (per MATCHING_AND_COMPLEXITY_RULES.md)
    - Create Case record with status = OPEN
    - Create CaseComplexityFactors linked record
    - Set data_retention_expires_at = NULL (set when archived)
    - Log audit event: CASE_CREATED
    - Return case

  // Get case with details
  async getCase(caseId: string, requesterId: string): Promise<CaseWithDetails>
    - Check permission: admin OR assigned professional
    - Query: case + municipality + current assignment + grant + sessions
    - Calculate derived: remaining_hours, is_over_grant
    - Return full case object

  // Update complexity assessment
  async updateComplexity(caseId: string, factors: CaseComplexityFactors): Promise<Case>
    - Validate factors (at least one must be true)
    - Calculate new complexity_level
    - Update CaseComplexityFactors record
    - Update cases.complexity_level
    - Log audit event: CASE_COMPLEXITY_UPDATED
    - Return updated case

  // Add/amend grant
  async addGrant(caseId: string, input: AddGrantInput): Promise<CaseGrant>
    - Validate: granted_hours > 0, period_end > period_start
    - Create CaseGrant record with status = PENDING
    - Log audit event: GRANT_CREATED
    - Return grant

  // Close case (ACTIVE → COMPLETED → ARCHIVED)
  async closeCase(caseId: string, reason: string): Promise<Case>
    - Check case.status = ACTIVE
    - Update status to COMPLETED
    - Update archived_at = NOW
    - Calculate data_retention_expires_at = NOW + 7 years
    - Log audit event: CASE_CLOSED
    - Trigger background task to monitor for deletion (WF-013)
    - Return updated case

  // List cases (admin)
  async listCases(filters: CaseFilters, pagination: Pagination): Promise<PaginatedResult<Case>>
    - Filters: status, municipality, complexity
    - Return paginated case list with counts
}
```

---

### 3.2.3 Delivery Service

**File:** `services/deliveryService.ts`  
**Responsibilities:** Manage session logs, hours, contact logs

**Methods:**

```typescript
class DeliveryService {
  // Create session log - from WF-003 (professional starts documentation)
  async createSessionLog(input: CreateSessionLogInput): Promise<SessionLog>
    - Validate: case assigned to professional, session_date <= TODAY
    - Encrypt sensitive fields: observations, safeguarding_detail, participant_names, location
    - Create SessionLog record with status = DRAFT
    - Log audit event: SESSION_LOG_CREATED
    - Return session (encrypted fields not returned to API, decrypted in service)

  // Update session (DRAFT only)
  async updateSessionLog(sessionId: string, updates: Partial<SessionLog>): Promise<SessionLog>
    - Check status = DRAFT
    - Encrypt updated fields
    - Update record
    - Log audit event: SESSION_LOG_UPDATED
    - Return updated session

  // Finalize session (DRAFT → FINAL) - WF-003
  async finalizeSessionLog(sessionId: string): Promise<SessionLog>
    - Check status = DRAFT
    - Update status = FINAL
    - Prevent future edits (next update will fail)
    - Log audit event: SESSION_LOG_FINALIZED
    - Return session

  // Correct finalized session - WF-003
  async correctSessionLog(sessionId: string, correction: CorrectionInput): Promise<SessionLogCorrection>
    - Check status = FINAL
    - Create SessionLogCorrection record (immutable, describes change)
    - Do NOT update SessionLog
    - Update SessionLog.status = CORRECTED
    - Log audit event: SESSION_LOG_CORRECTED
    - Return correction record

  // Register hours - WF-006
  async registerHours(input: RegisterHoursInput): Promise<RegisteredHours>
    - Input: case_id, work_date, work_type, hours, [session_log_id], description
    - Validate: hours in [0.25, 8.0], work_date <= TODAY
    - Create RegisteredHours with status = PENDING
    - Log audit event: HOURS_REGISTERED
    - Return hours

  // Submit hours for approval - WF-006
  async submitHours(hoursId: string): Promise<RegisteredHours>
    - Check status = PENDING
    - Auto-check grant remaining:
      - approved_hours + this.hours > grant.granted_hours?
      - If YES: status = OUTSIDE_GRANT (triggers WF-007 review)
      - If NO: status = SUBMITTED (ready for approval)
    - Log audit event: HOURS_SUBMITTED
    - Return hours

  // Approve hours - WF-006 (admin only)
  async approveHours(hoursId: string, adminId: string): Promise<RegisteredHours>
    - Check status = SUBMITTED or OUTSIDE_GRANT
    - Update status = APPROVED
    - Recalculate grant.remaining_hours
    - Log audit event: HOURS_APPROVED
    - Return hours

  // Reject hours - WF-006 (admin only)
  async rejectHours(hoursId: string, reason: string): Promise<RegisteredHours>
    - Check status = SUBMITTED or OUTSIDE_GRANT
    - Update status = REJECTED
    - Log audit event: HOURS_REJECTED
    - Return hours

  // Review outside grant - WF-007
  async reviewOutsideGrant(hoursId: string, decision: 'APPROVE'|'REJECT', note: string): Promise<RegisteredHours>
    - Check status = OUTSIDE_GRANT
    - If APPROVE: status = APPROVED
    - If REJECT: status = REJECTED
    - Log audit event: HOURS_OUTSIDE_GRANT_REVIEWED
    - Return hours

  // Log contact with sagsbehandler
  async logContact(input: ContactLogInput): Promise<ContactLog>
    - Input: case_id, contact_type, logged_at, note, outcome
    - Encrypt: note, outcome
    - Create ContactLog record
    - Log audit event: CONTACT_LOGGED
    - Return contact

  // Get sessions for case
  async getSessionLogs(caseId: string): Promise<SessionLog[]>
    - Check permission: admin or assigned professional
    - Query all sessions for case
    - Decrypt sensitive fields in response
    - Return array
}
```

---

### 3.2.4 Matching Service

**File:** `services/matchingService.ts`  
**Responsibilities:** Scoring and ranking (WF-003)

**Methods:**

```typescript
class MatchingService {
  // Trigger match run
  async triggerMatchRun(caseId: string, triggeredBy: string): Promise<MatchRun>
    - Check case.status = OPEN
    - Create MatchRun with status = INITIATED
    - Queue background task: scoreMatchRun(matchRunId)
    - Log audit event: MATCH_RUN_TRIGGERED
    - Return match run

  // Score match run (background task)
  async scoreMatchRun(matchRunId: string): Promise<MatchRun>
    - Fetch case + complexity factors
    - Fetch eligible professionals (status = ACTIVE, capacity available, complexity ceiling)
    - For each professional: calculateScores()
    - Sort by overall_score DESC
    - Create MatchCandidate records for each
    - Update MatchRun.status = SCORED
    - Log audit event: CANDIDATES_SCORED
    - Return match run

  // Calculate scores for one professional - implements MATCHING_AND_COMPLEXITY_RULES.md
  private async calculateScores(case: Case, professional: Professional): Promise<MatchCandidates> {
    
    // Qualifications Score
    qualifications_score = calculateQualificationsScore({
      experience_years: professional.experience_years,
      profession_match: isProfessionMatch(case, professional),
      certifications: hasRelevantCertifications(professional)
    })
    // Formula from MATCHING_AND_COMPLEXITY_RULES.md:
    // base = 50
    // + (experience_years × 2) [0-50 max]
    // + (profession_match × 25) [yes=25, no=0]
    // + (certifications × 25) [yes=25, no=0]
    // = 0-100

    // Availability Score
    availability_score = calculateAvailabilityScore({
      capacity_available: professional.capacity_hours_week,
      required_hours: case.weekly_hours,
      current_load: countHoursFromActiveAssignments(professional),
      max_concurrent: professional.max_concurrent_cases
    })
    // Formula:
    // capacity_available = remaining_hours_this_week / required_hours
    // capacity_score = (capacity_available × 100) [capped at 100]
    // concurrent_load = current_assignments / max_concurrent
    // load_penalty = (concurrent_load × 20) [0-20]
    // score = capacity_score - load_penalty [0-100]

    // Capacity Score
    capacity_score = calculateCapacityScore({
      professional_max_complexity: professional.max_complexity_level,
      case_complexity: case.complexity_level
    })
    // Formula:
    // if case_complexity > professional_max_complexity: score = 0
    // if case_complexity = professional_max_complexity: score = 50
    // else: score = 50 + ((delta × 25)) [capped at 100]

    // Complexity Fit Score
    complexity_fit_score = calculateComplexityFitScore({
      age_match: caseAgeInRanges(case.citizen_age_range, professional.target_age_groups),
      experience_at_complexity: yearsAtComplexityLevel(professional, case.complexity_level),
      special_skills: matchFactorsToSkills(case.complexity_factors, professional)
    })
    // Formula:
    // age_match = 50 if match, 0 if not
    // complexity_exp = experience_at_complexity × 5 [0-50 max]
    // special_skills = 25 if has skills for violence/substance/etc, 0 if not
    // score = age_match + complexity_exp + special_skills [0-100]

    // Overall Score
    overall_score = (
      qualifications_score × 0.25 +
      availability_score × 0.25 +
      capacity_score × 0.25 +
      complexity_fit_score × 0.25
    )

    return {
      professional_id: professional.id,
      qualifications_score,
      availability_score,
      capacity_score,
      complexity_fit_score,
      overall_score,
      algorithm_version: "1.0"
    }
  }

  // Get match run with candidates
  async getMatchRun(matchRunId: string): Promise<MatchRunWithCandidates>
    - Check permission: admin only
    - Fetch MatchRun + all MatchCandidates sorted by rank
    - For each candidate: generateExplanation()
    - Return with explanations (but NOT detailed scores)

  // Generate explanation for candidate (human-readable, opaque scores)
  private generateExplanation(candidate: MatchCandidate, professional: Professional): string
    - Example: "Excellent qualifications (8 years pedagogue experience) + available capacity (5.5 of 4.5 hours/week) + strong fit for school-based cases"
    - Do NOT include: "qualifications_score=90, availability_score=100"
    - Goal: Professional knows WHY recommended, not raw algorithm

  // Assign professional to case - WF-003 (human decision)
  async assignProfessional(matchRunId: string, professionalId: string, reason?: string): Promise<CaseAssignment>
    - Fetch match run + get rank of selected professional
    - Create CaseAssignment (case_id, professional_id, started_at=NOW)
    - Update MatchRun.status = ASSIGNED or OVERRIDDEN (if rank > 1)
    - Update Case.status = MATCHED
    - Log audit event: HUMAN_DECISION_RECORDED
    - Log audit event: HUMAN_DECISION_OVERRIDE (if rank > 1, with reason)
    - Return assignment
}
```

---

### 3.2.5 Case Assignment Service

**File:** `services/caseAssignmentService.ts`  
**Responsibilities:** Manage professional assignments (temporal model - WF-008)

**Methods:**

```typescript
class CaseAssignmentService {
  // Get current assignment for case
  async getCurrentAssignment(caseId: string): Promise<CaseAssignment | null>
    - Query: SELECT * FROM case_assignments WHERE case_id = X AND ended_at IS NULL
    - Return null if none

  // Get assignment history for case
  async getAssignmentHistory(caseId: string): Promise<CaseAssignment[]>
    - Query all assignments (including ended)
    - Return ordered by started_at DESC

  // Handover: end current assignment and start new - WF-008
  async startHandover(caseId: string, incomingProfessionalId?: string, reason: string): Promise<CaseHandover>
    - Create CaseHandover record with status = INITIATED
    - Log audit event: HANDOVER_INITIATED
    - Return handover

  // Transfer session logs during handover
  async transferSessionLogs(handoverId: string, sessionLogIds: string[]): Promise<SessionLogTransfer[]>
    - For each session_log_id:
      - Create SessionLogTransfer record (from_professional_id, to_professional_id)
      - Grant visibility to incoming professional
    - Log audit event: SESSION_LOG_TRANSFERRED
    - Return transfers

  // Complete handover
  async completeHandover(handoverId: string): Promise<CaseAssignment>
    - Fetch CaseHandover
    - End current assignment: UPDATE case_assignments SET ended_at = NOW WHERE case_id = X AND ended_at IS NULL
    - If incoming_professional_id:
      - Create new assignment: INSERT INTO case_assignments (case_id, professional_id, started_at, assigned_by)
    - Update CaseHandover.status = COMPLETED
    - Log audit event: HANDOVER_COMPLETED
    - Return new assignment (or null if terminating)
}
```

---

### 3.2.6 Governance Service

**File:** `services/governanceService.ts`  
**Responsibilities:** Audit logging, GDPR deletion, permissions

**Methods:**

```typescript
class GovernanceService {
  // Log audit event (called by other services)
  async logAuditEvent(input: AuditEventInput): Promise<AuditEvent>
    - Input: event_type, actor_id, resource_type, resource_id, metadata
    - Validate metadata per event_type schema
    - Ensure no sensitive data in metadata (privacy-safe)
    - Create AuditEvent record (insert-only, immutable)
    - Return event

  // Query audit trail
  async getAuditEvents(filters: AuditFilters): Promise<AuditEvent[]>
    - Filters: event_type, actor_id, resource_type, from_date, to_date
    - Apply pagination
    - Return events (metadata safe to read)

  // Schedule deletion for expired records - WF-013 (background job)
  async scheduleExpiredDeletions(): Promise<void>
    - Find all archived records where data_retention_expires_at < NOW
    - Create DeletionSchedule entries for each
    - Log audit event: DATA_DELETION_SCHEDULED

  // Execute scheduled deletions - WF-013 (background job, nightly)
  async executeDeletions(): Promise<void>
    - Find DeletionSchedule where scheduled_for_deletion_at < NOW AND executed_at IS NULL
    - For each:
      - READ record completely (for audit)
      - Update record.status = DELETED (soft delete)
      - Update deletion_schedule.executed_at = NOW
      - Log audit event: DATA_DELETED
    - Do NOT hard delete

  // Handle right-to-be-forgotten request
  async processDataSubjectDeletion(userId: string): Promise<void>
    - Flag all user's records for deletion (after 30-day delay)
    - Create DeletionSchedule entries with scheduled_for_deletion_at = NOW + 30 days
    - Log audit event: DATA_SUBJECT_DELETION_REQUESTED
    - (Actual deletion happens via executeDeletions after 30-day window)

  // Disclose sagsbehandler contact - WF-009
  async discloseContact(input: DisclosureInput): Promise<ContactDisclosure>
    - Input: case_id, professional_id, contact_method, sagsbehandler contact snapshot
    - Create ContactDisclosure (immutable record)
    - Log audit event: CONTACT_DISCLOSED
    - Return disclosure
    - (Professional notified via email if contact_method=EMAIL)
}
```

---

## 3.3 TRANSACTION BOUNDARIES

### Atomic Operations (Database Level)

**Auto-Atomic (single INSERT/UPDATE/DELETE):**
- Create professional
- Create case
- Register hours
- Approve hours (single UPDATE)

**Multi-Statement Transactions (Supabase transactions):**

**Transaction 1: Create Case + Assessment**
```sql
BEGIN;
  INSERT INTO cases (municipality_id, ...);
  INSERT INTO case_complexity_factors (case_id, ...);
COMMIT;
```

**Transaction 2: Approve Professional (WF-001)**
```sql
BEGIN;
  UPDATE professionals SET status = 'ACTIVE' WHERE id = X;
  INSERT INTO audit_events (event_type, ...);
COMMIT;
```

**Transaction 3: Submit + Auto-Grant-Check Hours (WF-006)**
```sql
BEGIN;
  UPDATE registered_hours SET status = 'SUBMITTED' WHERE id = X;
  -- Check if over grant (application logic determines next status)
  -- If over: UPDATE registered_hours SET status = 'OUTSIDE_GRANT'
  -- If within: status = 'SUBMITTED'
  INSERT INTO audit_events (event_type, ...);
COMMIT;
```

**Transaction 4: Complete Handover (WF-008)**
```sql
BEGIN;
  UPDATE case_assignments SET ended_at = NOW() WHERE case_id = X AND ended_at IS NULL;
  INSERT INTO case_assignments (case_id, professional_id, ...) VALUES (...);
  INSERT INTO audit_events (event_type, ...);
COMMIT;
```

---

## 3.4 BUSINESS RULE ENFORCEMENT

Rules enforced at three levels (defense-in-depth):

### Database Level (PostgreSQL Constraints)
- Check constraints (status enums, ranges)
- Foreign keys (referential integrity)
- NOT NULL constraints
- Unique constraints (one active assignment per case)

### Application Level (TypeScript Services)
- Validate business rules before database operations
- Check state transitions (e.g., PENDING → SUBMITTED, not SUBMITTED → PENDING)
- Enforce permissions (though RLS is final check)
- Prevent double-processing (idempotent operations where possible)

### RLS Level (Supabase Policies)
- Final authorization check
- Row-level filtering
- Prevents admin from bypassing application logic

**Example: Submit Hours (WF-006)**
```typescript
// Application validates business rule
if (registeredHours.status !== 'PENDING') {
  throw new BadRequestError('Can only submit PENDING hours');
}

// Check grant remaining
const grant = await getActiveGrant(caseId);
const approved = await getSumApprovedHours(caseId, grant.id);
if (approved + registeredHours.hours > grant.granted_hours) {
  newStatus = 'OUTSIDE_GRANT';
} else {
  newStatus = 'SUBMITTED';
}

// Database enforces state with CHECK constraint
// RLS ensures only own or admin can update
```

---

## 3.5 ERROR HANDLING

**Philosophy:** Fail fast with clear errors, log to audit trail

**Hierarchy:**
1. Validation error → 422 with details
2. Permission error → 403 (RLS denies)
3. Business rule violation → 409 Conflict
4. Resource not found → 404
5. Unhandled error → 500 + alert

**Example: Try-Catch Pattern**

```typescript
async function approveProfessional(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { professionalId } = req.body;
    
    // 1. Validate input
    if (!professionalId || !isValidUUID(professionalId)) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT' } });
    }
    
    // 2. Check permission (RLS will also enforce)
    if (req.auth.role !== 'admin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    }
    
    // 3. Call service (throws on business rule violation)
    const professional = await professionalService.approveProfessional(professionalId);
    
    // 4. Return success
    return res.status(200).json(professional);
    
  } catch (error) {
    // 5. Handle service errors
    if (error instanceof ValidationError) {
      return res.status(422).json({ error: error.toJSON() });
    }
    if (error instanceof BusinessRuleViolation) {
      return res.status(409).json({ error: error.toJSON() });
    }
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.toJSON() });
    }
    
    // 6. Log unexpected error + alert
    logger.error('Unexpected error in approveProfessional', error);
    monitoring.alert('approveProfessional failed', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR' } });
  }
}
```

---

## 3.6 BACKGROUND JOBS

**Tool:** Node.js scheduler (e.g., node-schedule or Bull)  
**Frequency:** Nightly (00:05 UTC)

### Job 1: Score Pending Match Runs
```
Trigger: Nightly (if any match_runs with status = INITIATED)
Action: scoreMatchRun() for each
Time: 5 minutes (async)
```

### Job 2: Schedule Expired Deletions
```
Trigger: Nightly (00:05 UTC)
Action: Find archived records with data_retention_expires_at < NOW
        Create DeletionSchedule entries
Time: 5 minutes
```

### Job 3: Execute Scheduled Deletions
```
Trigger: Nightly (00:10 UTC)
Action: Soft-delete records where scheduled_for_deletion_at < NOW
        Log audit events
Time: 5 minutes (concurrent limit)
```

---

## 3.7 LOGGING STRATEGY

**Logger:** Built-in Node.js logger + structured JSON logs

**Log Levels:**
- ERROR: Service-level failures (database down, validation error)
- WARN: Business rule violations (outside grant, rejected hours)
- INFO: Operations (case created, professional approved)
- DEBUG: Data transformations (score calculations)

**Structured Logging Example:**
```json
{
  "timestamp": "2026-06-27T14:30:00Z",
  "level": "INFO",
  "service": "professionalService",
  "method": "approveProfessional",
  "actor_id": "admin-uuid",
  "resource_type": "professional",
  "resource_id": "prof-uuid",
  "result": "SUCCESS",
  "duration_ms": 245
}
```

---

## 3.8 IDEMPOTENCY

**Strategy:** Operations should be idempotent where possible (safe to retry)

**Idempotent Operations:**
- GET requests (always safe)
- POST to create with unique constraint (fails on retry, idempotent in effect)
- PATCH to set status (if already set, no change)

**Non-Idempotent (requires deduplication):**
- Submit hours: Could create duplicates if retried
  - Solution: Timestamp-based deduplication or UUID-based idempotency key
- Approve professional: Could double-log if retried
  - Solution: Check status before updating

**Idempotency Key Header (Recommendation for Phase 2):**
```
Idempotency-Key: client-generated-uuid
Backend stores (request_id, resource_id, response) for retry safety
```

---

## 3.9 CACHING STRATEGY

**Minimal for MVP** (data changes frequently)

**Cache Candidates:**
- Professional list (static for 1 hour)
- Municipality list (static for 1 day)
- Match run candidates (immutable, cache indefinitely)

**Cache Layer:** Redis (future) or in-memory (MVP)

**Invalidation:**
- Professional updated → clear professional list cache
- Match run created → no cache needed (result not repeated)

---

**End of Part 3: Backend Specification**

**Next:** Part 4 — Frontend Specification (routes, screens, state management)

---

This Backend Specification is complete and implementation-ready.

Every service, method, transaction, and error is defined.

**Status:** Ready for Part 4 (Frontend Specification)
