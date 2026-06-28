# Kursskifte Match 2.0 — Roadmap
## Phases, Timeline, Scope

**Date:** June 27, 2026  
**Status:** MVP ROADMAP LOCKED  
**Version:** 1.0

---

## EXECUTIVE SUMMARY

- **MVP:** 12 weeks (July-September 2026)
- **Phase 2:** Q4 2026 (October-December)
- **Phase 3+:** 2027+

---

## PHASE 1: MVP (12 WEEKS)

### Timeline: July - September 2026

**Week 1-2: Foundation**
- ✅ Technical Specification (approval only, no code)
- ✅ Supabase schema migrations (create tables, RLS)
- ✅ Next.js scaffold (routes, components, auth)
- ✅ CI/CD setup (GitHub Actions, auto-deploy)

**Week 3-5: Core Case Management**
- Admin: Create, read, update cases
- Soft delete (archive) cases
- Citizen data: initials, age range, notes
- Case status workflow: OPEN → MATCHED → ACTIVE → COMPLETED → ARCHIVED
- CaseComplexityFactors: calculate complexity from structured factors

**Week 6-7: Professional Pool**
- Professional registration (email, phone, role, qualifications)
- Professional documents (upload, verify, track expiry)
- Capacity limits (hours/week, max concurrent cases, max complexity level)
- Document management: signed URLs, verification workflow

**Week 8-9: Work Tracking**
- SessionLog: write-once documentation (professional writes)
- RegisteredHours: time tracking (professional submits, admin approves)
- Corrections: SessionLogCorrection table (explain changes)
- Grant control: CaseGrant, remaining hours calculation, outside_grant review

**Week 10: Professional Changes**
- CaseAssignment: temporal tracking (replace cases.professional_id)
- CaseHandover: structured handover workflow
- SessionLogTransfer: audit trail for sharing documentation
- ContactDisclosure: audit trail for contact info sharing

**Week 11: Matching (Decision Support)**
- MatchRun: admin-triggered (never automatic)
- MatchCandidate: scored candidates with explanation
- Algorithm versioning: v1.0 baseline
- Admin confirms final assignment

**Week 12: Polish & Launch**
- Audit & compliance: AuditEvents, GDPR workflows
- Admin portal: Case CRUD, professional management, document verification
- Professional portal: View cases, write sessions, register hours
- Public website: Homepage, municipality inquiry form, professional application form, privacy policy
- **Public intake boundary (WF-015):** `inbound_inquiries` table, public API routes (`POST /api/public/intake/inquiry`, `POST /api/public/intake/professional-application`), Cloudflare Turnstile CAPTCHA, rate limiting, admin review queue in admin portal
- **Data migration:** Tally professional applications → `inbound_inquiries` (CONVERTED); existing contact form submissions → `inbound_inquiries` (CONVERTED where applicable)
- Launch preparation: Domain, DNS, Vercel deploy, Cloudflare Turnstile site key configured

---

## MVP SCOPE INCLUDED

### Case Management
- ✅ Create, read, update, archive cases
- ✅ Citizen data (initials, age range, encrypted notes)
- ✅ Complexity calculation from structured factors
- ✅ Case status workflow

### Professional Management
- ✅ Professional registration & verification
- ✅ Document credential vault (CV, certificates, background checks)
- ✅ Capacity limits and workload tracking
- ✅ Availability scheduling

### Work Tracking
- ✅ SessionLog: write-once professional documentation
- ✅ RegisteredHours: time tracking with approval workflow
- ✅ Session log corrections (explain changes)
- ✅ Contact log (professional-sagsbehandler communication)

### Grant Control
- ✅ Municipal budget allocation (CaseGrant)
- ✅ Dynamic remaining hours calculation
- ✅ Outside_grant flagging and review workflow
- ✅ Payroll QA (pending/approved/rejected hours)

### Professional Changes
- ✅ CaseAssignment: temporal tracking
- ✅ CaseHandover: structured handover process
- ✅ Session log transfer with approval audit trail
- ✅ Contact disclosure audit trail

### Matching
- ✅ MatchRun: admin-triggered decision support
- ✅ MatchCandidate: scored with explanation
- ✅ Algorithm versioning (v1.0)
- ✅ Admin confirms final assignment

### Audit & Compliance
- ✅ AuditEvents: privacy-safe event logging
- ✅ Metadata contracts per event type
- ✅ Immutable records (corrections, transfers, audit)
- ✅ GDPR: 7-year retention, right-to-be-forgotten (scheduled delete)

### Portals
- ✅ Admin portal: Full case, professional, document management, inbound inquiry review queue
- ✅ Professional portal: View cases, write sessions, register hours, upload docs
- ✅ Public website: Homepage, municipality inquiry form, professional application form, privacy policy

### Public Intake Boundary (WF-015)
- ✅ `inbound_inquiries` staging table (Governance Domain)
- ✅ Public API routes: `POST /api/public/intake/inquiry`, `POST /api/public/intake/professional-application`
- ✅ Cloudflare Turnstile CAPTCHA (server-side validation, GDPR-safe)
- ✅ Honeypot field, rate limiting (5 submissions/IP/hour)
- ✅ `INQUIRY_RECEIVED` notification event (6th MVP notification type)
- ✅ Admin review + convert/reject workflow in admin portal

### Infrastructure
- ✅ Supabase PostgreSQL database with RLS
- ✅ Supabase Auth (email/password, JWT)
- ✅ Vercel deployment (Next.js)
- ✅ Document storage (Supabase Storage, signed URLs)
- ✅ Cloudflare Turnstile (CAPTCHA for public intake)

---

## MVP SCOPE EXCLUDED (NOT BUILDING)

### Forbidden in MVP
- ❌ **Municipality Portal** — No sagsbehandler login; contact info only
- ❌ **Citizen Portal** — No citizen access; support is professional-delivered
- ❌ **Messaging Platform** — No in-app chat; contact via email/phone only
- ❌ **Billing/ERP Integration** — No invoice generation; payroll is separate
- ❌ **Clinical Journal System** — No diagnosis tracking; refer to external systems
- ❌ **Automatic Assignment** — All assignments require human (admin) decision

### Nice-to-Have (Out of Scope for MVP)
- ❌ Mobile app (responsive web for now)
- ❌ SMS notifications (Phase 2)
- ❌ Slack integration (Phase 2)
- ❌ Advanced matching optimization
- ❌ Real-time notifications (Phase 2 — MVP sends transactional email only for 5 operational events)
- ❌ Subscriber-level notification preferences (Phase 2)

---

## PHASE 2: ENHANCEMENTS (Q4 2026, Oct-Dec)

### Timeline: 4-6 weeks, after MVP stability

**Potential features (not committed):**

1. **Municipality Portal (Read-Only)**
   - Sagsbehandler login (future: SSO integration)
   - View own cases only
   - See attendance history (read-only)
   - Download evaluation reports
   - Scope: Lower trust, limited access

2. **Advanced Matching**
   - Location-based scoring
   - Matching algorithm tuning based on outcomes
   - Auto-reject unsuitable candidates
   - Recommendation engine

3. **Notifications & Alerts (expanded)**
   - MVP delivers 5 operational email events via Notification Service (ADR-010, WF-014)
   - Phase 2 expands to remaining event types: PROFESSIONAL_APPROVED, HOURS_APPROVED, HOURS_REJECTED, CASE_ASSIGNED, HANDOVER_INITIATED, DATA_DELETION_SCHEDULED, and others
   - Phase 2 adds subscriber-level notification preferences per user
   - Slack integration (optional)
   - SMS alerts (optional)

4. **Indsatsplan (Support Plan)**
   - Define case goals
   - Track progress toward goals
   - Link sessions to goals
   - Evaluation report auto-generation

5. **Enhanced Admin Dashboard**
   - KPI dashboards (assignments, hours, grant utilization)
   - Reporting by municipality, professional, complexity
   - Workload heatmap (who is overloaded)

---

## PHASE 3: EXPANSION (2027, Q1+)

### Timeline: Future phases (not committed)

**Potential features:**

1. **Real-Time Communication**
   - In-app messaging (sagsbehandler ↔ professional)
   - Encrypted communication archive
   - Notification push (Slack, email)

2. **Outcome Tracking**
   - Pre/post evaluation scores
   - Longitudinal outcome analysis
   - Effectiveness reporting

3. **Mobile App**
   - iOS/Android native apps for professionals
   - Offline session documentation
   - Photo/document capture

4. **Professional Marketplace**
   - Publish available professionals (internal)
   - Auto-match optimization
   - Matching as a service (for other providers)

5. **External Integrations**
   - CPR registry integration (if legal path clear)
   - Healthcare system integration
   - Municipality SSO (SAML, Azure AD)

---

## DEFERRED FEATURES (EXPLICITLY NOT MVP)

**These were considered and explicitly deferred:**

- **Municipality Portal** (Phase 2, may not happen)
- **Citizen Portal** (out of business model, probably never)
- **Messaging Platform** (Phase 3 if needed)
- **Billing/ERP** (separate system, not this product)
- **Clinical Details** (refer to external healthcare systems)
- **Automatic Assignment** (human judgment always required)

---

## SUCCESS METRICS

### MVP Success
- ✅ Data integrity (CaseAssignment single source of truth)
- ✅ Auditability (complete event trail, no gaps)
- ✅ GDPR ready (minimal data, encrypted, 7-year retention)
- ✅ Workload protection (no professional overloaded)
- ✅ Grant control (no surprise budget overruns)
- ✅ Operational safety (explicit workflows, no automatic changes)

### Phase 2 Success
- ✅ Municipality interest (read-only portal adoption)
- ✅ Professional satisfaction (ergonomic portal, low friction)
- ✅ Kursskifte efficiency (admin time saved)

### Phase 3 Success
- ✅ Outcome measurement (can show impact)
- ✅ Platform expansion (multi-municipality at scale)

---

## TECHNOLOGY LIFECYCLE

### MVP (Weeks 1-12, July-September 2026)
- Next.js 15, Tailwind CSS, shadcn/ui
- Supabase PostgreSQL + Auth
- Vercel deployment
- GitHub Actions CI/CD

### Phase 2 (Q4 2026)
- Potential: Background jobs (Bull queue for async tasks)
- Potential: Caching layer (Redis if performance needed)
- Potential: APM monitoring (Sentry, DataDog)

### Phase 3+ (2027+)
- Potential: Mobile framework (React Native)
- Potential: WebSocket for real-time features
- Potential: Kafka for event streaming (if audit scale grows)

---

## EXTERNAL DEPENDENCIES

### Phase 1 (MVP)
- Vercel (deployment)
- Supabase (database, auth, storage, Edge Functions)
- GitHub (version control)
- Resend (transactional email — Notification Service, 6 MVP events)
- Cloudflare Turnstile (CAPTCHA for public intake — WF-015)

### Phase 2
- Potential: Slack API
- Potential: SMS provider (Twilio)
- Potential: Additional email volume scaling (Resend paid tier)

### Phase 3
- Potential: Azure AD / SAML for SSO
- Potential: Healthcare APIs (if integrated)

---

## BUDGET & RESOURCES

### MVP (12 weeks)
- 1 Full-stack engineer (primary developer)
- 1 Architect/reviewer (Claude, async guidance)
- 1 Product owner (Hassan, async decisions)
- Infrastructure: Vercel free tier (~$0-50/month), Supabase free tier (~$0-25/month)

### Phase 2 (4-6 weeks)
- TBD based on feature priority

### Phase 3+
- TBD based on vision evolution

---

## CRITICAL PATH

```
1. Technical Specification APPROVED
   ↓
2. Week 1-2: Supabase migrations + Next.js scaffold
   ↓
3. Week 3-5: Case management (foundations)
   ↓
4. Week 6-7: Professional pool
   ↓
5. Week 8-9: Work tracking (core operations)
   ↓
6. Week 10: Professional changes
   ↓
7. Week 11: Matching
   ↓
8. Week 12: Polish + public launch
   ↓
9. Live at kursskifte.dk (September 30, 2026)
```

**If Technical Specification takes longer:** Entire timeline shifts by same amount.

---

## ASSUMPTIONS

- ✅ Technical Specification approved by July 1, 2026
- ✅ Hassan available for async decisions (48-72h turnaround)
- ✅ No major scope creep during MVP
- ✅ Supabase + Vercel + GitHub infrastructure stable
- ⏳ Municipality interest confirmed (Phase 2 viability)

---

## RISK MITIGATION

### Technical Risk: Supabase RLS Complexity
- Mitigation: Design RLS early, test thoroughly, document policies

### Timeline Risk: Scope Creep
- Mitigation: "No code before Technical Specification" rule locked in
- Mitigation: Phase 2 explicit (not MVP)

### Operational Risk: Grant Control Accuracy
- Mitigation: Comprehensive testing, audit trail for verification

### Compliance Risk: GDPR Retention
- Mitigation: Scheduled cleanup job, audit events immutable

---

## NEXT MILESTONES

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Technical Specification APPROVED | July 1, 2026 | ⏳ PENDING |
| Supabase migrations deployed | July 15, 2026 | ⏳ PENDING |
| Case management MVP | August 1, 2026 | ⏳ PENDING |
| Work tracking MVP | August 20, 2026 | ⏳ PENDING |
| Professional changes complete | September 1, 2026 | ⏳ PENDING |
| Public launch | September 30, 2026 | ⏳ PENDING |

---

**Document by:** Kursskifte ApS — Product Management  
**Approved by:** Hassan  
**Status:** MVP ROADMAP LOCKED  
**Next Review:** When MVP launches (Sept 30, 2026)
