# Plan: Phase 3 Task 2 — Teacher Assignment List API

## 1. Stage Confirmation
- Current stage: Phase 3 Assignment System
- Current task: Task 2 — Teacher Assignment List API
- Previous task (Task 1: POST /api/teacher/assignments) is complete

## 2. Scope Confirmation
- **In scope:**
  1. Teacher-only GET API for listing assignments
  2. Only return assignments where `teacherId = session.teacherId`
  3. Minimal list response
  4. Use real database via shared Prisma client
  5. Reuse existing auth/session pattern
- **Out of scope:**
  1. No UI changes
  2. No assignment detail API
  3. No student assignment API
  4. No analytics, topics, sample items, or refactoring
  5. No filtering or pagination

## 3. Files Inspected
- `current_state.md` — Confirms Phase 3 Task 1 complete; shared Prisma client exists
- `decision_log.md` — Confirms auth pattern (iron-session, JSON 401/403, teacher isolation)
- `open_bugs.md` — No open bugs
- `next_task.md` — Task 1 complete; Task 2 is next
- `app/api/teacher/assignments/route.ts` — Existing POST handler; auth and Prisma patterns
- `app/api/teacher/students/route.ts` — GET handler pattern for teacher-isolated lists
- `lib/prisma.ts` — Shared Prisma client export
- `prisma/schema.prisma` — Assignment model definition
- `middleware.ts` — API routes are not gated by middleware (matcher excludes `api/`)

## 4. Real Source Findings
- The existing `app/api/teacher/assignments/route.ts` contains only a `POST` handler.
- Auth pattern in teacher APIs:
  - `getIronSession<SessionData>(cookies(), sessionOptions)`
  - `!session.isLoggedIn` → 401 JSON `{ error: "Not authenticated" }`
  - `session.role !== "TEACHER"` → 403 JSON `{ error: "Teacher access required" }`
- Teacher isolation uses `where: { teacherId: session.teacherId }` in Prisma queries.
- Shared Prisma client is imported from `@/lib/prisma`.
- Assignment model fields: `id`, `teacherId`, `studentId`, `practiceSetId`, `assignedAt`, `dueDate`, `completed`.
- The POST response serializes dates to ISO strings and returns `completed` as boolean.
- The GET `/api/teacher/students` endpoint orders by `createdAt: "desc"` and returns a wrapped array (`{ students: [...] }`).

## 5. Proposed API Shape
- **Endpoint:** `GET /api/teacher/assignments`
- **Handler location:** Add `GET` export to `app/api/teacher/assignments/route.ts`
- **Success response:** `200 OK`
  ```json
  {
    "assignments": [
      {
        "id": "string",
        "studentId": "string",
        "practiceSetId": "string",
        "assignedAt": "string (ISO 8601)",
        "dueDate": "string (ISO 8601) | null",
        "completed": false
      }
    ]
  }
  ```
- **Error responses:**
  - `401` — Not authenticated
  - `403` — Teacher access required
  - `500` — Internal server error

## 6. Minimal Response Fields
Each assignment object in the list will include exactly these fields:
- `id` — Assignment UUID
- `studentId` — Linked student UUID
- `practiceSetId` — Linked practice set UUID
- `assignedAt` — ISO string of assignment creation time
- `dueDate` — ISO string or null
- `completed` — Boolean completion status

No nested student or practice set details will be included to keep the response minimal and consistent with the existing POST response shape.

## 7. Validation and Authorization Rules
1. **Authentication:** Session must be logged in. Otherwise 401.
2. **Authorization:** Session role must be `"TEACHER"`. Otherwise 403.
3. **Teacher isolation:** Query `prisma.assignment.findMany` with `where: { teacherId: session.teacherId }`.
4. **Ordering:** Order by `assignedAt: "desc"` (most recent first).
5. **No input validation required:** GET request has no body or query parameters.

## 8. Exact Files to Modify
- `app/api/teacher/assignments/route.ts`
  - Add `GET` handler function alongside the existing `POST` handler.
  - Reuse existing imports (`NextRequest`, `NextResponse`, `getIronSession`, `cookies`, `SessionData`, `sessionOptions`, `prisma`).

## 9. Risks
- **Risk:** Accidentally breaking the existing POST handler.
  - **Mitigation:** Only add a new `GET` export; do not modify POST logic.
- **Risk:** Prisma query returns raw Date objects that are not serialized for JSON.
  - **Mitigation:** Map results explicitly, converting `assignedAt` and `dueDate` to ISO strings (same pattern as POST).

## 10. Acceptance Checklist
- [ ] `GET /api/teacher/assignments` returns 401 when called without a session
- [ ] `GET /api/teacher/assignments` returns 403 when called by a student user
- [ ] `GET /api/teacher/assignments` returns only assignments where `teacherId` matches the logged-in teacher
- [ ] Response shape is `{ assignments: [{ id, studentId, practiceSetId, assignedAt, dueDate, completed }] }`
- [ ] `assignedAt` and `dueDate` are ISO strings (or null)
- [ ] Assignments are ordered by `assignedAt` descending
- [ ] `npm run build` passes without errors
