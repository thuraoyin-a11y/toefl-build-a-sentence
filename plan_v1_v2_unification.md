# Implementation Plan: v1→v2 Core Flow Unification

## A. Stage Judgment

**Current Stage**: STABILIZATION - First Fix Task

The project has completed all feature phases (1A through 6) but has a mixed v1/v2 architecture in the core practice flow. The v2 database and APIs exist and are partially used, but critical paths still fall back to v1 mock data and localStorage. This task removes those fallbacks to establish a clean v2-only data flow.

---

## B. Files to Modify

### Core Store
1. `/store/practiceStore.ts` - Remove mock data dependencies and localStorage save

### Student Home
2. `/app/page.tsx` - Remove localStorage/config dependencies, use API for completion status

### Practice Flow
3. `/app/practice/[id]/components/PracticeClient.tsx` - Remove mock-based retry initialization

### Result Flow
4. `/app/result/[id]/page.tsx` - Remove mock record fallback
5. `/app/result/[id]/ResultPageClient.tsx` - Remove localStorage/mock dependencies
6. `/app/result/[id]/components/ResultClient.tsx` - Remove mock data dependencies

### Retry Flow
7. `/app/retry/[id]/components/RetryClient.tsx` - Use API for source attempt loading

### Teacher Config
8. `/app/teacher/page.tsx` - Remove mock config dependency
9. `/app/teacher/components/TeacherConfigClient.tsx` - Persist config properly

### API Enhancements
10. `/app/api/student/attempts/route.ts` - Add endpoint to get attempts by practice set (existing, may need enhancement)
11. `/app/api/student/attempts/sync/route.ts` - Remove after unification (optional cleanup)

### Data Layer (Cleanup)
12. `/data/mock/records.ts` - Deprecate after flow migration
13. `/data/mock/practiceSets.ts` - Deprecate after flow migration
14. `/data/mock/teacherConfig.ts` - Deprecate after flow migration

---

## C. Real Source Findings That Define the Current Broken Flow

### C1. practiceStore.ts - Dual Write Architecture
```typescript
// Lines 3-4: Imports mock data functions
import { getQuestionsForSet, getQuestionById } from "@/data/mock/practiceSets";
import { saveSetRecord, getRecordById } from "@/data/mock/records";

// Line 132: Mock fallback in startSet
const loadedQuestions = questions ?? getQuestionsForSet(setId);

// Line 149: Mock record lookup in startRetryMode
const sourceRecord = getRecordById(sourceAttemptId);

// Lines 436, 510: Dual write - saves to BOTH mock storage AND API
saveSetRecord(record);  // Mock/localStorage
fetch("/api/student/attempts", {...});  // API
```

**Problem**: Store writes to mock storage (localStorage) AND fires API call. Retry mode reads from mock storage, not database.

### C2. app/page.tsx - localStorage Completion Status
```typescript
// Lines 8-9: Mock data imports
import { teacherConfig as defaultConfig } from "@/data/mock/teacherConfig";
import { isSetCompleted, loadCompletedSets, getRecordBySetId, getMergedResultForSet } from "@/data/mock/records";

// Line 14: localStorage key for config
const CONFIG_STORAGE_KEY = "teacher-config";

// Lines 29-31: Completion status from mock, not API
function getSetStatus(setId: string): "completed" | "not_started" {
  return isSetCompleted(setId) ? "completed" : "not_started";
}

// Lines 78-82: Card display uses mock records
const lastRecord = status === "completed" ? getRecordBySetId(set.id) : null;
const mergedResult = status === "completed" ? getMergedResultForSet(set.id) : null;

// Line 231, 278-298: localStorage operations
loadCompletedSets();
const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
```

**Problem**: Student home shows completion status from localStorage, not database. Teacher config loaded from localStorage or mock default.

### C3. app/result/[id]/page.tsx - Mock Record on Server
```typescript
// Line 3: Mock import
import { getRecordBySetId } from "@/data/mock/records";

// Line 61: Server-side mock record fetch
const record = getRecordBySetId(id);
```

**Problem**: Server component uses mock data (which is empty on server, only populated in browser localStorage).

### C4. app/result/[id]/ResultPageClient.tsx - localStorage Fallback Chain
```typescript
// Line 7: Mock imports
import { getRecordById, loadCompletedSets } from "@/data/mock/records";

// Lines 38-46: Loads from localStorage first
useEffect(() => {
  loadCompletedSets();
  if (sourceAttemptId) {
    const record = getRecordById(sourceAttemptId);  // Mock lookup
    ...
  }
}, ...);

// Lines 49-86: API fetch with localStorage fallback
fetch(`/api/student/attempts?practiceSetId=${practiceSet.id}`)
  .then(res => {
    if (!res.ok) {
      console.log("Failed to fetch from API, using localStorage");  // Fallback!
      return null;
    }
    ...
  })
```

**Problem**: Result page has fallback chain: localStorage → API → localStorage. Should be API only.

### C5. app/result/[id]/components/ResultClient.tsx - Mock Question Loading
```typescript
// Lines 9-10: Mock imports
import { getQuestionsForSet } from "@/data/mock/practiceSets";
import { getRecordBySetId, loadCompletedSets, ... } from "@/data/mock/records";

// Line 22: Questions from mock
const questions = getQuestionsForSet(practiceSet.id);

// Lines 27-36: localStorage load in useEffect
useEffect(() => {
  loadCompletedSets();
  if (!serverRecord && !isRetryMode) {
    const record = getRecordBySetId(practiceSet.id);  // Mock lookup
    ...
  }
}, ...);

// Line 107: Merged result from mock
const mergedResult = getMergedResultForSet(practiceSet.id);
```

**Problem**: Questions loaded from mock data. Merged results from localStorage.

### C6. app/retry/[id]/components/RetryClient.tsx - Mock-Based Retry
```typescript
// Line 11: Mock imports
import { getRecordById, saveRetryResult, mergeRetryResult } from "@/data/mock/records";

// Line 66: Source record from mock
const sourceRecord = getRecordById(sourceRecordId);

// Lines 138-140: Save to mock
const merged = saveRetryResult(sourceRecordId, answers);
```

**Problem**: Retry mode loads source attempt from mock storage, not database.

### C7. app/teacher/page.tsx - Mock Config
```typescript
// Line 4: Mock import
import { teacherConfig } from "@/data/mock/teacherConfig";

// Line 37: Passes mock to client
<TeacherConfigClient initialConfig={teacherConfig} />
```

**Problem**: Teacher config always starts with mock data, no persistence.

---

## D. Minimal Implementation Strategy

### D1. Principle: Remove, Don't Replace
- Remove localStorage reads/writes entirely
- Remove mock data imports and function calls
- Keep existing v2 API calls that are already in place
- Where v2 API is missing, add minimal endpoint

### D2. Data Flow After Unification

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Student Home  │────▶│ GET /api/student │────▶│  Assignment +   │
│   (app/page.tsx)│     │    /assignments  │     │  Attempt status │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Practice Page  │────▶│ GET /api/practice│────▶│  SampleItem     │
│(practice/[id])  │     │    -sets/[id]    │     │  questions      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Submit Set    │────▶│ POST /api/student│────▶│ PracticeAttempt │
│(practiceStore.ts│     │    /attempts     │     │  record (DB)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Result Page   │────▶│ GET /api/student │────▶│  Attempt data   │
│(result/[id])    │     │/attempts?setId=x │     │  (DB only)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Retry Mode    │────▶│ GET /api/student │────▶│  Source attempt │
│(retry/[id])     │     │/attempts?id=x    │     │  (DB only)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### D3. Required API Additions

1. **GET /api/student/attempts** (enhancement)
   - Add `?sourceAttemptId=x` parameter for retry source lookup
   - Add `?includeWrongItems=true` for retry question loading

2. **Teacher Config API** (new)
   - `GET /api/teacher/config` - Returns teacher's config
   - `POST /api/teacher/config` - Updates teacher's config
   - Store in new `TeacherConfig` table or add columns to `Teacher` table

---

## E. Exact Implementation Order

### Phase 1: practiceStore.ts Cleanup
**Goal**: Remove mock data dependencies from the store

1. Remove imports from `@/data/mock/practiceSets` and `@/data/mock/records`
2. Modify `startSet()`: Remove fallback to `getQuestionsForSet()`, require questions parameter
3. Modify `startRetryMode()`: Change from mock record lookup to API call
   - Call `GET /api/student/attempts?sourceAttemptId=x`
   - Parse wrongItemIds from response
   - Filter questions parameter by wrongItemIds
4. Modify `submitCompleteSet()`: Remove `saveSetRecord()` call, keep only API call
5. Modify `submitRetrySet()`: Remove `saveSetRecord()` call, keep only API call
6. Update store types to include `sourceAttemptDbId` for database ID tracking

### Phase 2: Student Home (app/page.tsx)
**Goal**: Remove localStorage, use API for completion status

1. Remove imports from `@/data/mock/teacherConfig` and `@/data/mock/records`
2. Remove `CONFIG_STORAGE_KEY` constant
3. Add state for `completionStatus` Map<setId, {completed: boolean, attempt: Attempt}>
4. Fetch completion status via API (new endpoint or enhance assignments)
5. Update `getSetStatus()` to use API data instead of mock
6. Update card display to use API data for scores/retry buttons
7. Remove `loadCompletedSets()` and localStorage sync logic

### Phase 3: Result Pages
**Goal**: Remove localStorage/mock from result display

1. **ResultPageClient.tsx**:
   - Remove `loadCompletedSets()` and `getRecordById` imports
   - Remove localStorage fallback in fetch error handler
   - Always fetch from API, show loading/error states

2. **ResultClient.tsx**:
   - Remove mock imports
   - Accept `questions` as prop from server (already available)
   - Remove `getMergedResultForSet` usage - calculate on server or client from API data
   - Remove `loadCompletedSets` useEffect

3. **app/result/[id]/page.tsx**:
   - Remove `getRecordBySetId` import
   - Remove server-side mock record fetch
   - Pass only practiceSet to client, let client fetch attempt

### Phase 4: Retry Flow
**Goal**: Use API for source attempt loading

1. **RetryClient.tsx**:
   - Remove mock imports
   - Fetch source attempt via API: `GET /api/student/attempts?id=x`
   - Parse `wrongItems` from API response to get question IDs
   - Filter questions prop by wrong question IDs
   - On complete, call API directly (already done), remove `saveRetryResult`
   - Navigate to result page with DB attempt ID

### Phase 5: Teacher Config
**Goal**: Proper config persistence

1. Add config columns to `Teacher` table (or create `TeacherConfig` table)
2. Create `GET/POST /api/teacher/config` endpoints
3. Update `TeacherConfigClient` to fetch/save via API
4. Update `app/teacher/page.tsx` to fetch config server-side or let client fetch

### Phase 6: Cleanup
**Goal**: Remove dead code

1. Mark mock data files as deprecated (don't delete yet - may be needed for migration)
2. Remove localStorage sync API if no longer needed
3. Update types if needed to align with API responses

---

## F. Risks

### F1. Retry Mode Source Attempt ID Mismatch
**Risk**: Retry mode uses `sourceAttemptId` from URL query param. Currently this is the mock record ID. After unification, it must be the database PracticeAttempt ID.

**Mitigation**: 
- Update result page to pass DB attempt ID in retry link
- Update practiceStore to track `sourceAttemptDbId` separately from mock record ID
- During transition, support both ID types in API

### F2. Teacher Config Data Loss
**Risk**: Teacher config currently stored in localStorage will be lost.

**Mitigation**:
- This is acceptable - config was mock data anyway
- Implement proper config persistence in database

### F3. Existing localStorage Data Orphaned
**Risk**: Students with attempts in localStorage will lose that history.

**Mitigation**:
- This is intentional - unification requires single source of truth
- The sync API currently clears localStorage when DB has attempts
- Accept data loss for pre-unification attempts

### F4. Result Page Loading States
**Risk**: Removing localStorage fallback means result page may show loading state longer.

**Mitigation**:
- Add proper loading UI
- Consider server-side fetch of attempt data if performance is issue

### F5. Circular Dependencies
**Risk**: practiceStore imports from components that import from store.

**Mitigation**:
- Move API calls out of store to component level, or
- Create separate API layer (`lib/api/student.ts`)

---

## G. Verification Plan

### G1. Unit Test Points

1. **practiceStore**
   - `startSet()` rejects when questions not provided
   - `startRetryMode()` fetches from API correctly
   - `submitCompleteSet()` calls API, no localStorage
   - `submitRetrySet()` calls API with correct payload

2. **API Endpoints**
   - `GET /api/student/attempts?practiceSetId=x` returns latest attempt
   - `GET /api/student/attempts?sourceAttemptId=x` returns source for retry
   - `POST /api/student/attempts` creates attempt, returns DB ID

### G2. Integration Test Flows

| Flow | Steps | Expected Result |
|------|-------|-----------------|
| Full Practice | Login → Home → Practice → Submit → Result | All data from DB, no localStorage |
| Retry Flow | Complete set → Click Retry → Submit → Result | Wrong questions loaded from DB attempt |
| Refresh Result | Complete → Go to result → Refresh | Result loads from DB, not localStorage |
| Multi-device | Complete on Device A → View on Device B | Result visible on B (DB source of truth) |
| Teacher View | Student completes → Teacher views student detail | Attempt appears in teacher view |

### G3. Manual Verification Checklist

- [ ] Student home shows correct completion status (not from localStorage)
- [ ] Practice page loads questions from API
- [ ] Submit practice saves to DB only
- [ ] Result page shows data without localStorage fallback
- [ ] Retry mode loads wrong questions from DB attempt
- [ ] Retry submit updates DB
- [ ] Teacher can see student attempts after unification
- [ ] No localStorage keys created for practice data
- [ ] No mock data functions called in production flow

### G4. Debug Indicators to Check

Search for these patterns (should be 0 occurrences after fix):
```
localStorage.getItem("completed-sets")
localStorage.setItem("completed-sets"
loadCompletedSets(
saveSetRecord(
getRecordById(
getRecordBySetId(
getQuestionsForSet(
```

---

## H. Continuation Summary

### What This Task Achieves
1. Removes all localStorage dependencies from core practice flow
2. Removes all mock data dependencies from core practice flow
3. Establishes database as single source of truth for attempts
4. Enables teacher visibility into all student attempts
5. Enables cross-device result viewing for students

### What Remains After This Task
- Mock data files still exist in `/data/mock/` (can be removed in cleanup task)
- PostgreSQL migration (not in scope)
- Deployment preparation (not in scope)
- Tag system (not in scope)

### Next Tasks (If Any)
1. **Mock Data Cleanup**: Delete `/data/mock/` files after verification
2. **PostgreSQL Migration**: Switch from SQLite to PostgreSQL
3. **Deployment**: Build, test, and deploy

### Success Criteria
- [ ] No localStorage operations in practice/result/retry flows
- [ ] No mock data imports in core flow files
- [ ] All attempt data persisted to and read from database
- [ ] Teacher can view all student attempts in real-time
- [ ] Student can view results on any device
- [ ] Retry mode works with database source attempts

---

## Appendix: File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `store/practiceStore.ts` | Major refactor | Remove mock/localStorage, API-only |
| `app/page.tsx` | Major refactor | API-based completion status |
| `app/practice/[id]/components/PracticeClient.tsx` | Minor update | Pass DB ID for retry |
| `app/result/[id]/page.tsx` | Simplification | Remove mock record fetch |
| `app/result/[id]/ResultPageClient.tsx` | Major refactor | API-only data loading |
| `app/result/[id]/components/ResultClient.tsx` | Major refactor | Remove mock dependencies |
| `app/retry/[id]/components/RetryClient.tsx` | Major refactor | API-based retry source |
| `app/teacher/page.tsx` | Minor update | Remove mock config |
| `app/api/student/attempts/route.ts` | Enhancement | Add query parameters |
| `app/api/teacher/config/route.ts` | New file | Config persistence |
| `prisma/schema.prisma` | Migration | Add TeacherConfig table |

