# Technical Specifications

**Last Updated:** June 27, 2026  
**Specification Strategy:** Vertical Completion (One to 95/100+ quality before moving to next)

---

## STATUS OVERVIEW

### ✅ APPROVED & FROZEN

**TS-001: Database Specification**
- File: `TECHNICAL_SPECIFICATION_PHASE_1_DATABASE.md`
- Status: **APPROVED - IMPLEMENTATION-READY (99/100)**
- Date Approved: June 27, 2026
- Quality Level: Production-ready
- Code Readiness: No modifications allowed except critical defects discovered during implementation
- Contains: 19 tables, 35+ FKs, 73+ RLS policies, XSalsa20-Poly1305 encryption strategy, 21 migrations

**What this means:**
- ✅ Database schema is complete and correct
- ✅ Ready for implementation (can write code now)
- ✅ All constraints documented and verified
- ✅ Migration strategy complete
- ⛔️ NO CHANGES to TS-001 unless implementation reveals a concrete defect

---

### ⏸️ NOT YET APPROVED

**TS-002 through TS-007 are DRAFTS and NOT APPROVED**

These specifications are in the `_drafts/` folder and must NOT be used for implementation until they:

1. Pass complete audit (missing sections, TBD content, pseudocode)
2. Pass implementation-readiness review (constraints, indexes, edge cases)
3. Receive explicit approval from Hassan
4. Are moved from `_drafts/` to this folder

**Current Draft Files in `_drafts/`:**

| File | Phase | Status | Ready for Code? |
|------|-------|--------|-----------------|
| TECHNICAL_SPECIFICATION_PENDING.md | Template | NOT STARTED | ⛔️ NO |
| TECHNICAL_SPECIFICATION_PHASE_2_API.md | API Design | DRAFT (Incomplete) | ⛔️ NO |
| TECHNICAL_SPECIFICATION_PHASE_3_BACKEND.md | Backend Logic | DRAFT (Incomplete) | ⛔️ NO |
| TECHNICAL_SPECIFICATION_PHASES_4-7.md | Frontend/Deploy | DRAFT (Incomplete) | ⛔️ NO |

---

## SPECIFICATION QUALITY GATES

All Technical Specifications must pass these gates before approval:

### Gate 1: Completeness Audit
- ✅ No TODO, TBD, or "to be determined" placeholders
- ✅ No pseudocode (production-ready SQL/code only)
- ✅ No abbreviated sections (full explanations required)
- ✅ All edge cases documented
- ✅ All constraints defined
- ✅ All enums/types consistent

### Gate 2: Implementation-Readiness Review
- ✅ Missing SQL constraints identified
- ✅ Missing foreign keys verified
- ✅ Missing indexes identified for query patterns
- ✅ Missing unique constraints identified
- ✅ Nullable fields reviewed
- ✅ Cascade behavior verified
- ✅ Audit consistency checked
- ✅ Timestamp consistency checked
- ✅ Security risks identified
- ✅ Performance risks identified
- ✅ Data integrity risks identified

### Gate 3: Explicit Approval
- ✅ Hassan reviews and approves (email or conversation)
- ✅ Document is frozen (no further changes before code)
- ✅ Quality score is 95/100 or higher

---

## WHY DRAFTS ARE SEPARATED

Earlier incomplete draft files were created before we switched to **vertical specification strategy** (one spec to 95/100+ quality before moving to next).

These drafts are **NOT AUTHORITATIVE** and must not be used for implementation because:

1. **Incomplete** - Contain TBD sections and pseudocode
2. **Unapproved** - Did not pass quality gates or implementation review
3. **Outdated** - May conflict with Architecture v1.0 or TS-001 decisions
4. **Dangerous** - Using incomplete specs can lead to implementation mistakes

**No code should be written from any draft specification.**

---

## DEVELOPMENT WORKFLOW

For each new Technical Specification:

```
1. START (TS-002, TS-003, etc.)
   └─ Placed in _drafts/ folder while in progress
   └─ No code is written

2. COMPLETE (95/100+ quality)
   └─ No TODO/TBD/pseudocode
   └─ All sections detailed
   └─ Edge cases documented

3. AUDIT
   └─ Completeness audit
   └─ Implementation-readiness review
   └─ Score improvement if needed

4. APPROVE
   └─ Hassan explicitly approves
   └─ Moved from _drafts/ to main folder
   └─ Frozen (no changes before code)

5. IMPLEMENT
   └─ Code written to approved spec
   └─ Only critical defects may trigger TS changes
```

---

## CRITICAL RULES

### Do NOT:
- ⛔️ Write code from a draft specification
- ⛔️ Modify TS-001 unless defect is discovered during implementation
- ⛔️ Use draft specifications without Hassan approval
- ⛔️ Create new architecture without Architecture approval

### Do:
- ✅ Complete each specification to 95/100+ before moving to next
- ✅ Pass implementation-readiness review before approval
- ✅ Freeze specifications after approval
- ✅ Document all constraints, indexes, and edge cases
- ✅ Wait for explicit approval before implementation

---

## CURRENT PHASE

**Status:** TS-001 Approved and Frozen  
**Next Step:** TS-002 API Specification (when ready)

TS-001 Database can proceed to implementation immediately.

TS-002 through TS-007 are planned but not yet started. They will be completed one at a time using the vertical specification strategy.

---

## APPROVAL HISTORY

| Specification | Approved Date | Quality Score | Status |
|---------------|---------------|---------------|--------|
| TS-001 Database | June 27, 2026 | 99/100 | ✅ APPROVED & FROZEN |
| TS-002 API | — | — | ⏳ PENDING START |
| TS-003 Backend | — | — | ⏳ PENDING START |
| TS-004 Frontend | — | — | ⏳ PENDING START |
| TS-005 Security | — | — | ⏳ PENDING START |
| TS-006 Matching Engine | — | — | ⏳ PENDING START |
| TS-007 Deployment | — | — | ⏳ PENDING START |

---
