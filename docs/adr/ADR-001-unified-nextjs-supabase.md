# ADR-001: Unified Next.js and Supabase Backend

**Date:** June 2026 (V2 Foundation)  
**Status:** APPROVED  
**Type:** Architectural Decision Record

---

## CONTEXT

Kursskifte Match 2.0 requires a case management platform serving multiple user roles (admin, professionals, eventually municipalities).

**Key Requirements:**
- Serve web portal for admins and professionals
- Manage sensitive case/professional data
- Provide API for future integrations
- Enforce row-level security for data protection
- Deploy quickly with minimal infrastructure management

**Options Considered:**

1. **Unified Next.js + Supabase (Selected)**
   - Single Next.js application
   - Supabase for PostgreSQL + Auth + RLS + Storage
   - Vercel deployment
   - Cost: Minimal (~$50-100/month)

2. **Separate Backend (Django/Node) + Admin Portal + Professional Portal**
   - Custom API server
   - Separate auth system
   - More flexibility for complex logic
   - Cost: Higher ($200-500/month server + more development)
   - Timeline: 2-3x longer

3. **Headless CMS (Contentful/Sanity) + Custom Backend**
   - CMS for content management
   - Custom API for case logic
   - Overkill for case management (not content management)
   - Cost: Moderate

4. **Firebase + Flutter App**
   - Firebase Realtime Database
   - Mobile-first (vs. web-first need)
   - Less control over security model
   - Cost: Low but less suitable

---

## DECISION

**Unified Next.js application with Supabase backend.**

```
Architecture:
  Vercel (deployment)
    ↓
  Next.js App (single codebase)
    ├─ /(public)/     Homepage, recruitment, contact
    ├─ /admin/        Kursskifte staff portal
    ├─ /pro/          Professional portal
    └─ /api/          API routes
    ↓
  Supabase (backend)
    ├─ PostgreSQL (database)
    ├─ Auth (JWT, email/password, MFA-ready)
    ├─ RLS (row-level security)
    └─ Storage (signed URLs for documents)
```

---

## RATIONALE

### Why Not Separate Microservices

**Monolith is better for MVP because:**
1. **Simpler deployment:** One Vercel project, one git repo
2. **Easier auth:** One JWT model, shared Supabase session
3. **Faster development:** No API contract negotiation, no IPC
4. **Easier debugging:** Stack traces span all layers
5. **Can split later:** If data models diverge, can split then
6. **Faster performance:** No network hops between services

### Why Not Custom Backend

**Supabase RLS is better because:**
1. **Database-level security:** No app-logic bugs can expose data
2. **No custom auth:** Use proven Supabase Auth
3. **Less code:** RLS policies vs. custom auth middleware
4. **Faster:** RLS enforced before data touches application
5. **Simpler compliance:** Supabase is GDPR-compliant out-of-box

### Why Not Headless CMS

**Match 2.0 is case management, not content management.**
- Contentful/Sanity designed for content (blog posts, pages)
- Case management needs relational database (not document store)
- Overkill and wrong tool

### Why Not Firebase

**PostgreSQL + RLS better for this domain:**
1. **Relational integrity:** Foreign keys, constraints
2. **Complex queries:** Case workload calculation, audit reports
3. **RLS:** Firebase doesn't have database-level RLS like Postgres
4. **Compliance:** Postgres more compliant with GDPR audit needs
5. **Web-first:** Not mobile-first design

---

## CONSEQUENCES

### Positive Consequences

✅ **Fast initial development** (no backend code to write)  
✅ **Minimal infrastructure** (managed Supabase)  
✅ **Security at database level** (RLS enforced before app logic)  
✅ **Simple authentication** (Supabase Auth handles it)  
✅ **Easy scaling** (Vercel auto-scales)  
✅ **Lower cost** (~$50-100/month vs. $200+)  
✅ **Shorter MVP timeline** (12 weeks feasible)

### Negative Consequences

❌ **Cannot scale services independently** (all deploy together)  
❌ **Coupled deployment** (must test all routes together)  
❌ **Limited to Supabase ecosystem** (vendor lock-in, but acceptable for MVP)  
❌ **Harder to test async jobs** (may need background workers Phase 2)  
❌ **Cannot have separate admin and professional services**

### Mitigation

**If monolith becomes problem:**
- Phase 2: Extract /api to separate service (if load justifies)
- Phase 2: Extract async jobs to background workers
- Phase 3: Evaluate microservices only if genuine scaling issue

---

## IMPLEMENTATION

**Early decision: Cannot change mid-way**
- If this becomes bottleneck, change requires new architecture version (ADR)
- Monitor performance in MVP
- Evaluate at Phase 2 gate

---

## RELATED DECISIONS

- **Domain Model:** Single schema supports single application
- **RLS Policy:** Database-level security relies on Supabase Auth + custom claims
- **Deployment:** Vercel chosen because it integrates with Next.js

---

## REFERENCES

- ARCHITECTURE_SEPARATION_PLAN.md (Launch vs. Match 2.0 split)
- MASTER_DIRECTIVE.md (Technology Stack section)
- DECISION_LOG.md (Decision #1: Unified Next.js)

---

**ADR by:** Kursskifte Architecture  
**Approved by:** Hassan  
**Status:** APPROVED  
**Version:** 1.0
