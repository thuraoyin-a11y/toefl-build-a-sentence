# Decision Log

## 2026-04-08 — Final Project Closeout

### Decision
- Project closed with GO judgment after final verification.
- All phases (1A through 6) complete and verified.
- No blocking issues remain.

### Reason
- Student entry path functional: login → home → assigned sets → practice
- Teacher monitoring views operational: student list, detail, assignments, attempts, timeline, activity
- Build passes with no errors
- All API endpoints return correct data with real database UUIDs
- Previously blocking student home assignment display issue resolved

### Key Architecture in Final State
- **PracticeSet-SampleItem relationship**: JSON ID array in PracticeSet.questions
- **Assignment completion**: Frontend sync to database with blocking on failure
- **Student home data flow**: API returns embedded practiceSet objects; UI renders real data
- **Auth**: Session-based with iron-session, discriminated union SessionData type
- **Teacher views**: Shared types in lib/teacher/types.ts, shared mappers in lib/teacher/mappers.ts

### Accepted Non-Blocking Limitations
1. Result page pre-renders with mock paths (runtime uses real UUIDs)
2. Mock data remains in codebase for backward compatibility
3. Password reset not implemented
4. Email verification not implemented
5. Student self-registration not implemented
6. Analytics limited to current history views
7. Export/sharing not implemented

### Impact
- Project is closed and archived.
- Future work begins as new project/phase, not continuation of current task.

---

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

## 2026-03-31
### Initial Attempt is immutable
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

## 2026-04-02
### Phase 3 Task 6 Accepted: Assignment Completion Sync

Decision:
- Phase 3 Task 6 accepted.
- Assignment completion has progressed from "field exists" to persistent synchronization in the real user path.
- Completion failure blocks the normal completion flow (error shown, retry allowed).
- Retry flow does not trigger assignment completion sync.

Reason:
- Assignment completion must be reliably persisted when a student finishes a practice set.
- Blocking the flow on sync failure ensures data consistency and user awareness.
- Retry mode is a separate remediation path and should not affect assignment state.

Impact:
- Phase 3 is now complete.
- The project moves into Phase 4 preparation.

---

## 2026-03-31
### Teacher detail remains restrained, not dashboard-style
Decision:
- Keep teacher detail visual style restrained
- Use neutral cards, light theme, subtle borders/shadows, and one blue accent only
- Do not introduce multi-color dashboard styling, charts, or extra interaction patterns in this task

Reason:
- Current teacher side is still a minimal result view, not a full analytics product.

Impact:
- Future teacher enhancements must stay aligned with the current first-version style unless the product stage is explicitly redefined.

---

## 2026-03-31
### Teacher detail task is closed
Decision:
- The teacher detail three-layer result enhancement is complete for this phase

Verification:
- Manual test passed
- `npm run build` passed
- Teacher list behavior remained stable

Impact:
- This task should not continue in the current session
- The next task should move to a separate planning session
---

## 2026-03-31
### Approve v2 stage transition
Decision:
- Move from v1 functional prototype to v2 single-teacher internal tool.

Reason:
- The product now needs real login, real persistence, and multi-student task management.

Impact:
- Future work is no longer limited to pure frontend mock/localStorage flow.
- V2 must still stay below institution-platform scope.

---

## 2026-03-31
### Split v2 foundation into Phase 1A and Phase 1B
Decision:
- Phase 1A = database foundation
- Phase 1B = auth foundation

Reason:
- Database setup and auth setup should not be mixed into one implementation task.

Impact:
- The next coding session will only implement database foundation.
- Auth, login, route protection, and middleware are deferred to Phase 1B.

---

## 2026-03-31
### Define Phase 1A schema boundary
Decision:
- Phase 1A must include these six entities:
  - User
  - Teacher
  - Student
  - PracticeSet
  - Assignment
  - PracticeAttempt
- Phase 1A must not include auth, API routes, UI, or middleware.
- Database operations stay separate from build operations.

Reason:
- These six entities form the minimum persistent data structure for the core learning flow.

Impact:
- Phase 1A focuses on schema, migration, seed data, and db scripts only.
- Build script remains unchanged.

---

## 2026-03-31
### Allow repeated assignments of the same set
Decision:
- Assignment must allow the same practice set to be assigned to the same student multiple times over time.
- Do not use a uniqueness constraint that blocks repeated assignment instances.

Reason:
- Real teaching use requires review, repetition, and re-assignment.

Impact:
- Assignment is treated as a task instance, not a one-time student-set pair.

---

## 2026-03-31
### Link practice attempts to assignment instances when applicable
Decision:
- PracticeAttempt includes optional assignment linkage.
- PracticeAttempt must preserve v1 retry semantics:
  - full_attempt
  - retry_attempt
  - sourceAttemptId

Reason:
- Attempts should be traceable to the specific assignment that produced them.

Impact:
- Future teacher/student history and assignment completion views can remain consistent.

---

## 2026-03-31
### Phase 1B Auth Foundation Complete
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

Reason:
- Auth infrastructure needed for v2 operation.
- Session-based auth is simple and appropriate for single-teacher internal tool.
- Middleware provides lightweight route protection without database queries.
- Server mode required for API routes and middleware to function.

Impact:
- Auth infrastructure is ready and testable at runtime.
- Build outputs to `.next/` for server deployment.
- Pages continue using mock data until Phase 2-6 integration.

V2 Phase Structure (Approved):
- Phase 1A: Database Foundation ✓
- Phase 1B: Auth Foundation ✓
- Phase 2: Student Management
- Phase 3: Assignment System
- Phase 4: Topic Organization
- Phase 5: Sample Items
- Phase 6: Multi-Student History & Student Detail

SessionData Shape (Discriminated Union):
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

Test Accounts:
- teacher@example.com / password123
- alex@example.com / password123
- sam@example.com / password123
---

## 2026-03-31
### Complete Phase 1B Auth Foundation
Decision:
- Mark Phase 1B as complete.

Reason:
- Session-based auth is implemented and testable at runtime.
- Login/logout/current-user flow exists.
- Middleware route gating is active.
- Existing page data source remains unchanged.

Impact:
- The project can now move from auth foundation to Phase 2 planning.
- Future feature work can assume authenticated teacher and student roles exist.

---

## 2026-03-31
### Move v2 runtime from static export to server mode
Decision:
- Remove static export configuration for v2 runtime auth support.

Reason:
- API routes and runtime session auth require server mode.

Impact:
- Auth can now be tested with `npm run dev` or `npm start`.
- V2 runtime no longer depends on static export deployment assumptions.

---

## 2026-03-31
### Keep current page data source unchanged during Phase 1B
Decision:
- Do not connect current pages to real database data during Phase 1B.

Reason:
- Phase 1B is auth foundation only.
- Data integration was intentionally deferred.

Impact:
- Current pages continue to use mock/localStorage.
- Phase 2 and later phases will handle progressive data integration.

---

## 2026-03-31
### Confirm approved v2 phase structure after Phase 1B
Decision:
- Use this phase order:
  - Phase 1A: Database Foundation
  - Phase 1B: Auth Foundation
  - Phase 2: Student Management
  - Phase 3: Assignment System
  - Phase 4: Topic Organization
  - Phase 5: Sample Items
  - Phase 6: Multi-Student History & Student Detail

Reason:
- Keep implementation order stable and avoid ad hoc phase renaming.

Impact:
- Next task planning must stay inside Phase 2 only.

---

## 2026-04-01
### Phase 2 Task 1 Complete: Teacher Student List API

Decision:
- Added `isActive` boolean field to Student model with default `true`
- Created shared Prisma client module at `lib/prisma.ts`
- Refactored `lib/auth/user.ts` to use shared Prisma client
- Implemented `GET /api/teacher/students` endpoint with:
  - JSON 401 for unauthenticated requests
  - JSON 403 for non-teacher requests
  - Teacher isolation: only returns students where `teacherId = session.teacherId`
  - Assignment count included in response

Reason:
- Shared Prisma client prevents duplicate instantiation
- API auth errors return JSON (not redirects) for proper client handling
- Teacher isolation is critical for multi-tenant data security

Impact:
- Phase 2 Task 1 is complete
- Schema migration applied successfully
- Build passes
- Next: Phase 2 Task 2 (POST /api/teacher/students)

---
---

## 2026-04-01
### Phase 2 Task 2 Complete: Create Student API

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

Reason:
- Teacher-managed student creation requires secure temporary password generation
- Atomic transaction ensures data consistency (no orphaned User records)
- Top-level temporaryPassword ensures visibility in response and not stored

Impact:
- Teachers can now create students via API
- Created students can immediately login with temporary password
- Phase 2 Task 2 is complete
- Build passes
- Next: Phase 2 Task 3 (TBD)

---

## 2026-04-03
### Phase 5 Task 8 Accepted: PracticeSet Integration Strategy Decision

Decision:
- PracticeSet will store SampleItem IDs as a JSON array in the existing `PracticeSet.questions` field.
- No Prisma schema migration is required now.
- When serving a practice session, the system will:
  1. Parse the ID array from `questions`.
  2. Query the corresponding `SampleItem` records by ID.
  3. Map `SampleItem` fields to the frontend `Question` shape.
- This aligns with the existing frontend `PracticeSet.questionIds: string[]` type and requires zero schema changes.
- Schema migration to a formal join table is deferred until referential integrity or complex querying becomes a hard requirement.

Task 9 Enforcement Rule:
- Only `isSelfReviewed === true` SampleItems may be written into the `PracticeSet.questions` ID list.
- This must be enforced at the PracticeSet create/update integration point, or any other write path that composes the PracticeSet item list.

Future Implementation Order:
1. Update seed script to create SampleItems and store their IDs in PracticeSet.questions.
2. Implement a PracticeSet read API that parses the stored SampleItem ID array and resolves SampleItems into the frontend Question shape.
3. Wire the practice page to the new API instead of mock data.
4. Implement teacher PracticeSet creation flow.
5. Enforce the self-reviewed rule at PracticeSet write points.

Compatibility Impact:
- Existing seeded PracticeSets contain old-format full-object JSON in `questions`. Since no production code reads this field today, there is no immediate runtime breakage. Old seeded data must be regenerated or migrated before the fetch API goes live.
- Assignment APIs remain fully compatible; they only validate `practiceSetId` existence and return metadata.

Risks:
- Old seed data will fail to parse as ID arrays when the read API is implemented. Mitigation: update seed script before or alongside the read API.
- Future migration to a join table may be needed if "find all practice sets containing a sample item" becomes required.

Impact:
- Phase 5 Task 8 is complete.
- The project is ready to proceed to Phase 5 Task 9 implementation.

---

## 2026-04-03
### Phase 5 Closure

Decision:
- Phase 5 is now complete.
- All remaining Phase 5 tasks have been implemented and accepted:
  1. Seed/data alignment for PracticeSet.questions (SampleItem ID arrays)
  2. Teacher PracticeSet creation flow (POST /api/teacher/practice-sets with ownership)
  3. Reviewed-only enforcement (two-step validation: existence/ownership → reviewed status)
- Phase 6 (Multi-Student History & Student Detail) is the next active phase.

Phase 6 Planned Sequence:
1. Student overview expansion
2. Single-student assignment history
3. Single-student attempt history
4. Single-student combined timeline
5. Multi-student recent activity list
6. Teacher-side cross-student history filter
7. Student detail data-structure consolidation

Reason:
- Phase 5 objectives have been achieved: SampleItem system is complete with self-review workflow, PracticeSet integration uses ID array format, and reviewed-only enforcement is active at the write path.

Impact:
- Project state files updated (current_state.md, next_task.md, decision_log.md).
- Phase 6 planning can now begin.

---

## 2026-04-08 — Student Home Assignment Display Fix (Closeout Blocker Resolution)

### Decision
- Fixed student home page to display assigned practice sets correctly using real database data.
- Modified `/api/student/assignments` to include full `practiceSet` object in response.
- Modified `app/page.tsx` to use practice set data from API instead of mock data.

### Reason
- Critical bug: Student home used mock practice sets with IDs like `set001/set002/set003`, but assignment API returned database UUIDs.
- Result: Assigned practice sets never displayed (filter always returned empty array).
- This blocked the core student entry path: login → home → see assigned work → start practice.

### Fix Applied
1. API layer: Added `practiceSet` field with `id`, `title`, `description`, `difficulty`, `questionIds` to assignment response.
2. UI layer: Extract practice sets from assignment response, deduplicate by practiceSetId, render real data.

### Verification
- Student login → assignments API returns correct UUIDs → home displays practice sets → practice set API loads → session works.
- Teacher views show no regression.
- Build passes.

### Impact
- Closeout blocker resolved.
- Project ready for final closeout verification.

---
---

## 2026-04-09 — V2 Architecture: Mock Data Removal Complete

### Decision
- Removed all mock data dependencies from student-facing flows
- Eliminated localStorage fallbacks in result and retry pages
- Teacher config now fetches attempts from API instead of mock records
- Created new `/api/teacher/attempts` endpoint for teacher views

### Files Modified
**Client Components:**
- `app/page.tsx` — API-based completion status (removed mock/practiceSets import)
- `app/result/[id]/page.tsx` — Server-side data fetching, removed mock record loading
- `app/result/[id]/ResultPageClient.tsx` — API-only attempt loading, no localStorage fallback
- `app/result/[id]/components/ResultClient.tsx` — Removed mock imports, accepts questions as prop
- `app/retry/[id]/components/RetryClient.tsx` — API-based source attempt loading
- `app/teacher/components/TeacherConfigClient.tsx` — API-based data loading, removed mock record imports
- `app/teacher/components/SetResultDetail.tsx` — API-based detail fetching
- `app/teacher/page.tsx` — Removed mock teacherConfig import

**Store:**
- `store/practiceStore.ts` — Removed mock data dependencies

**New API:**
- `app/api/teacher/attempts/route.ts` — Teacher endpoint for fetching all student attempts with practice set filter support

### Reason
- V1 architecture relied on mock data and localStorage for student flows
- This created data inconsistency between database (assignments) and client-side storage (attempts)
- Teacher views showed mock records instead of real student attempts
- Need single source of truth (database) for all data

### Architecture Changes
| Flow | Before (V1) | After (V2) |
|------|-------------|------------|
| Student Home | localStorage + mock fallback | API only |
| Result Pages | localStorage + mock fallback | API only |
| Retry Flow | localStorage source attempt | API source attempt |
| Teacher Config | Mock records | API-based attempts |

### Verification
- ✅ Build passes with no TypeScript errors
- ✅ No remaining `@/data/mock` imports in TSX files
- ✅ All student flows use database as source of truth
- ✅ No localStorage fallback in critical paths

### Impact
- **Database is now the single source of truth** for all attempt data
- **Consistent data flow**: Student completes practice → saved to DB → fetched from DB for display
- **Teacher views show real student progress** from database
- **No data inconsistency** between client and server
- Codebase is cleaner with mock data only in legacy seed files

### Accepted Limitations Updated
Removed from accepted limitations:
- ~~Mock data remnants: Still present for backward compatibility but not used in real flows~~

Remaining accepted limitations:
1. Result page static paths: Pre-renders with mock set001/set002/set003 paths; runtime uses real UUIDs
2. Password reset: Not implemented (teacher-managed temporary passwords)
3. Email verification: Not implemented
4. Student self-registration: Not implemented
5. Analytics: Limited to current history views
6. Export/sharing: Not implemented

---

## 2026-04-18 — Remove Hardcoded Demo IDs from Login Route

### Context
After V2 architecture was declared complete, a bug was discovered where students logging in with demo accounts (`alex@example.com`, `sam@example.com`) saw "Practice set not found" when accessing their assigned practice sets.

### Problem
`app/api/auth/login/route.ts` contained a hardcoded demo-account branch that assigned fake IDs like `student-alex-001` to the session. These IDs did not match the UUIDs generated by `prisma/seed.ts` in the database. Consequently, when the practice-set API looked up assignments using `session.studentId`, no records were found and a 404 was returned.

### Decision
Remove the hardcoded demo branch entirely. All login requests now flow through `authenticateUser()`, which:
- Already supports demo accounts via password check (`password123`)
- Queries the database for the real user record
- Returns the actual database UUID for `studentId`/`teacherId`

### Files Changed
- `app/api/auth/login/route.ts` — Removed ~40 lines of hardcoded demo logic

### Impact
- Session IDs now always match database records
- Student practice pages load correctly after login
- No risk of ID drift between seed data and auth logic
- The `authenticateUser()` function in `lib/auth/user.ts` becomes the single source of truth for login validation
