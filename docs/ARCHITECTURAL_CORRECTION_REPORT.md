# Kursskifte-Match MVP Feature Inventory

**Document:** Feature Checklist (Business Functionality)  
**Date:** June 27, 2026  
**Scope:** MVP - What the system must do functionally  
**Organization:** By Six Domains (from Architecture v1.0)

---

## PURPOSE

This is a **functional inventory**, not architecture or technical specification. It connects the frozen business architecture to upcoming technical specifications (API, Backend, Frontend).

Each feature includes:
- Feature name
- Short description
- Primary user (coordinator, professional, admin, system)
- Related workflow
- Related entities
- MVP status
- Notes

---

# DOMAIN 1: PROFESSIONAL

All features related to managing professionals (support staff).

---

## F1.1: Professional Onboarding

**Description:** Register new professional (sociopedagog/mentor) in system  
**Primary User:** Admin / HR coordinator  
**Related Workflow:** WF-001 Professional Onboarding  
**Related Entities:** professionals, professional_documents, profiles, auth.users  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Create auth.users account
- Create professional profile record
- Capture professional type (sociopedagog, mentor, etc.)
- Initial status: REGISTERED
- Email verification required

---

## F1.2: Professional Profile Management

**Description:** View and edit professional profile information  
**Primary User:** Admin, Professional (own profile)  
**Related Entities:** professionals, profiles  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Professional can view own profile (read-only or editable per role)
- Admin can edit all fields
- Status transitions: REGISTERED → ACTIVE → INACTIVE → ARCHIVED

---

## F1.3: Professional Match Attributes - Demographics

**Description:** Store and manage professional demographic preferences  
**Primary User:** Admin, Professional  
**Related Entities:** professionals (extended via attributes)  
**MVP Status:** ✅ REQUIRED  

**Attributes Tracked:**
- **gender:** M, F, Other, Not specified (for matching with citizen preferences)
- **availability:** Full-time, Part-time, Ad-hoc, Specific days/hours
- **working_hours:** Preferred days and hours (JSON: [{"day": "MON", "start": "09:00", "end": "17:00"}])
- **capacity:** How many concurrent cases (e.g., "up to 5 cases")

**Notes:**
- Used for matching algorithm
- Professional may have preferences they don't want advertised (private attributes)
- MVP: Simple storage; filtering in matching phase

---

## F1.4: Professional Match Attributes - Geography & Transport

**Description:** Store geographic availability and transport capabilities  
**Primary User:** Admin, Professional  
**Related Entities:** professionals (extended via attributes)  
**MVP Status:** ✅ REQUIRED  

**Attributes Tracked:**
- **geography:** City/region(s) where professional works (can be multiple)
- **driving_licence:** Yes/No (legal requirement for some roles)
- **access_to_car:** Yes/No
- **transport_radius:** Maximum km willing to travel (e.g., 25 km from base)

**Notes:**
- Critical for matching professionals to case locations
- Used to filter candidates geographically
- Driving license may be mandatory for certain case types (not MVP - flag for future)

---

## F1.5: Professional Match Attributes - Qualifications

**Description:** Store professional experience, competencies, certifications  
**Primary User:** Admin, Professional  
**Related Entities:** professionals (extended via attributes)  
**MVP Status:** ✅ REQUIRED  

**Attributes Tracked:**
- **experience:** Years in field (numeric)
- **competencies:** Text tags/array (e.g., "Trauma-informed", "Substance abuse support", "Neurodivergent support")
- **certifications:** Array of certs (e.g., "CPR certified", "Mental health first aid")
- **languages:** Languages spoken (array, e.g., ["Danish", "Arabic", "Polish"])
- **preferred_target_groups:** Types of citizens they prefer (e.g., "Adolescents", "Adults with addiction")

**Notes:**
- Matching algorithm filters by required competencies
- Certifications may become mandatory per municipality (MVP: optional flags)
- Language critical for citizen with non-Danish primary language

---

## F1.6: Professional Document Upload & Verification

**Description:** Professionals upload documents (CV, certifications, credentials); admin verifies  
**Primary User:** Professional (upload), Admin (verify)  
**Related Workflow:** WF-001 Professional Onboarding  
**Related Entities:** professional_documents  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Professional uploads documents
- Admin reviews and marks VERIFIED
- PENDING → VERIFIED → EXPIRED → ARCHIVED workflow
- Expiration dates tracked
- Used in matching: Only verified professionals shown to municipalities

---

## F1.7: Professional Status Management

**Description:** Transition professional between statuses (REGISTERED → ACTIVE → INACTIVE → ARCHIVED)  
**Primary User:** Admin, HR coordinator  
**Related Entities:** professionals  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- REGISTERED: Just onboarded, not yet active
- ACTIVE: Available for case assignment
- INACTIVE: Temporarily unavailable (leave, sick, etc.)
- ARCHIVED: Former employee, no longer available
- Inactive/Archived professionals not shown in matching

---

## F1.8: Professional Availability Toggle

**Description:** Professional marks themselves available/unavailable for new cases  
**Primary User:** Professional  
**Related Entities:** professionals.status (or availability flag)  
**MVP Status:** 🔄 DEFERRED  
**Rationale:** MVP can manage via status (ACTIVE/INACTIVE). Dynamic availability toggle deferred to Phase 2 (more complex).

---

## F1.9: Professional Exit & Archival

**Description:** Admin archives professional (they leave organization)  
**Primary User:** Admin  
**Related Entities:** professionals, case_assignments, session_logs  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Set status to ARCHIVED
- Existing cases transition via handover process (F4.8)
- No new assignments possible for archived professional
- Historical data (session logs, hours) retained 7 years per GDPR

---

## F1.10: Professional List & Search

**Description:** Admin can view, filter, search professionals  
**Primary User:** Admin, HR coordinator  
**Related Entities:** professionals  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Filter by: status, competencies, geography, capacity
- Search by: name, email, phone
- View full profile and document status

---

# DOMAIN 2: MUNICIPALITY

All features related to managing municipalities and their grants.

---

## F2.1: Municipality Reference Data

**Description:** System maintains list of Nordjylland municipalities  
**Primary User:** System / Admin  
**Related Entities:** municipalities  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- 11 municipalities in Nordjylland (reference data)
- Read-only in MVP
- Used to filter cases and professionals by geography

---

## F2.2: Municipal Grant Period Definition

**Description:** Admin/Municipality coordinator defines grant periods (budget allocation)  
**Primary User:** Admin, Municipality coordinator  
**Related Workflow:** Budget allocation occurs outside system (external process)  
**Related Entities:** case_grants  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Grant period: Date range + allocated hours (e.g., 2024-01-01 to 2024-03-31, 40 hours)
- Multiple grants per case possible (different funding sources)
- Grants tracked per case_id + municipality_id
- Status: PENDING → ACTIVE → ARCHIVED

---

## F2.3: Municipal Grant Hour Tracking

**Description:** System tracks hours used against grant allocation  
**Primary User:** System (automatic), Admin (monitoring)  
**Related Entities:** case_grants, registered_hours  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Auto-calculate: hours_approved_total vs granted_hours
- Alert when approaching limit (e.g., 90% used)
- If hours exceed grant → flag as OUTSIDE_GRANT (F4.7)

---

## F2.4: Outside Grant Hour Review

**Description:** When professional registers hours outside grant, municipality approves/rejects  
**Primary User:** Municipality coordinator  
**Related Workflow:** WF-007 Outside Grant Review  
**Related Entities:** registered_hours  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Hours beyond granted amount require review
- Municipality coordinator approves (add to budget) or rejects
- Coordination email/portal notification sent

---

## F2.5: Municipality Coordinator Contact

**Description:** System maintains contact list for municipality coordinators  
**Primary User:** System, Admin  
**Related Entities:** Could be stored in profiles or municipality metadata  
**MVP Status:** 🔄 DEFERRED  
**Rationale:** MVP: Coordinators manage their own communication. Address book deferred to Phase 2.

---

## F2.6: Grant Budget Reporting

**Description:** Admin/Municipality can view grant usage reports  
**Primary User:** Admin, Municipality coordinator  
**Related Entities:** case_grants, registered_hours  
**MVP Status:** 🔄 DEFERRED  
**Rationale:** MVP focuses on operation. Reporting/analytics deferred to Phase 2. But admin can query DB directly if needed.

---

# DOMAIN 3: CASE

All features related to case management (citizen support allocation).

---

## F3.1: Case Creation

**Description:** Coordinator creates case (allocate citizen to support contact)  
**Primary User:** Municipality coordinator  
**Related Workflow:** WF-002 Case Creation (implicit; part of larger workflow)  
**Related Entities:** cases  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Coordinator creates case via coordinator portal or backend
- Required: municipality_id, citizen_info (encrypted), status (initially OPEN)
- Optional: complexity_level, citizen_notes, case metadata
- Status: OPEN → ACTIVE → ARCHIVED

---

## F3.2: Case Complexity Assessment

**Description:** Coordinator assesses case complexity (determines matching criteria)  
**Primary User:** Municipality coordinator, Admin  
**Related Workflow:** WF-002 Case Creation  
**Related Entities:** case_complexity_factors, cases  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Complexity levels: LOW, MEDIUM, HIGH (used in matching)
- Complexity factors documented (structured data)
- Assessment determines which professionals can take case (e.g., HIGH complexity requires 5+ years experience)

---

## F3.3: Case Match Requirements - Demographics & Language

**Description:** Coordinator specifies match requirements for gender, language, etc.  
**Primary User:** Municipality coordinator  
**Related Entities:** cases (extended via match_requirements)  
**MVP Status:** ✅ REQUIRED  

**Match Requirements Tracked:**
- **preferred_gender:** M, F, Other, No preference
- **language_requirement:** "Danish", "Arabic", "Polish", etc. (or NULL = Danish OK)
- **preferred_target_group_alignment:** Professional should have experience with this age/type

**Notes:**
- Citizen's own preferences (privacy-protected)
- If professional doesn't match gender/language, they're filtered out of matching
- Used by matching algorithm to rank candidates

---

## F3.4: Case Match Requirements - Geography & Transport

**Description:** Coordinator specifies case location and transport requirements  
**Primary User:** Municipality coordinator  
**Related Entities:** cases (extended via match_requirements)  
**MVP Status:** ✅ REQUIRED  

**Match Requirements Tracked:**
- **location:** City/postal code where citizen is located
- **transport_required:** Yes/No (citizen needs professional to provide transport)
- **accessibility_requirements:** Mobility-accessible? Wheelchair accessible?

**Notes:**
- Transport requirement filters professionals: only those with car/license qualify
- Location matches against professional's geography + transport_radius
- Used by matching algorithm

---

## F3.5: Case Match Requirements - Competencies & Experience

**Description:** Coordinator specifies required professional competencies/experience  
**Primary User:** Municipality coordinator  
**Related Entities:** cases (extended via match_requirements)  
**MVP Status:** ✅ REQUIRED  

**Match Requirements Tracked:**
- **required_competencies:** Array (e.g., ["Trauma-informed", "Neurodivergent support"])
- **min_experience_years:** Minimum years in field (e.g., 3)
- **required_certifications:** Array if any mandatory (e.g., "CPR certified")

**Notes:**
- Matching filters professionals by these criteria
- If no professionals match, coordinator is alerted
- MVP: Hard filters; Phase 2 could allow soft preferences

---

## F3.6: Case Match Requirements - Availability & Time Windows

**Description:** Coordinator specifies required availability/meeting times  
**Primary User:** Municipality coordinator  
**Related Entities:** cases (extended via match_requirements)  
**MVP Status:** ✅ REQUIRED  

**Match Requirements Tracked:**
- **required_availability:** "Weekday mornings", "Weekday afternoons", "Flexible", etc.
- **time_windows:** Structured slots (e.g., {"MON": ["09:00-12:00", "14:00-17:00"]})
- **preferred_frequency:** How often professional should visit (e.g., "2x per week")

**Notes:**
- Matching filters professionals whose availability aligns
- Professional's availability can be more flexible than citizen's requirement
- Used in matching algorithm

---

## F3.7: Case Special Constraints

**Description:** Coordinator documents special constraints from municipality/citizen  
**Primary User:** Municipality coordinator  
**Related Entities:** cases (extended via special_constraints or notes)  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Examples: "No male professionals", "Must speak Arabic", "Accessibility needs"
- Stored as structured requirements (F3.3-F3.6) or free-text notes
- Critical for matching: Professional must satisfy all REQUIRED constraints

---

## F3.8: Case Assignment (Kontaktperson Selection)

**Description:** Coordinator assigns a professional to case (or use matching to recommend)  
**Primary User:** Municipality coordinator  
**Related Workflow:** WF-003 Match Run & Assignment  
**Related Entities:** case_assignments, match_candidates  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Coordinator can manually select professional OR use matching recommendation
- Creates case_assignment record with status=ACTIVE
- Professional begins work documentation immediately
- Assignment tracked: started_at, ended_at (NULL = active)

---

## F3.9: Professional Handover (Case Reassignment)

**Description:** Transition case from one professional to another  
**Primary User:** Municipality coordinator, Admin  
**Related Workflow:** WF-008 Professional Handover  
**Related Entities:** case_assignments, case_handovers  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Previous assignment marked ended_at (TERMINATED status)
- New case_assignment created with new professional (ACTIVE status)
- case_handovers record created to document transition
- Can include handover notes, handover session

---

## F3.10: Case Archival

**Description:** Close/archive case when support period ends  
**Primary User:** Municipality coordinator, Admin  
**Related Entities:** cases  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Status transitions to ARCHIVED
- All related assignments end (ended_at set)
- Historical data (session logs, hours) retained 7 years
- No new sessions/hours can be logged after archive

---

## F3.11: Case List & Dashboard

**Description:** Coordinator views active cases and their status  
**Primary User:** Municipality coordinator, Admin  
**Related Entities:** cases, case_assignments  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Filter by: municipality, status, complexity, professional
- Sort by: created_at, urgency
- Show current professional, hours used, grant remaining
- Alert on outside-grant hours or approaching limits

---

# DOMAIN 4: DELIVERY

All features related to documenting and tracking work (sessions, hours, contacts).

---

## F4.1: Session Logging

**Description:** Professional documents work session with citizen  
**Primary User:** Professional  
**Related Workflow:** WF-002 Case Creation + ongoing  
**Related Entities:** session_logs  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Professional creates session_log entry after meeting
- Required fields: case_id, session_date, status (DRAFT)
- Optional fields: observations, citizen_mood_tone, location, participant names, follow-up notes
- Encrypted fields: observations, citizen_mood_tone, location, participant_names
- Write-once pattern: DRAFT → FINAL (then corrections via separate table)

---

## F4.2: Session Details - Safeguarding & Follow-Up

**Description:** Professional documents safeguarding concerns and follow-up needs  
**Primary User:** Professional  
**Related Entities:** session_logs  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- safeguarding_concern_flag: Boolean (alert coordinator if true)
- safeguarding_detail: Text (encrypted) describing concern
- follow_up_needed: Boolean
- follow_up_reason: Text describing next steps
- Alert triggered: If safeguarding flag = true, coordinator notified

---

## F4.3: Session Finalization

**Description:** Professional finalizes session and submits for approval  
**Primary User:** Professional  
**Related Entities:** session_logs  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Status DRAFT → FINAL
- Professional can edit only in DRAFT state
- Once FINAL, only corrections table allows changes
- Data retention clock starts (7-year retention from finalization)

---

## F4.4: Session Corrections

**Description:** Professional corrects a finalized session (audit trail maintained)  
**Primary User:** Professional, Admin  
**Related Workflow:** Implicit (correction process)  
**Related Entities:** session_log_corrections, session_logs  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Original session remains immutable (status = CORRECTED)
- Correction record created with delta/new values
- Audit trail shows original + correction
- Both records retained 7 years

---

## F4.5: Registered Hours (Work Time Entry)

**Description:** Professional registers hours worked (time tracking for billing)  
**Primary User:** Professional  
**Related Workflow:** WF-006 Registered Hours  
**Related Entities:** registered_hours  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Create registered_hours entry: work_date, work_type, hours, grant_period_id
- work_type: DIRECT_SESSION, TRANSPORT, DOCUMENTATION, COORDINATION, CRISIS_RESPONSE, TRAINING, OTHER
- hours: 0.25 to 8.0 (15 mins min, 8 hours max per day)
- Status: PENDING → APPROVED or REJECTED
- Session_log_id optional (link to DIRECT_SESSION)
- Encrypted field: description (what work was done)

---

## F4.6: Registered Hours - Outside Grant Processing

**Description:** If hours exceed grant, flag for municipality review  
**Primary User:** System (auto-flag), Municipality coordinator (review)  
**Related Workflow:** WF-007 Outside Grant Review  
**Related Entities:** registered_hours  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- System auto-calculates: total_approved_hours vs granted_hours
- If exceeds: status set to OUTSIDE_GRANT (requires special review)
- Municipality coordinator approves/rejects override
- Audit trail maintained for compliance

---

## F4.7: Hours Approval Workflow

**Description:** Admin/Municipality coordinator approves registered hours  
**Primary User:** Admin, Municipality coordinator  
**Related Entities:** registered_hours  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Professional submits hours (status = PENDING)
- Approver reviews and approves (APPROVED) or rejects (REJECTED)
- APPROVED hours count toward grant
- REJECTED hours don't count (go back to professional for correction)
- Audit trail: who approved, when, review notes

---

## F4.8: Contact Logging (Non-Session Communications)

**Description:** Professional logs contacts with citizen/family outside formal sessions  
**Primary User:** Professional  
**Related Entities:** contact_logs  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- contact_type: PHONE, EMAIL, IN_PERSON (brief), WRITTEN
- contact_date: Optional (when contact occurred)
- outcome: What was discussed/accomplished (encrypted)
- note: Additional notes (encrypted)
- Does not generate registered_hours (separate process)

---

## F4.9: Contact Disclosure Logging

**Description:** Professional documents sensitive disclosures/safeguarding from contacts  
**Primary User:** Professional  
**Related Entities:** contact_disclosures  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Linked to case (not necessarily a specific session)
- reason: Why this disclosure is important (encrypted)
- disclosure_type: "Abuse", "Neglect", "Risk", "Other"
- alert_coordinator: Boolean (alert municipality if true)
- Used for case risk tracking and coordination

---

## F4.10: Data Retention Management

**Description:** System tracks data retention dates and schedules deletion  
**Primary User:** System (automatic), Admin (monitoring)  
**Related Entities:** deletion_schedules, audit_events  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- GDPR: 7-year retention from case archive or deletion request
- deletion_schedules table tracks scheduled deletes
- Automatic purge on schedule (or admin-triggered)
- Audit logged before deletion

---

## F4.11: Session Log Transfer (Professional Change)

**Description:** When professional handover occurs, logs can transfer or stay with original  
**Primary User:** Admin  
**Related Entities:** session_log_transfers  
**MVP Status:** 🔄 DEFERRED  
**Rationale:** MVP: Logs stay with original professional. Transfer logic deferred to Phase 2 (complex audit implications).

---

# DOMAIN 5: GOVERNANCE

All features related to audit, compliance, and data integrity.

---

## F5.1: Audit Event Logging

**Description:** System logs all data modifications for compliance and troubleshooting  
**Primary User:** System (automatic), Admin (review)  
**Related Entities:** audit_events  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Every CREATE, UPDATE, DELETE logged
- Includes: actor_id, resource_type, resource_id, action, timestamp, changes (before/after)
- Immutable: Cannot be edited or deleted (RLS enforces)
- Retained forever (or per legal requirement)
- Used for GDPR compliance and debugging

---

## F5.2: Professional Document Verification Audit

**Description:** Audit trail for professional document verification  
**Primary User:** System (automatic), Admin (review)  
**Related Entities:** professional_documents, audit_events  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Logged when document status changes (PENDING → VERIFIED → EXPIRED)
- Includes: who verified, when, any notes
- Expiration tracked (certs expire after X days/months)

---

## F5.3: Session Approval Audit

**Description:** Audit trail for session finalization and corrections  
**Primary User:** System (automatic), Admin (review)  
**Related Entities:** session_logs, session_log_corrections, audit_events  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Logged when session status changes (DRAFT → FINAL → CORRECTED)
- Corrections audit shows original + new values
- Coordinator can see full history

---

## F5.4: Hours Approval Audit

**Description:** Audit trail for hours registration and approval  
**Primary User:** System (automatic), Admin (review)  
**Related Entities:** registered_hours, audit_events  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Logged when hours created, submitted, approved/rejected
- Outside-grant reviews audited
- Used for billing audits and grant reconciliation

---

## F5.5: Case Assignment Audit

**Description:** Audit trail for assignment changes  
**Primary User:** System (automatic), Admin (review)  
**Related Entities:** case_assignments, audit_events  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Logged when assignment created, transitioned, terminated
- Includes: original professional, new professional, reason
- Used for understanding case history

---

## F5.6: Data Retention & GDPR Right-to-Forget

**Description:** Manage data retention periods and process deletion requests  
**Primary User:** Admin, GDPR coordinator  
**Related Workflow:** WF-013 GDPR Retention & Deletion  
**Related Entities:** deletion_schedules, audit_events  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Default retention: 7 years from case archive
- Deletion requests logged in deletion_schedules
- System marks for deletion (scheduled)
- Admin reviews before purge
- Sensitive fields encrypted; deletion process documented

---

## F5.7: Access Control & Role-Based Permissions

**Description:** System enforces role-based access (RLS)  
**Primary User:** System (automatic), Admin (config)  
**Related Entities:** All (RLS policies per table)  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Professionals see only own cases/sessions/hours
- Coordinators see cases from their municipality
- Admins see all
- RLS policies in database enforce (no leakage via API)

---

## F5.8: Encryption & Key Management

**Description:** Sensitive fields encrypted at application level (XSalsa20-Poly1305)  
**Primary User:** System (automatic)  
**Related Entities:** All tables with sensitive data  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Encrypted fields: observations, citizen_mood_tone, location, participant_names, notes, descriptions, etc.
- Key management: Env var ENCRYPTION_KEY (rotate quarterly)
- Audit events not encrypted (searchable for compliance)

---

# DOMAIN 6: MATCHING

All features related to finding the right professional for a case.

---

## F6.1: Match Run Execution

**Description:** Coordinator triggers matching algorithm to find suitable professionals  
**Primary User:** Municipality coordinator  
**Related Workflow:** WF-003 Match Run & Assignment  
**Related Entities:** match_runs, match_candidates, professionals, cases  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Coordinator selects case and requests match
- System queries available professionals (ACTIVE, verified, not at capacity)
- Filters by case match_requirements (geography, competencies, language, etc.)
- Generates ranked list of candidates
- Creates match_run record with status=IN_PROGRESS

---

## F6.2: Match Candidate Generation

**Description:** Algorithm generates candidate list based on MVP matching model  
**Primary User:** System (automatic)  
**Related Entities:** match_candidates, case_complexity_factors  
**MVP Status:** ✅ REQUIRED  
**Source:** MATCHING_AND_COMPLEXITY_RULES.md (approved, locked)  

**MVP Matching Process:**

1. **Eligibility Filters (Must Pass All):**
   - Status = ACTIVE (not INACTIVE, ARCHIVED, REGISTERED)
   - All documents VERIFIED
   - max_complexity_level >= case complexity level
   - remaining_capacity >= case required hours
   - Not at max_concurrent_cases

2. **Scoring (See F6.3):**
   - Apply 4-component matching model
   - Calculate overall_score (0-100)
   - Filter out scores < 20

3. **Ranking:**
   - Sort by overall_score (descending)
   - Top 3-5 candidates presented

**MVP Matching Considers:**
- ✅ Experience & qualifications (matching formula)
- ✅ Availability & workload (matching formula)
- ✅ Complexity capability & margin (matching formula)
- ✅ Age/target group match (complexity fit score)
- ✅ Special skills for case factors (violence, substance, family, etc.)

**NOT in MVP (Phase 2+):**
- ❌ Geography/transport matching (listed as Phase 2 enhancement)
- ❌ Language matching (not in MVP scoring model)
- ❌ Citizen/municipality gender preferences (Phase 2)
- ❌ Professional specialization scoring (Phase 2)
- ❌ Machine learning improvements (Phase 2+)

---

## F6.3: Match Scoring & Ranking

**Description:** Matching algorithm scores and ranks candidates using MVP matching model  
**Primary User:** System (automatic)  
**Related Entities:** match_candidates, professionals  
**MVP Status:** ✅ REQUIRED  
**Source:** MATCHING_AND_COMPLEXITY_RULES.md (approved, locked)  

**MVP Matching Model - Four Equal-Weighted Score Components:**

Each component scored 0-100, equally weighted (0.25 each):

1. **Qualifications Score (0-100)**
   - Base: 50 points
   - Experience: + (experience_years × 2) [0-50 max]
   - Profession match: + 25 (yes/no)
   - Certifications: + 25 (yes/no)

2. **Availability Score (0-100)**
   - Capacity available: (remaining_hours_this_week / required_hours × 100) [capped at 100]
   - Concurrent load penalty: (current_concurrent_cases / max_concurrent_cases × 20) [0-20]
   - Score = capacity - load_penalty

3. **Capacity Score (0-100)**
   - Complexity margin: (professional.max_complexity_level - case.complexity_level)
   - If margin < 0: score = 0 (cannot handle)
   - If margin = 0: score = 50 (borderline)
   - If margin > 0: score = 50 + (complexity_margin × 25)

4. **Complexity Fit Score (0-100)**
   - Age match: + 50 (if citizen_age_range in professional's target_age_groups)
   - Complexity experience: + (years_at_case_complexity × 5) [0-50 max]
   - Special skills match: + 25 (violence, substance, family, education experience)

**Overall Score = Weighted Average:**
```
overall_score = (
  qualifications_score × 0.25 +
  availability_score × 0.25 +
  capacity_score × 0.25 +
  complexity_fit_score × 0.25
)
```

**Weighting Model (Versioned Algorithm):**
- MVP Algorithm Version 1.0: Equal weights (0.25 each) for all 4 components
- Versioning Requirement: Each algorithm change requires new version number (v1.0 → v1.1, v2.0, etc.)
- Immutability: Each algorithm version has FIXED weights - weights cannot be adjusted within a version
- Historical Integrity: Previous MatchRuns MUST always retain their original algorithm version and results
- Audit Trail: Every MatchRun stores algorithm_version (e.g., "v1.0") used for scoring
- Change Process: Weight changes only allowed via new algorithm version with explicit approval
- Forward Compatibility: New match runs use current algorithm version; old matches never recalculated

**Ranking by Score Range:**
- 80-100: Excellent fit → Rank 1
- 60-79: Good fit → Rank 2
- 40-59: Acceptable fit → Rank 3
- 20-39: Poor fit → Not recommended
- <20: Not suitable → Do not show

**Requirements:**
- Deterministic: Same inputs always produce same scores
- No randomization or time-based variation
- Algorithm version tracked for audit trail
- Top 3-5 candidates presented (ranked, not auto-assigned)

---

## F6.4: Match Recommendation to Coordinator

**Description:** Present ranked candidate list to coordinator for selection  
**Primary User:** Municipality coordinator  
**Related Entities:** match_candidates, match_runs  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Coordinator sees:
  - Top-ranked candidates
  - Why they match (detailed match explanation)
  - Scoring explanation for each candidate
  - Professional profiles (verified docs, competencies, availability)
- Coordinator can:
  - Select top candidate (auto-assign)
  - Select alternative candidate
  - Reject all and request new match run with different criteria
- Coordinator's choice logged in audit

---

## F6.5: Manual Professional Selection (No Matching)

**Description:** Coordinator can manually select professional without using match algorithm  
**Primary User:** Municipality coordinator  
**Related Entities:** professionals, case_assignments  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Alternative to automated matching
- Coordinator browsing professional list, selects based on own judgment
- Creates case_assignment directly (bypasses match_run)
- Both workflows (matching + manual) supported in MVP

---

## F6.6: Assignment from Match Result

**Description:** Coordinator accepts match result and creates case_assignment  
**Primary User:** Municipality coordinator  
**Related Entities:** match_candidates, case_assignments  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Coordinator selects candidate from match_run
- System creates case_assignment (professional_id, case_id, status=ACTIVE, started_at=NOW())
- match_run status = COMPLETED
- match_candidates marked as ACCEPTED/REJECTED (audit trail)
- Professional can now log sessions for this case

---

## F6.7: Match Run History & Audit

**Description:** Track all match runs for a case (can re-run if assignment fails)  
**Primary User:** Admin, Coordinator  
**Related Entities:** match_runs, match_candidates, audit_events  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Multiple match_runs possible per case (if first assignment doesn't work out)
- Full history of candidates and scores retained
- Used for understanding why certain professionals were/not recommended
- Audit trail: who ran match, when, which candidate selected

**Algorithm Versioning Requirement (CRITICAL):**
- Every MatchRun MUST store algorithm_version (e.g., "v1.0") used for scoring
- Historical MatchRuns MUST NEVER be recalculated with new algorithm version
- Results from MatchRun v1.0 remain unchanged even after v1.1 released
- Immutability enforced: Previous results are historical facts, not subject to retroactive change
- New match runs use current algorithm version; old matches preserve original version
- This ensures audit trail integrity and prevents surprises in case history

---

## F6.8: Match Configuration & Weighting (Admin Only)

**Description:** Admin configures matching algorithm weights/rules  
**Primary User:** Admin  
**Related Entities:** System configuration (not stored in DB)  
**MVP Status:** 🔄 DEFERRED  
**Rationale:** MVP uses hard-coded weights. Configurable weighting deferred to Phase 2 (requires safe testing).

---

## F6.9: Match Quality Feedback

**Description:** Coordinator provides feedback on match quality (for algorithm improvement)  
**Primary User:** Municipality coordinator, Admin  
**Related Entities:** match_candidates, match_runs  
**MVP Status:** 🔄 DEFERRED  
**Rationale:** MVP doesn't learn from feedback. ML-based improvement deferred to Phase 2+.

---

# CROSS-DOMAIN FEATURES

Features that span multiple domains.

---

## FX.1: User Authentication & Authorization

**Description:** System authenticates users and enforces role-based access  
**Primary User:** System (automatic)  
**Related Entities:** auth.users, profiles  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Supabase authentication (email/password)
- Roles: admin, coordinator, professional
- RLS policies enforce access per role
- Session management, logout, password reset

---

## FX.2: Dashboard & Notifications

**Description:** Users see relevant dashboard (coordinator: cases, professional: sessions/hours)  
**Primary User:** All user types  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Coordinator dashboard: Active cases, pending approvals, alerts
- Professional dashboard: Active cases, submitted sessions/hours, pending approvals
- Admin dashboard: All cases, all professionals, audit logs
- Notifications: In-app + email for important events (safeguarding alerts, outside-grant reviews, etc.)

---

## FX.3: Search & Filtering

**Description:** Users can search and filter across domain data  
**Primary User:** All user types  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Coordinator: Search cases, filter by municipality/status/professional
- Professional: Search own cases
- Admin: Search everything
- Advanced filters: date range, status, geography, complexity

---

## FX.4: Export & Reporting

**Description:** Users can export data for reporting and analysis  
**Primary User:** Admin, Coordinator  
**MVP Status:** 🔄 DEFERRED  
**Rationale:** MVP can query DB directly or export via API. Pretty dashboards/reports deferred to Phase 2.

---

## FX.5: Notification & Alert System

**Description:** System alerts users to important events (safeguarding, outside-grant, approvals needed, etc.)  
**Primary User:** All user types (receives)  
**Related Entities:** Implicit (triggered by domain events)  
**MVP Status:** ✅ REQUIRED  
**Notes:**
- Safeguarding alert: When session logged with safeguarding flag
- Outside-grant alert: When hours exceed grant
- Approval needed: When submission requires action
- Assignment notification: When new case assigned to professional
- Delivery: In-app + email

---

# SUMMARY: MVP STATUS BY DOMAIN

## Professional Domain

| Feature | MVP Status |
|---------|-----------|
| F1.1: Onboarding | ✅ REQUIRED |
| F1.2: Profile Management | ✅ REQUIRED |
| F1.3: Demographics | ✅ REQUIRED |
| F1.4: Geography & Transport | ✅ REQUIRED |
| F1.5: Qualifications | ✅ REQUIRED |
| F1.6: Document Verification | ✅ REQUIRED |
| F1.7: Status Management | ✅ REQUIRED |
| F1.8: Availability Toggle | 🔄 DEFERRED |
| F1.9: Exit & Archival | ✅ REQUIRED |
| F1.10: List & Search | ✅ REQUIRED |

**Domain Status:** 9/10 required for MVP

---

## Municipality Domain

| Feature | MVP Status |
|---------|-----------|
| F2.1: Reference Data | ✅ REQUIRED |
| F2.2: Grant Period Definition | ✅ REQUIRED |
| F2.3: Grant Hour Tracking | ✅ REQUIRED |
| F2.4: Outside Grant Review | ✅ REQUIRED |
| F2.5: Coordinator Contact | 🔄 DEFERRED |
| F2.6: Budget Reporting | 🔄 DEFERRED |

**Domain Status:** 4/6 required for MVP

---

## Case Domain

| Feature | MVP Status |
|---------|-----------|
| F3.1: Case Creation | ✅ REQUIRED |
| F3.2: Complexity Assessment | ✅ REQUIRED |
| F3.3: Demographics & Language Requirements | ✅ REQUIRED |
| F3.4: Geography & Transport Requirements | ✅ REQUIRED |
| F3.5: Competency & Experience Requirements | ✅ REQUIRED |
| F3.6: Availability & Time Window Requirements | ✅ REQUIRED |
| F3.7: Special Constraints | ✅ REQUIRED |
| F3.8: Professional Assignment | ✅ REQUIRED |
| F3.9: Handover | ✅ REQUIRED |
| F3.10: Archival | ✅ REQUIRED |
| F3.11: List & Dashboard | ✅ REQUIRED |

**Domain Status:** 11/11 required for MVP

---

## Delivery Domain

| Feature | MVP Status |
|---------|-----------|
| F4.1: Session Logging | ✅ REQUIRED |
| F4.2: Session Details (Safeguarding) | ✅ REQUIRED |
| F4.3: Session Finalization | ✅ REQUIRED |
| F4.4: Session Corrections | ✅ REQUIRED |
| F4.5: Registered Hours | ✅ REQUIRED |
| F4.6: Outside Grant Hours | ✅ REQUIRED |
| F4.7: Hours Approval | ✅ REQUIRED |
| F4.8: Contact Logging | ✅ REQUIRED |
| F4.9: Contact Disclosure | ✅ REQUIRED |
| F4.10: Data Retention Management | ✅ REQUIRED |
| F4.11: Session Log Transfer | 🔄 DEFERRED |

**Domain Status:** 10/11 required for MVP

---

## Governance Domain

| Feature | MVP Status |
|---------|-----------|
| F5.1: Audit Event Logging | ✅ REQUIRED |
| F5.2: Document Verification Audit | ✅ REQUIRED |
| F5.3: Session Approval Audit | ✅ REQUIRED |
| F5.4: Hours Approval Audit | ✅ REQUIRED |
| F5.5: Case Assignment Audit | ✅ REQUIRED |
| F5.6: GDPR & Data Retention | ✅ REQUIRED |
| F5.7: Access Control (RLS) | ✅ REQUIRED |
| F5.8: Encryption & Key Management | ✅ REQUIRED |

**Domain Status:** 8/8 required for MVP

---

## Matching Domain

| Feature | MVP Status |
|---------|-----------|
| F6.1: Match Run Execution | ✅ REQUIRED |
| F6.2: Candidate Generation | ✅ REQUIRED |
| F6.3: Scoring & Ranking | ✅ REQUIRED |
| F6.4: Recommendation to Coordinator | ✅ REQUIRED |
| F6.5: Manual Selection | ✅ REQUIRED |
| F6.6: Assignment from Match | ✅ REQUIRED |
| F6.7: Match History & Audit | ✅ REQUIRED |
| F6.8: Match Configuration | 🔄 DEFERRED |
| F6.9: Quality Feedback | 🔄 DEFERRED |
| F6.X: Geography Matching | 🔄 DEFERRED (Phase 2+, not in MVP) |
| F6.X: Language Matching | 🔄 DEFERRED (Phase 2+, not in MVP) |
| F6.X: Preference Matching | 🔄 DEFERRED (Phase 2+, stored via case features) |

**Domain Status:** 7/12 required for MVP
*Note: Geography, language, and preference matching deferred to Phase 2. MVP matching uses 4-component deterministic model (qualifications, availability, capacity, complexity fit).*

---

## Cross-Domain Features

| Feature | MVP Status |
|---------|-----------|
| FX.1: Authentication & Authorization | ✅ REQUIRED |
| FX.2: Dashboard & Notifications | ✅ REQUIRED |
| FX.3: Search & Filtering | ✅ REQUIRED |
| FX.4: Export & Reporting | 🔄 DEFERRED |
| FX.5: Alerts | ✅ REQUIRED |

**Domain Status:** 4/5 required for MVP

---

# GAPS & ISSUES IDENTIFIED

## Potential Gaps

### 1. Manual vs Matching Assignment Workflow
**Issue:** MVP supports both manual selection AND matching algorithm. These paths must coordinate to avoid conflicts.
**Status:** Documented; backend must handle both flows

### 2. Citizen Matching Preferences Privacy
**Issue:** Some citizen preferences (gender, language) are sensitive. How are they handled?
**Status:** Encrypted fields documented; MVP treats as case metadata (coordinator enters on behalf of citizen)

### 3. Coordinator-Professional Communication Channel
**Issue:** Who notifies professional of new assignment? Email? In-app?
**Status:** FX.5 (alerts) covers this; implementation needed in TS-002

### 4. Transport Hours Tracking
**Issue:** If professional provides transport, is that separate registered_hours entry or part of session?
**Status:** work_type TRANSPORT handles this (separate hours entry); documented

### 5. Crisis Response Protocols
**Issue:** What happens in safeguarding crisis situation? Escalation path?
**Status:** Out of scope (MVP documents concern; coordinator handles escalation); flagged for Phase 2

### 6. Professional Qualification Verification Timeline
**Issue:** How often must qualifications be reverified? Certificates expire when?
**Status:** Deferred to Phase 2; MVP has expiration dates but no auto-re-certification workflow

### 7. Multi-Language Interface
**Issue:** MVP supports non-Danish speakers in matching, but system UI is Danish-only?
**Status:** Out of scope; UI/translation deferred to Phase 2

### 8. Offline Capability
**Issue:** What if professional/coordinator has no network (rural area)?
**Status:** Out of scope; MVP is cloud-only; offline sync deferred to Phase 2+

---

## Three Critical Alerts: Classification & Resolution Status

### ALERT 1: Notification/Communication Flow ✅ CLASSIFIED

**Issue:** How are professionals and coordinators notified of events?
**Current Documentation:** 
- WF-003: "Professional notified of assignment (via email/manual contact)"
- WF-006: "Professional notified (manual email)"
- FX.5 (Alerts feature): Required but implementation details TBD

**Classification:** MUST BE HANDLED IN TS-002 API

**Action Required:**
- TS-002 API must specify notification endpoints
- Define which events trigger notifications (assignment, approval needed, hours rejected, etc.)
- Define notification type (in-app vs email vs both)
- Define who receives what notification when
- Define SLA for notifications (immediate vs batch)

**Why Not Architecture Blocker:** Concept is defined in workflows; only implementation needs TS-002 specification.

---

### ALERT 2: Matching Algorithm Specification ✅ RESOLVED

**Issue:** F6.3 (scoring/ranking) mentioned "examples" and "TBD actual weights"
**Resolution:** FULLY SPECIFIED in MATCHING_AND_COMPLEXITY_RULES.md (approved, locked)

**MVP Matching Model (Definitive - Not TBD):**
- 4 equal-weighted score components (0.25 each each)
- Qualifications score: experience (×2) + profession match (×25) + certifications (×25)
- Availability score: capacity ratio - concurrent load penalty
- Capacity score: complexity margin handling (0-100 scale)
- Complexity fit score: age match + complexity experience + special skills
- Deterministic (same inputs → same scores)
- Score interpretation: 80+=excellent, 60+=good, 40+=acceptable, <20=not suitable
- Top 3-5 candidates ranked, no auto-assignment
- Human-in-the-loop required for final selection

**Deferred to Phase 2+:**
- Geography/transport matching
- Language matching
- Citizen/municipality preference matching
- Configurable algorithm weights
- Machine learning improvements

**Classification:** ARCHITECTURE LOCKED - MATCHING_AND_COMPLEXITY_RULES.md is authoritative

---

### ALERT 3: Outside-Grant Approval Workflow ✅ CLASSIFIED

**Issue:** How does municipality coordinator approve outside-grant hours?
**Current Documentation:**
- WF-007 (Outside Grant Review): Complete workflow documented
- F4.6: Status set to OUTSIDE_GRANT, requires special review
- F2.4: Municipality coordinator approves/rejects override
- Database schema: registered_hours has reviewed_by, reviewed_at fields

**Classification:** ALREADY COVERED IN EXISTING DOCS

**Implementation Details for TS-002:**
- API endpoint for coordinator to view pending outside-grant hours
- UI form for coordinator to approve/reject with optional comments
- Notification when outside-grant review needed
- Business logic: update status to APPROVED or REJECTED
- Audit trail: who approved/rejected, when, notes

**Why Not Architecture Blocker:** WF-007 and F4.6 fully document the concept; TS-002 handles implementation.

---

These are NOT MVP but might be flagged for later phases:

- ❌ Advanced analytics & reporting dashboards
- ❌ Professional availability calendar (available now, busy Tue-Wed, etc.)
- ❌ Complex grant reconciliation reports
- ❌ Mobile app (browser-only MVP)
- ❌ Real-time presence/availability
- ❌ Video call integration
- ❌ Document storage (uploading only; external storage system)
- ❌ Multi-language interface
- ❌ SMS notifications (email only)
- ❌ Machine learning-based matching improvements
- ❌ Professional peer review/ratings
- ❌ Budget forecasting
- ❌ Integration with external systems (municipality case systems, etc.)

---

## Explicit Deferrals (Phase 2+)

These are documented as DEFERRED and NOT in MVP:

- 🔄 F1.8: Professional availability toggle (dynamic)
- 🔄 F2.5: Coordinator address book
- 🔄 F2.6: Grant budget reporting
- 🔄 F4.11: Session log transfer
- 🔄 F6.8: Configurable matching weights
- 🔄 F6.9: Match quality feedback / learning
- 🔄 FX.4: Export & reporting dashboards

---

# FEATURE INVENTORY COMPLETENESS CHECK

Total Features: 62 (7 deferred/phase 2+)
- ✅ REQUIRED (MVP): 55 features
- 🔄 DEFERRED (Phase 2+): 7 features
- ❌ OUT OF SCOPE: 0 features

**MVP Coverage:** 90% of identified features

**Confidence Level:** HIGH
- All 6 domains have clear, locked MVP scope
- Professional matching attributes fully documented
- Case match requirements fully documented
- Delivery workflows complete
- Governance (audit, encryption) complete
- Matching algorithm LOCKED (not TBD)
- 3 alerts classified and resolution path clear
- No TBD or undefined requirements remaining

**Differences from Initial Assessment:**
- Matching domain: Updated from 7/9 to 7/12 (added deferred geography, language, preference matching)
- Matching algorithm: Changed from "TBD actual weights" to "FULLY SPECIFIED in MATCHING_AND_COMPLEXITY_RULES.md"
- All 3 critical alerts: Classified (1 resolved, 1 must be in TS-002, 1 already covered)

---

# DOCUMENT METADATA

**Created:** June 27, 2026  
**Based On:** Architecture v1.0, TS-001 Database Specification  
**Purpose:** Bridge between Architecture and Technical Specifications (TS-002+)  
**Status:** DRAFT - For Review  
**Next Step:** Validate against Architecture v1.0 and stakeholder feedback

---
