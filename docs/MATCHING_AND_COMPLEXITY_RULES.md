# Architecture Separation Plan
## Launch Website vs Kursskifte Match 2.0

**Date:** June 27, 2026  
**Status:** APPROVED  
**Version:** 1.0 (V2 Final)

---

## EXECUTIVE SUMMARY

The launch package (`kursskifte-launch/`) is a **temporary static website** for marketing, recruitment, and initial contact capture.

**Kursskifte Match 2.0** is a **single unified Next.js application** with Supabase backend for case management and professional operations.

These are completely separate systems with no shared code or database.

---

## LAUNCH WEBSITE (TEMPORARY)

### Current State (Netlify)
- Static HTML (homepage, recruitment page, privacy policy)
- Netlify Forms contact capture → email
- Tally form for professional recruitment → email
- Optional basic HTTP auth demo
- **Lifetime:** 3-6 months (until Match 2.0 public site is live)
- **URL:** kursskifte.dk (temporary)

### Content Reused in Match 2.0
- Color palette, typography, design tokens
- Logo, branding assets
- Homepage copy & messaging
- Professional recruitment copy
- Privacy policy text

### Content NOT Reused
- Static HTML files (discarded)
- localStorage demo data (never production)
- Netlify Forms workflow (replaced by API)
- Tally temporary integration (eventual webhook only)
- Basic HTTP auth (replaced by Supabase Auth)

---

## MATCH 2.0 UNIFIED APPLICATION

### Architecture
```
Single Next.js Application
├─ /(public)/         Public website (reused branding from launch)
├─ /admin/            Admin portal (Kursskifte staff)
├─ /pro/              Professional portal (fagperson)
├─ /api/              API routes
├─ /components/       Shared UI
├─ /lib/              Domain logic, auth, services
├─ /supabase/         Migrations, RLS, audit functions
└─ /docs/             Architecture & decisions
```

### Backend
- **Supabase (PostgreSQL + Auth + RLS)**
- One database, one auth model, one deployment
- No separate backend service

### Domains
- kursskifte.dk (primary, public site)
- admin.kursskifte.dk (admin portal, via Vercel alias)
- portal.kursskifte.dk (professional portal, via Vercel alias)

### Authentication
- Supabase Auth (email/password, MFA-ready)
- Two roles: admin, professional
- No sagsbehandler users (contact info only)
- No citizen users (no citizen portal in MVP)

---

## REUSABLE DESIGN SYSTEM

### What Gets Extracted
```
Color Palette:
  --ink: #1a2e24
  --gold: #a07a3d
  --green-dark: #1a3a2a
  --cream: #faf8f3
  (all custom properties)

Typography:
  Serif: Instrument Serif (headlines)
  Sans: DM Sans (body)
  Scale: defined sizes & weights

Components:
  Buttons (primary, ghost, warm, outline)
  Cards & containers
  Hero sections
  Navigation
  Form inputs
  Modals

Spacing & Layout:
  Grid system (1200px max-width)
  Responsive breakpoints
  Padding/margin scale
```

### Implementation in Match 2.0
```
/shared/design-system/
├─ colors.ts
├─ typography.ts
├─ tailwind.config.js (custom colors, fonts)
└─ README.md

All routes (/(public)/, /admin/, /pro/) use same design tokens.
Consistency enforced at build time.
```

---

## CONTENT MIGRATION

### Homepage Content
Migrate from launch HTML to Match 2.0 `/(public)/page.tsx`:
- Hero section (value proposition, services)
- Service cards (what Kursskifte does)
- FAQ section
- CTA buttons

### Professional Recruitment Page
Migrate from `bromaking.html` to `/pro/register` (eventually):
- Recruitment messaging
- Process explanation
- Application form (Tally initially, native form in Phase 2)

### Privacy Policy
Migrate from static HTML to `/privatlivspolitik/page.tsx`:
- GDPR compliance text
- Data handling procedures
- Contact information

### Contact Form
Migrate from Netlify Forms to `/api/forms/contact`:
- Form submission handler
- Inquiry creation
- Email notification

---

## MIGRATION TIMELINE

### Phase 1: Development (Weeks 1-8)
- Launch site: Still live on Netlify
- Match 2.0: Built in private repo
- Result: kursskifte.local:3000 fully functional

### Phase 2: Staging & Prep (Weeks 9-10)
- Launch site: Still live
- Match 2.0: Deployed to staging (private Vercel)
- Data migration scripts: Created & tested
- Result: Staging environment production-ready

### Phase 3: Internal Launch (Week 11)
- Launch site: Still live
- Match 2.0: Live at admin.kursskifte.dk (internal only)
- Kursskifte staff: Begins using admin portal
- First cases: Migrated manually
- Result: Internal validation complete

### Phase 4: Public Launch (Week 12)
- Launch site: Archived, DNS points to Vercel
- Match 2.0: Live at kursskifte.dk (public site)
- All data: Migrated from Netlify/Tally
- Result: Public site served from Match 2.0 Next.js app

### Phase 5: Sunset (Weeks 13+)
- Netlify deployment: Archived
- Netlify Forms: Disabled
- Tally forms: Disabled (or webhook integration in place)
- Result: All traffic served from Match 2.0

---

## DEPLOYMENT SEPARATION

### Launch Site (Netlify)
```
Git: kursskifte-launch/ (separate repo)
Build: Static HTML (no code)
Deploy: Drag-drop to Netlify, or git push → auto-deploy
Storage: None (forms → email)
Database: None
```

### Match 2.0 (Vercel + Supabase)
```
Git: kursskifte-match-2/ (main repo)
Build: Next.js (pnpm build)
Deploy: Vercel (auto on main branch)
Storage: Supabase Storage (signed URLs)
Database: Supabase PostgreSQL
Auth: Supabase Auth
```

---

## NO SHARED CODE

**Critical rule:**

Launch website and Match 2.0 have **zero shared code**, **zero shared database**, **zero shared infrastructure**.

- Separate git repos
- Separate deployment systems
- Separate authentication
- Separate data

This ensures:
- ✅ Launch can be archived without affecting Match 2.0
- ✅ Match 2.0 development unblocked by launch changes
- ✅ Data clean separation (no residual launch data)

---

## PHASED SUNSET

**When Match 2.0 is live:**

1. **Week 1:** Launch site still live, document archived
2. **Week 2:** Verify all traffic moved to Match 2.0
3. **Week 3:** Netlify deployment archived (kept in git for reference)
4. **Week 4+:** Netl​ify account can be cancelled

**Data kept:**
- Git history of launch site (for reference)
- Backup of all contact/inquiry data (migrated to Match 2.0)
- Backup of Tally responses (migrated to professionals table)

---

## SUMMARY

| Aspect | Launch | Match 2.0 |
|--------|--------|-----------|
| Purpose | Marketing, recruitment | Case management, operations |
| Database | None | PostgreSQL (Supabase) |
| Auth | Basic HTTP auth (demo) | Supabase JWT + RBAC |
| Hosting | Netlify (static) | Vercel (Next.js) |
| Lifetime | 3-6 months | Indefinite |
| Deployment | Manual/Netlify | Auto via git |
| Reusable | Design system, messaging | Not applicable |
| Discard | All HTML/CSS/JS | Not applicable |

---

**Document by:** Kursskifte ApS — Architecture  
**Approved by:** Hassan  
**Status:** FINALIZED  
**Reference:** Master Directive
