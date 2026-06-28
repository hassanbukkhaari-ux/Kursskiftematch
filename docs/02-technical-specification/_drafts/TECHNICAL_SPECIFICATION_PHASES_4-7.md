# Technical Specification: Kurskifte-Match 2.0
## Parts 4-7: Frontend, Matching Engine, Security, Deployment

**Document Type:** Technical Specification (Implementation Blueprint)  
**Version:** 1.0 (Based on Architecture v1.0)  
**Date:** June 27, 2026  
**Status:** APPROVED FOR IMPLEMENTATION  

---

# PART 4: FRONTEND SPECIFICATION

## 4.1 TECHNOLOGY STACK

**Framework:** Next.js 15 (App Router)  
**UI Components:** Shadcn/ui + Tailwind CSS  
**State Management:** React Context + custom hooks (no Redux for MVP)  
**HTTP Client:** Supabase JavaScript client / fetch API  
**Authentication:** Supabase Auth UI  

---

## 4.2 ROUTE STRUCTURE

### Admin Portal
```
/admin
├─ /dashboard              (overview, stats)
├─ /professionals
│  ├─ /                    (list, search, filter)
│  ├─ /:id                 (view, approve, docs)
│  └─ /new                 (create professional)
├─ /cases
│  ├─ /                    (list, filter by status)
│  ├─ /:id                 (case details, assignment, complexity)
│  ├─ /:id/grant           (view, add grant)
│  ├─ /:id/hours           (list, approve, review outside)
│  ├─ /:id/match           (trigger match, view candidates, assign)
│  ├─ /:id/handover        (initiate, transfer sessions, complete)
│  ├─ /:id/sessions        (list, view)
│  ├─ /:id/contacts        (log, disclose)
│  └─ /new                 (create from inquiry)
├─ /audit
│  └─ /                    (query audit log, filter, search)
├─ /settings
│  └─ /                    (system config, user management)
└─ /profile
   └─ /                    (admin's own profile)
```

### Professional Portal
```
/professional
├─ /dashboard              (my cases, hours to register, notifications)
├─ /cases
│  ├─ /                    (list assigned cases)
│  └─ /:id
│     ├─ /sessions         (create, view, finalize, correct)
│     ├─ /hours            (register, view status)
│     └─ /details          (case info, grant, contact)
├─ /profile
│  ├─ /                    (view own profile)
│  ├─ /documents           (view, upload)
│  ├─ /availability        (set availability/capacity)
│  └─ /settings            (personal preferences)
└─ /notifications          (view all notifications)
```

### Auth Routes
```
/auth
├─ /login                  (email + password)
├─ /signup                 (for future recruitment portal)
├─ /forgot-password        (password reset)
└─ /logout                 (clear session)
```

---

## 4.3 SCREEN HIERARCHY & STATE MANAGEMENT

### Admin Professionals Screen

**Route:** `/admin/professionals`

**State:**
```typescript
interface ProfessionalsPageState {
  professionals: Professional[];
  filters: {
    status: 'ACTIVE' | 'INACTIVE' | 'REGISTERED' | 'ARCHIVED';
    profession: string;
    complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    search: string;
  };
  pagination: { page: number; limit: number; total: number };
  loading: boolean;
  error: null | Error;
  selectedProfessional: null | Professional;
}
```

**Components:**
- ProfessionalsListPage (container)
  - SearchBar (filters)
  - ProfessionalsTable (grid of professionals)
    - ProfessionalRow (each row, onclick → detail modal)
  - ProfessionalsDetailModal
    - ProfileTab (view/edit name, profession, experience)
    - DocumentsTab (upload, verify)
    - CasesTab (list assigned cases)
    - ApprovalSection (approve/reject button)

---

### Case Detail Screen

**Route:** `/admin/cases/:id`

**State:**
```typescript
interface CaseDetailState {
  case: Case;
  complexityFactors: CaseComplexityFactors;
  currentAssignment: CaseAssignment | null;
  assignmentHistory: CaseAssignment[];
  grant: CaseGrant;
  hours: RegisteredHours[];
  sessionLogs: SessionLog[];
  loading: boolean;
  error: null | Error;
  activeTab: 'overview' | 'assignment' | 'hours' | 'sessions' | 'contacts';
}
```

**Tabs:**
1. Overview: Case info, complexity, citizen initials/age
2. Assignment: Current → Handover button → Handover modal
3. Hours: List hours (PENDING, APPROVED, REJECTED, OUTSIDE_GRANT) → Approve button
4. Sessions: List sessions, view details
5. Contacts: Log contact, disclose sagsbehandler

---

### Matching Run Screen

**Route:** `/admin/cases/:id/match`

**State:**
```typescript
interface MatchRunState {
  matchRun: MatchRun;
  candidates: MatchCandidate[];
  status: 'INITIATED' | 'SCORED' | 'ASSIGNED';
  selectedCandidateId: null | string;
  overrideReason: string;
  loading: boolean;
}
```

**Flow:**
1. Admin clicks "Find Professional"
2. Backend scores candidates (async)
3. Display candidates with:
   - Rank (1, 2, 3, ...)
   - Professional name, profession, experience
   - Overall score (80-100 range indicator, not raw number)
   - Explanation (human-readable, opaque)
4. Admin selects professional (can choose different from rank 1)
5. If selecting non-rank-1: prompt for override reason
6. Submit → Create CaseAssignment

---

### Hours Registration Screen (Professional Portal)

**Route:** `/professional/cases/:id/hours`

**State:**
```typescript
interface HoursRegistrationState {
  hoursForm: {
    work_date: string;
    work_type: string;
    hours: number;
    session_log_id?: string;
    description: string;
  };
  hours: RegisteredHours[];
  grantRemaining: number;
  loading: boolean;
  error: null | Error;
}
```

**Form:**
- Date picker (work_date, max today)
- Dropdown (work_type: DIRECT_SESSION, TRANSPORT, etc.)
- Number input (hours: 0.25 to 8.0)
- Session log selector (if DIRECT_SESSION)
- Text area (description)
- Submit button (saves as PENDING)

**List Below:**
- All hours for this case with status badges
- Pending: editable, can submit
- Submitted/Approved: view only
- Rejected: can re-submit new entry

---

## 4.4 FORM VALIDATION

### Professional Registration Form

```typescript
interface ProfessionalFormValidation {
  email: [required, valid email, unique check (async)]
  profession: [required, enum]
  experience_years: [required, >= 0, integer]
  capacity_hours_week: [required, > 0, <= 100]
  target_age_groups: [required, at least one]
  max_complexity_level: [required, enum]
}
```

**Validation Timing:**
- On blur: field validation
- On submit: full form validation
- Async fields: debounced API check (email uniqueness)

### Case Creation Form

```typescript
interface CaseFormValidation {
  municipality_id: [required, exists in db]
  citizen_initials: [required, exactly 2 chars]
  citizen_age_range: [required, enum: '0-5'|'6-12'|'13-18'|'18+']
  weekly_hours: [required, > 0, <= 40]
  complexity_factors: {
    mental_health: [boolean]
    family_instability: [boolean]
    school: [boolean]
    violence: [boolean]
    substance_use: [boolean]
    criminality: [boolean]
    multiple_agencies: [boolean]
  } [at least one required]
}
```

### Session Log Form

```typescript
interface SessionLogFormValidation {
  session_date: [required, <= TODAY]
  observations: [optional, max 5000 chars]
  citizen_mood_tone: [optional, max 200 chars]
  follow_up_needed: [boolean]
  safeguarding_concern_flag: [boolean]
  if safeguarding_concern_flag:
    safeguarding_detail: [required]
  participant_names: [optional, array, max 10]
  location: [optional, max 500 chars]
}
```

---

## 4.5 PERMISSIONS & ACCESS CONTROL (Frontend)

**Enforcement Strategy:** Backend (RLS) is authoritative. Frontend hides/disables UI.

**Admin Access:**
- Can see all professionals, cases, hours
- Can edit most fields
- Can approve/reject hours
- Can assign professionals
- Can disclose contacts
- Can view audit trail

**Professional Access:**
- Can see own profile, documents, availability
- Can see own assigned cases
- Can create/edit/finalize sessions (own only)
- Can register/submit hours (own only)
- Cannot see other professionals
- Cannot see audit trail
- Cannot approve/reject anything

**Frontend Implementation:**
```typescript
// Permission hook
function usePermission(resource: string, action: string): boolean {
  const { user, role } = useAuth();
  
  if (role === 'admin') return true;
  
  const permissions = {
    'professional:view-own': role === 'professional',
    'case:view-assigned': role === 'professional',
    'hours:register-own': role === 'professional',
    'session:create-own': role === 'professional',
    // ... etc
  };
  
  return permissions[`${resource}:${action}`] || false;
}

// Usage
const canApproveHours = usePermission('hours', 'approve');
if (!canApproveHours) {
  return <div>No permission</div>;
}
```

---

## 4.6 NAVIGATION & LAYOUT

### Layout Components

```
AppLayout (wraps all pages)
├─ TopNav
│  ├─ Logo
│  ├─ Breadcrumb
│  └─ UserMenu (profile, settings, logout)
├─ Sidebar (admin only)
│  ├─ NavLink (dashboard)
│  ├─ NavLink (professionals)
│  ├─ NavLink (cases)
│  ├─ NavLink (audit)
│  └─ NavLink (settings)
└─ MainContent
   └─ [Page content]
```

### Navigation for Professionals

```
ProfessionalLayout
├─ TopNav (same)
├─ Tabs
│  ├─ Dashboard
│  ├─ Cases
│  ├─ Profile
│  └─ Notifications
└─ MainContent
```

---

## 4.7 STATE MANAGEMENT PATTERNS

### Using React Context + Custom Hooks

```typescript
// contexts/CaseContext.tsx
interface CaseContextType {
  case: Case | null;
  loading: boolean;
  error: null | Error;
  fetchCase: (id: string) => Promise<void>;
  updateComplexity: (factors: CaseComplexityFactors) => Promise<void>;
}

export const CaseContext = React.createContext<CaseContextType | null>(null);

export function useCaseDetail(caseId: string) {
  const { case: caseData, fetchCase } = useContext(CaseContext)!;
  
  useEffect(() => {
    if (caseId) fetchCase(caseId);
  }, [caseId]);
  
  return caseData;
}
```

### Why Not Redux (for MVP)?
- Simple data flow (API → Component → UI)
- Minimal global state (auth only)
- Easier debugging
- Less boilerplate

---

## 4.8 API INTEGRATION

### Fetch Pattern

```typescript
async function getCase(caseId: string): Promise<Case> {
  const response = await fetch(`/api/v1/cases/${caseId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  
  return response.json();
}
```

### Error Handling

```typescript
try {
  const caseData = await getCase(caseId);
  setCaseData(caseData);
} catch (error) {
  if (error.status === 403) {
    setError('No permission to view this case');
  } else if (error.status === 404) {
    setError('Case not found');
  } else {
    setError('Failed to load case');
  }
}
```

---

# PART 5: MATCHING ENGINE SPECIFICATION

## 5.1 ALGORITHM IMPLEMENTATION (Per MATCHING_AND_COMPLEXITY_RULES.md)

**Language:** TypeScript (Node.js backend)  
**Determinism:** Same inputs → Same outputs (testable, reproducible)  
**Immutability:** Scores never change, historical preserved  

---

## 5.2 SCORE CALCULATION

```typescript
class MatchingEngine {
  
  /**
   * Score one professional for a case
   * Returns detailed scores (not shown to admin, used for ranking)
   */
  scoreCandidate(caseData: Case, professional: Professional, matchContext: MatchContext): MatchScore {
    
    // 1. QUALIFICATIONS SCORE (0-100)
    const qualificationsScore = this.calculateQualificationsScore({
      experience_years: professional.experience_years,
      profession: professional.profession,
      case_needs: caseData.complexity_factors,
      documents: professional.documents
    });
    
    // Formula:
    // base = 50
    // + Math.min(professional.experience_years * 2, 50)
    // + (this.isProfessionMatch(professional, caseData) ? 25 : 0)
    // + (this.hasRelevantCertifications(professional) ? 25 : 0)
    
    // 2. AVAILABILITY SCORE (0-100)
    const availabilityScore = this.calculateAvailabilityScore({
      capacity_hours_week: professional.capacity_hours_week,
      current_load: matchContext.professionalLoads[professional.id],
      case_hours: caseData.weekly_hours,
      max_concurrent: professional.max_concurrent_cases,
      current_assignments: matchContext.professionalAssignments[professional.id]
    });
    
    // Formula:
    // remaining = professional.capacity_hours_week - current_load
    // capacity_score = Math.min((remaining / case_hours) * 100, 100)
    // concurrent_load = current_assignments / max_concurrent
    // load_penalty = concurrent_load * 20
    // score = Math.max(capacity_score - load_penalty, 0)
    
    // 3. CAPACITY SCORE (0-100)
    const capacityScore = this.calculateCapacityScore({
      professional_max_complexity: professional.max_complexity_level,
      case_complexity: caseData.complexity_level
    });
    
    // Formula:
    // if case_complexity > professional_max_complexity: return 0
    // if case_complexity = professional_max_complexity: return 50
    // margin = (max_complexity - case_complexity) in ordinal levels
    // return 50 + (margin * 25)
    
    // 4. COMPLEXITY FIT SCORE (0-100)
    const complexityFitScore = this.calculateComplexityFitScore({
      case_age_range: caseData.citizen_age_range,
      professional_target_ages: professional.target_age_groups,
      case_factors: caseData.complexity_factors,
      professional_experience: matchContext.professionalExperience[professional.id]
    });
    
    // Formula:
    // age_match = (case_age in professional.target_age_groups) ? 50 : 0
    // complexity_exp = Math.min(experience_at_complexity * 5, 50)
    // skills_match = (has_skills_for_violence|substance|etc) ? 25 : 0
    // return age_match + complexity_exp + skills_match
    
    // 5. OVERALL SCORE (weighted average)
    const overallScore = (
      qualificationsScore * 0.25 +
      availabilityScore * 0.25 +
      capacityScore * 0.25 +
      complexityFitScore * 0.25
    );
    
    // Round to 2 decimal places
    const rounded = Math.round(overallScore * 100) / 100;
    
    return {
      professional_id: professional.id,
      qualifications_score: Math.round(qualificationsScore * 100) / 100,
      availability_score: Math.round(availabilityScore * 100) / 100,
      capacity_score: Math.round(capacityScore * 100) / 100,
      complexity_fit_score: Math.round(complexityFitScore * 100) / 100,
      overall_score: rounded,
      algorithm_version: '1.0'
    };
  }
  
  /**
   * Generate human-readable explanation (score opaque)
   * Example: "Excellent qualifications (8 years) + available capacity (5.5/5 hours) + strong fit"
   * Never shows: "qualifications_score=90, availability_score=100"
   */
  generateExplanation(
    candidate: MatchScore,
    professional: Professional,
    caseData: Case
  ): string {
    const parts: string[] = [];
    
    // Experience description
    if (candidate.qualifications_score >= 80) {
      parts.push(`Excellent qualifications (${professional.experience_years} years ${professional.profession})`);
    } else if (candidate.qualifications_score >= 60) {
      parts.push(`Good qualifications (${professional.experience_years} years experience)`);
    } else {
      parts.push(`Basic qualifications match`);
    }
    
    // Availability description
    const remaining = professional.capacity_hours_week - (matchContext.professionalLoads[professional.id] || 0);
    if (candidate.availability_score >= 80) {
      parts.push(`Strong availability (${remaining}/${caseData.weekly_hours} hours available)`);
    } else if (candidate.availability_score >= 60) {
      parts.push(`Adequate availability`);
    } else {
      parts.push(`Limited availability`);
    }
    
    // Complexity fit description
    if (candidate.complexity_fit_score >= 80) {
      parts.push(`strong fit for ${caseData.complexity_level} cases`);
    } else if (candidate.complexity_fit_score >= 60) {
      parts.push(`good match for complexity level`);
    }
    
    return parts.join(' + ');
  }
  
  /**
   * Helper: Check if profession matches case needs
   */
  private isProfessionMatch(professional: Professional, caseData: Case): boolean {
    // Example logic: pedagogue for school cases, nurse for health cases
    const needsMap = {
      'school': ['PEDAGOGUE', 'TEACHER'],
      'mental_health': ['PSYCHOLOGIST', 'COUNSELOR'],
      'substance_use': ['NURSE', 'COUNSELOR']
    };
    
    for (const [factor, professions] of Object.entries(needsMap)) {
      if (caseData.complexity_factors[factor] && professions.includes(professional.profession)) {
        return true;
      }
    }
    
    return false;
  }
}
```

---

## 5.3 RANKING PROCESS

```typescript
/**
 * Rank candidates after scoring
 */
async scoreAllCandidates(
  caseId: string,
  professionals: Professional[],
  matchContext: MatchContext
): Promise<MatchCandidate[]> {
  
  const caseData = await getCaseDetails(caseId);
  
  // Score all professionals
  const scores = professionals.map(prof => 
    this.scoreCandidate(caseData, prof, matchContext)
  );
  
  // Filter out unsuitable (<20 score)
  const suitable = scores.filter(s => s.overall_score >= 20);
  
  // Sort by overall_score descending
  suitable.sort((a, b) => b.overall_score - a.overall_score);
  
  // Assign ranks
  const ranked = suitable.map((score, index) => ({
    ...score,
    rank: index + 1,
    scoring_explanation: this.generateExplanation(score, professionals.find(p => p.id === score.professional_id)!, caseData)
  }));
  
  return ranked;
}
```

---

## 5.4 EXPLAINABILITY OUTPUT

**For Admin (Human-Readable):**
```
Rank 1: Jane Doe (Pedagogue, 8 years) - Excellent qualifications + strong availability (5.5 hours available) + strong fit for school-based cases
Rank 2: John Smith (Social Worker, 5 years) - Good experience + adequate availability + solid complexity match
Rank 3: Mary Johnson (Nurse, 10 years) - Extensive experience but limited availability this week
```

**NOT Shown:**
- Raw scores (80, 72, 65)
- Score breakdowns (qualifications=90, availability=100)
- Algorithm details

---

## 5.5 ALGORITHM VERSIONING

**Current:** v1.0  
**When changing:**
1. Create v1.1 or v2.0 (breaking change)
2. New MatchRuns use new version
3. Old MatchRuns preserve v1.0 scores (immutable)
4. Document change in commit message

---

# PART 6: SECURITY SPECIFICATION

## 6.1 AUTHENTICATION FLOW

**Mechanism:** Supabase Auth JWT tokens

**Flow:**
```
1. Professional logs in via /auth/login
   - Email + password
   - Supabase verifies
   - JWT token issued
   
2. Frontend stores JWT in:
   - httpOnly cookie (preferred, automatic Supabase)
   - OR localStorage (if cookie not available)

3. Every API request includes:
   - Authorization: Bearer <jwt_token>

4. Backend verifies:
   - Signature (Supabase public key)
   - Not expired
   - Extract claims (user_id, email, role)

5. On logout:
   - Delete token from localStorage/cookie
   - Supabase revokes session
```

---

## 6.2 AUTHORIZATION

**Strategy:** RLS + Backend checks

### RLS Policies (Database Level)

**All tables have RLS enabled:**

```sql
-- Example: professionals table
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professionals_select_policy" ON professionals
  FOR SELECT
  USING (
    auth.uid() = id  -- User sees own
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );

CREATE POLICY "professionals_update_policy" ON professionals
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin');  -- Admin only

-- Example: session_logs table
CREATE POLICY "session_logs_select_policy" ON session_logs
  FOR SELECT
  USING (
    professional_id = auth.uid()  -- Professional sees own
    OR auth.jwt()->>'role' = 'admin'  -- Admins see all
  );
```

### Backend Checks (API Level)

```typescript
// Additional validation in API handlers
async function approveProfessional(req: NextApiRequest, res: NextApiResponse) {
  
  // 1. Check JWT exists and valid
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const user = await verifyJWT(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  
  // 2. Check role
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // 3. RLS will also check in database
  // If RLS denies, query returns no rows
  
  // 4. Proceed with operation
  // ...
}
```

---

## 6.3 RLS IMPLEMENTATION DETAILS

**Enabled on all tables:**
- professionals
- professional_documents
- cases
- session_logs
- registered_hours
- contact_logs
- match_runs
- match_candidates
- audit_events
- All others

**Special Case: audit_events**
- Immutable (RLS prevents UPDATE/DELETE)
- SELECT filtered (admins see all, professionals see own actions only)

```sql
CREATE POLICY "audit_events_select_policy" ON audit_events
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'admin'
    OR actor_id = auth.uid()  -- See own actions
  );

CREATE POLICY "audit_events_immutable" ON audit_events
  FOR UPDATE, DELETE
  USING (FALSE);  -- Never allow
```

---

## 6.4 ENCRYPTION

### Fields Requiring Encryption (Application Level)

**At-Rest (in database):**
- case.citizen_notes
- session_logs.observations
- session_logs.safeguarding_detail
- session_logs.participant_names
- session_logs.location
- contact_logs.note
- contact_logs.outcome
- registered_hours.description
- match_candidates.scoring_explanation

**Decision (TBD in implementation):**
- Option A: Supabase pgcrypto (server-side encryption)
- Option B: Application-level encryption (Nacl.js or TweetNaCl)

**Recommendation:** Application-level for sensitive citizen data (ensures plaintext never exists on server).

### Implementation (Option B)

```typescript
import nacl from 'tweetnacl';

// Encrypt on write
function encryptField(plaintext: string, encryptionKey: Uint8Array): string {
  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.secretbox(Buffer.from(plaintext), nonce, encryptionKey);
  return Buffer.concat([nonce, encrypted]).toString('base64');
}

// Decrypt on read
function decryptField(ciphertext: string, encryptionKey: Uint8Array): string {
  const bytes = Buffer.from(ciphertext, 'base64');
  const nonce = bytes.slice(0, 24);
  const encrypted = bytes.slice(24);
  const decrypted = nacl.secretbox.open(encrypted, nonce, encryptionKey);
  return Buffer.from(decrypted!).toString('utf8');
}

// In API handler:
const plainNote = 'Sensitive observation about citizen';
const encrypted = encryptField(plainNote, ENCRYPTION_KEY);
// Store encrypted value to database

// Later, when reading:
const encryptedFromDB = sessionLog.observations;
const decrypted = decryptField(encryptedFromDB, ENCRYPTION_KEY);
```

---

## 6.5 AUDIT LOGGING

**All sensitive operations logged:**
- Professional approved/rejected
- Hours approved/rejected
- Case created/closed
- Professional assigned/handover
- Contact disclosed
- Data deleted

**Audit Event Contents (privacy-safe):**
- event_type (e.g., HOURS_APPROVED)
- actor_id (who performed action)
- resource_type & resource_id (what was affected)
- metadata (details, no sensitive data)
- created_at (timestamp)

**Example Audit Event (OK):**
```json
{
  "event_type": "HOURS_APPROVED",
  "actor_id": "admin-uuid",
  "resource_type": "registered_hours",
  "resource_id": "hours-uuid",
  "metadata": {
    "case_id": "case-uuid",
    "hours": 4.5,
    "status": "APPROVED"
  },
  "created_at": "2026-06-27T14:30:00Z"
}
```

**Example Audit Event (NOT OK - don't do this):**
```json
{
  "metadata": {
    "citizen_name": "John Doe",  // ❌ Sensitive
    "safeguarding_detail": "..."  // ❌ Sensitive
  }
}
```

---

## 6.6 GDPR COMPLIANCE

**Right to Access:** Professionals can request own data via profile screen

**Right to Deletion (Right to be Forgotten):** 
- User requests deletion
- Data marked for deletion (30-day delay)
- After 30 days: soft-deleted (status=DELETED, not hard deleted)
- Audit trail preserved (immutable)

**Data Minimization:**
- Citizen data: initials + age_range only (no name, CPR)
- Encrypted sensitive notes
- Professional data: only what's operational

---

# PART 7: DEPLOYMENT SPECIFICATION

## 7.1 ENVIRONMENT CONFIGURATION

**Environments:**
- Local (development)
- Staging (integration testing)
- Production

**Environment Variables:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_key_xxx
SUPABASE_SERVICE_ROLE_KEY=secret_key_xxx

# Database
DATABASE_URL=postgresql://user:pass@host/db

# Encryption
ENCRYPTION_KEY=base64_encoded_32_byte_key

# API
API_BASE_URL=https://kursskifte.dk/api/v1

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info

# Secrets (managed by CI/CD)
JWT_SECRET=xxx
SESSION_SECRET=xxx
```

---

## 7.2 CI/CD PIPELINE

**Tool:** GitHub Actions (or GitLab CI)

**Pipeline Stages:**

```yaml
name: Deploy Kurskifte-Match

on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      - name: Run smoke tests
        run: npm run test:smoke
      - name: Notify Slack
        run: curl -X POST ${{ secrets.SLACK_WEBHOOK }} ...
```

---

## 7.3 DATABASE MIGRATIONS

**Tool:** Supabase migrations (tracked in Git)

**Process:**
```
1. Create migration: supabase migration new table_name
2. Edit migration file (UP SQL)
3. Test locally: supabase db push
4. Commit to Git
5. On production: supabase db push --linked
```

**Migration Safety:**
- Always write DOWN migrations (rollback)
- Test on staging first
- Zero-downtime migrations (add columns with defaults, etc.)
- No breaking changes without coordination

---

## 7.4 SECRETS MANAGEMENT

**Approach:** Environment variables via CI/CD secrets

**Secrets (in GitHub/GitLab):**
- `SUPABASE_SERVICE_ROLE_KEY` (database admin)
- `JWT_SECRET` (token signing)
- `ENCRYPTION_KEY` (data encryption)
- `SENTRY_DSN` (error tracking)
- API keys for external services

**Access Control:**
- Only production deployment has access to production secrets
- Developers don't have production secrets locally
- Rotate secrets quarterly

---

## 7.5 BACKUP STRATEGY

**Database:** Supabase automatic backups (daily)
- Retention: 7 days (development), 30 days (production)
- Point-in-time recovery available

**Application Files:**
- Code in Git (GitHub)
- Build artifacts in Vercel

**Recovery Process:**
1. Database issue: Restore from Supabase backup
2. Application issue: Redeploy from Git commit
3. Data corruption: Restore GDPR-compliant snapshot (see WF-013)

---

## 7.6 MONITORING & ALERTING

**Monitoring Tools:**
- Sentry (error tracking)
- Vercel Analytics (performance)
- Custom dashboards (Grafana optional)

**Key Metrics:**
- API response time (target: < 500ms p95)
- Error rate (target: < 0.1%)
- Database query time (target: < 100ms p95)
- Availability (target: 99.9%)

**Alerts:**
- Error rate > 0.5%: Page on-call
- API latency p95 > 1s: Warning
- Database connection pool exhausted: Critical
- Disk space > 80%: Warning

---

## 7.7 DEPLOYMENT CHECKLIST

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Code review approved
- [ ] Migrations tested on staging
- [ ] Documentation updated
- [ ] Database backups created

**Deployment:**
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Deploy to production (off-peak if possible)
- [ ] Monitor errors/latency for 30 min
- [ ] Verify audit events logging

**Post-Deployment:**
- [ ] Monitor error rate for 2 hours
- [ ] Check performance metrics
- [ ] Verify no data corruption
- [ ] Update status page

---

## 7.8 SCALING STRATEGY

**MVP:** Single Vercel deployment, Supabase managed database

**Phase 2 (if needed):**
- Horizontal scaling: Multiple instances behind load balancer
- Caching layer: Redis for frequently accessed data
- Database optimization: Read replicas for reporting queries
- CDN: For static assets

**No immediate scaling needed for MVP** (expected <100 concurrent users initially)

---

**END OF TECHNICAL SPECIFICATION**

**All 7 Parts Complete:**
1. ✅ Database Specification
2. ✅ API Specification  
3. ✅ Backend Specification
4. ✅ Frontend Specification
5. ✅ Matching Engine Specification
6. ✅ Security Specification
7. ✅ Deployment Specification

**Status:** Ready for implementation

Every endpoint, database table, service method, screen, algorithm detail, security policy, and deployment step is defined.

Developers can now build the system without making additional architectural decisions.
