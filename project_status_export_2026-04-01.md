# TOEFL Build a Sentence — Project Status Export
**Exported:** 2026-04-01  
**Project Phase:** Phase 2 Student Management (Tasks 1-2 Complete)

---

# Table of Contents
1. [Current State](#1-current-state)
2. [Decision Log](#2-decision-log)
3. [Next Task](#3-next-task)
4. [Open Bugs](#4-open-bugs)

---

# 1. Current State

## Implemented
- Student home page (`/`) with daily goal progress and assigned practice sets list
- Practice session (`/practice/[id]`) with 10-question sentence builder
- Results page (`/result/[id]`) showing score, feedback, and grammar tips
- Retry mode (`/retry/[id]`) for wrong answers from previous attempts
- Teacher config page (`/teacher`) for assigning sets and setting daily requirements
- **Teacher result detail page with three-layer structure:**
  - Initial Attempt (immutable first full attempt)
  - Latest Retry (separate retry result or empty state)
  - Current Status (merged result after retries)
  - Representative items review (up to 3 items with comparison)
- Practice set completion tracking via localStorage
- Retry workflow with merged result display

## Phase 1B — Auth Foundation (Completed)
- Session-based authentication with iron-session
- Password hashing with bcryptjs
- Auth utilities: `lib/auth/password.ts`, `lib/auth/session.ts`, `lib/auth/user.ts`
- API routes: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Login page (`/login`) with demo accounts
- Unauthorized page (`/unauthorized`) for access denied
- Middleware for lightweight route protection
- Seed script with bcrypt-hashed passwords for test accounts
- Server mode activated (no more static export)

## Partial / Mocked
- All practice sets are mock data (`data/mock/practiceSets.ts`)
- User identity is hardcoded (Alex Chen, student) - auth is ready for integration
- Records stored in localStorage only
- Backend API for auth is functional in server mode

## Not Built
- Phase 2 remaining: Student activation/deactivation, password reset, student detail page
- Phase 3: Assignment System
- Phase 4: Topic Organization
- Phase 5: Sample Items
- Phase 6: Multi-Student History & Student Detail
- Password reset
- Email verification
- Student self-registration
- OAuth/social login
- Analytics or progress history beyond current device
- Export/sharing of results

## Last Updated
- 2026-04-01
- Phase 2 Task 2 (POST /api/teacher/students) complete

## V2 Phase Structure (Approved)
- Phase 1A: Database Foundation ✓
- Phase 1B: Auth Foundation ✓
- Phase 2: Student Management (Tasks 1-2 Complete)
- Phase 3: Assignment System
- Phase 4: Topic Organization
- Phase 5: Sample Items
- Phase 6: Multi-Student History & Student Detail

## SessionData Shape
```typescript
type SessionData =
  | {
      isLoggedIn: true;
      userId: string;
      email: string;
      role: "TEACHER";
      teacherId: string;
      studentId?: never;
    }
  | {
      isLoggedIn: true;
      userId: string;
      email: string;
      role: "STUDENT";
      studentId: string;
      teacherId?: never;
    }
  | {
      isLoggedIn: false;
    };
```

## Agreed Phase 1A Data Rules
- Assignment must allow repeated assignment of the same practice set to the same student over time.
- PracticeAttempt must support:
  - full_attempt
  - retry_attempt
  - sourceAttemptId
  - optional assignmentId linkage

## Auth Foundation Status
- Server mode is now active.
- Static export mode has been removed for v2 runtime auth support.
- Session-based authentication is implemented.
- Login route, logout route, and current-user route are implemented.
- Lightweight middleware route protection is implemented.
- Runtime auth testing passed for:
  - valid teacher login
  - valid student login
  - invalid password
  - non-existent user
- Existing page data source remains unchanged:
  - current student pages still use mock/localStorage flow
  - current teacher page still uses existing mock/localStorage flow

## Session Rules Now Implemented
- Teacher session carries teacherId
- Student session carries studentId
- SessionData uses the approved discriminated union form

## Current Phase Boundary
- Phase 2 is in progress
- Phase 2 Task 1 complete: GET /api/teacher/students endpoint
- Phase 2 Task 2 complete: POST /api/teacher/students endpoint
- Schema updated with Student.isActive field
- Shared Prisma client module created
- Assignment UI is not the next task yet

## Phase 2 Task 2 Completed
- POST /api/teacher/students endpoint implemented
- Request body: `{ name: string, email: string }`
- Response: `{ student: { id, name, email, isActive }, temporaryPassword: string }`
- Features:
  - Atomic User + Student creation via Prisma transaction
  - Input validation (name required, email format)
  - Email uniqueness enforcement (409 Conflict)
  - Teacher-only access (403 Forbidden)
  - Temporary password generation (10 chars, alphanumeric)
  - Password hashed with bcrypt before storage

---

# 2. Decision Log

## 2026-03-31 — Static Export
- **Decision:** Use Next.js static export (`output: "export"`) for simple deployment.
- **Rationale:** No server-side logic needed; all data is mock/localStorage.

## 2026-03-31 — Zustand for State
- **Decision:** Use Zustand instead of React Context for practice session state.
- **Rationale:** Simpler boilerplate, better performance for frequent word-bank updates.

## 2026-03-31 — Apple-Style UI
- **Decision:** Custom Tailwind palette + hand-rolled components instead of shadcn/ui.
- **Rationale:** Lightweight, no extra dependency tree, full visual control.

## 2026-03-31 — Teacher Detail Three-Layer Structure
- **Decision:** Show Initial Attempt → Latest Retry → Current Status in fixed order.
- **Rationale:** Teachers need to understand student progression from baseline → retry effort → final state. Initial Attempt must never be overwritten to preserve original performance baseline.

## 2026-03-31 — Initial Attempt is Immutable
Decision:
- Initial Attempt is always derived from the earliest chronological `full_attempt`
- It must never be inferred from merged data
- It must never be overwritten by retry data
- It must never be affected by Current Status data

Reason:
- Teacher diagnosis needs a stable baseline.

Impact:
- Any future data refactor must preserve this rule.
- Teacher detail and future analytics must treat Initial Attempt as read-only baseline.

## 2026-03-31 — Teacher Detail Remains Restrained
Decision:
- Keep teacher detail visual style restrained
- Use neutral cards, light theme, subtle borders/shadows, and one blue accent only
- Do not introduce multi-color dashboard styling, charts, or extra interaction patterns

## 2026-03-31 — Approve v2 Stage Transition
Decision:
- Move from v1 functional prototype to v2 single-teacher internal tool.

## 2026-03-31 — Split v2 Foundation into Phase 1A and Phase 1B
Decision:
- Phase 1A = database foundation
- Phase 1B = auth foundation

## 2026-03-31 — Phase 1B Auth Foundation Complete
Decision:
- Implement session-based authentication using iron-session
- Use bcryptjs for password hashing
- Create auth utilities (password.ts, session.ts, user.ts)
- Create API routes for login/logout/me
- Create login and unauthorized pages
- Implement middleware for route protection
- Update seed.ts with real bcrypt hashes
- Activate server mode (remove static export)
- Use discriminated union for SessionData type safety

Test Accounts:
- teacher@example.com / password123
- alex@example.com / password123
- sam@example.com / password123

## 2026-04-01 — Phase 2 Task 1 Complete: Teacher Student List API
Decision:
- Added `isActive` boolean field to Student model with default `true`
- Created shared Prisma client module at `lib/prisma.ts`
- Refactored `lib/auth/user.ts` to use shared Prisma client
- Implemented `GET /api/teacher/students` endpoint with:
  - JSON 401 for unauthenticated requests
  - JSON 403 for non-teacher requests
  - Teacher isolation: only returns students where `teacherId = session.teacherId`
  - Assignment count included in response

## 2026-04-01 — Phase 2 Task 2 Complete: Create Student API
Decision:
- Implemented POST /api/teacher/students endpoint
- Added `generateTemporaryPassword()` helper to `lib/auth/password.ts`
  - Uses `crypto.randomBytes` for secure randomness
  - Generates 10-character alphanumeric passwords
- Request body: `{ name: string, email: string }`
- Response shape:
  ```typescript
  {
    student: {
      id: string;
      name: string;
      email: string;
      isActive: boolean;
    };
    temporaryPassword: string; // Top-level, shown once
  }
  ```
- Implementation details:
  - Atomic User + Student creation via `prisma.$transaction()`
  - Early email uniqueness check + transaction-level P2002 handling
  - Password hashed with bcrypt before storage
  - Session.teacherId used directly for Student.teacherId
  - Input validation: name trimmed/non-empty, email trimmed/lowercase/valid format

---

# 3. Next Task

## Title
Phase 2 — Student Management Implementation

## Type
implementation

## Status
Task 2 COMPLETE — POST /api/teacher/students endpoint implemented

## Completed in This Session (Task 2)
1. ✅ Added `generateTemporaryPassword()` to `lib/auth/password.ts`
2. ✅ Implemented POST handler in `app/api/teacher/students/route.ts`
3. ✅ Atomic User + Student creation via Prisma transaction
4. ✅ Input validation (name, email)
5. ✅ Email uniqueness check (409 for duplicates)
6. ✅ Teacher-only access control (403 for non-teachers)
7. ✅ Return temporaryPassword at top level (shown once)
8. ✅ Verified created student can login with temporary password
9. ✅ Build passes

## Next Task (Phase 2 Task 3)
To be determined — possible options:
- PATCH /api/teacher/students/[id] for activation/deactivation
- /teacher/students UI page (list view)
- /teacher/students/add UI page (add student form)

## Context
- Phase 1A (Database Foundation): ✅ Complete
- Phase 1B (Auth Foundation): ✅ Complete
- Phase 2 Task 1 (List Students API): ✅ Complete
- Phase 2 Task 2 (Create Student API): ✅ Complete

## Files Added/Modified in Task 2
- `lib/auth/password.ts` — Added generateTemporaryPassword()
- `app/api/teacher/students/route.ts` — Added POST handler

---

# 4. Open Bugs

## Recently Checked
- no-retry state
- retry state
- Initial Attempt immutability
- teacher list regression
- production build

All passed in the latest verification round.

## Phase 1B Verification
No confirmed open bug is recorded after the final Phase 1B correction round.

### Verified
- discriminated-union session shape restored
- redundant bcrypt type package removed
- workflow phase naming corrected
- server mode activated
- login works at runtime
- logout route available
- middleware redirects functional
- existing page data source unchanged

---

*End of Status Export*
